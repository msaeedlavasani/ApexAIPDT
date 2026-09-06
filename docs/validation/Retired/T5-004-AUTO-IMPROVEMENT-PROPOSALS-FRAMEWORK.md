# T5-004 — Auto-Improvement Proposal Framework

**Task ID:** T5-004  
**Parent Phase:** Phase 5 (V2 Learning System Architecture)  
**Status:** RUNNING  
**Date:** 2026-09-06  
**Dependencies:** T5-001 (Intervention Measurement), T5-002 (Token Efficiency), T5-003 (Failure Pattern Detection) — all COMPLETE  

---

## OBJECTIVE

Define the architectural model for automatic improvement proposal generation based on intervention, token, and failure data. Proposals require human review only when existing governance/Human Gate policy requires it; proposal creation does not manufacture Human Gate (PROPOSAL ≠ HUMAN_GATE).

---

## PROBLEM SPACE

### The Learning Loop Gap

V1 Runtime established execution capabilities. V2 Learning System must close the loop:

```
[Execute] → [Measure] → [Detect Patterns] → [Generate Proposals] → [Review] → [Apply] → [Re-measure]
    ↑                                                                        ↓
    └────────────────────────────────────────────────────────────────────────┘
```

Current V1 has Execute + Measure + Detect. V2 must add Generate Proposals + Review + Apply.

### Why Proposals (Not Direct Action)?

Per ADR-018 (Two-Plane Separation):
- DPT is advisory, not an implementation engine
- Changes require explicit governance authorization
- Autonomous modification would violate authority boundaries
- Human review preserves constitutional oversight

---

## CANDIDATE DESIGNS

### Design A: Rule-Based Proposal Generator

**Model:** Explicit rules map observed patterns to proposed improvements.

**Pros:**
- Transparent, explainable logic
- No ML dependency
- Deterministic outcomes
- Easy to audit

**Cons:**
- Requires exhaustive pattern-to-proposal mapping
- Cannot handle novel situations
- Maintenance burden grows with rule count

### Design B: ML-Assisted Proposal Generation

**Model:** Trained model suggests improvements based on historical success/failure data.

**Pros:**
- Can discover non-obvious improvement opportunities
- Adapts to changing project characteristics
- Handles novel situations

**Cons:**
- Black box (violates transparency requirement)
- Requires training data (not yet available in V2)
- Risk of generating inappropriate proposals
- Hard to validate against Phase 4 invariants

### Design C: Structured Template System (Selected)

**Model:** Template-based proposal generation with pattern-driven instantiation. Each proposal follows canonical schema with required fields. Human review validates completeness and appropriateness.

**Pros:**
- Transparent, structured output
- No ML dependency (deterministic)
- Ensures all proposals have required evidence
- Aligns with DPT's advisory nature
- Audit trail captures full proposal lineage

**Cons:**
- Limited to known proposal types
- Template maintenance required
- May miss unconventional improvements

---

## ARCHITECTURAL DECISION

**Selected: Design C — Structured Template System**

**Rationale:**
1. Phase 4 established DPT as advisory, not implementation engine (ADR-018)
2. Proposals are advisory; human review only when existing governance/Human Gate policy requires it (PROPOSAL ≠ HUMAN_GATE)
3. Structured format enables consistent evidence requirements
4. Deterministic generation avoids black-box concerns
5. Template system can evolve as new improvement types are discovered

**Invariant Preserved:**
```
Proposal = Pattern Observation + Template Instantiation + Evidence Collection + Independent Verification per Governance Policy (human review only when existing Human Gate / governance requires it; PROPOSAL ≠ HUMAN_GATE)
No proposal auto-applies without explicit human approval
All proposals maintain full lineage to source observations
```

---

## PROPOSAL TAXONOMY

### Proposal Classes

| Class | Source Pattern | Example Proposal | Review Priority |
|-------|---------------|------------------|-----------------|
| CONFIGURATION | Token efficiency, retry failures | Adjust timeout, increase retry budget | LOW |
| POLICY | Authority denials, Human Gate triggers | Revise authority ceiling, adjust gate triggers | MEDIUM |
| PROCESS | Verification failures, integration conflicts | Update documentation, improve review process | MEDIUM |
| ARCHITECTURAL | Recurring resource contention, cross-domain conflicts | Change routing, add caching, modify lifecycle | HIGH |
| GOVERNANCE | Policy ambiguity, governance gaps | Add new policy, clarify existing policy | CRITICAL |

