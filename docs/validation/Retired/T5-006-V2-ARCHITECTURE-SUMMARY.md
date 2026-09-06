# ADR-052 — Intervention Measurement Architecture

**Status:** Accepted  
**Date:** 2026-09-06  
**Supersedes:** None (new ADR)  
**Related:** ADR-031 (Audit Trail), ADR-033 (Authority Stack), ADR-036 (Retry/Cancellation/Revocation)  

---

## Context

V1 Runtime established execution capabilities with audit trail (ADR-031). V2 Learning System requires measurement of human interventions to identify architectural friction points and optimize authority delegation boundaries.

**Problem:** Without intervention measurement, DPT cannot quantify:
- How often Human Gates trigger
- What categories of interventions dominate
- Resolution time distributions
- Patterns requiring architectural attention

## Decision

Intervention measurement uses **event projection on existing AUDIT_TRAIL** (not new entity). Each intervention is an event with structured metadata enabling statistical analysis while preserving audit trail purity.

### Intervention Event Schema

```json
{
  "event_type": "INTERVENTION",
  "intervention_id": "UUIDv7",
  "timestamp": "ISO8601",
  "trigger_source": "HUMAN_GATE | AUTHORITY_ESCALATION | VERIFICATION_REJECTION | POLICY_AMBIGUITY | CROSS_DOMAIN_CONFLICT | FAILURE_RECOVERY",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "domain": "GRAPH_MUTATION | AUTHORITY | DECISION | POOL | ENTITLEMENT | CREDIT",
  "context": {
    "task_id": "string",
    "work_order_id": "string", 
    "attempt_id": "string",
    "human_gate_class": "HG-01..HG-07|null"
  },
  "description": "string",
  "evidence_refs": ["hash-link"],
  "resolution": {
    "method": "OWNER_APPROVAL | POLICY_CLARIFICATION | AUTHORITY_ADJUSTMENT | CANCELLATION | ESCALATION",
    "actor": "owner|DPT|evaluator",
    "duration_seconds": int,
    "outcome": "ALLOW | DENY | MODIFIED | DEFERRED"
  },
  "learning": {
    "pattern_match": "string|null",
    "improvement_proposal": "boolean"
  }
}
```

### Measurement Dimensions

| Dimension | Source | Aggregation |
|-----------|--------|-------------|
| Frequency | Count of INTERVENTION events | Daily/weekly/monthly |
| Type distribution | trigger_source field | Per category percentages |
| Severity distribution | severity field | Heatmap by severity×domain |
| Resolution time | resolution.duration_seconds | P50/P95/Max histograms |
| Domain concentration | domain field | Top-N domains by count |
| Gate class frequency | context.human_gate_class | Per HG-01..HG-07 counts |

### Privacy Boundaries

**Measured:** Intervention occurrence, resolution method/duration, pattern classification, aggregate statistics  
**NOT Measured:** Deliberation content, private project context beyond trigger, owner identity beyond role, PII

**Retention:** Raw events indefinite (audit trail); utilization percentages 90 days; derived scores project lifetime + 7 years.

## Consequences

### Positive
- Enables V2 Learning System measurement without new entities
- Preserves audit trail purity (projection, not duplication)
- Supports statistical analysis and pattern detection
- Respects project sovereignty (no raw data sharing)

### Negative
- Audit trail bloat with telemetry fields
- Query complexity for efficiency analysis
- Mixed concerns (operational audit + analytics)
- Requires careful schema evolution

### Trade-offs Addressed
- Chose projection over new entity to preserve Phase 4 component count
- Chose structured metadata over raw content capture for privacy
- Chose aggregate retention over raw retention for operational efficiency

## Compliance

