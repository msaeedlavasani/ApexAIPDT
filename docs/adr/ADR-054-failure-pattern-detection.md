---
id: ADR-054
title: Failure Pattern Detection Architecture
status: ACCEPTED
date: 2026-09-06
architecture-mode: DERIVED_RUNTIME_STATE
authority-layer: L5
delegated-to: DPT-FOUNDATION-039
related-adr: [ADR-053, ADR-029]
---

# ADR-054: Failure Pattern Detection Architecture

## Context

The V2 Learning System requires the ability to detect recurring failure patterns
from audit trail events. This enables proactive intervention, learning from
past failures, and improving retry strategies.

Audit trail events already capture `ATTEMPT_FAILURE` events with task_id,
attempt_id, and contextual metadata. We need a projection layer that can:
1. Aggregate failure counts by pattern type
2. Detect recurrence windows
3. Generate failure pattern reports
4. Provide severity classifications

## Decision

**Selected: Projection Layer (Design C)** — extend AUDIT_TRAIL schema with
optional `failure_pattern` fields and implement `PATTERN_MATCHING()` function.

### Rationale

1. **Consistency with ADR-053**: Same projection layer pattern as efficiency
   measurement
2. **No new persistence**: Reads from existing audit trail
3. **Privacy-preserving**: Aggregate counts only, no failure content analysis
4. **Extensible**: Schema extensions for future pattern types
5. **Deterministic**: Pure function from audit events → pattern report

## Architecture

### Data Model Extension

```typescript
interface FailurePatternEvent {
  event_type: "ATTEMPT_FAILURE";
  task_id: string;
  attempt_id: string;
  failure_pattern?: {
    pattern_type: "RETRY_EXHAUSTED" | "CONTEXT_OVERFLOW" | "AUTHORITY_DENIED" | 
                   "PROVIDER_ERROR" | "TIMEOUT" | "VALIDATION_FAIL" | "UNKNOWN";
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    recurrence_count: number;
    first_occurrence: string;
    last_occurrence: string;
    related_task_ids?: string[];
    resolution?: string;
  };
}
```

### PATTERN_MATCHING Function Signature

```typescript
function PATTERN_MATCHING(
  auditEvents: AuditEvent[],
  timeWindow: TimeWindow,
  config?: PatternMatchingConfig
): FailurePatternReport
```

### Pattern Detection Algorithm

1. **Filter**: Extract ATTEMPT_FAILURE events within time window
2. **Group**: Cluster by pattern_type + task_id
3. **Count**: Calculate recurrence counts
4. **Classify**: Assign severity based on frequency + recency
5. **Report**: Generate structured failure pattern report

## Open Decisions

| OD-ID | Question | Decision | Status |
|-------|----------|----------|--------|
| OD-T6-001-A | Pattern classification granularity | Per-task with cross-task aggregation | ACCEPTED |
| OD-T6-001-B | Severity threshold | Linear: 1=LOW, 3=MEDIUM, 5=HIGH, 10=CRITICAL | ACCEPTED |
| OD-T6-001-C | Time window defaults | 24h for detection, 7d for trend analysis | ACCEPTED |

## Integration Points

### Authority Stack
- L1 Policy: Failure event categorization rules
- L2 Delegation: Pattern detection scope
- L3 Envelope: Failure metadata extraction
- L4 Evaluation: Severity classification
- L5 Materialization: Pattern report generation

### Audit Trail (ADR-053)
- Reuses same temporal filtering as EFFICIENCY_PROJECTION
- Shares time_window parameter convention
- Compatible with causal chain verification

### Task System (DPT_TASK_SYSTEM.md)
- FAILURE_PATTERN events link to task_id
- Attempt lifecycle provides automatic pattern triggers
- Resolution field enables closed-loop learning

## Implementation Artifacts

1. **Schema:** `docs/schemas/failure-pattern.schema.json`
2. **Implementation:** `providers/goose/pattern-matching.mjs`
3. **Tests:** `providers/goose/test-pattern-matching.mjs`
4. **Task:** `DPT-FOUNDATION-039`

## Privacy Boundaries

### What IS Analyzed
- Event counts and frequencies
- Temporal distribution patterns
- Severity classifications
- Cross-task pattern correlation

### What is NOT Analyzed
- Failure content or error messages
- Provider-specific error details
- User or agent identity beyond role
- Raw context or token data

## References

- ADR-053: Token/Context Efficiency Measurement
- ADR-029: Determinism Routing
- DPT-FOUNDATION-038: Token Efficiency Implementation
- docs/validation/Retired/T5-003.md: Phase 5 Failure Analysis (retired)

---

*This ADR was accepted as part of DPT-LIVERUN-003 execution.*
