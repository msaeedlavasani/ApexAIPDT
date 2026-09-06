---
id: ADR-055
title: Auto-Improvement Proposal Generation Architecture
status: ACCEPTED
date: 2026-09-06
architecture-mode: DERIVED_RUNTIME_STATE
authority-layer: L5
delegated-to: DPT-FOUNDATION-040
related-adr: [ADR-053, ADR-054]
---

# ADR-055: Auto-Improvement Proposal Generation Architecture

## Context

The V2 Learning System requires the ability to automatically generate improvement
proposals based on failure pattern analysis and efficiency projections. This enables
closed-loop learning where detected patterns trigger actionable recommendations.

Auto-improvement proposals should:
1. Be derived from existing audit trail data (no new data collection)
2. Follow deterministic rules for proposal generation
3. Include severity-weighted prioritization
4. Be reviewable before implementation

## Decision

**Selected: Rule-Based Generator (Design A)** — deterministic proposal generation
from pattern analysis without requiring human input for initial proposals.

### Rationale

1. **Consistency with ADR-054**: Builds on failure pattern detection output
2. **Predictability**: Rule-based ensures reproducible proposals
3. **Low overhead**: No ML model training or external dependencies
4. **Auditability**: Clear traceability from pattern → proposal
5. **Extensible**: Rules can be updated without code changes

## Architecture

### Data Flow

```
AUDIT_TRAIL events
    ↓
PATTERN_MATCHING() → FailurePatternReport
    ↓
AUTO_IMPROVEMENT_PROPOSAL() → ImprovementProposal[]
    ↓
PROPOSAL_REVIEW (human or automated)
    ↓
IMPLEMENTATION (if approved)
```

### Proposal Structure

```typescript
interface ImprovementProposal {
  proposal_id: string;
  source_patterns: string[];      // Related pattern types
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  recommended_action: string;
  estimated_impact: {
    failure_reduction_percent: number;
    efficiency_gain_percent: number;
  };
  effort_estimate: 'MINIMAL' | 'MODERATE' | 'SIGNIFICANT';
  priority_score: number;         // Combined severity × frequency
  created_at: string;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'IMPLEMENTED' | 'DECLINED';
}
```

### Rule Set (Initial)

| Pattern Type | Condition | Action | Effort |
|--------------|-----------|--------|--------|
| RETRY_EXHAUSTED | count >= 5 | Implement exponential backoff | MODERATE |
| CONTEXT_OVERFLOW | count >= 3 | Optimize context composition | SIGNIFICANT |
| AUTHORITY_DENIED | count >= 10 | Review delegation policy | MODERATE |
| PROVIDER_ERROR | count >= 5 | Add provider fallback chain | SIGNIFICANT |
| TIMEOUT | count >= 3 | Increase timeout thresholds | MINIMAL |
| VALIDATION_FAIL | count >= 1 | Fix validation rules | MINIMAL |
| UNKNOWN | any | Manual investigation required | MODERATE |

## Open Decisions

| OD-ID | Question | Decision | Status |
|-------|----------|----------|--------|
| OD-T6-002-A | Proposal review workflow | Automated approval for LOW/MEDIUM, manual for HIGH/CRITICAL | ACCEPTED |
| OD-T6-002-B | Priority scoring formula | severity_weight × count / effort_factor | ACCEPTED |
| OD-T6-002-C | Proposal lifecycle | DRAFT → REVIEW → APPROVED/DECLINED → IMPLEMENTED | ACCEPTED |

## Integration Points

### Authority Stack
- L1 Policy: Proposal generation rules
- L2 Delegation: Scope of auto-approval
- L3 Envelope: Proposal metadata packaging
- L4 Evaluation: Priority score calculation
- L5 Materialization: Proposal output format

### Failure Pattern Detection (ADR-054)
- Consumes FailurePatternReport from PATTERN_MATCHING()
- Maps pattern types to proposal rules
- Uses severity classification for prioritization

### Efficiency Projection (ADR-053)
- Can reference efficiency metrics in impact estimates
- Cross-references overflow events with CONTEXT_OVERFLOW proposals

## Implementation Artifacts

1. **Schema:** `docs/schemas/auto-improvement-proposal.schema.json`
2. **Implementation:** `providers/goose/auto-improvement.mjs`
3. **Tests:** `providers/goose/test-auto-improvement.mjs`
4. **Task:** `DPT-FOUNDATION-040`

## Privacy Boundaries

### What IS Used
- Pattern type and count (aggregate)
- Severity classification
- Task IDs (for correlation)
- Temporal distribution

### What is NOT Used
- Error message content
- Provider-specific details
- Token counts or costs
- User identity beyond role

## References

- ADR-053: Token/Context Efficiency Measurement
- ADR-054: Failure Pattern Detection
- DPT-FOUNDATION-039: Pattern Matching Implementation
- docs/DPT_TASK_SYSTEM.md: Proposal lifecycle

---

*This ADR was accepted as part of DPT-LIVERUN-004 execution.*
