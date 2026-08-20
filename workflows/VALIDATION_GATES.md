# Validation Gates

## Principle

Validation should be proportional to risk. Do not use the most expensive test layer for every change by default.

## Gate 1 — Static

- formatting/lint where configured;
- type checking;
- schema/config validation.

## Gate 2 — Unit

Validate isolated logic and deterministic behavior.

## Gate 3 — Integration

Validate interactions between modules/services.

## Gate 4 — Contract/API

Validate boundaries and externally meaningful contracts.

## Gate 5 — Targeted E2E / Smoke

Validate critical user journeys affected by the change.

## Gate 6 — Full regression

Use when change scope/risk justifies it, before important releases, or when a critical cross-cutting behavior is affected.

## Failure routing

A failed gate must identify:

- exact failure;
- evidence;
- affected behavior;
- likely owner brain;
- smallest corrective workflow.

Do not automatically rerun the full suite when a targeted gate can establish confidence.
