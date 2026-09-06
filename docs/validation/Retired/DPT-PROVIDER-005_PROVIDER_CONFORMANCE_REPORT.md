# DPT-PROVIDER-005: Provider Contract + Conformance Suite — VALIDATED

**Task**: 005
**Parent**: 004.G (SDK + MCP End-to-End Integration, CLOSED)
**Status**: CLOSED
**Date**: 2026-09-03
**Verdict**: ALL TESTS PASS

---

## 1. Executive Summary

Provider-neutral contract extracted from the OpenCode implementation (004.B–004.G). Capability descriptor, generic conformance suite, and reference adapter implemented. Both OpenCode and reference adapter pass the same generic conformance suite. Contract is not coupled to OpenCode — proven by reference adapter with zero OpenCode imports.

---

## 2. What Was Proved

| Area | Tests | Verdict |
|------|-------|---------|
| Contract Definition | 7 | PASS |
| Capability Descriptor | 7 | PASS |
| OpenCode Conformance | 61 (59 pass, 2 skip) | PASS |
| Reference Conformance | 61 (59 pass, 2 skip) | PASS |
| Contract Decoupling | 7 | PASS |
| Versioning | 3 | PASS |
| **Total** | **146** | **PASS** |

---

## 3. Provider Contract (v0.1.0)

### Required Capabilities (10)
1. `identity_correlation` — task_id/work_order_id validated
2. `event_production` — DPT event vocabulary
3. `evidence_recording` — DPT evidence vocabulary
4. `authority_enforcement` — envelope-based auth
5. `permission_envelope` — role-scoped permissions
6. `failure_reporting` — classified failures
7. `recovery_state` — rehydration records
8. `completion_idempotency` — single completion
9. `cross_wo_isolation` — no authority leaks
10. `human_gate_preservation` — gates cannot be bypassed

### Optional Capabilities (11)
native_event_stream, session_recovery, subagent_isolation, dynamic_permission_materialization, capability_plane, abort_support, restart_support, cleanup_support, health_check, structured_results, provider_config_materialization

### Safety Invariants (10 mandatory)
All 10 invariants enforced across both adapters.

---

## 4. Capability Descriptor

Machine-readable provider capabilities with three levels:
- `SUPPORTED` — fully implemented
- `PARTIAL` — partially implemented
- `UNSUPPORTED` — not implemented

OpenCode honest descriptor:
- `native_event_stream`: **PARTIAL** (event.subscribe returns empty stream)
- All 10 required capabilities: **SUPPORTED**

---

## 5. Conformance Suite

Generic test harness with 12 categories:
DESC, SAFETY, CONTROL, AUTH, EXEC, SUB, EVID, FAIL, RECOV, ISOL, DUR, COMP

Same suite runs against OpenCode and reference adapter — no provider-specific shortcuts.

---

## 6. Reference Adapter

Mock provider implementing the contract with ZERO OpenCode imports. Proves:
- Contract is genuinely provider-neutral
- Conformance suite is not coupled to OpenCode
- SDK is not mandated by generic contract
- MCP is not mandated by generic contract

---

## 7. Files Delivered

| File | Purpose |
|------|---------|
| `providers/contract/provider-contract.mjs` | Provider-neutral contract (vocabulary, invariants) |
| `providers/contract/capability-descriptor.mjs` | Machine-readable capability descriptor |
| `providers/contract/conformance-suite.mjs` | Generic test harness (12 categories) |
| `providers/opencode/opencode-adapter.mjs` | OpenCode adapter implementing contract |
| `providers/reference/reference-adapter.mjs` | Reference adapter (no OpenCode dependency) |
| `providers/test-conformance.mjs` | Conformance test harness |

---

## 8. Final Output

```
TASK_ID:                              DPT-PROVIDER-005
PROVIDER_CONTRACT_IMPLEMENTED:        YES
PROVIDER_CONTRACT_VERSION:            0.1.0
CAPABILITY_DESCRIPTOR_IMPLEMENTED:    YES
CONFORMANCE_SUITE_IMPLEMENTED:        YES
CONFORMANCE_SUITE_VERSION:            0.1.0
REQUIRED_OPTIONAL_CAPABILITIES_DEFINED: YES
CAPABILITY_DEGRADATION_SUPPORTED:     YES
SAFETY_INVARIANTS_ENFORCED:           PASS
OPENCODE_PROVIDER_CONFORMANCE:        PASS
OPENCODE_EVENT_CAPABILITY:            PARTIAL
REFERENCE_PROVIDER_IMPLEMENTED:       YES
REFERENCE_PROVIDER_CONFORMANCE:       PASS
GENERIC_CONFORMANCE_HARNESS:          PASS
CONTRACT_OPENCODE_COUPLING:           NO
SDK_REQUIRED_BY_GENERIC_CONTRACT:     NO
MCP_REQUIRED_BY_GENERIC_CONTRACT:     NO
DPT_DURABLE_STATE_SOURCE_OF_TRUTH:    YES
PROVIDER_CAN_DEFINE_HUMAN_GATE:       NO
PROVIDER_CAN_SELF_VERIFY:             NO
CROSS_WORK_ORDER_AUTHORITY_LEAK:      NO
PERMISSION_SCOPE_BROADENED:           NO
WORK_CODEX_REQUIRED:                  NO
OPENAI_REQUIRED:                      NO
INDEPENDENT_REVIEW:                   PASS
REPORT_PERSISTED:                     YES
REPORT_READ_BACK_VERIFIED:            YES
TASK_STATUS:                          CLOSED
NEXT_TASK:                            DPT-PROVIDER-006
HUMAN_GATE_REQUIRED:                  NO
```

---

**Closed by**: Opencode Agent
**Chain**: 003.C → 004.A → 004.B → 004.C → 004.D → 004.E → 004.F → 004.G → 005 (ALL CLOSED)
