# Apex AI DPT

**Apex AI Development Product Team** is a reusable AI-native product development operating system.

Its purpose is to turn a product idea into a project-specific AI development team with explicit roles, decision authority, managed context, persistent memory, reusable capabilities, shared intelligence, workflows, quality gates, and a clear human/AI boundary.

## Core promise

> The human defines product intent and meaningful decisions. Apex AI DPT determines and executes the implementation within the project's rules, validates the result, and asks for human input only when it is genuinely required.

## First principle — Component-first product architecture

Every DPT-managed project MUST be built as a modular composition of components.

Every meaningful product capability, including the smallest functional or interface unit, should be represented as a component with a clear responsibility and contract. Components compose other components recursively.

The project's interface is a **component hub**. It does not become a monolithic implementation. The hub selects, composes, mounts, switches between, and invokes the components required by the current route, state, task, permissions, and context.

## DPT as a compounding development ecosystem

DPT is not only a team of agents. It is a two-way intelligence network.

A subscribed project consumes reusable assets and knowledge from DPT and can contribute validated reusable assets and knowledge back to DPT.

```text
DPT
 ↕
Project Connector
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
- **Update & propagation** — projects can receive compatible improvements, security fixes, and new reusable assets from DPT.
- **DPT Network API** — the two-way boundary between subscribed projects and DPT.
- **Project Connector** — the project-side runtime boundary for authentication, synchronization, fetch/contribute operations, events, caching, and offline queuing.

## Project lifecycle

```text
Idea
 ↓
DPT Project Bootstrap
 ↓
Connect + identify project
 ↓
Capability analysis
 ↓
Pool/Pitfall discovery
 ↓
Build/acquire missing skills and agents
 ↓
Assemble project team
 ↓
Develop using reusable components/modules
 ↓
Failure intelligence + validation
 ↓
Contribute reusable learning
 ↓
Receive safe DPT updates
```

## What Apex AI DPT is not

- A single giant system prompt.
- A replacement for product ownership.
- A license for agents to make uncontrolled architectural or product decisions.
- A requirement to use one specific AI vendor or coding tool.
- A justification for meaningless micro-components or unnecessary abstraction.
- A collection of isolated project-specific agents with no reusable ecosystem.

## Repository map

- `docs/` — vision, constitution, terminology, runtime/bootstrap, Pool architecture, Network API, capability engine, and failure intelligence.
- `core/` — reusable operating-system behavior.
- `brains/` — role/brain definitions and contracts.
- `templates/` — artifacts generated into client projects.
- `workflows/` — lifecycle and execution workflows.
- `examples/` — reference project initialization.

## Current status

This repository defines the Apex AI DPT V0 framework and architecture. It is intentionally specification-first. The project runtime/connector and Network API implementation are the next engineering layer; their exact transport and packaging mechanism remains an explicit design decision.

## First real-world validation

BaziGB is the reference case for validating whether Apex AI DPT can reduce implementation back-and-forth, especially for adding new games and visually complex features.
