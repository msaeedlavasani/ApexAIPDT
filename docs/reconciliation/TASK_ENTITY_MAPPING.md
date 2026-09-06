# DPT-MIG-001.A — Task Entity Model Reconciliation

## 1. Purpose

Map ApexAIPDT's semantic execution entities to Lab's runtime state machine and evidence schemas. Preserve the distinction between semantic entities (what something IS) and runtime states (what state it IS IN). Do not collapse entities into states.

## 2. Source References

**ApexAIPDT:** `docs/DPT_EXECUTION_CONTROL_MODEL.md` (10 entities, lines 6–19)

**Lab:**
- `orchestrator/state/task-model.mjs` (TaskState, 12 states)
- `orchestrator/state/durable-task-state.mjs` (state machine, journal, snapshot)
- `orchestrator/evidence/worker-result.mjs` (WorkerResult schema)
- `orchestrator/review/review-model.mjs` (ReviewResult schema)
- `orchestrator/core/task-policy.mjs` (policy decision engine)
- `orchestrator/core/runner.mjs` (worker execution, WorkerResult production)
- `orchestrator/evidence/failure-classifier.mjs` (AttemptOutcome enum, classifyWorkerResult)

## 3. Semantic Entity Mapping

### 3.1 ApexAIPDT Entities → Lab Implementations

| DPT Entity | Definition | Lab Implementation | Mapping Type |
|-----------|-----------|-------------------|-------------|
| **Intent** | The outcome the Owner or authorized system requests | Task JSON file (`tasks/TASK-*.json`): `id`, `title`, `description`, `requirements[]` | PARTIAL — Task JSON captures intent but lacks Owner identity, authority references, and scope constraints |
| **Plan** | Structured interpretation of Intent: constraints, success criteria, risks, proposed work | Architect agent output (`ARCHITECT_REPORT:`); not a separate durable entity | GAP — Plan exists only as text output, not a structured, versioned, auditable artifact |
| **Task** | Logical unit of work in the Task Graph, declares Resource Claims | `TaskState` + `DurableTaskStore` + task JSON; the `task_id` is the identity | CONVERGED — Lab's TaskState tracks the task lifecycle; but Lab lacks a Task Graph (DAG) — tasks are sequential |
| **Work Order** | Bounded, authorized assignment of a Task to an executor | Implicit in `index.mjs` dispatch: task JSON + prompt + agent role → `runWorker()` | GAP — No explicit Work Order schema; assignment is implicit in the sequential pipeline |
| **Attempt** | One execution of a Work Order with identity, lifecycle, telemetry, termination reason | `WorkerResult` (schema_version 1, 20+ fields): `attempt_id`, `agent`, `provider`, `model`, `exit_code`, `started_at`, `finished_at`, `duration_ms`, `timed_out` | CONVERGED — WorkerResult IS the Attempt record |
| **Artifact** | Durable work product produced or consumed during execution | `text_output`, `stderr`, `raw_stdout` in WorkerResult; report files in `reports/` directory; git diff/dirty state | PARTIAL — Artifacts exist as files but lack structured Artifact schema with identity, version, provenance |
| **Result** | Executor's reported outcome; NOT proof of Completion | WorkerResult + `AttemptOutcome` enum (SUCCESS, INVALID_REPORT, TEST_FAILURE, TASK_FAILURE, PROVIDER_FAILURE, RUNTIME_FAILURE, UNKNOWN) | CONVERGED — AttemptOutcome IS the Result; `SUCCESS` != Completion (enforced by review gate) |
| **Verification** | Evidence and evaluation against acceptance criteria, gates, policy | `ReviewResult` (schema_version 1): `review_id`, `candidate_sha`, `reviewer_id`, `reviewer_role`, `decision` (APPROVED/REWORK_REQUIRED/REJECTED/QUARANTINED), `reason_codes`, `verification_evidence` | CONVERGED — ReviewResult IS the Verification record; SHA-bound, authority-enforced |
| **Decision** | Explicit control-plane choice to complete, retry, replan, cancel, escalate | `decideTaskPolicy()` output: `next_task_state`, `disposition`, `blocker`, `reason_code`, `should_reroute`, `should_rework`, `should_escalate`, `should_backlog_block` | CONVERGED — Task policy decision IS the Decision; but lacks explicit "complete" decision (APPROVED is a state, not a decision record) |
| **Escalation** | Durable decision package requesting authority/information/judgment beyond boundary | `ESCALATION_REQUIRED` state + `escalation_reason` string + `Disposition.ESCALATE_REPLAN_OR_REROUTE` | PARTIAL — State exists but escalation lacks structured package (options, impact, reversibility, smallest Owner action) |

### 3.2 Entity vs. State Distinction

**Critical architectural principle:** An entity is a THING (has identity, attributes, relationships). A state is a CONDITION of a thing (a value of a state variable).

