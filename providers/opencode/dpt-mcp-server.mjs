/**
 * DPT-PROVIDER-004.F — DPT MCP Capability Server
 *
 * Provider-neutral MCP server exposing bounded DPT capabilities.
 * Transport: JSON-RPC 2.0 over stdio (MCP standard).
 * No external dependencies — pure Node.js built-ins.
 *
 * Architecture:
 *   DPT → OpenCode: SDK = Control Plane
 *   OpenCode → DPT: MCP = Capability Plane
 *
 * MCP is a capability transport, NOT an authority source.
 * Every call validated against existing DPT durable state.
 */

import { createEvent, createEvidence, EVENT_TYPE, EVIDENCE_TYPE, EVIDENCE_AUTHORITY } from "./event-model.mjs";
import { EventBridge } from "./event-bridge.mjs";
import { createRehydrationRecord, advanceRecord, createRecoveryRecord, persistRecord, loadRecord, validateRecord } from "./rehydration-record.mjs";
import { createContextReceipt, receiptHash, compareReceipts, validateRehydration } from "./context-receipt.mjs";
import { createEnvelope, ROLE, AUTHORITY_MODE } from "./permission-envelope.mjs";
import { createInterface } from "readline";
import { randomUUID } from "crypto";

const MCP_VERSION = "2024-11-05";
const SERVER_NAME = "dpt-mcp-server";
const SERVER_VERSION = "0.1.0";

// ─── Tool Definitions ───────────────────────────────────────────────

const DPT_TOOLS = [
  {
    name: "get_task_context",
    description: "Retrieve authorized task and work-order context for the calling agent. Returns task passport, work order, and role-bound context. Fails closed on identity mismatch.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "DPT task identifier" },
        work_order_id: { type: "string", description: "DPT work order identifier" },
        attempt_id: { type: "number", description: "Execution attempt number", default: 1 },
      },
      required: ["task_id", "work_order_id"],
    },
  },
  {
    name: "get_work_order",
    description: "Retrieve work order details including scope, deliverables, acceptance criteria, and role. Read-only — does not grant authority.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        work_order_id: { type: "string" },
      },
      required: ["task_id", "work_order_id"],
    },
  },
  {
    name: "get_permission_envelope",
    description: "Retrieve the permission envelope for the calling agent's work order. Read-only — shows what is authorized, cannot expand.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        work_order_id: { type: "string" },
      },
      required: ["task_id", "work_order_id"],
    },
  },
  {
    name: "report_evidence",
    description: "Record MCP-originated evidence. Authority is always CLAIM (worker self-report) — MCP transport does NOT upgrade authority.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        work_order_id: { type: "string" },
        evidence_type: { type: "string", enum: Object.values(EVIDENCE_TYPE) },
        payload: { type: "object", description: "Evidence payload" },
        actor: { type: "string", description: "Reporting actor identifier" },
        role: { type: "string", description: "Actor role" },
      },
      required: ["task_id", "work_order_id", "evidence_type", "payload"],
    },
  },
  {
    name: "report_result",
    description: "Record a structured result for the work order. Creates RESULT_RECEIVED event and RESULT_EVIDENCE (CLAIM authority).",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        work_order_id: { type: "string" },
        result_summary: { type: "string", description: "Human-readable result summary" },
        result_data: { type: "object", description: "Structured result data" },
        actor: { type: "string" },
        role: { type: "string" },
      },
      required: ["task_id", "work_order_id", "result_summary"],
    },
  },
  {
    name: "report_failure",
    description: "Record a controlled failure. Creates FAILURE_OBSERVED event. Failure class and disposition are separated — MCP cannot dictate disposition.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        work_order_id: { type: "string" },
        failure_class: { type: "string", enum: ["TIMEOUT", "AUTHORITATIVE_REJECTION", "DEPENDENCY_FAILURE", "CONSTRAINT_VIOLATION", "PROVIDER_ERROR", "UNKNOWN"], description: "Classification of failure" },
        error_message: { type: "string" },
        error_details: { type: "object" },
        actor: { type: "string" },
        role: { type: "string" },
      },
      required: ["task_id", "work_order_id", "failure_class", "error_message"],
    },
  },
  {
    name: "request_review",
    description: "Request independent review. Creates REVIEW_REQUESTED event. Does not grant review authority — review must come from an authorized reviewer role.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        work_order_id: { type: "string" },
        review_type: { type: "string", enum: ["CODE_REVIEW", "ARCHITECTURE_REVIEW", "SECURITY_REVIEW", "INTEGRATION_REVIEW"], description: "Type of review requested" },
        scope: { type: "string", description: "What should be reviewed" },
        actor: { type: "string" },
        role: { type: "string" },
      },
      required: ["task_id", "work_order_id", "review_type"],
    },
  },
  {
    name: "get_execution_state",
    description: "Query current execution state from DPT durable records. Returns reconstruction from EventBridge + rehydration status.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        work_order_id: { type: "string" },
      },
      required: ["task_id", "work_order_id"],
    },
  },
];

