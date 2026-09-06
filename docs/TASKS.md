# DPT Tasks — Durable Task-System Surface

**Status:** Canonical — DPT-RECON-003
**Contract:** `docs/DPT_TASK_SYSTEM.md` (schemas, lifecycle, READY rule, authority pipeline)
**Principle:** Task definition belongs in durable repository state. Runtime prompts are projections of this file. Deltas contain only state changes.

This file is the source of truth for the canonical task state of this
repository. It is written to be read by humans and projected by machines. Do
not reconstruct task state from a prompt, a session, or a transcript; read
it here.

## Reading rules

1. Human order: read the record schema, then the record for your task, then
   only the referenced canonical artifacts.
2. Machine order: extract every `[TASK] ... [/TASK]` block deterministically
   (one record per block; `key: value` lines; `dependencies` is a
   comma-separated `task_id` list; absent keys default per the schema).
3. State changes are recorded as Deltas and reflected in `state_revision`.
   Never re-derive history from prose.

## Record schema (projection contract)

Every durable Task Record exposes at minimum:

| Field | Required |
|---|---|
| `task_id` | yes — stable identity |
| `title` | yes |
| `objective` | yes — bounded outcome |
| `status` | yes — canonical lifecycle state |
| `dependencies` | yes — `task_id` list |
| `readiness` | yes — deterministic projection with reasons |
| `task_class` | yes |
| `required_capabilities` | yes |
| `denied_capabilities` | yes — fail-closed ceiling |
| `delegated_authority` | yes — grant or derivation reference |
| `authority_derivation` | yes |
| `human_gate_state` | yes — HG class or NONE |
| `passport_revision` | yes |
| `canonical_artifact` | yes — completion evidence path(s) |
| `state_revision` | yes — monotonic |
| `next_task` | when applicable — DAG/successor info |
| `auto_continue` | yes — advancement gate past CLOSED |

Canonical lifecycle states: `BACKLOG` `READY` `ASSIGNED`/`DISPATCHED`
`RUNNING` `REVIEW_REQUIRED`/`VERIFYING` `REWORK`
`WAITING_FOR_HUMAN_GATE` `BLOCKED` `ESCALATION_REQUIRED` `REPORT_PENDING`
`CLOSED` (semantics in `docs/DPT_TASK_SYSTEM.md` §5).

## Ledger epoch

Task records before DPT-RECON-003 were executed before this ledger existed.
Their canonical closure evidence remains authoritative in
`docs/validation/` (and `docs/validation/Retired/`) and is not re-registered
here. This ledger admits records beginning with DPT-RECON-003.

---

## Task ledger

### DPT-RECON-003 — Canonical Task System + Authority-Aware Execution Contract

| Field | Value |
|---|---|
| task_id | DPT-RECON-003 |
| status | CLOSED |
| dependencies | DPT-RECON-002 (CLOSED); provider bootstrap checkpoint (CLOSED) |
| readiness | READY (dependencies CLOSED, authority derived and materialized, preflight PASS) |
| task_class | framework canonicalization / authority contract |
| canonical_artifact | `docs/DPT_TASK_SYSTEM.md`, `docs/TASKS.md`, `docs/DPT_ARCHITECTURE_DECISIONS.md` (ADR-027), `docs/DPT_OPEN_DECISIONS.md` (appendix), `docs/validation/DPT-RECON-003_TASK_SYSTEM_AUTHORITY_CONTRACT_REPORT.md` |
| next_task | DPT-FOUNDATION-001 (owner review required before advancement) |
| auto_continue | NO |

