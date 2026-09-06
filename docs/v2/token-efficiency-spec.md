# V2 Token/Context Efficiency Specification

**Document:** `docs/v2/token-efficiency-spec.md`  
**Status:** Implementation  
**Related ADR:** ADR-053  
**Implementation Task:** DPT-FOUNDATION-038  

---

## 1. Overview

This specification defines the token and context window efficiency measurement system for the V2 Learning System. Efficiency metrics are projected from existing audit trail events using the schema defined in `docs/schemas/token-efficiency-projection.schema.json`.

---

## 2. Architecture

### 2.1 Design Selection: Projection Layer

Efficiency is a DERIVED_RUNTIME_STATE (L5), not a persisted source. The system:
- Extends AUDIT_TRAIL events with optional token usage fields
- Computes projections on-demand from audit data
- Stores no separate efficiency metrics
- Invalidates projections when audit source changes

### 2.2 Data Flow

```
AUDIT_TRAIL EVENTS
    │
    ▼
TOKEN_USAGE EXTRACTION (per event)
    │
    ▼
PROJECTION FUNCTION (time-windowed)
    │
    ▼
EFFICIENCY_PROJECTION OUTPUT
    │
    ▼
CONSUMERS: Dashboard, Alerting, Auto-Improvement
```

---

## 3. Metrics

### 3.1 Primary Metrics (from audit events)

| Metric | Source Field | Type |
|--------|-------------|------|
| `tokens_input` | `event.token_usage.input_tokens` | integer |
| `tokens_output` | `event.token_usage.output_tokens` | integer |
| `context_utilization` | `event.token_usage.utilization_percent` | float (0-100) |
| `overflow_flag` | `event.token_usage.overflow_flag` | boolean |

### 3.2 Derived Metrics (computed)

| Metric | Formula |
|--------|---------|
| `total_tokens` | `sum(tokens_input) + sum(tokens_output)` |
| `input_ratio` | `sum(tokens_input) / total_tokens` |
| `avg_utilization` | `mean(context_utilization)` |
| `p95_utilization` | `percentile(context_utilization, 95)` |
| `overflow_count` | `count(overflow_flag == true)` |
| `efficiency_score` | `1 - (overflow_count / total_attempts)` |
| `service_ratio` | `SERVICE_calls / total_calls` |

---

## 4. Open Decisions (Resolved)

### OD-T5-002-A: Measurement Abstraction
**Decision:** Per-provider (abstract)  
**Rationale:** Aligns with provider-neutral architecture. Per-model granularity deferred to V3.

### OD-T5-002-B: Overflow Threshold
**Decision:** Static 80% utilization  
**Rationale:** Conservative safe default. Dynamic adaptive threshold deferrable pending evidence.

### OD-T5-002-C: Turn Counting
**Decision:** Per-turn counting  
**Rationale:** Maximum telemetry fidelity. Aggregation for reporting is derived.

---

## 5. Integration Points

### 5.1 Audit Trail (ADR-041)

Extend AUDIT_TRAIL event schema with optional fields:
```json
{
  "token_usage": {
    "input_tokens": int,
    "output_tokens": int,
    "context_window_size": int,
    "utilization_percent": float,
    "overflow_flag": boolean
  }
}
```

These fields are OPTIONAL — events without them are excluded from efficiency projections.

### 5.2 Determinism Routing (ADR-029)

Track SERVICE vs ROLE call types to compute `service_ratio`:
- `SERVICE_calls`: deterministic provider invocations
- `ROLE_calls`: cognitive/role invocations

High `service_ratio` → good determinism routing (efficient)  
Low `service_ratio` → over-reliance on cognitive routing (potentially inefficient)

### 5.3 Task System (DPT_TASK_SYSTEM.md)

- WORK_ORDER inputs: minimum sufficient context references
- ATTEMPT context: projected from Task Record + Passport + Envelope
- Efficiency comparison: actual vs minimum sufficient context

---

## 6. Privacy Boundaries

### In Scope
- Token counts (aggregate only)
- Utilization percentages
- Overflow event counts
- Routing type classifications
- Cost estimates (derived, not billed)

### Out of Scope
- Prompt content (beyond hash refs)
- Model implementation details
- Provider pricing data
- User identity
- Cross-project raw data

---

## 7. Data Retention

| Data Class | Retention | Rationale |
|------------|-----------|-----------|
| Raw token counts (in audit) | Indefinite | Audit lineage requirement |
| Utilization percentages | 90 days | Operational monitoring |
| Efficiency scores | Project lifetime + 7 years | Governance audit |
| Cost estimates | 1 year | Financial reporting |

---

## 8. Implementation Checklist

- [ ] Extend AUDIT_TRAIL schema with token_usage fields
- [ ] Implement projection function `EFFICIENCY_PROJECTION()`
- [ ] Add overflow threshold alerting at 80% utilization
- [ ] Integrate service_ratio calculation from routing decisions
- [ ] Add schema validation for projection output
- [ ] Document API for projection queries
- [ ] Add efficiency metrics to live status view

---

## 9. Success Criteria

1. All audit events with provider calls include token_usage when available
2. Projection function computes all primary and derived metrics correctly
3. Overflow alerts fire at 80%+ utilization
4. Cross-project aggregation works for anonymized statistics
5. No new persistence layer required

---

*Specification authored as part of DPT-FOUNDATION-038 implementation.*
