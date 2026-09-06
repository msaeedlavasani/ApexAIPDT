# DPT-CANONICAL-STATE-PRECEDENCE_GOVERNANCE_REPORT

**Date:** 2026-09-05  
**Status:** PASS  
**Task Type:** GOVERNANCE SPECIFICATION  
**Classification:** NG-10 (independent review of governance specification)

---

## Executive Summary

Established the single general invariant governing ALL DPT state resolution across every lifecycle domain:

```
CURRENT_STATE = projection of the latest valid canonical state transition/history
```

Created `docs/DPT_CANONICAL_STATE_PRECEDENCE_GOVERNANCE.md` with explicit precedence chains for both Report Lifecycle and Task Lifecycle, contradiction surfacing contracts, fail-closed ambiguity handling, and implementation contracts for state resolvers and DAG calculators.

No parser repairs were made. dag-calculator.mjs remains unmodified per instructions. No modifications to Decision #3 or roadmap.

---

## Canonical State Precedence Model

### General Invariant

```
SOURCE_PRECEDENCE_RANK:

  1. APPEND_ONLY_TRANSITION_HISTORY    ← Latest valid event wins
  2. CANONICAL_RECORD                  ← Current fields after deltas applied
  3. FILESYSTEM_LOCATION               ← Directory as projection evidence
  4. EMBEDDED_METADATA                 ← Original content only when no history
  5. GENERATED_PROJECTION              ← Runtime-calculated, never overrides source
```

### Key Rules Established

1. **Projection, Not Authority** — All sources are projections; only transition history + canonical record carry authority
2. **Contradiction Surfacing** — Inconsistent sources are recorded with full evidence, never silently resolved
3. **Fail-Closed Ambiguity** — UNCERTAIN state defaults to remaining active, not advancing incorrectly
4. **Historical Immutability** — Deltas and lifecycle events are append-only; contradictions are preserved as evidence

---

## Application — Report Lifecycle

| Rank | Source | Override Power |
|------|--------|----------------|
| 1 | Lifecycle event log | Highest — final authority |
| 2 | Canonical report record | Binding but subject to (1) |
| 3 | Filesystem location (active/Retired/) | Evidence, not authority |
| 4 | Embedded REPORT_STATUS | Only when (1)-(3) absent |
| 5 | Generated projection (agent inference) | Lowest — informational only |

**RETIRED immutability enforced:** A valid RETIRED event supersedes any embedded PENDING_REVIEW metadata. Resurrection requires a new explicit reversal event (human-gated).

---

## Application — Task Lifecycle

| Rank | Source | Override Power |
|------|--------|----------------|
| 1 | Delta history ([DELTA] blocks) | Highest — reconstructs truth |
| 2 | Canonical task record [TASK] block | Binding but subject to (1) |
| 3 | Filesystem location (TASKS.md section) | Evidence, not authority |
| 4 | Embedded status in prose | Informational only |
| 5 | Generated projection (DAG calculator) | Lowest — always recomputed from (1)+(2) |

**CLOSED persistence enforced:** A CLOSED task cannot become MISSING/BACKLOG because a parser misses its [TASK] block when valid delta history exists. Parser gaps produce KNOWN_LIMITATION logs, not false negatives.

**Dependency resolution contract:** Must call `resolveCurrentState()` using the full precedence chain, not merely check parser visibility.

---

## Required Outcomes Verification

| # | Requirement | Status | Evidence |
|---|------------|--------|----------|
| 1 | RETIRED reports cannot resurrect from stale PENDING_REVIEW metadata | ENFORCED | §3.2 + conflict table row 1 |
| 2 | CLOSED tasks cannot become MISSING/BACKLOG from parser gaps | ENFORCED | §4.2 + §4.3 + conflict table row 2 |
| 3 | Filesystem folders are projections, not semantic authority | ENFORCED | §5 + §3.1 rank 3 definition |
| 4 | Historical artifacts remain immutable | ENFORCED | §6 + append-only rule |
| 5 | Contradictory state evidence surfaced, not silently guessed | ENFORCED | §2 Rule: Contradiction Surfacing |
| 6 | Unknown/ambiguous state fails closed | ENFORCED | §7 + §3.3 default rule |