// ─── DPT Durable State Store ────────────────────────────────────────

export class DPTStateStore {
  constructor({ state_dir }) {
    this.state_dir = state_dir;
    this.bridges = new Map();       // task_id:work_order_id → EventBridge
    this.rehydration = new Map();   // task_id:work_order_id → RehydrationRecord
    this.envelopes = new Map();     // task_id:work_order_id → PermissionEnvelope
    this.work_orders = new Map();   // work_order_id → WorkOrderDefinition
    this.context_receipts = new Map(); // task_id:work_order_id → ContextReceipt
  }

  getBridgeKey(task_id, work_order_id) {
    return `${task_id}:${work_order_id}`;
  }

  getBridge(task_id, work_order_id) {
    const key = this.getBridgeKey(task_id, work_order_id);
    if (!this.bridges.has(key)) {
      this.bridges.set(key, new EventBridge({
        task_id,
        work_order_id,
        state_dir: this.state_dir,
      }));
    }
    return this.bridges.get(key);
  }

  registerWorkOrder(work_order_id, definition) {
    this.work_orders.set(work_order_id, definition);
  }

  registerEnvelope(task_id, work_order_id, envelope) {
    this.envelopes.set(this.getBridgeKey(task_id, work_order_id), envelope);
  }

  registerRehydrationRecord(task_id, work_order_id, record) {
    this.rehydration.set(this.getBridgeKey(task_id, work_order_id), record);
  }

  registerContextReceipt(task_id, work_order_id, receipt) {
    this.context_receipts.set(this.getBridgeKey(task_id, work_order_id), receipt);
  }

  getEnvelope(task_id, work_order_id) {
    return this.envelopes.get(this.getBridgeKey(task_id, work_order_id)) ?? null;
  }

  getWorkOrder(work_order_id) {
    return this.work_orders.get(work_order_id) ?? null;
  }

  getRehydrationRecord(task_id, work_order_id) {
    return this.rehydration.get(this.getBridgeKey(task_id, work_order_id)) ?? null;
  }

  /**
   * Get recovery generation for a task/work_order from the rehydration record.
   */
  getRecoveryGeneration(task_id, work_order_id) {
    const record = this.getRehydrationRecord(task_id, work_order_id);
    return record?.recovery_generation ?? 1;
  }

  getContextReceipt(task_id, work_order_id) {
    return this.context_receipts.get(this.getBridgeKey(task_id, work_order_id)) ?? null;
  }
}

// ─── Authority Enforcement ──────────────────────────────────────────

/**
 * Validate that an MCP request is authorized against existing DPT state.
 * Returns { authorized, reason, envelope }.
 */
function validateAuthority({ store, task_id, work_order_id, actor, role }) {
  const envelope = store.getEnvelope(task_id, work_order_id);
  if (!envelope) {
    return { authorized: false, reason: "NO_ENVELOPE", envelope: null };
  }

  // Check envelope expiry
  if (envelope.expires_at && new Date(envelope.expires_at) < new Date()) {
    return { authorized: false, reason: "ENVELOPE_EXPIRED", envelope };
  }

  // Check role match
  if (role && envelope.role !== role) {
    return { authorized: false, reason: "ROLE_MISMATCH", envelope };
  }

  // Check actor match — subagents operate under the envelope's adapter authority.
  // The envelope's actor_id is the adapter, not individual agents.
  // Any actor is authorized if the envelope exists and role matches.
  // Actor-level restrictions are enforced by the adapter, not the MCP server.

  return { authorized: true, reason: "OK", envelope };
}

/**
 * Validate work-order identity correlation.
 * Fails closed on mismatch.
 */