| DPT Entity | Lab State Variable | Lab State Values | Notes |
|-----------|-------------------|-----------------|-------|
| Task | `task_state` in DurableTaskState | PENDING, READY, RUNNING, VERIFYING, APPROVED, REWORK_REQUIRED, BLOCKED_BY_TASK, BLOCKED_BY_RESOURCE, ESCALATION_REQUIRED, BACKLOG_BLOCKED, FAILED, CLOSED | One entity, 12 possible states |
| Attempt | (no separate state) | WorkerResult produced per attempt | Each WorkerResult has a unique `attempt_id` |
| Verification | (no separate state) | ReviewResult with `decision` field | Each review has a unique `review_id` |

Lab's `TaskState` is NOT a 1:1 mapping to DPT entities. It is a state variable of the Task entity that encodes the lifecycle position across multiple DPT entity boundaries.

## 4. Runtime State Mapping

### 4.1 Lab TaskState → DPT Entity Lifecycle Position

| Lab TaskState | DPT Entities Active | DPT Entities Consumed | Notes |
|--------------|--------------------|-----------------------|-------|
| `PENDING` | Task (created) | Intent (captured in task JSON) | Task exists, not yet ready |
| `READY` | Task (ready) | — | Dependencies met, resource claims clear |
| `RUNNING` | Task, Work Order (implicit), Attempt (in-progress) | — | Worker is executing |
| `VERIFYING` | Task, Attempt (completed), Verification (in-progress) | Result (produced by worker) | Review phase |
| `REWORK_REQUIRED` | Task, Attempt (completed), Verification (completed: FAIL) | — | Awaiting rework; will generate new Attempt |
| `APPROVED` | Task (completed) | Attempt, Result, Verification, Decision (COMPLETE) | Terminal; all entities resolved |
| `BLOCKED_BY_TASK` | Task (blocked) | — | Waiting on prerequisite task |
| `BLOCKED_BY_RESOURCE` | Task (blocked) | — | Resource claim conflict |
| `ESCALATION_REQUIRED` | Task, Escalation (active) | — | Needs Owner judgment |
| `BACKLOG_BLOCKED` | Task (blocked) | — | Independent blocker with evidence |
| `FAILED` | Task (terminated) | — | Terminal; permanent failure |
| `CLOSED` | Task (administratively closed) | — | Terminal; administrative closure |

### 4.2 Key Insight: One Lab State Spans Multiple DPT Entities

The most important mapping insight:

**`RUNNING` state = Task + Work Order (implicit) + Attempt (in-progress)**

In DPT's model, these are three distinct entities with separate identities and lifecycles:
- Task has a `task_id`
- Work Order has a `work_order_id` (assigns the task to an executor)
- Attempt has an `attempt_id` (one execution of the work order)

In Lab, all three are collapsed into the TaskState machine. The `attempt_id` exists inside WorkerResult but is not a first-class entity in the state machine.

**`VERIFYING` state = Attempt (completed) + Result (produced) + Verification (in-progress)**

Similarly, DPT treats Attempt, Result, and Verification as separate entities. Lab collapses them: WorkerResult IS the Attempt+Result, and ReviewResult IS the Verification, but the state machine tracks only the Task's position.

## 5. Lifecycle Correspondence

### 5.1 DPT Operating Loop vs. Lab Pipeline

```
DPT:  INTENT → POLICY → PLAN/DAG → TEAM ASSEMBLY → WORK ORDER → ATTEMPT → RESULT/ARTIFACT → VERIFY → DECIDE → LEARN/REPORT
Lab:  task.json → (implicit) → architect prompt → developer prompt → WorkerResult → ReviewResult → final.json
```

| DPT Stage | Lab Implementation | Gap |
|-----------|-------------------|-----|
| INTENT | Task JSON file | No Owner identity or authority reference |
| POLICY | Not implemented | No authority policy evaluation |
| PLAN/DAG | Architect output (text) | Not structured; no DAG (sequential only) |
| TEAM ASSEMBLY | Hardcoded 3-agent pipeline | No dynamic team selection |
| WORK ORDER | Implicit in prompt construction | No explicit Work Order schema |
| ATTEMPT | WorkerResult | Complete |
| RESULT/ARTIFACT | WorkerResult + report files | Artifacts lack structured schema |
| VERIFY | ReviewResult | Complete |
| DECIDE | decideTaskPolicy() output | Complete for task-level; lacks batch-level |
| LEARN/REPORT | final.json | Minimal; no durable learning capture |

### 5.2 Attempt Lifecycle

```
DPT:  Work Order issued → Attempt started → Attempt produces Result → Attempt terminates
Lab:  runWorker() called → child process spawned → stdout collected → WorkerResult frozen
```

Lab WorkerResult fields map to DPT Attempt attributes:

| DPT Attempt Attribute | WorkerResult Field | Notes |
|----------------------|-------------------|-------|
| identity | `attempt_id` | Unique per attempt |
| lifecycle | `started_at`, `finished_at`, `duration_ms` | Complete |
| telemetry | `events`, `exit_code`, `signal`, `timed_out` | Complete |
| termination reason | Derived from `AttemptOutcome` + `FailureClass` | Complete |
| executor identity | `agent`, `role`, `provider`, `model` | Complete |

### 5.3 Review Lifecycle

