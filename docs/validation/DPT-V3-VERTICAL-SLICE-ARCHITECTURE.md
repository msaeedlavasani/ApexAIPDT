# DPT — V3 Vertical-Slice Architecture Planning
**Report Date:** 2026-09-06  
**Status:** PLANNING_COMPLETE  
**Classification:** NG-10 + NG-02  
**Dependency:** Consumes DPT-PHASE7_ARCHITECTURE_REVIEW_REPORT

---

## Executive Summary

This planning artifact defines the corrected V3 vertical-slice architecture for DPT's external project integration capability. The spine proves full chain end-to-end using an external project/repository before layering governed execution, contribution, and propagation subsystems.

**Key architectural corrections applied:**
- Mechanism-neutral enrollment progression (no trust token exchange assumption)
- Front = project-bound ROLE/AGENT_INSTANCE (does NOT own Project Intelligence)
- Gateway = deterministic SERVICE (enforces protocol boundary)
- Analyst = COGNITIVE ROLE (not inherently human; Human Gate applies only per HG-01..HG-07)
- V3-SPINE-E2E acceptance MUST use project external to ApexAIPDT

---

## Corrected V3 Spine Decomposition

### Task Record Projection

| Task ID | Title | Dependencies | Acceptance Criteria |
|---------|-------|--------------|---------------------|
| V3-001 | External Project Fixture + Identity/Trust Binding | (none) | Complete identity establishment, authentication, and trust binding with external project |
| V3-002 | Scout + Project-Owned PI Runtime | V3-001 | Scout discovers and binds to external project's Project Intelligence |
| V3-003 | Minimum-Sufficient Context Package | V3-002 | Bounded context package extracted and validated against privacy boundaries |
| V3-004 | Front Runtime + Gateway Boundary Service | V3-003 | Front operates within gateway-enforced protocol boundary |
| V3-005 | DPT Analysis + Bounded Result + Project Readback | V3-004 | Analysis completes within authority bounds; result readable by external project |
| V3-SPINE-E2E | End-to-End Verification | V3-005 | Full chain verified using project/repository EXTERNAL to ApexAIPDT |
| V3-006 | Governed Project Execution | V3-SPINE-E2E | Authority modes 0-5 operational with Human Gate enforcement |
| V3-007 | Contribution Candidate → Independent Review → Pool Admission | V3-006 | Cross-project contribution pipeline with independent review gate |
| V3-008 | Update Propagation (Reference Transport) | V3-007 | One reference transport validated for update propagation |

### Dependency Shape

```
V3-001 → V3-002 → V3-003 → V3-004 → V3-005 → V3-SPINE-E2E
                                                    │
                                                    ▼
                                              V3-006 → V3-007 → V3-008
```

**Parallelization opportunities:**
- V3-001 through V3-005 can have preparatory work in parallel (schema design, ADRs)
- V3-SPINE-E2E is the gating milestone — no layering until passed
- V3-006, 007, 008 are sequential (each depends on E2E proof)

---

## Architectural Principles Preserved

### 1. Mechanism-Neutral Enrollment Progression

```
Identity Establishment → Authentication → Trust Binding → Gateway Admission
```

No assumptions about specific token formats, cryptographic primitives, or exchange protocols. The progression is defined by observable state transitions, not implementation mechanisms.

### 2. Front vs Gateway Distinction

| Aspect | Front | Gateway |
|--------|-------|---------|
| Nature | Project-bound ROLE/AGENT_INSTANCE | Deterministic SERVICE |
| Scope | Single project context | Protocol boundary enforcement |
| Intelligence | Does NOT own Project Intelligence | Stateless policy enforcement |
| Lifecycle | Tied to project membership | Always available when protocol active |

**Invariant:** Front agent instance is projected FROM Scout-discovered Project Intelligence; it does not generate or own that intelligence.

### 3. Analyst as Cognitive Role

Analyst is a COGNITIVE ROLE that performs analysis. Human-in-the-loop is NOT default behavior. Human Gate applies ONLY when canonical governance (HG-01..HG-07) requires it for the specific operation class.

### 4. External Project Requirement for E2E

V3-SPINE-E2E acceptance MUST use a project/repository external to ApexAIPDT. Self-testing against ApexAIPDT itself violates the independence principle and creates circular trust assumptions.

---

## FOUNDATION-037 Scope Preservation

| Aspect | Status | Rationale |
|--------|--------|-----------|
| INTERVENTION_MEASUREMENT_PROJECTION | RUNTIME_PROVEN | Implemented in providers/goose/intervention-measurement.mjs, 66/66 tests PASS |
| LIVE_EXECUTION_INSTRUMENTATION | NOT_YET_PROVEN | Explicitly out of scope for FOUNDATION-037; requires separate task with different acceptance criteria |

**ADR-052 compliance:** Event projection on audit trail, no new persistence layer.

---

## Validation State

- **FOUNDATION-037:** CLOSED (state_revision 40) — Premature closure corrected, runtime implemented
- **FOUNDATION-038:** CLOSED (state_revision 4) — No valid reopening event
- **FOUNDATION-039:** CLOSED (state_revision 1) — No valid reopening event
- **FOUNDATION-040:** CLOSED (state_revision 1) — No valid reopening event
- **FOUNDATION-041:** CLOSED (state_revision 1) — No valid reopening event

**DAG Rule Enforced:** TASK_CLOSED + NO_VALID_REOPEN_EVENT → NOT_READY_FOR_EXECUTION

---

## Phase 7 Report Lifecycle Transition

This V3 planning artifact consumes the Phase 7 architecture review with no unresolved attention. The Phase 7 report will transition through canonical REPORT_RETIRED lifecycle:

1. **Current:** docs/validation/DPT-PHASE7_ARCHITECTURE_REVIEW_REPORT.md (REVIEW_COMPLETE)
2. **Next:** Move to docs/validation/Retired/ with closure notation
3. **Invariant:** Report retirement is independent of task closure

---

## Classification

**Report Status:** PLANNING_COMPLETE  
**Recommendation:** AWAIT_AUTHORIZATION_FOR_V3_ADMISSION  
**Classification:** NG-02 + NG-10  
**OWNER_PERMISSION_POPUPS:** 0
