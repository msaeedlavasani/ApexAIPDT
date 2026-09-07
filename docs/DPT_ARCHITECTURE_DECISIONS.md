# Apex AI DPT — Architecture Decisions

**Status:** Living decision record  
**Purpose:** Capture architectural decisions that emerged during DPT design discussions before implementation is frozen.



---

## CROSS-CUTTING INTERACTION INVARIANT

The following higher-level invariant is canonicalized across all admitted Phase 2
findings:

> **A STATE TRANSITION IN ONE GOVERNANCE DOMAIN MUST NOT SILENTLY ACQUIRE THE
> SEMANTIC POWER OF A DIFFERENT GOVERNANCE DOMAIN.**

Cross-domain effects require an explicit governed transition through the lifecycle
that owns that effect.

| Invariant | Governing ADRs |
|-----------|---------------|
| `GRAPH_REMOVAL ≠ AUTHORITY_REVOCATION` | ADR-036, ADR-037 (F-002, P2-002) |
| `DECISION_SUPERSESSION ≠ EXECUTION_CANCELLATION` | ADR-036, ADR-043 (P2-008) |
| `POOL_REMOVAL ≠ AUTHORITY_REVOCATION` | ADR-036, ADR-049 (P2-009) |
| `ENTITLEMENT_LOSS ≠ AUTHORITY_REVOCATION` | ADR-033, ADR-036, ADR-050 (P2-007) |
| `CREDITS ≠ AUTHORITY` | ADR-033, ADR-050 (P2-007) |
| `REVOCATION_ISSUED ≠ REVOCATION_OBSERVED_BY_FRONT` | ADR-030, ADR-048 (P2-005, P2-010) |

This invariant ensures that each governance domain (graph mutation, decision
lifecycle, pool lifecycle, entitlement policy, credit accounting, authority
delegation) exercises its effects only through its own lifecycle mechanism.
Silent cross-domain power acquisition is prohibited.

## ADR-001 — DPT is advisory, not an implementation engine

**Status:** Superseded by ADR-018

DPT does not write, inject, modify, refactor, migrate, or deploy code in a consuming project. DPT observes project context, analyzes needs, provides recommendations, exposes reusable capabilities and intelligence, and learns from validated project contributions.

Implementation remains the responsibility of the project owner and/or the project's own developers or AI development agents.

This applies to both greenfield and existing projects.

This decision described the original Advisory Plane. ADR-018 preserves that non-invasive plane while adding a separately authorized Execution Control Plane.

## ADR-002 — Existing projects are observed before they are advised

**Status:** Accepted

For an existing project, DPT first establishes an evidence-based understanding of the project. The first objective is discovery, not change.

The preferred flow is:

```text
Existing Project
      ↓
Project Scout
      ↓
Project Intelligence
      ↓
AI Analyst
      ↓
DPT Adoption Proposal
      ↓
Project Owner / Project Team
```

No implementation is performed by DPT as a result of this flow.

## ADR-003 — Scout and Analyst are separate responsibilities

**Status:** Accepted

Project Scout discovers and structures project facts, evidence, capabilities, architecture, components, dependencies, interfaces, constraints, and intent available to DPT.

The Analyst consumes the Scout output and performs interpretation, comparison, compatibility analysis, and recommendation generation.

The Analyst should not repeat a full repository discovery when a current Project Intelligence package is available.

## ADR-004 — DPT does not assume its own assets are superior

**Status:** Accepted

DPT must compare existing project solutions with DPT assets objectively. Possible outcomes include:

- keep the project solution;
- recommend a DPT asset;
- recommend keeping both because their scopes differ;
- identify an unresolved gap;
- identify the project solution as a candidate contribution to a DPT Pool.

DPT must not become a mechanism for indiscriminately replacing project-owned implementations.

## ADR-005 — Existing projects can contribute to DPT

**Status:** Accepted

The relationship between DPT and a consuming project is beneficial in both directions. A project can consume DPT assets and, when policy permits and quality warrants, contribute reusable components, modules, patterns, skills, agents, Pitfalls, evidence, or other intelligence back to DPT.

A project-owned solution that is stronger than an available DPT solution may become a candidate for a DPT Pool.

Contribution is subject to validation, classification, privacy, licensing, and acceptance policy.

## ADR-006 — Each connected project has a Project-specific Front Agent

**Status:** Accepted

Every connected project receives its own DPT Front Agent instance derived from the DPT Front Agent reference implementation/template.

The instance represents that project at the DPT boundary and maintains project-specific context and interaction state.

The term "instance" is preferred to "Git fork" at the architectural level because lifecycle/versioning must support controlled updates from the DPT reference.

## ADR-007 — Direct external access to DPT is not a valid communication path

**Status:** Accepted

External projects and agents communicate with DPT through the project's DPT Front Agent and the DPT Gateway boundary. Direct access from an external agent to DPT internal services or Pools is outside the supported protocol and must be rejected at the boundary.

This is a routing/trust-boundary rule, not a statement that the Front Agent alone performs all security decisions.

## ADR-008 — Front Agent and Gateway Agent have different responsibilities

**Status:** Accepted

The Project Front Agent is project-specific and represents one project to DPT.

The Gateway Agent is the DPT-side network boundary that receives information from Front Agents and routes it into the DPT ecosystem, and returns approved information back through the appropriate Front Agent.

Conceptually:

```text
Project
  ↓
Project Front Agent
  ↓
DPT Trust Boundary
  ↓
Gateway Agent
  ↓
DPT Ecosystem
```

## ADR-009 — DPT uses a Project Intelligence model instead of repeated full-repository reading

**Status:** Accepted direction

Project understanding should become durable, structured intelligence. Scout should create and incrementally update a Project Intelligence package rather than forcing downstream agents to repeatedly reread the entire repository.

Project Intelligence should distinguish facts from interpretations and attach evidence and confidence to important findings.

## ADR-010 — Project Intelligence is evidence-backed

**Status:** Accepted direction

Important Scout findings should carry evidence, source, timestamp/version context, and confidence where practical.

Scout reports facts and observations. Interpretation and recommendations belong to downstream analytical roles.

### Freshness Semantics (F-003 Admitted)

Project Intelligence items carry explicit freshness metadata to prevent silent staleness corruption.

**Freshness states:**

| State | Condition | Action |
|-------|-----------|--------|
| `CURRENT` | Evidence verified within type-specific expiration window; source unchanged | No action |
| `SUSPECT` | Evidence identity changed OR source revision detected but verification pending | Targeted refresh (deterministic SERVICE) |
| `STALE` | Evidence not verified within type-specific expiration OR source unresponsive | Broad rescan (ROLE if judgment required) |
| `UNKNOWN` | New project or initial build; no prior evidence baseline | Full baseline scan |

**Required freshness fields per intelligence item:**
```
freshness = {
  evidence_identity: string,        // hash/identifier of evidence content
  source_reference: string,         // source location/reference
  source_revision: string|int,      // source revision counter
  verified_against_revision: string|int,  // revision last verified against
  verification_time: ISO8601,       // when last verified
  confidence: float,                // 0..1 evidence reliability
  freshness_state: CURRENT|SUSPECT|STALE|UNKNOWN,
  evidence_type: string             // type for expiration policy lookup
}
```

**Evidence-type-specific expiration:**
Freshness policy is configurable per evidence type. DO NOT invent fixed TTL values canonically. Example policy structure:
```
EVIDENCE_EXPIRATION_POLICY = {
  code_structure:  { ttl_hours: 24,  revision_sensitive: true },
  dependencies:    { ttl_hours: 168, revision_sensitive: true },
  architecture:    { ttl_hours: 72,  revision_sensitive: false },
  constraints:     { ttl_hours: 336, revision_sensitive: false },
  intent:          { ttl_hours: 720, revision_sensitive: false }
}
```

**Refresh trigger semantics:**
- `SUSPECT` → FIRE `REFRESH_TARGETED` (SERVICE instance)
- `STALE` → FIRE `REFRESH_BROAD` (ROLE instance if non-deterministic)
- `UNKNOWN` → INITIAL full scan
- **Absence of trigger does NOT prove CURRENT state** — may indicate UNMONITORED

**Freshness evaluation function:**
```
FRESHNESS(evidence_id, source_ref, last_verified, evidence_type) = f(
  evidence_identity_hash,      // has content changed?
  source_revision_counter,     // has source been updated?
  time_since_last_verification, // elapsed time (NOT latency)
  evidence_type_expiration_rule // type-specific TTL
)
```

Verification latency is NOT an intrinsic freshness signal. Freshness tracks evidence staleness, not system performance.

Refresh breadth (targeted vs. broad) derives from:
1. Affected scope (single field vs. whole intelligence package)
2. Evidence changes (identity/revision delta)
3. Whether judgment is required (deterministic SERVICE vs. cognitive ROLE)

This semantic is preserved from ADR-046 trigger model.

### Silent Project-Intelligence Staleness (F-305 Admitted)

For evidence classes capable of changing without observable events, bounded
revalidation is required. Permitted mechanisms include evidence-appropriate
approaches such as source revision probes, fingerprints, external checks,
periodic verification, and equivalent freshness evidence.

Time may contribute to revalidation policy but does not itself establish truth.

NO_TRIGGER_OBSERVED ≠ EVIDENCE_CURRENT.

Do not reintroduce a universal fixed TTL. Refresh breadth remains determined by
evidence/context needs, not freshness state alone.

## ADR-011 — Greenfield projects receive DPT advice before implementation

**Status:** Accepted

For a project starting from an idea, DPT can act as an early product/architecture advisor. A dedicated capability may process product intent and propose a project structure, capability map, architecture direction, and relevant DPT assets.

The resulting blueprint is advisory. The project team remains responsible for implementation.

## ADR-012 — DPT is proactive as well as reactive

**Status:** Direction accepted

DPT should support both:

- reactive interactions: a project asks for advice or assets;
- proactive interactions: DPT detects a relevant opportunity, risk, update, Pitfall, or reusable capability and informs the project.

Proactive behavior must remain advisory and policy-controlled.

## ADR-013 — DPT must preserve the LEGO principle recursively

**Status:** Accepted

Modularity applies to project architecture and to DPT itself. Brains, agents, skills, workflows, contexts, registries, contracts, Pools, and reusable assets should be independently understandable, replaceable, and composable.

## ADR-014 — Skills and agents are capabilities that can be created when gaps appear

**Status:** Accepted

Before substantive work, DPT should assess required capabilities and use existing skills/agents where possible. If a material capability gap is discovered at project start or during the project, DPT should create, acquire, extend, or compose the required capability before continuing the affected work.

## ADR-015 — Failure Intelligence contributes to a global Pitfall Pool

**Status:** Accepted

Pitfall/Failure Intelligence agents should consult existing Pitfalls and authoritative documentation at the first meaningful failure, avoid speculative correction loops, validate resolutions, and submit reusable failure knowledge to the shared Pitfall Pool according to contribution policy.

The project-side agent does not need a separate permanent Pitfall database when the shared DPT Pitfall Pool is available; its role is to operate against the shared intelligence and feed validated knowledge back into it.

## ADR-016 — DPT creates a compounding intelligence network

**Status:** Accepted direction

The DPT ↔ Project relationship should improve both sides over time:

```text
DPT → reusable value → Project
Project → validated learning → DPT
DPT → better intelligence → future Projects
```

The objective is cumulative quality, speed, safety, and reuse rather than one-way asset distribution.

## ADR-017 — Credit-based contribution is a future business mechanism

**Status:** Conceptual

A validated contribution may receive a contribution status and, after acceptance, Credits. A working example discussed is a valid Pitfall contribution earning +3 Credits, while consuming a reusable component may cost Credits such as 10.

The exact economy, validation rules, pricing, free period, subscription plans, and request limits remain open decisions and are not part of the core architecture yet.

## ADR-018 — DPT is one platform with separate advisory and execution-control planes

**Status:** Accepted

DPT is a single platform with two responsibility planes:

- the **Intelligence / Advisory Plane** observes, structures evidence, analyzes, compares, and recommends without changing a consuming project;
- the **Execution Control Plane** may plan, authorize, coordinate, verify, retry, replan, cancel, and escalate project work only under explicit Authority Policy.

The planes share product intent, Project Intelligence, durable decisions, policy, and audit context, but do not collapse their roles. Advisory output does not itself authorize execution.

### Greenfield Transition Semantics

> **Causal influence from advice is not execution authority.**

Greenfield projects operate in a pre-execution advisory phase that transitions into the execution plane only upon explicit owner authorization.

**Transition protocol:**
```
Advice
  ↓ (causal influence only)
Owner Decision
  ↓ (explicit authority grant)
Authority Grant (LAYER 2 delegation)
  ↓ (materialization)
Execution (Execution Control Plane)
```

**Invariant:** DPT cannot transit from advisory output to execution without explicit owner authority grant. The transition is gated by owner decision, not by DPT autonomy.

**Greenfield is a pre-execution phase,** not a collapsed plane. The two-plane model applies to the system as a whole; greenfield is simply the period before the execution plane is activated.

Advisory Plane activities during greenfield:
- Scout builds Project Intelligence
- Analyst produces recommendations
- Blueprint proposals generated
- NO execution occurs
- NO authority materialization

Execution Control Plane activation requires:
1. Owner accepts blueprint/advice
2. Owner grants LAYER 2 delegation
3. LAYER 3 envelope materialized
4. LAYER 4/5 evaluated and materialized
5. Work proceeds under explicit authorization

The **Execution Orchestrator** is the Execution Control Plane's runtime coordinating role. Its full framework name is **Apex AI DPT Execution Orchestrator**. It governs Plans, Task DAGs, Work Orders, Attempts, Verification, integration, release, Decisions, and Escalations while delegating actual work to bounded executors.

Current runtime experiments are validation implementations, not a decision to freeze transport, persistence, deployment topology, provider integration, or packaging. Those mechanisms remain open until evidence from real project execution supports a stable production choice.

## ADR-019 — Authority is owner-controlled, scoped, revocable, and auditable

**Status:** Accepted

The Owner grants authority through an explicit Authority Policy. Authority is scoped by project, environment, resource, action, time, budget, risk, and other applicable constraints; it can be narrowed or revoked at any time and every policy evaluation and authorized action must be auditable.

Specific policy overrides general Service/Authority Mode. An action is allowed only when it remains within action-level permissions, the risk envelope, approval gates, escalation rules, and the inherited policy ceiling. A kill switch or revocation prevents new work and causes active work to move toward the safest permitted stop/cancel behavior.

## ADR-020 — DPT uses six Service/Authority Modes

**Status:** Accepted

The platform recognizes these graduated delegation modes:

0. **Observe**
1. **Advise**
2. **Assisted Execution**
3. **Managed Execution**
4. **Autonomous Within Policy**
5. **Delegated Autonomy**

A mode is a default delegation posture, not a blanket permission set. Higher modes reduce routine approval dependence; they do not remove governance. Exact machine identifiers and whether user-facing "Service Mode" and policy-facing "Authority Mode" remain aliases are open decisions.

## ADR-021 — Front Agent and Gateway remain boundary roles, not Orchestrators

**Status:** Accepted

The Front Agent remains the project-specific DPT-facing representative. The Gateway remains the DPT-side trust, protocol, and routing boundary. Neither owns task decomposition, execution scheduling, retries, verification decisions, or task-graph mutation merely because it receives or routes a request.

## ADR-022 — Analysis and execution orchestration are separate responsibilities

**Status:** Accepted

The AI Analyst produces interpretations, comparisons, recommendations, and advisory artifacts. The **Execution Orchestrator** coordinates authorized execution. An Analyst recommendation may inform a Plan but cannot silently become an authorized Work Order.

This separation preserves evidentiary and authority boundaries and prevents recommendation confidence from being treated as execution permission.

## ADR-023 — Execution uses explicit entities and a Task DAG

**Status:** Accepted

The Execution Entity Model contains:

```text
Intent → Plan → Task → Work Order → Attempt
                                  ↓
                              Artifact / Result
                                  ↓
                              Verification
                                  ↓
                               Decision
                                  ↓
                Complete / Retry / Replan / Cancel / Escalate
```

Escalation is also a first-class entity because it must preserve the blocked decision, evidence, authority boundary, alternatives, and requested owner action.

Tasks form a directed acyclic graph. Readiness should be computed deterministically wherever practical from dependencies, required inputs, policy, gates, resource availability, and cancellation state rather than inferred from agent confidence.

## ADR-024 — Parallel execution requires Resource Claims

**Status:** Accepted

A ready Task is not automatically safe to run concurrently. Before parallel execution, the Execution Orchestrator must account for declared Resource Claims such as files, branches, services, environments, locks, budgets, exclusive tools, or other collision domains.

The exact lock/lease implementation remains open, but undeclared optimistic concurrency is not the default.

## ADR-025 — Result is not Completion and Verification is first-class

**Status:** Accepted

An Attempt producing a Result or Artifact does not complete a Task. Completion requires Verification against acceptance criteria, required quality gates, and Authority Policy, followed by an explicit Decision.

Verification must be modeled, persisted, and auditable independently from execution output. The required degree of verifier independence remains an open decision.

## ADR-026 — Resources are hierarchical control-plane objects

**Status:** Accepted

A Resource is any bounded asset, capability, namespace, or external dependency whose use matters to concurrency, authority, governance, or execution safety. Resources are not limited to files or repository paths. They include logical resources such as an API contract or service and external resources such as an environment, provider, credential scope, budget, or rate-limited system.

Every Task must declare Resource Claims before execution. The initial access modes are `READ`, `WRITE`, and `EXCLUSIVE`. Parallel execution is permitted only when dependencies and all relevant claims are compatible. V1 conflict handling is conservative: uncertainty, incomplete coverage, or an unresolved conflict domain prevents concurrency rather than permitting optimistic overlap.

Resources may form a hierarchy so a claim on a parent, child, subtree, or logical scope can be evaluated consistently. Logical identity is independent of filesystem location: moving a file does not implicitly create a new API contract or service identity, and a logical Resource may map to multiple paths or no path at all.

Runtime discovery may propose claim expansion, but only the Execution Orchestrator may approve it after re-evaluating compatibility, Authority Policy, sensitivity, and any required approval gate. An executor must not silently widen claim scope. Resource sensitivity is governance input and must be evaluated through the Authority Model rather than treated only as scheduling metadata.

The conceptual Resource and ResourceClaim fields and lifecycle states are defined in the Execution Control Model. The exact V1 type set, compatibility matrix, granularity, inference, conflict-domain generation, snapshot semantics, external adapters, and lock/lease mechanism remain open decisions.

## ADR-027 — Durable task state is the canonical source of execution truth

**Status:** Accepted — DPT-RECON-003

Task definition and execution state belong in durable repository state (the canonical Task Record surface, `docs/TASKS.md`), not in runtime prompts or ephemeral sessions. Runtime prompts and Work Orders are projections of durable records; a Delta contains only state changes; reconstructing current state applies the ordered Delta chain to the base record.

Canonical relationships (Task Record → Task Passport → Work Order → Attempt → Delta → Result/Handoff; evaluated under Context Receipt, Permission Envelope, Verification, and an explicit Decision; closed only with a Canonical Task Artifact and Closure Evidence) and the deterministic READY rule, mandatory materialize-before-execute authority pipeline, subagent delegation ceiling, retry/reroute/blocker semantics, and Human Gate model are defined in `docs/DPT_TASK_SYSTEM.md`.

Consequences:

- a task must be reconstructable from the repository without replaying a conversation or prompt;
- no agent execution occurs before authority materialization into the DPT-controlled runtime/session;
- the DPT-RECON-003 contract binds the framework at contract level only — runtime, scheduler, and persistence implementation remain open Foundation work pending real-project evidence;
- this decision does not close the open implementation decisions referenced by the contract.

## ADR-028 — Interactive session is not the DPT-controlled runtime

**Status:** Accepted — DPT-FOUNDATION-001 evidence

The current OpenCode interactive session (created when the user starts OpenCode) is NOT the DPT-controlled runtime/session. The DPT-controlled session is created by the adapter via `createOpencode()` from `@opencode-ai/sdk` with the materialized Permission Envelope config. These are two independent processes with separate permission models.

The interactive session has static permissions from `opencode.json`. The DPT-controlled session has materialized permissions from the Permission Envelope. Task execution must go through the SDK-created runtime to honor the DPT authority pipeline.

Evidence: DPT-FOUNDATION-001 runtime binding acceptance test. The `mkdir` command triggered an Owner permission popup in the interactive session (PROVIDER_PERMISSION_PREFLIGHT = FAIL) but executed without popups in the SDK-created runtime (PROVIDER_PERMISSION_PREFLIGHT = PASS).

Consequences:

- all DPT task execution must go through the SDK-created runtime, not the interactive session;
- the interactive session cannot be "repaired" to have materialized permissions — it is a separate process;
- the generic adapter path (Envelope → Materializer → SDK Runtime → Session → Execute) is the canonical execution path;
- task-specific materializers, launchers, or command whitelists are not required — the generic adapter handles arbitrary envelopes;
- the `launch-recon-003-diagnostic.mjs` demonstrates the canonical path and should be used as the reference implementation.

Deferred bounded cleanup (not an Owner decision): `providers/opencode/materialize-dpt-foundation-001.mjs`, `providers/opencode/enforce-dpt-foundation-001.mjs`, `providers/opencode/test-foundation-001-enforcement.mjs` are task-specific diagnostic artifacts from DPT-FOUNDATION-001's interrupted session. They are not required by the generic architecture and should be removed when bounded cleanup is executed.

