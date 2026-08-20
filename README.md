# Apex AI DPT

**Apex AI Development Product Team** is a reusable AI-native product development operating system.

Its purpose is to turn a product idea into a project-specific AI development team with explicit roles, decision authority, managed context, persistent memory, workflows, quality gates, and a clear human/AI boundary.

## Core promise

> The human defines product intent and meaningful decisions. Apex AI DPT determines and executes the implementation within the project's rules, validates the result, and asks for human input only when it is genuinely required.

## First principle — Component-first product architecture

Every DPT-managed project MUST be built as a modular composition of components.

Every meaningful product capability, including the smallest functional or interface unit, should be represented as a component with a clear responsibility and contract. Components compose other components recursively.

The project's interface is a **component hub**. It does not become a monolithic implementation. The hub selects, composes, mounts, switches between, and invokes the components required by the current route, state, task, permissions, and context.

This principle exists to make every part of a product reusable, replaceable, testable, independently evolvable, and easy for AI agents to reason about.

## What Apex AI DPT is

- A framework for assembling project-specific AI product teams.
- A system of brains, roles, authority, context, memory, workflows, components, and gates.
- A way to minimize AI token waste and human micromanagement.
- A reusable project bootstrap model that can be applied to different product types.
- A component-first product development architecture.

## What Apex AI DPT is not

- A single giant system prompt.
- A replacement for product ownership.
- A license for agents to make uncontrolled architectural or product decisions.
- A requirement to use one specific AI vendor or coding tool.
- A justification for meaningless micro-components or unnecessary abstraction.

## Design principles

1. **Component first** — build the product from composable, contract-driven components; keep the interface a composition hub.
2. Outcome before implementation.
3. Targeted context before code generation.
4. Reuse before creation.
5. Authority before autonomy.
6. Plan before implementation.
7. Validate before claiming completion.
8. Human input only at genuine decision boundaries.
9. Project knowledge is persistent and continuously improved.
10. The smallest sufficient context is preferred over full-repository context.
11. Durable discoveries become system knowledge instead of being rediscovered repeatedly.
12. Prefer modular replacement and composition over monolithic expansion.

## Repository map

- `docs/` — Apex AI DPT vision, constitution, terminology, architecture, and operating principles.
- `core/` — reusable operating-system behavior.
- `brains/` — role/brain definitions and contracts.
- `templates/` — artifacts generated into client projects.
- `workflows/` — lifecycle and execution workflows.
- `examples/` — reference project initialization.

## Current status

This repository defines the Apex AI DPT V0 framework. It is intentionally specification-first. The first validation target is an existing product codebase where DPT can be installed without forcing a rewrite.

## First real-world validation

BaziGB is the reference case for validating whether Apex AI DPT can reduce implementation back-and-forth, especially for adding new games and visually complex features.
