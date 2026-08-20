# AGENTS.md — APDT Repository

## Mission

This repository defines APDT itself. Changes here affect the framework and potentially every future APDT-managed project.

## Mandatory behavior

1. Read `README.md` and `docs/APDT_CONSTITUTION.md` before making architectural changes.
2. Read `docs/APDT_VISION.md` when changing scope or core concepts.
3. Read the relevant core/brain/workflow document before modifying it.
4. Prefer the smallest coherent change.
5. Do not add vendor-specific implementation unless explicitly intended.
6. Treat terminology and contracts as public framework interfaces.
7. Record material architecture decisions.
8. Validate internal consistency after changes.

## Framework rule

Do not solve a project-specific problem by hard-coding assumptions into APDT core. Generalize only when evidence shows that the rule is reusable across projects.

## Evolution rule

A proposed new global rule should be supported by repeated evidence, a clear failure mode, or an explicit framework requirement.

## Current implementation mode

APDT V0 is specification-first. Do not prematurely introduce a runtime, CLI, or agent-provider integration before the core model has been validated on real projects.