| Phase 4 Constraint | Status |
|-------------------|--------|
| New Human Gate? | No — uses existing HG-01..HG-07 |
| New Agent type? | No — uses existing roles |
| New authority layer? | No — integrates at L4 evaluation |
| New lifecycle state? | No — event projection only |
| Embeds execution into authority? | No — measures after execution |
| Preserves five-layer stack? | Yes — integrates at each layer |
| Respects PI ownership? | Yes — measures DPT-side events only |
| Maintains independent verification? | Yes — resolution independently audited |
| Effect identity sufficient? | Yes — intervention_id enables lineage |
| No silent cross-domain power? | Yes — explicit domain tracking |

## Open Decisions

- OD-T5-001-A: Duration granularity (include deliberation? deferred)
- OD-T5-001-B: Improvement signal granularity (per-intervention vs per-pattern deferred)
- OD-T5-001-C: Cross-project pattern matching respects sovereignty (deferred)

## Falsifications

| Claim | Test | Result |
|-------|------|--------|
| Intervention measurement requires new entity | Test projection approach | ✓ PASS — metadata fields sufficient |
| Privacy boundary violations possible | Review schema for PII | ✓ PASS — no identifiers in schema |
| Audit trail purity compromised | Check append-only invariant | ✓ PASS — extension, not modification |
| Cross-domain power acquisition via measurement | Verify no authority granted | ✓ PASS — measurement ≠ authorization |

---

# ADR-053 — Token/Context Efficiency Architecture

**Status:** Accepted  
**Date:** 2026-09-06  
**Supersedes:** None (new ADR)  
**Related:** ADR-029 (Determinism Routing), ADR-031 (Audit Trail)  

---

## Context

V1 Runtime established execution with deterministic routing (ADR-029). V2 Learning System requires efficiency measurement to optimize token usage and reduce operational costs.

**Problem:** Without efficiency measurement, DPT cannot quantify:
- Context window utilization rates
- Overflow event frequency
- Redundant context transmission
- SERVICE vs ROLE routing efficiency

## Decision

Token/context efficiency is a **PROJECTION** of existing audit events (not persisted metric). Raw token counts stored minimally in audit trail; derived metrics computed on-demand.

### Primary Metrics

| Metric | Definition | Granularity | Unit |
|--------|-----------|-------------|------|
| `tokens_input` | Total tokens sent to provider | Per ATTEMPT | count |
| `tokens_output` | Total tokens received | Per ATTEMPT | count |
| `context_utilization` | tokens_used / window_size | Per ATTEMPT | percentage |
| `overflow_events` | Attempts exceeding limit | Per TASK | count |
| `redundant_context_ratio` | Duplicate context / total | Per WORK_ORDER | ratio |

### Projection Function

```
EFFICIENCY_PROJECTION(audit_events, time_window):
  inputs = sum(event.token_usage.input_tokens)
  outputs = sum(event.token_usage.output_tokens)
  utilizations = [event.token_usage.utilization_percent]
  
  return {
    total_tokens: inputs + outputs,
    input_ratio: inputs / (inputs + outputs),
    avg_utilization: mean(utilizations),
    p95_utilization: percentile(utilizations, 95),
    overflow_count: count(overflow_flag),
    efficiency_score: 1 - (overflow_count / len(events))
  }
```

### Audit Event Extension

Existing AUDIT_TRAIL extended with optional `token_usage` and `context_composition` fields.

## Consequences

### Positive
- Zero new persistence requirements
- Supports both micro (per-attempt) and macro (cross-project) analysis
- Privacy-preserving (counts not content)
- Aligns with DERIVED_RUNTIME_STATE concept from Phase 4

### Negative
- Audit trail bloat with telemetry
- Query complexity for real-time analysis
- Historical projections require replay

### Trade-offs Addressed
- Chose projection over centralized service for privacy
- Chose minimal raw storage over metric caching for consistency
- Chose on-demand computation over pre-computation for flexibility

## Compliance

Same as ADR-052 (see above).

## Open Decisions