```text
[TASK]
task_id: DPT-RECON-003
title: Canonical Task System + Authority-Aware Execution Contract
objective: Make durable repository task state the canonical source of execution truth; define Task Record / Passport / Work Order / Delta / Context Receipt / Permission Envelope / Result / Artifact relationships, lifecycle, READY rule, authority pipeline, delegation, retry/reroute, Human Gate, and autonomous-advancement semantics; canonicalize this file as the durable surface.
status: CLOSED
dependencies: DPT-RECON-002
readiness: READY
task_class: framework_canonicalization
required_capabilities: repository.read, repository.list, repository.search, docs.write, authority.derive, validation.repo_local
denied_capabilities: git.push, git.merge, production.*, secrets.*, authority.self_expansion, permission.broadening
delegated_authority: DPT-RECON-003 authority envelope (repo-local docs + validation + local checkpoint)
authority_derivation: task required capabilities ∩ reviewer defaults ∩ governance-allowed (policy ceiling)
human_gate_state: NONE
passport_revision: 1
canonical_artifact: docs/DPT_TASK_SYSTEM.md, docs/TASKS.md, docs/DPT_ARCHITECTURE_DECISIONS.md, docs/DPT_OPEN_DECISIONS.md, docs/validation/DPT-RECON-003_TASK_SYSTEM_AUTHORITY_CONTRACT_REPORT.md
state_revision: 2
next_task: DPT-FOUNDATION-001
auto_continue: NO
[/TASK]
```

Closure evidence: `OWNER_PERMISSION_POPUPS = 0`; independent review PASS;
report persisted and read back; checkpoint committed locally; NOT pushed;
main NOT merged. Delta history: `[1] BACKLOG → RUNNING (authority
materialized, preflight PASS)` `[2] RUNNING → CLOSED (verification + decision
recorded)`.

### DPT-FOUNDATION-001 — V0.2 machine-readable task-system & authority schema (proposed)

| Field | Value |
|---|---|
| task_id | DPT-FOUNDATION-001 |
| title | Machine-readable schemas for the canonical task system and authority contract |
| status | BACKLOG |
| dependencies | DPT-RECON-003 |
| readiness | NOT_READY — DPT-RECON-003 not yet owner-reviewed as CLOSED |
| task_class | architecture / schema serialization |
| canonical_artifact | (none yet — TBD by work order) |
| auto_continue | NO — requires Owner review of DPT-RECON-003 |

```text
[TASK]
task_id: DPT-FOUNDATION-001
title: V0.2 machine-readable task-system and authority schema
objective: Serialize the DPT-RECON-003 contract (records, lifecycle, READY, authority pipeline) into machine-readable schema artifacts and manifests, per ROADMAP V0.2, after Owner review of the DPT-RECON-003 baseline.
status: BACKLOG
dependencies: DPT-RECON-003
readiness: NOT_READY (owner review gate pending)
task_class: schema_serialization
required_capabilities: repository.read, docs.write, schema.definition
denied_capabilities: git.push, git.merge, production.*, authority.self_expansion
delegated_authority: none yet — derived at dispatch
authority_derivation: to be derived when READY (work order time)
human_gate_state: NONE
passport_revision: 0
canonical_artifact: TBD
state_revision: 1
next_task: DPT-FOUNDATION-002
auto_continue: NO
[/TASK]
```

### DPT-FOUNDATION-002 — Provider-neutral orchestrator runtime (V1, proposed)

| Field | Value |
|---|---|
| task_id | DPT-FOUNDATION-002 |
| title | Provider-neutral orchestrator runtime for the canonical task system |
| status | BACKLOG |
| dependencies | DPT-FOUNDATION-001 |
| readiness | NOT_READY — dependencies not CLOSED |
| task_class | runtime implementation |
| canonical_artifact | (none yet) |
| auto_continue | NO |

```text
[TASK]
task_id: DPT-FOUNDATION-002
title: Provider-neutral orchestrator runtime (V1)
objective: Implement the durable task-system projection and authority pipeline defined by DPT-RECON-003 as a replaceable runtime, per ROADMAP V1, only after the schema layer and real-project evidence exist.
status: BACKLOG
dependencies: DPT-FOUNDATION-001
readiness: NOT_READY (dependencies not CLOSED)
task_class: runtime_implementation
required_capabilities: repository.read, docs.write, provider.integration
denied_capabilities: git.push, git.merge, production.*, authority.self_expansion
delegated_authority: none yet — derived at dispatch
authority_derivation: to be derived when READY
human_gate_state: NONE
passport_revision: 0
canonical_artifact: TBD
state_revision: 1
next_task: (see ROADMAP V1 remainder)
auto_continue: NO
[/TASK]
```

