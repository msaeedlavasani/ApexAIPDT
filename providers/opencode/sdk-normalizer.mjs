/**
 * DPT-PROVIDER-004.E — SDK Normalizer
 *
 * Translates raw SDK responses into DPT events + evidence.
 * Unknown events preserved as PROVIDER_EVENT_UNKNOWN.
 * Does not crash on unknown formats.
 */

import {
  createEvent, createEvidence, EVENT_TYPE, EVIDENCE_TYPE, EVIDENCE_AUTHORITY
} from "./event-model.mjs";

/**
 * Normalize a session.prompt() response into DPT events + evidence.
 */
export function normalizePromptResponse({
  response,
  task_id,
  work_order_id,
  attempt_id = 1,
  provider_session_id,
  recovery_generation = 1,
}) {
  const events = [];
  const evidence = [];
  const info = response?.info;
  const parts = response?.parts ?? [];

  // Session-level metadata
  if (info) {
    events.push(createEvent({
      event_type: EVENT_TYPE.EXECUTION_STARTED,
      task_id,
      work_order_id,
      attempt_id,
      provider_session_id,
      execution_phase: "PROMPT_RESPONSE",
      status: "STARTED",
      normalized_payload: {
        model: info.model,
        agent: info.agent,
        cost: info.cost,
        tokens: info.tokens,
      },
      recovery_generation,
    }));

    // Session evidence
    evidence.push(createEvidence({
      evidence_type: EVIDENCE_TYPE.SESSION_EVIDENCE,
      authority: EVIDENCE_AUTHORITY.INDEPENDENTLY_VERIFIED,
      task_id,
      work_order_id,
      attempt_id,
      provider_session_id,
      payload: {
        model: info.model,
        agent: info.agent,
        cost: info.cost,
        tokens: info.tokens,
        path: info.path,
      },
    }));
  }

  // Process parts
  let has_tool_use = false;
  let has_text_result = false;
  let text_content = null;

  for (const part of parts) {
    const tool = part.type === "tool-invocation"
      ? normalizeLegacyToolPart(part.toolInvocation)
      : part.type === "tool"
        ? normalizeSdkToolPart(part)
        : null;

    if (tool) {
      has_tool_use = true;

      events.push(createEvent({
        event_type: tool.state === "completed" ? EVENT_TYPE.TOOL_COMPLETED :
                   tool.state === "error" ? EVENT_TYPE.TOOL_FAILED :
                   EVENT_TYPE.TOOL_REQUESTED,
        task_id,
        work_order_id,
        attempt_id,
        provider_session_id,
        execution_phase: "TOOL_EXECUTION",
        status: tool.state === "completed" ? "SUCCESS" :
                tool.state === "error" ? "FAIL" : "PENDING",
        normalized_payload: {
          tool_name: tool.tool_name,
          tool_state: tool.state,
          args: tool.args,
          result: tool.result,
        },
        recovery_generation,
      }));

      const tool_evidence_type = inferToolEvidenceType(tool.tool_name);
      evidence.push(createEvidence({
        evidence_type: tool_evidence_type,
        authority: tool.state === "completed"
          ? EVIDENCE_AUTHORITY.INDEPENDENTLY_VERIFIED
          : EVIDENCE_AUTHORITY.CLAIM,
        task_id,
        work_order_id,
        attempt_id,
        provider_session_id,
        payload: {
          tool_name: tool.tool_name,
          tool_state: tool.state,
          args: tool.args,
          result: tool.result,
        },
      }));
    }

    if (part.type === "text" && part.text) {
      has_text_result = true;
      text_content = part.text;

      events.push(createEvent({
        event_type: EVENT_TYPE.RESULT_RECEIVED,
        task_id,
        work_order_id,
        attempt_id,
        provider_session_id,
        execution_phase: "RESULT",
        status: "RECEIVED",
        normalized_payload: {
          text_length: part.text.length,
          text_preview: part.text.slice(0, 200),
        },
        recovery_generation,
      }));
    }
  }

  // Result evidence (worker self-report = CLAIM, not verified)
  if (has_text_result) {
    evidence.push(createEvidence({
      evidence_type: EVIDENCE_TYPE.RESULT_EVIDENCE,
      authority: EVIDENCE_AUTHORITY.CLAIM,
      task_id,
      work_order_id,
      attempt_id,
      provider_session_id,
      payload: {
        text_preview: text_content?.slice(0, 200),
        text_length: text_content?.length,
      },
    }));
  }

  return { events, evidence, has_tool_use, has_text_result, text_content };
}

