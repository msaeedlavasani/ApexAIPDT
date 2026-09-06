---
id: ADR-056
title: Cross-Project Pattern Extraction Architecture
status: ACCEPTED
date: 2026-09-06
architecture-mode: DERIVED_RUNTIME_STATE
authority-layer: L5
delegated-to: DPT-FOUNDATION-041
related-adr: [ADR-053, ADR-054, ADR-055]
---

# ADR-056: Cross-Project Pattern Extraction Architecture

## Context

The V2 Learning System requires the ability to extract and correlate failure patterns
across multiple projects. This enables discovering systemic issues that manifest
across project boundaries and identifying opportunities for shared improvements.

Cross-project pattern extraction should:
1. Aggregate patterns from multiple project audit trails
2. Identify common failure modes across projects
3. Calculate statistical significance based on contribution thresholds
4. Provide weighted recommendations considering project authority

## Decision

**Selected: Threshold-Based Aggregation (Design B)** — aggregate patterns from 5+
projects with matching types to ensure statistical significance.

### Rationale

1. **Per OD-T5-005-A**: Minimum threshold of 5 projects ensures statistical significance
2. **Privacy-preserving**: Only pattern counts and types aggregated, no raw data
3. **Authority-aware**: Higher-authority projects weight more in recommendations
4. **Extensible**: Supports future addition of new pattern types
5. **Consistent with ADR-054/055**: Builds on existing pattern detection and proposal generation

## Architecture

### Data Flow

```
Project Audit Trails (multiple)
    ↓
PATTERN_MATCHING() per project → FailurePatternReport[]
    ↓
CROSS_PROJECT_EXTRACT() → CrossProjectPatternReport
    ↓
AUTO_IMPROVEMENT_PROPOSAL() per pattern → ImprovementProposal[]
    ↓
AGGREGATE_RECOMMENDATIONS() → CrossProjectRecommendation
```

### Cross-Project Pattern Structure

```typescript
interface CrossProjectPattern {
  pattern_type: string;
  occurrence_count: number;           // Total failures across projects
  project_count: number;              // Number of projects affected
  projects: CrossProjectEntry[];
  significance: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: {
    action: string;
    priority: number;
    estimated_impact: {
      projects_improved: number;
      failures_prevented: number;
    };
  };
}

interface CrossProjectEntry {
  project_id: string;
  pattern_count: number;
  severity: string;
  authority_level: number;
}
```

### Contribution Threshold (OD-T5-005-A)

Minimum of **5 projects** with matching pattern type required for:
- Statistical significance determination
- Automated recommendation generation
- Cross-project improvement proposal creation

Projects below threshold are tracked but not surfaced in aggregate reports.

### Authority Weighting (OD-T5-005-B - Deferred)

Future enhancement to weight recommendations by project authority level:
- Core framework projects: weight = 3
- Major integration projects: weight = 2
- Standard projects: weight = 1

## Open Decisions

| OD-ID | Question | Decision | Status |
|-------|----------|----------|--------|
| OD-T5-005-A | Minimum contribution threshold | 5+ projects with matching pattern | ACCEPTED |
| OD-T5-005-B | Handling conflicting patterns | Weighted voting by authority (deferred) | DEFERRED |
| OD-T5-005-C | Contributor credit assignment | Automatic attribution based on source project | ACCEPTED |

## Integration Points

### Authority Stack
- L1 Policy: Cross-project aggregation rules
- L2 Delegation: Scope of cross-project visibility
- L3 Envelope: Multi-project data packaging
- L4 Evaluation: Significance calculation
- L5 Materialization: Cross-project report format

### Failure Pattern Detection (ADR-054)
- Consumes FailurePatternReport from each project
- Aggregates by pattern_type across projects
- Maintains per-project breakdown

### Auto-Improvement Proposals (ADR-055)
- Generates proposals for cross-project patterns
- Includes multi-project impact estimates
- References source projects for attribution

## Implementation Artifacts

1. **Schema:** `docs/schemas/cross-project-pattern.schema.json`
2. **Implementation:** `providers/goose/cross-project-extraction.mjs`
3. **Tests:** `providers/goose/test-cross-project-extraction.mjs`
4. **Task:** `DPT-FOUNDATION-041`

## Privacy Boundaries

### What IS Aggregated
- Pattern type counts per project
- Project identifiers (anonymized)
- Authority levels (abstracted)
- Aggregate significance metrics

### What is NOT Aggregated
- Raw audit trail events
- Error message content
- Token usage details
- User or agent identity
- Project-specific implementation details

## References

- ADR-053: Token/Context Efficiency Measurement
- ADR-054: Failure Pattern Detection
- ADR-055: Auto-Improvement Proposals
- DPT-FOUNDATION-039: Pattern Matching Implementation
- DPT-FOUNDATION-040: Auto-Improvement Implementation
- docs/validation/Retired/T5-005.md: Phase 5 Cross-Project Analysis (retired)

---

*This ADR was accepted as part of DPT-LIVERUN-005 execution.*
