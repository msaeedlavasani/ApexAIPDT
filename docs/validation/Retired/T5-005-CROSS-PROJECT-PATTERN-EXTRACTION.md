# T5-005 — Cross-Project Pattern Extraction Model

**Task ID:** T5-005  
**Parent Phase:** Phase 5 (V2 Learning System Architecture)  
**Status:** RUNNING  
**Date:** 2026-09-06  
**Dependencies:** T5-004 (Auto-Improvement Proposals) — COMPLETE  

---

## OBJECTIVE

Define the architectural model for extracting reusable patterns across DPT-managed projects while respecting project sovereignty and intellectual property boundaries.

---

## PROBLEM SPACE

### The Sovereignty Challenge

Per ADR-009 (Pool != Project Intelligence) and ADR-004 (DPT does not assume superiority):
- Projects own their Intelligence and execution data
- DPT Pools store reusable assets, but only with explicit contribution
- Cross-project learning must respect ownership boundaries
- Anonymous aggregation enables learning without appropriation

### Why Cross-Project Learning?

V2 Learning System needs cross-project data to:
- Identify systemic patterns invisible at single-project level
- Build robust baselines for anomaly detection
- Discover best practices across diverse project types
- Inform V3 architectural improvements with broader evidence

### What Can Be Shared?

| Data Type | Shareable? | Method | Safeguards |
|-----------|-----------|--------|------------|
| Intervention counts | ✓ YES | Anonymous aggregation | No project identifiers |
| Token efficiency metrics | ✓ YES | Statistical aggregates | No prompt content |
| Failure pattern categories | ✓ YES | Pattern classification | No source project names |
| Improvement proposal outcomes | ✓ YES | Success/failure rates | No proprietary details |
| Project-specific context | ✗ NO | Never shared | Project ownership respected |
| Raw audit events | ✗ NO | Never shared | Confidentiality preserved |

---

## CANDIDATE DESIGNS

### Design A: Centralized Learning Repository

**Model:** All project data flows to central DPT repository for analysis. Projects "contribute" data explicitly.

**Pros:**
- Complete visibility
- Rich analysis capability
- Direct pattern extraction

**Cons:**
- Privacy concerns (project data centralization)
- Requires explicit consent for each project
- Violates project ownership principle
- Single point of failure

### Design B: Federated Learning with Aggregation

**Model:** Each project computes local statistics. Only anonymous aggregates flow to central system. Raw data never leaves project.

**Pros:**
- Privacy-preserving
- Respects project sovereignty
- Enables global pattern detection
- No raw data centralization

**Cons:**
- Limited to pre-defined aggregate types
- Cannot discover novel patterns requiring raw data
- Communication overhead for aggregation

### Design C: Contribution-Based Pattern Pool (Selected)

**Model:** Projects explicitly contribute learned patterns to DPT Pools. Patterns are versioned, attributed (anonymously), and validated before adoption. Raw data never shared.

**Pros:**
- Respects project ownership (opt-in contribution)
- Enables rich pattern reuse
- Validation ensures quality
- Aligns with ADR-009 (Pool != PI)
- Supports evolutionary pattern library

**Cons:**
- Requires explicit contribution workflow
- Pattern quality depends on contributor rigor
- Slower knowledge accumulation

---

## ARCHITECTURAL DECISION

**Selected: Design C — Contribution-Based Pattern Pool**

**Rationale:**
1. Phase 4 established Pool != Project Intelligence (ADR-009)
2. Projects retain ownership of their data
3. Explicit contribution respects sovereignty
4. Validation ensures quality control
5. Pattern versioning enables evolution
6. No new authority layer or lifecycle state required

**Invariant Preserved:**
```
Cross-Project Learning = Local Analysis + Anonymous Contribution + Validation + Pool Adoption
No raw data sharing permitted
No project identification in contributed patterns
Owner consent required for contribution
```

---

## CONTRIBUTION WORKFLOW

### Stage 1: Local Pattern Detection

Each project runs T5-003 (Failure Pattern Detection) independently:
- Detect patterns within project boundaries
- Generate improvement proposals (T5-004)
- Measure outcomes (T5-001, T5-002)

**Output:** Local pattern registry + adoption history

### Stage 2: Contribution Decision

Project owner decides what to contribute:

