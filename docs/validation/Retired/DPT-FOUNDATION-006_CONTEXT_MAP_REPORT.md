# DPT-FOUNDATION-006 — Context Map Report

**Task ID:** DPT-FOUNDATION-006
**Status:** CLOSED
**Date:** 2026-09-05T17:07:37.164Z
**OWNER_PERMISSION_POPUPS:** 0

## Summary

Context map generated for Apex AI DPT project. 16 assertions passed, 0 failed.

## Architecture Layers

| Layer | Description | Nodes |
|---|---|---|
| constitutional | Foundational principles and governance | 1 |
| model | System models and architecture | 1 |
| governance | Policy and enforcement rules | 1 |
| schemas | Machine-readable contracts | 1 |
| contracts | Provider-neutral interface contracts | 1 |
| adapters | Provider implementations | 1 |
| validation | Test and verification evidence | 1 |
| task_state | Durable task ledger | 1 |

## Capability Boundaries

| Capability | Components | Enforcer |
|---|---|---|
| task_system | DPT_TASK_SYSTEM.md, TASKS.md, schemas/ | goose-adapter.mjs |
| authority | DPT_AUTHORITY_MODEL.md, permission-envelope.mjs, capability-gateway.mjs | capability-gateway.mjs |
| execution | DPT_EXECUTION_CONTROL_MODEL.md, goose-adapter.mjs | goose-adapter.mjs |
| governance | governance/, APEX_AI_DPT_CONSTITUTION.md | capability-gateway.mjs |
| validation | docs/validation/, test-*.mjs | test harness |

## Context Map Statistics

- Total nodes: 18
- Total edges: 10
- Layers: 8
- Capabilities: 5

## Artifacts Produced

| File | Description |
|---|---|
| docs/context-map.json | Full context map (nodes, edges, layers) |
| docs/capability-boundaries.json | Capability boundary analysis |
| docs/validation/DPT-FOUNDATION-006_CONTEXT_MAP_REPORT.md | This report |