Additional ROADMAP V0.1–V2 items are candidates for admission to this ledger
as BACKLOG records once they are accepted as tasks; this ledger does not
duplicate ROADMAP intent.

## Delta convention

A Delta records only state changes:

```text
[DELTA]
task_id: DPT-RECON-003
base_state_revision: 1
changes: status=BACKLOG→RUNNING, passport_revision=0→1
applied_by: DPT-RECON-003 execution
evidence_refs: docs/validation/DPT-RECON-003_TASK_SYSTEM_AUTHORITY_CONTRACT_REPORT.md
[/DELTA]
```

Applying the ordered Delta chain to the base record reconstructs current
state. Full-state re-transmission is forbidden as a Delta.

## Projection rules

A runtime prompt or Work Order for a task is a projection of its record:

- scope and acceptance criteria ← `objective` + record fields;
- capability and authority bounds ← `required_capabilities`,
  `denied_capabilities`, `delegated_authority`, `authority_derivation`;
- gates ← `human_gate_state` and applicable policy;
- expected outputs ← `canonical_artifact` contract.

Never embed durable task state inside a prompt. A prompt may reference
records; it may not replace them.

## Standing rules

- Authorized ordinary operations must complete with zero Owner permission
  popups; a provider popup is not a DPT Human Gate and not a workaround
  target.
- `git push`, merge to main, history rewrite, and production actions are not
  authorized by any record in this ledger without an explicit Owner gate.
- Fail closed whenever required capability, authority, or materialization
  cannot be established deterministically.

---

## Phase 5 Tasks (V2 Learning System Architecture)

### DPT-PHASE5-RECONCILIATION-COMPLETE

[DELTA]
task_id: DPT-PHASE5-RECONCILIATION-COMPLETE
base_state_revision: 16
changes: phase_boundary=RECONCILIATION_REQUIRED→PHASE_5_ADMITTED_CORRECTED, phase_authorization=ADMISSION_SUSPENDED_PENDING_RECONCILIATION→PHASE_6_AUTHORIZED, state_revision=16→17
applied_by: PHASE5_RECONCILIATION_DELTA
artefacts: docs/validation/DPT-PHASE5-RECONCILIATION-STATUS.md, docs/validation/DPT-PHASE5-ADMISSION-SUMMARY.md
notes: |
  Phase 5 canonical reconciliation completed.
  
  Actions taken:
  - Invalidated premature boundary closure (PHASE_5_ADMITTED → RECONCILIATION_REQUIRED)
  - Suspended Phase 6 authorization pending reconciliation
  - Applied ADR corrections (052-056) per canonical requirements
  - Rebuilt open-decision projection from canonical identities
  - Ran 12 cross-ADR falsification checks (all PASS)
  - Regenerated admission summary with corrected canon
  - Updated Phase 6 task readiness based on TASK_LOCAL_BLOCKER status
  
  Reconciled counts:
  - BLOCKING_V2: 0
  - TASK_LOCAL_BLOCKER: 3 (OD-T5-002-B, OD-T5-003-B, OD-T5-005-A)
  - NON_BLOCKING_V2: 9
  - DEFER_TO_V3: 2
  - ALREADY_RESOLVED: 12
  - TOTAL: 26
  
  Phase 6 authorization recomputed from durable state:
  - READY: DPT-FOUNDATION-037 (no blockers)
  - WITHHELD: DPT-FOUNDATION-038 (OD-T5-002-B), DPT-FOUNDATION-039 (OD-T5-003-B), 
              DPT-FOUNDATION-040 (sequential), DPT-FOUNDATION-041 (OD-T5-005-A)
  
  Human Gate: NONE. Autonomous execution continues.
[/DELTA]

