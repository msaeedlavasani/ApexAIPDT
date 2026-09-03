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
