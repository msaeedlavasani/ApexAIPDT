/**
 * DPT-PROVIDER-005 — Reference Provider Adapter (Mock)
 *
 * Implements the provider-neutral contract WITHOUT importing any OpenCode code.
 * Proves the contract and conformance suite are not accidentally coupled
 * to OpenCode.
 *
 * This adapter simulates a hypothetical "Provider X" — it does not call
 * any real external service.
 */

import {
  CONTRACT_VERSION, EVENT_TYPE, EVIDENCE_TYPE, EVIDENCE_AUTHORITY,
  AUTHORITY_MODE, DOMAIN, ROLE, CAPABILITY_LEVEL,
} from "../contract/provider-contract.mjs";
import { createCapabilityDescriptor } from "../contract/capability-descriptor.mjs";

// ─── Local Event/Evidence Factories (no OpenCode dependency) ────────

let _seq = 0;

function createEvent({ event_type, task_id, work_order_id, actor = "ref-adapter",
  role = null, provider_session_id = null, execution_phase = null, status = null,
  normalized_payload = null, evidence_refs = [], recovery_generation = 1 }) {
  return {
    event_version: "0.1.0", event_id: `ref-evt-${Date.now()}-${++_seq}`,
    timestamp: new Date().toISOString(), sequence: _seq,
    task_id, work_order_id, attempt_id: 1, actor, role,
    provider_adapter: "reference-provider-x", provider_session_id,
    event_type, execution_phase, status, raw_event_reference: null,
    normalized_payload, evidence_refs, correlation_id: null, causation_id: null,
    recovery_generation,
  };
}

function createEvidence({ evidence_type, authority = EVIDENCE_AUTHORITY.CLAIM,
  task_id, work_order_id, actor = "ref-adapter", payload = {} }) {
  return {
    evidence_version: "0.1.0", evidence_id: `ref-evd-${Date.now()}-${++_seq}`,
    evidence_type, authority, task_id, work_order_id, attempt_id: 1,
    actor, provider_session_id: null, source_event_id: null,
    timestamp: new Date().toISOString(), payload,
  };
}

// ─── Capability Descriptor ──────────────────────────────────────────

export const REFERENCE_DESCRIPTOR = createCapabilityDescriptor({
  provider_id: "reference-provider-x",
  provider_name: "Reference Provider X (Mock)",
  adapter_version: "0.1.0",
  contract_version: CONTRACT_VERSION,
  capabilities: {
    // Required
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

    // Optional — this mock supports some
    native_event_stream: CAPABILITY_LEVEL.UNSUPPORTED,
    session_recovery: CAPABILITY_LEVEL.SUPPORTED,
    subagent_isolation: CAPABILITY_LEVEL.SUPPORTED,
    dynamic_permission_materialization: CAPABILITY_LEVEL.UNSUPPORTED,
    capability_plane: CAPABILITY_LEVEL.SUPPORTED,
    abort_support: CAPABILITY_LEVEL.PARTIAL,
    restart_support: CAPABILITY_LEVEL.SUPPORTED,
    cleanup_support: CAPABILITY_LEVEL.SUPPORTED,
    health_check: CAPABILITY_LEVEL.SUPPORTED,
    structured_results: CAPABILITY_LEVEL.SUPPORTED,
    provider_config_materialization: CAPABILITY_LEVEL.UNSUPPORTED,
  },
  metadata: {
    note: "Mock adapter for contract validation — does not call any real provider",
  },
});

// ─── Event Bridge (Minimal In-Memory) ──────────────────────────────

class MockEventBridge {
  constructor({ task_id, work_order_id }) {
    this.task_id = task_id;
    this.work_order_id = work_order_id;
    this.events = [];
    this.evidence = [];
    this.seen_hashes = new Set();
    this.sequence = 0;
    this.completion_emitted = false;
  }

  ingest({ events = [], evidence = [] } = {}) {
    let events_added = 0;
    let evidence_added = 0;

    for (const evt of events) {
      const hash = `${evt.event_type}:${evt.task_id}:${evt.work_order_id}`;
      if (!this.seen_hashes.has(hash)) {
        this.seen_hashes.add(hash);
        this.events.push({ ...evt, _dpt_sequence: ++this.sequence });
        events_added++;
      }
    }

    for (const evd of evidence) {
      const hash = `${evd.evidence_type}:${evd.task_id}:${evd.work_order_id}:${evd.actor}`;
      if (!this.seen_hashes.has(hash)) {
        this.seen_hashes.add(hash);
        this.evidence.push(evd);
        evidence_added++;
      }
    }

    return { events_added, evidence_added, duplicates_skipped: 0 };
  }

  emitCompletion({ status = "PASS", result_summary = null } = {}) {
    if (this.completion_emitted) return { emitted: false };
    const evt = createEvent({
      event_type: EVENT_TYPE.WORK_ORDER_COMPLETED,
      task_id: this.task_id,
      work_order_id: this.work_order_id,
      execution_phase: "COMPLETE",
      status,
      normalized_payload: { result_summary },
    });
    this.events.push({ ...evt, _dpt_sequence: ++this.sequence });
    this.completion_emitted = true;
    return { emitted: true, event: evt };
  }

  getEvents() { return [...this.events].sort((a, b) => a._dpt_sequence - b._dpt_sequence); }
  getEvidence() { return [...this.evidence]; }