```
DPT:  Verification initiated → Evidence collected → Evaluation → Verification recorded → Decision
Lab:  Reviewer agent spawned → inspects source/tests/diff → produces REVIEW_REPORT → isReviewPassed() → final.json
```

Lab ReviewResult fields map to DPT Verification attributes:

| DPT Verification Attribute | ReviewResult Field | Notes |
|---------------------------|-------------------|-------|
| identity | `review_id` | Unique per review |
| inputs | `candidate_sha`, `reviewed_artifacts`, `reviewed_diff_identity` | SHA-bound |
| criteria | `reason_codes` (non-empty) | Present |
| evidence | `verification_evidence` (object) | Present |
| outcome | `decision` (APPROVED/REWORK_REQUIRED/REJECTED/QUARANTINED) | Complete |
| provenance | `reviewer_id`, `reviewer_role`, `reviewed_at` | Complete |

## 6. Gaps

| Gap | DPT Concept Missing in Lab | Severity | Migration Impact |
|-----|---------------------------|----------|-----------------|
| No Task Graph (DAG) | Tasks form a DAG with prerequisite edges | HIGH | Lab runs sequential pipeline; DAG scheduling is future work |
| No explicit Work Order | Bounded, authorized assignment with scope, policy, claims | HIGH | Assignment is implicit in prompt construction |
| No Plan entity | Structured, versioned, auditable interpretation of Intent | MEDIUM | Plan exists as text output only |
| No Artifact schema | Durable work product with identity, version, provenance | MEDIUM | Artifacts are files without structured metadata |
| No Escalation package | Structured decision package with options, impact, reversibility | MEDIUM | Escalation is a state + reason string only |
| No Owner identity | Intent belongs to Owner; authority traces to Owner | LOW | Task JSON lacks Owner reference |
| No learning capture | Durable knowledge from execution | LOW | No post-execution learning loop |

## 7. Overlaps

| Overlap | DPT Entity | Lab Implementation | Alignment |
|---------|-----------|-------------------|-----------|
| Task identity | Task | task_id in DurableTaskState | ALIGNED |
| Task lifecycle states | Task | TaskState (12 values) | ALIGNED (Lab is superset) |
| Attempt identity | Attempt | attempt_id in WorkerResult | ALIGNED |
| Attempt lifecycle | Attempt | started_at, finished_at, duration_ms | ALIGNED |
| Result separation | Result != Completion | AttemptOutcome.SUCCESS != APPROVED state | ALIGNED |
| Verification identity | Verification | review_id in ReviewResult | ALIGNED |
| Verification SHA binding | Verification (implied) | candidate_sha in ReviewResult | ALIGNED |
| Decision type | Decision | disposition in task-policy output | ALIGNED |

## 8. Incompatibilities

| Incompatibility | DPT Semantics | Lab Semantics | Resolution |
|----------------|--------------|---------------|-----------|
| Task entity ≠ TaskState | Task is an entity with identity; TaskState is a state value | TaskState IS the task representation | Lab's DurableTaskState contains the entity (task_id) AND its state; this is acceptable — entity and state coexist |
| Work Order is first-class | Work Order has its own identity, separate from Task | Work Order is implicit | Future: introduce Work Order schema; for V1, document the implicit mapping |
| Attempt is separate from Task | Attempt has its own identity; a Task can have multiple Attempts | Attempt is embedded in WorkerResult; task tracks global_attempt_count | Lab correctly supports multiple attempts per task; the Attempt entity is the WorkerResult, not a TaskState |
| Verification is first-class | Verification has its own identity, criteria, evidence, outcome | Verification is ReviewResult | Aligned — ReviewResult IS the Verification entity |
| Decision is explicit | Decision is a durable record of the control-plane choice | Decision is the output of decideTaskPolicy() | Lab's decision is a pure function output, not persisted as a separate record; the state transition IS the decision evidence |

## 9. Recommended Canonical Interpretation for V1

1. **Adopt Lab's DurableTaskState as the canonical Task entity store for V1.** It correctly combines entity identity (task_id) with lifecycle state (task_state) and supports journal-based durability.

2. **Adopt WorkerResult as the canonical Attempt + Result record for V1.** It contains all required Attempt attributes (identity, lifecycle, telemetry, termination) and Result attributes (outcome, evidence).

3. **Adopt ReviewResult as the canonical Verification record for V1.** It contains all required Verification attributes (identity, inputs, criteria, evidence, outcome, provenance).

4. **Introduce Work Order as a future schema.** The Lab's implicit Work Order (prompt construction) should be formalized into a structured schema for DPT-MIG-001 migration.

5. **Introduce Plan as a future schema.** The Architect output should be structured and versioned.

6. **Introduce Escalation package as a future schema.** The current `escalation_reason` string should be expanded into a structured package.

7. **Do NOT collapse TaskState into separate entity state machines.** Lab's single state machine covering the full task lifecycle is simpler and correct for V1. The DPT entity model is the semantic reference; Lab's state machine is the runtime implementation.

---

*DPT-MIG-001.A — Generated 2026-09-02 — ApexAIPDT reconciliation*