## ADR-029 — Capability, Role, Agent, Service Ontology

**Status:** Accepted — OD-003 (Agent vs Skill boundary)
**Closes:** OD-003
**Accepted:** 2026-09-05

### Canonical Ontology

#### Design-time (persistent, versioned, governance-controlled)

| Concept | Definition |
|---------|------------|
| BRAIN | Reasoning/expertise structure. No execution. |
| ROLE | Responsibility boundary + authority envelope. |
| SKILL | Bounded reusable capability. |
| WORKFLOW | Stateful sequence of ROLEs under a POLICY. |
| SERVICE | Deterministic control-plane capability. |
| POLICY | Authority, risk envelope, governance rules. |
| AGENT_DEFINITION | Reusable/versioned execution composition contract. Declares: ROLE + BRAIN requirements + SKILL requirements + capability minimums + operational budgets + safety exclusions. Reusable across projects. Model/provider chosen at instantiation. |
| INDEPENDENCE_CONTRACT | Workflow/governance contract specifying independence dimensions for verification: REASONING_ISOLATION + EVIDENCE_INDEPENDENCE (minimum), plus runtime identity isolation, context isolation, authority isolation, result integrity, and optional brain/model diversity. |

#### Runtime (ephemeral or long-lived, task-bound)

| Concept | Definition |
|---------|------------|
| AGENT_INSTANCE | Runtime instantiation of an AGENT_DEFINITION. Model/provider selected at spawn through capability routing unless governance/compliance explicitly requires a pin. |
| WORKFLOW_INSTANCE | State machine execution of a WORKFLOW definition. |
| SERVICE_INSTANCE | Running service. May be long-lived. |
| WORK_ORDER | Bounded assignment of a TASK to a ROLE_FULFILLMENT. |
| ATTEMPT | One execution of a WORK_ORDER. |
| ROLE_FULFILLMENT | The binding of a ROLE to one of {AGENT_INSTANCE, SERVICE_INSTANCE, HUMAN, WORKFLOW} at runtime. |

### Binding Principles

1. **ROLE = responsibility boundary.** A role declares what must be done and the authority to do it, not how it is done.

2. **AGENT_DEFINITION = reusable/versioned execution composition contract, not a hard-bound model/provider.** May declare capability requirements, operational budgets, and safety exclusions. Must not declare a specific model id or provider id unless governance/compliance requires a pin.

3. **AGENT_INSTANCE = runtime instantiation of an AGENT_DEFINITION.** Model/provider selection occurs at runtime through capability routing unless a governance/compliance constraint explicitly requires a pin.

4. **A ROLE may be fulfilled by AGENT_INSTANCE / SERVICE_INSTANCE / HUMAN / WORKFLOW.** Not every ROLE requires an AGENT_DEFINITION. Whether a role needs an agent_definition is determined by whether its fulfilment requires cognitive reasoning/judgment versus deterministic execution.

5. **Determinism routing rule:**
   - If POLICY determines a unique valid action → deterministic SERVICE_INSTANCE execution.
   - If action requires interpretation or judgment → cognitive ROLE fulfilled by AGENT_INSTANCE.

### Determinism Routing Criterion (F-004 Admitted)

> **Same normalized canonical input + same policy version + same relevant canonical state snapshot → same canonical decision.**

**Formal criterion:**
```
DETERMINISTIC(policy, input) ⇔
  ∀ (snapshot1, snapshot2):
    normalize(input, snapshot1) = normalize(input, snapshot2)
    ⇒ evaluate(policy, input, snapshot1) = evaluate(policy, input, snapshot2)
```

Where:
- `normalize()` strips non-semantic variance (IDs, timestamps, random salts)
- `evaluate()` produces canonical decision output
- `snapshot` represents the relevant state context (LAYER 1+2+3 + time)

**Key properties:**
1. **Reproducibility**, not uniqueness — same input must yield same output
2. **Canonical form comparison** — ignore IDs/timestamps in outcomes
3. **No semantic judgment residue** — if evaluation produces `ESCALATE`, the policy is non-deterministic for that input class

**Determinism does NOT require an execution outcome.**
A deterministic SERVICE may reproducibly return `ESCALATE_TO_ROLE`. The downstream cognitive judgment after escalation is non-deterministic; the routing decision itself may remain deterministic.

**Operational test (minimum):**
```
Given:
  - policy_version: P
  - input: I (canonical form)
  - state_snapshot: S (LAYER 1+2+3 + current time)

Run:
  outcome1 = evaluate(P, I, S)
  outcome2 = evaluate(P, I, S)  // identical inputs

Assert:
  canonical_form(outcome1) = canonical_form(outcome2)
  AND no ESCALATE residue remains (or ESCALATE is the deterministic outcome)
```

6. **Role fulfilment may change over time.** A cognitive ROLE initially fulfilled by an AGENT_INSTANCE may later be fulfilled by a SERVICE_INSTANCE if its decision procedure becomes deterministic. This is a change of ROLE_FULFILLMENT, not a mutation of entity class.

7. **ORCHESTRATION IS A SERVICE. COORDINATION REASONING IS A ROLE.** The Orchestrator is a SERVICE_INSTANCE hosting the durable control plane (DAG state, scheduler, admission, lifecycle, resource/conflict control, event loop). When cognitive judgment is required (replanning, authority adjudication, escalation handling, conflict resolution), the service spawns a COORDINATION_REASONING_ROLE instance.

8. **INDEPENDENT VERIFICATION is a workflow/governance property enforced through an INDEPENDENCE_CONTRACT, not an intrinsic property of an Agent.** Self-verification by the producer is not independent verification. The minimum mandatory dimensions are REASONING_ISOLATION and EVIDENCE_INDEPENDENCE. Additional dimensions (runtime identity isolation, context isolation, authority isolation, result integrity, optional brain/model diversity) are specified per-workflow by the Independence Contract.

9. **DO NOT CREATE AN AGENT WHEN A SERVICE, SKILL, ROLE, OR WORKFLOW IS SUFFICIENT.** The core discipline of capability assignment.

### Cardinality Rules

- One ROLE may use multiple BRAINs.
- One BRAIN may support multiple ROLEs.
- SKILLs are reusable across agents and roles.
- AGENT_DEFINITIONs are reusable and versioned.
- AGENT_INSTANCEs are ephemeral or task-bound (long-lived only as Orchestrator-cognitive-spawn, not as general pattern).

### Independence Contract (minimum required for any independent verification)

```
INDEPENDENCE_CONTRACT:
  REASONING_ISOLATION        (mandatory)
    - reviewer must not inherit producer reasoning or hidden mutable context
  EVIDENCE_INDEPENDENCE      (mandatory)
    - reviewer independently obtains or cross-checks evidence where required
      by canonical risk/governance classification

  Optional (per-workflow):
  - RUNTIME_IDENTITY_ISOLATION
  - CONTEXT_ISOLATION
  - AUTHORITY_ISOLATION
  - RESULT_INTEGRITY
  - BRAIN_OR_MODEL_DIVERSITY  (driven by canonical task/risk/governance class)
```

Independence strength must be derived from existing canonical task/risk/governance classification. No new C0–C4 taxonomy is introduced.

### Rationale

Previous stress tests established:

- The 5/7 scoring model was not a valid classifier (Scout 6/7 → ROLE, Front Agent 6/7 → AGENT; identical scores, different categories).
- AGENT was used for two different things (definition vs instance), producing Gateway-as-Agent and Migration-Proposal-as-Agent violations.
- Independent verification was miscategorized as an agent property rather than a workflow/governance requirement.
- Orchestrator must be decomposed: control plane is service, judgement is role.
- AGENT_DEFINITION must not hard-bind model/provider for portability.

Falsifications attempted: pinned-agent-for-legal-review (resolved as runtime pin, not definition pin); "replanning is deterministic if policy is complete" (fails because policy is never complete; hence the determinism routing rule); "a Role *is* an Agent Definition" (Role is contract, Definition is one shape); "definition inequality = independence" (falsified → Independence Contract required).

### Consequences

- AGENT_DEFINITION is now a first-class design-time concept, distinct from AGENT_INSTANCE.
- ROLE is the responsibility boundary; AGENT_DEFINITION is one fulfillment shape.
- Orchestrator decomposition is canonical: durable SERVICE + spawned COORDINATION_REASONING ROLE.
- Independent verification is enforced at the workflow level via Independence Contract.
- Model/provider portability is the default; pins require explicit governance/compliance justification.

### Preserved as Follow-up (not blockers)

- Independence Contract runtime enforcement
- Role-fulfillment routing implementation
- Model/capability routing implementation
- Orchestrator cognitive-spawn interface specification

### Closes

- OD-003 (Agent vs Skill boundary) — replaced with this decision
- OD-004..OD-013 remain independently tracked where still OPEN


## ADR-030 — Front Agent Lifecycle

**Status:** Accepted — OD-004 (Front Agent lifecycle)
**Closes:** OD-004
**Accepted:** 2026-09-05

### Ontological Classification (per ADR-029)

| Layer | Front Agent |
|-------|-------------|
| Design-time | ROLE (Front boundary) + AGENT_DEFINITION (front-boundary composition) |
| Runtime | AGENT_INSTANCE — long-lived, per-project (with bounded multi-instance rule) |

Model/provider is selected at instantiation per ADR-029. The Front Agent AGENT_DEFINITION declares capability requirements and operational budgets; it does not hard-bind a model/provider unless governance/compliance explicitly requires a pin.

### Lifecycle States

```
PROVISIONING  → INITIALIZING  → ONLINE
                                  ↓
                              DEGRADED → RECONNECTING → ONLINE
                                  ↓
                              SUSPENDED / BLOCKED   (fail-closed; queue or resource exhausted)
                                  ↓
                              UPDATING → ONLINE
                                  ↓
                              REVOKING → RETIRED
```

| State | Description | Authority to enter |
|-------|-------------|--------------------|
| PROVISIONING | Creating instance from DPT reference; verifying identity | DPT |
| INITIALIZING | Loading reference; generating identity; binding to project | DPT |
| ONLINE | Connected to Gateway; accepting project requests | DPT (handshake complete) |
| DEGRADED | Local state intact; Gateway unreachable; buffering with bounded queue | Front Agent (self-detect) |
| RECONNECTING | Re-establishing Gateway; replaying buffered; merging state | Front Agent |
| SUSPENDED / BLOCKED | Fail-closed: outbound queue exhausted, resource claim denied, or critical invariant violated; no new requests accepted | Front Agent (self-detect) or DPT |
| UPDATING | Reference version change; controlled migration; handover | DPT + Project owner (joint) |
| REVOKING | Owner revokes OR DPT retires; clean state handoff | Joint (owner or DPT) |
| RETIRED | State archived; credentials destroyed; no authority remains | Terminal |

**Fail-closed rule:** Queue or resource exhaustion transitions ONLINE or DEGRADED → SUSPENDED/BLOCKED, NOT REVOKING. Suspension is reversible; revocation is terminal.

### Enrollment/Provisioning Sequence (F-005 Admitted)

> **Bounded pre-Front enrollment architecture required. No direct project access.**

```
Untrusted Project
  → ENROLLMENT (out-of-band request)
  → IDENTITY_ESTABLISHMENT
  → FRONT_BINDING/PROVISIONING
  → TRUST_BINDING
  → GATEWAY_ADMISSION
  → ONLINE
```

**Step details:**

| Step | Action | Key ownership |
|------|--------|---------------|
| ENROLLMENT | Project declares intent, owner, scope; DPT validates against LAYER 1 | — |
| IDENTITY_ESTABLISHMENT | DPT issues project identity (public binding); project generates key pair (private stays project-owned) | DPT issues identity; project holds private key |
| FRONT_BINDING | Select reusable Front AGENT_DEFINITION; create project-specific AGENT_INSTANCE; apply identity binding | Shared definition; per-project instance |
| TRUST_BINDING | Owner grants LAYER 2 delegation (co-signature); LAYER 3 envelope materialized (DPT-signed, project-verified) | Owner + DPT joint |
| GATEWAY_ADMISSION | Front connects to Gateway; Gateway derives bounded semantic capabilities from Envelope | Gateway enforces |
| ONLINE | Front Agent enters ONLINE state | — |

**Key design principles:**

1. **Reusable Front AGENT_DEFINITION by default:**
   ```
   Front AGENT_DEFINITION (shared, versioned, governance-controlled)
     ↓ (project-specific configuration binding)
   Front Agent AGENT_INSTANCE (per project, long-lived)
   ```
   Do NOT create a new AGENT_DEFINITION per project by default.

2. **Separate identity issuance from private-key ownership:**
   - DPT issues identity binding (public)
   - Project generates and holds private signing keys
   - Prevents DPT impersonation of projects

3. **Bounded semantic capabilities, not coarse classes:**
   - Gateway admission derives capabilities from Authority Envelope
   - NO coarse READ/WRITE/ADMIN authority classes
   - Capabilities scoped to specific operations (e.g., "READ pool component X", "PROPOSE merge to branch Y")

### State Ownership Contract

