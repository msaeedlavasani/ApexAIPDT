# DPT Report Lifecycle Governance

**Status:** ACCEPTED  
**Date:** 2026-09-05  
**Classification:** NG-02 (writing artifacts) + NG-10 (independent review)

---

## Purpose

Establish canonical semantics for DPT validation/completion/reconciliation report lifecycle, ensuring clear distinction between:

1. **Task completion** (execution evidence, test results, runtime proof)
2. **Report review** (Owner/designated reviewer attention, corrective action, acknowledgment)

These are separate lifecycle domains. Task closure ≠ Report retirement.

---

## Core Invariant

```
TASK_COMPLETION != REPORT_REVIEW_COMPLETION
TASK_CLOSED != REPORT_RETIRED
```

---

## Directory Semantics

### `docs/validation/` — ACTIVE INBOX

Contains reports that still require:
- Review attention
- Corrective follow-up
- Acknowledgement
- Another unresolved report-level action

**Default creation location for NEW reports.**

### `docs/validation/Retired/` — COMPLETED REPORT HISTORY

Contains reports for which no further report-level attention is required.

**NOT a default creation location.** Only the destination for retirement-eligible reports.

---

## Report Lifecycle States

```
PENDING_REVIEW
    ↓
REVIEWED
    ↓
┌─────────────────────┐
│ NO_FURTHER_ATTENTION │ ← RETIRED
│ REQUIRED             │
└─────────────────────┘
         ↓
    ACTION_REQUIRED
         ↓
   CORRECTIVE WORK / RE-REVIEW
         ↓
    NO_FURTHER_ATTENTION_REQUIRED
         ↓
        RETIRED
```

### State Definitions

| State | Meaning | Directory |
|-------|---------|-----------|
| PENDING_REVIEW | New report created, awaiting review | `docs/validation/` |
| REVIEWED | Review completed, awaiting attention decision | `docs/validation/` |
| ACTION_REQUIRED | Review identified needed corrections | `docs/validation/` |
| NO_FURTHER_ATTENTION_REQUIRED | Review complete, no action needed | `docs/validation/` → moving to `Retired/` |
| RETIRED | Report archived, no further attention required | `docs/validation/Retired/` |

---

## Retirement Eligibility

A report may enter `Retired/` ONLY when:

```
RETIREMENT_ELIGIBLE =
    REQUIRED_REVIEW_COMPLETED
    AND
    ACTION_REQUIRED == FALSE
```

### Critical Guards

1. **Self-review guard**: An agent's statement "all validation checks PASS" does NOT prove NO_FURTHER_ATTENTION_REQUIRED = TRUE.

2. **Independent review guard**: "INDEPENDENT_REVIEW = PASS" does not necessarily mean the Owner/designated report consumer has completed their required attention.

3. **Fail-closed behavior**: UNCERTAIN REVIEW STATE → KEEP IN `docs/validation/`

4. **No automatic retirement**: TASK_COMPLETION ≠ REPORT_RETIREMENT. A CLOSED task with PASS tests does not automatically retire its report.

---

## Creation Rules

### NEW REPORT DEFAULT

Unless explicitly proven otherwise:

```
NEW REPORT
→ PENDING_REVIEW
→ docs/validation/
```

### FORBIDDEN INFERENCE

The agent MUST NOT infer:

```
"Previous reports are in Retired/"
→ "New report should also be created in Retired/"
```

Location of historical reports is evidence of prior retirement, NOT a template for new report creation.

### TEMPLATE DISCOVERY RULE

When searching for examples/templates:

- Active and retired reports may BOTH be consulted for structure/history
- But location MUST NOT be copied as lifecycle intent

Example:
- ✅ Found template: `docs/validation/Retired/OLD_REPORT.md`
- ✅ Using its structure for guidance: ALLOWED
- ❌ Creating: `docs/validation/Retired/NEW_REPORT.md`: NOT ALLOWED unless independently retirement-eligible

---

## Metadata Requirements

Minimum semantic metadata for report lifecycle:

| Field | Values | Required |
|-------|--------|----------|
| `REPORT_STATUS` | PENDING_REVIEW, REVIEWED, ACTION_REQUIRED, NO_FURTHER_ATTENTION_REQUIRED, RETIRED | Yes |
| `REVIEW_REQUIRED` | TRUE, FALSE | Yes |
| `REVIEW_STATUS` | PENDING, IN_PROGRESS, COMPLETED | Conditional |
| `ACTION_REQUIRED` | TRUE, FALSE | Yes |
| `RETIREMENT_ELIGIBLE` | TRUE, FALSE | Yes |

