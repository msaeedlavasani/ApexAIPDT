# DPT Canonical State Precedence Governance

**Status:** ACCEPTED  
**Date:** 2026-09-05  
**Classification:** NG-10 (independent review)  
**Supersedes:** Section 5 precedence gaps in `DPT_REPORT_LIFECYCLE_GOVERNANCE.md`

---

## 1. Purpose

Establish the single general invariant governing ALL DPT state resolution across every lifecycle domain:

```
CURRENT_STATE = projection of the latest valid canonical state transition/history
```

Historical embedded metadata, file location, generated projections, or incomplete
parser views MUST NOT override later valid state evidence.

This resolves contradictions between:
- What a report/task *says* (embedded metadata)
- What happened to a report/task (transition history)
- Where a report/task *is* (filesystem projection)
- What a runtime *calculates* (generated projection)

---

## 2. General Invariant — Canonical State Precedence

```
SOURCE_PRECEDENCE_RANK:

  1. APPEND_ONLY_TRANSITION_HISTORY    ← Latest valid event wins
  2. CANONICAL_RECORD                  ← Current fields after deltas applied
  3. FILESYSTEM_LOCATION               ← Directory as projection evidence
  4. EMBEDDED_METADATA                 ← Original content only when no history
  5. GENERATED_PROJECTION              ← Runtime-calculated, never overrides source
```

### Rule: Projection, Not Authority

Every source listed above is a **projection** of underlying state, not the
authoritative source itself. Only the **append-only transition/delta history**
plus the **canonical record it produces** carry authority.

When projections contradict each other, the rank order applies:
- Higher rank silences lower rank without deletion
- All contradictory evidence is SURFACED (never silently guessed away)
- The contradiction itself becomes evidence requiring human attention

### Rule: Contradiction Surfacing

When two or more sources yield inconsistent CURRENT_STATE determinations:

```
CONTRADICTION = {
  sources: [<list of conflicting sources>],
  projections: [<conflicting state values>],
  resolution: <highest-rank winner>,
  surfacing_required: true,
  human_attention_trigger: true
}
```

The system MUST record the contradiction in the applicable ledger and flag
human attention. It MUST NOT silently choose a value without recording the conflict.

### Rule: Fail-Closed Ambiguity

When no valid transition/delta history exists AND embedded metadata is ambiguous
OR multiple conflicting projections exist with no clear resolution path:

```
UNCERTAIN_STATE → REMAIN_IN_ACTIVE_INBOX
UNCERTAIN_TASK → REMAIN_IN_CURRENT_STATE (no advancement)
```

Failure mode defaults to keeping work active rather than incorrectly advancing it.

---

## 3. Application — Report Lifecycle

### 3.1 Precedence Chain for Reports

| Rank | Source | What It Represents | Override Power |
|------|--------|--------------------|----------------|
| 1 | Lifecycle event log | Append-only sequence of status transitions | Highest — final authority |
| 2 | Canonical report record | Current fields after applying all deltas | Binding but subject to (1) |
| 3 | Filesystem location | Active inbox vs. Retired/ directory | Evidence of (1) and (2), not authority |
| 4 | Embedded REPORT_STATUS | Original markdown metadata field | Only consulted when (1)-(3) are absent |
| 5 | Generated projection | Agent-inferred status from PASS/failure counts | Lowest — informational only |

### 3.2 RETIRED Immutability (Outcome 1)

```
A RETIRED report CANNOT be reactivated by any lower-rank source.

FORBIDDEN RESURRECTION PATTERNS:
  - Embedded REPORT_STATUS = PENDING_REVIEW but valid RETIRED event exists → RESPECT RETIRED
  - File moved from Retired/ to validation/ with stale PENDING_REVIEW in content → MOVE BACK TO RETIRED
  - Parser generates "PENDING_REVIEW" projection from report text → IGNORE, use event log

VALID TRANSITION FROM RETIRED REQUIRES:
  - New explicit RETIREMENT_REVERSAL event (human-gated, logged)
  - OR discovery of FRAUDULENT_RETIREMENT evidence (investigation required)
```

### 3.3 PENDING_REVIEW Default Rule

When NO lifecycle event history exists AND no canonical record fields are set:

```
DEFAULT = PENDING_REVIEW
DEFAULT_LOCATION = docs/validation/
```

This default applies ONLY when all higher-rank sources are absent. It does NOT
override existing history or records.

### 3.4 Self-Review Guard (Preserved)

```
AGENT_PASS ≠ NO_FURTHER_ATTENTION_REQUIRED
INDEPENDENT_REVIEW_PASS ≠ HUMAN_OWNER_ATTENTION_COMPLETE
```

Agent-generated projections (rank 5) cannot resolve human-gated states on their own.
The latest valid lifecycle event (rank 1) must reflect independent owner action.

