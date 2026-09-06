# Apex AI DPT — Task System & Authority-Aware Execution Contract

**Status:** Accepted architecture direction — DPT-RECON-003 canonicalization
**Scope:** Durable repository task state, canonical task records and schemas, lifecycle, READY rule, authority pipeline, delegation, and closure semantics. No runtime, scheduler, queue, lock service, database schema, or agent-provider integration is specified (specification-first, V0).
**Depends on:** `APEX_AI_DPT_CONSTITUTION.md`, `APEX_AI_DPT_TERMINOLOGY.md`, `DPT_AUTHORITY_MODEL.md`, `DPT_SYSTEM_MODEL.md`, `DPT_EXECUTION_CONTROL_MODEL.md`, `docs/governance/AUTHORITY_PERMISSION_MODEL.md`, `docs/governance/PERMISSION_ENVELOPE.md`, `docs/governance/DYNAMIC_PERMISSION_MATERIALIZATION.md`, `docs/governance/HUMAN_GATE_BOUNDARY.md`, `docs/architecture/OPENCODE_PROVIDER_ADAPTER_ARCHITECTURE.md`, `docs/TASKS.md`
**Decision record:** ADR-027

---

## 1. Canonical principle

> **Task definition belongs in durable repository state. Runtime prompts are
> projections of that state. A Delta contains only state changes.**

A task's execution state must be reconstructable from the repository without
requiring a large runtime prompt, conversation transcript, or ephemeral
session to be replayed. The repository is the source of truth; prompts,
context receipts, and reports are projections or evidence of that state.

This reverses the failure mode repaired for the provider bootstrap path
(DPT-RECON-003 bootstrap checkpoint): an ordinary interactive execution path
that carries authority and task shape only inside the model prompt bypasses
both governance and the DPT-controlled runtime. The canonical task system
makes the durable record the authority-bearing object.

---

## 2. Relationship to existing architecture

This contract does not create parallel vocabulary. It formalizes, as durable
state, the entity model already accepted in `DPT_EXECUTION_CONTROL_MODEL.md`,
the terminology in `APEX_AI_DPT_TERMINOLOGY.md`, the authority semantics in
`DPT_AUTHORITY_MODEL.md` and `docs/governance/AUTHORITY_PERMISSION_MODEL.md`,
and the provider integration path in
`docs/architecture/OPENCODE_PROVIDER_ADAPTER_ARCHITECTURE.md`.

Machine identifiers in this contract match the identifier vocabulary already
implemented by the provider adapter layer (`task_id`,
`task_passport_revision`, `work_order_id`, `work_order_revision`,
`attempt_id`, `envelope_id`, `governance_revision`, `baseline_sha`,
`recovery_generation`, `provider_session_id`). The adapter layer is a
validation implementation of this contract, not the frozen runtime.

`docs/TASKS.md` is the durable task-system surface for this repository: the
canonical ledger that exposes the machine-projectable task state defined
here.

---

## 3. Canonical entities and relationships

```text
                    ┌──────────────────────────────────────────────┐
                    │ Durable Task Record        (docs/TASKS.md)    │
                    │ repository file = source of truth            │
                    └───────────────────────────┬──────────────────┘
                                                │ derives (revisioned)
                                                ▼
                    ┌──────────────────────────────────────────────┐
                    │ Task Passport                                 │
                    │ authority + capability snapshot for execution │
                    └───────────────────────────┬──────────────────┘
                                                │ scopes
                                                ▼
                    ┌──────────────────────────────────────────────┐
                    │ Work Order      (bounded assignment)          │
                    └───────────────────────────┬──────────────────┘
                                                │ one execution =
                                                ▼
                    ┌──────────────────────────────────────────────┐
                    │ Attempt → Delta → Result / Handoff            │
                    └───────────────────────────┬──────────────────┘
                                                │ evaluated against
                                                ▼
   Context Receipt ──► Permission Envelope ──► Verification ──► Decision
   (governance digest) (authority grant)      (evidence)       (complete/retry/
                                                                reroute/escalate)
                                                │
                                                ▼
                              Canonical Task Artifact + Closure Evidence
                              (validation report, ADR, ledger delta)
```

