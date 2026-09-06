# T5-003 — Failure Pattern Detection Architecture

**Task ID:** T5-003  
**Parent Phase:** Phase 5 (V2 Learning System Architecture)  
**Status:** RUNNING  
**Date:** 2026-09-06  
**Dependencies:** None (parallel start with T5-001, T5-002)  

---

## OBJECTIVE

Define the architectural model for automated failure pattern detection across DPT-managed projects.

---

## PROBLEM SPACE

### What Constitutes a "Failure Pattern"?

Per ADR-036 (Retry, Cancellation, Revocation Semantics) and ADR-035 (Verification Independence), failures occur across multiple domains:

1. **Authority failures** — LAYER 4 evaluation DENY, LAYER 5 materialization FAILED_ASSERTION
2. **Verification failures** — VERIFICATION_REJECTED, independence contract violation
3. **Resource failures** — RESOURCE_CLAIM conflict, lease acquisition failure
4. **Integration failures** — Merge conflicts, ownership disputes
5. **Entitlement failures** — Credit exhaustion, tier downgrade
6. **Network failures** — Gateway disconnect, Front Agent partition
7. **Policy failures** — Human Gate unresolvable, governance ambiguity

### Why Detect Patterns?

V2 Learning System needs pattern detection to:
- Identify systemic issues vs. one-off failures
- Generate targeted improvement proposals
- Reduce recurrence of known failure modes
- Inform architectural refinements
- Support predictive maintenance

---

## CANDIDATE DESIGNS

### Design A: Rule-Based Pattern Engine

**Model:** Explicit rules encode known failure patterns. Detection triggers when rule conditions match observed events.

**Pros:**
- Transparent, auditable logic
- No ML dependency
- Deterministic results
- Easy to validate against Phase 4 invariants

**Cons:**
- Requires exhaustive pattern enumeration
- Cannot discover novel patterns
- Maintenance burden grows with pattern count

### Design B: Statistical Anomaly Detection

**Model:** Baseline failure rates established per domain. Deviations trigger investigation.

**Pros:**
- Can detect novel patterns
- Adapts to changing baselines
- No explicit rule maintenance

**Cons:**
- Probabilistic (false positives/negatives)
- Requires statistical expertise
- May miss low-frequency high-impact patterns
- harder to explain to human reviewers

### Design C: Hybrid Pattern Registry (Selected)

**Model:** Combines explicit pattern registry (for known patterns) with anomaly detection (for novel patterns). All detections enter review queue before classification.

**Pros:**
- Covers both known and novel patterns
- Human-in-the-loop validation
- Gradual pattern library growth
- Aligns with DPT's advisory nature (never autonomous classification)

**Cons:**
- Requires review workflow
- Initial pattern library must be comprehensive
- Anomaly detection threshold tuning

---

## ARCHITECTURAL DECISION

**Selected: Design C — Hybrid Pattern Registry**

**Rationale:**
1. Phase 4 established `EFFECT_IDENTITY` primitive — each failure has stable identity for lineage
2. DPT is advisory, not autonomous (ADR-018) — pattern detection should recommend, not decide
3. Human review preserves independent verification principle (ADR-035)
4. No new Agent type required — existing REVIEWER_ROLE can handle pattern validation
5. Pattern registry is a GOVERNANCE PRIMITIVE, not a new entity

**Invariant Preserved:**
```
Pattern Detection = Observation + Classification(Review Required) + Registry Update
No autonomous pattern classification permitted
All detected patterns enter review queue before adoption
```

---

## PATTERN TAXONOMY

### Domain Classification

| Domain | Pattern Examples | Severity |
|--------|-----------------|----------|
| AUTHORITY | L4 denial spike, L5 materialization failure cluster | HIGH |
| VERIFICATION | Independence contract violation, reviewer conflict | MEDIUM |
| RESOURCE | Lease contention, claim compatibility failure | MEDIUM |
| INTEGRATION | Merge conflict recurrence, ownership dispute | LOW |
| ENTITLEMENT | Credit exhaustion pattern, tier change impact | MEDIUM |
| NETWORK | Partition frequency, reconnect latency spike | LOW |
| POLICY | Human Gate backlog, governance ambiguity | HIGH |

### Pattern Schema

```json
{
  "pattern_id": "UUIDv7",
  "pattern_class": "AUTHORITY | VERIFICATION | RESOURCE | INTEGRATION | ENTITLEMENT | NETWORK | POLICY",
  "subsystem": "LAYER_4_EVALUATOR | LAYER_5_MATERIALIZER | VERIFICATION_REVIEWER | LEASE_MANAGER | CREDIT_ACCOUNT | GATEWAY | HUMAN_GATE",
  "symptoms": ["event_type", ...],
  "conditions": {
    "frequency_threshold": int,
    "time_window_minutes": int,
    "severity_minimum": "LOW | MEDIUM | HIGH | CRITICAL"
  },
  "root_cause_hypothesis": "string",
  "mitigation_strategies": ["string", ...],
  "validation_status": "OBSERVED | UNDER_REVIEW | ADOPTED | REJECTED",
  "adoption_evidence": ["hash-link", ...]
}
```

---

## DETECTION ARCHITECTURE

### Component Model

```
[Event Stream] 
    ↓
[Pattern Matcher SERVICE]
    ↓ (candidate patterns)
[Review Queue]
    ↓ (human validation)
[Pattern Registry] ←→ [Improvement Proposal Generator]
```