```
LOCAL_PATTERN → SOVEREIGNTY_CHECK → CONTRIBUTION_DECISION
                                          ↓
                    ┌─────────────────────┼─────────────────────┐
                    ↓                     ↓                     ↓
              DON'T_CONTRIBUTE      CONTRIBUTE_FULL        CONTRIBUTE_ANONYMOUS
                    ↓                     ↓                     ↓
               [No action]         [Full attribution]     [Anonymous class]
```

**Sovereignty Check Questions:**
- Does contribution reveal project-specific context? → NO
- Does contribution reveal proprietary implementation? → NO
- Does contribution reveal owner identity? → NO
- Is contribution purely statistical/classificatory? → YES

### Stage 3: Pattern Anonymization

Contributed patterns undergo anonymization:
- Remove project identifiers
- Generalize specific metrics to ranges
- Preserve pattern structure and class
- Maintain evidence hashes (can be verified without project identity)

**Anonymization Rules:**
```
project_id → "PROJECT_N" (N = hash modulo 1000)
metrics → ranges (e.g., "70-80%" instead of "73%")
timestamps → relative (e.g., "2024-Q1" instead of exact date)
names → generic ("the project", "a managed repository")
```

### Stage 4: Pattern Submission

Anonymized pattern submitted to DPT Pool system:
- Pattern class and subclass defined
- Evidence package included (hashes, not content)
- Contribution metadata (pseudonymized project ID (stable/recoverable linkage under governance; ANONYMIZED_DATA ≠ PSEUDONYMIZED_DATA), date, metrics)
- Owner declaration (opt-in consent recorded)

### Stage 5: Validation and Adoption

Existing Pool validation applies:
- Structural validation (schema compliance)
- Semantic validation (pattern makes sense)
- Evidence validation (hashes verify)
- Consensus validation (multiple contributions reinforce)

**Adoption Threshold:**
- Single contribution: QUALIFIED (requires additional evidence)
- Two contributions: VALID (adopted to pattern pool)
- Three+ contributions: ESTABLISHED (high confidence)

---

## PATTERN POOL INTEGRATION

### Pool Types Relevant to Cross-Project Learning

| Pool Type | Relevance | Example |
|-----------|-----------|---------|
| `POOL_PATTERNS` | Primary repository for learned patterns | "L4 denial spike during high load" |
| `POOL_MITIGATIONS` | proven mitigation strategies | "Increase retry budget by 50%" |
| `POOL_CONFIGURATIONS` | Validated configuration templates | "Optimal timeout settings per domain" |
| `POOL_PROPosals` | Historical improvement proposals | Archived for reference |

### Contribution Pathway

```
LOCAL_PATTERN (project-side)
    ↓ anonymize
ANONYMOUS_PATTERN (contribution package)
    ↓ submit
POOL_PATTERN (validated, versioned)
    ↓ adopt
SHARED_KNOWLEDGE (available to all projects)
```

### Reverse Flow: Pattern Adaptation

Projects can adapt adopted patterns:
1. Read pattern from Pool
2. Evaluate relevance to local context
3. Customize parameters (if needed)
4. Apply with local validation
5. Contribute outcome back to Pool (closed loop)

---

## DATA MODEL

### Contributed Pattern Schema

```json
{
  "contribution_id": "UUIDv7",
  "source_project_hash": "SHA256(project_id)",
  "contributed_at": "ISO8601",
  "pattern_class": "AUTHORITY | VERIFICATION | RESOURCE | INTEGRATION | ENTITLEMENT | NETWORK | POLICY",
  "pattern_subclass": "string",
  "symptoms": ["event_type", ...],
  "conditions": {
    "frequency_range": "int-int",
    "time_window": "minutes",
    "severity": "LOW | MEDIUM | HIGH | CRITICAL"
  },
  "root_cause_hypothesis": "string",
  "mitigation_strategies": ["string", ...],
  "outcome_data": {
    "proposals_generated": int,
    "proposals_applied": int,
    "success_rate": float,
    "metrics_improved": boolean
  },
  "evidence_hashes": ["hash", ...],
  "validation_status": "SUBMITTED | QUALIFIED | VALID | ESTABLISHED",
  "adoption_count": int,
  "pool_pattern_id": "string|null"
}
```

### Aggregate Statistics Schema

