/**
 * DPT-PROVIDER-004.E — Provider-Neutral Event Model
 *
 * Canonical DPT event representation.
 * Provider-specific translation belongs exclusively in the normalizer.
 */

import { createHash } from "crypto";

export const EVENT_VERSION = "0.1.0";

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

let _sequence = 0;

/**
 * Create a DPT event.
 */
export function createEvent({
  event_type,
  task_id,
  work_order_id,
  attempt_id = 1,
  actor = "provider-adapter",
  role = null,
  provider_adapter = "dpt-opencode-provider-adapter",
  provider_session_id = null,
  execution_phase = null,
  status = null,
  raw_event_reference = null,
  normalized_payload = null,
  evidence_refs = [],
  correlation_id = null,
  causation_id = null,
  recovery_generation = 1,
}) {
  const event_id = `evt-${Date.now()}-${++_sequence}`;
  const timestamp = new Date().toISOString();

  return {
    event_version: EVENT_VERSION,
    event_id,
    timestamp,
    sequence: _sequence,
    task_id,
    work_order_id,
    attempt_id,
    actor,
    role,
    provider_adapter,
    provider_session_id,
    event_type,
    execution_phase,
    status,
    raw_event_reference,
    normalized_payload,
    evidence_refs,
    correlation_id: correlation_id ?? event_id,
    causation_id,
    recovery_generation,
  };
}

/**
 * Create an evidence record.
 */
export function createEvidence({
  evidence_type,
  authority = EVIDENCE_AUTHORITY.CLAIM,
  task_id,
  work_order_id,
  attempt_id = 1,
  actor = "provider-adapter",
  provider_session_id = null,
  source_event_id = null,
  timestamp = null,
  payload = {},
}) {
  const evidence_id = `evd-${Date.now()}-${++_sequence}`;

  return {
    evidence_version: EVENT_VERSION,
    evidence_id,
    evidence_type,
    authority,
    task_id,
    work_order_id,
    attempt_id,
    actor,
    provider_session_id,
    source_event_id,
    timestamp: timestamp ?? new Date().toISOString(),
    payload,
  };
}

/**
 * Compute a deterministic hash for deduplication.
 */
export function eventHash(event) {
  const canonical = JSON.stringify({
    event_type: event.event_type,
    task_id: event.task_id,
    work_order_id: event.work_order_id,
    actor: event.actor,
    normalized_payload: event.normalized_payload,
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}

export function evidenceHash(evidence) {
  const canonical = JSON.stringify({
    evidence_type: evidence.evidence_type,
    task_id: evidence.task_id,
    work_order_id: evidence.work_order_id,
    actor: evidence.actor,
    payload: evidence.payload,
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}
