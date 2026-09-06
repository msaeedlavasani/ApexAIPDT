# Phase 1 Adversarial Review — Admission Summary

**Date:** 2026-09-06
**Status:** Applied clarifications only. No structural revisions.
**Lineage preserved:** All original ADR text retained; clarifications added as subsections.

---

## Applied Clarifications

### F-001 — Authority Layers (ADR-033)
**Action:** Terminology clarification added to ADR-033, Section "Layer Distinction Clarification (F-001 Admitted)"

**What was added:**
- Explicit definition of L4 vs L5 semantic purposes
- Property comparison table (definition, owner, semantics, failure mode, audit record, revocation impact)
- Visual diagram showing two computation sites within five-layer stack
- Preservation statement for fail-closed ordering

**What was NOT changed:**
- Five-layer architecture retained
- Layer definitions unchanged
- Audit records remain distinct
- Revocation propagation rules unchanged

**Cross-ADR consistency:** Verified compatible with ADR-034 (leases project from L4), ADR-036 (revocation cascades through L4→L5), ADR-031 (Gateway validates envelope).

---

### F-002 — Graph Mutation × Revocation (ADR-037)
**Action:** Precedence clarification added to ADR-037, Section "Precedence: Graph Mutation vs. Authority Revocation (F-002 Admitted)"

**What was added:**
- Canonical precedence rule table (GRAPH_REMOVAL vs AUTHORITY_REVOCATION vs CANCELLATION)
- Formal precedence sequence: REVOCATION > CANCELLATION > GRAPH_REMOVAL
- Key distinction table (scope, effect on running work, precedence)
- Explanation that graph removal preserves running tasks unless revocation issued

**What was NOT changed:**
- ADR-037 core mutation rules unchanged
- ADR-036 revocation semantics unchanged
- "Remove_task (executed/RUNNING) PROHIBITED" rule unchanged

**Cross-ADR consistency:** Verified compatible with ADR-036 (precedence hierarchy), ADR-034 (lease invalidation on revocation).

---

### F-003 — Project Intelligence Freshness (ADR-010)
**Action:** Freshness semantics added to ADR-010, Section "Freshness Semantics (F-003 Admitted)"

**What was added:**
- Four-state freshness machine: CURRENT / SUSPECT / STALE / UNKNOWN
- Required freshness fields per intelligence item (evidence_identity, source_reference, source_revision, verified_against_revision, verification_time, confidence, freshness_state, evidence_type)
- Evidence-type-specific expiration policy structure (configurable, no fixed TTLs canonically)
- Refresh trigger semantics mapping states to actions
- Freshness evaluation function (elapsed time, NOT latency)
- Explicit statement: "Absence of trigger does NOT prove CURRENT state"

**What was NOT changed:**
- ADR-009 model unchanged
- ADR-046 trigger mechanics unchanged
- Scout/Analyst separation unchanged

**Cross-ADR consistency:** Verified compatible with ADR-046 (trigger lifecycle), ADR-029 (SERVICE vs ROLE refresh classification).

---

### F-004 — Determinism Routing (ADR-029)
**Action:** Formal criterion added to ADR-029, Section "Determinism Routing Criterion (F-004 Admitted)"

**What was added:**
- Formal deterministic criterion: same normalized input + same policy version + same state snapshot → same canonical decision
- Mathematical formulation with normalize() and evaluate() functions
- Three key properties: reproducibility, canonical form comparison, no semantic judgment residue
- Explicit statement: "Determinism does NOT require an execution outcome"
- Operational test procedure (idempotence check with canonical form comparison)
- Clarification that ESCALATE_TO_ROLE is a valid deterministic outcome

**What was NOT changed:**
- ADR-029 ontology unchanged (AGENT_DEFINITION, AGENT_INSTANCE, SERVICE_INSTANCE retained)
- Determinism routing rule text unchanged
- Role-fulfillment change-over-time principle unchanged

**Cross-ADR consistency:** Verified compatible with ADR-033 (evaluator is SERVICE), ADR-031 (Gateway is SERVICE).

---

### F-005 — Enrollment/Provisioning (ADR-030)
**Action:** Enrollment sequence added to ADR-030, Section "Enrollment/Provisioning Sequence (F-005 Admitted)"

