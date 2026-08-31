# Apex AI DPT — Architecture Decisions

**Status:** Living decision record  
**Purpose:** Capture architectural decisions that emerged during DPT design discussions before implementation is frozen.

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
