/**
 * DPT-PROVIDER-005 — Provider Contract (Provider-Neutral)
 *
 * Defines the SEMANTICS any execution provider must implement.
 * Does NOT mandate SDK, MCP, or any specific mechanism.
 *
 * Contract = WHAT. Adapter = HOW.
 */

export const CONTRACT_VERSION = "0.1.0";

// ─── Event Vocabulary ───────────────────────────────────────────────

export const EVENT_TYPE = Object.freeze({
  WORK_ORDER_STARTED: "WORK_ORDER_STARTED",
  SESSION_CREATED: "SESSION_CREATED",
  EXECUTION_STARTED: "EXECUTION_STARTED",
  TOOL_REQUESTED: "TOOL_REQUESTED",
  TOOL_COMPLETED: "TOOL_COMPLETED",
  TOOL_FAILED: "TOOL_FAILED",
  PERMISSION_DECISION: "PERMISSION_DECISION",
  SUBAGENT_STARTED: "SUBAGENT_STARTED",
  SUBAGENT_COMPLETED: "SUBAGENT_COMPLETED",
  SUBAGENT_FAILED: "SUBAGENT_FAILED",
  RESULT_RECEIVED: "RESULT_RECEIVED",
  RESULT_VALIDATED: "RESULT_VALIDATED",
  RESULT_REJECTED: "RESULT_REJECTED",
  FAILURE_OBSERVED: "FAILURE_OBSERVED",
  SESSION_LOST: "SESSION_LOST",
  SESSION_REHYDRATED: "SESSION_REHYDRATED",
  WORK_ORDER_COMPLETED: "WORK_ORDER_COMPLETED",
  WORK_ORDER_FAILED: "WORK_ORDER_FAILED",
  PROVIDER_EVENT_UNKNOWN: "PROVIDER_EVENT_UNKNOWN",
});

export const EVIDENCE_TYPE = Object.freeze({
  COMMAND_EVIDENCE: "COMMAND_EVIDENCE",
  FILE_EVIDENCE: "FILE_EVIDENCE",
  TEST_EVIDENCE: "TEST_EVIDENCE",
  RESULT_EVIDENCE: "RESULT_EVIDENCE",
  PERMISSION_EVIDENCE: "PERMISSION_EVIDENCE",
  SESSION_EVIDENCE: "SESSION_EVIDENCE",
  REVIEW_EVIDENCE: "REVIEW_EVIDENCE",
});

export const EVIDENCE_AUTHORITY = Object.freeze({
  CLAIM: "CLAIM",
  INDEPENDENTLY_VERIFIED: "INDEPENDENTLY_VERIFIED",
});

// ─── Permission Vocabulary ──────────────────────────────────────────

export const AUTHORITY_MODE = Object.freeze({
  AUTO_ALLOW: "AUTO_ALLOW",
  ASK: "ASK",
  DENY: "DENY",
});

export const DOMAIN = Object.freeze({
  FILESYSTEM: "FILESYSTEM",
  EXECUTION: "EXECUTION",
  GIT: "GIT",
  NETWORK: "NETWORK",
  AGENTS: "AGENTS",
  DESTRUCTIVE: "DESTRUCTIVE",
});

export const ROLE = Object.freeze({
  ARCHITECT: "ARCHITECT",
  DEVELOPER: "DEVELOPER",
  REVIEWER: "REVIEWER",
  INTEGRATION_CONTROLLER: "INTEGRATION_CONTROLLER",
});

// ─── Capability Levels ──────────────────────────────────────────────

export const CAPABILITY_LEVEL = Object.freeze({
  SUPPORTED: "SUPPORTED",
  PARTIAL: "PARTIAL",
  UNSUPPORTED: "UNSUPPORTED",
});

// ─── Required Capability Categories ─────────────────────────────────

/**
 * REQUIRED capabilities — must be SUPPORTED for full conformance.
 * Providers missing required capabilities fail conformance.
 */
export const REQUIRED_CAPABILITIES = Object.freeze([
  "identity_correlation",
  "event_production",
  "evidence_recording",
  "authority_enforcement",
  "permission_envelope",
  "failure_reporting",
  "recovery_state",
  "completion_idempotency",
  "cross_wo_isolation",
  "human_gate_preservation",
]);

/**
 * OPTIONAL capabilities — may be PARTIAL or UNSUPPORTED.
 * Providers degrade gracefully for unsupported optionals.
 */
export const OPTIONAL_CAPABILITIES = Object.freeze([
  "native_event_stream",
  "session_recovery",
  "subagent_isolation",
  "dynamic_permission_materialization",
  "capability_plane",
  "abort_support",
  "restart_support",
  "cleanup_support",
  "health_check",
  "structured_results",
  "provider_config_materialization",
]);

// ─── Provider Contract Interface ────────────────────────────────────

/**
 * The provider-neutral contract. Any adapter must implement these semantics.
 *
 * This is a documentation interface — adapters prove conformance by
 * passing the generic conformance suite, not by importing this file.
 */