| Entity | What it is | Canonical home | Existing reference |
|---|---|---|---|
| Durable Task Record | The repository state of one task: definition, status, dependencies, readiness inputs, capability and authority fields, claims, gates, artifact refs | `docs/TASKS.md` | Terminology: Task; Execution Control Model: Task |
| Task Passport | Revisioned projection of a Task Record carrying the role, scope, required/denied capabilities, policy-ceiling reference, and human-gate applicability used to derive authority | Derived record (revisioned) | Adapter architecture: Task Passport; provider `task_passport_revision` |
| Work Order | Bounded, authorized assignment of a task to one executor: inputs, scope, expected outputs, policy/envelope reference, claims, route budget, deadlines | Durable record | Terminology: Work Order; Execution Control Model: Work Order |
| Attempt | One execution of a Work Order with identity, lifecycle, telemetry, and termination reason | Evidence record | Execution Control Model: Attempt |
| Delta | State-change-only increment: field-level changes applied to a durable record, never a re-transmission of full state | Append-only change record | — (formalized here) |
| Context Receipt | Digest of the governance rehydration (documents loaded, governance revision, task passport revision, baseline SHA) that must precede execution | Durable record | provider `context-receipt.mjs`; adapter Rehydration Requirements |
| Permission Envelope | Provider-neutral authority grant derived from the Task Passport and effective policy; the materialization input | Durable record | `docs/governance/PERMISSION_ENVELOPE.md`; `permission-envelope.mjs` |
| Result / Handoff | Executor-reported outcome of an Attempt; evidence, never Completion | Evidence record | Execution Control Model: Result; provider `normalizePromptResponse` |
| Verification | First-class evaluation of Result and Artifacts against acceptance criteria, gates, and policy | Evidence record | Execution Control Model: Verification |
| Decision | The explicit control-plane choice (complete, retry, reroute, rework, cancel, escalate) | Durable record | Execution Control Model: Decision |
| Canonical Task Artifact | The durable file(s) whose existence/change constitutes the task's completion evidence | Repository path | Terminology: Artifact |
| Closure Evidence | The persisted combination (artifact + verification + decision + delta) that makes CLOSED auditable | Repository path | Execution Control Model: Completion |

Boundary rule: a Task Record is an entity with an identity and state; a
lifecycle value is a state, not an entity. One record may pass through many
states and carry many Attempts, Deltas, and Verification records. Entities
are never collapsed into states (see `docs/reconciliation/TASK_ENTITY_MAPPING.md`).

---

## 4. Canonical record schemas

Identifiers are snake_case and match the provider-adapter vocabulary.
Schema presentation is normative for V0; exact serialization/transport
remains an open implementation decision.

### 4.1 Durable Task Record (required projection fields)

| Field | Meaning |
|---|---|
| `task_id` | Stable identity (`DPT-<AREA>-<SEQ>` for framework tasks) |
| `title` | Human-readable name |
| `objective` | Outcome the task must achieve (bounded) |
| `status` | One canonical lifecycle state (section 5) |
| `dependencies` | `task_id`s that must be CLOSED before this task is READY |
| `readiness` | Deterministic projection: READY / NOT_READY + reasons |
| `task_class` | Classification used for capability/team selection |
| `required_capabilities` | Capabilities the executor must hold |
| `denied_capabilities` | Explicit prohibitions (fail-closed ceiling) |
| `delegated_authority` | Authority grant reference or derivation reference |
| `authority_derivation` | How delegated authority was derived (policy + ceiling) |
| `human_gate_state` | Applicable HG class or `NONE` (see section 11) |
| `passport_revision` | Current Task Passport revision |
| `canonical_artifact` | Repository path(s) of completion evidence |
| `state_revision` | Monotonic revision of this durable record |
| `next_task` / `dag` | Successor / DAG position information |
| `auto_continue` | Whether autonomous advancement is permitted past CLOSED |

### 4.2 Task Passport

| Field | Meaning |
|---|---|
| `task_id`, `task_passport_revision` | Identity; revision increments on any authority-relevant change |
| `role` | Operational identity granted for this task |
| `scope` | Bounded scope statement (what the task may touch) |
| `required_capabilities`, `denied_capabilities` | Subset of the Task Record, frozen at dispatch |
| `policy_ceiling_ref` | Authority Policy + risk envelope reference |
| `human_gates_applicable` | HG classes that apply to this task's actions |
| `valid_from / valid_until`, `revocation_state` | Currency of the grant |

