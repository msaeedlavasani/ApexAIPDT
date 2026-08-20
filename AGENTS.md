# AGENTS.md — Apex AI DPT Repository

## Mission

This repository defines Apex AI DPT itself. Changes here affect the framework and potentially every future DPT-managed project.

## Mandatory behavior

1. Read `README.md` and `docs/APEX_AI_DPT_CONSTITUTION.md` before making architectural changes.
2. Read `docs/APEX_AI_DPT_VISION.md` when changing scope or core concepts.
3. Read `docs/APEX_AI_DPT_TERMINOLOGY.md` when changing framework vocabulary or contracts.
4. Read the relevant core/brain/workflow document before modifying it.
5. Prefer the smallest coherent change.
6. Do not add vendor-specific implementation unless explicitly intended.
7. Treat terminology and contracts as public framework interfaces.
8. Record material architecture decisions.
9. Validate internal consistency after changes.

## Framework rule

Do not solve a project-specific problem by hard-coding assumptions into DPT core. Generalize only when evidence shows that the rule is reusable across projects.

## First architectural rule

The component-first principle is a framework invariant, not an optional style preference.

Every DPT-managed project must be composed from modular, contract-driven components. This applies recursively down to the smallest meaningful functional or interface unit.

The project's interface must act as a component hub. It should select, compose, mount, switch between, and invoke components as needed, while keeping component responsibilities outside the hub. The hub is a composition layer, not a monolithic feature container.

When a requested change can be expressed by composing, reusing, extending, or replacing components, do that instead of expanding a monolithic implementation.

When creating a new component, define its responsibility, contract, dependencies, lifecycle, and validation expectations. Register reusable components in the project's component registry.

Do not interpret this rule as permission to create meaningless micro-components. A component must represent a coherent responsibility and provide a useful boundary.

## Evolution rule

A proposed new global rule should be supported by repeated evidence, a clear failure mode, or an explicit framework requirement.

## Current implementation mode

Apex AI DPT V0 is specification-first. Do not prematurely introduce a runtime, CLI, or agent-provider integration before the core model has been validated on real projects.
