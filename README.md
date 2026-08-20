# Apex AI Product Development Team (APDT)

APDT is a reusable AI-native product development operating system.

Its purpose is to turn a product idea into a project-specific AI development team with explicit roles, decision authority, managed context, persistent memory, workflows, quality gates, and a clear human/AI boundary.

## Core promise

> The human defines product intent and meaningful decisions. APDT determines and executes the implementation within the project's rules, validates the result, and asks for human input only when it is genuinely required.

## What APDT is

- A framework for assembling project-specific AI product teams.
- A system of brains, roles, authority, context, memory, workflows, and gates.
- A way to minimize AI token waste and human micromanagement.
- A reusable project bootstrap model that can be applied to different product types.

## What APDT is not

- A single giant system prompt.
- A replacement for product ownership.
- A license for agents to make uncontrolled architectural or product decisions.
- A requirement to use one specific AI vendor or coding tool.

## Design principles

1. Outcome before implementation.
2. Targeted context before code generation.
3. Reuse before creation.
4. Authority before autonomy.
5. Plan before implementation.
6. Validate before claiming completion.
7. Human input only at genuine decision boundaries.
8. Project knowledge is persistent and continuously improved.
9. The smallest sufficient context is preferred over full-repository context.
10. Durable discoveries become system knowledge instead of being rediscovered repeatedly.

## Repository map

- `docs/` — APDT vision, architecture, terminology, and operating principles.
- `core/` — reusable operating-system behavior.
- `brains/` — role/brain definitions and contracts.
- `templates/` — artifacts generated into client projects.
- `workflows/` — lifecycle and execution workflows.
- `examples/` — reference project initialization.

## Current status

This repository defines the APDT V0 framework. It is intentionally specification-first. The first validation target is an existing product codebase where APDT can be installed without forcing a rewrite.

## First real-world validation

BaziGB is the reference case for validating whether APDT can reduce implementation back-and-forth, especially for adding new games and visually complex features.