A Passport is a snapshot for execution; it never grants more than the Task
Record's `delegated_authority`, which never exceeds the inherited policy
ceiling (Article 29; `DPT_AUTHORITY_MODEL.md` inheritance rules).

### 4.3 Work Order

| Field | Meaning |
|---|---|
| `task_id`, `task_passport_revision` | Bound task + passport snapshot |
| `work_order_id`, `work_order_revision` | Identity of the assignment |
| `executor` | Assigned executor (agent/role) |
| `inputs` | Minimum sufficient context references (not full state dumps) |
| `expected_outputs` | Result/handoff contract |
| `envelope_id` | Permission Envelope produced for this assignment |
| `resource_claims` | Declared claims (READ/WRITE/EXCLUSIVE) |
| `route_budget` | Per-route rework budget (canonical default: 3) |
| `acceptance_criteria` | What Verification evaluates |
| `termination_conditions` | Timeout/cancel/containment rules |

### 4.4 Delta

| Field | Meaning |
|---|---|
| `delta_id`, `task_id`, `base_state_revision` | Identity and base for the change |
| `changes` | Field-level state changes only (never a full re-transmission) |
| `applied_by`, `applied_at`, `evidence_refs` | Provenance and evidence |

Invariant: applying the ordered Delta chain to the base Task Record
reconstructs current durable state. Runtime prompts are projections of that
reconstructed state; they are never the state itself.

### 4.5 Result / Handoff and Closure Evidence

A Result records outcome (`SUCCESS`/`FAIL`/`PARTIAL`), `structured_result`,
provider/attempt/session references, and evidence. It is not Completion.
Closure requires, in addition to a Result, Verification against
`acceptance_criteria` and an explicit Decision, persisted with the Delta that
moves the record to CLOSED.

---

## 5. Canonical task lifecycle

Minimum canonical states (vocabulary reconciled with existing states; no
parallel naming):

| State | Meaning | Entry requires |
|---|---|---|
| `BACKLOG` | Accepted candidate, not yet admitted to execution eligibility | Record exists with dependencies declared |
| `READY` | Deterministically eligible for dispatch | Section 6 rule holds |
| `ASSIGNED` / `DISPATCHED` | Work Order issued to an executor | Envelope materialized and preflight passed |
| `RUNNING` | Attempt in progress on the DPT-controlled runtime/session | Authority materialization completed (section 7) |
| `REVIEW_REQUIRED` / `VERIFYING` | Result produced; independent verification in progress | Attempt terminated with Result/Handoff |
| `REWORK` | Verification failed; bounded correction on the same route | Review decision `REWORK_REQUIRED`; route budget not exhausted |
| `WAITING_FOR_HUMAN_GATE` | A genuine HG-01..07 applies; execution suspended | Human Gate match short-circuits policy |
| `BLOCKED` | A proven prerequisite cannot be satisfied autonomously | Evidence of unsatisfiable prerequisite, not mere failure |
| `ESCALATION_REQUIRED` | Route budget exhausted or authority/evidence boundary exceeded | Global rework/route exhaustion or unresolved authority question |
| `REPORT_PENDING` | Work complete; canonical artifact/report not yet persisted | Verification passed; artifact pending |
| `CLOSED` | Verification passed, Decision recorded, artifact persisted | Complete decision + closure evidence in repository |

Transition guards: every transition must be recorded as a Delta with
provenance. `READY` must be recomputed, not assumed, after any dependency,
policy, resource, or gate change. No state transition implies authority;
authority is evaluated at material action boundaries independently of state.

---

## 6. READY rule (deterministic)

A Task Record is READY only when **all** of the following projectable
conditions hold:

1. dependencies satisfied — every declared dependency is CLOSED;
2. no proven blocker — no BLOCKED prerequisite or unsatisfiable constraint;
3. durable task record + passport available — both exist at current revision;
4. required capabilities derivable — from the record within governance;
5. authority derivable — delegated authority derivable within the policy
   ceiling, with no unresolved approval gate;
6. provider support — the assigned provider/runtime supports the required
   capabilities (see `docs/reconciliation/OPENCODE_PROGRAMMATIC_CAPABILITY_MATRIX.md`);