### Proposal Schema

```json
{
  "proposal_id": "UUIDv7",
  "proposal_class": "CONFIGURATION | POLICY | PROCESS | ARCHITECTURAL | GOVERNANCE",
  "source_patterns": ["pattern_id", ...],
  "source_observations": ["event_hash", ...],
  "title": "string",
  "description": "string",
  "proposed_change": {
    "target": "TASK | WORK_ORDER | ATTEMPT | AUTHORITY_ENVELOPE | VERIFICATION_RECORD | DECISION | POLICY | LIFECYCLE",
    "change_type": "CREATE | UPDATE | DELETE | CONFIGURE",
    "specification": {}
  },
  "evidence": {
    "frequency": int,
    "severity_impact": "LOW | MEDIUM | HIGH | CRITICAL",
    "affected_projects": int,
    "estimated_benefit": "string"
  },
  "risks": ["string", ...],
  "rollback_plan": "string",
  "status": "DRAFT | UNDER_REVIEW | APPROVED | REJECTED | APPLIED | ROLLED_BACK",
  "reviewer": "string|null",
  "review_notes": "string|null",
  "applied_at": "ISO8601|null",
  "applied_by": "string|null",
  "outcome_measurement": {
    "success": boolean,
    "metrics_before": {},
    "metrics_after": {},
    "measured_at": "ISO8601|null"
  }
}
```

---

## GENERATION PIPELINE

### Stage 1: Pattern Ingestion

**Input:** Adopted patterns from T5-003 (Failure Pattern Detection)  
**Process:** Match patterns to proposal classes  
**Output:** Candidate proposal types  

```
ADOPTED_PATTERN → PATTERN_CLASS_MAPPER → CANDIDATE_PROPOSAL_TYPE
```

### Stage 2: Evidence Collection

**Input:** Candidate proposal type + source pattern  
**Process:** Query AUDIT_TRAIL for relevant events  
**Output:** Evidence package  

```
CANDIDATE_PROPOSAL_TYPE + PATTERN_ID → EVIDENCE_COLLECTOR → EVIDENCE_PACKAGE
```

### Stage 3: Template Instantiation

**Input:** Proposal class + Evidence package  
**Process:** Populate canonical proposal schema  
**Output:** Draft proposal  

```
PROPOSAL_CLASS + EVIDENCE_PACKAGE → TEMPLATE_INSTANTIATOR → DRAFT_PROPOSAL
```

### Stage 4: Review Queue Entry

**Input:** Draft proposal  
**Process:** Create review task, notify appropriate reviewer  
**Output:** Proposal status = UNDER_REVIEW  

```
DRAFT_PROPOSAL → REVIEW_QUEUE → UNDER_REVIEW
```

---

## HUMAN REVIEW INTEGRATION

### Reviewer Assignment

Per ADR-035 (Verification Independence):
- Reviewer must satisfy INDEPENDENCE_CONTRACT relative to proposal source
- Configuration proposals: Any reviewer (low risk)
- Policy/Architectural proposals: Independent reviewer required
- Governance proposals: Owner or designated authority required

### Review Decision Matrix

| Proposal Class | Reviewer Type | Decision Options | Approval Threshold |
|----------------|---------------|------------------|-------------------|
| CONFIGURATION | Any qualified reviewer | APPROVE | Single reviewer |
| POLICY | Independent reviewer | APPROVE / REJECT / MODIFY | Single reviewer |
| PROCESS | Independent reviewer | APPROVE / REJECT / MODIFY | Single reviewer |
| ARCHITECTURAL | Owner or delegate | APPROVE / REJECT / MODIFY | Single reviewer + audit |
| GOVERNANCE | Owner only | APPROVE / REJECT | Owner decision |

### Review Outcomes

```
UNDER_REVIEW → APPROVED → APPLY → MEASURE_OUTCOME
              → REJECTED → DOCUMENT_RATIONALE → CLOSE
              → MODIFY → REVISE → RE-SUBMIT
```

---

## APPLICATION SAFETY

### Pre-Application Checks