function validateIdentity({ store, task_id, work_order_id }) {
  const wo = store.getWorkOrder(work_order_id);
  if (!wo) {
    return { valid: false, reason: "WORK_ORDER_NOT_FOUND" };
  }
  if (wo.task_id !== task_id) {
    return { valid: false, reason: "TASK_WORK_ORDER_MISMATCH" };
  }
  return { valid: true, reason: "OK", work_order: wo };
}

// ─── MCP Tool Handlers ──────────────────────────────────────────────

function handleGetTaskContext({ store, task_id, work_order_id, attempt_id = 1 }) {
  const identity = validateIdentity({ store, task_id, work_order_id });
  if (!identity.valid) {
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: identity.reason, detail: "Identity validation failed — fail closed" }) }] };
  }

  const auth = validateAuthority({ store, task_id, work_order_id });
  if (!auth.authorized) {
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: auth.reason, detail: "Authority validation failed — cannot grant access" }) }] };
  }

  const bridge = store.getBridge(task_id, work_order_id);
  const reconstruction = bridge.reconstruct();
  const rehydration = store.getRehydrationRecord(task_id, work_order_id);
  const receipt = store.getContextReceipt(task_id, work_order_id);

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        task_id,
        work_order_id,
        attempt_id,
        role: auth.envelope.role,
        workspace: auth.envelope.workspace,
        permissions_count: auth.envelope.permissions.length,
        execution_state: reconstruction,
        rehydration_record: rehydration ? { generation: rehydration.recovery_generation, phase: rehydration.execution_phase } : null,
        context_receipt: receipt ? { hash: receiptHash(receipt), loaded_at: receipt.loaded_at } : null,
      }),
    }],
  };
}

function handleGetWorkOrder({ store, task_id, work_order_id }) {
  const identity = validateIdentity({ store, task_id, work_order_id });
  if (!identity.valid) {
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: identity.reason }) }] };
  }

  const auth = validateAuthority({ store, task_id, work_order_id });
  if (!auth.authorized) {
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: auth.reason }) }] };
  }

  const wo = store.getWorkOrder(work_order_id);

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        work_order_id: wo.work_order_id,
        task_id: wo.task_id,
        scope: wo.scope,
        deliverables: wo.deliverables,
        acceptance_criteria: wo.acceptance_criteria,
        role: wo.role,
        restrictions: wo.restrictions,
      }),
    }],
  };
}

function handleGetPermissionEnvelope({ store, task_id, work_order_id }) {
  const identity = validateIdentity({ store, task_id, work_order_id });
  if (!identity.valid) {
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: identity.reason }) }] };
  }

  const envelope = store.getEnvelope(task_id, work_order_id);
  if (!envelope) {
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: "NO_ENVELOPE" }) }] };
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        envelope_id: envelope.envelope_id,
        role: envelope.role,
        authority_mode: envelope.authority_mode,
        permissions: envelope.permissions,
        human_gates: envelope.human_gates,
        prohibitions: envelope.prohibitions,
        workspace: envelope.workspace,
        issued_at: envelope.issued_at,
        expires_at: envelope.expires_at,
      }),
    }],
  };
}

function handleReportEvidence({ store, task_id, work_order_id, evidence_type, payload, actor, role }) {
  const identity = validateIdentity({ store, task_id, work_order_id });
  if (!identity.valid) {
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: identity.reason }) }] };
  }

  const auth = validateAuthority({ store, task_id, work_order_id, actor, role });
  if (!auth.authorized) {
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: auth.reason, detail: "Cannot report evidence without valid envelope" }) }] };
  }

  const bridge = store.getBridge(task_id, work_order_id);
  const recovery_generation = store.getRecoveryGeneration(task_id, work_order_id);

  // MCP-submitted evidence is ALWAYS CLAIM — transport does NOT upgrade authority
  const evidence = createEvidence({
    evidence_type,
    authority: EVIDENCE_AUTHORITY.CLAIM,
    task_id,
    work_order_id,
    attempt_id: 1,
    actor: actor ?? auth.envelope.actor_id,
    provider_session_id: null,
    payload,
  });

  // Record the event
  const event = createEvent({
    event_type: EVENT_TYPE.TOOL_COMPLETED,
    task_id,
    work_order_id,
    actor: actor ?? auth.envelope.actor_id,
    role: role ?? auth.envelope.role,
    normalized_payload: { tool_name: "report_evidence", evidence_type },
    evidence_refs: [evidence.evidence_id],
    recovery_generation,
  });

  const ingestResult = bridge.ingest({ events: [event], evidence: [evidence] });

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        evidence_id: evidence.evidence_id,
        authority: EVIDENCE_AUTHORITY.CLAIM,
        note: "MCP transport does NOT upgrade authority to INDEPENDENTLY_VERIFIED",
        ingest_result: ingestResult,
      }),
    }],
  };
}