- OD-T5-002-A: Per-provider vs per-model efficiency (deferred)
- OD-T5-002-B: Overflow risk notification threshold (deferred)
- OD-T5-002-C: Multi-turn vs single-shot counting (deferred)

---

# ADR-054 — Failure Pattern Detection Architecture

**Status:** Accepted  
**Date:** 2026-09-06  
**Supersedes:** None (new ADR)  
**Related:** ADR-035 (Verification Independence), ADR-036 (Retry/Cancellation/Revocation)  

---

## Context

V1 Runtime established retry/cancellation/revocation semantics (ADR-036). V2 Learning System requires automated pattern detection to identify systemic issues vs. one-off failures.

**Problem:** Without pattern detection, DPT cannot:
- Distinguish recurring failures from anomalies
- Generate targeted improvement proposals
- Reduce failure recurrence
- Support predictive maintenance

## Decision

**Hybrid Pattern Registry** combining explicit pattern matching with anomaly detection. All detections enter independent verification queue before classification (INDEPENDENT_VERIFICATION ≠ HUMAN_VERIFICATION). Pattern registry stored in AUDIT_TRAIL (no new entity).

### Pattern Matcher SERVICE

**Inputs:** AUDIT_TRAIL stream, active pattern registry, baseline statistics  
**Outputs:** Candidate patterns (review queue), confidence scores, anomaly metrics  
**Determinism:** DETERMINISTIC — rule-based + statistical thresholds

### Review Queue Lifecycle

```
OBSERVED → UNDER_REVIEW → ADOPTED | REJECTED
              ↓
        ADDITIONAL_EVIDENCE_REQUIRED
```

**Owner:** Existing REVIEWER_ROLE (no new Agent type)

### Pattern Registry Storage

Append-only registry in AUDIT_TRAIL. Operations:
- ADD pattern (after review approval)
- UPDATE pattern (refine conditions/mitigations)
- ARCHIVE pattern (deprecated, keep for historical)

## Consequences

### Positive
- Covers known and novel patterns
- Human-in-the-loop validation
- Gradual pattern library growth
- Aligns with DPT advisory nature

### Negative
- Requires review workflow
- Initial pattern library must be comprehensive
- Anomaly threshold tuning needed

### Trade-offs Addressed
- Chose hybrid over pure rule-based for novelty detection
- Chose independent verification over autonomous classification for safety (INDEPENDENT_VERIFICATION ≠ HUMAN_VERIFICATION)
- Chose audit trail storage over new entity for consistency

## Compliance

Same as ADR-052 (see above).

## Open Decisions

- OD-T5-003-A: Real-time vs batch detection (deferred)
- OD-T5-003-B: Minimum evidence threshold for adoption (deferred)
- OD-T5-003-C: Cross-project pattern sharing respects sovereignty (deferred)

---

# ADR-055 — Auto-Improvement Proposal Framework

**Status:** Accepted  
**Date:** 2026-09-06  
**Supersedes:** None (new ADR)  
**Related:** ADR-018 (Two-Plane Separation), ADR-035 (Verification Independence)  

---

## Context

V1 Runtime established execution capabilities. V2 Learning System must close the loop: Execute → Measure → Detect → Propose → Review → Apply → Re-measure.

**Problem:** Without proposal framework, detected patterns cannot drive improvements systematically.

## Decision

**Structured Template System** with pattern-driven instantiation. Each proposal follows canonical schema. Human review mandatory before application. No auto-application permitted.

### Proposal Classes

| Class | Source | Example | Review Priority |
|-------|--------|---------|-----------------|
| CONFIGURATION | Token efficiency, retry failures | Adjust timeout | LOW |
| POLICY | Authority denials, HG triggers | Revise ceiling | MEDIUM |
| PROCESS | Verification failures | Update docs | MEDIUM |
| ARCHITECTURAL | Recurring contention | Change routing | HIGH |
| GOVERNANCE | Policy ambiguity | Add policy | CRITICAL |

### Generation Pipeline

