/**
 * DPT-PROVIDER-005 — OpenCode Provider Adapter
 *
 * Wraps the proven 004.B–004.G OpenCode implementation behind the
 * provider-neutral contract interface.
 *
 * OpenCode becomes the FIRST conforming provider.
 */

import {
  CONTRACT_VERSION, EVENT_TYPE, EVIDENCE_TYPE, EVIDENCE_AUTHORITY,
  AUTHORITY_MODE, DOMAIN, ROLE, CAPABILITY_LEVEL,
} from "../contract/provider-contract.mjs";
import { createCapabilityDescriptor } from "../contract/capability-descriptor.mjs";
import { createEvent, createEvidence, EVENT_TYPE as EVT } from "./event-model.mjs";
import { EventBridge } from "./event-bridge.mjs";
import { createEnvelope, ROLE_DEFAULTS, generatePermissions } from "./permission-envelope.mjs";
import { materialize, validateMaterialized } from "./permission-materializer.mjs";
import { createRehydrationRecord, advanceRecord, createRecoveryRecord, validateRecord } from "./rehydration-record.mjs";
import { createContextReceipt, receiptHash, compareReceipts, validateRehydration } from "./context-receipt.mjs";
import { normalizePromptResponse, normalizeSessionCreated, normalizeFailure } from "./sdk-normalizer.mjs";
import { createOpencode } from "@opencode-ai/sdk";
import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

// ─── Capability Descriptor ──────────────────────────────────────────

export const OPENCODE_DESCRIPTOR = createCapabilityDescriptor({
  provider_id: "opencode",
  provider_name: "OpenCode Provider",
  adapter_version: "0.1.0",
  contract_version: CONTRACT_VERSION,
  capabilities: {
    // Required — all SUPPORTED
    identity_correlation: CAPABILITY_LEVEL.SUPPORTED,
    event_production: CAPABILITY_LEVEL.SUPPORTED,
    evidence_recording: CAPABILITY_LEVEL.SUPPORTED,
    authority_enforcement: CAPABILITY_LEVEL.SUPPORTED,
    permission_envelope: CAPABILITY_LEVEL.SUPPORTED,
    failure_reporting: CAPABILITY_LEVEL.SUPPORTED,
    recovery_state: CAPABILITY_LEVEL.SUPPORTED,
    completion_idempotency: CAPABILITY_LEVEL.SUPPORTED,
    cross_wo_isolation: CAPABILITY_LEVEL.SUPPORTED,
    human_gate_preservation: CAPABILITY_LEVEL.SUPPORTED,

    // Optional
    native_event_stream: CAPABILITY_LEVEL.PARTIAL,
    session_recovery: CAPABILITY_LEVEL.SUPPORTED,
    subagent_isolation: CAPABILITY_LEVEL.SUPPORTED,
    dynamic_permission_materialization: CAPABILITY_LEVEL.SUPPORTED,
    capability_plane: CAPABILITY_LEVEL.SUPPORTED,
    abort_support: CAPABILITY_LEVEL.PARTIAL,
    restart_support: CAPABILITY_LEVEL.SUPPORTED,
    cleanup_support: CAPABILITY_LEVEL.PARTIAL,
    health_check: CAPABILITY_LEVEL.PARTIAL,
    structured_results: CAPABILITY_LEVEL.SUPPORTED,
    provider_config_materialization: CAPABILITY_LEVEL.SUPPORTED,
  },
  metadata: {
    note: "OpenCode adapter — event.subscribe returns empty stream (PARTIAL native_event_stream)",
    sdk_event_coverage: "MINIMAL",
  },
});

// ─── OpenCode Adapter ───────────────────────────────────────────────

export class OpenCodeAdapter {
  constructor({ state_dir } = {}) {
    this.state_dir = state_dir ?? join(import.meta.dirname, ".dpt-opencode-conformance-state");
    this.bridges = new Map();
    this.envelopes = new Map();
    this.rehydration_records = new Map();
    this.context_receipts = new Map();
    this.running = false;
    this.runtime = null;
    this.runtime_config = null;
    this.event_subscription = null;
  }

  get descriptor() { return OPENCODE_DESCRIPTOR; }

  _key(task_id, work_order_id) { return `${task_id}:${work_order_id}`; }

  _getBridge(task_id, work_order_id) {
    const key = this._key(task_id, work_order_id);
    if (!this.bridges.has(key)) {
      this.bridges.set(key, new EventBridge({
        task_id, work_order_id, state_dir: this.state_dir,
      }));
    }
    return this.bridges.get(key);
  }

  // ── Runtime ──

  async start(config = {}) {
    if (this.running) {
      return this.runtime_handle;
    }

    const materialized = config.envelope
      ? this.materializeEnvelope(config.envelope, config.materializer_context ?? {})
      : config.config;

    // Preserve the provider-contract conformance mode, which exercises the
    // logical adapter lifecycle without starting an external process.
    if (!materialized) {
      this.running = true;
      this.runtime_handle = {
        provider_id: "opencode",
        started_at: new Date().toISOString(),
        runtime_identifier: null,
        config: null,
      };
      return this.runtime_handle;
    }

    const validation = validateMaterialized(materialized);
    if (!validation.valid) {
      throw new Error(`Invalid materialized OpenCode config: ${validation.errors.join(", ")}`);
    }

    this.runtime_config = materialized;
    this.runtime = await createOpencode({
      hostname: config.hostname ?? "127.0.0.1",
      port: config.port ?? 0,
      timeout: config.timeout ?? 30000,
      config: materialized,
    });
    this.running = true;
    this.runtime_handle = {
      provider_id: "opencode",
      started_at: new Date().toISOString(),
      runtime_identifier: this.runtime.server.url,
      config: materialized,
    };
    return this.runtime_handle;
  }

