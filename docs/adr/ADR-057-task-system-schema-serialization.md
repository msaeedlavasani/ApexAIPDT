---
id: ADR-057
title: Task-System Schema Serialization Architecture
status: ACCEPTED
date: 2026-09-06
architecture-mode: CONTRACT_LAYER
authority-layer: L4
delegated-to: DPT-FOUNDATION-001
related-adr: [ADR-027, ADR-028]
---

# ADR-057: Task-System Schema Serialization Architecture

## Context

DPT-RECON-003 established the canonical task-system contract in `docs/DPT_TASK_SYSTEM.md` with textual schema definitions in §3–§4. These definitions describe the structure of Task Records, Passports, Work Orders, Deltas, Results, and Permission Envelopes but are not machine-validatable.

DPT-FOUNDATION-001 serializes these contract definitions into JSON Schema artifacts under `docs/schemas/`, enabling:
- Programmatic validation of task state
- Machine-projectable task records from `docs/TASKS.md`
- Automated preflight checks before execution
- Contract enforcement across provider adapters

## Decision

**Selected: Direct JSON Schema 2020-12 Artifacts**

Seven core schemas were created as standalone JSON files, each with:
- `$schema` draft 2020-12 declaration
- `$id` with canonical URI namespace (`https://apexaidpt.io/schemas/`)
- Complete property definitions with types, descriptions, and constraints
- Required field lists matching the TASK record schema

### Schema Inventory

| Schema File | Purpose | Key Fields |
|-------------|---------|------------|
| `task-record.schema.json` | Durable task state | task_id, status, dependencies, readiness, human_gate_state, state_revision |
| `task-passport.schema.json` | Executor authority scope | role, scope, required_capabilities, denied_capabilities, revocation_state |
| `work-order.schema.json` | Execution work unit | task_passport_revision, envelope_id, resource_claims, route_budget |
| `delta.schema.json` | Atomic state change | base_state_revision, changes array, applied_by, evidence_refs |
| `result.schema.json` | Completion handoff | result_id, outcome, structured_result, evidence_refs |
| `permission-envelope.schema.json` | Scoped authorization | task_id, role, authority_mode, permissions, human_gates, prohibitions |
| `lifecycle.schema.json` | State transition definitions | All 13 lifecycle states with transitions |

### Manifest

`docs/schemas/v02-manifest.json` catalogs all V0.2 schemas with metadata for registry lookups.

## Rationale

1. **Deterministic Validation**: JSON Schema enables automated conformance checking of task records
2. **No New Persistence**: Schemas describe structure only; data persists in `docs/TASKS.md`
3. **Provider-Neutral**: Schemas are portable across adapter implementations
4. **Human + Machine Readable**: Markdown TASK blocks in TASKS.md are projection-compatible with JSON Schema validation
5. **Minimal Surface**: Only the task-system core is serialized; V2 learning system schemas are separate (ADR-053..056)

## Consequences

### Positive
- Task records can be validated programmatically before execution
- Adapters can enforce schema conformance without parsing markdown
- Delta chains are verifiable for monotonicity and completeness
- Human Gate state is explicitly tracked in schema

### Negative
- Schema drift risk: manual updates to TASKS.md may violate schema
- No automatic schema generation from markdown (requires discipline)
- Additional file maintenance burden

### Mitigations
- CI job "Schema Validation" runs on every PR/push (DPT-CI-001)
- Delta convention enforces state_revision monotonicity
- TASKS.md is the source of truth; schemas are projections

## Validation

All schemas validated against JSON Schema draft 2020-12 spec.
Test coverage: `providers/goose/test-foundation-001-schemas.mjs` (pending implementation).

## History

- 2026-09-06: ADR created for DPT-FOUNDATION-001 execution
- 2026-09-06: Schemas originally added in commit f30a6c6 (checkpoint phase)
