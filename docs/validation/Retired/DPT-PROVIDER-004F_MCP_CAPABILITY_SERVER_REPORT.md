# DPT-PROVIDER-004F: DPT MCP Capability Server — VALIDATED

**Task**: 004.F
**Parent**: 004.E (Evidence + Event Bridge, CLOSED)
**Status**: CLOSED
**Date**: 2026-09-03
**Verdict**: ALL 94/94 TESTS PASS

---

## 1. Executive Summary

Provider-neutral DPT MCP Server implemented from scratch (zero external dependencies) using JSON-RPC 2.0 over stdio. Exposes 8 bounded DPT capabilities. MCP is a capability transport, NOT an authority source. Every call validated against existing DPT durable state. SDK remains the primary control surface.

**Architecture**:
```
DPT → OpenCode:  SDK = Control Plane
OpenCode → DPT:  MCP = Capability Plane
```

---

## 2. What Was Proved

| Test Group | Tests | What | Verdict |
|------------|-------|------|---------|
| TEST-1 | 9 | Tool discovery (8 tools exist) | PASS |
| TEST-2 | 6 | get_task_context | PASS |
| TEST-3 | 4 | get_work_order | PASS |
| TEST-4 | 6 | get_permission_envelope | PASS |
| TEST-5 | 4 | report_evidence | PASS |
| TEST-6 | 4 | report_result | PASS |
| TEST-7 | 5 | report_failure | PASS |
| TEST-8 | 4 | request_review | PASS |
| TEST-9 | 5 | get_execution_state | PASS |
| TEST-10 | 5 | Event/evidence bridge integration | PASS |
| TEST-11 | 2 | Cross-WO access denied | DENIED |
| TEST-12 | 3 | Authority expansion denied | DENIED |
| TEST-13 | 2 | Self-verification denied | DENIED |
| TEST-14 | 3 | Human gate bypass denied | DENIED |
| TEST-15 | 2 | Durable state mutation denied | DENIED |
| TEST-16 | 5 | Parent/subagent attribution | PASS |
| TEST-17 | 2 | Stale identity fails closed | PASS |
| TEST-18 | 11 | Restart/rehydration | PASS |
| TEST-19 | 8 | End-to-end controlled proof | PASS |
| TEST-20 | 4 | MCP does not replace SDK | PASS |

---

## 3. MCP Server Architecture

### Transport
- JSON-RPC 2.0 over stdio (MCP standard)
- Zero external dependencies — pure Node.js built-ins (`readline`, `process`, `crypto`)

### Protocol
- `initialize` → protocol handshake
- `tools/list` → enumerate 8 DPT capabilities
- `tools/call` → invoke specific capability

### Capability Surface (8 tools)

| Tool | Purpose | Authority Impact |
|------|---------|-----------------|
| `get_task_context` | Authorized task/WO context | Read-only |
| `get_work_order` | Work order details | Read-only |
| `get_permission_envelope` | Permission envelope | Read-only |
| `report_evidence` | Record evidence | CLAIM only |
| `report_result` | Record structured result | CLAIM only |
| `report_failure` | Record controlled failure | CLAIM only |
| `request_review` | Request independent review | Request only |
| `get_execution_state` | Query execution state | Read-only |

---

## 4. Authority Enforcement

| Principle | Implementation |
|-----------|---------------|
| MCP does NOT grant authority | Every call validated against existing envelope |
| MCP evidence is ALWAYS CLAIM | `EVIDENCE_AUTHORITY.CLAIM` hardcoded for MCP submissions |
| MCP cannot expand permissions | No tool modifies PermissionEnvelope |
| MCP cannot bypass Human Gates | Human gates preserved in envelope, not modifiable |
| MCP cannot self-verify | Evidence authority is CLAIM, not INDEPENDENTLY_VERIFIED |
| MCP cannot mutate durable state | Tools are append-only (events/evidence) |
| Fail closed on identity mismatch | task_id/wo_id validated before any operation |

---

## 5. Identity / Correlation

Every MCP request validated against:
- `task_id` — DPT task identifier
- `work_order_id` — DPT work order identifier
- `attempt_id` — Execution attempt number
- `actor` — Reporting actor (subagents operate under adapter authority)
- `role` — Actor role (must match envelope)
- `recovery_generation` — Tracked via rehydration records

---

## 6. Integration with 004.E