Exact serialization/storage follows existing repository conventions (markdown frontmatter or document header).

---

## Append-Only Lineage

Report lifecycle history must remain traceable. When moving reports between directories:

**DO NOT:**
- Overwrite historical evidence
- Erase original creation records
- Remove previous location tracking

**DO:**
- Preserve creation metadata
- Record review outcome
- Document corrective actions
- Maintain retirement event traceability

Example lineage preservation:

```
CREATED: docs/validation/NAME.md @ 2026-09-05T03:15:00Z
REVIEWED: @ 2026-09-05T04:00:00Z by [reviewer]
ACTION_REQUIRED: FALSE
RETIRED: docs/validation/Retired/NAME.md @ 2026-09-05T04:01:00Z
```

---

## Human Gate Classification

| Operation | Human Gate? | Rationale |
|-----------|-------------|-----------|
| Creating a report | NO | Standard artifact production (NG-02) |
| Moving a deterministically retirement-eligible report | NO | Automated lifecycle transition |
| Marking ACTION_REQUIRED | NO | Agent determination based on review criteria |
| Resolving ACTION_REQUIRED | CONDITIONAL | May require Owner decision if uncertain |

A Human Gate exists only if existing governance genuinely requires a human decision that cannot be satisfied autonomously.

---

## Reconciliation of Misplaced Reports

Reports created in `Retired/` before this governance was established must be reconciled:

### Current Misplaced Reports

| Report | Created In | Should Be In | Action |
|--------|-----------|--------------|--------|
| DPT-BRAIN-UNIVERSAL_COGNITION_DOCS_REPORT.md | Retired/ | validation/ | Move to active inbox |
| DPT-DECISION-CANONICALIZATION_REPORT.md | Retired/ | validation/ | Move to active inbox |

### Reconciliation Rule

If required review/attention has not been durably recorded as complete:
- Move report to `docs/validation/`
- Set REPORT_STATUS = PENDING_REVIEW
- Preserve all contents and history
- Do NOT rewrite to pretend they were never created in Retired/

---

## Automatic Retirement — Future Behavior

Once deterministic governance proves all conditions, DPT may auto-retire reports:

```
REPORT GENERATED
    ↓
ACTIVE INBOX (docs/validation/)
    ↓
REVIEW
    ↓
CORRECTION IF REQUIRED
    ↓
REVIEW COMPLETE
    ↓
AUTO-RETIRE
    ↓
COMPLETED HISTORY (docs/validation/Retired/)
```

Current governance does NOT yet permit broad autonomous retirement. Default remains:
- New reports → `docs/validation/`
- Retirement requires explicit NO_FURTHER_ATTENTION_REQUIRED evidence

---

## Cross-References

- `docs/APEX_AI_DPT_CONSTITUTION.md` — Constitutional Invariants
- `docs/DPT_TASK_SYSTEM.md` — Task lifecycle (separate from report lifecycle)
- `docs/DPT_OPEN_DECISIONS.md` — Open decisions backlog
- `ROADMAP.md` — Roadmap status

---

## Validation Checklist

| # | Check | Expected |
|---|-------|----------|
| 1 | New reports default to `docs/validation/` | PASS |
| 2 | `Retired/` is not treated as creation directory | PASS |
| 3 | Task PASS/CLOSED does not auto-retire report | PASS |
| 4 | Review PASS does not auto-retire when attention exists | PASS |
| 5 | ACTION_REQUIRED reports remain active | PASS |
| 6 | Unknown review state remains active | PASS |
| 7 | Retirement requires NO_FURTHER_ATTENTION_REQUIRED | PASS |
| 8 | Historical reports not overwritten | PASS |
| 9 | Report movement preserves lifecycle lineage | PASS |
| 10 | Template discovery cannot redirect output to Retired/ | PASS |
| 11 | Misplaced reports reconciled correctly | PENDING |
| 12 | No runtime execution behavior changed | PASS |
| 13 | No roadmap phase advanced | PASS |
| 14 | No Open Decision silently resolved | PASS |

---

**HUMAN_GATE_VALID = NO**  
**Classification:** NG-02 (writing artifacts) + NG-10 (independent review)  
**OWNER_PERMISSION_POPUPS = 0**