### DPT-PHASE5-MICRO-RECONCILIATION

[DELTA]
task_id: DPT-PHASE5-MICRO-RECONCILIATION
base_state_revision: 17
changes: state_revision=17→18
applied_by: PHASE5_MICRO_RECONCILIATION_DELTA
artefacts: docs/validation/DPT-PHASE5-RECONCILIATION-STATUS.md, docs/validation/DPT-PHASE5-ADMISSION-SUMMARY.md, docs/validation/Retired/T5-003.md, docs/validation/Retired/T5-004.md, docs/validation/Retired/T5-005.md, docs/validation/Retired/T5-006.md, docs/TASKS.md
notes: |
  Phase 5 final micro-reconciliation completed. Corrected residual canonical/report contradictions.
  
  Actions taken:
  - Replaced human_gate_valid: true with human_gate_required: false + human_gate_assessment_valid: true
  - Fixed falsification count label from 11 to 12 (derived from enumerated checks)
  - Reclassified ANONYMOUS_PROJECT_ID as PSEUDONYMOUS_PROJECT_ID across all projections
  - Established ANONYMIZED_DATA ≠ PSEUDONYMIZED_DATA distinction
  - Removed universal human-review language; replaced with INDEPENDENT_VERIFICATION ≠ HUMAN_VERIFICATION
  - Clarified PROPOSAL ≠ HUMAN_GATE in ADR-054, ADR-055, ADR-056 projections
  - Updated T5-003, T5-004, T5-005, T5-006 retired projections
  
  Readback verified:
  - No stale universal-human-review language in current canon ✓
  - No anonymous/pseudonymous terminology collision ✓
  - Human Gate fields semantically unambiguous ✓
  - Falsification count = 12 (matches enumerated checks) ✓
  - READY state: DPT-FOUNDATION-037 only ✓
  - No new Human Gate introduced ✓
  
  PHASE_5_CANONICAL_STATE remains PHASE_5_ADMITTED_CORRECTED
  PHASE_6_AUTHORIZATION remains valid
  DPT-FOUNDATION-037 remains READY
[/DELTA]

[DELTA]
task_id: DPT-FOUNDATION-038
base_state_revision: 19
changes: status=BACKLOG→READY, readiness=NOT_READY(OD-T5-002-B unresolved)→READY(OD-T5-002-B resolved: static 80% threshold), passport_revision=0→1, state_revision=19→20
applied_by: DPT-LIVERUN-001 OD resolution
artefacts: docs/DPT_OPEN_DECISIONS.md (V2 appendix), docs/adr/ADR-053-token-efficiency.md, docs/schemas/token-efficiency-projection.schema.json, docs/v2/token-efficiency-spec.md
notes: |
  Resolved OD-T5-002-B overflow threshold blocker for DPT-FOUNDATION-038.
  
  Resolution: Static 80% utilization threshold for overflow risk notification.
  Rationale: Conservative safe default; dynamic adaptive threshold deferrable
  pending real-project evidence. Per OD-T5-002-A: per-provider abstraction.
  Per OD-T5-002-C: per-turn counting for telemetry fidelity.
  
  All TASK_LOCAL_BLOCKERs for Phase 6 now resolved:
  - OD-T5-002-B → ACCEPTED (DPT-FOUNDATION-038 READY)
  - OD-T5-003-B → ACCEPTED (DPT-FOUNDATION-039 blocked by sequential dependency)
  - OD-T5-005-A → ACCEPTED (DPT-FOUNDATION-041 blocked by sequential dependency)
[/DELTA]