---

## 4. Application — Task Lifecycle

### 4.1 Precedence Chain for Tasks

| Rank | Source | What It Represents | Override Power |
|------|--------|--------------------|----------------|
| 1 | Delta history ([DELTA] blocks) | Append-only sequence of state changes | Highest — reconstructs truth |
| 2 | Canonical task record [TASK] block | Current fields after deltas applied | Binding but subject to (1) |
| 3 | Filesystem location | docs/TASKS.md position/structure | Evidence of (1) and (2), not authority |
| 4 | Embedded task status in prose | Narrative mentions outside structured fields | Informational only |
| 5 | Generated projection | DAG calculator readiness computation | Lowest — always recomputed from (1)+(2) |

### 4.2 CLOSED Persistence (Outcome 2)

```
A CLOSED task CANNOT become MISSING or BACKLOG merely because a parser cannot
locate its [TASK] block when valid delta history EXISTS.

FORBIDDEN STATE regressions:
  - Parser sees no [TASK] block → assumes MISSING → flags dependent tasks blocked
  - Valid [DELTA] shows RUNNING→CLOSED → IGNORES delta because parser can't find parent [TASK]
  - Delta history says CLOSED but embedded metadata prose says something else → RESPECT DELTA

CORRECT BEHAVIOR:
  1. Parse ALL [DELTA] blocks for the task_id
  2. Reconstruct state by applying deltas in order to base_state_revision
  3. Cross-reference with [TASK] block if present (but do not require it)
  4. If delta history + canonical record agree → that IS the CURRENT_STATE
  5. If they disagree → SURFACE CONTRADICTION (see §2 Rule: Contradiction Surfacing)
```

### 4.3 Parser Gap Handling

When a parser component (e.g., `parseTasksFromTASKS()`) cannot ingest a
validly-recorded task due to format limitations (delta-only entry without
fenced [TASK] block):

```
PARSER_GAPS ≠ STATE_IMPOSSIBLE

The system records the gap as a KNOWN_LIMITATION, not as evidence that the
task does not exist or is not CLOSED. Downstream components must consult
the full delta history, not just their own parsed view.
```

### 4.4 Dependency Resolution with Canonical Precedence

```
dependency_status(task_A, task_B):
  IF task_B has valid delta showing CLOSED at highest state_revision → CLOSED
  ELSE IF task_B has valid delta showing another terminal state → that state
  ELSE IF task_B [TASK] block exists with status field → that status (subject to delta check)
  ELSE IF no history and no block → UNCERTAIN → FAIL_CLOSED (BLOCKED for dependency purposes)
  
REJECTED: dependency_status based solely on whether a parser "sees" task_B
```

---

## 5. Filesystem as Projection (Outcome 3)

```
FILESYSTEM_LOCATION IS PROJECTION EVIDENCE, NOT SEMANTIC AUTHORITY.

docs/validation/*.md     → CURRENT_PROJECT (no semantic weight alone)
docs/validation/Retired/*.md → COMPLETED_HISTORY (evidence of retirement, not creation site)
docs/TASKS.md            → Canonical task surface (authoritative WHEN correctly parsed)

MOVED REPORTS retain their lifecycle history regardless of destination directory.
MOVED TASKS retain their delta history regardless of which section of TASKS.md they appear in.

Directory changes MUST be recorded as delta/lifecycle events, not assumed from position.
```

---

## 6. Historical Artifact Immutability (Outcome 4)

```
APPEND_ONLY_RULE:

Existing deltas, lifecycle events, and canonical records MUST NEVER be:
  - Overwritten
  - Deleted
  - Rewritten to remove contradictions
  - Silently corrected

CONTRADICTIONS ARE PRESERVED AS EVIDENCE:

If a later delta contradicts an earlier one, the contradiction is SURFACED.
Resolution requires a new explicit delta (e.g., state_revision N+1 correcting N)
with human-gated review if the contradiction is material.

The raw delta log IS the audit trail. Corruption of the log is the highest-severity failure mode.
```

---

## 7. Unknown/Ambiguous State — Fail-Closed (Outcome 6)

```
AMBIGUITY_HANDLING:

When canonical state cannot be determined:

  REPORT ambiguity:
    → Remain in docs/validation/ as PENDING_REVIEW
    → Log ambiguity reason in report metadata
    → Require human review before any advancement
    
  TASK ambiguity:
    → Remain in current state (no advancement, no regression)
    → Log ambiguity reason in delta history
    → Flag as BLOCKED for dependents until resolved
    
  SYSTEM ambiguity (contradictory sources with no clear winner):
    → Surface CONTRADICTION record
    → Halt autonomous advancement
    → Require human attention
```

---

## 8. Explicit Precedence Table — Conflict Resolution

