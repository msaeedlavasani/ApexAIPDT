# T5-001 — Intervention Measurement Architecture

**Task ID:** T5-001  
**Parent Phase:** Phase 5 (V2 Learning System Architecture)  
**Status:** RUNNING  
**Date:** 2026-09-06  
**Dependencies:** None (parallel start)  

---

## OBJECTIVE

Define the architectural model for measuring human interventions across DPT-managed projects.

---

## PROBLEM SPACE

### What is a "Human Intervention"?

Per ADR-018 (Two-Plane Separation) and ADR-044 (Greenfield Advisory), DPT operates with explicit Human Gate boundaries. Interventions occur when:

1. **Human Gate triggered** — Irreversible action requires owner approval (HG-01 through HG-07)
2. **Authority escalation** — LAYER 4 evaluation returns ESCALATE instead of ALLOW/DENY
3. **Verification rejection** — Independent verification fails, requiring human resolution
4. **Policy ambiguity** — Deterministic routing cannot resolve governance question
5. **Cross-domain conflict** — Silent power acquisition detected, requires human adjudication
6. **Failure recovery** — Automated recovery exhausted, manual intervention required

### Why Measure?

V2 Learning System needs intervention data to:
- Identify architectural friction points
- Optimize authority delegation boundaries
- Reduce unnecessary Human Gate triggers
- Improve deterministic routing accuracy
- Inform V3 improvement proposal generation

---

## CANDIDATE DESIGNS

### Design A: Centralized Audit Trail Enhancement

**Model:** Extend existing AUDIT_TRAIL entity with `intervention_type` and `resolution_path` fields.

**Pros:**
- Leverages existing hash-linked chain
- Minimal schema changes
- Consistent with ADR-031 (append-only audit)

**Cons:**
- Audit trail is append-only; intervention data may require structured query
- Mixing operational audit with measurement data conflates concerns

### Design B: Separate Intervention Record Entity

**Model:** New ENTITY `INTERVENTION_RECORD` with lifecycle: `OPEN → UNDER_REVIEW → RESOLVED → CLOSED`.

**Pros:**
- Clean separation of concerns
- Structured fields for measurement
- Supports analytics queries

**Cons:**
- New entity (violates "max 1 new entity per ADR" simplicity budget unless justified)
- Duplicate lineage to audit trail
- Requires new verification path

### Design C: Intervention as Event Projection

**Model:** No new entity. Intervention is a EVENT_TYPE in existing audit trail with structured metadata. Analytics query interprets event patterns.

**Pros:**
- No new persistent entity
- Preserves audit trail purity
- Sufficient for statistical measurement
- Aligns with Delta primitive (state-change-only record)

**Cons:**
- Less structured than entity approach
- Query complexity for pattern detection

---

## ARCHITECTURAL DECISION

**Selected: Design C — Intervention as Event Projection**

**Rationale:**
1. Phase 4 admission established `EFFECT_IDENTITY` as CORE GOVERNANCE/EXECUTION PRIMITIVE, not independent entity
2. Intervention is an EFFECT (externally observable state change) requiring identity for lineage
3. Existing AUDIT_TRAIL already captures all state transitions with hash-linking
4. Structured metadata fields on intervention events provide measurement granularity without new persistence
5. No new Human Gate, Agent, authority layer, or lifecycle state introduced

**Invariant Preserved:**
```
Intervention = Observable effect requiring human adjudication
Measured via: event_type + metadata + resolution_path + duration
No new persistence required beyond existing audit trail
```

---

## DATA MODEL

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
| Frequency | Count of INTERVENTION events per time window | Daily/weekly/monthly |
| Type distribution | `trigger_source` field | Per category percentages |
| Severity distribution | `severity` field | Heatmap by severity×domain |
| Resolution time | `resolution.duration_seconds` | P50/P95/Max histograms |
| Domain concentration | `domain` field | Top-N domains by count |
| Gate class frequency | `context.human_gate_class` | Per HG-01..HG-07 counts |
| Improvement signal | `learning.improvement_proposal` | Boolean rate |

