# Phase 4 Architecture Simplification Review

**Date:** 2026-09-06  
**Status:** Review Complete — No Canonical Mutation  
**Boundary:** Phase 4 architecture-discussion boundary  

---

## Executive Summary

Systematic adversarial review of 3853-line DPT architecture identified **10 high-value simplification candidates**, **5 items that appear redundant but are structurally necessary**, and opportunities for approximately **15-25% documentation compression** through shared primitive consolidation.

Key finding: The architecture contains significant semantic duplication across cross-domain inequality assertions (11 instances, 7 duplicated) that could be consolidated into 3-4 shared primitives without losing precision.

---

## TOP 10 HIGHEST-VALUE SIMPLIFICATIONS

### 1. CROSS-DOMAIN INVARIANT CONSOLIDATION

**ID:** S-401  
**Current Form:** 11 separate inequality assertions scattered across 9 ADRs (GRAPH_REMOVAL ≠ AUTHORITY_REVOCATION, DECISION_SUPERSESSION ≠ EXECUTION_CANCELLATION, POOL_REMOVAL ≠ AUTHORITY_REVOCATION, etc.)  
**Proposed Simplification:** Define `CROSS_DOMAIN_EFFECT_RULE` as a single top-level invariant: "A transition in domain A cannot directly produce semantic power owned by domain B." Add explicit mapping table: domain pair → governing ADR.  
**What is Removed:** 7 duplicated inequality statements from individual ADR Falsifications sections  
**What Remains:** All original semantics preserved in unified rule + mapping table  
**Invariants Preserved:** All 11 specific inequalities become derived instances of the single rule  
**Risk:** Low — rule is already implicit in Cross-Cutting Invariant from Phase 2  
**Evidence:** 7 of 11 inequalities are exact duplicates (same text, different ADRs); 4 are variants requiring explicit listing  
**Classification:** SEMANTIC_MERGE_CANDIDATE  

---

### 2. BLOCKED/SUSPENDED STATE MERGER

**ID:** S-402  
**Current Form:** Two distinct states `BLOCKED` and `SUSPENDED` used interchangeably in ADR-030, ADR-032, ADR-045, ADR-046  
**Proposed Simplification:** Consolidate to single `SUSPENDED` state with cause enumeration (`QUEUE_EXHAUSTED`, `RESOURCE_DENIED`, `CRITICAL_INVARIANT_FAILED`). Keep `BLOCKED` as legacy alias only.  
**What is Removed:** State naming ambiguity; dual-transition paths  
**What Remains:** All failure semantics preserved via cause field  
**Invariants Preserved:** Fail-closed behavior unchanged; reversibility unchanged  
**Risk:** Medium — requires careful migration path documentation  
**Evidence:** Same contextual usage patterns in 4 ADRs; both map to identical operational behavior  
**Classification:** STRUCTURAL_SIMPLIFICATION_CANDIDATE  

---

### 3. VERIFICATION_BASIS GENERALIZATION

**ID:** S-403  
**Current Form:** Verification scope rules scattered across ADR-035 (P2-003), ADR-036 (F-304), ADR-040 (F-307)  
**Proposed Simplification:** Elevate `VERIFICATION_BASIS` to top-level primitive defined once, referenced everywhere. Current form: 3 separate definitions of artifact/effect identity + evidence set + assumptions.  
**What is Removed:** 2/3 redundant definitions  
**What Remains:** Single canonical definition with cross-references  
**Invariants Preserved:** All six dimensions retained (artifact identity, scope, evidence set, assumptions, independence, policy/risk basis)  
**Risk:** Low — Phase 3 already established dimensional framework  
**Evidence:** F-304 explicitly defines VERIFICATION_BASIS; ADR-035 and ADR-040 contain overlapping scoping rules  
**Classification:** SEMANTIC_MERGE_CANDIDATE  

---

### 4. EFFECT_RECOVERY_CONTRACT ELEVATION

**ID:** S-404  
**Current Form:** Effect recovery semantics split between ADR-040 (idempotency focus), ADR-036 (retry/cancellation focus), ADR-030 (Front Agent recovery)  
**Proposed Simplification:** Define `EFFECT_RECOVERY_CONTRACT` as canonical four-class model (idempotent/replay-safe, reversible, compensatable, irreversible/non-compensatable) in dedicated subsection; reference from all three ADRs.  
**What is Removed:** Redundant recovery behavior descriptions  
**What Remains:** Complete semantics in single location  
**Invariants Preserved:** All four classes retained; compensation explicitly not universal  
**Risk:** Low — contract is new in Phase 3, no prior canonical form to disrupt  
**Evidence:** F-302 established four-class model; currently duplicated across 3 ADRs  
**Classification:** SEMANTIC_MERGE_CANDIDATE  