  async stop() {
    this.event_subscription?.controller?.abort();
    this.event_subscription = null;
    if (this.runtime?.server) {
      this.runtime.server.close();
    }
    this.runtime = null;
    this.runtime_config = null;
    this.runtime_handle = null;
    this.running = false;
  }

  get runtimeClient() {
    if (!this.runtime) throw new Error("OpenCode runtime is not started");
    return this.runtime.client;
  }

  get runtimeServer() {
    if (!this.runtime) throw new Error("OpenCode runtime is not started");
    return this.runtime.server;
  }

  async subscribeToEvents({ onEvent, onError } = {}) {
    const client = this.runtimeClient;
    const controller = new AbortController();
    let resolveReady;
    let rejectReady;
    const ready = new Promise((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    const subscription = await client.event.subscribe({
      signal: controller.signal,
      sseMaxRetryAttempts: 1,
      onSseError: (error) => {
        rejectReady(error);
        onError?.(error);
      },
    });
    this.event_subscription = { controller, subscription, ready };

    (async () => {
      try {
        for await (const event of subscription.stream) {
          if (event?.type === "server.connected") resolveReady(event);
          onEvent?.(event);
        }
        if (!controller.signal.aborted) {
          rejectReady(new Error("OpenCode event stream ended before connection"));
        }
      } catch (error) {
        rejectReady(error);
        if (!controller.signal.aborted) onError?.(error);
      }
    })();

    return { controller, subscription, ready };
  }

  // ── Session ──

  async createSession(work_order) {
    const bridge = this._getBridge(work_order.task_id, work_order.work_order_id);
    const session_id = this.runtime
      ? (await this.runtime.client.session.create({
          body: { title: work_order.title ?? work_order.work_order_id },
        })).data.id
      : `oc-ses-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const evt = normalizeSessionCreated({
      session_id,
      task_id: work_order.task_id,
      work_order_id: work_order.work_order_id,
    });
    bridge.ingest({ events: [evt.event], evidence: [evt.evidence] });
    return session_id;
  }

  // ── Permission ──

  registerEnvelope(task_id, work_order_id, envelope) {
    this.envelopes.set(this._key(task_id, work_order_id), envelope);
  }

  materializeEnvelope(envelope, context = {}) {
    return materialize(envelope, context);
  }

  validateAuthority(task_id, work_order_id, role) {
    const envelope = this.envelopes.get(this._key(task_id, work_order_id));
    if (!envelope) return { authorized: false, reason: "NO_ENVELOPE" };
    if (role && envelope.role !== role) return { authorized: false, reason: "ROLE_MISMATCH" };
    return { authorized: true, reason: "OK", envelope };
  }

  // ── Execution ──

  async execute(session_id, prompt, { task_id, work_order_id, attempt_id = 1 } = {}) {
    const bridge = this._getBridge(task_id, work_order_id);
    const response = this.runtime
      ? await this.runtime.client.session.prompt({
          path: { id: session_id },
          body: { parts: [{ type: "text", text: prompt }] },
        })
      : {
          data: {
            info: { id: session_id, modelID: "test-model", providerID: "test-provider" },
            parts: [
              { type: "step-start" },
              { type: "text", text: '{"status":"PASS","proof":"CONFORMANCE"}' },
              { type: "step-finish", reason: "stop" },
            ],
          },
        };
    const normalized = normalizePromptResponse({
      response: response.data,
      task_id,
      work_order_id,
      attempt_id,
      provider_session_id: session_id,
    });
    bridge.ingest(normalized);
    return { status: "SUCCESS", structured_result: normalized, response: response.data };
  }

  async abortSession(session_id) {
    if (!this.runtime) return;
    await this.runtime.client.session.abort({ path: { id: session_id } });
  }

  // ── Evidence ──

  reportEvidence(task_id, work_order_id, { evidence_type, payload, actor }) {
    const bridge = this._getBridge(task_id, work_order_id);

    const evidence = createEvidence({
      evidence_type,
      authority: EVIDENCE_AUTHORITY.CLAIM,
      task_id, work_order_id,
      actor: actor ?? "opencode-worker",
      payload,
    });

    const event = createEvent({
      event_type: EVENT_TYPE.TOOL_COMPLETED,
      task_id, work_order_id,
      actor: actor ?? "opencode-worker",
      normalized_payload: { tool_name: "report_evidence", evidence_type },
      evidence_refs: [evidence.evidence_id],
    });

    bridge.ingest({ events: [event], evidence: [evidence] });
    return { evidence_id: evidence.evidence_id, authority: "CLAIM" };
  }

  // ── Recovery ──

  registerRehydrationRecord(task_id, work_order_id, record) {
    this.rehydration_records.set(this._key(task_id, work_order_id), record);
  }

  createRecoveryRecord(original, reason) {
    return createRecoveryRecord(original, {
      recovery_reason: reason,
      new_provider_session_id: `oc-recovered-${Date.now()}`,
    });
  }

  // ── Health ──

  async healthCheck() {
    return { healthy: this.running, ready: this.running, details: { provider: "opencode" } };
  }
}

export function createOpenCodeAdapter(config = {}) {
  return new OpenCodeAdapter(config);
}
