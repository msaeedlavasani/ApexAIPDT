# DPT Open

**REPORT_STATUS:** PENDING_REVIEW Decisions Canonicalization Report

**Date**: 2026-09-05
**Status**: PASS
**Task Type**: STATE RECONCILIATION
**Classification**: NG-02/NG-10 (writing artifacts + independent review)

---

## Summary

Canonicalized two accepted architecture decisions in `docs/DPT_OPEN_DECISIONS.md`:

- Decision #1 (Project Intelligence) — **OPEN → ACCEPTED**
- Decision #2 (Scout Discovery Strategy) — **OPEN → ACCEPTED**
- Decision #3 (Agent vs Skill boundary) — **remains OPEN**

---

## Changes Made

### File Modified
`docs/DPT_OPEN_DECISIONS.md`

### Additions

1. **New "Accepted Decisions" section** added after document header, before "Priority 1 — Core architecture"
2. **Decision #1 canonical model** fully documented with:
   - 13 core rules
   - PROJECT_CONTEXT → BOUNDED_PROCESSING → RESULT_RETURNED → PROJECT_CONTEXT_DISCARDED invariant
   - REUSABLE_DISCOVERY → CONTRIBUTION_CANDIDATE → REVIEW → ACCEPTED → DPT_POOL contribution path
   - Explicit prohibition: NO direct PROJECT_CONTEXT → DPT_POOL
3. **Decision #2 canonical model** fully documented with:
   - Core invariant: SCOUT MAY KNOW THE PROJECT BROADLY; DPT MAY RECEIVE THE PROJECT NARROWLY
   - 16 core rules
   - Operational pattern for INITIAL, ONGOING, and DPT REQUEST flows
4. **Backlog annotations** added:
   - Decision #1: "✅ ACCEPTED" with date and canonical model summary
   - Decision #2: "✅ ACCEPTED" with date and canonical model summary
   - Decision #3: "**Status:** OPEN (unchanged)" explicit marker

---

## Validation Checklist

| # | Check | Result |
|---|-------|--------|
| 1 | Decision #1 explicitly ACCEPTED | PASS — canonical model documented, ✅ ACCEPTED marker added |
| 2 | Decision #2 explicitly ACCEPTED | PASS — canonical model documented, ✅ ACCEPTED marker added |
| 3 | Decision #3 still OPEN | PASS — explicitly marked "Status: OPEN (unchanged)" |
| 4 | Project Data Boundary preserved | PASS — Rule #1-#7, #13 preserved; contribution path explicit |
| 5 | Scout broad discovery vs narrow transfer distinction preserved | PASS — Core invariant documented; Discovery Scope ≠ Transfer Scope |
| 6 | No runtime changes | PASS — no .mjs files modified |
| 7 | No roadmap advancement | PASS — ROADMAP.md unchanged |
| 8 | No historical report overwrite | PASS — new report created, no existing reports modified |
| 9 | Working architecture doc unchanged | PASS — `docs/architecture/DPT_BRAIN_AND_UNIVERSAL_COGNITION.md` not modified |

---

## Key Architecture State Preserved

### Decision #1 — Project Intelligence
- Project Intelligence belongs to the connected Project
- Persistent Project Intelligence remains project-side
- DPT requests only minimum sufficient context
- Context transferred to DPT is ephemeral by default
- Central DPT Pools must not silently absorb project artifacts/data
- Project Intelligence does not create execution authority

### Decision #2 — Scout Discovery Strategy
- Scout operates project-side
- Initial discovery is comprehensive
- Primary output is local Project Intelligence Foundation, not central DPT copy
- DPT has no default persistent copy
- Only relevant bounded slice is transferred
- Incremental refresh after initial discovery
- Change detection identifies affected areas for targeted rescans

### Decision #3 — Agent vs Skill Boundary
- Remains OPEN
- No canonical model added
- No state change

---

## Files Changed

| File | Action |
|------|--------|
| `docs/DPT_OPEN_DECISIONS.md` | MODIFIED (Accepted Decisions section added, #1 and #2 annotated) |
| `docs/validation/Retired/DPT-DECISION-CANONICALIZATION_REPORT.md` | NEW (this report) |

---

## Cross-References

- `docs/DPT_OPEN_DECISIONS.md` — Source document (modified)
- `docs/architecture/DPT_BRAIN_AND_UNIVERSAL_COGNITION.md` — Working architecture (unchanged)
- `docs/APEX_AI_DPT_CONSTITUTION.md` — Article 26 (Project Intelligence is evidence-backed and incremental)
- `docs/DPT_PROJECT_INTELLIGENCE.md` — Project Intelligence model

---

## Notes

- No implementation details invented
- No ADRs fabricated
- No historical evidence modified
- No runtime behavior changed
- No roadmap advancement
- Decision #3 remains explicitly OPEN
- Canonical models preserve all core rules and invariants from the DELTA specification
- Exact storage technology/schema serialization remains implementation-open (as specified)
- Exact scanner implementation/tooling remains implementation-open (as specified)

---

**HUMAN_GATE_VALID = NO**
**Classification**: NG-02 (writing artifacts) + NG-10 (independent review)
**OWNER_PERMISSION_POPUPS = 0**
