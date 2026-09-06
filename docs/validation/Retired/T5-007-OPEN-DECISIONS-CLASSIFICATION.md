# T5-007 — Open Decisions Classification

**Task ID:** T5-007  
**Parent Phase:** Phase 5 (V2 Learning System Architecture)  
**Status:** COMPLETE  
**Date:** 2026-09-06  

---

## OBJECTIVE

Reconcile the canonical open-decision backlog (OD-01 through OD-26) with the V2 roadmap. Classify each decision by impact on V2 implementation.

---

## CLASSIFICATION METHODOLOGY

| Category | Definition | Impact |
|----------|-----------|--------|
| BLOCKING_V2 | Must be resolved before ANY V2 work begins | Halts entire phase |
| TASK_LOCAL_BLOCKER | Must be resolved before specific task begins | Halts individual task |
| NON_BLOCKING_V2 | Can be resolved during implementation | No halt |
| DEFER_TO_V3 | Requires V2 implementation evidence | Postpone to V3 |
| ALREADY_RESOLVED_ELSEWHERE | Resolved in Phase 1-4 | No action needed |

---

## CLASSIFICATION RESULTS

### OD-01 through OD-14 (Resolved in Phase 1-4)

| OD | Title | Classification | Resolution |
|----|-------|---------------|------------|
| OD-01 | Project Intelligence ownership | ALREADY_RESOLVED_ELSEWHERE | ADR-010, Decision #1 |
| OD-02 | Scout discovery strategy | ALREADY_RESOLVED_ELSEWHERE | ADR-003, Decision #2 |
| OD-03 | Design-time vs runtime ontology | ALREADY_RESOLVED_ELSEWHERE | ADR-029, Decision #3 |
| OD-04 | Determinism routing | ALREADY_RESOLVED_ELSEWHERE | ADR-029 |
| OD-05 | Authority stack layers | ALREADY_RESOLVED_ELSEWHERE | ADR-033 |
| OD-06 | Front Agent lifecycle | ALREADY_RESOLVED_ELSEWHERE | ADR-030 |
| OD-07 | Gateway architecture | ALREADY_RESOLVED_ELSEWHERE | ADR-007/008 |
| OD-08 | Verification independence | ALREADY_RESOLVED_ELSEWHERE | ADR-035 |
| OD-09 | Pool architecture | ALREADY_RESOLVED_ELSEWHERE | ADR-049 |
| OD-10 | Retry/cancellation/revocation | ALREADY_RESOLVED_ELSEWHERE | ADR-036 |
| OD-11 | Task graph mutation | ALREADY_RESOLVED_ELSEWHERE | ADR-037 |
| OD-12 | Integration authorization | ALREADY_RESOLVED_ELSEWHERE | ADR-038 |
| OD-13 | Authority > capability > availability | ALREADY_RESOLVED_ELSEWHERE | ADR-040 |
| OD-14 | Idempotency ≠ dedup | ALREADY_RESOLVED_ELSEWHERE | ADR-041 |

**Count:** 14 ALREADY_RESOLVED_ELSEWHERE

### OD-15 through OD-26 (New or Deferred)

| OD | Title | Classification | Rationale |
|----|-------|---------------|-----------|
| OD-15 | Comparison/evaluation framework | DEFER_TO_V3 | Requires cross-project data from V2 |
| OD-16 | Runtime packaging | ALREADY_RESOLVED_ELSEWHERE | Deferred per Decision #26 |
| OD-17 | Persistence model | ALREADY_RESOLVED_ELSEWHERE | Deferred per Decision #26 |
| OD-18 | Agent-provider integration | ALREADY_RESOLVED_ELSEWHERE | Deferred per Decision #26 |
| OD-19 | Transport protocols | ALREADY_RESOLVED_ELSEWHERE | Frozen in V1 (ADR-052) |
| OD-20 | Deployment topology | ALREADY_RESOLVED_ELSEWHERE | Frozen in V1 (ADR-052) |
| OD-21 | Intervention duration granularity | TASK_LOCAL_BLOCKER | Required for T5-001 implementation |
| OD-22 | Improvement signal granularity | NON_BLOCKING_V2 | Resolve during T5-001 |
| OD-23 | Cross-project pattern matching | DEFER_TO_V3 | Depends on V2 evidence |
| OD-24 | Overflow threshold | TASK_LOCAL_BLOCKER | Required for T5-002 implementation |
| OD-25 | Multi-turn handling | NON_BLOCKING_V2 | Resolve during T5-002 |
| OD-26 | Contribution threshold | TASK_LOCAL_BLOCKER | Required for T5-005 implementation |

**Count:** 
- BLOCKING_V2: 0
- TASK_LOCAL_BLOCKER: 3 (OD-21, OD-24, OD-26)
- NON_BLOCKING_V2: 2 (OD-22, OD-25)
- DEFER_TO_V3: 2 (OD-15, OD-23)
- ALREADY_RESOLVED_ELSEWHERE: 12 (OD-16 through OD-20, plus resolved earlier)

---

## SUMMARY

| Category | Count |
|----------|-------|
| BLOCKING_V2 | 0 |
| TASK_LOCAL_BLOCKER | 3 |
| NON_BLOCKING_V2 | 2 |
| DEFER_TO_V3 | 2 |
| ALREADY_RESOLVED_ELSEWHERE | 19 |
| **TOTAL** | **26** |

**Conclusion:** Zero BLOCKING_V2 decisions. All V2 tasks are spec-definition work within accepted ADR boundaries. Phase 5 can proceed autonomously.

---

## OPEN DECISIONS REQUIRING RESOLUTION

| OD | Title | Category | By When |
|----|-------|----------|---------|
| OD-21 | Intervention duration granularity | TASK_LOCAL_BLOCKER | Before T5-001 implementation |
| OD-24 | Overflow threshold | TASK_LOCAL_BLOCKER | Before T5-002 implementation |
| OD-26 | Contribution threshold | TASK_LOCAL_BLOCKER | Before T5-005 implementation |

These three will be resolved during their respective task implementations.