  reconstruct() {
    const ordered = this.getEvents();
    return {
      task_id: this.task_id,
      work_order_id: this.work_order_id,
      total_events: ordered.length,
      total_evidence: this.evidence.length,
      event_types: [...new Set(ordered.map(e => e.event_type))],
      evidence_types: [...new Set(this.evidence.map(e => e.evidence_type))],
      tool_calls: ordered.filter(e => e.event_type === "TOOL_COMPLETED" || e.event_type === "TOOL_REQUESTED")
        .map(e => ({ tool: e.normalized_payload?.tool_name, state: e.normalized_payload?.tool_state })),
      provider_sessions: [...new Set(ordered.map(e => e.provider_session_id).filter(Boolean))],
      has_failure: ordered.some(e => e.event_type === "FAILURE_OBSERVED"),
      has_completion: ordered.some(e => e.event_type === "WORK_ORDER_COMPLETED"),
      recovery_generations: [...new Set(ordered.map(e => e.recovery_generation))],
    };
  }
}

// ─── Reference Adapter ──────────────────────────────────────────────

export class ReferenceAdapter {
  constructor() {
    this.sessions = new Map();
    this.bridges = new Map();
    this.envelopes = new Map();
    this.rehydration_records = new Map();
    this.running = false;
  }

  get descriptor() { return REFERENCE_DESCRIPTOR; }

  // ── Runtime ──

  async start(config = {}) {
    this.running = true;
    return { provider_id: "reference-provider-x", started_at: new Date().toISOString() };
  }

  async stop() {
    this.running = false;
  }

  // ── Session ──

  async createSession(work_order) {
    const session_id = `ref-ses-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.sessions.set(session_id, {
      work_order,
      created_at: new Date().toISOString(),
      status: "active",
    });

    const bridge = new MockEventBridge({
      task_id: work_order.task_id,
      work_order_id: work_order.work_order_id,
    });

    const sessionEvent = createEvent({
      event_type: EVENT_TYPE.SESSION_CREATED,
      task_id: work_order.task_id,
      work_order_id: work_order.work_order_id,
      provider_session_id: session_id,
    });
    bridge.ingest({ events: [sessionEvent] });

    this.bridges.set(`${work_order.task_id}:${work_order.work_order_id}`, bridge);
    return session_id;
  }

  // ── Permission ──

  registerEnvelope(task_id, work_order_id, envelope) {
    this.envelopes.set(`${task_id}:${work_order_id}`, envelope);
  }

  validateAuthority(task_id, work_order_id, role) {
    const envelope = this.envelopes.get(`${task_id}:${work_order_id}`);
    if (!envelope) return { authorized: false, reason: "NO_ENVELOPE" };
    if (role && envelope.role !== role) return { authorized: false, reason: "ROLE_MISMATCH" };
    return { authorized: true, reason: "OK", envelope };
  }

  // ── Execution ──

  async execute(session_id, prompt) {
    const session = this.sessions.get(session_id);
    if (!session) throw new Error("Session not found");

    const bridge = this.bridges.get(
      `${session.work_order.task_id}:${session.work_order.work_order_id}`
    );

    const execEvent = createEvent({
      event_type: EVENT_TYPE.EXECUTION_STARTED,
      task_id: session.work_order.task_id,
      work_order_id: session.work_order.work_order_id,
      provider_session_id: session_id,
      execution_phase: "EXECUTING",
    });

    const execEvidence = createEvidence({
      evidence_type: EVIDENCE_TYPE.SESSION_EVIDENCE,
      authority: EVIDENCE_AUTHORITY.INDEPENDENTLY_VERIFIED,
      task_id: session.work_order.task_id,
      work_order_id: session.work_order.work_order_id,
      actor: "reference-adapter",
      provider_session_id: session_id,
      payload: { session_id, prompt },
    });

    bridge.ingest({ events: [execEvent], evidence: [execEvidence] });

    return {
      status: "SUCCESS",
      structured_result: { output: "Reference provider execution complete" },
      evidence_type: "SESSION_EVIDENCE",
    };
  }

  // ── Evidence ──

  reportEvidence(task_id, work_order_id, { evidence_type, payload, actor }) {
    const bridge = this.bridges.get(`${task_id}:${work_order_id}`);
    if (!bridge) throw new Error("No bridge for task/work_order");

    const evidence = createEvidence({
      evidence_type,
      authority: EVIDENCE_AUTHORITY.CLAIM,
      task_id,
      work_order_id,
      actor: actor ?? "reference-worker",
      payload,
    });

    const event = createEvent({
      event_type: EVENT_TYPE.TOOL_COMPLETED,
      task_id,
      work_order_id,
      actor: actor ?? "reference-worker",
      normalized_payload: { tool_name: "report_evidence", evidence_type },
      evidence_refs: [evidence.evidence_id],
    });

    bridge.ingest({ events: [event], evidence: [evidence] });
    return { evidence_id: evidence.evidence_id, authority: "CLAIM" };
  }

  // ── Recovery ──

  createRecoveryRecord(original, reason) {
    return {
      ...original,
      recovery_generation: original.recovery_generation + 1,
      timestamps: {
        ...original.timestamps,
        recovered_at: new Date().toISOString(),
      },
      metadata: { recovery_reason: reason },
    };
  }

  // ── Health ──

  async healthCheck() {
    return { healthy: this.running, ready: this.running, details: { provider: "reference-provider-x" } };
  }
}

// ─── Create Adapter Instance ────────────────────────────────────────

export function createReferenceAdapter() {
  return new ReferenceAdapter();
}