MCP tool calls generate events and evidence that enter the same provider-neutral model:
- `TOOL_COMPLETED` events for report_evidence, request_review
- `RESULT_RECEIVED` events for report_result
- `FAILURE_OBSERVED` events for report_failure
- All evidence recorded via `EventBridge.ingest()`
- Dedup, ordering, persistence all apply

---

## 7. Restart / Rehydration (004.D Integration)

Proved:
1. Bridge state persisted to disk
2. Recovery record created with incremented generation
3. Bridge reloaded from disk after simulated restart
4. MCP client reconnected to new store
5. Post-restart MCP calls succeed
6. Recovery generation correctly shows 2

---

## 8. Files Delivered

| File | Purpose |
|------|---------|
| `providers/opencode/dpt-mcp-server.mjs` | MCP JSON-RPC 2.0 server, 8 tools, authority enforcement, DPTStateStore |
| `providers/opencode/dpt-mcp-client.mjs` | MCP client (direct + stdio child process) |
| `providers/opencode/test-mcp-server.mjs` | 94-proof test harness |

---

## 9. No External Dependencies

MCP server implemented from scratch using only Node.js built-ins:
- `readline` — stdio line protocol
- `process` — stdin/stdout
- `crypto` — request IDs
- `child_process` — client spawning (test only)

No `@modelcontextprotocol/sdk`, no `zod`, no vendor packages.

---

## 10. Consolidated Observations

| ID | Observation | Severity |
|----|-------------|----------|
| MCP-1 | MCP tools are append-only by design | INFO — prevents state corruption |
| MCP-2 | Actor-level restrictions enforced by adapter, not MCP | INFO — envelope-based authority |
| MCP-3 | Disposition determined by DPT governance, not MCP caller | INFO — separation of concerns |
| MCP-4 | Zero dependencies — protocol implemented from scratch | INFO — no vendor lock-in |

---

## 11. No-Go Verification

- No commit, push, merge, deploy
- No permission broadening
- No broad `/tmp/*` allow
- No provider lock-in
- Provider/model routing independent
- Static `opencode.json` not modified
- No Work/Codex/OpenAI dependency

---

## 12. Final Output

```
TASK_ID:                        DPT-PROVIDER-004.F
DPT_MCP_SERVER_IMPLEMENTED:     YES
MCP_ROLE:                       CAPABILITY_PLANE
PRIMARY_CONTROL_SURFACE:        SDK
DPT_DURABLE_STATE_SOURCE_OF_TRUTH: YES
TASK_CONTEXT_CAPABILITY:        PASS
WORK_ORDER_CAPABILITY:          PASS
PERMISSION_ENVELOPE_CAPABILITY: PASS
EVIDENCE_REPORTING_CAPABILITY:  PASS
RESULT_REPORTING_CAPABILITY:    PASS
FAILURE_REPORTING_CAPABILITY:   PASS
REVIEW_REQUEST_CAPABILITY:      PASS
EXECUTION_STATE_CAPABILITY:     PASS
PARENT_MCP_ATTRIBUTION:         PASS
SUBAGENT_MCP_ATTRIBUTION:       PASS
CROSS_WORK_ORDER_ACCESS:        DENIED
AUTHORITY_EXPANSION_VIA_MCP:    DENIED
SELF_VERIFICATION_VIA_MCP:      DENIED
HUMAN_GATE_BYPASS:              DENIED
MCP_RECONNECTION_AFTER_REHYDRATION: PASS
MCP_EVENT_EVIDENCE_INTEGRATION: PASS
MANUAL_PERMISSION_GRANTS_USED_IN_FINAL_ACCEPTANCE: NO
PERMISSION_SCOPE_BROADENED:     NO
WORK_CODEX_REQUIRED:            NO
OPENAI_REQUIRED:                NO
INDEPENDENT_REVIEW:             PASS
REPORT_PERSISTED:               YES
REPORT_READ_BACK_VERIFIED:      YES
TASK_STATUS:                    CLOSED
NEXT_TASK:                      DPT-PROVIDER-004.G
HUMAN_GATE_REQUIRED:            NO
```

---

**Closed by**: Opencode Agent
**Chain**: 003.C (CLOSED) → 004.A (CLOSED) → 004.B (CLOSED) → 004.C (CLOSED) → 004.D (CLOSED) → 004.E (CLOSED) → 004.F (CLOSED)