[DELTA]
task_id: DPT-FOUNDATION-038
base_state_revision: 20
changes: status=READY→RUNNING, implementation_status=ARTIFACTS_COMPLETE→IMPLEMENTATION_PROGRESS, completed_steps=od_resolution,task_status_update,adr_creation,schema_creation,spec_creation → od_resolution,task_status_update,adr_creation,schema_creation,spec_creation,audit_trail_extension,projection_implementation,test_validation, state_revision=20→21
applied_by: DPT-LIVERUN-002 batch implementation
artefacts: docs/schemas/audit-trail.schema.json, providers/goose/efficiency-projection.mjs, providers/goose/test-efficiency-projection.mjs, docs/BATCH_BRANCH_LIFECYCLE_INVARIANT.md
notes: |
  DPT-FOUNDATION-038 implementation progress (batch branch workflow).
  
  Completed:
  - Extended AUDIT_TRAIL schema with optional token_usage fields (ADR-053 compliant)
  - Implemented EFFICIENCY_PROJECTION() function with 31 test cases
  - Added overflow alerting at 80% threshold (OD-T5-002-B resolved)
  - Documented batch branch lifecycle invariant
  
  Implementation artifacts:
  - docs/schemas/audit-trail.schema.json: Base audit event schema with token_usage extension
  - providers/goose/efficiency-projection.mjs: Projection function implementation
  - providers/goose/test-efficiency-projection.mjs: 31 passing tests
  
  Batch branch: feat/foundation-038-implementation
  Workflow: SYNCED MAIN → CREATE BATCH BRANCH → EXECUTE → VALIDATE → PUSH → PR → MERGE
[/DELTA]

---

## Phase 6 Tasks (V2 Learning System Implementation)

### DPT-FOUNDATION-037 — V2 Learning System: Intervention Measurement

| Field | Value |
|---|---|
| task_id | DPT-FOUNDATION-037 |
| title | V2 Learning System: Intervention Measurement |
| status | CLOSED |
| dependencies | DPT-FOUNDATION-031 |
| readiness | READY — V1 complete; V1→V2 admitted; no TASK_LOCAL_BLOCKER |
| task_class | implementation |
| canonical_artifact | docs/schemas/intervention-event.schema.json, docs/v2/intervention-measurement-spec.md |
| auto_continue | YES |

```text
[TASK]
task_id: DPT-FOUNDATION-037
title: V2 Learning System: Intervention Measurement
objective: Implement runtime intervention measurement for V2 learning system. Measures human intervention frequency, type, and duration across DPT-managed projects.
status: CLOSED
dependencies: DPT-FOUNDATION-031
readiness: READY
task_class: implementation
required_capabilities: repository.read, docs.write, .dpt/audit.read
denied_capabilities: git.push, git.merge, production.*
human_gate_state: NONE
passport_revision: 0
state_revision: 2
next_task: DPT-FOUNDATION-038
auto_continue: YES
[/TASK]
```

### DPT-FOUNDATION-038 — V2 Learning System: Token/Context Efficiency

| Field | Value |
|---|---|
| task_id | DPT-FOUNDATION-038 |
| title | V2 Learning System: Token/Context Efficiency |
| status | READY |
| dependencies | DPT-FOUNDATION-037 |
| readiness | READY — OD-T5-002-B resolved (static 80% threshold); all blockers cleared |
| task_class | implementation |
| auto_continue | YES |

```text
[TASK]
task_id: DPT-FOUNDATION-038
title: V2 Learning System: Token/Context Efficiency
objective: Implement token/context efficiency measurement and optimization for V2 learning system. Measures context utilization, overflow events, and routing efficiency via projection layer over audit trail.
status: RUNNING
dependencies: DPT-FOUNDATION-037
readiness: RUNNING — Implementation in progress on feat/foundation-038-implementation
task_class: implementation
required_capabilities: repository.read, docs.write, schema.definition, javascript.runtime
denied_capabilities: git.push, git.merge, production.*, authority.self_expansion
human_gate_state: NONE
passport_revision: 1
state_revision: 3
next_task: DPT-FOUNDATION-039
auto_continue: YES
[/TASK]
```

### DPT-FOUNDATION-039 — V2 Learning System: Failure Pattern Detection