```json
{
  "aggregate_id": "UUIDv7",
  "computation_date": "ISO8601",
  "pattern_class": "string",
  "statistics": {
    "total_contributions": int,
    "average_frequency": float,
    "severity_distribution": {"LOW": int, "MEDIUM": int, "HIGH": int, "CRITICAL": int},
    "success_rate": float,
    "top_mitigations": ["string", ...]
  },
  "confidence_interval": {
    "lower": float,
    "upper": float
  }
}
```

---

## PRIVACY AND SOVEREIGNTY GUARANTEES

### What NEVER Leaves Project

- Raw audit events
- Project identifiers
- Owner identity
- Implementation details
- Business logic
- Proprietary algorithms
- PSEUDONYMIZED_DATA metrics (recoverable linkage; ANONYMIZED_DATA has no stable project identity)

### What CAN Be Shared

- Pattern classifications
- Statistical ranges (not exact values)
- Evidence hashes (verifiable without content)
- Outcome metrics (aggregated)
- Mitigation strategies (generalized)

### Consent Mechanism

Explicit opt-in required for each contribution:
1. Contributor declares intent
2. Anonymization applied
3. Reviewer validates no re-identification risk
4. Contribution recorded with consent timestamp
5. Contributor can revoke (pattern marked deprecated)

---

## INTEGRATION WITH EXISTING MODEL

### Authority Stack Integration

| Layer | Cross-Project Relevance |
|-------|------------------------|
| L1 Policy | Governs what can be contributed (policy ceiling) |
| L2 Delegation | Project owner delegation for contribution decisions |
| L3 Envelope | Envelope validity affects contribution eligibility |
| L4 Evaluation | Cross-project patterns inform evaluation tuning |
| L5 Materialization | No direct impact (implementation detail) |

### Pool Architecture Integration

Per ADR-049:
- Contributed patterns enter `POOL_PATTERNS` type
- Validation uses existing 3-tier validation (structural, semantic, consensus)
- Retrieval follows existing capability-routed discovery
- No new Pool types required

### Verification Integration

Per ADR-035:
- Independent validation of contributions required
- Pattern quality assessment by REVIEWER_ROLE
- Adopted patterns subject to re-validation periodically

---

## OPEN DECISIONS

| # | Question | Options | Status |
|---|----------|---------|--------|
| OD-T5-005-A | What is the minimum contribution threshold for pattern adoption? | 1 (qualified) / 2 (valid) / 3 (established) / Dynamic based on severity | DEFERRED |
| OD-T5-005-B | How should we handle patterns with conflicting outcomes? | Majority votes / Severity-weighted / Manual review | DEFERRED |
| OD-T5-005-C | Should contributors receive credit/recognition? | Anonymous / Pseudonymous / Named (with consent) | DEFERRED |

---

## PHASE 4 INVARIANT COMPLIANCE

| Constraint | Check | Result |
|------------|-------|--------|
| New Human Gate? | None introduced | ✓ PASS |
| New Agent type? | None introduced | ✓ PASS |
| New authority layer? | None introduced | ✓ PASS |
| New lifecycle state? | None introduced | ✓ PASS |
| Embeds execution context into authority? | No, separate contribution pathway | ✓ PASS |
| Preserves five-layer stack? | Yes, respects authority boundaries | ✓ PASS |
| Respects Project Intelligence ownership? | Yes, opt-in contribution only | ✓ PASS |
| Maintains independent verification? | Yes, validation required for adoption | ✓ PASS |
| Effect identity sufficient? | Yes, contribution_id enables lineage | ✓ PASS |
| No silent cross-domain power? | Yes, explicit contribution pathway | ✓ PASS |
| Pool != Project Intelligence? | Yes, patterns are distilled abstractions | ✓ PASS |

---

## DELIVERABLES

1. **ADR Document:** This document → `docs/adr/ADR-056-cross-project-patterns.md`
2. **Contribution Schema:** `docs/schemas/pattern-contribution.schema.json`
3. **Anonymization Specification:** `docs/v2/pattern-anonymization-spec.md`
4. **Open Decisions Log:** Updated `docs/DPT_OPEN_DECISIONS.md` entries OD-T5-005-A/B/C

---

## NEXT STEPS

1. Write ADR-056 incorporating this design
2. Define contribution schema
3. Integrate with existing Pool system (ADR-049)
4. Proceed to T5-006 (V2 Architecture Summary ADR)
5. Proceed to T5-007 (Open Decisions Classification)

---

**Status:** Architecture design complete. Ready for ADR formalization.
