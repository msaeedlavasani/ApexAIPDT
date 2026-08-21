# Apex AI DPT

**Apex AI Development Product Team** is a reusable AI-native product intelligence and development advisory ecosystem.

Its purpose is to help a project establish product structure, understand its capabilities and architecture, discover reusable DPT assets and intelligence, identify risks and Pitfalls, and continuously receive evidence-based recommendations — while allowing the project's own developers or AI development agents to remain responsible for implementation.

## Core promise

> **The human defines product intent and meaningful decisions. DPT understands, analyzes, recommends, connects projects to reusable intelligence, and learns from validated project contributions. The project team remains responsible for implementation.**

DPT is intentionally **advisory, not invasive**. It does not write, inject, modify, refactor, migrate, or deploy code in consuming projects.

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
Project development team implements
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
Project owner / developers decide
 ↓
Project team implements if desired
```

## What Apex AI DPT is not

- A single giant system prompt.
- A replacement for product ownership.
- A coding/injection service for consuming projects.
- A system that assumes DPT's own Components are always better.
- A license for agents to make uncontrolled architectural or product decisions.
- A requirement to use one specific AI vendor or coding tool.
- A justification for meaningless micro-components or unnecessary abstraction.
- A collection of isolated project-specific agents with no reusable ecosystem.

## Repository map

- `docs/` — vision, constitution, terminology, architecture decisions, open decisions, Project Intelligence, agent architecture, runtime/bootstrap, existing-project onboarding, Pool architecture, Network API, capability engine, failure intelligence, and business/credit concepts.
- `core/` — reusable operating-system behavior.
- `brains/` — role/brain definitions and contracts.
- `templates/` — artifacts generated into client projects.
- `workflows/` — lifecycle and execution workflows.
- `examples/` — reference project initialization.

## Current status

This repository defines the Apex AI DPT V0 framework and architecture. It is intentionally specification-first.

The current design phase is focused on finalizing Agent boundaries and the machine-readable Project Intelligence contract before implementation details are frozen.

The runtime/connector and Network API implementation remain future engineering layers. Their exact transport and packaging mechanisms are explicit open decisions.

The credit economy and business model are also intentionally conceptual until real usage and infrastructure data are available.

## First real-world validation

BaziGB is the reference case for validating whether Apex AI DPT can reduce implementation back-and-forth, improve reuse, and make adding new games and visually complex features more predictable.