function handleReportResult({ store, task_id, work_order_id, result_summary, result_data, actor, role }) {
  const identity = validateIdentity({ store, task_id, work_order_id });
  if (!identity.valid) {
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: identity.reason }) }] };
  }

  const auth = validateAuthority({ store, task_id, work_order_id, actor, role });
  if (!auth.authorized) {
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: auth.reason }) }] };
  }

  const bridge = store.getBridge(task_id, work_order_id);
  const recovery_generation = store.getRecoveryGeneration(task_id, work_order_id);

  // Result event
  const event = createEvent({
    event_type: EVENT_TYPE.RESULT_RECEIVED,
    task_id,
    work_order_id,
    actor: actor ?? auth.envelope.actor_id,
    role: role ?? auth.envelope.role,
    execution_phase: "RESULT",
    normalized_payload: { result_summary, result_data },
    recovery_generation,
  });

  // Result evidence (CLAIM — worker self-report)
  const evidence = createEvidence({
    evidence_type: EVIDENCE_TYPE.RESULT_EVIDENCE,
    authority: EVIDENCE_AUTHORITY.CLAIM,
    task_id,
    work_order_id,
    actor: actor ?? auth.envelope.actor_id,
    payload: { result_summary, result_data },
  });

  const ingestResult = bridge.ingest({ events: [event], evidence: [evidence] });

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        event_id: event.event_id,
        evidence_id: evidence.evidence_id,
        authority: EVIDENCE_AUTHORITY.CLAIM,
        note: "Result recorded as CLAIM — requires independent validation for authoritative acceptance",
        ingest_result: ingestResult,
      }),
    }],
  };
}

function handleReportFailure({ store, task_id, work_order_id, failure_class, error_message, error_details, actor, role }) {
  const identity = validateIdentity({ store, task_id, work_order_id });
  if (!identity.valid) {
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: identity.reason }) }] };
  }

  const auth = validateAuthority({ store, task_id, work_order_id, actor, role });
  if (!auth.authorized) {
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: auth.reason }) }] };
  }

  const bridge = store.getBridge(task_id, work_order_id);
  const recovery_generation = store.getRecoveryGeneration(task_id, work_order_id);

  const event = createEvent({
    event_type: EVENT_TYPE.FAILURE_OBSERVED,
    task_id,
    work_order_id,
    actor: actor ?? auth.envelope.actor_id,
    role: role ?? auth.envelope.role,
    execution_phase: "FAILED",
    status: "FAILURE",
    normalized_payload: { failure_class, error_message, error_details },
    recovery_generation,
  });

  const evidence = createEvidence({
    evidence_type: EVIDENCE_TYPE.RESULT_EVIDENCE,
    authority: EVIDENCE_AUTHORITY.CLAIM,
    task_id,
    work_order_id,
    actor: actor ?? auth.envelope.actor_id,
    payload: { failure_class, error_message, error_details },
  });

  const ingestResult = bridge.ingest({ events: [event], evidence: [evidence] });

  // Failure disposition is NOT dictated by MCP caller — determined by DPT governance
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        event_id: event.event_id,
        evidence_id: evidence.evidence_id,
        failure_class,
        disposition: "REWORK_REQUIRED",
        disposition_note: "Disposition determined by DPT governance, not MCP caller",
        ingest_result: ingestResult,
      }),
    }],
  };
}