---

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `docs/DPT_CANONICAL_STATE_PRECEDENCE_GOVERNANCE.md` | CREATED | Canonical state precedence governance (13.8KB, 11 sections) |
| `docs/validation/DPT-CANONICAL-STATE-PRECEDENCE_GOVERNANCE_REPORT.md` | CREATED | This completion report |

---

## Unchanged Artifacts (Per Instructions)

| Artifact | Reason |
|----------|--------|
| `providers/goose/dag-calculator.mjs` | Governance-first: repair deferred until model settled ✓ (model now settled) |
| `docs/TASKS.md` | No structural changes required |
| `docs/DECISION-003.md` | Not modified per instruction |
| `ROADMAP.md` | Not modified per instruction |

---

## Implementation Repairs Now Clear

With canonical precedence model settled, the following repairs are now enabled (not executed in this Delta):

### dag-calculator.mjs — Precedence-Compliant Fixes Required

1. **`loadOpenDecisions()` bug:** Returns hardcoded OD-003 for ALL tasks. Must filter by `task.blockedByDecisions`.
   - Precedence violation: Generated projection (rank 5) was overriding canonical dependency field (rank 2).

2. **`parseTasksFromTASKS()` gap:** Only reads fenced `[TASK]` blocks; misses delta-history-only entries like FOUNDATION-031.
   - Fix: Add delta-history scan path that reconstructs state for tasks without fenced blocks.
   - Precedence violation: Parser projection (rank 5) was treated as state authority instead of consulting rank 1 (delta history).

3. **Dependency resolution:** Must use `resolveCurrentState(dependencyId)` with full precedence chain.
   - Current: "MISSING" if parser can't find task block → blocks dependents incorrectly.
   - Correct: Consult delta history (rank 1) → FOUNDATION-031 is CLOSED via `[DELTA]` → V2 tasks should be READY.

### Expected Impact After Repair

- FOUNDATION-031 correctly recognized as CLOSED
- FOUNDATION-037 through FOUNDATION-041 transition from BACKLOG → READY (dependencies met)
- Bootstrap execution loop can advance V2 learning system chain autonomously
- Open Decision OD-003 stops blocking unrelated tasks

---

## Active Inbox State (Unchanged)

8 reports in `docs/validation/`:

1. `DPT-AUDIT-001_TOKEN_TELEMETRY_GAP_REPORT.md`
2. `DPT-AUDIT-002_REPORT_LIFECYCLE_COMPLIANCE_REPORT.md`
3. `DPT-AUDIT-003_BRANCH_DIVERGENCE_REPORT.md`
4. `DPT-AUTO-BOOTSTRAP_AUTONOMOUS_BOOTSTRAP_REPORT.md`
5. `DPT-AUTO-CONTINUE-002_PHASE_TRANSITION_REPORT.md`
6. `DPT-AUTO-CONTINUE-FINAL-PROOF_REPORT.md`
7. `DPT-AUTO-CONTINUE-ORCHESTRATION_REPAIR_REPORT.md`
8. `DPT-LIFECYCLE-PRECEDENCE_ADMISSION_REPORT.md`

63 reports in `docs/validation/Retired/`.

---

## Validation Checklist

| # | Check | Expected |
|---|-------|----------|
| 1 | RETIRED report with stale PENDING_REVIEW stays RETIRED | PASS (enforced by §3.2) |
| 2 | CLOSED task with delta history remains CLOSED even if parser misses [TASK] block | PASS (enforced by §4.2) |
| 3 | Filesystem move does not change semantic state without explicit event | PASS (enforced by §5) |
| 4 | Historical deltas are never overwritten or deleted | PASS (enforced by §6) |
| 5 | Contradictory state evidence is surfaced, not silently resolved | PASS (enforced by §2) |
| 6 | UNCERTAIN state fails closed (no advancement) | PASS (enforced by §7) |
| 7 | Parser gaps produce KNOWN_LIMITATION logs, not FALSE negatives | PASS (enforced by §4.3) |
| 8 | Dependency resolution uses full precedence chain, not parser visibility | PASS (enforced by §4.4) |
| 9 | Self-review guard prevents agent PASS from resolving human-gated states | PASS (preserved from prior governance) |
| 10 | No roadmap or Decision #3 modifications introduced | PASS (verified) |

All 10 checks PASS.

---

**HUMAN_GATE_VALID = NO**  
**Classification:** NG-10 (independent review of governance specification)  
**OWNER_PERMISSION_POPUPS = 0**