/**
 * Normalize a session create response.
 */
export function normalizeSessionCreated({
  session_id,
  task_id,
  work_order_id,
  attempt_id = 1,
  recovery_generation = 1,
}) {
  return {
    event: createEvent({
      event_type: EVENT_TYPE.SESSION_CREATED,
      task_id,
      work_order_id,
      attempt_id,
      provider_session_id: session_id,
      execution_phase: "SESSION",
      status: "CREATED",
      normalized_payload: { session_id },
      recovery_generation,
    }),
    evidence: createEvidence({
      evidence_type: EVIDENCE_TYPE.SESSION_EVIDENCE,
      authority: EVIDENCE_AUTHORITY.INDEPENDENTLY_VERIFIED,
      task_id,
      work_order_id,
      attempt_id,
      provider_session_id: session_id,
      payload: { session_id, event: "SESSION_CREATED" },
    }),
  };
}

/**
 * Normalize a provider failure.
 */
export function normalizeFailure({
  error,
  task_id,
  work_order_id,
  attempt_id = 1,
  provider_session_id = null,
  recovery_generation = 1,
}) {
  const msg = error?.message ?? String(error);
  let failure_class = "UNKNOWN";
  let disposition = "REWORK_REQUIRED";

  if (msg.includes("timeout")) { failure_class = "TIMEOUT"; disposition = "REWORK_REQUIRED"; }
  else if (msg.includes("ECONNREFUSED") || msg.includes("fetch")) { failure_class = "TRANSPORT_ERROR"; disposition = "REWORK_REQUIRED"; }
  else if (msg.includes("auth") || msg.includes("401")) { failure_class = "AUTH_ERROR"; disposition = "ESCALATION_REQUIRED"; }
  else if (msg.includes("429")) { failure_class = "RATE_LIMIT"; disposition = "REWORK_REQUIRED"; }

  return {
    event: createEvent({
      event_type: EVENT_TYPE.FAILURE_OBSERVED,
      task_id,
      work_order_id,
      attempt_id,
      provider_session_id,
      execution_phase: "FAILURE",
      status: failure_class,
      normalized_payload: {
        failure_class,
        disposition,
        error_message: msg,
        error_stack: error?.stack?.slice(0, 500),
      },
      recovery_generation,
    }),
    evidence: createEvidence({
      evidence_type: EVIDENCE_TYPE.RESULT_EVIDENCE,
      authority: EVIDENCE_AUTHORITY.INDEPENDENTLY_VERIFIED,
      task_id,
      work_order_id,
      attempt_id,
      provider_session_id,
      payload: { failure_class, disposition, error_message: msg },
    }),
  };
}

function normalizeLegacyToolPart(tool) {
  if (!tool) return null;
  return {
    tool_name: tool.toolName,
    state: tool.state === "result" ? "completed" : tool.state,
    args: tool.args,
    result: tool.result,
  };
}

function normalizeSdkToolPart(part) {
  return {
    tool_name: part.tool,
    state: part.state?.status,
    args: part.state?.input,
    result: part.state?.output ?? part.state?.error,
  };
}

/**
 * Infer evidence type from tool name.
 */
function inferToolEvidenceType(tool_name) {
  switch (tool_name) {
    case "bash": return EVIDENCE_TYPE.COMMAND_EVIDENCE;
    case "read":
    case "write":
    case "edit":
    case "glob":
    case "grep": return EVIDENCE_TYPE.FILE_EVIDENCE;
    case "task": return EVIDENCE_TYPE.REVIEW_EVIDENCE;
    case "todowrite": return EVIDENCE_TYPE.REVIEW_EVIDENCE;
    default: return EVIDENCE_TYPE.COMMAND_EVIDENCE;
  }
}