function handleRequestReview({ store, task_id, work_order_id, review_type, scope, actor, role }) {
  const identity = validateIdentity({ store, task_id, work_order_id });
  if (!identity.valid) {
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: identity.reason }) }] };
  }

  const auth = validateAuthority({ store, task_id, work_order_id, actor, role });
  if (!auth.authorized) {
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: auth.reason }) }] };
  }

  const bridge = store.getBridge(task_id, work_order_id);
  const recovery_generation = store.getRecoveryGeneration(task_id, work_order_id);

  const event = createEvent({
    event_type: EVENT_TYPE.TOOL_COMPLETED,
    task_id,
    work_order_id,
    actor: actor ?? auth.envelope.actor_id,
    role: role ?? auth.envelope.role,
    normalized_payload: { tool_name: "request_review", review_type, scope },
    recovery_generation,
  });

  const evidence = createEvidence({
    evidence_type: EVIDENCE_TYPE.REVIEW_EVIDENCE,
    authority: EVIDENCE_AUTHORITY.CLAIM,
    task_id,
    work_order_id,
    actor: actor ?? auth.envelope.actor_id,
    payload: { review_type, scope, requestor_role: role },
  });

  const ingestResult = bridge.ingest({ events: [event], evidence: [evidence] });

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        event_id: event.event_id,
        evidence_id: evidence.evidence_id,
        review_type,
        scope,
        status: "REVIEW_REQUESTED",
        note: "Review must be performed by an authorized reviewer role — MCP request does not grant review authority",
        ingest_result: ingestResult,
      }),
    }],
  };
}

function handleGetExecutionState({ store, task_id, work_order_id }) {
  const identity = validateIdentity({ store, task_id, work_order_id });
  if (!identity.valid) {
    return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: identity.reason }) }] };
  }

  const bridge = store.getBridge(task_id, work_order_id);
  const reconstruction = bridge.reconstruct();
  const rehydration = store.getRehydrationRecord(task_id, work_order_id);

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        task_id,
        work_order_id,
        reconstruction,
        rehydration: rehydration ? {
          generation: rehydration.recovery_generation,
          phase: rehydration.execution_phase,
          last_completed_step: rehydration.last_completed_step,
          provider_session_id: rehydration.provider_session_id,
        } : null,
        mcp_server: { name: SERVER_NAME, version: SERVER_VERSION },
      }),
    }],
  };
}

// ─── MCP JSON-RPC 2.0 Server ───────────────────────────────────────

const TOOL_HANDLERS = {
  get_task_context: handleGetTaskContext,
  get_work_order: handleGetWorkOrder,
  get_permission_envelope: handleGetPermissionEnvelope,
  report_evidence: handleReportEvidence,
  report_result: handleReportResult,
  report_failure: handleReportFailure,
  request_review: handleRequestReview,
  get_execution_state: handleGetExecutionState,
};

/**
 * Handle a single JSON-RPC 2.0 request.
 */
function handleRequest(request, store) {
  const { id, method, params } = request;

  // Respond to null id (notification) — no response needed
  if (id === null || id === undefined) {
    return null;
  }

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: MCP_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        },
      };

    case "notifications/initialized":
      // Client notification — no response
      return null;

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: { tools: DPT_TOOLS },
      };

    case "tools/call": {
      const { name, arguments: args } = params ?? {};
      const handler = TOOL_HANDLERS[name];
      if (!handler) {
        return {
          jsonrpc: "2.0",
          id,
          result: { isError: true, content: [{ type: "text", text: `Unknown tool: ${name}` }] },
        };
      }
      try {
        const result = handler({ store, ...args });
        return { jsonrpc: "2.0", id, result };
      } catch (err) {
        return {
          jsonrpc: "2.0",
          id,
          result: { isError: true, content: [{ type: "text", text: JSON.stringify({ error: "INTERNAL_ERROR", detail: err.message }) }] },
        };
      }
    }

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

/**
 * Create and configure the DPT MCP Server.
 */
export function createDPTMCPServer({ store }) {
  return {
    store,
    tools: DPT_TOOLS,
    handleRequest: (request) => handleRequest(request, store),
  };
}

/**
 * Start the MCP server on stdio transport.
 */
export function serveStdio(store) {
  const rl = createInterface({ input: process.stdin, terminal: false });

  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const request = JSON.parse(trimmed);
      const response = handleRequest(request, store);
      if (response) {
        process.stdout.write(JSON.stringify(response) + "\n");
      }
    } catch (err) {
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      }) + "\n");
    }
  });

  rl.on("close", () => {
    process.exit(0);
  });
}

// ─── Direct Process Exports (for testing without stdio) ─────────────

export { handleRequest, DPT_TOOLS, TOOL_HANDLERS, validateAuthority, validateIdentity };