| Conflict Scenario | Winner | Loser | Action |
|-------------------|--------|-------|--------|
| RETIRED event vs. embedded PENDING_REVIEW | RETIRED event (rank 1) | Embedded metadata (rank 4) | Keep in Retired/; surface contradiction |
| Delta shows CLOSED vs. parser sees no [TASK] block | Delta (rank 1) | Parser projection (rank 5) | Reconstruct from deltas; log parser limitation |
| Task in Retired/ vs. embedded OPEN status | Retired/ location (rank 3) + any closure event (rank 1) | Embedded status (rank 4) | Keep retired; require reversal event to reactivate |
| Two deltas for same revision number | Later-applied delta | Earlier-delta (same revision) | Record contradiction; require human resolution |
| Generated readiness=READY but delta shows BLOCKED | Delta (rank 1) | Generation (rank 5) | Block execution; surface contradiction |
| File moved from Retired/ to validation/ with no reversal delta | Valid retirement event (rank 1) | Filesystem position (rank 3) | Move back to Retired/; log unauthorized relocation |

---

## 9. Implementation Contracts

### 9.1 Canonical State Resolver Contract

Any component computing CURRENT_STATE for any entity MUST follow this algorithm:

```
function resolveCurrentState(entityId):
  history = loadAppendOnlyHistory(entityId)       // rank 1
  record = loadCanonicalRecord(entityId)          // rank 2
  location = loadFilesystemLocation(entityId)     // rank 3
  metadata = loadEmbeddedMetadata(entityId)        // rank 4
  projection = loadGeneratedProjection(entityId)   // rank 5
  
  // Step 1: Apply history to reconstruct canonical state
  if history.length > 0:
    reconstructed = applyDeltaChain(history, record.base_state)
    if reconstructed.conflictsWith(record):
      surfaceContradiction(entityId, history, record, "HISTORY_RECORD_MISMATCH")
    return reconstructed
  
  // Step 2: Fall back to canonical record fields
  if record.fieldsAreComplete():
    return record.currentState()
  
  // Step 3: Use filesystem as projection evidence
  if location.isIn('Retired/') and recordHasClosureEvent():
    return { status: 'RETIRED', source: 'location_with_history' }
  
  // Step 4: Check embedded metadata only as last resort
  if metadata.has('REPORT_STATUS') or metadata.has('status'):
    return { status: metadata.status, source: 'embedded_metadata_default' }
  
  // Step 5: Fail closed
  return { status: 'UNCERTAIN', source: 'fail_closed', action: 'HUMAN_ATTENTION_REQUIRED' }
```

### 9.2 Delta Calculator Contract (dag-calculator.mjs compliance)

```
loadOpenDecisions() MUST filter by task.blockedByDecisions, NOT return all open decisions.

parseTasksFromTASKS() MUST ALSO scan [DELTA] blocks for task_ids that lack
a corresponding [TASK] block, reconstructing their state from delta history.

Dependency resolution MUST call resolveCurrentState(dependencyId) using the
full precedence chain, NOT merely check whether parseTasksFromTASKS() found
a [TASK] block.
```

---

## 10. Validation Checklist

| # | Check | Expected |
|---|-------|----------|
| 1 | RETIRED report with stale PENDING_REVIEW metadata stays RETIRED | PASS |
| 2 | CLOSED task with delta history remains CLOSED even if parser misses [TASK] block | PASS |
| 3 | Filesystem move does not change semantic state without explicit event | PASS |
| 4 | Historical deltas are never overwritten or deleted | PASS |
| 5 | Contradictory state evidence is surfaced, not silently resolved | PASS |
| 6 | UNCERTAIN state fails closed (no advancement) | PASS |
| 7 | Parser gaps produce KNOWN_LIMITATION logs, not FALSE negatives | PASS |
| 8 | Dependency resolution uses full precedence chain, not parser visibility | PASS |
| 9 | Self-review guard prevents agent PASS from resolving human-gated states | PASS |
| 10 | No roadmap or Decision #3 modifications introduced | PASS |

---

## 11. Cross-References

- `docs/APEX_AI_DPT_CONSTITUTION.md` — Constitutional Invariants (Article 11: Authority is explicit)
- `docs/DPT_REPORT_LIFECYCLE_GOVERNANCE.md` — Report lifecycle specific rules
- `docs/DPT_TASK_SYSTEM.md` — Task lifecycle, delta convention, READY rule
- `docs/TASKS.md` — Canonical task ledger (source of truth for Task Lifecycle)
- `docs/validation/DPT-LIFECYCLE-PRECEDENCE_ADMISSION_REPORT.md` — Prior precedence application report

---

**HUMAN_GATE_VALID = NO** (this is a governance specification; enforcement is automated per contracts in §9)  
**Classification:** NG-10 (independent review of governance specification)  
**OWNER_PERMISSION_POPUPS = 0**  