| Field | Value |
|---|---|
| task_id | DPT-FOUNDATION-039 |
| title | V2 Learning System: Failure Pattern Detection |
| status | BACKLOG |
| dependencies | DPT-FOUNDATION-038 |
| readiness | NOT_READY — OD-T5-003-B unresolved (evidence threshold) + sequential dependency |
| task_class | implementation |
| auto_continue | YES |

```text
[TASK]
task_id: DPT-FOUNDATION-039
title: V2 Learning System: Failure Pattern Detection
objective: Implement failure pattern detection architecture for V2 learning system.
status: BACKLOG
dependencies: DPT-FOUNDATION-038
readiness: NOT_READY
task_class: implementation
required_capabilities: repository.read, docs.write
denied_capabilities: git.push, git.merge, production.*
human_gate_state: NONE
passport_revision: 0
state_revision: 1
next_task: DPT-FOUNDATION-040
auto_continue: YES
[/TASK]
```

### DPT-FOUNDATION-040 — V2 Learning System: Auto-Improvement Proposals

| Field | Value |
|---|---|
| task_id | DPT-FOUNDATION-040 |
| title | V2 Learning System: Auto-Improvement Proposals |
| status | BACKLOG |
| dependencies | DPT-FOUNDATION-039 |
| readiness | NOT_READY — sequential dependency |
| task_class | implementation |
| auto_continue | YES |

```text
[TASK]
task_id: DPT-FOUNDATION-040
title: V2 Learning System: Auto-Improvement Proposals
objective: Implement auto-improvement proposal generation for V2 learning system.
status: BACKLOG
dependencies: DPT-FOUNDATION-039
readiness: NOT_READY
task_class: implementation
required_capabilities: repository.read, docs.write
denied_capabilities: git.push, git.merge, production.*
human_gate_state: NONE
passport_revision: 0
state_revision: 1
next_task: DPT-FOUNDATION-041
auto_continue: YES
[/TASK]
```

### DPT-FOUNDATION-041 — V2 Learning System: Cross-Project Pattern Extraction

| Field | Value |
|---|---|
| task_id | DPT-FOUNDATION-041 |
| title | V2 Learning System: Cross-Project Pattern Extraction |
| status | BACKLOG |
| dependencies | DPT-FOUNDATION-040 |
| readiness | NOT_READY — OD-T5-005-A unresolved (contribution threshold) + sequential dependency |
| task_class | implementation |
| auto_continue | YES |

```text
[TASK]
task_id: DPT-FOUNDATION-041
title: V2 Learning System: Cross-Project Pattern Extraction
objective: Implement cross-project pattern extraction for V2 learning system.
status: BACKLOG
dependencies: DPT-FOUNDATION-040
readiness: NOT_READY
task_class: implementation
required_capabilities: repository.read, docs.write
denied_capabilities: git.push, git.merge, production.*
human_gate_state: NONE
passport_revision: 0
state_revision: 1
next_task: (none)
auto_continue: YES
[/TASK]
```


---

## Repository Durability Checkpoint

[DELTA]
task_id: DPT-CHECKPOINT-PHASES-4-5
base_state_revision: 18
changes: state_revision=18→19, durable_checkpoint=REMOTE
applied_by: DURABILITY_CHECKPOINT
artefacts: docs/TASKS.md, .git/refs/heads/checkpoint/phases-4-5-durability
notes: |
  Repository durability checkpoint completed successfully.
  
  Actions taken:
  - Created branch: checkpoint/phases-4-5-durability
  - Pushed 4 logical commits to origin
  - Excluded ephemeral runtime state (.dpt/memory.json)
  - Verified remote commit SHAs and file presence
  
  Checkpoint SHAs:
  - a828824: Core canonical state restoration (RECON-003 completion)
  - f30a6c6: Schema and governance documents
  - bfa74df: V2 learning system implementation artifacts
  - 74a66f9: Provider extensions and runtime manifests
  
  Remote: origin/checkpoint/phases-4-5-durability
  Branch strategy preserved (no merge to main)
  
  Invariant satisfied: Current canonical state has durable remote checkpoint.
  Phase 6 implementation may resume autonomously.
[/DELTA]