7. resources available — declared Resource Claims acquirable with no
   forbidden conflict;
8. no unresolved genuine Human Gate — no HG-01..07 match is pending;
9. mandate valid — task, plan, and authority not cancelled or revoked;
   budget/time/risk constraints hold.

Agent confidence, provider permission-prompt absence, or a high Authority
Mode never makes a Task READY. If any condition cannot be evaluated
deterministically, the Task is not READY (fail closed).

---

## 7. Authority pipeline (mandatory pre-execution sequence)

Invariant:

```text
REQUIRED_CAPABILITIES ⊆ DELEGATED_AUTHORITY ⊆ GOVERNANCE_ALLOWED_AUTHORITY
                        ⊆ PROVIDER_MATERIALIZED_PERMISSIONS
```

**NO AGENT EXECUTION BEFORE AUTHORITY MATERIALIZATION.** Before any task
mutation and before any state enters RUNNING:

1. Rehydrate canonical governance (documents, revisions, digests);
2. Load the durable Task Record from `docs/TASKS.md`;
3. Produce a Context Receipt (governance digest + passport revision +
   baseline SHA);
4. Derive required capabilities from the record;
5. Derive delegated authority from policy, ceiling, and role;
6. Construct the Permission Envelope;
7. Materialize the envelope into the exact provider runtime/session that
   will execute the task (SDK-created, DPT-controlled);
8. Verify provider permission preflight against the materialized policy;
9. Only then transition to RUNNING and dispatch the Work Order.

If any step fails, or the invariant chain is false, execution fails closed
before any mutation. A provider permission popup observed during an
authorized operation after step 9 is a materialization/preflight defect, not
an acceptable normal state.

---

## 8. Parent governance awareness and subagent delegation

### 8.1 Parent / Orchestrator

The Parent (Execution Orchestrator) must be governance-aware **before**
dispatch:

- NO EXECUTION BEFORE GOVERNANCE REHYDRATION — the Parent does not dispatch
  from an unrehydrated prompt;
- NO SUBAGENT EXECUTION WITHOUT EXPLICIT WORK ORDER + DERIVED PERMISSION
  ENVELOPE — a subagent may not execute merely because the Parent asks.

A subagent's delegated authority is a strict subset of the Parent's delegated
authority and of the task scope (policy ceiling; Article 29). The Parent may
narrow, never widen. Subagent boundaries follow
`docs/architecture/OPENCODE_PROVIDER_ADAPTER_ARCHITECTURE.md` section 8: DPT
retains ownership of task authority, durable state, lifecycle, evidence,
retry/reroute, claims, Human Gates, and completion semantics; provider-native
subagents are runtime capabilities inside that contract.

### 8.2 Team assembly

Select the smallest capable team. Each assignment is a bounded Work Order
with its own envelope derivation. Team membership grants no authority by
itself; executor and verifier independence follow risk/approval policy.

---

## 9. Retry, reroute, and blocker semantics

- Per-route rework budget = **3** (canonical default).
- Reviewer rejection, implementation failure, or one exhausted route does
  NOT automatically create a blocker.
- If a plausible alternate route exists, reroute (new route, fresh budget)
  within the same task authority.
- `BLOCKED` requires a proven prerequisite that cannot be satisfied
  autonomously — evidence, not repeated failure.
- Global budget exhaustion is `ESCALATION_REQUIRED`, not automatically
  `BLOCKED`; escalation is a valid controlled outcome with a decision
  package, not an execution failure.
- Rework returns to the smallest state capable of correcting the problem;
  do not restart the whole workflow for a local correction.

---

## 10. Human Gate model

Canonical Human Gate semantics are those of
`docs/governance/HUMAN_GATE_BOUNDARY.md` (HG-01..HG-07), preserved unchanged:

- A Human Gate is a hard policy boundary triggered by operation class, and
  persists regardless of mode, confidence, or provider.
- A matched gate moves the Task to `WAITING_FOR_HUMAN_GATE`; execution is
  suspended; the gate, required human action, and audit record are durable.
- A provider permission popup is a runtime event, NOT a DPT Human Gate, and
  is never a substitute for authority materialization, and never treated as
  a gate disposition.