export const PROVIDER_CONTRACT = Object.freeze({
  /**
   * A. Runtime Lifecycle
   */
  runtime: {
    /** Start the provider runtime. Returns provider handle. */
    start: "async (config) → provider_handle",
    /** Stop the provider runtime gracefully. */
    stop: "async (provider_handle) → void",
    /** Restart the provider runtime (new session, same logical work). */
    restart: "async (provider_handle, recovery_state) → provider_handle",
  },

  /**
   * B. Session Lifecycle
   */
  session: {
    /** Create a new execution session. */
    create: "async (provider_handle, work_order) → session_id",
    /** Resume a session from recovery state. */
    resume: "async (provider_handle, rehydration_record) → session_id",
    /** Abort a running session. */
    abort: "async (session_id) → void",
  },

  /**
   * C. Work-Order Dispatch
   */
  dispatch: {
    /** Send a work order to the provider for execution. */
    send: "async (session_id, work_order, prompt) → execution_result",
  },

  /**
   * D. Permission Materialization
   */
  permission: {
    /** Translate PermissionEnvelope → provider-specific config. */
    materialize: "(envelope, context) → provider_config",
    /** Validate the materialized config is correct. */
    validate: "(provider_config) → { valid, errors }",
    /** Evaluate a permission decision for a specific operation. */
    evaluate: "(provider_config, operation, resource) → AUTHORITY_MODE",
  },

  /**
   * E. Result Retrieval
   */
  result: {
    /** Get structured result from execution. */
    get: "async (session_id) → { status, structured_result, exit_class }",
  },

  /**
   * F. Event/Evidence Extraction
   */
  evidence: {
    /** Normalize provider-specific events → DPT events + evidence. */
    normalize: "(provider_event) → { events: [], evidence: [] }",
    /** Classify provider-observed facts as INDEPENDENTLY_VERIFIED. */
    classify_observation: "(provider_event) → EVIDENCE_AUTHORITY",
  },

  /**
   * G. Failure Reporting
   */
  failure: {
    /** Classify a provider error into DPT failure classes. */
    classify: "(provider_error) → { failure_class, error_message, details }",
  },

  /**
   * H. Recovery / Rehydration
   */
  recovery: {
    /** Create rehydration record from current state. */
    create_record: "(execution_state) → RehydrationRecord",
    /** Advance record after step completion. */
    advance: "(record, step_result) → RehydrationRecord",
    /** Create recovery record after restart. */
    recover: "(original_record, recovery_context) → RehydrationRecord",
    /** Validate rehydration context receipts. */
    validate: "(original_receipt, rehydrated_receipt) → { valid, stale }",
  },

  /**
   * I. Capability Plane
   */
  capability_plane: {
    /** Expose DPT capabilities to the provider's agents. */
    tools: "get_task_context, get_work_order, get_permission_envelope, report_evidence, report_result, report_failure, request_review, get_execution_state",
    /** Validate that capability requests are authorized. */
    validate_request: "(request, envelope) → { authorized, reason }",
  },

  /**
   * J. Health / Readiness
   */
  health: {
    /** Check if the provider is healthy and ready. */
    check: "async () → { healthy, ready, details }",
  },

  /**
   * K. Cleanup
   */
  cleanup: {
    /** Clean up provider resources after work order completion. */
    cleanup: "async (session_id) → void",
  },
});

// ─── Safety Invariants (Mandatory for ALL providers) ────────────────

export const SAFETY_INVARIANTS = Object.freeze([
  {
    id: "INV-1",
    name: "session_id != task_identity",
    description: "Provider session ID must NOT be treated as DPT task identity",
    severity: "CRITICAL",
  },
  {
    id: "INV-2",
    name: "worker_claim != verified_evidence",
    description: "Worker self-report must be CLAIM, never INDEPENDENTLY_VERIFIED",
    severity: "CRITICAL",
  },
  {
    id: "INV-3",
    name: "failure_class != disposition",
    description: "Failure class and disposition must be evaluated separately",
    severity: "HIGH",
  },
  {
    id: "INV-4",
    name: "ordinary_failure != blocked",
    description: "Ordinary provider/test/worker failure must NOT be classified as BLOCKED",
    severity: "HIGH",
  },
  {
    id: "INV-5",
    name: "provider_prompt != human_gate",
    description: "Provider permission prompt must NOT be equated to DPT Human Gate",
    severity: "CRITICAL",
  },
  {
    id: "INV-6",
    name: "provider_cannot_expand_authority",
    description: "Provider cannot expand its own DPT authority through any mechanism",
    severity: "CRITICAL",
  },
  {
    id: "INV-7",
    name: "cross_wo_authority_leak_forbidden",
    description: "Cross-Work-Order authority leak is forbidden",
    severity: "CRITICAL",
  },
  {
    id: "INV-8",
    name: "human_gates_cannot_be_bypassed",
    description: "Human Gates cannot be bypassed by any provider mechanism",
    severity: "CRITICAL",
  },
  {
    id: "INV-9",
    name: "completion_requires_independent_evidence",
    description: "Completion cannot be emitted from worker claim alone",
    severity: "CRITICAL",
  },
  {
    id: "INV-10",
    name: "dpt_durable_state_source_of_truth",
    description: "DPT durable state remains the source of truth",
    severity: "CRITICAL",
  },
]);