```
ADOPTED_PATTERN → PATTERN_CLASS_MAPPER → CANDIDATE_PROPOSAL_TYPE
     ↓
CANDIDATE + PATTERN_ID → EVIDENCE_COLLECTOR → EVIDENCE_PACKAGE
     ↓
PROPOSAL_CLASS + EVIDENCE → TEMPLATE_INSTANTIATOR → DRAFT_PROPOSAL
     ↓
DRAFT → REVIEW_QUEUE → UNDER_REVIEW
```

### Review Decision Matrix

| Class | Reviewer | Decisions | Approval |
|-------|----------|-----------|----------|
| CONFIGURATION | Any qualified | APPROVE | Single |
| POLICY | Independent | APPROVE/REJECT/MODIFY | Single |
| PROCESS | Independent | APPROVE/REJECT/MODIFY | Single |
| ARCHITECTURAL | Owner/delegate | APPROVE/REJECT/MODIFY | Single + audit |
| GOVERNANCE | Owner only | APPROVE/REJECT | Owner |

## Consequences

### Positive
- Transparent, structured output
- No ML dependency (deterministic)
- Ensures evidence requirements
- Aligns with advisory nature

### Negative
- Limited to known proposal types
- Template maintenance required
- May miss unconventional improvements

### Trade-offs Addressed
- Chose template over ML for transparency
- Chose independent verification over auto-application for safety (INDEPENDENT_VERIFICATION ≠ HUMAN_VERIFICATION)
- Chose structured schema over free-form for auditability

## Compliance

Same as ADR-052 (see above).

## Open Decisions

- OD-T5-004-A: ROI estimation required? (deferred)
- OD-T5-004-B: Maximum proposal age before expiry (deferred)
- OD-T5-004-C: Conflict resolution for competing proposals (deferred)

---

# ADR-056 — Cross-Project Pattern Extraction Model

**Status:** Accepted  
**Date:** 2026-09-06  
**Supersedes:** None (new ADR)  
**Related:** ADR-009 (Pool != Project Intelligence), ADR-049 (Pool Architecture)  

---

## Context

V1 Runtime established pool architecture (ADR-049). V2 Learning System requires cross-project learning while respecting project sovereignty.

**Problem:** Without cross-project learning, patterns remain isolated; systemic issues invisible at single-project level.

## Decision

**Contribution-Based Pattern Pool** with explicit opt-in consent. Projects contribute pseudonymized patterns to DPT Pools (ANONYMIZED_DATA ≠ PSEUDONYMIZED_DATA: no stable project linkage vs stable/recoverable linkage). Raw data never shared.

### Contribution Workflow

```
LOCAL_PATTERN → SOVEREIGNTY_CHECK → CONTRIBUTION_DECISION
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
              DON'T_CONTRIBUTE  CONTRIBUTE_FULL  CONTRIBUTE_ANONYMOUS
                    ↓               ↓               ↓
               [No action]     [Full attribution] [Anonymous class]
```

### Anonymization Rules

```
project_id → "PROJECT_N" (N = hash modulo 1000)
metrics → ranges (e.g., "70-80%" instead of "73%")
timestamps → relative (e.g., "2024-Q1" instead of exact)
names → generic ("the project", "a managed repository")
```

### Validation and Adoption

- Single contribution: QUALIFIED (requires additional evidence)
- Two contributions: VALID (adopted to pattern pool)
- Three+ contributions: ESTABLISHED (high confidence)

## Consequences

### Positive
- Respects project ownership (opt-in)
- Enables rich pattern reuse
- Validation ensures quality
- Aligns with Pool != PI principle

### Negative
- Requires explicit contribution workflow
- Pattern quality depends on contributor rigor
- Slower knowledge accumulation

### Trade-offs Addressed
- Chose contribution over centralization for sovereignty
- Chose anonymization over pseudonymization for privacy
- Chose validation over trust for quality

