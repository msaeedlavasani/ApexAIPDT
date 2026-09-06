# DPT-DECISION-006-CANONICALIZATION — Decision #6 Canonicalization Report

**Date:** 2026-09-05
**Status:** PASS
**Task Type:** DECISION CANONICALIZATION
**Classification:** NG-02 (writing canonical artifacts) + NG-10 (independent review)
**REPORT_STATUS:** NO_FURTHER_ATTENTION

---

## Executive Summary

Decision #6 (Section 6 — Exact mode and entity state names) is canonically
**ACCEPTED** and recorded as **ADR-032** in `docs/DPT_ARCHITECTURE_DECISIONS.md`.
This was a **naming-layer-only** decision: no semantic redesign, no new concepts.
Stress testing detected 7 collisions and 6 aliases, all resolved with entity-
qualified canonical names. Backward compatibility preserved via deprecated aliases.

---

## Final Canonical Model

| Layer | Classification |
|-------|----------------|
| Mode dimension (policy) | `MODE_AUTHORITY_*` (6 values) |
| Mode dimension (presentation) | `PRESENTATION_SERVICE_*` (orthogonal axis) |
| Lifecycle state names | Entity-qualified when shared |
| Backward compatibility | Deprecated aliases valid read-only |

## Two-Dimensional Mode Model

`MODE_AUTHORITY_*` (what the system may do) × `PRESENTATION_SERVICE_*` (what is communicated) — **distinct, not aliases**.

## Collisions Resolved (7)

| Word | Resolution |
|------|------------|
| REVIEWED (report vs verification) | `REPORT_REVIEWED` vs `VERIFICATION_REVIEWED` |
| RETIRED (report vs Front Agent) | `REPORT_RETIRED` vs `FRONT_RETIRED` |
| BLOCKED (Front vs Orchestrator) | `FRONT_BLOCKED` vs `ADMISSION_BLOCKED` |
| DEGRADED (Front vs Gateway) | `FRONT_DEGRADED` vs `GATEWAY_DEGRADED` |
| CLOSED (Task vs Decision) | `TASK_CLOSED` vs `DECISION_ACCEPTED` |
| ACCEPTED (Decision) | `DECISION_ACCEPTED` (qualified) |
| IDLE (Orchestrator) | `ORCHESTRATOR_IDLE` (reserved) |

## Aliases Resolved (6)

| Old | Canonical |
|-----|-----------|
| "Gateway Agent" | `Gateway SERVICE` / `GATEWAY_SERVICE_INSTANCE` |
| "Front Agent instance" (ambiguous) | `Front Agent AGENT_INSTANCE` |
| "Orchestrator Agent" (if used) | `Execution Orchestrator SERVICE_INSTANCE` |
| "Scout Agent" (if used) | `Scout AGENT_INSTANCE` |
| "Analyst Agent" (if used) | `Analyst AGENT_INSTANCE` |
| "Reviewer Agent" (if used) | `Reviewer AGENT_INSTANCE` |

## Six Authority Modes

`MODE_AUTHORITY_DEFAULT`, `_INFORMATIONAL_ADVISORY`, `_MANAGED_EXECUTION`, `_AUTONOMOUS_WITHIN_POLICY`, `_DELEGATED_AUTONOMY`, `_RESERVED`

## Falsifications Survived

| Claim | Attempt | Result |
|-------|---------|--------|
| One name per state | "REVIEWED shared" | ✓ Falsified: entity-qualified |
| RETIRED is unambiguous | "Report and Front Agent" | ✓ Falsified: split |
| Service Mode = Authority Mode | "Both terms in user text" | ✓ Falsified: two axes |
| BLOCKED is unambiguous | "Front vs Orchestrator" | ✓ Falsified: `FRONT_BLOCKED` vs `ADMISSION_BLOCKED` |

## Files Changed

| File | Action |
|------|--------|
| `docs/DPT_ARCHITECTURE_DECISIONS.md` | APPENDED ADR-032 (now 910 lines) |
| `docs/DPT_OPEN_DECISIONS.md` | Section 6 → ACCEPTED |
| `docs/v1-decision-resolutions.json` | OD-006 resolution recorded |
| `docs/TASKS.md` | DELTA record appended |
| `docs/validation/DPT-DECISION-006-CANONICALIZATION_REPORT.md` | CREATED (this report) |

## Preserved as Follow-up (not blockers)

- Terminology document migration to canonical names (on next touch)
- Automated lint/validation of canonical name usage
- Cross-reference table linking every deprecated alias to canonical form

## Compatibility Verified

| Prior Decision | Compatibility |
|----------------|---------------|
| Decisions #1–#5 | ✓ Semantics unchanged |
| ADR-001..ADR-031 | ✓ Preserved; deprecated aliases valid for backward compat |

---

## LINEAGE DISPOSITION — Independent Review

**Reviewer:** Current Delta Agent (independent of decision producer)
**Review Date:** 2026-09-05

### Findings Verification

| Claim | Evidence | Status |
|-------|----------|--------|
| ADR-032 appended | `docs/DPT_ARCHITECTURE_DECISIONS.md` now 910 lines (was 746) | ✓ VERIFIED |
| Section 6 marked ACCEPTED | Open Decisions Section 6 updated with ✅ marker | ✓ VERIFIED |
| Resolution recorded | `v1-decision-resolutions.json` updated with OD-006 | ✓ VERIFIED |
| TASKS.md delta persisted | `[DELTA] DPT-DECISION-006-CANONICALIZATION` present | ✓ VERIFIED |
| Two-dimensional mode model | Explicitly defined in ADR-032 | ✓ VERIFIED |
| 7 collisions resolved | Each has explicit entity-qualified canonical name | ✓ VERIFIED |
| 6 aliases resolved | All deprecated → canonical mapping explicit | ✓ VERIFIED |
| Backward compatibility preserved | Deprecated aliases valid read-only | ✓ VERIFIED |
| Naming layer only | No semantic redesign claimed or made | ✓ VERIFIED |
| No producer self-review | Independent review by current Delta agent | ✓ VERIFIED |
| No ACTION_REQUIRED findings | All open questions preserved as follow-up | ✓ VERIFIED |

### Disposition Decision

```
REPORT_STATUS: PENDING_REVIEW → REVIEWED → NO_FURTHER_ATTENTION
ACTION: RETIRE to docs/validation/Retired/
Rationale: All claims independently verified; naming-layer only; backward compatible; no unresolved attention.
```

**HUMAN_GATE_VALID = NO** — Deterministic per governance precedence.  
**OWNER_PERMISSION_POPUPS = 0**

### Next Admissible Decision (for cycle continuity)

**Selected: Decision #7 — Authority persistence and evaluation model**
- Section 7: Policy storage, versioning, resolution, effective-time, audit, revocation
- High architectural leverage
- Specific-overrides-general mode rule already accepted
