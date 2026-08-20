# Project Constitution

## Project

Name: [PROJECT]

## Product intent

[WHAT / WHY]

## Target users

[USERS]

## Success metrics

[METRICS]

## First architectural rule — Component-first

This project MUST be built as a composition of modular, contract-driven components.

Every meaningful capability, down to the smallest useful functional or interface unit, should be a component with a clear responsibility and explicit boundary.

The project interface MUST act as a component hub that selects, composes, mounts, switches between, and invokes components as needed. The hub is a composition layer and MUST NOT become a monolithic container for the responsibilities of the components it coordinates.

Prefer:

`reuse → compose → extend → replace → create`

Avoid:

- monolithic pages/features;
- duplicated component implementations;
- hidden coupling through component internals;
- meaningless micro-components created only for fragmentation.

## Product principles

[PRINCIPLES]

## Design principles

[DESIGN RULES]

## Technical constraints

[CONSTRAINTS]

## Protected decisions

Decisions requiring human approval:
- [LIST]

## Autonomous decisions

AI may decide within established patterns:
- implementation details;
- routine component composition;
- standard validation;
- routine refactoring;
- other explicitly approved categories.

## Technology compatibility

[CURRENT STACK / VERSION LOCKS]

## Sources of truth

[ORDERED LIST]

## Definition of done

[PROJECT-SPECIFIC COMPLETION RULES]

Component architecture is part of completion: new work must use or create the appropriate component boundaries and preserve the hub/component separation.