**What was added:**
- Six-step enrollment flow: ENROLLMENT → IDENTITY_ESTABLISHMENT → FRONT_BINDING → TRUST_BINDING → GATEWAY_ADMISSION → ONLINE
- Step details table with key ownership semantics
- Three key design principles:
  1. Reusable Front AGENT_DEFINITION by default (not per-project definition)
  2. Separate identity issuance (DPT) from private-key ownership (project)
  3. Bounded semantic capabilities from Envelope (no coarse READ/WRITE/ADMIN)
- Updated State Ownership Contract reflecting project-held private keys

**What was NOT changed:**
- ADR-030 lifecycle states unchanged
- ADR-006/007/008 trust boundary rules unchanged
- Multi-instance rule unchanged

**Cross-ADR consistency:** Verified compatible with ADR-031 (Gateway admission derives capabilities from Envelope), ADR-033 (LAYER 2/3 materialization), ADR-007 (direct access prohibited).

---

### Two-Plane Separation (ADR-018)
**Action:** Greenfield transition semantics added to ADR-018, Section "Greenfield Transition Semantics"

**What was added:**
- Transition protocol diagram: Advice → Owner Decision → Authority Grant → Execution
- Invariant: "Causal influence from advice is not execution authority"
- Explanation that greenfield is pre-execution phase, not collapsed plane
- Advisory Plane activities during greenfield (no execution, no authority)
- Execution Control Plane activation requirements (owner acceptance + LAYER 2 delegation)

**What was NOT changed:**
- Two-plane architecture retained
- ADR-001 advisory-only stance preserved
- ADR-044 greenfield flow unchanged

**Cross-ADR consistency:** Verified compatible with ADR-044 (greenfield pipeline), ADR-019 (authority is owner-controlled).

---

## Lineage Verification

| ADR | Original Status | Change Type | Lineage Preserved? |
|-----|----------------|-------------|-------------------|
| ADR-018 | Accepted | Addendum (greenfield transition) | ✓ |
| ADR-029 | Accepted | Addendum (determinism criterion) | ✓ |
| ADR-030 | Accepted | Addendum (enrollment sequence) | ✓ |
| ADR-033 | Accepted | Addendum (layer distinction) | ✓ |
| ADR-037 | Accepted | Addendum (precedence clarification) | ✓ |
| ADR-010 | Accepted direction | Addendum (freshness semantics) | ✓ |

**No ADRs were superseded.**
**No ADRs were structurally revised.**
**All clarifications are additive subsections.**

---

## Cross-ADR Consistency Check

| Relationship | Consistent? | Notes |
|--------------|-------------|-------|
| ADR-033 L4/L5 ↔ ADR-034 leases | ✓ | Leases project from L4; L4 denial prevents lease acquisition |
| ADR-033 L4/L5 ↔ ADR-036 revocation | ✓ | Revocation invalidates L4; L5 never derived |
| ADR-037 precedence ↔ ADR-036 | ✓ | REVOCATION > CANCELLATION > GRAPH_REMOVAL explicit |
| ADR-029 determinism ↔ ADR-033 evaluator | ✓ | Evaluator is SERVICE per determinism routing |
| ADR-030 enrollment ↔ ADR-031 Gateway | ✓ | Gateway admission derives capabilities from Envelope |
| ADR-010 freshness ↔ ADR-046 triggers | ✓ | SUSPECT→TARGETED, STALE→BROAD matches ADR-046 |
| ADR-018 greenfield ↔ ADR-044 | ✓ | Greenfield transition protocol matches ADR-044 pipeline |

---

## Document Statistics

| Metric | Value |
|--------|-------|
| Original line count | ~3111 |
| Final line count | 3349 |
| Lines added | ~238 |
| ADRs clarified | 6 |
| Structural changes | 0 |
| Superseded ADRs | 0 |

---

## Next Steps

Phase 1 adversarial review complete. All admitted clarifications applied.

**Standing at:** Phase 1 canonicalization boundary.

**Awaiting:** Architecture team confirmation before any further revision activity.

**No automatic revisions admitted.**
**No canonical state mutations beyond addenda.**
