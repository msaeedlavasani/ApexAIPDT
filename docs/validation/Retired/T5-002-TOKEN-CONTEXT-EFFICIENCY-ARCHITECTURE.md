# T5-002 — Token/Context Efficiency Architecture

**Task ID:** T5-002  
**Parent Phase:** Phase 5 (V2 Learning System Architecture)  
**Status:** RUNNING  
**Date:** 2026-09-06  
**Dependencies:** None (parallel start with T5-001, T5-003)  

---

## OBJECTIVE

Define the architectural model for measuring token and context window efficiency across DPT-managed projects.

---

## PROBLEM SPACE

### What is "Efficiency"?

Token/context efficiency measures how effectively DPT utilizes available context windows to accomplish task objectives. Inefficiency manifests as:

1. **Context overflow** — Prompt exceeds provider limits, causing failure
2. **Redundant context** — Repeated transmission of unchanged Project Intelligence
3. **Suboptimal routing** — Cognitive ROLE invoked where SERVICE would suffice
4. **Excessive history** — Full conversation history retained when summary suffices
5. **Wasted capacity** — Large context windows used for trivial operations

### Why Measure?

V2 Learning System needs efficiency data to:
- Optimize prompt construction strategies
- Reduce LLM operational costs
- Improve task completion rates
- Identify architectural bottlenecks
- Inform V3 auto-improvement proposals

---

## CANDIDATE DESIGNS

### Design A: Centralized Telemetry Service

**Model:** Dedicated SERVICE collects token counts, context sizes, and utilization metrics from all provider interactions.

**Pros:**
- Single source of truth
- Consistent measurement methodology
- Real-time dashboard capability

**Cons:**
- New SERVICE type (violates simplicity budget)
- Privacy concerns (transmits usage data externally)
-耦合到具体provider实现

### Design B: Distributed Audit Enrichment

**Model:** Extend existing AUDIT_TRAIL events with `token_usage` and `context_size` fields. Analytics query reads audit trail.

**Pros:**
- Leverages existing hash-linked chain
- No new persistent entities
- Consistent with Phase 4 component minimalist approach
- Audit trail serves dual purpose (lineage + measurement)

**Cons:**
- Audit trail bloat with telemetry data
- Query complexity for efficiency analysis
- Mixing operational audit with analytics concerns

### Design C: Projection Layer (Selected)

**Model:** No new persistence. Efficiency metrics are DERIVED from existing audit events via projection function. Raw token counts stored minimally; derived metrics computed on-demand.

**Pros:**
- Zero new entities
- Preserves audit trail purity
- Supports both raw and aggregated views
- Aligns with Phase 4 DERIVED_RUNTIME_STATE concept
- Privacy-preserving (aggregation only)

**Cons:**
- Computation cost for real-time queries
- Historical projections require replay
- No independent persistence of metrics

---

## ARCHITECTURAL DECISION

**Selected: Design C — Projection Layer**

**Rationale:**
1. Phase 4 established that L4/L5 are DERIVED_RUNTIME_STATE, not persisted sources
2. Efficiency is a PROJECTION of existing audit data, not a fundamental entity
3. No new Human Gate, Agent, authority layer, or lifecycle state introduced
4. Aligns with Delta primitive (state-change-only record)
5. Supports both micro (per-attempt) and macro (cross-project) analysis

**Invariant Preserved:**
```
Efficiency = Projection(audit_events → token_metrics → utilization_analysis)
No new persistence required beyond existing audit trail
Derived metrics invalidated when audit source changes
```

---

## METRIC TAXONOMY

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

## DATA MODEL

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

## PRIVACY AND SCOPE BOUNDARIES

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

### Data Retention

| Data Class | Retention | Rationale |
|------------|-----------|-----------|
| Raw token counts | Indefinite (audit trail) | Lineage requirement |
| Utilization percentages | 90 days | Operational monitoring |
| Derived efficiency scores | Project lifetime + 7 years | Governance audit |
| Cost estimates | 1 year | Financial reporting |

---

## INTEGRATION WITH EXISTING MODEL

### Authority Stack Integration

| Layer | Efficiency Relevance |
|-------|---------------------|
| L1 Policy | Defines context window size limits per authority mode |
| L2 Delegation | Scope affects context requirements |
| L3 Envelope | Envelope size contributes to context utilization |
| L4 Evaluation | Determines SERVICE vs. ROLE routing (affects efficiency) |
| L5 Materialization | Provider-specific context handling |

### Determinism Routing Integration

Per ADR-029:
- SERVICE calls: deterministic, predictable token usage
- ROLE calls: cognitive, variable token usage
- Efficiency metric: SERVICE_RATIO = SERVICE_calls / total_calls

High SERVICE_RATIO indicates good determinism routing (efficient).
Low SERVICE_RATIO indicates over-reliance on cognitive routing (potentially inefficient).

### Task System Integration

Per DPT_TASK_SYSTEM.md:
- WORK_ORDER inputs: minimum sufficient context references (not full state dumps)
- ATTEMPT context: projected from Task Record + Passport + Envelope
- Efficiency measurement: compare actual vs. minimum sufficient context

---

## OPEN DECISIONS

| # | Question | Options | Status |
|---|----------|---------|--------|
| OD-T5-002-A | Should we measure per-provider or per-model efficiency? | Per-provider (abstract) / Per-model (granular) | DEFERRED |
| OD-T5-002-B | What is the threshold for "overflow risk" notification? | Static (80% utilization) / Dynamic (adaptive based on history) | DEFERRED |
| OD-T5-002-C | How should we handle multi-turn conversations vs. single-shot attempts? | Count each turn separately / Aggregate as single attempt | DEFERRED |

---

## PHASE 4 INVARIANT COMPLIANCE

| Constraint | Check | Result |
|------------|-------|--------|
| New Human Gate? | None introduced | ✓ PASS |
| New Agent type? | None introduced | ✓ PASS |
| New authority layer? | None introduced | ✓ PASS |
| New lifecycle state? | None introduced | ✓ PASS |
| Embeds execution context into authority? | No, measures context usage separately | ✓ PASS |
| Preserves five-layer stack? | Yes, integrates at L4 evaluation | ✓ PASS |
| Respects Project Intelligence ownership? | Yes, measures refs not content | ✓ PASS |
| Maintains independent verification? | Yes, efficiency is audit-derived not self-reported | ✓ PASS |
| Effect identity sufficient? | Yes, per-attempt token tracking enables lineage | ✓ PASS |
| No silent cross-domain power? | Yes, efficiency metrics don't grant authority | ✓ PASS |

---

## DELIVERABLES

1. **ADR Document:** This document → `docs/adr/ADR-053-token-efficiency.md`
2. **Projection Schema:** `docs/schemas/token-efficiency-projection.schema.json`
3. **Metric Specification:** `docs/v2/token-efficiency-spec.md`
4. **Open Decisions Log:** Updated `docs/DPT_OPEN_DECISIONS.md` entries OD-T5-002-A/B/C

---

## NEXT STEPS

1. Write ADR-053 incorporating this design
2. Define projection schema
3. Complete T5-001 integration with this design
4. Begin T5-003 (Failure Pattern Detection Architecture)

---

**Status:** Architecture design complete. Ready for ADR formalization.