---

### 5. AUTHORITY STACK LAYER DOCUMENTATION CONSOLIDATION

**ID:** S-405  
**Current Form:** Layer definitions repeated across ADR-033 (primary), ADR-036 (L3/L4 interaction), ADR-048 (offline sync), plus compatibility statements in 10 ADRs  
**Proposed Simplification:** Define layer properties (scope, persistence, owner, failure mode) once in canonical table. Compatibility statements collapse to single matrix.  
**What is Removed:** ~40 lines of repeated layer property descriptions  
**What Remains:** All distinctions preserved via table lookup  
**Invariants Preserved:** Five-layer stack intact; each layer's operational distinction maintained  
**Risk:** Low — layers are operationally distinct per analysis  
**Evidence:** L1-L5 analysis shows all five have unique persistence/owner/failure-mode combinations  
**Classification:** SAFE_SIMPLIFICATION  

---

### 6. FRESHNESS/STALENESS TERMINOLOGY UNIFICATION

**ID:** S-406  
**Current Form:** `freshness`, `validity`, `expiry`, `expiration`, `staleness`, `stale` used inconsistently across ADR-010, ADR-030, ADR-033, ADR-046  
**Proposed Simplification:** Canonical term: `EVIDENCE_FRESHNESS` with states CURRENT/SUSPECT/STALE/UNKNOWN. Eliminate `validity`, `expiry`, `expiration` as synonyms.  
**What is Removed:** Terminology ambiguity; 6-term synonym cluster  
**What Remains:** All semantic coverage via 4-state model  
**Invariants Preserved:** NO_TRIGGER_OBSERVED ≠ EVIDENCE_CURRENT retained  
**Risk:** Medium — terminology change requires migration notes  
**Evidence:** 17 freshness + 20 stale + 12 expiry + 6 expiration references indicate confusion  
**Classification:** STRUCTURAL_SIMPLIFICATION_CANDIDATE  

---

### 7. COMPATIBILITY STATEMENT ELIMINATION

**ID:** S-407  
**Current Form:** 10 separate "Compatible with ADR-XXX" blocks at end of each ADR  
**Proposed Simplification:** Single compatibility matrix in appendix. Each ADR retains only "See Appendix C for full compatibility matrix."  
**What is Removed:** ~30 lines of repetitive compatibility statements  
**What Remains:** All compatibility information preserved in matrix  
**Invariants Preserved:** No semantic change; purely documentary  
**Risk:** None — this is documentation-only simplification  
**Evidence:** All 10 statements follow identical format with minor variation  
**Classification:** SAFE_SIMPLIFICATION  

---

### 8. REVISION/REOPEN/RE-EVALUATE CONSOLIDATION

**ID:** S-408  
**Current Form:** Three separate concepts for authority/decision re-examination: `REVOCATION`, `RE-EVALUATION`, `DECISION_REOPEN` scattered across ADR-036, ADR-043  
**Proposed Simplification:** Single `RE-EVALUATION` primitive with cause enumeration: authority_invalidation, decision_falsified, new_evidence. Map existing usages.  
**What is Removed:** Conceptual overlap between revocation-triggered and evidence-triggered re-evaluation  
**What Remains:** All triggers preserved as causes under single primitive  
**Invariants Preserved:** Precedence chain REVOCATION > CANCELLATION > RETRY maintained  
**Risk:** High — requires careful mapping of all existing transitions  
**Evidence:** ADR-036 precedent chain shows these are operationally distinct but semantically overlapping  
**Classification:** NEEDS_MORE_EVIDENCE  

---

### 9. LEASE/RESOURCE_CLAIM SEMANTIC CLARIFICATION

**ID:** S-409  
**Current Form:** Lease (87 refs) and Resource Claim (9 refs) treated as related but distinct concepts in ADR-034  
**Proposed Simplification:** Explicitly define Resource Claim as higher-level intent, Lease as implementation mechanism. Add unified state transition table.  
**What is Removed:** Implicit relationship requiring inference  
**What Remains:** Both entities preserved with explicit hierarchy  
**Invariants Preserved:** Lease fencing tokens still required; resource compatibility rules unchanged  
**Risk:** Low — clarifies rather than changes  
**Evidence:** Lease text references "resource claim" 3 times; relationship is implicit  
**Classification:** SAFE_SIMPLIFICATION  

---

### 10. DECISION SUPERSESSION IMPACT EVALUATION CONSOLIDATION

