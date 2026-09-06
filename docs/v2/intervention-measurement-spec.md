# Intervention Measurement Specification — V2 Learning System

**Document:** `docs/v2/intervention-measurement-spec.md`  
**Parent ADR:** ADR-052 (Intervention Measurement)  
**Schema:** `docs/schemas/intervention-event.schema.json`  
**Status:** IMPLEMENTING (DPT-FOUNDATION-037)  
**Date:** 2026-09-06

---

## 1. Purpose

Define the runtime intervention measurement model for the V2 Learning System. This specification operationalizes ADR-052's architectural decision to project interventions as structured events from the existing audit trail, without introducing new persistent entities.

### 1.1 Scope

- Measures human intervention frequency, type, and duration across DPT-managed projects
- Provides structured data for V2 learning analytics
- Feeds improvement proposal generation (T5-004 / ADR-055)
- Feeds cross-project pattern extraction (T5-005 / ADR-056)

### 1.2 Out of Scope

- New persistence layer (interventions projected from audit trail)
- Real-time intervention blocking (already handled by existing Human Gates)
- Owner identity exposure (role-level only: owner/DPT/evaluator)

---

## 2. Architectural Model

### 2.1 Design Selection: Event Projection

Per ADR-052, interventions are **event projections** on the existing audit trail, not new entities.

```
Intervention = Observable effect requiring human adjudication
Measured via: event_type + metadata + resolution_path + duration
No new persistence required beyond existing audit trail
```

**Rationale:**
1. `EFFECT_IDENTITY` is a CORE GOVERNANCE/EXECUTION PRIMITIVE (ADR-033), not an independent entity
2. Intervention is an EFFECT (externally observable state change) requiring identity for lineage
3. Existing AUDIT_TRAIL already captures all state transitions with hash-linking
4. Structured metadata fields provide measurement granularity without new persistence
5. Zero new Human Gate, Agent, authority layer, or lifecycle state introduced

### 2.2 Integration Points

| Component | Integration | Direction |
|-----------|------------|-----------|
| Audit Trail | Append INTERVENTION event with hash-chain linkage | Output |
| Human Gate (HG-01..HG-07) | Record trigger_source and human_gate_class | Input |
| L4 Evaluation | Record AUTHORITY_ESCALATION triggers | Input |
| Verification System | Record VERIFICATION_REJECTION triggers | Input |
| Failure Pattern Detection (T5-003) | Link resolution.pattern_match to detected patterns | Output |
| Auto-Improvement Proposals (T5-004) | Generate improvement_proposal signals | Output |
| Cross-Project Patterns (T5-005) | Contribute anonymized/pseudonymized aggregates | Output |

---

## 3. Data Model

### 3.1 Intervention Event Structure

See `docs/schemas/intervention-event.schema.json` for the complete JSON Schema.