### Pattern Matcher SERVICE

**Inputs:**
- AUDIT_TRAIL event stream (real-time or batch)
- Active pattern registry (known patterns)
- Baseline statistics (historical failure rates)

**Outputs:**
- Candidate pattern observations (enter review queue)
- Pattern confidence scores
- Anomaly deviation metrics

**Determinism:** DETERMINISTIC — rule-based matching + statistical thresholds

### Review Queue

**Purpose:** Human validation of candidate patterns before adoption

**Lifecycle:**
```
OBSERVED → UNDER_REVIEW → ADOPTED | REJECTED
              ↓
        ADDITIONAL_EVIDENCE_REQUIRED
```

**Owner:** Existing REVIEWER_ROLE (no new Agent type)

### Pattern Registry

**Storage:** Append-only registry in AUDIT_TRAIL (no new entity)

**Operations:**
- ADD pattern (after review approval)
- UPDATE pattern (refine conditions/mitigations)
- ARCHIVE pattern (deprecated, keep for historical analysis)

**Query:** Pattern matcher reads registry to check against incoming events

---

## INTEGRATION WITH EXISTING MODEL

### Authority Stack Integration

| Layer | Failure Pattern Relevance |
|-------|---------------------------|
| L1 Policy | Pattern root causes may indicate policy gaps |
| L2 Delegation | Pattern recurrence may indicate delegation scope issues |
| L3 Envelope | Envelope validation failures are observable patterns |
| L4 Evaluation | DENY spikes indicate authority evaluation issues |
| L5 Materialization | FAILED_ASSERTION clusters indicate provider issues |

### Retry/Cancellation/Revocation Integration

Per ADR-036:
- RETRY patterns: Transient failures requiring different mitigation
- CANCELLATION patterns: Systemic issues requiring policy review
- REVOCATION patterns: Security/governance incidents requiring immediate action

Pattern detection must respect `REVOCATION > CANCELLATION > RETRY` precedence.

### Verification Integration

Per ADR-035:
- Independent verification failures may indicate pattern in verification process
- Reviewer conflict patterns may indicate need for broader reviewer pool
- Self-verification attempts are themselves a detectable pattern

---

## MITIGATION STRATEGY GENERATION

### Strategy Classes

| Class | Example | Application |
|-------|---------|-------------|
| CONFIGURATION | Adjust timeout, increase retry budget | Immediate |
| POLICY | Revise authority ceiling, adjust Human Gate triggers | Short-term |
| ARCHITECTURAL | Change routing, add caching, modify lifecycle | Long-term |
| PROCESS | Update documentation, improve training, enhance monitoring | Ongoing |

### Improvement Proposal Generation

Pattern adoption triggers automatic consideration of improvement proposals:

```
ADOPTED_PATTERN → MITIGATION_ANALYSIS → IMPROVEMENT_PROPOSAL_DRAFT → REVIEW_QUEUE
```

Proposals enter T5-004 (Auto-Improvement Proposals Framework) for independent verification per governance policy.

---

## OPEN DECISIONS

| # | Question | Options | Status |
|---|----------|---------|--------|
| OD-T5-003-A | Should pattern detection run real-time or batch? | Real-time (streaming) / Batch (periodic) / Hybrid (critical patterns real-time, others batch) | DEFERRED |
| OD-T5-003-B | What is the minimum evidence threshold for pattern adoption? | Single observation + review / Multiple observations / Statistical significance | DEFERRED |
| OD-T5-003-C | How should cross-project pattern sharing respect project sovereignty? | Anonymous aggregation / Explicit contribution / No cross-project learning | DEFERRED |

---

## PHASE 4 INVARIANT COMPLIANCE

| Constraint | Check | Result |
|------------|-------|--------|
| New Human Gate? | None introduced (uses existing REVIEWER_ROLE) | ✓ PASS |
| New Agent type? | None introduced | ✓ PASS |
| New authority layer? | None introduced | ✓ PASS |
| New lifecycle state? | None introduced | ✓ PASS |
| Embeds execution context into authority? | No, observes after execution | ✓ PASS |
| Preserves five-layer stack? | Yes, detects patterns at each layer | ✓ PASS |
| Respects Project Intelligence ownership? | Yes, patterns are DPT-side observations | ✓ PASS |
| Maintains independent verification? | Yes, independent verification required per governance policy | ✓ PASS |
| Effect identity sufficient? | Yes, each failure has stable identity | ✓ PASS |
| No silent cross-domain power? | Yes, patterns observed but not acted upon autonomously | ✓ PASS |

---

## DELIVERABLES

1. **ADR Document:** This document → `docs/adr/ADR-054-failure-pattern-detection.md`
2. **Pattern Registry Schema:** `docs/schemas/pattern-registry.schema.json`
3. **Detection Specification:** `docs/v2/failure-pattern-spec.md`
4. **Open Decisions Log:** Updated `docs/DPT_OPEN_DECISIONS.md` entries OD-T5-003-A/B/C

---

## NEXT STEPS

1. Write ADR-054 incorporating this design
2. Define pattern registry schema
3. Integrate with T5-001 (Intervention Measurement) and T5-002 (Token Efficiency)
4. Prepare for T5-004 (Auto-Improvement Proposals Framework — depends on 001-003)

---

**Status:** Architecture design complete. Ready for ADR formalization.