**ID:** S-410  
**Current Form:** Impact evaluation rules in ADR-043 (F-303) and verification basis in ADR-035/F-304 are partially overlapping (both check "basis validity")  
**Proposed Simplification:** Unified `BASIS_VALIDATION_RULE`: "Execution may proceed only when all relevant canonical bases remain materially unchanged." Reference from both decision and verification contexts.  
**What is Removed:** Overlapping basis-checking requirements  
**What Remains:** Decision and verification paths both covered  
**Invariants Preserved:** DECISION_SUPERSESSION ≠ EXECUTION_CANCELLATION maintained  
**Risk:** Medium — must ensure both domains retain their specific validation requirements  
**Evidence:** F-303 lists 6 basis types; F-304 lists 6 verification dimensions; significant overlap  
**Classification:** SEMANTIC_MERGE_CANDIDATE  

---

## TOP 5 THINGS THAT LOOK REDUNDANT BUT MUST NOT BE COLLAPSED

### 1. REVOCATION vs CANCELLATION Distinction

**Why it looks redundant:** Both terminate execution; both appear in same ADRs (036, 037, 040, 043).  
**Why they must stay separate:** Precedence chain `REVOCATION > CANCELLATION > RETRY` is foundational. Revocation invalidates authority basis; cancellation stops work under valid authority. Different failure modes, different audit trails.  
**Runtime evidence:** ADR-036 explicitly models revocation during active ATTEMPT vs post-failure revocation. Collapsing would lose this distinction.  
**Classification:** KEEP_AS_IS  

---

### 2. Five-Layer Authority Stack

**Why it looks reducible:** Layers 2-5 all relate to "who can do what"; L3 (envelope) and L4 (runtime) could merge conceptually.  
**Why they must stay separate:** Different persistence (L1/L3 durable, L4/L5 transient), different owners (L1 policy owner, L2 delegator, L4 runtime), different failure modes (L3 corruption vs L4 cache staleness). L5 has zero persistence; L3 has full persistence.  
**Runtime evidence:** ADR-048 offline sync requires L3 reconciliation; L5 never persists. These are operationally indistinguishable only if you ignore the persistence dimension.  
**Classification:** KEEP_AS_IS  

---

### 3. Verification Independence Requirement

**Why it looks redundant:** ADR-035 independence requirement seems like over-engineering for simple verification.  
**Why it must stay:** Self-verification is a known failure mode in adversarial contexts. Independent verifier prevents audit tampering and conflicts of interest. This is not performance optimization; it's security guarantee.  
**Runtime evidence:** P2-003 falsification specifically tests self-verification failure.  
**Classification:** KEEP_AS_IS  

---

### 4. Human Gate Mandatory Placements

**Why it looks like ceremony bloat:** Two mandatory Human Gate placements seem excessive for "ordinary authorized work."  
**Why they must stay:** BLUEPRINT_PROPOSED (ADR-045) and compliance/safety decisions (ADR-043) involve irreversible or high-blast-radius actions. Removing gates would violate constitutional principle of owner control.  
**Runtime evidence:** F-001 established that advisory ≠ execution; Human Gate is the boundary.  
**Classification:** KEEP_AS_IS  

---

### 5. Cross-Domain Inequality Assertions

**Why they look like repetition:** 11 inequality statements seem like redundant documentation of the same principle.  
**Why they must stay (as a set):** Each asserts a specific domain boundary that could be silently violated. The explicit listing prevents "reasonable person" interpretation errors. Consolidation to single rule is acceptable (see S-401), but removal of specific instances is dangerous.  
**Runtime evidence:** Phase 1-3 failures all involved silent cross-domain power acquisition.  
**Classification:** KEEP_AS_IS (but consolidate per S-401)  

---

## ESTIMATED REDUCTION METRICS

| Metric | Current | Proposed | Reduction |
|--------|---------|----------|-----------|
| Canonical entities | 17 tracked | 14 (merge 3) | -16% |
| Lifecycle states | ~45 distinct | ~38 (merge BLOCKED/SUSPENDED) | -16% |
| Mandatory records | 11 types | 9 (eliminate 2 redundant) | -18% |
| Ordinary-task transitions | 12 points | 10 (consolidate 2) | -17% |
| Documentation duplication | ~350 lines | ~200 lines | -43% |
| Total document size | 3853 lines | ~3400 lines | -12% |

**Conservative estimate:** 400-500 lines removable via:
- Compatibility matrix consolidation: -30 lines
- Verification basis unification: -50 lines
- Effect recovery contract consolidation: -40 lines
- Freshness terminology unification: -30 lines
- Cross-domain invariant consolidation: -80 lines
- Lease/Resource Claim clarification: -20 lines
- Ancillary deduplication: -150 lines

---

## PROPOSED MINIMAL DPT CORE

The smallest set of primitives required to preserve all proven guarantees:

### Foundational Primitives (Non-Negotiable)
1. **CROSS_DOMAIN_EFFECT_RULE** — Single invariant replacing 11 inequality assertions
2. **AUTHORITY_STACK** — Five-layer model with explicit persistence/owner/failure-mode properties
3. **LIFECYCLE_PRECEDENCE** — REVOCATION > CANCELLATION > RETRY chain
4. **HUMAN_GATE_BOUNDARY** — Mandatory gate at blueprint acceptance and irreversible decisions
5. **VERIFICATION_INDEPENDENCE** — Self-verification prohibited; independent reviewer required

### Operational Primitives
6. **VERIFICATION_BASIS** — Six-dimensional tuple (artifact identity, scope, evidence, assumptions, independence, policy/risk)
7. **EFFECT_RECOVERY_CONTRACT** — Four-class model (idempotent, reversible, compensatable, irreversible)
8. **BASIS_VALIDATION_RULE** — Execution proceeds only when canonical bases remain materially unchanged
9. **EVIDENCE_FRESHNESS** — Four-state model (CURRENT, SUSPENDED, STALE, UNKNOWN) with NO_TRIGGER ≠ EVIDENCE_CURRENT
10. **RESOURCE_CONCURRENCY_COMPATIBILITY** — Semantic per-resource/access-mode compatibility (separate from AUTHORITY_CAPABILITY)

### Entity Primitives (Minimal Set)
11. **Attempt** — Bounded execution unit with effect identity
12. **Verification Record** — Linked to verification basis, not just artifact hash
13. **Permission Envelope** — Materialized authority at L4
14. **Resource Claim** — Higher-level intent (merged from lease semantics)
15. **Decision** — Resolution with supersession tracking

### Removed/Consolidated
- ~~Task Record~~ → subsumed by Attempt
- ~~Task Passport~~ → subsumed by Permission Envelope
- ~~Handoff~~ → subsumed by Result semantics
- ~~Delta~~ → implementation detail, not architectural primitive
- ~~Freshness Evidence~~ → subsumed by Evidence Freshness primitive

---

## COMPLEXITY BUDGET RECOMMENDATION

For future ADRs, enforce the following complexity budget:

### Quantity Limits
- Maximum 1 new canonical entity per ADR
- Maximum 3 new lifecycle states per ADR
- Maximum 1 new mandatory ceremony point per ADR
- Maximum 500 lines added per ADR

### Qualitative Gates
- **Duplicate Test:** New concept must not duplicate existing primitive without demonstrating orthogonal dimension
- **Necessity Test:** New entity/state/ceremony must have at least one runtime failure mode that would occur without it
- **Simplicity Test:** If concept can be expressed as variation of existing primitive + parameter, must use variation, not new primitive
- **Traceability Test:** Every new primitive must map to at least one explicit inequality or invariant it preserves

### Documentation Requirements
- New ADR must explicitly state which existing primitive it extends vs. which it introduces
- Compatibility statement replaced by single-line reference to appendix matrix
- Falsification table limited to 5 rows maximum (additional tests go to validation doc)

---

## FINDING CLASSIFICATIONS SUMMARY

| ID | Candidate | Classification | Risk |
|----|-----------|----------------|------|
| S-401 | Cross-domain invariant consolidation | SEMANTIC_MERGE_CANDIDATE | Low |
| S-402 | BLOCKED/SUSPENDED merger | STRUCTURAL_SIMPLIFICATION_CANDIDATE | Medium |
| S-403 | Verification Basis generalization | SEMANTIC_MERGE_CANDIDATE | Low |
| S-404 | Effect Recovery Contract elevation | SEMANTIC_MERGE_CANDIDATE | Low |
| S-405 | Authority stack documentation consolidation | SAFE_SIMPLIFICATION | Low |
| S-406 | Freshness terminology unification | STRUCTURAL_SIMPLIFICATION_CANDIDATE | Medium |
| S-407 | Compatibility statement elimination | SAFE_SIMPLIFICATION | None |
| S-408 | Revision/Reopen/Re-evaluate consolidation | NEEDS_MORE_EVIDENCE | High |
| S-409 | Lease/Resource Claim clarification | SAFE_SIMPLIFICATION | Low |
| S-410 | Basis validation consolidation | SEMANTIC_MERGE_CANDIDATE | Medium |

**Proceed with:** S-401, S-403, S-404, S-405, S-407, S-409 (low risk, high value)  
**Proceed with caution:** S-402, S-406, S-410 (medium risk, requires migration planning)  
**Defer:** S-408 (high risk, needs more runtime evidence)  

---

## PHASE BOUNDARY

Phase 4 architecture simplification review complete. No canonical mutation applied. Findings preserved for Phase 5 consideration.
