# ADR-053 — Token/Context Efficiency Measurement Architecture

**Status:** Accepted  
**Date:** 2026-09-06  
**Supersedes:** None (new ADR)  
**Related:** ADR-052 (Intervention Measurement), ADR-029 (Determinism Routing), ADR-041 (Audit Trail)  

---

## Context

DPT-managed projects consume context windows from AI providers. Understanding efficiency of context usage enables:
- Cost optimization
- Overflow prevention
- Architectural improvement proposals
- Cross-project learning

V2 Learning System requires efficiency telemetry as a foundation for pattern detection and auto-improvement.

---

## Problem

How should token and context window efficiency be measured across DPT-managed projects without introducing new persistence layers or violating existing authority boundaries?

---

## Decision

**Selected: Design C — Projection Layer**

Efficiency metrics are DERIVED from existing audit trail events via projection functions. No new persistent entities are created. Raw token counts are stored minimally within extended AUDIT_TRAIL events; derived metrics are computed on-demand.

**Rationale:**
1. Phase 4 established L4/L5 as DERIVED_RUNTIME_STATE, not persisted sources
2. Efficiency is a PROJECTION of existing audit data, not a fundamental entity
3. No new Human Gate, Agent, authority layer, or lifecycle state introduced
4. Aligns with Delta primitive (state-change-only record)
5. Supports both micro (per-attempt) and macro (cross-project) analysis
6. Privacy-preserving: only aggregate counts, never prompt content

---

## Consequences

### Positive
- Zero new persistence requirements
- Preserves audit trail purity
- Supports both raw and aggregated views
- Aligns with existing DERIVED_RUNTIME_STATE concept
- No new authority boundaries

### Negative
- Computation cost for real-time queries
- Historical projections require replay
- No independent persistence of derived metrics
- Query complexity increases with metric diversity

---

## Open Decisions (Resolved)

| ID | Question | Selection | Status |
|----|----------|-----------|--------|
| OD-T5-002-A | Per-provider vs per-model efficiency | Per-provider (abstract) | ACCEPTED |
| OD-T5-002-B | Overflow risk notification threshold | Static 80% utilization | ACCEPTED |
| OD-T5-002-C | Multi-turn vs single-shot counting | Count each turn separately | ACCEPTED |

---

## Metric Taxonomy

### Primary Metrics

| Metric | Definition | Granularity | Unit |
|--------|-----------|-------------|------|
| `tokens_input` | Total tokens sent to provider | Per ATTEMPT | count |
| `tokens_output` | Total tokens received from provider | Per ATTEMPT | count |
| `context_utilization` | tokens_used / context_window_size | Per ATTEMPT | percentage |
| `overflow_events` | Attempts exceeding context limit | Per TASK | count |
| `redundant_context_ratio` | Duplicate context / total context | Per WORK_ORDER | ratio |

### Derived Metrics

| Metric | Formula | Use Case |
|--------|---------|----------|
| `efficiency_score` | 1 - (overflow_events / total_attempts) | Overall health |
| `cost_estimate` | (tokens_input + tokens_output) × unit_cost | Budget planning |
| `optimization_opportunity` | (max_utilization - avg_utilization) / max_utilization | Improvement targeting |
| `routing_efficiency` | SERVICE_calls / (SERVICE_calls + ROLE_calls) | Determinism routing accuracy |

---

## Data Model

### Audit Event Extension

Existing AUDIT_TRAIL event schema extended with optional fields:

```json
{
  "event_type": "ATTEMPT_START | ATTEMPT_COMPLETE | CONTEXT_UPDATE | PROVIDER_CALL",
  "token_usage": {
    "input_tokens": int,
    "output_tokens": int,
    "context_window_size": int,
    "utilization_percent": float,
    "overflow_flag": boolean
  },
  "context_composition": {
    "project_intelligence_refs": ["hash"],
    "governance_docs_refs": ["hash"],
    "task_passport_revision": int,
    "redundant_bytes_estimate": int
  }
}
```

### Projection Function

```
EFFICIENCY_PROJECTION(audit_events, time_window):
  inputs = sum(event.token_usage.input_tokens for event in audit_events)
  outputs = sum(event.token_usage.output_tokens for event in audit_events)
  utilizations = [event.token_usage.utilization_percent for event in audit_events]
  
  return {
    total_tokens: inputs + outputs,
    input_ratio: inputs / (inputs + outputs),
    avg_utilization: mean(utilizations),
    p95_utilization: percentile(utilizations, 95),
    overflow_count: count(event.overflow_flag == true),
    efficiency_score: 1 - (overflow_count / len(audit_events))
  }
```

---

## Integration Points

### Authority Stack
- L1 Policy: Defines context window size limits per authority mode
- L2 Delegation: Scope affects context requirements
- L3 Envelope: Envelope size contributes to context utilization
- L4 Evaluation: Determines SERVICE vs. ROLE routing (affects efficiency)
- L5 Materialization: Provider-specific context handling

### Determinism Routing (ADR-029)
- SERVICE calls: deterministic, predictable token usage
- ROLE calls: cognitive, variable token usage
- Efficiency metric: SERVICE_RATIO = SERVICE_calls / total_calls

### Task System (DPT_TASK_SYSTEM.md)
- WORK_ORDER inputs: minimum sufficient context references
- ATTEMPT context: projected from Task Record + Passport + Envelope
- Efficiency measurement: compare actual vs. minimum sufficient context

---

## Privacy Boundaries

### What IS Measured
- Token counts (aggregate, not content)
- Context window utilization percentages
- Overflow event occurrences
- Routing decisions (SERVICE vs. ROLE)
- Cost estimates (derived, not billed)

### What is NOT Measured
- Actual prompt content (beyond refs)
- Model-specific implementation details
- Provider pricing API calls
- User identity beyond role classification
- Cross-project raw data (only anonymized aggregates)

---

## Implementation Artifacts

1. **Schema:** `docs/schemas/token-efficiency-projection.schema.json`
2. **Spec:** `docs/v2/token-efficiency-spec.md`
3. **Task:** `DPT-FOUNDATION-038`

---

*This ADR was accepted as part of DPT-LIVERUN-001 execution.*