---

## INTEGRATION WITH EXISTING MODEL

### Authority Stack Integration

| Layer | Intervention Relevance |
|-------|------------------------|
| L1 Policy | Defines which actions require Human Gate |
| L2 Delegation | Scope of owner authority vs. DPT authority |
| L3 Envelope | Interventions may modify envelope validity |
| L4 Evaluation | ESCALATE verdict triggers intervention |
| L5 Materialization | Intervention outcome determines permission state |

### Audit Trail Integration

Intervention events are APPENDED to existing AUDIT_TRAIL with:
- Hash-chain linkage to parent attempt/work order
- Signed by resolving actor (owner/DPT/evaluator)
- Immutable once written (append-only invariant)
- Queryable via event_type filter

### Verification Integration

Interventions triggered by VERIFICATION_REJECTION link to:
- Parent VERIFICATION_RECORD
- Original ATTEMPT identity
- Required re-verification path

---

## PRIVACY AND SCOPE BOUNDARIES

### What IS Measured

- Intervention occurrence (when, where, why)
- Resolution method and duration
- Pattern classification (for learning)
- Aggregate statistics (no PII)

### What is NOT Measured

- Content of human deliberation
- Private project context beyond intervention trigger
- Owner identity beyond role (owner vs. DPT vs. evaluator)
- Biometric or behavioral data
- Cross-project correlation without explicit contribution pathway

### Data Retention

| Data Class | Retention | Rationale |
|------------|-----------|-----------|
| Intervention event | Indefinite (audit trail) | Lineage requirement |
| Resolution details | Project lifetime + 7 years | Governance audit |
| Learning/pattern data | Anonymized aggregate | Statistical use only |
| Raw metrics | 90 days | Operational monitoring |

---

## OPEN DECISIONS

| # | Question | Options | Status |
|---|----------|---------|--------|
| OD-T5-001-A | Should intervention duration include deliberation time or only active resolution time? | Include both / Exclude deliberation | DEFERRED |
| OD-T5-001-B | What is the minimum granularity for "improvement proposal" signal? | Per-intervention / Per-pattern / Per-domain | DEFERRED |
| OD-T5-001-C | How should cross-project pattern matching respect project sovereignty? | Anonymous aggregation / Explicit contribution opt-in / No cross-project learning | DEFERRED |

---

## PHASE 4 INVARIANT COMPLIANCE

| Constraint | Check | Result |
|------------|-------|--------|
| New Human Gate? | None introduced | ✓ PASS |
| New Agent type? | None introduced | ✓ PASS |
| New authority layer? | None introduced | ✓ PASS |
| New lifecycle state? | None introduced | ✓ PASS |
| Embeds execution context into authority? | No, separates concerns | ✓ PASS |
| Preserves five-layer stack? | Yes, integrates at L4 evaluation | ✓ PASS |
| Respects Project Intelligence ownership? | Yes, measures only DPT-side events | ✓ PASS |
| Maintains independent verification? | Yes, intervention resolution independently audited | ✓ PASS |
| Effect identity sufficient? | Yes, intervention_id enables lineage | ✓ PASS |
| No silent cross-domain power? | Yes, intervention explicitly tracks domain transitions | ✓ PASS |

---

## DELIVERABLES

1. **ADR Document:** This document → `docs/adr/ADR-052-intervention-measurement.md`
2. **Schema Definition:** JSON schema in `docs/schemas/intervention-event.schema.json`
3. **Measurement Spec:** `docs/v2/intervention-measurement-spec.md`
4. **Open Decisions Log:** Updated `docs/DPT_OPEN_DECISIONS.md` entries OD-T5-001-A/B/C

---

## NEXT STEPS

1. Write ADR-052 incorporating this design
2. Define JSON schema for intervention event
3. Begin T5-002 (Token/Context Efficiency Architecture) in parallel
4. Re-evaluate OD-01 through OD-26 against V2 requirements

---

**Status:** Architecture design complete. Ready for ADR formalization.