- Authorized ordinary operations must complete with `OWNER_PERMISSION_POPUPS
  = 0`. Do not use Allow Once / Allow Always / global permission broadening /
  static broad whitelists / Owner approval to compensate for incomplete
  materialization. If the model attempts an operation outside delegated
  authority, fail closed — that is correct and must not be fixed by
  broadening authority.

---

## 11. Autonomous advancement

```text
CLOSED
  → recalculate DAG
  → determine next READY task (section 6)
  → derive authority
  → materialize provider permissions
  → preflight
  → dispatch
```

No Owner interaction is required between ordinary successfully closed tasks.
Owner interaction is reserved for genuine Human Gates or proven blockers.
A task record's `auto_continue` flag gates autonomous advancement past
CLOSED; for DPT-RECON-003, `AUTO_CONTINUE = NO` (see `docs/TASKS.md`).

---

## 12. Open decisions reconciliation (execution-control set)

Reconciliation of the execution-control open decisions (OD register traced
to DPT-RECON-001; canonical living backlog is `docs/DPT_OPEN_DECISIONS.md`,
whose appendix now carries the status table). Status semantics:

- **BOUND**: the contract-level decision is established by this document;
  the *implementation* remains open pending Foundation work and real-project
  evidence (specification-first).
- **OPEN**: genuinely unresolved; this contract intentionally does not close it.

| ID | Decision | Status after DPT-RECON-003 |
|----|----------|---------------------------|
| OD-001 | Task Passport schema and lifecycle | BOUND at contract level (sections 4.2, 5); runtime lifecycle implementation OPEN |
| OD-002 | Work Order contract formalization | BOUND at contract level (section 4.3); serialization/transport OPEN |
| OD-003 | Delta relationship to Work Order | BOUND at contract level (sections 4.4, 1); storage mechanism OPEN |
| OD-004 | Task DAG scheduling algorithm | BOUND: READY rule deterministic (section 6); scheduling/prioritization algorithm OPEN |
| OD-005 | Runtime authority policy evaluation mechanism | BOUND: materialize-before-execute + preflight (section 7) and fail-closed native policy; exact mechanism OPEN |
| OD-006 | Runtime intent intake format | OPEN (unchanged) |
| OD-007 | Batch scheduling and subagent delegation | Delegation contract BOUND (section 8); batch scheduling OPEN |
| OD-008 | Provider-neutral orchestrator runtime transport | OPEN (unchanged) |
| OD-009 | Persistent project memory schema | OPEN (unchanged) |
| OD-010 | Workflow state management mechanism | Lifecycle states BOUND (section 5); mechanism OPEN |
| OD-011 | Quality-gate execution mechanism | Gate semantics preserved (HG + Verification); execution mechanism OPEN |
| OD-012 | Human approval interface | Human Gate semantics BOUND (section 10); approval interface OPEN |
| OD-013..OD-020 | Non-execution-control decisions | OPEN (unchanged, outside this task's scope) |

This contract does not falsely close implementation decisions: BOUND means
the framework contract is now explicit and reviewable, not that Foundation
implementation work is done.

---

## 13. Validation of the contract

Canonical semantic verification for any task executed under this contract:

- durable task state is the source of truth (prompt-free reconstruction);
- Delta is state-change-only;
- Task Record / Passport / Work Order boundaries are explicit;
- authority pipeline is explicit and precedes execution;
- Parent governance rehydration is mandatory;
- subagent delegation contract is explicit and ceiling-bounded;
- provider materialization occurs pre-execution on the executing runtime;
- READY calculation is deterministic/projectable;
- Human Gate semantics are preserved (HG-01..07; popup ≠ gate);
- retry/reroute/blocker semantics are preserved (route budget 3; BLOCKED
  requires proof; exhaustion escalates);
- autonomous CLOSED → next READY behavior is defined and gated by
  `auto_continue`;
- `docs/TASKS.md` is human-readable and machine-projectable;
- no Foundation runtime implementation was introduced;
- no permission broadening occurred.

---

## 14. Non-goals (V0)

No scheduler, queue, lock service, database, persistence engine, agent
framework, or provider integration is specified or implemented by this
contract. `docs/TASKS.md` and this document are the canonical surface;
projection onto a runtime is later Foundation work guided by real-project
evidence.