Key fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_type` | string | Yes | Constant: `"INTERVENTION"` |
| `intervention_id` | UUIDv7 | Yes | Temporal UUID for ordering and lineage |
| `timestamp` | ISO 8601 | Yes | When the intervention occurred |
| `trigger_source` | enum | Yes | Source of the intervention |
| `severity` | enum | Yes | LOW/MEDIUM/HIGH/CRITICAL |
| `domain` | enum | Yes | Domain of intervention |
| `context` | object | Yes | Parent audit trail references |
| `description` | string | Yes | Human-readable description |
| `evidence_refs` | array[string] | Yes | Hash-linked evidence references |
| `resolution` | object | Yes | How it was resolved |
| `learning` | object | No | Learning signals for V2 system |

### 3.2 Trigger Sources

| Value | Description | Source |
|-------|-------------|--------|
| `HUMAN_GATE` | Irreversible action requires owner approval (HG-01..HG-07) | ADR-052 §3.1 |
| `AUTHORITY_ESCALATION` | L4 evaluation returns ESCALATE instead of ALLOW/DENY | ADR-052 §3.2 |
| `VERIFICATION_REJECTION` | Independent verification fails, requiring human resolution | ADR-052 §3.3 |
| `POLICY_AMBIGUITY` | Deterministic routing cannot resolve governance question | ADR-052 §3.4 |
| `CROSS_DOMAIN_CONFLICT` | Silent power acquisition detected, requires human adjudication | ADR-052 §3.5 |
| `FAILURE_RECOVERY` | Automated recovery exhausted, manual intervention required | ADR-052 §3.6 |

### 3.3 Severity Classification

| Level | Criteria |
|-------|----------|
| `LOW` | Resolved via OWNER_APPROVAL within SLA; no systemic impact |
| `MEDIUM` | Requires POLICY_CLARIFICATION or moderate delay |
| `HIGH` | Triggers AUTHORITY_ADJUSTMENT or cross-domain review |
| `CRITICAL` | Indicates systemic issue; requires ESCALATION to owner+architect |

### 3.4 Domain Classification

| Domain | Scope |
|--------|-------|
| `GRAPH_MUTATION` | Changes to project graph structure |
| `AUTHORITY` | Permission/envelope modifications |
| `DECISION` | Governance or policy decisions |
| `POOL` | Pool contribution/validation operations |
| `ENTITLEMENT` | Credit/entitlement adjustments |
| `CREDIT` | Monetization/rate-limit operations |

---

## 4. Measurement Dimensions

| Dimension | Source Field | Aggregation Method | Use Case |
|-----------|-------------|-------------------|----------|
| Frequency | Count of INTERVENTION events | Per time window (daily/weekly/monthly) | Trend analysis |
| Type distribution | `trigger_source` | Per category percentages | Friction point identification |
| Severity distribution | `severity` | Heatmap by severity × domain | Risk assessment |
| Resolution time | `resolution.duration_seconds` | P50/P95/Max histograms | SLA monitoring |
| Domain concentration | `domain` | Top-N domains by count | Focus area identification |
| Gate class frequency | `context.human_gate_class` | Per HG-01..HG-07 counts | Gate optimization |
| Improvement signal | `learning.improvement_proposal` | Boolean rate | V3 proposal generation |

---

## 5. Privacy and Scope Boundaries

### 5.1 What IS Measured

- Intervention occurrence (when, where, why)
- Resolution method and duration
- Pattern classification (for learning)
- Aggregate statistics (no PII)

### 5.2 What is NOT Measured

- Content of human deliberation
- Private project context beyond intervention trigger
- Owner identity beyond role (owner/DPT/evaluator)
- Biometric or behavioral data
- Cross-project correlation without explicit contribution pathway

### 5.3 Data Retention

| Data Class | Retention | Rationale |
|------------|-----------|-----------|
| Intervention event | Indefinite (audit trail) | Lineage requirement |
| Resolution details | Project lifetime + 7 years | Governance audit |
| Learning/pattern data | Anonymized aggregate | Statistical use only |
| Raw metrics | 90 days | Operational monitoring |

---

## 6. Audit Trail Integration

### 6.1 Appending Intervention Events

Intervention events are appended to the existing AUDIT_TRAIL with:

1. **Hash-chain linkage** to parent attempt/work order
2. **Signed by resolving actor** (owner/DPT/evaluator)
3. **Immutable once written** (append-only invariant)
4. **Queryable via event_type filter** (`event_type = "INTERVENTION"`)

### 6.2 Lineage Requirements

Every intervention event must maintain full lineage:

```
intervention_id → evidence_refs[] → attempt_id → work_order_id → task_id
```

The `evidence_refs` array contains hash-linked references to all supporting audit trail entries, ensuring that the intervention can be fully reconstructed from the audit trail alone.

### 6.3 Authority Stack Integration

| Layer | Intervention Relevance |
|-------|------------------------|
| L1 Policy | Defines which actions require Human Gate |
| L2 Delegation | Scope of owner authority vs. DPT authority |
| L3 Envelope | Interventions may modify envelope validity |
| L4 Evaluation | ESCALATE verdict triggers intervention |
| L5 Materialization | Intervention outcome determines permission state |

---

## 7. Open Decisions

| ID | Question | Options | Status | Dependency |
|----|----------|---------|--------|------------|
| OD-T5-001-A | Should intervention duration include deliberation time or only active resolution time? | Include both / Exclude deliberation | DEFERRED | Implementation decision |
| OD-T5-001-B | What is the minimum granularity for "improvement proposal" signal? | Per-intervention / Per-pattern / Per-domain | DEFERRED | Depends on T5-004 |
| OD-T5-001-C | How should cross-project pattern matching respect project sovereignty? | Anonymous aggregation / Explicit contribution opt-in / No cross-project learning | DEFERRED | Resolved by ADR-056 pseudonymization model |

---

## 8. Phase 4 Invariant Compliance

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
| Effect identity sufficient? | Yes, intervention_id enables full lineage | ✓ PASS |
| No silent cross-domain power? | Yes, intervention explicitly tracks domain transitions | ✓ PASS |

---

## 9. Deliverables

| # | Artifact | Path | Status |
|---|----------|------|--------|
| 1 | ADR-052 | `docs/adr/ADR-052.md` | ADMITTED |
| 2 | Schema | `docs/schemas/intervention-event.schema.json` | CREATED |
| 3 | Spec | `docs/v2/intervention-measurement-spec.md` | CREATED |
| 4 | Open Decisions | `docs/DPT_OPEN_DECISIONS.md` (OD-T5-001-A/B/C) | PENDING UPDATE |

---

## 10. Next Steps

1. ✅ Architecture design complete (T5-001)
2. ✅ ADR-052 admitted (Phase 5)
3. ✅ Schema definition created
4. ✅ Specification document created
5. ⏳ Implement intervention event projection in runtime
6. ⏳ Add measurement queries to analytics layer
7. ⏳ Integrate with T5-004 (improvement proposals) and T5-005 (cross-project patterns)

---

**Status:** Specification complete. Ready for implementation.
