# Apex AI DPT — Execution Control Model

**Status:** Accepted architecture direction  
**Scope:** Semantic model only; no runtime, database schema, queue, lock service, or agent-provider integration is specified.

## Entity model

| Entity | Responsibility |
|---|---|
| Intent | The outcome the Owner or an authorized system requests. |
| Plan | A structured interpretation of Intent: constraints, success criteria, risks, and proposed work. |
| Task | A logical unit of work in the Task Graph, independent of a particular executor; it declares Resource Claims before execution. |
| Work Order | A bounded, authorized assignment of a Task to an executor, including inputs, scope, policy, claims, and expected outputs. |
| Attempt | One execution of a Work Order with identity, lifecycle, telemetry, and termination reason. |
| Artifact | A durable work product produced or consumed during execution. |
| Result | The executor's reported outcome of an Attempt; not proof of Completion. |
| Verification | Evidence and evaluation against acceptance criteria, gates, and policy. |
| Decision | The explicit control-plane choice to complete, retry, replan, cancel, or escalate. |
| Escalation | A durable decision package requesting authority, information, or judgment beyond the current boundary. |

## Task Graph

Tasks form a directed acyclic graph (DAG). Edges express prerequisite relationships. A Plan may evolve, but graph mutation must be explicit, validated for cycles and authority, versioned, and auditable.

Task readiness should be deterministic wherever practical. A Task is ready only when all applicable conditions are satisfied, including:

- prerequisite Tasks have reached the required verified state;
- required inputs and Artifacts exist and are current;
- Authority Policy permits the next action or its approval gate is satisfied;
- Resource Claims can be acquired without a forbidden conflict;
- budget/time/risk constraints remain valid;
- the Task, Plan, and mandate have not been cancelled or revoked.

Agent confidence alone cannot make a Task ready.

## Resource Claims and parallelism

Parallel execution requires explicit Resource Claims. A Resource is not only a file: it is any bounded physical, logical, or external asset, capability, namespace, or dependency whose use matters to concurrency, authority, governance, or execution safety. Examples include repository paths, branches, modules, API contracts, services, data sets, environments, credential scopes, exclusive tools, external systems, budgets, and rate limits.

Resources form a hierarchy. A Resource may have parent and child scopes, and a claim may address one node or a subtree. Logical Resources such as an API contract or service have stable identities independent of filesystem paths and may map to multiple paths or no path at all.

Every Task declares its Resource Claims before execution. The initial access modes are:

| Mode | Meaning |
|---|---|
| `READ` | Observe or consume the Resource without intending to mutate it. |
| `WRITE` | Mutate the Resource within the declared scope. |
| `EXCLUSIVE` | Reserve the declared scope against every incompatible concurrent interaction. |

The Orchestrator schedules Tasks in parallel only when dependencies and all relevant claims are compatible. V1 uses conservative conflict handling: if compatibility cannot be established, a claim is missing, or a conflict domain is unresolved, the Tasks do not run concurrently.

Execution-time discovery may produce a claim-expansion request. The Orchestrator must approve the expanded scope and re-evaluate compatibility, Authority Policy, Resource sensitivity, and approval gates before affected work continues. Executors must not silently expand scope.

### Conceptual Resource record

```text
Resource
├── id
├── type
├── name / description
├── parent_id and hierarchy scope
├── logical identity and optional locator bindings
├── conflict domain(s)
├── sensitivity / governance classification
├── owner / authority scope
├── status
└── metadata
```

Conceptual Resource statuses are `AVAILABLE`, `RESTRICTED`, `UNAVAILABLE`, and `RETIRED`. These describe control-plane usability, not the health model of the underlying service. Exact machine identifiers remain subject to schema finalization.

### Conceptual ResourceClaim record

```text
ResourceClaim
├── id
├── task_id
├── work_order_id (when assigned)
├── resource_id
├── access_mode
├── claimed scope / subtree
├── reason
├── source and confidence
├── requested / effective time bounds
├── authority and approval references
├── status
└── expansion lineage / metadata
```

Conceptual claim states are `DECLARED`, `APPROVAL_REQUIRED`, `ACQUIRABLE`, `ACQUIRED`, `RELEASED`, `DENIED`, `REVOKED`, and `EXPIRED`. A claim cannot become effective merely because an executor inferred or requested it. Exact transition guards and lock/lease behavior remain open.

Resource sensitivity is evaluated through Authority Policy and Governance. It may narrow eligible actors, environments, actions, providers, or approval paths even when concurrency would otherwise be safe.

## Result, Verification, and Completion

```text
Attempt → Result / Artifact → Verification → Decision → Completion
```

`Result != Completion`.

A successful executor report is evidence, not a completion decision. Verification is first-class: it has its own identity, inputs, criteria, evidence, outcome, provenance, and relationship to the Attempt and produced Artifacts. Completion occurs only after required acceptance criteria, quality gates, and policy checks pass and an explicit Decision records that outcome.

## Execution Orchestrator responsibilities

The Execution Orchestrator:

- receives authorized Intent and advisory inputs without treating advice as permission;
- produces or validates Plans and Task DAGs;
- computes readiness and prioritizes ready Tasks;
- evaluates Authority Policy before issuing Work Orders and at material action boundaries;
- validates declared Resource Claims and approves or rejects any runtime expansion;
- assigns bounded Work Orders to capable executors;
- coordinates Resource Claims and safe parallelism;
- tracks Attempts, Artifacts, Results, Verification, budgets, and deadlines;
- detects failures, stalls, conflicts, policy changes, and revocation;
- chooses complete, retry, replan, cancel, or escalate within authority;
- persists an auditable execution history and concise Owner-facing status.

It does not absorb Front Agent, Gateway, Analyst, verifier, or executor responsibilities. It may request those capabilities through their contracts.

## Escalation

An Escalation should state the blocked decision, relevant Intent/Task/Attempt, evidence, options, risks, current authority boundary, time sensitivity, and the smallest Owner action required. Escalation is a valid controlled outcome, not an execution failure.