Before any proposal application:
1. **Authority verification:** Proposer has authority to make change
2. **Impact assessment:** Change scope within authorized bounds
3. **Rollback plan:** Valid rollback procedure documented
4. **Lineage capture:** Full proposal→application chain recorded

### Application Methods

| Change Type | Application Method | Audit Requirement |
|-------------|-------------------|-------------------|
| CONFIGURATION | Direct update | Delta record with provenance |
| POLICY | Policy update + revalidation | Full ADR update + sign-off |
| PROCESS | Documentation update | Delta record with context |
| ARCHITECTURAL | Spec update + review | ADR update + Human Gate if irreversible |
| GOVERNANCE | Constitutional update | Owner decision + Human Gate |

### Rollback Protocol

All applications include rollback capability:
- **Automatic rollback:** For CONFIGURATION changes (reversible)
- **Manual rollback:** For POLICY/ARCHITECTURAL changes (requires review)
- **No rollback:** For GOVERNANCE changes (owner decision final)

---

## INTEGRATION WITH EXISTING MODEL

### Authority Stack Integration

| Layer | Proposal Relevance |
|-------|-------------------|
| L1 Policy | GOVERNANCE proposals may update policy |
| L2 Delegation | POLICY proposals may adjust delegation scope |
| L3 Envelope | CONFIGURATION proposals may adjust envelope validity |
| L4 Evaluation | ARCHITECTURAL proposals may change evaluation logic |
| L5 Materialization | CONFIGURATION proposals may adjust materialization parameters |

### Retry/Cancellation/Revocation Integration

Per ADR-036:
- Proposals may address RETRY patterns (adjust retry budget)
- Proposals may address CANCELLATION patterns (improve graceful shutdown)
- Proposals must NEVER address REVOCATION patterns autonomously (security boundary)

### Verification Integration

Per ADR-035:
- Proposal review satisfies independent verification requirement
- Applied proposals generate new verification records
- Outcome measurement requires independent re-verification

---

## OPEN DECISIONS

| # | Question | Options | Status |
|---|----------|---------|--------|
| OD-T5-004-A | Should proposals include estimated ROI? | Required field / Optional field / None | DEFERRED |
| OD-T5-004-B | What is the maximum proposal age before auto-expiry? | 30 days / 60 days / 90 days / Never | DEFERRED |
| OD-T5-004-C | How should we handle conflicting proposals? | First-come-first-served / Impact-based priority / Manual resolution | DEFERRED |

---

## PHASE 4 INVARIANT COMPLIANCE

| Constraint | Check | Result |
|------------|-------|--------|
| New Human Gate? | None introduced (uses existing review workflows) | ✓ PASS |
| New Agent type? | None introduced (uses existing REVIEWER_ROLE) | ✓ PASS |
| New authority layer? | None introduced | ✓ PASS |
| New lifecycle state? | None introduced (proposal status is meta-state) | ✓ PASS |
| Embeds execution context into authority? | No, proposals are advisory until approved | ✓ PASS |
| Preserves five-layer stack? | Yes, integrates at each layer appropriately | ✓ PASS |
| Respects Project Intelligence ownership? | Yes, proposals are DPT-side recommendations | ✓ PASS |
| Maintains independent verification? | Yes, independent verification per existing governance policy (PROPOSAL ≠ HUMAN_GATE) | ✓ PASS |
| Effect identity sufficient? | Yes, proposal_id enables full lineage | ✓ PASS |
| No silent cross-domain power? | Yes, proposals explicit and auditable | ✓ PASS |
| Advisory vs execution separation? | Yes, proposals never auto-apply | ✓ PASS |

---

## DELIVERABLES

1. **ADR Document:** This document → `docs/adr/ADR-055-auto-improvement-proposals.md`
2. **Proposal Schema:** `docs/schemas/proposal.schema.json`
3. **Pipeline Specification:** `docs/v2/proposal-pipeline-spec.md`
4. **Open Decisions Log:** Updated `docs/DPT_OPEN_DECISIONS.md` entries OD-T5-004-A/B/C

---

## NEXT STEPS

1. Write ADR-055 incorporating this design
2. Define proposal schema
3. Complete T5-004 integration with T5-001/002/003
4. Proceed to T5-005 (Cross-Project Pattern Extraction — depends on T5-004)

---

**Status:** Architecture design complete. Ready for ADR formalization.
