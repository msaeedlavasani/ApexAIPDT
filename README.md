# Apex AI DPT

**Apex AI Development Product Team** is a reusable AI-native product intelligence, advisory, and governed execution-control platform.

Its purpose is to help a project establish product structure, understand its capabilities and architecture, discover reusable DPT assets and intelligence, identify risks and Pitfalls, and continuously receive evidence-based recommendations. When the Owner explicitly delegates scoped authority, DPT can also coordinate implementation work performed by the project's developers, AI development agents, tools, or services.

## Core promise

> **The human owns product intent, meaningful decisions, and delegated authority. DPT understands, advises, connects projects to reusable intelligence, and—when explicitly authorized—coordinates verified execution within policy.**

DPT's **Intelligence / Advisory Plane is non-invasive**. Its separate **Execution Control Plane** may coordinate action only within explicit, auditable, scoped, and revocable Owner authority.

## First principle — Component-first product architecture

Every DPT-connected project MUST be built as a modular composition of components.

Every meaningful product capability, including the smallest functional or interface unit, should be represented as a component with a clear responsibility and contract. Components compose other components recursively.

The project's interface is a **component hub**. It does not become a monolithic implementation. The hub selects, composes, mounts, switches between, and invokes the components required by the current route, state, task, permissions, and context.

## DPT as a compounding development ecosystem

DPT is not only a collection of agents. It is a two-way intelligence network.

A subscribed project consumes reusable assets and knowledge from DPT and can contribute validated reusable assets and knowledge back to DPT.

```text
DPT
 ↕
Project Front Agent
 ↕
Project
 ↕
validated learning
 ↕
DPT
```

The goal is compounding development:

> **Every project should make future projects faster, safer, smarter, and cheaper.**

## Core systems

- **Component-first architecture** — every meaningful product unit is composable; the project interface acts as a runtime composition hub.
- **Capability Engine** — discovers required capabilities and builds/acquires skills and agents when needed, including during a project.
- **DPT Pools** — shared reusable assets and intelligence: Components, Modules, Skills, Agents, Pitfalls, Decisions, Patterns, and Templates.
- **Failure Intelligence** — a Pitfall Agent enters at the first meaningful failure, consults known Pitfalls and authoritative documentation, avoids speculative fixes, validates the resolution, and enriches the shared Pitfall Pool.
- **Project Intelligence** — structured, evidence-backed understanding of product intent, architecture, capabilities, components, dependencies, interfaces, constraints, risks, and project state.
- **Project Scout + AI Analyst** — Scout discovers facts/evidence; Analyst interprets them and generates DPT Adoption Proposals.
- **Front Agent + Gateway Agent** — each connected project has a project-specific Front Agent, while the DPT Gateway mediates the external trust boundary.
- **Authority Model** — six graduated Service/Authority Modes governed by specific action permissions, risk envelopes, approval gates, escalation, inheritance ceilings, and revocation.
- **Execution Control** — an Execution Orchestrator manages authorized Intent, Plans, Task DAGs, Work Orders, Attempts, hierarchical physical/logical/external Resources and their Claims, Verification, Decisions, and Escalations; Result is never treated as Completion.
- **Update & propagation** — projects can receive compatible improvements, security information, recommendations, and new reusable assets from DPT.
- **DPT Network API** — the two-way boundary between subscribed projects and DPT.
- **Contribution economy** — validated reusable contributions can earn Credits while consumption of reusable DPT value can spend Credits. The economy is documented as a concept and is not yet finalized.

## Project lifecycle

### Greenfield

```text
Idea
 ↓
DPT Product / Architecture Advisory
 ↓
Project Blueprint
 ↓
Capability + Agent/Skill assessment
 ↓
Pool / Pitfall discovery
 ↓
Owner selects advisory-only or authorized execution path
↓
Project team implements, or the Execution Orchestrator coordinates bounded Work Orders
 ↓
Failure intelligence + validation
 ↓
Validated contribution / learning
 ↓
Receive DPT updates and recommendations
```

### Existing project

```text
Existing Project
 ↓
Project Front Agent
 ↓
Project Scout
 ↓
Project Intelligence
 ↓
AI Analyst
 ↓
DPT Adoption Proposal
 ↓
Project owner decides whether to remain advisory-only or delegate scoped authority
↓
Project team implements, or the Execution Orchestrator coordinates authorized execution
```

## What Apex AI DPT is not

- A single giant system prompt.
- A replacement for product ownership.
- An uncontrolled coding/injection service for consuming projects.
- A system that assumes DPT's own Components are always better.
- A license for agents to act outside explicit Owner authority.
- A requirement to use one specific AI vendor or coding tool.
- A justification for meaningless micro-components or unnecessary abstraction.
- A collection of isolated project-specific agents with no reusable ecosystem.

## Repository map

- `docs/` — vision, constitution, terminology, system/authority/execution models, architecture decisions, open decisions, Project Intelligence, agent architecture, runtime/bootstrap, onboarding, Pools, Network API, capability engine, failure intelligence, and business/credit concepts.
- `core/` — reusable operating-system behavior.
- `brains/` — role/brain definitions and contracts.
- `templates/` — artifacts generated into client projects.
- `workflows/` — lifecycle and execution workflows.
- `providers/` — provider-neutral contract, conformance suite, and provider adapters (OpenCode, reference).

## Current status

This repository defines the Apex AI DPT V0 framework and architecture. It is intentionally specification-first.

The current design phase is focused on finalizing Agent boundaries, Authority Policy, execution entity lifecycles, and the machine-readable Project Intelligence contract before implementation details are frozen.

Current runtime/connector and Orchestrator R&D is a validation implementation for real-project learning, not the frozen production runtime. Exact transport, schema, locking, persistence, deployment topology, and packaging remain explicit open decisions until evidence supports standardization.

The credit economy and business model are also intentionally conceptual until real usage and infrastructure data are available.