## Compliance

Same as ADR-052 (see above).

## Open Decisions

- OD-T5-005-A: Minimum contribution threshold (deferred)
- OD-T5-005-B: Conflicting pattern resolution (deferred)
- OD-T5-005-C: Contributor credit/recognition (deferred)

---

# PHASE 5 ARCHITECTURE SUMMARY

**Status:** Complete  
**Date:** 2026-09-06  

## Admitted ADRs

| ADR | Title | Key Innovation |
|-----|-------|----------------|
| ADR-052 | Intervention Measurement | Event projection on audit trail |
| ADR-053 | Token/Context Efficiency | Derived runtime state projection |
| ADR-054 | Failure Pattern Detection | Hybrid pattern registry with independent verification |
| ADR-055 | Auto-Improvement Proposals | Structured template system, no auto-application |
| ADR-056 | Cross-Project Pattern Extraction | Contribution-based pool with anonymization |

## Component Counts

| Category | Count | Change from Phase 4 |
|----------|-------|---------------------|
| CORE ENTITIES | 9 | 0 (unchanged) |
| CORE SERVICES | 4 | +1 (PATTERN_MATCHER_SERVICE added) |
| CORE GOVERNANCE/EXECUTION PRIMITIVES | 7 | 0 (unchanged) |
| DERIVED RUNTIME STATE | 2 | 0 (unchanged) |
| NON-CORE BUT CANONICAL ENTITIES | 7 | +2 (CONTRIBUTION_PACKAGE, PSEUDONYMOUS_PROJECT_ID) |
| **TOTAL** | **29** | **+3** |

## Open Decisions Classified

| ID | Title | Classification | Resolution Path |
|----|-------|---------------|-----------------|
| OD-T5-001-A | Duration granularity | NON_BLOCKING_V2 | Resolve during T5-001 implementation |
| OD-T5-001-B | Improvement signal granularity | NON_BLOCKING_V2 | Resolve during T5-001 implementation |
| OD-T5-001-C | Cross-project pattern matching | DEFER_TO_V3 | Depends on V3 implementation evidence |
| OD-T5-002-A | Per-provider vs per-model | NON_BLOCKING_V2 | Resolve during T5-002 implementation |
| OD-T5-002-B | Overflow threshold | TASK_LOCAL_BLOCKER | Required before T5-002 implementation |
| OD-T5-002-C | Multi-turn handling | NON_BLOCKING_V2 | Resolve during T5-002 implementation |
| OD-T5-003-A | Real-time vs batch | NON_BLOCKING_V2 | Resolve during T5-003 implementation |
| OD-T5-003-B | Evidence threshold | TASK_LOCAL_BLOCKER | Required before T5-003 implementation |
| OD-T5-003-C | Cross-project sharing | DEFER_TO_V3 | Depends on V3 implementation evidence |
| OD-T5-004-A | ROI estimation | NON_BLOCKING_V2 | Resolve during T5-004 implementation |
| OD-T5-004-B | Proposal expiry | NON_BLOCKING_V2 | Resolve during T5-004 implementation |
| OD-T5-004-C | Conflict resolution | NON_BLOCKING_V2 | Resolve during T5-004 implementation |
| OD-T5-005-A | Minimum contribution threshold | TASK_LOCAL_BLOCKER | Required before T5-005 implementation |
| OD-T5-005-B | Conflicting patterns | NON_BLOCKING_V2 | Resolve during T5-005 implementation |
| OD-T5-005-C | Contributor credit | NON_BLOCKING_V2 | Resolve during T5-005 implementation |

## Phase Boundary

Phase 5 architecture review complete. Five ADRs admitted (052-056). No new Human Gates, Agents, authority layers, or lifecycle states introduced. Phase 6 (implementation foundation tasks) authorized per autonomous continuation invariant.

**Next decision point:** Phase 6 implementation authorization (if no Human Gate triggered).