| State | Owner | Recovery principle |
|-------|-------|---------------------|
| Identity keys | Project (generated); DPT (issued public binding) | Project-owned private key; DPT-owned public binding |
| Project binding | Project owner | Project-owned; project-side canonical |
| Project Intelligence (per Decision #1) | Project | Project-owned; Front Agent accesses but does not own |
| DPT canonical state (TASKS.md, ADR records per ADR-027) | DPT | DPT-owned; Front Agent reads as projection |
| Front operational state (working memory, in-flight request queue, buffered outbound) | Front Agent | Locally recoverable/reconstructible from DPT canonical sources where defined; otherwise locally owned |
| Audit log | Joint | Append-only; mirrored to DPT |

**Recovery rule:** Recovery respects distributed ownership. DPT canonical state is reconstructed from DPT sources; Project Intelligence is reconstructed from project sources; Front operational state is reconstructed from local persistence and idempotency replay. No ownership category may authoritatively override another.

### Multi-Instance Rule

Multiple Front Agent instances are allowed only with:

1. **Non-overlapping authority scopes** — each instance's authority envelope must be a strict subset of the project owner's grant, with no shared write paths to the same resource; OR
2. **Explicit active/standby lease coordination** — only the active lease holder holds write authority; standby holds read-only projection; lease handoff is atomic and audited.

Bare concurrent instances without these conditions are prohibited.

### Scout Relationship (corrected)

**Scout is a sibling ROLE** invoked/coordinated by the Front Agent, not a sub-role owned by it.

- The Front Agent coordinates Scout invocations through Work Orders.
- Scout produces Project Intelligence; Project Intelligence remains project-owned (per Decision #1).
- The Front Agent accesses Project Intelligence; it does not own the Scout role definition.
- Scout may run on the project side or be invoked via Gateway routing; placement is a follow-up.

### Gateway Relationship

Unchanged from ADR-007/008. The Gateway is a SERVICE_INSTANCE on the DPT side. The Front Agent is a long-lived AGENT_INSTANCE on the project side. The trust boundary is between them.

### Reconnect / Recovery Contract

1. **Idempotency:** All outbound requests carry a `request_id`; duplicates are deduplicated by Gateway.
2. **Bounded buffering:** While DEGRADED, the Front Agent buffers outbound requests with a bounded queue. Queue exhaustion → SUSPENDED/BLOCKED (fail-closed), not REVOKING.
3. **State merge on RECONNECTING:** Front Agent requests state diff from Gateway. Merge rules:
   - DPT canonical state: DPT-wins (authoritative)
   - Project Intelligence: project-wins (authoritative)
   - Front operational state: replay from local persistence + Gateway audit
4. **Identity rotation:** Old identity is revoked on new identity creation; no authority overlap window. New identity must complete ONLINE handshake before old identity is retired.
5. **Re-derivation:** Front Agent local state is a projection; never a source of canonical truth. Re-derivation is the recovery primitive.


### Bounded Offline Authority Contract (P2-005 Admitted)

```
REVOCATION_ISSUED ≠ REVOCATION_OBSERVED_BY_FRONT
```

A revocation event emitted by DPT governance has no causal reach into a
partitioned Front Agent until the event is observed. A disconnected Front
may operate only while it possesses a currently valid, bounded
authority-validity proof.

**Architecture requirements for disconnected authority:**

| Requirement | Rule |
|-------------|------|
| Bounded offline validity | Each LAYER 3 envelope carries an authority-validity proof defining maximum offline duration |
| Fail-closed suspension | When validity cannot be established (expired or unverifiable), transition to SUSPENDED/BLOCKED |
| Mandatory reconnect revalidation | On RECONNECTING → ONLINE, revalidate all held envelopes against current canonical state |
| Queued effects blocked | Outbound effects queued during DEGRADED/SUSPENDED execute only after successful revalidation |
| Stale authority rejection | Unverifiable or stale authority cannot authorize new effects |

**Credential/envelope invalidation semantics:** Invalidation means the envelope is
**unusable for execution**. It does not require physical key destruction at the
architecture level. Cryptographic material may persist locally for audit/recovery
purposes but is semantically inert when invalid.

Two classes of rotation during partition:

- **ROUTINE_ROTATION:** Pause rotation; buffer request; resume on reconnect; old
  identity remains valid until atomic handover completes.
- **SECURITY_REVOCATION:** Old identity fails closed immediately upon observation
  (or freshness expiry); availability must not delay security invalidation. New
  identity cannot be established until connectivity restored.

This contract aligns with P2-010's offline authority reconciliation (ADR-048).

### Authority Boundary

| Direction | Authorized by | Revocable by |
|-----------|---------------|--------------|
| Project → Front Agent | Project owner | Project owner |
| Front Agent → DPT | DPT (via Gateway) | DPT |
| Front Agent → Project resources | Project owner + Owner policy | Joint (project owner + DPT for cross-project) |
| Front Agent → DPT-internal | Refused at Gateway | n/a (rejected) |
| Scout invocations by Front Agent | Project owner | Project owner |

### Cardinality

- One Front Agent instance per (project, scope or lease) — see Multi-Instance Rule.
- Multiple instances allowed only with non-overlapping authority scopes or active/standby lease.
- A project may have zero Front Agent instances (offline mode) — but then no DPT operations are available.

### Compatibility with Prior Decisions

| Decision | Compatibility |
|----------|---------------|
| Decision #1 (Project Intelligence) | ✓ Project Intelligence remains project-owned; Front Agent accesses but does not own |
| Decision #2 (Scout) | ✓ Scout is sibling ROLE; Front coordinates but does not own |
| Decision #3 (Ontology, ADR-029) | ✓ AGENT_DEFINITION + AGENT_INSTANCE model respected; no hard-bound model/provider |
| ADR-006/007/008/021 | ✓ Front Agent remains boundary role, not Orchestrator |
| ADR-020 (Service/Authority Mode) | ✓ Per-project mode configuration is orthogonal to lifecycle |
| ADR-027 (Durable task state) | ✓ DPT canonical state is the recovery anchor |

### Consequences

- Front Agent lifecycle is now fully specified with explicit states, transitions, and authority.
- Multi-instance deployments require explicit non-overlap or active/standby lease.
- Failure modes (queue exhaustion, resource denial) fail-closed to SUSPENDED/BLOCKED, not REVOKING.
- Recovery respects distributed ownership boundaries; no category overrides another.
- Scout is a sibling role, not a Front sub-role; Project Intelligence remains project-owned.

### Preserved as Follow-up (not blockers)

- Implementation details of the reference template (deployment shape, signing, attestation)
- Reference version skew window
- Bounded queue size and buffering policy
- Active/standby lease handoff atomicity implementation
- Conflict resolution for in-flight Work Orders during DEGRADED→RECONNECTING
- Cross-project Front Agent coordination (if ever needed; currently out of scope)
- Front Agent's Authority Mode (ADR-020) per-project configuration

### Closes

- OD-004 (Front Agent lifecycle) — replaced with this decision


## ADR-031 — Gateway and Trust Boundary

**Status:** Accepted — Decision #5
**Closes:** Section 5 (Gateway and Trust Boundary)
**Accepted:** 2026-09-05

### Ontological Classification (per ADR-029)

| Layer | Gateway |
|-------|---------|
| Design-time | SERVICE (deterministic trust boundary) |
| Runtime | GATEWAY_SERVICE_INSTANCE (long-lived, per DPT cluster) |

The Gateway is **the single point** where project-side authority meets DPT-side policy. Per ADR-029 determinism routing, the Gateway is a deterministic SERVICE because all of its operations (identity verification, envelope validation, access mode enforcement, direct-access rejection) follow unique-action policy. The Gateway does not require interpretation or judgment.

The prior term "Gateway Agent" is deprecated. The Gateway is a SERVICE + SERVICE_INSTANCE pair, not an AGENT.

### Canonical Boundary

```
PROJECT SIDE                    TRUST BOUNDARY              DPT SIDE
─────────────                   ──────────────              ────────
Project Owner
  │ grants authority
  ▼
Project Front Agent ◀══ mTLS ══▶ Gateway SERVICE ──▶ DPT Internal Services
(AGENT_INSTANCE, long-lived)   (SERVICE_INSTANCE, long-lived)
                                  │
                                  ├── Identity verification (mutual)
                                  ├── Authorization envelope check
                                  ├── Isolation enforcement
                                  ├── Boundary policy enforcement
                                  ├── Audit (signed, append-only)
                                  └── Direct-access rejection
```

### Seven Sub-Concerns

#### 1. Identity

The Gateway requires authenticated identity from every Front Agent connection. Identity is issued by DPT Authority (provisioning-time SERVICE, distinct from runtime Gateway). Identity form is a cryptographic public key bound to the Front Agent instance per ADR-030 multi-instance rule. Identity lifetime is co-extensive with the Front Agent's ONLINE state.

#### 2. Authentication

Mutual authentication (mTLS) is required. The project-side must verify the DPT-side Gateway (anti-spoofing); the DPT-side must verify the project-side Front Agent. Auth failure → reject + audit. Per-instance channel binding is required; per-project shared channels are prohibited.

#### 3. Authorization

The Gateway validates the **authority envelope** at the boundary. The envelope is materialized at provisioning per ADR-027 (materialize-before-execute). Authorization is a deterministic evaluation: the Gateway checks envelope form, signature, expiry, and mode-specific gates. Outcome is allow/deny/escalate. Escalation is a separate runtime boundary (Human Gate per ADR-020). Authz caching is permitted for envelope projections only; canonical state precedence is preserved.

#### 4. Isolation

Isolation is **enforced**, not just claimed. The Gateway must reject cross-project data leakage at the boundary: a Front Agent must not read another project's state. Isolation dimensions: per-instance channel isolation, per-project resource quotas, per-mode rate limits. Isolation enforcement is deterministic.

#### 5. Policy Enforcement (Boundary Layer)

The Gateway enforces **boundary policy only**. This is distinct from **execution policy** enforced by the Orchestrator SERVICE (per ADR-021 + ADR-029). Two enforcement layers:

| Layer | Owner | Concern |
|-------|-------|---------|
| Boundary policy | Gateway SERVICE | Connection, envelope, mode, isolation, claim form |
| Execution policy | Orchestrator SERVICE | Ready rule, Resource Claims compatibility, Decision adjudication |

The Gateway does not originate policy. The Gateway does not override policy. The Gateway does not grant authority (only DPT Authority may grant at provisioning).

#### 6. Audit

All events are audited: connection, auth attempt, authz outcome, escalation, isolation breach, direct-access rejection. Audit is **signed** by both sides (Gateway signs with its key; Front Agent signs with its identity key). Audit is **append-only** and **tamper-evident** (hash-linked chain). Retention is joint: DPT retains its copy; project owner retains its copy. Audit integrity violation → HALT + escalate to Owner.

#### 7. Direct-Access Rejection

Direct-access rejection is **allowlist-based**, not denylist-based. The Gateway maintains an explicit allowlist of valid Front Agent identities. Any non-allowlisted source is rejected at both the network layer and the protocol layer (defense in depth). Rejection events are audited. Rate limiting is applied to repeated rejection attempts from a source.

### State Machine

```
GATEWAY SERVICE_INSTANCE STATES:
  STARTING → READY → DRAINING → STOPPED
                  ↘
                   DEGRADED (rate-limited or partially down; fail-closed for new connections)
```

| State | Behavior |
|-------|----------|
| STARTING | Initializing; not accepting connections |
| READY | Accepting connections; enforcing all seven concerns |
| DRAINING | No new connections; existing connections completing |
| STOPPED | All connections closed; terminal |
| DEGRADED | Partial failure; new connections fail-closed; existing connections audited for integrity |

### Failure Modes (fail-closed)

| Failure | Response |
|---------|----------|
| Identity verification fails | Reject + audit |
| Authorization envelope missing/invalid | Reject; escalate if signed but expired |
| Isolation breach detected | Reject + alert + audit |
| Direct access attempted | Reject + audit + rate-limit source |
| Gateway itself degraded | DEGRADED state; new connections fail-closed |
| Audit integrity violation | HALT + escalate to Owner |
| Schema pointer into moving schema | Reject; fail-closed (Gate validates schema form, not semantics) |

### Authority Boundary

| Authority | Owner |
|-----------|-------|
| Identity issuance | DPT Authority SERVICE (provisioning-time) |
| Authority envelope grant | DPT Authority (with project owner consent) |
| Policy origination | DPT (with project owner consent for project-specific rules) |
| Policy enforcement at boundary | Gateway SERVICE |
| Policy enforcement during execution | Orchestrator SERVICE |
| Authority grant to Front Agent | DPT Authority only |
| Authority revocation | Joint (project owner, DPT) |

The Gateway may not:
- Originate policy
- Override policy
- Grant authority to a Front Agent
- Interpret semantic intent of Work Orders (Orchestrator's role)
- Hold canonical state (per ADR-027)

### Multi-Instance Deployment

Multiple Gateway SERVICE_INSTANCES are allowed for high availability, load balancing, or geographic distribution. All instances share the canonical state (TASKS.md, policy registry) as projection. State-of-deployment (e.g., active connections) is per-instance. Cross-instance coordination uses the canonical state, not inter-instance messaging, to preserve ADR-027 invariant.

### Compatibility with Prior Decisions

| Decision | Compatibility |
|----------|---------------|
| Decision #1 (Project Intelligence) | ✓ Project Intelligence is project-owned; Gateway never sees it |
| Decision #2 (Scout) | ✓ Scout outputs Project Intelligence; Gateway sees only envelopes |
| Decision #3 (ADR-029) | ✓ Gateway is SERVICE; AGENT_DEFINITION+AGENT_INSTANCE model respected |
| Decision #4 (ADR-030) | ✓ Front Agent lifecycle aligns; Gateway complements Front without overlap |
| ADR-007/008/021 | ✓ Reaffirmed; "Gateway Agent" → "Gateway SERVICE" |
| ADR-022 (Analyst vs Orchestrator) | ✓ Gateway is neither; distinct enforcement layer |
| ADR-024 (Resource Claims) | ✓ Gateway enforces access mode (READ/WRITE/EXCLUSIVE) at boundary |
| ADR-026 (Resources) | ✓ Gateway validates claim form; Orchestrator validates claim compatibility |
| ADR-027 (Durable state) | ✓ Gateway reads canonical state as projection; never source of truth |

### Consequences

- "Gateway Agent" is deprecated. The Gateway is a SERVICE + SERVICE_INSTANCE pair.
- Boundary policy and execution policy are distinct enforcement layers.
- Audit is signed and tamper-evident.
- Direct-access rejection is allowlist-based.
- The Gateway never holds canonical state, never originates policy, never grants authority.
- Seven sub-concerns (identity, authn, authz, isolation, enforcement, audit, rejection) are canonical.

### Preserved as Follow-up (not blockers)

- Specific cryptographic envelope format (e.g., JWS, COSE)
- mTLS version and cipher suite policy
- Audit retention policy details
- Rate-limit thresholds per mode
- Multi-Gateway cross-region consistency model
- Audit signing key rotation procedure

### Closes

- Section 5 (Gateway and Trust Boundary) — replaced with this decision


## ADR-032 — Canonical Mode and Entity State Names

**Status:** Accepted — Decision #6
**Closes:** Section 6 (Exact mode and entity state names)
**Accepted:** 2026-09-05

### Scope

This decision is **naming layer only**. No lifecycle semantics are redesigned. No duplicate concepts are introduced. All aliases and collisions detected through stress testing are explicitly listed with one canonical name per semantic state. Deprecated aliases remain valid for backward compatibility (read-only) and forbidden in new artifacts.

### Canonical Naming Rules

1. **One canonical name per semantic state.** Aliases are deprecated.
2. **State names are entity-qualified when shared:** `TASK_CLOSED`, `REPORT_RETIRED`, `OD_ACCEPTED`.
3. **Lifecycle state names are reserved to their owning entity:**
   - `ONLINE`, `DEGRADED`, `RECONNECTING`, `SUSPENDED` → Front Agent lifecycle only
   - `STARTING`, `DRAINING`, `STOPPED`, `READY` (Gateway) → Gateway SERVICE_INSTANCE only
   - `IDLE` → Execution Orchestrator SERVICE_INSTANCE only
4. **Two-dimensional mode model:** `MODE_AUTHORITY_*` (policy dimension) × `PRESENTATION_SERVICE_*` (presentation dimension). Distinct, not aliases.
5. **Compound names use single underscore:** `FRONT_BLOCKED` not `FRONT-BLOCKED` or `front_blocked`.
6. **Deprecated aliases are valid for read-only consumption and forbidden in new artifacts.**

### Mode Names (Authority Dimension — Six Accepted)

| # | Canonical | Description |
|---|-----------|-------------|
| 0 | `MODE_AUTHORITY_DEFAULT` | Default posture; standard approval flow |
| 1 | `MODE_AUTHORITY_INFORMATIONAL_ADVISORY` | Read-only; no execution |
| 2 | `MODE_AUTHORITY_MANAGED_EXECUTION` | Executed under explicit per-step approval |
| 3 | `MODE_AUTHORITY_AUTONOMOUS_WITHIN_POLICY` | Executed within pre-approved policy envelope |
| 4 | `MODE_AUTHORITY_DELEGATED_AUTONOMY` | Delegated; project owner grants envelope |
| 5 | `MODE_AUTHORITY_RESERVED` | Reserved for future use |

### Presentation Service Names (Orthogonal to Authority Mode)

The `PRESENTATION_SERVICE_*` axis describes what the system communicates to the project owner. It is **not** an alias of any authority mode. A project may have `MODE_AUTHORITY_AUTONOMOUS_WITHIN_POLICY` (high autonomy) with `PRESENTATION_SERVICE_MINIMAL` (low noise) — these are independent.

| Canonical | Description |
|-----------|-------------|
| `PRESENTATION_SERVICE_MINIMAL` | Errors and escalations only |
| `PRESENTATION_SERVICE_STANDARD` | Standard event notifications |
| `PRESENTATION_SERVICE_DETAILED` | Full event stream including debug |

### Canonical Name Map (Entity + State)

#### Design-time

| Concept | Canonical |
|---------|-----------|
| Reasoning structure | `BRAIN` |
| Responsibility boundary | `ROLE` |
| Reusable capability | `SKILL` |
| Stateful sequence | `WORKFLOW` |
| Deterministic capability | `SERVICE` |
| Authority/risk envelope | `POLICY` |
| Reusable execution contract | `AGENT_DEFINITION` |
| Verification contract | `INDEPENDENCE_CONTRACT` |
| Materialized authority grant | `AUTHORITY_ENVELOPE` |
| Identity grant | `FRONT_IDENTITY` |
| mTLS channel | `CHANNEL` |
| Active session | `SESSION` |

#### Runtime

| Concept | Canonical |
|---------|-----------|
| Agent instance | `AGENT_INSTANCE` |
| Workflow instance | `WORKFLOW_INSTANCE` |
| Service instance | `SERVICE_INSTANCE` |
| Bounded assignment | `WORK_ORDER` |
| One execution of a work order | `ATTEMPT` |
| Role-to-fulfiller binding | `ROLE_FULFILLMENT` |
| Plan | `PLAN` |
| Task | `TASK` |
| Verification | `VERIFICATION` |
| Decision | `DECISION` |
| Escalation | `ESCALATION` |
| Resource claim | `RESOURCE_CLAIM` |
| Materialized permissions | `MATERIALIZED_PERMISSIONS` |
| Front Agent instance | `Front Agent AGENT_INSTANCE` |
| Gateway instance | `GATEWAY_SERVICE_INSTANCE` |
| Orchestrator instance | `Execution Orchestrator SERVICE_INSTANCE` |
| Scout instance | `Scout AGENT_INSTANCE` |
| Analyst instance | `Analyst AGENT_INSTANCE` |
| Reviewer instance | `Reviewer AGENT_INSTANCE` |

#### Lifecycle States (Entity-Qualified)

| State | Owner | Canonical | Deprecated Aliases |
|-------|-------|-----------|---------------------|
| Task open | TASK | `TASK_BACKLOG` | "BACKLOG" |
| Task ready | TASK | `TASK_READY` | "READY" (when context-ambiguous) |
| Task running | TASK | `TASK_RUNNING` | "RUNNING" (when context-ambiguous) |
| Task closed | TASK | `TASK_CLOSED` | "CLOSED" (when context-ambiguous) |
| Report pending review | REPORT | `REPORT_PENDING_REVIEW` | "PENDING_REVIEW" |
| Report reviewed | REPORT | `REPORT_REVIEWED` | "REVIEWED" (when context-ambiguous) |
| Report action required | REPORT | `REPORT_ACTION_REQUIRED` | "ACTION_REQUIRED" |
| Report no further attention | REPORT | `REPORT_NO_FURTHER_ATTENTION` | "NO_FURTHER_ATTENTION" |
| Report retired | REPORT | `REPORT_RETIRED` | "RETIRED" (when context-ambiguous) |
| Decision accepted | DECISION | `DECISION_ACCEPTED` | "ACCEPTED" (when context-ambiguous) |
| Decision bound | DECISION | `DECISION_BOUND` | "BOUND" |
| Decision open | DECISION | `DECISION_OPEN` | "OPEN" |
| Front Agent provisioning | Front Agent | `FRONT_PROVISIONING` | "PROVISIONING" |
| Front Agent initializing | Front Agent | `FRONT_INITIALIZING` | "INITIALIZING" |
| Front Agent online | Front Agent | `FRONT_ONLINE` | "ONLINE" |
| Front Agent degraded | Front Agent | `FRONT_DEGRADED` | "DEGRADED" (context-ambiguous) |
| Front Agent reconnecting | Front Agent | `FRONT_RECONNECTING` | "RECONNECTING" |
| Front Agent suspended | Front Agent | `FRONT_SUSPENDED` | "SUSPENDED" (context-ambiguous) |
| Front Agent blocked | Front Agent | `FRONT_BLOCKED` | "BLOCKED" (context-ambiguous) |
| Front Agent updating | Front Agent | `FRONT_UPDATING` | "UPDATING" |
| Front Agent revoking | Front Agent | `FRONT_REVOKING` | "REVOKING" |
| Front Agent retired | Front Agent | `FRONT_RETIRED` | "RETIRED" (context-ambiguous) |
| Gateway starting | Gateway SERVICE | `GATEWAY_STARTING` | "STARTING" |
| Gateway ready | Gateway SERVICE | `GATEWAY_READY` | "READY" (when context-ambiguous) |
| Gateway draining | Gateway SERVICE | `GATEWAY_DRAINING` | "DRAINING" |
| Gateway stopped | Gateway SERVICE | `GATEWAY_STOPPED` | "STOPPED" |
| Gateway degraded | Gateway SERVICE | `GATEWAY_DEGRADED` | "DEGRADED" (context-ambiguous) |
| Orchestrator admission blocked | Orchestrator | `ADMISSION_BLOCKED` | "BLOCKED" (context-ambiguous) |
| Orchestrator idle | Orchestrator | `ORCHESTRATOR_IDLE` | "IDLE" |
| Verification approved | VERIFICATION | `VERIFICATION_APPROVED` | "APPROVED" |
| Verification rejected | VERIFICATION | `VERIFICATION_REJECTED` | "REJECTED" |
| Verification reviewer-blocked | VERIFICATION | `VERIFICATION_BLOCKED` | "BLOCKED" (when context-ambiguous) |
| Verification independent | VERIFICATION | `VERIFICATION_INDEPENDENT` | "INDEPENDENT" |

### Backward Compatibility

All deprecated aliases remain valid for read-only consumption. New artifacts MUST use canonical names. Automated migration is NOT required; manual migration is encouraged on a per-document basis as documents are touched.

### Falsifications Survived

| Claim | Attempt | Result |
|-------|---------|--------|
| One name per state | "REVIEWED shared between report and attempt" | ✓ Falsified: entity-qualified to `REPORT_REVIEWED` vs `VERIFICATION_REVIEWED` |
| RETIRED is unambiguous | "Report and Front Agent both retire" | ✓ Falsified: `REPORT_RETIRED` vs `FRONT_RETIRED` |
| Service Mode = Authority Mode | "Both appear in user-facing text" | ✓ Falsified: distinct dimensions, two axes |
| BLOCKED is unambiguous | "Front Agent BLOCKED vs Orchestrator BLOCKED" | ✓ Falsified: `FRONT_BLOCKED` vs `ADMISSION_BLOCKED` |

### Compatibility with Prior Decisions

| Decision | Compatibility |
|----------|---------------|
| Decisions #1–#5 (ADR-029/030/031) | ✓ Semantics unchanged; only naming layer refined |
| ADR-001..ADR-028 | ✓ All preserved; deprecated aliases valid for backward compat |
| Terminology document | Will be updated to use canonical names in next touch |

### Consequences

- One canonical name per state. Aliases are deprecated, not removed.
- Two-dimensional mode model: `MODE_AUTHORITY_*` and `PRESENTATION_SERVICE_*` are distinct.
- All shared state names are entity-qualified.
- Backward compatibility preserved for read-only consumption.
- Future artifact authorship uses canonical names.

### Preserved as Follow-up (not blockers)

- Terminology document migration to canonical names (on next touch)
- Automated lint/validation of canonical name usage in new artifacts
- Cross-reference table linking every deprecated alias to its canonical form

### Closes

- Section 6 (Exact mode and entity state names) — replaced with this decision


## ADR-033 — Authority Persistence and Evaluation Model

**Status:** Accepted — Decision #7
**Closes:** Section 7 (Authority persistence and evaluation model)
**Accepted:** 2026-09-05

### Five-Layer Authority Stack (Canonical)

```
LAYER 1: DURABLE_AUTHORITY_POLICY
  ↓ (consumes, scopes, qualifies)
LAYER 2: DELEGATED_AUTHORITY
  ↓ (materializes into)
LAYER 3: AUTHORITY_ENVELOPE  (signed; append-only; per ADR-031)
  ↓ (effective-time evaluation; ADR-029 determinism routing)
LAYER 4: RUNTIME_EFFECTIVE_AUTHORITY  (per WORK_ORDER; per ADR-027 projection)
  ↓ (provider-side translation; ADR-028)
LAYER 5: MATERIALIZED_PERMISSIONS  (per attempt; never persistent)
```

### Core Invariant

> **Authority persistence must never imply persistent runtime permission.**

Each layer has a distinct lifetime and storage profile:

| Layer | Lifetime | Persistent? | Owner |
|-------|----------|-------------|-------|
| LAYER 1 `DURABLE_AUTHORITY_POLICY` | Years/decades | YES (immutable) | DPT governance + project owner consent |
| LAYER 2 `DELEGATED_AUTHORITY` | Hours/days/weeks | YES (revocable) | Project owner grants, DPT records |
| LAYER 3 `AUTHORITY_ENVELOPE` | Hours/days | YES (signed, append-only) | DPT signed, Front verified |
| LAYER 4 `RUNTIME_EFFECTIVE_AUTHORITY` | Per WORK_ORDER | NO | Evaluator outputs |
| LAYER 5 `MATERIALIZED_PERMISSIONS` | Per ATTEMPT | NO (re-derived per attempt) | Provider runtime |

### Layer Distinction Clarification (F-001 Admitted)

> **LAYER 4 and LAYER 5 serve architecturally distinct purposes. Consolidation would destroy diagnostic separation.**

| Property | LAYER 4 `RUNTIME_EFFECTIVE_AUTHORITY` | LAYER 5 `MATERIALIZED_PERMISSIONS` |
|----------|---------------------------------------|-----------------------------------|
| **Definition** | Provider-independent governance evaluation at WORK_ORDER scope | Provider/runtime-specific executable permissions at ATTEMPT scope |
| **Owner** | DPT Authority Evaluator SERVICE (universal) | Provider runtime SDK/plug-in (platform-specific) |
| **Semantics** | "Is this WORK_ORDER authorized under current governance?" | "What precise permissions does this provider execute with?" |
| **Failure mode** | Policy violation → ESCALATE/DENY | Provider error → FAILED_ASSERTION |
| **Audit record** | Evaluation record (evaluator-signed) | Materialization record (provider-signed, per attempt) |
| **Revocation impact** | LAYER 2 revocation → LAYER 4 denied | LAYER 4 denial → LAYER 5 never derived |

**Fail-closed ordering is preserved:** LAYER 4 evaluation must succeed before LAYER 5 materialization is attempted. The causal ordering prevents cached or stale execution permissions.

**Two computation sites, not two layers:** The distinction is between *evaluation site* (universal governance) and *materialization site* (platform-specific execution), not between two authority layers. Both are transient (non-persistent) but serve different semantic purposes.

```
LAYER 3 AUTHORITY_ENVELOPE
  ↓
LAYER 4 RUNTIME_EFFECTIVE_AUTHORITY    ← Evaluator SERVICE (universal)
  ↓
LAYER 5 MATERIALIZED_PERMISSIONS       ← Provider runtime (platform-specific)
```

This clarification does not change the five-layer architecture. It preserves distinct owners, lifetimes, failure modes, audit records, and fail-closed ordering.

### Effective-Time Behavior

The effective-time window is the **intersection** of all relevant layer windows. A WORK_ORDER is authorized only if:

```
now ∈ LAYER_3.not_before..not_after
AND (LAYER_2 absent OR now ∈ LAYER_2.validity)
AND LAYER_4 evaluates to allow
AND LAYER_5 re-derived for this attempt
```

### Authority Evaluation Mechanism

The authority evaluation function is **deterministic** for any (LAYER 1, LAYER 2, LAYER 3, time, WORK_ORDER) tuple. Per ADR-029 determinism routing, evaluation is a **SERVICE** — no AGENT required.

| Property | Value |
|----------|-------|
| Owner | `AUTHORITY_EVALUATOR_SERVICE_INSTANCE` (long-lived, per DPT cluster) |
| Inputs | LAYER 1 + LAYER 2 (if present) + LAYER 3 (if present) + current time + WORK_ORDER description |
| Output | `RUNTIME_EFFECTIVE_AUTHORITY` (allow/deny/escalate) |
| Audit | Append-only, signed (per ADR-031) |
| Override rule | Specific policy overrides general mode (already accepted) |

### Preserved Invariants (reaffirmed)

1. **NO EXECUTION BEFORE GOVERNANCE REHYDRATION.** LAYER 1 must be rehydrated from canonical sources before any runtime decision. The Authority Evaluator cannot run without LAYER 1.
2. **NO AGENT EXECUTION BEFORE AUTHORITY MATERIALIZATION.** LAYER 5 is re-derived per ATTEMPT. Provider runtime does not remember a grant between attempts.
3. **Specific overrides general mode.** Already accepted; reaffirmed in effective-time evaluation.

### Revocation Propagation

| Revocation event | Effect on subsequent layers |
|------------------|------------------------------|
| LAYER 1 superseded | Old LAYER 3 envelopes invalid; LAYER 4 denied; LAYER 5 re-derived from new policy |
| LAYER 2 revoked | All LAYER 3 derived from it invalidated; LAYER 4 denied |
| LAYER 3 expired | Per `not_after`; non-replayable |
| LAYER 5 cleared | Per-ATTEMPT only; no state beyond attempt boundary |

### Storage and Audit

| Layer | Storage | Audit record |
|-------|---------|--------------|
| LAYER 1 | DPT canonical (governance) | Policy adoption record (signed) |
| LAYER 2 | DPT (delegation registry) | Delegation grant/revoke record (owner-signed) |
| LAYER 3 | DPT (envelope registry) | Envelope materialization record (DPT-signed) |
| LAYER 4 | None (computed) | Evaluation record (evaluator-signed) |
| LAYER 5 | Provider runtime (transient) | Materialization record (provider-signed, per attempt) |


### Authority × Entitlement × Credits Separation (P2-007 Admitted)

The architecture explicitly separates three orthogonal dimensions:

| Dimension | Definition | Governing ADR | Gate Location |
|-----------|------------|---------------|---------------|
| **AUTHORITY** | What actions are permitted | ADR-033 (five-layer stack) | LAYER 4 evaluation |
| **ENTITLEMENT** | Whether a service/capability is available to the consumer | ADR-050 economy policy | API admission gate |
| **CREDITS** | Economic/accounting data that may inform entitlement policy | ADR-050 | Accounting only |

**Key invariants:**

- `CREDITS ≠ AUTHORITY`. Credits themselves never manufacture or revoke authority.
- `ENTITLEMENT_LOSS ≠ AUTHORITY_REVOCATION`. Entitlement denial affects future
  admission, not existing LAYER 3/4/5 authority.
- `ADMISSIBLE = AUTHORITY_VALID ∧ ENTITLEMENT_VALID ∧ OTHER_APPLICABLE_PRECONDITIONS`

**Explicit admission vs. mid-attempt semantics:**

| Scenario | Effect |
|----------|--------|
| Service admission denied by entitlement policy | New WORK_ORDER/ATTEMPT not created; no authority involved |
| Mid-attempt entitlement loss (credit exhaustion, tier change) | Existing ATTEMPT continues; LAYER 3/4/5 authority unchanged |
| Canonical entitlement policy requires interruption of active work | Must emit separate EXECUTION_CANCELLATION through ADR-036 lifecycle; cannot silently revoke authority |

Entitlement is an admission-gate predicate, not a sixth Authority Layer. It is
not located inside the five-layer authority stack (ADR-033). Economic policy
inputs inform entitlement decisions; they do not directly control runtime
authority.


### Resource Access Compatibility (F-301 Admitted)

AUTHORITY_CAPABILITY ≠ RESOURCE_CONCURRENCY_COMPATIBILITY.

Authority determines whether an operation is permitted. Concurrency compatibility
determines whether independently-authorized operations may safely overlap on a
resource.

Do not infer READ capability from WRITE capability. Do not use lock compatibility
to manufacture authority. Compatibility must be defined semantically per
resource/access mode.
### Falsifications Survived

| Claim | Attempt | Result |
|-------|---------|--------|
| 5 layers distinct | "Materialization = envelope in provider form" | ✓ Falsified: LAYER 5 has no LAYER 3 persistence |
| LAYER 5 never persistent | "Provider may cache for performance" | ✓ Cache allowed only within a single ATTEMPT |
| Specific overrides general | "Mode trumps specific policy" | ✓ Already accepted; reaffirmed |
| Evaluator is SERVICE | "Delegation requires judgment" | ✓ Delegation is LAYER 2 input; evaluation deterministic |
| Authority persistence ≠ runtime permission | "Durable policy = durable grant" | ✓ Falsified: durable policy authorizes materialization; runtime per attempt |
| Rehydration required | "Pre-initialized runtimes skip it" | ✓ Pre-initialized runtimes verify LAYER 1 freshness |

### Compatibility with Prior Decisions

| Decision | Compatibility |
|----------|---------------|
| Decision #1–#6 (ADR-029/030/031/032) | ✓ All preserved; layering is additive |
| ADR-005 (rehydration) | ✓ Rehydration rule preserved |
| ADR-027 (durable state) | ✓ Canonical projection preserved |
| ADR-028 (materialization) | ✓ Per-attempt materialization preserved |
| ADR-029 (determinism) | ✓ Evaluator is SERVICE (deterministic) |
| ADR-031 (Gateway/envelope) | ✓ Envelope signing, audit, allowlist preserved |
| ADR-032 (naming) | ✓ `MODE_AUTHORITY_*` and `AUTHORITY_ENVELOPE` preserved |

### Preserved as Follow-up (not blockers)

- Specific cryptographic envelope format
- LAYER 2 delegation UI for project owners
- LAYER 5 provider-side per-attempt re-derivation mechanism (provider SDK)
- LAYER 3 nonce exhaustion policy
- Cross-DPT-cluster LAYER 3 synchronization (multi-region)

### Closes

- Section 7 (Authority persistence and evaluation model) — replaced with this decision


## ADR-034 — Resource Lock / Lease Model

**Status:** Accepted — Decision #8
**Closes:** Section 8 (Resource lock / lease model)
**Accepted:** 2026-09-05

### Core Principle

> **A lock/lease is never an authority source. Authority is established *before* lease acquisition.**

DPT uses **leases with fencing tokens**, not bare locks. A lease is a *projection* of LAYER 4 (RUNTIME_EFFECTIVE_AUTHORITY per ADR-033), not a source of authority. Revocation of LAYER 2 or LAYER 3 invalidates all held leases.

### Ownership vs Lease vs Lock

| Concept | Holds authority? | Lifetime | DPT primitive? |
|---------|-----------------|----------|----------------|
| Ownership (LAYER 2 delegation) | YES | Days/years | YES (delegation) |
| Lease (capability token) | NO | Seconds/hours | YES (canonical) |
| Lock (mutual exclusion only) | NO | Per attempt | NO (use lease) |

**Bare locks are NOT a DPT primitive.** Leases with fencing tokens are the canonical mechanism.

### Lease State Machine

```
LEASE_REQUESTED → LEASE_GRANTED → LEASE_ACTIVE
                                    ↕
                              LEASE_SUSPECTED
                                    ↓
                              LEASE_EXPIRED (auto on TTL)
                                    ↓
                              LEASE_RELEASED (idempotent)
                                    OR
                              LEASE_REVOKED (LAYER 2/3 invalidated)
```

| State | Definition |
|-------|------------|
| `LEASE_REQUESTED` | Acquisition attempt; preflight check in progress |
| `LEASE_GRANTED` | Preflight passed; lease_id assigned |
| `LEASE_ACTIVE` | Now ∈ ttl AND liveness signal current AND fencing valid |
| `LEASE_SUSPECTED` | TTL not expired but liveness missed |
| `LEASE_EXPIRED` | TTL elapsed; auto-transition |
| `LEASE_RELEASED` | Explicit release; idempotent |
| `LEASE_REVOKED` | Authority invalidated (LAYER 2/3) |

### Access Modes (per ADR-024)

| Mode | Compatible with | Fencing |
|------|-----------------|---------|
| `READ` | READ (concurrent) | Shared lease_id |
| `WRITE` | (none) | Exclusive lease_id |
| `EXCLUSIVE` | (none, blocks all reads) | Exclusive lease_id |

**No silent upgrades.** A `READ` cannot become a `WRITE` without release + re-acquisition.

### Acquisition Rules

Lease acquisition is permitted only if:
1. The acquiring WORK_ORDER's `RESOURCE_CLAIMS` includes the resource
2. Acquisition is within LAYER 4 effective-time window
3. Fencing token matches the LAYER 4 evaluation
4. Access mode is one of {READ, WRITE, EXCLUSIVE}
5. Orchestrator preflight passes (no cycle, compatible mode)

### TTL and Renewal

| Property | Value |
|----------|-------|
| Default TTL | Per attempt (configurable) |
| Maximum TTL | Resource-specific; enforced by Orchestrator |
| Renewal | Allowed ≤ max renewals; requires liveness signal |
| Renewal request | Must include current fencing token |
| Stale renewal | Rejected (fencing mismatch) |

### Crash Recovery

| Scenario | Detection | Recovery |
|----------|-----------|----------|
| Holder process crash | TTL expiry | Auto-release; new lease possible |
| Network partition | Heartbeat timeout | LEASE_SUSPECTED → EXPIRED |
| Lease manager crash | Re-derive from canonical state (per ADR-027) | Per-resource-type adapter |
| Holder renews after expiry | Fencing token check fails | Reject |

### Deadlock Prevention

1. **Acquire in canonical order** — `(resource_type, resource_id)` sort
2. **Bounded wait** — holder gives up after timeout
3. **No upgrade-in-place** — release + re-acquire required
4. **Conflict-domain pre-declaration** — per ADR-024
5. **Preflight cycle check** — Orchestrator refuses if cycle would form

### Multi-Agent Concurrency

| Scenario | Behavior |
|----------|----------|
| Multiple READ leases | All granted |
| One WRITE + multiple READ | WRITE granted; READs blocked |
| Two WRITE attempts | First granted; second LEASE_BLOCKED |
| EXCLUSIVE + any | EXCLUSIVE only |

### Idempotent Release

```
release(lease_id):
  if state(lease_id) == ACTIVE: transition to RELEASED
  else: no-op (idempotent)
```

Double-release is no-op. Release with wrong lease_id is rejected (no effect). Release after expiry is no-op.

### Adapter Model (per ADR-026)

Each resource type has an adapter that projects underlying storage state into DPT lease state. Adapters do not invent authority; they only project. Authority comes from LAYER 4.

### Failure Modes (Fail-Closed)

| Failure | Response |
|---------|----------|
| Lease manager unreachable | `LEASE_UNKNOWN`; Orchestrator fails WORK_ORDER |
| Fencing token mismatch | `LEASE_REJECTED`; re-evaluate authority |
| Conflict cycle | Preflight refuses; no deadlock possible |
| Adapter fails | `LEASE_INDETERMINATE`; BLOCKED |
| Authority revoked | Leases transition to `LEASE_REVOKED` |
| Invalid TTL (≤0) | Reject acquisition |


### Resource Access Compatibility (F-301 Admitted)

AUTHORITY_CAPABILITY ≠ RESOURCE_CONCURRENCY_COMPATIBILITY.

Authority determines whether an operation is permitted. Concurrency compatibility
determines whether independently-authorized operations may safely overlap on a
resource.

Do not infer READ capability from WRITE capability. Do not use lock compatibility
to manufacture authority. Compatibility must be defined semantically per
resource/access mode.

### Effect Identity Coverage (F-307 Admitted)

Every externally observable or canonical-state-mutating effect boundary must carry
an identity sufficient for deduplication, retry/recovery determination, effect
lineage, and audit correlation. Explicitly ensure coverage at Resource Claim /
Lease effects.

Effect identity does not grant authority.
### Falsifications Survived (7/7)

Lease ≠ authority source / fencing prevents zombie writes / idempotent release / canonical order prevents deadlock / concurrent safety / stale detection via fencing / adapter does not invent authority.

### Compatibility

All prior decisions (1-7) and ADRs (005, 024, 026, 027, 029, 031, 033) verified compatible.

### Preserved as Follow-up

- Specific TTL values per resource type
- Resource-type adapter implementations
- Heartbeat interval policy
- Multi-region lease manager consistency
- Lease audit retention

### Closes

- Section 8 (Resource lock / lease model) — replaced with this decision


## ADR-035 — Verifier Independence

**Status:** Accepted — Decision #9
**Closes:** Section 9 (Verifier independence)
**Accepted:** 2026-09-05

### Core Principle

> **SELF-VERIFICATION is informational only. Closure requires independent verification through a Reviewer satisfying the INDEPENDENCE_CONTRACT.**

### When Independent Verification Is Required

| Risk class | Required verifier | Minimum INDEPENDENCE_CONTRACT |
|------------|-------------------|-------------------------------|
| Reversible within scope | Automated SERVICE check | Optional (advisory) |
| Irreversible within scope | Reviewer AGENT_INSTANCE | REASONING_ISOLATION + EVIDENCE_INDEPENDENCE |
| Cross-project impact | Reviewer + audit | All mandatory dimensions |
| Compliance / safety | Reviewer + human approval | All mandatory + result integrity proof |

The risk class is **derived from existing canonical task/risk/governance classification** (per Decision #3 correction). DPT does not invent a new criticality taxonomy.

### INDEPENDENCE_CONTRACT (refined from ADR-029)

| Dimension | Required for | Definition |
|-----------|--------------|------------|
| `REASONING_ISOLATION` | All independent verification | Reviewer must not inherit producer's reasoning/hidden mutable context |
| `EVIDENCE_INDEPENDENCE` | All independent verification | Reviewer independently obtains or cross-checks evidence |
| `RUNTIME_IDENTITY_ISOLATION` | Irreversible+ | Different AGENT_INSTANCE.id |
| `CONTEXT_ISOLATION` | Irreversible+ | Reviewer context built independently |
| `AUTHORITY_ISOLATION` | Irreversible+ | Reviewer cannot be overruled by producer |
| `RESULT_INTEGRITY` | All independent verification | Reviewer's verdict durable and uncorruptible |

**REASONING_ISOLATION + EVIDENCE_INDEPENDENCE are mandatory for all independent verification.** Other dimensions escalate with risk class.

### Verifier Selection (per ADR-029 determinism routing)

| Verifier type | Class | When used |
|---------------|-------|-----------|
| Automated check (deterministic) | SERVICE | Reversible scope, formal verification |
| Reviewer AGENT_INSTANCE | AGENT_INSTANCE (different definition) | Irreversible scope |
| Human approval | HUMAN_ROLE_FULFILLMENT | Compliance / safety |
| External environment | SERVICE (external adapter) | Cross-system verification |

### Conflicting Verification Evidence

| Conflict | Resolution |
|----------|------------|
| Producer PASS, Reviewer FAIL | FAIL wins (safety-first); produce diff; producer may re-attempt |
| Two Reviewers disagree | Escalate to higher-authority Reviewer or HUMAN_GATE |
| Reviewer unable to verify | `VERIFICATION_BLOCKED`; Orchestrator treats as failure |
| Reviewer PASS but later audit finds issue | Result integrity proof identifies failure point |
| Self-verification conflicts with independent | Independent wins (always) |

**Rule:** When verification evidence conflicts, the **higher-independence verdict wins**.

### Self-Review Prohibition

The producer-self-review-prohibition rule is a **workflow rule**, not a definition rule. The WORKFLOW definition must specify a VerifierRole slot distinct from the producer.

### Definition Inequality Is Necessary But Not Sufficient

Two Reviewers with different AGENT_DEFINITIONs may still share context, authority, or evidence. Therefore: **independence is established by satisfying all mandatory INDEPENDENCE_CONTRACT dimensions**, not by definition inequality alone.

### Verification Record

Every independent verification produces a `VERIFICATION_RECORD`:
- Verifier AGENT_INSTANCE.id
- AGENT_DEFINITION.id
- INDEPENDENCE_CONTRACT satisfaction proof
- Evidence references
- Verdict (APPROVED / REJECTED / BLOCKED)
- Timestamp
- Signature

A VERIFICATION_RECORD is required for closure of any TASK whose risk class requires independent verification.

### Orchestrator's Role

The Orchestrator:
- **Refuses** to close a TASK if INDEPENDENCE_CONTRACT dimensions are unsatisfied
- **Rejects** self-verification as sufficient closure
- **Routes** conflicting evidence per the resolution rules
- **Maintains** the audit chain linking producer attempt → verification → closure

The Orchestrator does not itself verify; it enforces the verification rule.


### Verification Scoping (P2-003 Admitted)

A `VERIFICATION_RECORD` binds to the **immutable artifact/effect identity** and
its verification assumptions, not merely to an ATTEMPT identity.

Reuse of a prior VERIFICATION_RECORD is permitted **if and only if** all of
the following hold:

1. The exact verified artifact/effect identity is unchanged
   (`artifact_hash`, `effect_checksum`, or equivalent deterministic identity)
2. All independence requirements remain satisfied
   (INDEPENDENCE_CONTRACT dimensions still met by the verifier)
3. Risk/verification assumptions remain valid
   (same risk class, same evidence requirements)
4. No superseding governance event invalidates the verification basis

If a retry produces a **different artifact/effect identity**, new independent
verification is required regardless of attempt lineage.

If a retry produces an **identical artifact/effect identity**, the prior
VERIFICATION_RECORD may be reused provided conditions 2–4 hold.

This rule prevents FALSE CLOSURE where a verification record for artifact V1
is incorrectly applied to a different artifact V2 produced by a retry.


### Verification Reuse Basis (F-304 Admitted)

VERIFICATION_BASIS is the set of conditions under which a VERIFICATION_RECORD
remains reusable. It must account for at least:

- artifact/effect identity
- verification scope
- evidence set
- assumptions
- independence requirements
- applicable policy/risk basis

Unchanged artifact identity alone is insufficient for reuse. New evidence that
falsifies or materially changes the verification basis invalidates reuse even when
the artifact/effect identity is identical.

Do not introduce a closed taxonomy of possible failure classes.
### Falsifications Survived (7/7)

Self-verification insufficient / definition inequality insufficient / independent always required / voting resolution / Orchestrator self-verify / audit tampering / identical-model reviewers.

### Compatibility

All prior decisions (1-8) and ADRs (022, 025, 029, 031, 033) verified compatible.

### Preserved as Follow-up

- Risk class derivation function (per project/task type)
- INDEPENDENCE_CONTRACT dimension validators
- VERIFICATION_RECORD schema
- Human Gate integration for compliance/safety
- Cross-system verification adapters

### Closes

- Section 9 (Verifier independence) — replaced with this decision


## ADR-036 — Retry, Cancellation, and Revocation Semantics

**Status:** Accepted — Decision #10
**Closes:** Section 10 (Retry, cancellation, and revocation semantics)
**Accepted:** 2026-09-05

### Semantic Separation (Canonical)

| Term | Trigger | Scope | Authority | Precedence |
|------|---------|-------|-----------|------------|
| `RETRY` | Transient failure | Same WORK_ORDER, new ATTEMPT | Producer (via Orchestrator) | Lowest |
| `CANCELLATION` | Owner/Orchestrator decision | WORK_ORDER or WORKFLOW | Owner / Orchestrator | Medium |
| `REVOCATION` | Authority invalidation | Project/role/envelope scope | DPT (owner co-signature) | **Highest** |

> **REVOCATION > CANCELLATION > RETRY** at all times. Revocation invalidates authority before further execution.

### Retry Semantics

| Property | Value |
|----------|-------|
| Retry budget | Per WORK_ORDER (configurable) |
| Backoff | Exponential with jitter |
| Max retries | Enforced by Orchestrator |
| New ATTEMPT | Yes (per ADR-029); ATTEMPT_LINEAGE preserved |
| Idempotency | Required for retriable operations |

**Retry-eligible failures:** transient, rate-limit (429), provider 5xx  
**Not retry-eligible:** auth, schema, 4xx (except 429) — escalate

### Cancellation Semantics

| Property | Value |
|----------|-------|
| Cooperative | Producer checks at safe points |
| Forced | Grace period exceeded → `ATTEMPT_ABORTED` |
| Safe points | Producer-defined; minimum once per work unit |
| Compensation | Required for side effects |
| Partial results | Recorded; never silently discarded |

### Revocation Semantics

| Property | Value |
|----------|-------|
| Atomicity | Atomic across affected scope |
| Authority invalidation | LAYER 2/3/4 affected immediately |
| Lease invalidation | All affected → `LEASE_REVOKED` (per ADR-034) |
| ATTEMPT invalidation | Active → `ATTEMPT_ABORTED` at safe point or immediately |
| Closure invalidation | Denied if revocation precedes |
| Post-closure revocation | `POST_CLOSURE_REVOCATION` flow |

### Precedence Rule (Canonical)

```
For any active ATTEMPT:
  if REVOCATION issued:
    abort ATTEMPT; invalidate leases; invalidate closure
  elif CANCELLATION issued:
    signal cooperative; force abort after grace
  elif RETRY eligible:
    new ATTEMPT under same WORK_ORDER; lineage preserved
```

### Race Conditions Resolved

| Race | Resolution |
|------|------------|
| Revocation during active ATTEMPT | Immediate abort; leases revoked |
| Revocation during verification | Verification result subject to revocation |
| Two parallel ATTEMPTs same WORK_ORDER | Lease fencing prevents |
| Revocation during parallel execution | Atomic across scope |
| Closure before revocation | Closure denied if revocation precedes |
| Revocation after closure | `POST_CLOSURE_REVOCATION` flow |


### Race Condition Expansion (P2-001 Admitted)

The original table covers revocation during active ATTEMPT but omits the intermediate
states between failure and retry approval. The following cases are now explicit:

| Race | Resolution |
|------|------------|
| Revocation after ATTEMPT failure but before retry approval | Retry denied; authority has been invalidated |
| Revocation after retry approved but before new ATTEMPT execution | ATTEMPT aborted; leases revoked |

**Every retry is a new ATTEMPT and must re-evaluate current authority at approval time.**
No retry may inherit stale materialized permissions from a prior ATTEMPT.

The precedence chain remains: **REVOCATION > CANCELLATION > RETRY** at all times.


### Effect Recovery Contract (F-302 Admitted)

Define an EFFECT_RECOVERY_CONTRACT that distinguishes effect semantics, including
at minimum:

- idempotent / replay-safe
- reversible
- compensatable
- irreversible / non-compensatable

Recovery behavior derives from effect semantics. Compensation is only one possible
recovery strategy. Do not introduce COMPENSATION_REQUIRED as a universal lifecycle
state. For irreversible or non-compensatable uncertainty, use existing governed
reconciliation / halt / escalation mechanisms as applicable rather than inventing
a universal recovery transition.

### Decision Supersession Impact (F-303 Admitted)

Decision supersession requires governed impact evaluation across the complete
execution basis, including applicable:

- authority basis
- policy basis
- safety constraints
- verification basis
- integration conditions
- other canonical dependencies referenced by the admitted work

Impact evaluation itself has no runtime authority. If execution remains valid, no
execution transition is emitted. If execution basis becomes invalid, route through
the lifecycle that owns the required effect: RE-EVALUATION / CANCELLATION /
REVOCATION as canonically applicable.

DECISION_SUPERSESSION must not directly manufacture runtime effects.

### Verification Reuse Basis (F-304 Admitted)

VERIFICATION_BASIS is the set of conditions under which a VERIFICATION_RECORD
remains reusable. It must account for at least:

- artifact/effect identity
- verification scope
- evidence set
- assumptions
- independence requirements
- applicable policy/risk basis

Unchanged artifact identity alone is insufficient for reuse. New evidence that
falsifies or materially changes the verification basis invalidates reuse even when
the artifact/effect identity is identical.

Do not introduce a closed taxonomy of possible failure classes.
### Falsifications Survived (7/7)

Retry=revocation / cancellation sufficient / revoc queued / retry idempotent-by-default / revocation gradual / cancellation overrides revocation / parallel attempts safe.

### Compatibility

All prior decisions (1-9) and ADRs (029, 031, 033, 034, 035) verified compatible.

### Preserved as Follow-up

- Specific retry budget per resource type
- Cancellation grace period policy
- Compensation pattern library
- `POST_CLOSURE_REVOCATION` workflow definition
- ATTEMPT_LINEAGE audit retention

### Closes

- Section 10 (Retry, cancellation, revocation semantics) — replaced with this decision


## ADR-037 — Task Graph Mutation Rules

**Status:** Accepted — Decision #11
**Closes:** Section 11 (Task graph mutation rules)
**Accepted:** 2026-09-05

### Core Principle

> **Graph mutation must not retroactively legitimize an already-started execution.**

A mutation in revision N+1 cannot re-interpret an execution that occurred in revision N. Append-only transition history is the source of truth.

### Mutation Operations

| Operation | Authority |
|-----------|-----------|
| `ADD_TASK` | Orchestrator + scope |
| `REMOVE_TASK` (never executed) | Orchestrator |
| `REMOVE_TASK` (executed/RUNNING) | **PROHIBITED** — use CANCELLATION/REVOCATION |
| `SPLIT_TASK` | Orchestrator + scope |
| `MERGE_TASKS` | Orchestrator + scope |
| `REORDER_TASKS` | Orchestrator + verification gate |
| `MUTATE_DEPENDENCIES` | Orchestrator + verification gate |

### Mutation of Running Work

| Scenario | Resolution |
|----------|------------|
| T RUNNING; new dep on T added | T continues; downstream waits |
| T RUNNING; T removed | T continues; result is historical record |
| T RUNNING; T split | T completes; split halves inherit lineage |
| T RUNNING; T merged with T' | T completes; merged lineage |
| T RUNNING; new task U depends on T | U admitted after T closes |
| T RUNNING; acceptance criteria changed | T completes against *old* criteria |

### Verification-Pending Work

Verification in progress runs against the graph revision that admitted the attempt. Mutations do not re-evaluate in-flight verification.

### Concurrent Mutations

Serialized through Orchestrator's single mutation gate. Loser is rejected and must re-apply. No concurrent mutations.

### Cycle Introduction

Preflight mandatory per ADR-034. No mutation may create a cycle. Cycle detected after mutation → revert to prior revision + alarm.

### READY/Admitted Effects

| Mutation | Effect |
|----------|--------|
| Add task (no deps) | READY next cycle |
| Add task (with deps) | Not READY until deps close |
| Add dep on READY | READY → NOT_READY |
| Remove dep | New READY path possible next cycle |
| Split READY | Both inherit READY if both deps met |
| Remove ADMITTED | ADMITTED completes; future admission re-evaluates |

**Mutations do NOT retroactively change ADMITTED tasks.**

### Lineage Record (Canonical)

Every mutation produces a `GRAPH_MUTATION_RECORD`:
- Graph revision (monotonic)
- Mutation type
- Author (AGENT_INSTANCE.id or HUMAN)
- Timestamp
- Pre/post graph hash
- Affected tasks
- Reason
- Signature

### Determinism

DAG recalculation deterministic per (current state, graph revision). Mutations serialized through single gate. Audit chain hash-linked.

### Precedence: Graph Mutation vs. Authority Revocation (F-002 Admitted)

> **GRAPH_REMOVAL ≠ AUTHORITY_REVOCATION. OLD_GRAPH_PIN ≠ OLD_AUTHORITY_PIN.**

| Operation | Scope | Effect on running work | Precedence |
|-----------|-------|------------------------|------------|
| Ordinary graph removal (administrative) | DAG level | Task continues on old graph pin | ADR-037 |
| Authority revocation (security/governance) | LAYER 2/3 level | Task aborts; leases revoked | ADR-036 |
| Cancellation (owner/Orchestrator) | WORK_ORDER level | Cooperative abort | ADR-036 |

**Canonical precedence rule:**
```
For any active ATTEMPT:
  if REVOCATION issued → abort ATTEMPT; invalidate leases; invalidate closure (ADR-036)
  elif CANCELLATION issued → signal cooperative abort (ADR-036)
  elif task removed from graph (non-revocation administrative) → continue on old graph pin (ADR-037)
```

**Key distinction:**
- GRAPH_REMOVAL operates at the DAG level (task presence/absence)
- AUTHORITY_REVOCATION operates at the LAYER 2/3 level (permission invalidation)
- A task can be removed from the graph but still have active authority (continues executing)
- A task can remain in the graph but lose authority (revocation invalidates LAYER 4/5)

This clarification does not redesign ADR-037. It makes explicit the precedence relationship with ADR-036.


### State Pinning for Closure (P2-002 Admitted)

When closing a TASK that was removed from the graph during execution, the
Orchestrator MUST distinguish two categories of state validation:

| Validation Category | State Source | Rationale |
|---------------------|--------------|-----------|
| Historical execution legitimacy | Admission-time graph revision | The task was admitted under this revision; its authority derives from that point |
| Current/downstream eligibility | Current canonical graph state | Determines whether dependents remain valid under present topology |

**Current graph state must NOT be used to retroactively invalidate historically
valid execution** unless a separate cancellation/revocation/governance event applies
(per ADR-036 precedence).

This complements the existing F-002 clarification:
> GRAPH_REMOVAL ≠ AUTHORITY_REVOCATION. OLD_GRAPH_PIN ≠ OLD_AUTHORITY_PIN.

### Falsifications Survived (7/7)

Retroactive legitimation / removal of executed / concurrent mutations / cycle introduction / re-verify after mutation / lineage loss / removal replaces revocation.

### Compatibility

All prior decisions (1-10) and ADRs verified compatible.

### Preserved as Follow-up

- Specific mutation scope definitions
- Verification gate implementation
- Cross-project mutation propagation
- Graph hash algorithm
- Mutation rate limits

### Closes

- Section 11 (Task graph mutation rules) — replaced with this decision


## ADR-038 — Merge Ownership and Integration Authority

**Status:** Accepted — Decision #12
**Closes:** Section 12 (Merge ownership and integration authority)
**Accepted:** 2026-09-05

### Core Principle

> **Producing an artifact must never imply authority to integrate it.**

Integration authority is explicitly derived from LAYER 2/3 over the target scope. It is never implicit in producing an artifact, running an attempt, or owning a branch.

### Three Distinct Roles

| Role | Authority | Action |
|------|-----------|--------|
| **Proposer** | LAYER 4 over artifact | Submit INTEGRATION_PROPOSAL |
| **Authorizer** | LAYER 2/3 over target | Approve/reject |
| **Integrator** | LAYER 4 with INTEGRATION_SCOPE token | Apply merge |

**Proposer ≠ Authorizer ≠ Integrator. No role collapse.**

### Authority Derivation (Canonical)

```
INTEGRATION_AUTHORIZATION = derived from
  LAYER 2 (DELEGATED_AUTHORITY) over target scope
  + LAYER 3 (AUTHORITY_ENVELOPE) with effective window
  + integration-specific scope attribute
  + (optional) explicit human approval
```

### Integration Workflow

```
1. PROPOSE → 2. PREFILIGHT → 3. VERIFY → 4. AUTHORIZE → 5. EXECUTE → 6. RECORD → 7. RE-EVALUATE
```

| Step | Owner | Authority |
|------|-------|-----------|
| PROPOSE | Producer | LAYER 4 over artifact |
| PREFILIGHT | Orchestrator | Cycle, stale-base, lease checks |
| VERIFY | Reviewer (per ADR-035) | INDEPENDENCE_CONTRACT |
| AUTHORIZE | Authorizer | LAYER 2/3 over target |
| EXECUTE | Integrator | LAYER 4 + INTEGRATION_SCOPE |
| RECORD | Orchestrator | Audit chain |
| RE-EVALUATE | Orchestrator | Downstream re-eval per ADR-037 |

### Conflict Resolution

| Type | Resolution |
|------|------------|
| Textual | Surface; Authorizer arbitrates |
| Semantic | Reviewer detects; Authorizer arbitrates |
| Schema | Verifier fails; reject |
| Authority | Higher-authority scope wins |

### Stale-Base / Dependency Drift

Detected pre-integration. Integration cannot proceed without re-verification.

### Cross-Project Integration

DPT-mediated authority required. No silent cross-project writes. Coordinated rollback.

### Rollback

Revert is integration; requires integration authority. No privileged revert.


### Effect Identity Coverage (F-307 Admitted)

Every externally observable or canonical-state-mutating effect boundary must carry
an identity sufficient for deduplication, retry/recovery determination, effect
lineage, and audit correlation. Explicitly ensure coverage at Integration
authorization/execution effects.

Effect identity does not grant authority.
### Falsifications Survived (8/8)

Producer=integrator / implicit authority / concurrent integrations / silent resolution / stale-base OK / cross-project without DPT / revert is free / authorizer=producer.

### Compatibility

All prior decisions (1-11) and ADRs (029, 031, 033, 034, 035, 036, 037) verified compatible.

### Preserved as Follow-up

- Specific integration_proposal schema
- Conflict surface UI/UX
- Cross-project DPT mediation flow
- Integration audit retention
- Branch protection gate definitions

### Closes

- Section 12 (Merge ownership and integration authority) — replaced with this decision


## ADR-039 — Routing Taxonomy

**Status:** Accepted — Decision #13
**Closes:** Section 13 (Routing taxonomy)
**Accepted:** 2026-09-05

### Core Principle

> **Routing policy is decoupled from routing execution. Routing is not coupled to specific agents, models, or providers.**

### Routing Dimensions

| Dimension | Purpose |
|-----------|---------|
| `TASK_TO_ROLE` | ROLE fulfillment |
| `CAPABILITY` | Capability match |
| `MODEL_PROVIDER` | Model/provider for AGENT_INSTANCE |
| `RETRY_FALLBACK` | Alternative when primary fails |
| `ESCALATION` | Higher tier on boundary |
| `VERIFICATION` | Verifier for INDEPENDENCE_CONTRACT |

### Routing Precedence (Canonical)

```
1. AUTHORITY: filter by LAYER 2/3/4
2. CAPABILITY: filter by required capabilities
3. AVAILABILITY: filter by health/status
4. DETERMINISTIC_MATCH: unique → select
5. COGNITIVE_RESOLUTION: ambiguous → COORDINATION_REASONING_ROLE
6. FALLBACK: deterministic fallback
7. ESCALATION: HUMAN_GATE
```

**Authority is always first. Deterministic first; cognitive only for ambiguity.**

### Routing Policy vs Execution

| Aspect | Policy | Execution |
|--------|--------|-----------|
| Lifetime | Persistent, versioned | Per WORK_ORDER |
| Owner | DPT governance | Orchestrator |
| Type | POLICY | SERVICE or AGENT_INSTANCE |
| Audit | Version chain | Per-event record |

### Determinism Routing (per ADR-029)

| Evidence | Routing class |
|----------|---------------|
| Unique valid candidate | SERVICE |
| Multiple valid w/ priority | SERVICE |
| Ambiguous | COORDINATION_REASONING_ROLE |
| Human gate | HUMAN_ROLE_FULFILLMENT |

### Candidate Health States

| State | Routing behavior |
|-------|------------------|
| Healthy | Eligible |
| Degraded | Eligible w/ flag |
| Suspended | Excluded |
| Revoked | Excluded |
| Unknown | Excluded |
| Stale | Excluded |

### Conflict Resolution

Authority always wins. Runtime evidence wins over embedded policy. No silent downgrades.

### Falsifications Survived (9/9)

Coupling to model / first available / silent override / skip authority / self-route verification / always cognitive / race to first / use suspended / policy binds runtime.

### Compatibility

All prior decisions (1-12) and ADRs verified compatible.

### Preserved as Follow-up

- Specific capability registry schema
- Fallback chain configuration
- Cognitive resolution spawn contract
- Per-routing audit event schema

### Closes

- Section 13 (Routing taxonomy) — replaced with this decision


## ADR-040 — Idempotency and Deduplication Model

**Status:** Accepted — Decision #14
**Closes:** Section 14 (Idempotency and deduplication model)
**Accepted:** 2026-09-05

### Core Principles

> **IDEMPOTENCY = same intended operation produces at most one effect.**
> **DEDUPLICATION = repeated equivalent inputs/events are recognized as duplicates.**

Distinct concepts. Both require explicit operation identity / idempotency keys at effect boundaries.

### Identity Rules

| Identity source | Same intent? | Result |
|-----------------|--------------|--------|
| Same key + same op_type | Yes | Reuse result |
| Same key + different op_type | No — ERROR | Reject (identity conflict) |
| Different key + same op_type | No (new intent) | New effect |
| Retry of same WORK_ORDER | Yes | Reuse key |
| Reconnect replay | Yes | Reuse key |
| New intent | No | New key |

### Effect Boundaries and Identity

| Boundary | Identity | Owner |
|----------|----------|-------|
| WORK_ORDER | `work_order_id` | Orchestrator |
| Provider/tool call | `idempotency_key` | Caller |
| Lease acquisition | `lease_id` (ADR-034) | Lease Service |
| Graph mutation | `mutation_record_id` | Orchestrator |
| Integration proposal | `proposal_id` | Authorizer |
| Verification verdict | `verdict_id` | Verifier |
| Audit event | `event_hash` | Audit Service |
| Reconnect replay | `request_id` | Front Agent (ADR-004) |

### Attempt Lineage Preservation

> **Deduplication must NOT erase distinct ATTEMPT lineage or audit history.**

Dedup recognizes equivalence; it does not erase. Append-only history preserved. Recognition events recorded; source events retained.

### Distinct From Cancellation/Revocation

| Concept | Identity | Effect |
|---------|----------|--------|
| IDEMPOTENCY | `idempotency_key` | Effect at most once |
| DEDUPLICATION | Recognition key | Recognize equivalence |
| CANCELLATION | Cancellation token (ADR-036) | Work stops |
| REVOCATION | Revocation id (ADR-036) | Authority invalidated |

None erases history.


### Semantic Event Identity in Dedup Keys (P2-006 Admitted)

For event-based deduplication (e.g., trigger dedup per ADR-046), the recognition
key must include **semantic event identity** sufficient to distinguish distinct
events sharing the same surface/class. Same-key equivalence recognizes true
duplicates; distinct semantic content requires separate handling regardless of
shared surface or class.


### Effect Recovery Contract (F-302 Admitted)

Define an EFFECT_RECOVERY_CONTRACT that distinguishes effect semantics, including
at minimum:

- idempotent / replay-safe
- reversible
- compensatable
- irreversible / non-compensatable

Recovery behavior derives from effect semantics. Compensation is only one possible
recovery strategy. Do not introduce COMPENSATION_REQUIRED as a universal lifecycle
state. For irreversible or non-compensatable uncertainty, use existing governed
reconciliation / halt / escalation mechanisms as applicable rather than inventing
a universal recovery transition.

### Effect Identity Coverage (F-307 Admitted)

Every externally observable or canonical-state-mutating effect boundary must carry
an identity sufficient for deduplication, retry/recovery determination, effect
lineage, and audit correlation. Explicitly ensure coverage at Resource Claim and
Integration boundaries.

Do not canonicalize implementation-specific field names unless already required by
an existing schema convention.

Effect identity does not grant authority.
### Falsifications Survived (9/9)

Dedup erases / idempotency=dedup / same key different op / retry=new effect / reconnect=new effect / fallback=new effect / audit drop dup / reuse across WORK_ORDERs / provider handles.

### Compatibility

All prior decisions (1-13) and ADRs (004, 029, 034, 036, 037, 038, 039) verified compatible.

### Preserved as Follow-up

- Idempotency key generation algorithms per boundary
- Conflict resolution UI
- Deduplication storage policy
- Cross-project idempotency key namespace

### Closes

- Section 14 (Idempotency and deduplication model) — replaced with this decision


## ADR-041 — Audit Chain and Event Ordering

**Status:** Accepted — Decision #15
**Closes:** Section 15 (Audit chain and event ordering)
**Accepted:** 2026-09-05

### Core Principles

> **Audit ordering must not depend on wall-clock timestamps alone.**
> **Audit records must be tamper-evident without becoming a source of execution authority.**

### Three Ordering Dimensions (Canonical)

| Dimension | Source | Determinism | Use |
|-----------|--------|-------------|-----|
| `CAUSAL_ORDER` | Causal edges | Deterministic | Primary ordering |
| `INGESTION_ORDER` | Audit Service append | Deterministic per ingestor | Secondary |
| `OBSERVED_TIMESTAMP` | Wall-clock | Non-deterministic | Advisory only |

**Causal > Ingestion > Observed. Clock is never primary.**

### Event Record Structure

```
AUDIT_EVENT = {
  event_id, event_type, scope, author,
  prior_event_hash,    // causal chain
  ingestion_seq,       // per-ingestor monotonic
  observed_timestamp,  // advisory only
  payload, signature
  // NO authority fields
}
```

**Invariant:** Audit events do not carry authority fields. Audit is evidence, not authority.

### Tamper-Evidence

| Property | Mechanism |
|----------|-----------|
| Hash chain | `event_hash = H(prior + payload + author + sig)` |
| Per-scope chain | Each scope has own chain head |
| Cross-scope pointer | Event references source chain head |
| Author signature | Required |
| Audit Service signature | Counter-signed on ingestion |
| Verification | Re-compute chain; mismatch = tamper signal |

### Audit vs Authority (Canonical)

Audit records what happened. Authority (LAYER 2/3/4 per ADR-033) authorizes what may happen. **Audit never grants authority.**

### Cross-Scope Consistency

Per-scope chains; cross-scope pointers verify consistency. No global order claimed.

### Retention

- Authority/Lifecycle/Verification/Mutation events: Long
- Operational events: Medium
- Ad-hoc: Per policy


### Cross-Scope Operational Verification (P2-004 Admitted)

To verify causal ordering across scopes:

1. Trace: source event → `audit_chain_ref` → target event's source chain head
2. Verify that the cross-scope pointer references a chain head that causally
   precedes (or is concurrent with) the target event's own chain head
3. A mismatch indicates either tampering or implementation error

**No global event order is claimed.** Per-scope chains with cross-scope pointers
are sufficient for consistency verification. The `OBSERVED_TIMESTAMP` dimension
remains advisory only and must not be used to infer cross-scope causal ordering.


### Effect Identity Coverage (F-307 Admitted)

Every externally observable or canonical-state-mutating effect boundary must carry
an identity sufficient for deduplication, retry/recovery determination, effect
lineage, and audit correlation.

Effect identity does not grant authority.
### Falsifications Survived (9/9)

Wall-clock order / total order / audit grants authority / hash chain only / replay = no event / single global chain / observed = order / audit is authority / tamper optional.

### Compatibility

All prior decisions (1-14) and ADRs (004, 029, 031, 033, 034, 036, 037, 038, 039, 040) verified compatible.

### Preserved as Follow-up

- Hash chain algorithm specification
- Signature scheme
- Cross-scope verification protocol
- Retention enforcement policy
- Tamper signal response

### Closes

- Section 15 (Audit chain and event ordering) — replaced with this decision


## ADR-042 — Conformance and Certification Model

**Status:** Accepted — Decision #16
**Closes:** Section 16 (Conformance and certification model)
**Accepted:** 2026-09-05

### Core Principles

> **Conformance is evaluated continuously. Certification is a bounded, versioned attestation over explicit evidence and scope.**
> **Certification must never grant execution authority.**

### Conformance vs Certification (Canonical)

| Aspect | Conformance | Certification |
|--------|-------------|---------------|
| Lifetime | Continuous | Bounded; versioned |
| Output | Status | Attestation |
| Revocation | N/A | Yes |
| Authority | None | None |

**Conformance ≠ Certification. Neither grants authority.**

### Certification Record (Canonical)

```
CERTIFICATION_RECORD = {
  cert_id, definition_id, definition_version,
  scope, certifier_id, certifier_signature,
  evidence_refs, risk_class,
  issued_at, expires_at,
  invalidation_triggers, status
  // NO authority fields
}
```

### Invalidation Triggers

- Definition change (any semantic change)
- Scope change
- Certifier revoked
- Evidence invalidated
- Conformance fails
- Risk class change
- Provider/model change (if model-pinned per ADR-029)

### Transitive/Blanket Certification (PROHIBITED)

Each definition requires its own certification. Composition certification requires each component certified independently. No auto-inherit from dependencies.

### Certifier Independence

Certifier must satisfy INDEPENDENCE_CONTRACT (per ADR-035) relative to producer. Certifier conflict of interest prohibited for same scope as producer.

### Provider/Model Substitution

Per ADR-029: no model pin → substitution OK at instantiation. Model pin → substitution invalidates certification.

### Certification States

- CERTIFIED
- CERTIFIED_CONFORMANCE_BROKEN
- CERTIFICATION_EXPIRED
- CERTIFICATION_INVALIDATED
- CERTIFICATION_REVOKED
- STALE_CERTIFICATION

### Conformance Check (Canonical)

```
CONFORMANCE_CHECK = {
  check_id, definition_id, version, scope_subset,
  evidence, result, timestamp, checker_id
}
```

### Certification vs Verification

| Aspect | Certification | Verification (ADR-035) |
|--------|---------------|------------------------|
| Purpose | Attest definition conformance | Verify work product per attempt |
| Granularity | Per definition | Per attempt |
| Triggered by | Issuance cycle | Work completion |

### Falsifications Survived (10/10)

Cert grants authority / transitive cert / blanket cert / cert never expires / model substitution / stale cert valid / self-cert / runtime = cert / cert survives def change / cert survives conformance failure.

### Compatibility

All prior decisions (1-15) and ADRs (029, 033, 035, 037, 038, 040, 041) verified compatible.

### Preserved as Follow-up

- Certifier registry schema
- Evidence reference format
- Risk class → cert scope mapping
- Provider-level conformance policy
- Renewal workflow

### Closes

- Section 16 (Conformance and certification model) — replaced with this decision


## ADR-043 — Open Decision Lifecycle and Resolution Governance

**Status:** Accepted — Decision #17
**Closes:** Section 17 (Open Decision lifecycle and resolution governance)
**Accepted:** 2026-09-05

### Core Principles

> **Accepted decisions must not be silently mutated or reopened.**
> **New evidence may challenge any decision, but changing accepted canon requires an explicit governed supersession/revision event with preserved lineage.**
> **Decision lifecycle must not manufacture execution authority or bypass a genuine Human Gate.**

### Decision States (Canonical)

| State | Description | Terminal? |
|-------|-------------|-----------|
| OPEN | Under consideration | No |
| REVIEWING | Stress test in progress | No |
| ACCEPTED | Canonically resolved (ADR) | No (can be SUPERSEDED) |
| REJECTED | Closed without acceptance | Yes |
| DEFERRED | Postponed; revisit trigger | No |
| SUPERSEDED | Replaced; lineage preserved | Yes |
| REOPENED | ACCEPTED re-examined | No |

### Reopening Rule (Canonical)

**Reopening is ALWAYS explicit. Silent reopen is PROHIBITED.** REOPEN_REQUEST + governance approval required. Lineage preserved.

### Lifecycle State Machine

```
OPEN → REVIEWING → ACCEPTED → SUPERSEDED (terminal)
            ├──→ REJECTED (terminal)
            ├──→ DEFERRED → OPEN
            └──→ ACCEPTED → REOPENED → REVIEWING
```

### Decision Record (Canonical)

```
DECISION_RECORD = {
  decision_id, title, state, state_revision,
  scope, evidence_refs, proposals, resolution,
  resolution_authority, supersedes, superseded_by,
  reopened_count, human_gate_required, human_gate_resolution,
  issued_at
  // NO authority fields
}
```

**Invariant:** Decision records carry NO execution authority fields.

### Resolution Authority

| Class | Authority |
|-------|-----------|
| Architecture | DPT governance |
| Implementation | Orchestrator |
| Cross-project | DPT + project owners |
| Compliance/safety | HUMAN_GATE mandatory |
| Reversible | DPT governance |
| Irreversible | HUMAN_GATE mandatory |

### Dependency Impact

- SUPERSEDED: dependent tasks re-evaluate
- REOPENED: in-flight continues against original; new work re-evaluates
- REJECTED: dependent's dependency = UNRESOLVED; re-evaluate

### Concurrent Resolutions

Single decision, single resolution. Concurrent proposals serialized. Newer ADR SUPERSEDES older.


### Decision Supercession × Execution Lifecycle Separation (P2-008 Admitted)

```
DECISION_SUPERSESSION ≠ AUTHORITY_REVOCATION ≠ EXECUTION_CANCELLATION
```

Decision supersession alone has **no direct runtime effect**. It operates on the
Advisory Plane (decision records, evidence, lineage) and does not manufacture
execution authority.

**On decision SUPERSEDED:**

1. Perform governed impact evaluation (per ADR-043 dependency tracking)
2. If execution basis remains valid:
   - Existing work may remain pinned to admission-time decision
   - New work evaluates current canon
3. If execution basis is invalidated:
   - Emit a separate `AUTHORITY_REVOCATION` and/or `EXECUTION_CANCELLATION`
     through the appropriate execution lifecycle (ADR-036)
   - Or terminate/re-admit work under current canon where re-evaluation is required

**Decision version pinning must never become stale-authority pinning.** If the
authority basis changes (via separate revocation), the pin follows the authority,
not the decision record.

`DECISION.REOPENED` state is for re-examining the decision itself, not a
substitute for runtime execution re-evaluation. Execution re-evaluation requires
a separate governed event through the execution/authority lifecycle.


### Decision Supersession Impact (F-303 Admitted)

Decision supersession requires governed impact evaluation across the complete
execution basis, including applicable:

- authority basis
- policy basis
- safety constraints
- verification basis
- integration conditions
- other canonical dependencies referenced by the admitted work

Impact evaluation itself has no runtime authority. If execution remains valid, no
execution transition is emitted. If execution basis becomes invalid, route through
the lifecycle that owns the required effect: RE-EVALUATION / CANCELLATION /
REVOCATION as canonically applicable.

DECISION_SUPERSESSION must not directly manufacture runtime effects.
### Falsifications Survived (10/10)

Silent reopen / concurrent resolutions / self-review / decision grants authority / bypass human gate / SUPERSEDED erases / new evidence = auto-reopen / decision manufactures authority / multi-ADR / deferred forgotten.

### Compatibility

All prior decisions (1-16) and ADRs (027, 033, 035, 041, 042) verified compatible.

### Preserved as Follow-up

- REOPEN_REQUEST schema
- Re-stress test protocol
- Human Gate decision protocol
- Lineage graph format

### Closes

- Section 17 (Open Decision lifecycle and resolution governance) — replaced with this decision



## ADR-044 — Greenfield Advisory Flow

**Status:** Accepted — Decision #18
**Closes:** Section 18 (Greenfield advisory flow) — replaced with this decision
**Accepted:** 2026-09-05

### Core Principle

> **Greenfield advice is non-invasive Advisory Plane output. It never executes, never grants authority, and never instantiates capabilities on the project's behalf. Project owner authority is the only execution gateway.**

### Pipeline (Canonical)

```
INTAKE_RECEIVED
  → INTAKE_CLARIFIED
  → ADVISORY_DRAFTED
  → BLUEPRINT_PROPOSED
  → BLUEPRINT_REVIEW (optional human checkpoint)
  → ACCEPTED_BY_OWNER
  → ADVISORY_FINALIZED
  → TRANSFERRED_TO_PROJECT
```

Once a project materializes, the Front Agent (ADR-030) takes over from `TRANSFERRED_TO_PROJECT`; the Advisory Plane no longer drives the project.

### Plane Separation (Invariant)

| Phase | Plane | Authority |
|-------|-------|-----------|
| INTAKE → ADVISORY_DRAFTED | Advisory | None |
| BLUEPRINT_PROPOSED | Advisory | None |
| ACCEPTED_BY_OWNER | Owner Authority | OWNER |
| TRANSFERRED_TO_PROJECT | Project (when materialized) | OWNER |
| Any execution | Execution Control Plane | Authority Policy (ADR-033) |

**Invariant:** DPT cannot transit BLUEPRINT_PROPOSED → execution on its own. Owner acceptance + explicit Authority grant (ADR-033) are both required.

### Intake Forms (Entity-Qualified per ADR-032)

| Form | Trigger |
|------|---------|
| INTAKE_IDEA_TEXT | Free-text product idea |
| INTAKE_WIREFRAME | Mockups/diagrams |
| INTAKE_CODEBASE_STUB | Existing minimal scaffold |
| INTAKE_CONSTRAINTS_DOC | Pre-existing constraints/requirements |

Each form maps to the same pipeline; only the clarification prompts differ.

### Capability/Agent Assembly Distinction (ADR-029)

| Action | Plane | Allowed? |
|--------|-------|----------|
| ASSEMBLY_RECOMMENDATION (suggest AGENT_DEFINITION / SKILL references) | Advisory | YES |
| ASSEMBLY_INSTANTIATION (spawn AGENT_INSTANCE / execute) | Execution | ONLY with Authority grant |
| ASSEMBLY_BINDING (commit a definition as project-canonical) | Project | OWNER only |

**Invariant:** Advisory can recommend; only Owner binds; only Authority-enriched Execution instantiates.

### Human Gate Placement (ADR-018, ADR-043)

| Checkpoint | Required? |
|------------|-----------|
| INTAKE_CLARIFIED | Optional (auto-clarify when low risk) |
| BLUEPRINT_PROPOSED | **MANDATORY Human Gate** before ACCEPTED_BY_OWNER |
| ASSEMBLY_INSTANTIATION | Authority Policy gate (ADR-033) |

Greenfield is high-uncertainty and high-blast-radius; mandatory Human Gate at blueprint acceptance is non-negotiable.

### Scout Boundary (ADR-002, ADR-003)

Scout has **no role in pure greenfield** (no project to observe). Scout enters the picture only after the project materializes and the Front Agent is provisioned (ADR-030).

### Cross-Project Isolation (ADR-009, Decision #1)

Every advisory record is project-scoped. Cross-project reuse is permitted **only** via the CONTRIBUTION_CANDIDATE path (Decision #16 / ADR-042), never via implicit precedent.

### Advisory Record (Canonical Shape)

```
GREENFIELD_ADVISORY_RECORD = {
  advisory_id, project_id (null until materialization),
  intake_form, intake_payload_hash,
  clarification_log, drafted_blueprint,
  recommended_assembly (references only, no bindings),
  human_gate_artifact, owner_acceptance_artifact,
  state, state_revision, lineage,
  // NO authority fields, NO execution results
}
```

**Invariant:** Advisory records carry no execution results and no authority grants.

### Failure Modes (Canonical)

| Failure | Recovery |
|---------|----------|
| INTAKE_RECEIVED unclarified > 30d | EXPIRED; owner notified |
| BLUEPRINT_PROPOSED rejected | DEFERRED or REJECTED; advisory closed |
| Owner accepts but project never materializes | ADVISORY_FINALIZED held; expires at owner-defined TTL |
| Project materializes post-acceptance | TRANSFERRED_TO_PROJECT; Front Agent provisioning (ADR-030) |
| Authority grant later revoked | In-flight execution halts per ADR-036; advisory remains valid |

### Compatibility

Verified compatible with: ADR-001, ADR-002, ADR-003, ADR-006, ADR-009, ADR-011, ADR-012, ADR-013, ADR-018, ADR-019, ADR-029, ADR-030, ADR-031, ADR-033, ADR-043.

### Falsifications Survived (10/10)

Advisory silently executes / Advisory grants authority / Greenfield assumes connected project / Scout used pre-project / Single intake form / Human Gate bypassed / Advisory state has no lifecycle / Cross-project leakage / Assembly recommendation = instantiation / Greenfield creates authority.

### Preserved as Follow-up

- GREENFIELD_INTAKE_FORMS schema details
- BLUEPRINT_PROPOSED template catalog
- ADVISORY→EXECUTION handoff protocol
- Owner Authority grant ceremony specification

### Closes

- Section 18 (Greenfield advisory flow) — replaced with this decision


## ADR-045 — Proactive DPT Notification Model

**Status:** Accepted — Decision #19
**Closes:** Section 19 (Proactive DPT behavior)
**Accepted:** 2026-09-05

### Core Principles

> **Proactive notification is ADVISORY, never EXECUTION.**
> **No notification without subscription. No acceptance without owner authority.**
> **Severity drives precedence, not arrival time.**
> **Notifications are auditable, throttled, suppressable, and connection-state bounded.**

### Notification Kinds (Canonical, ADR-032 Conformant)

| Kind | Subscribed? | Severity tier |
|------|-------------|---------------|
| `NOTIFY_COMPONENT_AVAILABLE` | YES | LOW |
| `NOTIFY_PITFALL_REPORTED` | YES | LOW |
| `NOTIFY_SECURITY_ADVISORY` | YES | URGENT-capable |
| `NOTIFY_ASSET_UPDATE` | YES | LOW/MED |
| `NOTIFY_CAPABILITY_GAP` | YES | LOW |
| `NOTIFY_ARCHITECTURE_OPPORTUNITY` | YES | LOW |
| `NOTIFY_CONTRIBUTION_OPPORTUNITY` | YES | LOW |

### Severity Tiers (Canonical)

| Tier | Behavior |
|------|----------|
| `SEVERITY_PRECLINICAL` | No notification (signal only) |
| `SEVERITY_NOTIFY` | Batched, rate-bounded |
| `SEVERITY_URGENT` | Immediate; bypasses throttle; never delayed |

### Subscription Model (Canonical)

```
PROJECT_SUBSCRIPTION = {
  project_id,
  accepted_kinds: [NOTIFY_*],
  severity_floor: SEVERITY_NOTIFY (default),
  per_kind_throttle: { kind: { max_per_day, cooldown_sec } },
  per_kind_suppress: { kind: bool },
  routing_target: FRONT_AGENT_INSTANCE | OWNER_DIRECT
  // NO execution authority fields
}
```

### Notification Record (Canonical)

```
PROACTIVE_NOTIFICATION = {
  notification_id, kind, severity,
  project_id, subscription_ref,
  advisory_only: true,           // INVARIANT: always true
  payload_ref, evidence_refs,
  issued_at, expires_at,
  supersedes, superseded_by,
  audit_chain_ref
  // NO authority fields
}
```

**Invariant:** `advisory_only: true` is mandatory and immutable. No record may be mutated to `false`.

### Throttle & Aggregation

- Per-kind max rate (default 5/day)
- Aggregation window (default 4h): multiple LOW notifications batch into one digest
- Per-project fanout bounded by `PROJECT_CONNECTION_STATE` (per ADR-030)
- `NOTIFICATION_SUPERSEDED` emitted when newer supersedes older for same kind+target

### Project Connection State Gating

| Front Agent state (ADR-030) | Notification fanout |
|------------------------------|---------------------|
| PROVISIONING / INITIALIZING | Buffered, delivered on ONLINE |
| ONLINE | Direct |
| DEGRADED | Buffered, retry-bounded |
| RECONNECTING | Buffered |
| SUSPENDED-BLOCKED | Suspended; owner-routed |
| REVOKING / RETIRED | Dropped (notification → `NOTIFICATION_DROPPED_PROJECT_INACTIVE`) |
| UPDATING | Buffered |

### Authority Boundary (Canonical)

- DPT may ISSUE the notification.
- Front Agent (if present) may ROUTE the notification.
- Project owner (HUMAN) may ACCEPT, DEFER, REJECT, or SUPPRESS.
- No notification may itself trigger any Task, Agent INSTANCE, claim, lease, or Authority grant.

### Contribution Opportunity Boundary

Per ADR-009 (Project Intelligence is project-owned):
- DPT may ask "does this fit your project?" with anonymized templates.
- DPT MUST NOT publish project details, dependencies, or stack to other projects.
- Cross-project reuse only via explicit `CONTRIBUTION_CANDIDATE` path (ADR-042).

### Silent Project Policy

Silence is not consent. After 3 unanswered URGENT and 14 calendar days, notifications are marked `NOTIFICATION_SUPERSEDED` and the subscription may be auto-paused per project policy.

### Falsifications Survived (10/10)

Notification is execution / push without consent / implicit promise / auto-install / authority bypass / spam / security non-prioritized / silence=consent / contribution leakage / fanout after retirement.

### Compatibility

Compatible with ADR-001, 002, 003, 006, 009, 011, 012, 013, 018, 019, 029, 030, 031, 033, 041, 042, 043, 044. No contradictions.

### Preserved as Follow-up

- Per-kind default throttle values
- Severity classification rubric
- Notification aggregation scheduler details
- Owner-direct routing protocol when Front Agent absent
- Cross-DPT notification deduplication protocol

### Closes

- Section 19 (Proactive DPT behavior) — replaced with this decision


## ADR-046 — Project Intelligence Update Triggers

**Status:** Accepted — Decision #20
**Closes:** Section 20 (Project intelligence update triggers)
**Accepted:** 2026-09-05

### Core Principles

> **Triggers are observation, not action.**
> **Default: targeted refresh. Broad rescan only on threshold breach.**
> **Triggers are project-tunable; DPT provides defaults.**
> **Triggering continues against ADR-030 Front Agent lifecycle; pauses on RETIRED.**
> **Broad rescan produces a new version; prior versions SUPERSEDED with lineage.**

### Trigger Sources (Canonical, 3 classes)

| Class | Examples | Default cadence |
|-------|----------|-----------------|
| `TRIGGER_SCHEDULED` | Cron-like project-tunable | weekly |
| `TRIGGER_EVENT` | dep add/remove; framework upgrade; CVE in dep; breaking change | on event |
| `TRIGGER_SIGNAL` | Front Agent detects drift; verification regression; lint delta | on signal |

### Trigger Action Distinction (Canonical)

| Step | Plane | Authority |
|------|-------|-----------|
| Trigger fires | Advisory / observation | None |
| Scout refresh (targeted) | Observation | None |
| Scout broad rescan | Observation | None |
| Project Intelligence version published | Project-internal | None (project-owned per ADR-009) |
| Notification issued (per ADR-045) | Advisory | None |
| Owner accepts advisory | Owner Authority | OWNER |

### Refresh Modes (Canonical)

| Mode | When | Cost |
|------|------|------|
| `REFRESH_TARGETED` | Any trigger, surface subset | LOW |
| `REFRESH_BROAD` | Threshold breach only | HIGH |

### Broad Rescan Threshold (Canonical, project-tunable)

```
BROAD_RESCAN_THRESHOLD = {
  size_of_change_pct: 25,           // % of surface area changed
  confidence_loss_pct: 15,          // % drop in signal confidence
  time_since_broad_days: 30,       // max staleness
  explicit_owner_request: true     // owner-triggered always allowed
}
```

If any threshold crossed → `REFRESH_BROAD` is eligible. Owner may override.

### Trigger Schema (Canonical)

```
SCOUT_TRIGGER = {
  trigger_id, source_class, source_ref,
  surface_refs, severity_hint,
  recommended_mode: REFRESH_TARGETED | REFRESH_BROAD,
  created_at, cooldown_until,
  superseded_by
  // NO authority fields; NO execution fields
}
```

### Trigger Lifecycle (Canonical)

```
DETECTED → COOLDOWN → FIRED → REFRESH_RUNNING → INTELLIGENCE_VERSION_PUBLISHED
                                                                       ├──→ (no action)
                                                                       └──→ NOTIFY_* (per ADR-045)
```

### Scout Instantiation (ADR-029 Conformant)

- Targeted refresh on deterministic surface: `SCOUT_SERVICE_INSTANCE` (deterministic incremental scan)
- Broad rescan or judgment-requiring surface: `SCOUT_ROLE_INSTANCE` (AGENT_INSTANCE)
- Default: SERVICE; promote to ROLE on threshold breach

### Trigger Budget & Dedup (Canonical)

- Per-project trigger budget: 20/day (default, project-tunable)
- Dedup window: 4h per `(surface_ref, source_class)` tuple
- Aggregation: multiple triggers within window collapse to one REFRESH

### Connection-State Gating (ADR-030)

| Front Agent state | Trigger behavior |
|-------------------|------------------|
| PROVISIONING / INITIALIZING | Buffered |
| ONLINE | Live |
| DEGRADED | Targeted only; broad deferred |
| RECONNECTING | Buffered |
| SUSPENDED-BLOCKED | Paused; owner-routed |
| REVOKING / RETIRED | Dropped; SUPERSEDED with reason `PROJECT_INACTIVE` |
| UPDATING | Paused during update; resumed after |

### Versioning & Lineage (ADR-009 + ADR-043)

Broad rescan produces `INTELLIGENCE_VERSION_N+1` with `supersedes: [INTELLIGENCE_VERSION_N]`. Prior versions are SUPERSEDED but preserved; never destroyed. Audit chain per ADR-041.


### Trigger Dedup Identity (P2-006 Admitted)

Deduplication must recognize **equivalent semantic events**, not merely events
sharing the same `(surface_ref, source_class)` tuple.

The dedup recognition key must include sufficient **semantic event identity**
to distinguish distinct findings affecting the same surface. Two CVEs on the same
dependency are semantically distinct events, not duplicates.

**Corrected dedup key:** `(surface_ref, source_class, event_identity)`
where `event_identity` is a deterministic hash of the event's semantic content
(CVE identifier, vulnerability signature, or equivalent).

- Same `event_identity` + same `surface_ref` + same `source_class` → duplicate → suppress
- Different `event_identity` + same `surface_ref` + same `source_class` → distinct events → both emit (subject to budget/cooldown independently)

No special severity taxonomy (e.g., `SECURITY_CRITICAL`) is introduced solely
for dedup bypass. The semantic identity distinction handles the case generically.


### Bounded Revalidation for Non-Triggerring Evidence (F-305 Admitted)

For evidence classes capable of changing without observable events, bounded
revalidation is required. Permitted mechanisms include evidence-appropriate
approaches such as source revision probes, fingerprints, external checks,
periodic verification, and equivalent freshness evidence.

Time may contribute to revalidation policy but does not itself establish truth.

NO_TRIGGER_OBSERVED ≠ EVIDENCE_CURRENT.

Do not reintroduce a universal fixed TTL. Refresh breadth remains determined by
evidence/context needs, not freshness state alone.
### Falsifications Survived (10/10)

Time-only triggers / every-change-full-rescan / Scout is always AGENT / trigger=action / hard-coded thresholds / cross-project leakage / triggers after RETIRED / authority bypass / trigger storm / broad rescan destroys prior intelligence.

### Compatibility

Compatible with ADR-001, 002, 003, 006, 009, 011, 012, 013, 018, 019, 029, 030, 031, 033, 041, 042, 043, 044, 045. No contradictions.

### Preserved as Follow-up

- Default threshold values per project class
- Surface-area reference scheme
- Trigger→notification routing protocol
- Drift detection algorithm details
- Cost accounting for Scout instances

### Closes

- Section 20 (Project intelligence update triggers) — replaced with this decision


## ADR-047 — DPT Update Propagation Model

**Status:** Accepted — Decision #21
**Closes:** Section 21 (DPT update propagation)
**Accepted:** 2026-09-05

### Core Principles

> **Propagation is ADVISORY, never EXECUTION.**
> **DPT never modifies project code.**
> **Updates are versioned, subscription-gated, and audit-chained.**
> **Deprecation ≠ removal; migration notices are information, not commands.**
> **Compatibility breaks require COMPATIBILITY_BREAK + MIGRATION_GUIDE_REF + DEPRECATION_UNTIL — all three mandatory.**

### Update Kinds (Canonical, ADR-032 Conformant)

| Kind | Default `requires_owner_review` |
|------|---------------------------------|
| `UPDATE_PATCH` | false |
| `UPDATE_MINOR` | true |
| `UPDATE_MAJOR` | true (mandatory) |
| `UPDATE_SECURITY` | true (urgent tier per ADR-045) |
| `UPDATE_DEPRECATION` | true (informational) |
| `UPDATE_REMOVAL` | true (terminal per ADR-043) |
| `UPDATE_INTELLIGENCE` | false (advisory intelligence) |
| `UPDATE_PITFALL` | false (informational) |

### Propagation Record (Canonical)

```
PROPAGATION_RECORD = {
  propagation_id, kind, asset_ref, asset_version,
  compatibility_range, compatibility_break: bool,
  deprecation_until, migration_guide_ref,
  requires_owner_review: bool,
  severity_tier: SEVERITY_*,  // per ADR-045
  audit_chain_ref,           // per ADR-041
  issued_at, expires_at,
  supersedes, superseded_by,
  subscription_ref
  // NO execution fields; NO auto-apply flag
}
```

### Validation Rules (Canonical)

- If `kind == UPDATE_MAJOR` or `UPDATE_REMOVAL` → `requires_owner_review: true` (mandatory, no override)
- If `compatibility_break: true` → `MIGRATION_GUIDE_REF` and `DEPRECATION_UNTIL` mandatory; record rejected if missing
- If `kind == UPDATE_SECURITY` → `severity_tier` ≥ `SEVERITY_NOTIFY`; per ADR-045 may be URGENT
- If `kind == UPDATE_REMOVAL` → asset version becomes `SUPERSEDED` terminal; prior version remains accessible for `DEPRECATION_UNTIL` window

### Subscription & Routing (per ADR-045)

- Per-project subscription declares `accepted_kinds`, `compatibility_floor`, `severity_floor`
- Routing target: `FRONT_AGENT_INSTANCE` (when present) or `OWNER_DIRECT`
- Front Agent state (ADR-030) gates delivery: ONLINE=direct, DEGRADED=buffered, RETIRED=dropped
- Throttle and dedup per ADR-045 defaults

### Versioning & Lineage (ADR-043)

- New asset version PUBLISHES as new record; prior version SUPERSEDED with `supersedes_by` pointer
- `UPDATE_REMOVAL` is the only kind that retires the asset; prior version is preserved for `DEPRECATION_UNTIL` window
- Cross-version lineage graph maintained in DPT

### Migration Notice Contents (Canonical, all required)

- WHAT changed (semver delta + changelog ref)
- WHY changed (motivation ref)
- WHEN issued (timestamp) and when deprecation takes effect
- HOW to migrate (script/template + manual steps)
- BLAST RADIUS estimate (affected surface)
- ROLLBACK plan (to prior compatible version)
- COMPATIBILITY table (what works with what)

### Cross-Project Boundary (ADR-009)

- Asset-level compatibility metadata: ALLOWED (e.g., "works with React ≥18.2")
- Project-level state: PROHIBITED to publish (e.g., "Project X uses React 18.2.0")
- DPT may publish generic ecosystem signals; may NOT publish specific project adoption

### Audit Chain (ADR-041)

Every PROPAGATION_RECORD carries `audit_chain_ref` linking to:
1. The asset version itself
2. The compatibility check that cleared the record
3. The deprecation timeline resolution
4. The subscription that authorized delivery

Project may request re-issuance and DPT can prove delivery from audit chain.

### Falsifications Survived (10/10)

Propagation=execution / implicit acceptance / DPT modifies code / no version pinning / deprecation=removal / migration=command / no subscription / project state leak / no audit / silent compatibility break.

### Compatibility

Compatible with ADR-001, 002, 003, 006, 009, 011, 012, 013, 018, 019, 029, 030, 031, 033, 041, 042, 043, 044, 045, 046. No contradictions.

### Preserved as Follow-up

- Migration guide template catalog
- Compatibility range expression grammar
- Cross-DPT propagation deduplication protocol
- Re-issuance request/response protocol
- Subscription-side migration playbooks

### Closes

- Section 21 (DPT update propagation) — replaced with this decision


## ADR-048 — DPT Network API Contract

**Status:** Accepted — Decision #22
**Closes:** Section 22 (Network API protocol)
**Accepted:** 2026-09-05

### Core Principles

> **Network API is a transport-independent contract. Transport is an adapter; contract is canonical now.**
> **Authentication ≠ Authorization.**
> **All mutating operations require idempotency keys (per ADR-040).**
> **Offline sync never silently overwrites authority state.**
> **Internal and external API surfaces share the envelope, differ in authorization scope.**

### API Envelope (Canonical, all messages)

```
API_MESSAGE = {
  api_version: "vMAJOR.MINOR",
  message_id, correlation_id, causation_id,
  sender_identity: AUTHENTICATION_REF,
  caller_authority: AUTHORIZATION_REF,  // per ADR-033
  idempotency_key,                     // per ADR-040
  severity_tier: SEVERITY_*,           // per ADR-045
  audit_chain_ref,                     // per ADR-041
  payload, signature
}
```

### API Surfaces (Canonical)

| Surface | Audience | Authorization |
|---------|----------|---------------|
| `API_EXTERNAL` | DPT ↔ Project (owner, Front Agent) | Owner scope + subscribed scopes |
| `API_INTERNAL` | DPT ↔ DPT (component, service) | Component scope; per ADR-029 |

Both share envelope. Authorization differs.

### Authentication vs Authorization (Canonical)

- **AUTHENTICATION** = identity claim (caller is who they say they are; cryptographic proof)
- **AUTHORIZATION** = scope check (per Authority Policy, ADR-033)
- API layer enforces BOTH; never collapses them
- Failed authentication → `401_UNAUTHENTICATED`
- Failed authorization → `403_UNAUTHORIZED` (with `required_scope`)

### Versioning (Canonical)

- `API_VERSION` in envelope (mandatory)
- `Accept-Version` header (negotiation)
- Multiple versions coexist; deprecation per ADR-047 (`UPDATE_DEPRECATION` + `UPDATE_REMOVAL` lifecycle)
- Backward compatibility: additive changes OK within MAJOR; breaking → new MAJOR

### Rate Limits (Canonical, per-caller, per-endpoint, per-tenant)

```
RATE_LIMIT = {
  endpoint, caller_scope,
  window_sec, max_in_window, burst_allowance,
  severity_bypass: bool   // URGENT may bypass
}
```

- Default: 60 req/min per endpoint per caller; burst 10
- Security URGENT routes bypass throttle
- 429 response carries `Retry-After`

### Retries & Idempotency (per ADR-040)

- All mutating endpoints REQUIRE `idempotency_key`
- Retry with same key + same payload → cached response (no duplicate effect)
- Retry with same key + different payload → `409_IDEMPOTENCY_CONFLICT`
- Default retry policy: exponential backoff with jitter (project-tunable)
- Retry budget per request: 5 attempts (project-tunable)

### Offline Synchronization (Canonical)

| State class | Conflict resolution |
|-------------|---------------------|
| Advisory state | `LAST_WRITER_WINS` (advisory only) |
| Authority state | CONFLICT → reconcile via authority chain; no silent overwrite |
| Audit state | append-only (per ADR-041); no conflict possible |
| Project Intelligence | SUPERSEDED (per ADR-043); lineage preserved |

Offline queue requirements:
- Durable outbound queue
- Per-mutation idempotency key
- On reconnect: drain queue in `issued_at` order; conflicts reported not overwritten

### Schema Registry (Codec-Neutral)

- Canonical schema definitions (`.proto` or equivalent IDL)
- Bindings: JSON, Protobuf, CBOR, MessagePack (codec adapters, not core)
- Schema versioning matches API versioning
- Project may use any registered binding; DPT prefers Protobuf for canonical messages

### Transport Adapters (Deferred Choice)

Adapter contract is canonical; transport choice is implementation-level:
- HTTP/REST (most common, external)
- gRPC (efficient, internal)
- Message queue (async, advisory fanout per ADR-045)
- In-process (testing, single-process deployments)

No transport is privileged in the contract.

### Method Categories (Canonical, ADR-033 Conformant)

| Category | Authority check | Example |
|----------|-----------------|---------|
| `READ_*` | READ scope | `READ_PROJECT_INTELLIGENCE` |
| `QUERY_*` | READ scope (advisory) | `QUERY_AVAILABLE_COMPONENTS` |
| `NOTIFY_*` | subscription scope (per ADR-045) | `NOTIFY_PROJECT` |
| `UPDATE_*` | WRITE scope + Owner | `UPDATE_SUBSCRIPTION` |
| `AUTHORIZE_*` | Owner scope (per ADR-033) | `AUTHORIZE_CAPABILITY_GRANT` |
| `REVOKE_*` | Owner scope (per ADR-036) | `REVOKE_AUTHORITY` |


### Offline Authority Conflict Resolution Algorithm (P2-010 Admitted)

Offline mutations MUST carry their authority basis and version for reconciliation:

```
OFFLINE_MUTATION = {
  ...existing fields...,
  authority_basis,       // LAYER 2 delegation id active at mutation time
  authority_version,     // State revision of that delegation at mutation time
}
```

**On reconnect, authority conflict resolution algorithm:**

| Step | Condition | Action |
|------|-----------|--------|
| 1 | Offline mutation's `authority_basis` has been revoked/superseded since `authority_version` | **REJECT** mutation (fail-closed) |
| 2 | Current canonical state has newer valid version > `authority_version` | Apply current state; reject offline mutation |
| 3 | `authority_basis` is unverifiable (missing from canonical chain) | **REJECT** mutation (fail-closed) |
| 4 | Concurrent with no deterministic ordering | Escalate to HUMAN_GATE |
| 5 | No conflict detected | Apply mutation |

**Prohibitions:**
- NEVER use last-write-wins for authority state
- NEVER silently overwrite authority with offline state
- NEVER auto-resolve authority conflicts without explicit lineage validation
- HUMAN_GATE escalation ONLY for genuine unresolved governance ambiguity,
  NOT merely because two network states conflict

**Advisory vs. Authority distinction (existing ADR-048):**
- Advisory state: `LAST_WRITER_WINS` (already specified)
- Authority state: fail-closed reconciliation per this algorithm

This aligns with P2-005's bounded offline authority contract for Front Agents.

### Falsifications Survived (10/10)

Network API mandatory / carries authority / single transport / auth=authz / URL-only versioning / no rate limits / retries duplicate / offline undefined / JSON-only / DPT-internal-only.

### Compatibility

Compatible with ADR-001, 002, 003, 006, 009, 011, 012, 013, 018, 019, 029, 030, 031, 033, 036, 040, 041, 043, 044, 045, 046, 047. No contradictions.

### Preserved as Follow-up

- Default rate-limit values per endpoint class
- Schema registry tooling choice
- Offline queue reference implementation
- Transport adapter reference implementation
- API documentation generation pipeline

### Closes

- Section 22 (Network API protocol) — replaced with this decision


## ADR-049 — DPT Pool Architecture

**Status:** Accepted — Decision #23
**Closes:** Section 23 (Pool architecture)
**Accepted:** 2026-09-05

### Core Principles

> **Pool stores DESIGN-TIME definitions, not runtime instances (per ADR-029).**
> **Pool is typed, audit-chained, capability-routed, versioned.**
> **Pool ≠ Project Intelligence: Pool is public-by-design; PI is project-private (per ADR-009).**
> **Validation tier is mandatory metadata on every pool entry.**

### Pool Types (Canonical)

```
POOL_TYPES = {
  POOL_COMPONENT,          // ADR-029 AGENT_DEFINITION
  POOL_MODULE,
  POOL_SKILL,
  POOL_AGENT_DEFINITION,   // ADR-029 design-time
  POOL_PITFALL,
  POOL_PATTERN,
  POOL_DECISION_EVIDENCE,  // ADR-043
  POOL_DECISION            // accepted ADRs are pool-registered
}
```

Each pool type has its own schema, but all share the envelope below.

### Pool Entry Envelope (Canonical)

```
POOL_ENTRY = {
  pool_type, entry_id,
  asset_ref, asset_version,            // per ADR-047
  compatibility_dimensions: {
    framework, runtime, language, os,
    sensitivity_class, governance_class
  },
  validation_tier: VALIDATED | CERTIFIED | REJECTED,  // per ADR-042
  discovery_tags, capability_refs,     // per ADR-039
  lifecycle_state,                     // DRAFT|UNDER_REVIEW|PUBLISHED|DEPRECATED|REMOVED
  supersedes, superseded_by,           // per ADR-043
  audit_chain_ref,                     // per ADR-041
  contributed_by, contribution_proof,  // per ADR-042
  issued_at, expires_at
  // NO execution fields; NO instance pointers
}
```

### Asset Lifecycle (Canonical, 5 states)

```
DRAFT → UNDER_REVIEW → PUBLISHED → DEPRECATED → REMOVED
```

- DRAFT: pre-submission, not visible externally
- UNDER_REVIEW: validation in progress (per ADR-042)
- PUBLISHED: visible, queryable
- DEPRECATED: marked deprecated (per ADR-047); still queryable
- REMOVED: terminal (per ADR-043 SUPERSEDED with lineage); preserved for audit

Re-publishing a DEPRECATED entry creates a NEW version (does not resurrect old).

### Validation Tiers (per ADR-042)

| Tier | Meaning |
|------|---------|
| VALIDATED | Continuous conformance check passing |
| CERTIFIED | Bounded, versioned certification (per ADR-042) |
| REJECTED | Validation failed; not queryable |

Validation tier is mandatory metadata. Missing tier → entry not published.

### Versioning (per ADR-047)

- `MAJOR.MINOR.PATCH` + `COMPATIBILITY_RANGE`
- New version PUBLISHES as new entry; prior SUPERSEDED with `supersedes_by`
- REMOVAL is the only kind that retires the asset from active pool

### Compatibility Dimensions (Mandatory, Multi-Dimensional)

Every entry MUST declare: `framework`, `runtime`, `language`, `os`, `sensitivity_class`, `governance_class`. Empty dimensions = entry not published.

### Discovery & Search (per ADR-039)

Default ranking order:
1. Exact match (full compatibility)
2. Capability match (intersection of required capabilities)
3. Semantic match (tag/text similarity)
4. Fallback (suggest related)

Discovery returns `RELEVANCE_BREAKDOWN` with score per dimension. Discovery is advisory; owner selects.

### Pool vs Project Intelligence (per ADR-009)

| | Pool | Project Intelligence |
|---|------|----------------------|
| Visibility | Public-by-design | Project-private |
| Contents | Reusable definitions | Project-specific findings |
| Owner | DPT-side curation | Project |
| Additions | Contribution-gated (ADR-042) | Project-discovered |
| Audit | Public audit chain | Project-internal audit |

### Pool Mutations (Audit-Chained, per ADR-041)

Every pool mutation (`POOL_ADD`, `POOL_UPDATE`, `POOL_DEPRECATE`, `POOL_REMOVE`) emits a `POOL_MUTATION_RECORD` with `audit_chain_ref`. No silent pool changes.

### Privacy Boundary (per ADR-009)

- Pool entries: anonymized contributor; no project identifiers
- Project Intelligence: full project context; never enters pool
- Border: `ASSET_CAN_BE_CONTRIBUTED` flag with explicit owner approval; cross-project reuse only via `CONTRIBUTION_CANDIDATE` path (ADR-042)

### Anti-Patterns (Canonical Prohibitions)

- Pool storing instances (only definitions; per ADR-029)
- Pool storing project-specific data (project-private data leaks; per ADR-009)
- Silent pool mutations (violates audit; per ADR-041)
- Untyped pool entries (violates typing; per ADR-029)
- Search returning unranked results (violates discovery; per ADR-039)
- Resurrecting DEPRECATED entries in place (violates lineage; per ADR-043)


### Pool Lifecycle × Runtime Authority Minimum Contract (P2-009 Admitted)

```
POOL_REMOVAL ≠ AUTHORITY_REVOCATION
```

Pool lifecycle state is **design-time metadata** and does not itself create or
revoke runtime authority. The following distinctions are mandatory:

| Pool Event | Authority Impact | Downstream Requirement |
|------------|-----------------|----------------------|
| `POOL_ADD` | None (design-time) | N/A |
| `POOL_UPDATE` | None (design-time) | N/A |
| `POOL_DEPRECATE` | None on existing L2/L3 | New authorities cannot reference deprecated entries |
| `POOL_REMOVE` | None on existing L2/L3 | New authorities cannot reference removed entries; existing authorities remain valid |
| `CONTRIBUTOR_WITHDRAWAL` | None (contributor revokes consent) | Same as POOL_REMOVE |
| `LEGAL/SECURITY_INVALIDATION` | May trigger authority re-evaluation | Downstream projects using invalidated entries must re-evaluate under ADR-033 |

**Ordinary pool lifecycle events** affect discovery and new adoption according
to policy but do not silently revoke existing runtime authority.

**Legal/security invalidation** may require downstream authority/execution
re-evaluation, but that effect must occur through an explicit governed
authority/execution event (ADR-036 revocation or ADR-038 integration authority).
The pool entry's `lifecycle_state` field is metadata, not authority.


### Pool Invalidation Semantics (F-306 Admitted)

Separate ordinary pool lifecycle metadata from governed invalidation semantics.
Ordinary deprecation/removal/withdrawal does not directly revoke runtime authority.

Legal/security/safety invalidation must carry structured semantics sufficient to
trigger downstream impact evaluation. The canonical interaction is:

POOL_INVALIDATION_EVENT → IMPACT_EVALUATION → explicit governed authority/execution
transition if required

The Pool event itself does not possess revocation power. POOL_INVALIDATION ≠
AUTHORITY_REVOCATION. Cross-reference ADR-033 for authority persistence and
ADR-036 for execution lifecycle routing.
### Falsifications Survived (10/10)

Flat bag / unidirectional lifecycle / no validation tier / semver-only / binary compat / unranked discovery / no audit / project-visible by default / project-specific in pool / missing dimensions.

### Compatibility

Compatible with ADR-001, 002, 003, 006, 009, 011, 012, 013, 018, 019, 029, 030, 031, 033, 039, 041, 042, 043, 044, 045, 046, 047, 048. No contradictions.

### Preserved as Follow-up

- Default validation rubric per pool type
- Compatibility dimension value registries
- Search ranking algorithm details
- Contribution-candidate schema
- Pool entry storage backend choices

### Closes

- Section 23 (Pool architecture) — replaced with this decision


## ADR-050 — DPT Credit Economy Architecture

**Status:** Accepted — Decision #24
**Closes:** Section 24 (Credit economy)
**Accepted:** 2026-09-06

### Core Principles

> **Credits are an internal governance abstraction, NOT real currency.**
> **Economic actions are advisory policy markers, not execution triggers.**
> **All unit costs and rewards are CONFIGURABLE_WITH_DEFAULTS, not architecture constants.**
> **Free period = temporary access; no permanent entitlement on expiry.**
> **Anti-abuse rules are observable; NEVER silent.**
> **Economy is built on ADR-033 (Authority) + ADR-042 (Validation) + ADR-041 (Audit).**

### Credits as Governance Abstraction

```
CREDIT = {
  credit_unit: "dpt_credit",
  is_currency: false,
  convert_to_fiat: prohibited,
  purpose: "incentive alignment within DPT boundary"
}
```

Credits track contribution quality, usage intensity, and policy compliance. They have no external exchange value.

### Economic Actions (Advisory, ADR-033 Conformant)

| Action | Authority check | Effect |
|--------|----------------|--------|
| `CREDIT_CONTRIBUTE` | Owner scope | Adds to contributor balance |
| `CREDIT_CONSUME` | Owner scope + subscription tier | Deducts from consumer balance |
| `CREDIT_TRANSFER` | Owner scope + ContributionCandidate approval | Moves between project wallets |
| `CREDIT_REVOKE` | Owner scope (anti-abuse) | Removes credits from flagged account |

Each action emits `ECONOMY_MUTATION_RECORD` (see Audit section).

### Policy Configuration Schema (CONFIGURABLE_WITH_DEFAULTS)

```
ECONOMY_POLICY = {
  // Contribution rewards (project-tunable)
  reward_per_component_validated: positive_float,  // default: TBD
  reward_per_pitfall_contributed: positive_float,   // default: TBD
  reward_per_decision_evidence: positive_float,     // default: TBD

  // Consumption costs
  cost_per_large_analysis_run: positive_float,      // default: TBD
  cost_per_broad_rescan_trigger: positive_float,    // default: TBD
  cost_per_cross_project_contribution: positive_float, // default: TBD

  // Request limits (distinct from throttle per ADR-045)
  max_requests_per_tenant_per_minute: integer,       // default: TBD
  max_concurrent_operations: integer,                // default: TBD

  // Subscription tiers (feature flags + request limits, not architecture changes)
  subscription_tiers: [
    { name, request_limit, feature_flags, monthly_budget }
  ],
  // Note: tier list is extensible; tier-specific costs configurable

  // Free period policy
  free_period_days: integer,                         // default: 30
  free_period_limits: {                              // what applies during grace
    no_cost_requests: true,
    capped_requests: integer,                        // bounded during free period
    post_expiry_behavior: "revert_to_defaults"       // NEVER "retain_privileges"
  },

  // Anti-abuse detection
  abuse_detection: {
    rapid_contribution_ratio_threshold: float,       // default: TBD
    duplicate_content_similarity_threshold: float,   // default: TBD
    resource_spike_detection_window_sec: integer,    // default: TBD
    confidence_threshold_for_flagging: float          // default: TBD (must be high)
  },

  // Revision hooks
  last_revision: string,                             // ISO timestamp
  revision_reason: string,                           // why changed
  next_review_date: ISO_timestamp                    // mandatory: no perpetual defaults
}
```

### Anti-Abuse Rules (Observability Mandatory)

Anti-abuse triggers emit structured events; they NEVER operate silently:

```
ABUSE_INDICATOR = {
  indicator_id,
  type: RAPID_CONTRIBUTION | DUPLICATE_CONTENT | RESOURCE_SPIKE | CREDIT_ABUSE,
  detected_at, affected_account, confidence_score,
  evidence_refs,                            // linked audit events
  action_taken: FLAGGED | BLOCKED | ESCALATED,
  appeal_path                             // how affected party contests
}
```

Detection is always visible. Flagging is a policy action, not an automated penalty.

### Free Period Lifecycle

```
SUBSCRIBER_ENTER_FREE → [bounded access] → FREE_PERIOD_EXPIRED → POST_EXPIRY_STATE
```

- Free period grants bounded access defined in policy
- On expiry: automatic revert to post-expiry behavior (never silent retention)
- Post-expiry options: `grace_period_extendable`, `subscription_required`, `read_only_access`
- Each transition audit-chained

### Subscription Tiers (Feature-Lock, Not Architecture Change)

Tiers define:
- Request limits (budgetary gate)
- Feature flags (what capabilities are accessible)
- Monthly credit budget

Tier change updates metadata; it does NOT modify:
- Data schemas
- Protocol
- Cross-project boundaries
- Authority model (ADR-033)

### Cross-Project Credit Transfer

Blocked by default. Permitted only via:
1. `CONTRIBUTION_CANDIDATE` approved (ADR-042)
2. Source project owner consent
3. Both owners acknowledge in audit trail
4. Credit amount documented in migration record

No other path.

### Validation Status × Economy (ADR-042)

| Validation Status | Economic consequence |
|-------------------|---------------------|
| VALIDATED | Eligible for reward per policy |
| CERTIFIED | Eligible for premium reward per policy |
| REJECTED | Submission is auditable event; NO reward; contribution metadata preserved |
| PENDING | Neutral; no economic action |

Validation and economy are independent. A rejected contribution has valid audit trail but zero economic effect.

### Audit Chain (ADR-041)

Every credit operation emits an `ECONOMY_MUTATION_RECORD`:

```
ECONOMY_MUTATION_RECORD = {
  mutation_id, operation_type, actor_ref, project_ref,
  credit_delta, balance_after,
  audit_chain_ref (points to contributing authority + validation records),
  timestamp
}
```

Balance snapshots are DERIVABLE from the audit chain (not stored independently without lineage).

### Integration with Existing ADRs

- Authority (ADR-033): Credits are an additional dimension in the authority envelope; no override
- Validation (ADR-042): Independent tracking; no coupling
- Audit (ADR-041): Economy mutations are first-class audit events
- Decision lifecycle (ADR-043): Economy policy revisions follow ADR-043 decision process
- Network API (ADR-048): Economy operations use the canonical API envelope
- Gateway (ADR-031): Credits cross project boundary only via Gateway with full audit

### Falsifications Survived (10/10)

Credits=money / economy=enforces execution / hard-coded prices / free period permanent / tier changes architecture / silent anti-abuse / validation=economic / free transfer / limits=throttle / economy drifts silently.

### Compatibility

Compatible with ADR-001, 002, 003, 006, 009, 011, 012, 013, 018, 019, 029, 030, 031, 033, 036, 039, 040, 041, 042, 043, 045, 047, 048, 049. No contradictions.

### Explicitly UNRESOLVED (Evidence-Dependent Parameters)

The following are CONFIGURABLE but values are intentionally TBD pending real-project evidence:
- `reward_per_component_validated` (unit magnitude)
- `reward_per_pitfall_contributed` (unit magnitude)
- `cost_per_large_analysis_run` (unit magnitude)
- `max_requests_per_tenant_per_minute` (default budget)
- Anti-abuse thresholds (`rapid_contribution_ratio`, `duplicate_content_similarity`)
- Subscription tier names and feature assignments
- Free period duration (policy-defined; implementation-tunable)

Each unresolved parameter carries a `TODO: evidence-dependent; review on first real deployment` comment in the canonical policy schema. When evidence becomes available, revise via ADR-043 decision process.

### Evidence Requirement

Before finalizing any TBD value:
1. Deploy on ≥1 real project for ≥30 days
2. Collect metric data (contribution rates, abuse patterns, budget exhaustion curves)
3. Document observed ranges
4. Re-evaluate in a dedicated policy revision ADR

Until then: defaults are placeholders; configuration is mandatory; never assume default = optimal.

### Closes

- Section 24 (Credit economy) — replaced with this decision


## ADR-051 — DPT API Monetization Model

**Status:** Accepted — Decision #25
**Closes:** Section 25 (API monetization)
**Accepted:** 2026-09-06

### Core Principles

> **Monetization = value-flow mapping within governance abstraction (ADR-050), NOT external billing.**
> **DPT API does NOT process payments; it emits credit-consumption events.**
> **All monetization decisions are ADR-043 versioned; prior versions preserved.**
> **Rate limits ≠ quotas; congestion control ≠ budgetary gate.**
> **Monetization adds cost assignments; does not change API contract.**

### Monetization Layer (Policy, Not Infrastructure)

```
MONETIZATION_RULE = {
  api_method,                                    // e.g., QUERY_COMPONENTS, UPDATE_PROJECT
  tier_required,                                 // subscription tier gate
  credit_cost_per_call: positive_float,          // CONFIGURABLE_WITH_DEFAULTS (TBD)
  free_tier_exemption: bool,                     // per-tier override
  audit_mode: OBSERVABLE | OWNER_ONLY            // visibility of cost in audit
}
```

Each rule follows ADR-043 decision lifecycle. Revision: `supersedes` + `superseded_by`.

### Credit Cost Mapping (ADR-050 Integration)

Monetization rules reference `ECONOMY_POLICY.cost_per_*` slots.
No new cost dimension is created. Monetization IS economy usage.

```
ECONOMY_POLICY.cost_per_<operation>  ←→  MONETIZATION_RULE.credit_cost_per_call
```

Same value, dual naming: economy side for accounting, monetization side for API routing.

### Billing vs Accounting

| Concern | Ownership | Boundary |
|---------|-----------|----------|
| Credit consumption (internal) | DPT core (ADR-050) | Within DPT authority envelope |
| Usage auditing | DPT core (ADR-041) | Full audit trail |
| External payment processing | Out of scope | Downstream adapter if implemented |
| Currency conversion | Prohibited | Credits ≠ money (ADR-050) |

External billing (if implemented) consumes `ECONOMY_MUTATION_RECORD`s; it does NOT introduce a parallel cost model.

### API Surface Stability

Adding/removing a monetized API route:
- Updates `MONETIZATION_RULE` policy (ADR-043 versioned)
- Does NOT change: message envelope (ADR-048), authentication, authorization model, audit chain structure
- Does NOT affect: non-monetized API routes
- Project-side consumers see same contract; cost attribution changes silently via policy update

### Rate Limits vs Quotas

| Mechanism | Purpose | Config location | Relationship |
|-----------|---------|----------------|--------------|
| RATE_LIMIT (ADR-045) | Congestion control | Throttle policy | Independent |
| QUOTA (ADR-050) | Budgetary gate | Economy policy | Independent |
| ANTI-ABUSE (ADR-050) | Detection and flagging | Abuse detection policy | Independent |

All three can apply to the same endpoint with separate configs.

### Monetized Operation Record (Mandatory, ADR-041)

```
MONETIZED_OPERATION_RECORD = {
  record_id,
  api_method, api_version,
  caller_identity, caller_authority,           // per ADR-048
  subscription_tier,                           // which tier applied
  credit_cost,                                 // credits consumed
  policy_version_ref,                          // which MONETIZATION_RULE set applied
  idempotency_key,                             // per ADR-040
  audit_chain_ref,                             // full chain to authority + economy records
  timestamp,                                   // CAUSAL_ORDER
  // NO payment amount; NO fiat currency
}
```

This record is the single source of truth for monetized activity. No secondary billing ledger exists within DPT.

### Free Tier / Free Period (ADR-050)

- Projects with active free period consume zero credits for exempt operations
- Exemption rules defined in `ECONOMY_POLICY.free_period_limits`
- After expiry: revert to configured default costs (not retroactive)
- Free tier projects still emit `MONETIZED_OPERATION_RECORD` with `credit_cost: 0`

### Pricing Visibility Configuration

Pricing tables (`credit_cost_per_*`) are:
- Default: visible to project owner only
- Configurable: `pricing_visibility` can be set to `OWNER_ONLY` or `AUDIT_TRAIL_ONLY`
- NEVER: publicly broadcast via API response or discovery index
- Project-owner chooses; default is conservative (owner-only)

### Decision Lifecycle (ADR-043)

All monetization changes follow ADR-043:
- NEW rule → OPEN → REVIEWING → ACCEPTED (with version)
- CHANGE rule → REVISION REQUEST → review → new version SUPERSEDES old
- REMOVE rule → DEPRECATION (per ADR-047) → REMOVAL (per ADR-043)

Prior versions always preserved; never overwritten.

### Cross-Project Monetization (Out of Scope)

Cross-project credit transfer is gated by ADR-050 CONTRIBUTION_CANDIDATE approval.
Monetization of cross-project API calls: same rules apply, but transfer requires additional consent step.
DPT core does not mediate commercial arrangements between projects.

### Falsifications Survived (10/10)

Monetization=billing / bypass tiers / public pricing / API is payment processor / free tier needs payment info / unversioned decisions / internal=external pricing / silent monetized ops / rate limit = quota / monetization changes API surface.

### Compatibility

Compatible with ADR-001, 002, 003, 006, 009, 011, 012, 013, 018, 019, 029, 030, 031, 033, 036, 039, 040, 041, 042, 043, 045, 047, 048, 049, 050. No contradictions.

### Explicitly UNRESOLVED

- `credit_cost_per_<operation>` values: CONFIGURABLE_WITH_DEFAULTS, TBD pending real-project usage data
- `pricing_visibility` default: OWNER_ONLY (conservative); project-tunable
- Free tier exemption scope: per-operation, policy-defined; not architecture-defined

Each parameter: configurable, not canonical constant. Future revision tracked via ADR-043.

### Closes

- Section 25 (API monetization) — replaced with this decision

## ADR-053 — V4 Proven Real-Project Value Delivery Admission

**Status:** ADMITTED — 2026-09-07  
**Authority:** OWNER bounded admission for `msaeedlavasani/dpt-v3-e2e-fixture` only.  
**Scope:** Test artifacts/effects only; reversible operations only; no production; no unrelated repositories.  
**V5 transition:** Preserved but exercisable only after independently verified V4 completion.

V4 is admitted as a bounded real-project value-delivery slice, not as a general V4 implementation mandate. The slice is:

```text
PROVENANCE_CHECK
→ REAL_PROJECT_READ / COMPATIBILITY
→ AUTHORIZED_EXTERNAL_WRITE
→ EXTERNAL_READBACK
→ INDEPENDENT_VERIFICATION
→ CAPABILITY / EVIDENCE UPDATE
```

External write requires an explicit derived permission envelope and credentials. Missing credentials produce `GENUINE_HUMAN_GATE = EXTERNAL_WRITE_AUTHORITY_PROVISIONING_REQUIRED`; they do not justify synthetic evidence or V4 closure. No phase, architecture, public-contract, packaging, or V6+ work may be created under this admission.

## ADR-055 — Pool Supply Governance Evolution (Prerequisite to V5)

**Status:** ACCEPTED — 2026-09-07  
**Relationship:** Prerequisite to V5 `POOL → PROJECT REUSABLE VALUE`; not a new Foundation or version.  
**Evolution:** Append-only reconciliation of ADR-049. ADR-049's typed Pools, lifecycle, validation tiers, compatibility dimensions, and Pool ≠ Project Intelligence invariant remain valid. This decision adds the supply-side entity and qualification distinctions.

### Canonical entities

```text
CANDIDATE / INVENTORY ≠ QUALIFIED_REUSABLE_ASSET ≠ CONSUMABLE_POOL_ENTRY
```

A Candidate records an observed or proposed source. A Qualified Reusable Asset has passed the common qualification contract. A Consumable Pool Entry is an admitted, versioned, policy-scoped projection of a qualified asset. No lower layer is consumable by implication.

### Origins and architecture

Supply origins are `DPT_PRODUCED`, `PROJECT_CONTRIBUTION`, and `EXTERNAL_ECOSYSTEM`. The architecture is federated Source Adapters → deterministic Supply Service → cognitive Scout/Curator → independent Falsifier/Reviewer → deterministic Admission Controller. No monolithic authority-bearing Source Agent exists. Discovery and curation cannot finalize qualification; qualification cannot grant project adoption authority.

### Acquisition outcomes

`REFERENCE`, `DEPENDENCY`, `ADAPTER_WRAPPER`, `EXTRACTED_PATTERN`, `REUSABLE_COMPONENT_MODULE`, `SKILL_WORKFLOW`, `KNOWLEDGE_EVIDENCE`, and `REJECT` are distinct outcomes. External discovery defaults to `REFERENCE`. License or provenance ambiguity is `NO_COPY → REFERENCE_ONLY`.

### Common qualification contract

Every qualified asset records stable identity, origin, provenance, license, security/supply-chain status, maintenance health, compatibility, reusability rationale, qualification evidence, maintainer responsibility, version/update lineage, and deprecation semantics. Consumer demand may prioritize investigation but cannot prove reusability. `POOL_PUBLICATION ≠ PROJECT_VALUE_PROVEN`; value requires baseline → bounded consumption → independent project validation → measurable outcome.

### Typed semantics and maintenance

Typed Pools are preserved. Consumable capability Pools are distinct from Reference, Dependency, Evidence/Knowledge, and Source catalogs. Upstream changes create a new qualification revision; published entries never silently mutate. Deprecation preserves lineage, reason, impact, migration guidance, and authority-impact evaluation. Pool publication does not inherit or grant project execution authority.

### Durable control

Candidate, qualification, publication, and version identities are durable idempotency keys. Recovery and repeated discovery reconcile by identity and evidence digest; equivalent records cannot create duplicate consumable entries.

## ADR-056 — Request-Driven Capability Supply and Supply Resolution Memory

**Status:** ACCEPTED — 2026-09-07  
**Relationship:** Append-only evolution of ADR-049 and ADR-055; prerequisite to V5.  
**V5 objective:** `REQUEST → BEST AVAILABLE SUPPLY → PROJECT VALUE`.

### Pool role

The Pool is a curated qualified reusable capability cache/catalog, not the complete universe of capabilities DPT can supply. It remains typed, versioned, audit-chained, capability-routed, and distinct from Project Intelligence.

### Canonical resolution order

```text
PROJECT_NEED → CAPABILITY_REQUEST → REQUIREMENT_NORMALIZATION
→ POOL_LOOKUP → SUPPLY_MEMORY_LOOKUP → TARGETED_EXTERNAL_SOURCING
→ QUALIFIED_PROJECT_SUPPLY → BOUNDED_ADOPTION → INDEPENDENT_VALUE_MEASUREMENT
```

A Pool hit uses the qualified Pool path. A Pool miss with a fresh Supply Memory hit does not automatically repeat discovery; it verifies freshness, re-evaluates current compatibility, and requalifies if license, security, or source state changed. Only a Pool and Memory miss permits targeted external sourcing.

### Supply Resolution Memory

Supply Resolution Memory is a distinct durable evidence store, not a Pool, Project Intelligence, consumable catalog, or reusability proof. It stores the minimum generalized non-sensitive evidence needed to avoid unnecessary discovery: normalized request signature, source/candidate identity, acquisition outcome, provenance, immutable source/version reference, license/security assessment, compatibility observations, qualification history, project-consumption outcome classification, freshness/expiry, supersession lineage, and accumulated reuse evidence. Raw project context remains project-owned by default.

`SUPPLY_MEMORY_ENTRY ≠ POOL_CANDIDATE`. Repeated requests and successful consumption accumulate reuse evidence but do not alone prove reusability.

### Qualification levels

```text
PROJECT_COMPATIBLE
→ QUALIFIED_FOR_BOUNDED_CONSUMPTION
→ CROSS_PROJECT_REUSABLE
→ POOL_ADMISSIBLE
```

These are distinct claims. Project compatibility and bounded-consumption qualification do not establish cross-project reuse. Pool admission requires intrinsic value and reusability proof, independent qualification, complete provenance, license/security/maintenance checks, and ADR-055 admission controls.

### Project-only supply and promotion

A qualified external or DPT-produced capability may be supplied to one project without Pool publication. A successful project-only consumption normally creates or updates Supply Memory, but consumer success is evidence rather than self-certification. Promotion is:

```text
SUPPLY_MEMORY → POOL_PROMOTION_CANDIDATE → INDEPENDENT_QUALIFICATION → ADR-055 ADMISSION → CONSUMABLE_POOL_ENTRY
```

only when `INTRINSIC_VALUE = PROVEN` and `REUSABILITY = PROVEN`.

### Proactive supply and Supply Scout

Request-driven supply is primary. Proactive sourcing is permitted for security intelligence, Pitfalls/failure intelligence, standards changes, and strongly evidenced cross-project opportunities. Supply Scout is a bounded cognitive discovery role; it cannot qualify, publish, grant authority, or certify its own result. Deterministic services enforce adapters, provenance, policy, deduplication, freshness, and auditability.
