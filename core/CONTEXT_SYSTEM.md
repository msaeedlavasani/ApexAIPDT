# Context System

## Principle

Context is a managed resource. The objective is minimum sufficient context, not maximum repository context.

## Source-of-truth priority

1. Verified working repository/configuration.
2. Package manifests and machine-readable configuration.
3. Project constitution and explicit project rules.
4. Domain-specific source-of-truth documents.
5. Registries and generated maps.
6. Existing analogous implementations.
7. Tests and observed behavior.
8. Comments and informal notes.
9. Agent assumptions.

When sources conflict, surface the conflict. Do not silently merge incompatible truths.

## Context routing sequence

TASK → TYPE → REQUIRED DECISIONS → RELEVANT SOURCES → CLOSEST ANALOGUE → DEPENDENCIES → IMPLEMENTATION CONTEXT

## Targeted discovery

Agents should inspect:

- root/project entry points;
- relevant package manifest;
- task-relevant rules;
- relevant registry entries;
- closest analogue;
- direct dependencies/imports;
- affected tests.

Expand discovery only when evidence requires it.

## Context classes

- product context
- design context
- architecture context
- implementation context
- quality context
- data context
- asset context
- operational context

## Context freshness

Generated maps and registries are helpful but can become stale. When a registry conflicts with actual code, actual verified code wins and the stale artifact becomes a maintenance candidate.

## Context budget rule

If an agent can make a correct decision without reading another document or module, it should not read it merely for completeness.
