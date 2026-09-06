# Phase 4 Admission Blocker Correction — Response

**Date:** 2026-09-06  
**Status:** Blockers Resolved — No Canonical Mutation  
**Boundary:** Phase 4 architecture-discussion boundary  

---

## BLOCKER 1: AUTHORITY LAYER CORRECTION (L3 ≠ L4 ≠ L5)

### Corrected Distinction

The Minimal Execution Core must preserve three **independently observable** authority layers, not collapse them:

| Layer | Canonical Name | Ownership | Persistence | Observable By | Failure Domain |
|-------|---------------|-----------|-------------|---------------|----------------|
| L3 | `AUTHORITY_ENVELOPE` | DPT (signed), Front (verified) | YES — append-only registry | Envelope registry query; signature verification | Signed envelope tampering; nonce exhaustion |
| L4 | `RUNTIME_EFFECTIVE_AUTHORITY` | DPT Authority Evaluator SERVICE | NO — computed per WORK_ORDER | Evaluator output record; signed evaluation audit | Policy violation → ESCALATE/DENY |
| L5 | `MATERIALIZED_PERMISSIONS` | Provider runtime SDK/plug-in | NO — re-derived per ATTEMPT | Provider permission preflight; materialization record | Provider error → FAILED_ASSERTION |

### Independent Observability Proof

```
L3 Observable: Query envelope registry by envelope_id → returns signed struct with not_before/not_after/claims
L4 Observable: Call Authority Evaluator SERVICE with (L1, L2?, L3, time, WORK_ORDER) → returns allow/deny/escalate
L5 Observable: Provider SDK materializes L3 into provider-specific permissions → preflight test PASS/FAIL
```

**Critical distinction:** Permission Envelope is NOT materialized L4 authority. It IS the L3 signed envelope. L4 is the *evaluation* of that envelope against current governance. L5 is the *translation* of L4's allow decision into provider-specific executable permissions.

### Simplification Preservation

The proposed simplification (S-405: "Authority stack doc consolidation") preserves this distinction. Documentation consolidation does not merge layers. The three-layer diagnostic separation remains intact:

| Diagnostic Question | Solved By |
|--------------------|-----------|
| "Was the envelope valid at admission?" | L3 envelope registry |
| "Is the WORK_ORDER authorized now?" | L4 evaluator output |
| "Can the provider execute this specific attempt?" | L5 materialization record |

**Disposition: CORRECTED** — L3/L4/L5 distinction is preserved in the core, not collapsed.

---

## BLOCKER 2: TASK CONTEXT MUST NOT BE EMBEDDED INTO AUTHORITY

### Task Passport Re-evaluation

**Current state:** Task Passport is a "revisioned projection of a Task Record carrying the role, scope, required/denied capabilities, policy-ceiling reference, and human-gate applicability used to derive authority" (DPT_TASK_SYSTEM.md §4.2).

**Why it cannot be embedded into Permission Envelope:**

| Dimension | Task Passport | Permission Envelope | Distinct? |
|-----------|--------------|---------------------|-----------|
| Purpose | Authority derivation input | Materialized authority grant | ✓ YES |
| Content | Role, scope, capabilities, gates | Claims, validity window, nonce | ✓ YES |
| Lifecycle owner | Task System | Authority Stack | ✓ YES |
| Revision semantics | Incremented on authority-relevant change | Materialized once per issuance | ✓ YES |
| Audit trail | Passport revision chain | Envelope materialization record | ✓ YES |

Embedding Task Passport into Permission Envelope would:
- Collapse execution context into authority representation
- Lose the ability to independently audit what context was used for derivation vs. what authority was granted
- Violate the principle that `AUTHORITY_CONTEXT ≠ EXECUTION_CONTEXT`

**Correct disposition:** Task Passport RETAINED as independent entity. Its semantics belong to the execution/task representation layer, not the authority layer.

### Context Receipt Re-evaluation

**Current state:** Context Receipt is "a digest of the governance rehydration (documents loaded, governance revision, task passport revision, baseline SHA) that must precede execution" (DPT_TASK_SYSTEM.md §4.6).

**Deterministic reconstructibility test:**

| Field | Reconstructible from immutable lineage? | Owner |
|-------|----------------------------------------|-------|
| WHAT_CONTEXT_WAS_ACTUALLY_RECEIVED | NO — requires explicit receipt documenting which documents were loaded and their revisions | Context Receipt |
| SOURCE/REVISION/IDENTITY of each document | Partially from governance audit, but the *specific set consumed for this execution* is only recorded in Context Receipt | Context Receipt |
| Baseline SHA at rehydration time | Derivable from Task Record snapshot, but the receipt proves WHEN it was captured relative to other events | Context Receipt |

**Conclusion:** Context Receipt captures irreplaceable evidence about the rehydration state at execution start. This cannot be deterministically reconstructed from immutable execution lineage alone, because lineage records what happened, not what was *consumed as input* at a specific point.

**Correct disposition:** Context Receipt RETAINED as independent evidence entity. Its semantics belong to the verification/evidence layer, not the authority layer.

### AUTHORITY_CONTEXT ≠ EXECUTION_CONTEXT ≠ CONTEXT_RECEIPT_EVIDENCE

| Category | Contents | Owner |
|----------|----------|-------|
| AUTHORITY_CONTEXT | L1 policy + L2 delegation + L3 envelope | ADR-033 / Authority Stack |
| EXECUTION_CONTEXT | Task Passport + Work Order inputs + expected outputs | DPT_TASK_SYSTEM.md §4 |
| CONTEXT_RECEIPT_EVIDENCE | Governance digest + passport revision + baseline SHA | DPT_TASK_SYSTEM.md §4.6 |

**Disposition: CORRECTED** — Task Passport and Context Receipt are retained as independent non-authority entities.

---

## BLOCKER 3: DELTA SEMANTICS

### Canonical Semantic Role from Task System

Delta is defined in DPT_TASK_SYSTEM.md §4.4:

> "State-change-only increment: field-level changes applied to a durable record, never a re-transmission of full state."

**Invariant:** "Applying the ordered Delta chain to the base Task Record reconstructs current durable state."

### Delta is NOT merely graph mutation

Graph mutation is ONE type of Delta/event. Delta is a **generic canonical state-transition record** that applies to:
- Task Record state changes (§5 lifecycle transitions)
- Permission Envelope materialization events
- Verification Record updates
- Decision lifecycle changes
- Resource Claim acquisitions/releases
- Any durable entity state transition

**Canonical definition:** Delta is the atomic unit of state change documentation. It answers: "What changed, from what base, who applied it, when, and with what evidence?"

### If removed as standalone entity

Delta should be represented as a generic canonical state-transition/event projection, not eliminated. The semantic role is essential to:
1. Enable state reconstruction from base + deltas
2. Provide audit trail for all state transitions
3. Support idempotent replay of state changes
4. Enable deterministic READY recomputation after any change

**Disposition: CORRECTED** — Delta is a generic state-transition/event projection, not merely a graph mutation manifestation. It is retained as a core semantic concept.

---

## BLOCKER 4: FRESHNESS EVIDENCE

### Current Ownership

Freshness evidence is defined in ADR-010:

```
freshness = {
  evidence_identity: string,
  source_reference: string,
  source_revision: string|int,
  verified_against_revision: string|int,
  verification_time: ISO8601,
  confidence: float,
  freshness_state: CURRENT|SUSPECT|STALE|UNKNOWN,
  evidence_type: string
}
```

**Ownership:** Each intelligence item owns its freshness metadata. The `EVIDENCE_FRESHNESS_BASIS` is the tuple (evidence_identity, source_ref, last_verified, evidence_type).

### Why Verification Record Does Not Own Freshness

| Property | Verification Record | Freshness Evidence |
|----------|---------------------|-------------------|
| Scope | Single verification event | Ongoing evidence item lifecycle |
| Lifecycle | Tied to verification attempt | Persists across verifications |
| State transitions | APPROVED/REJECTED/BLOCKED | CURRENT→SUSPECT→STALE→UNKNOWN |
| Trigger basis | Verification completion | Source revision probe / hash change / TTL |
| Owner | VERIFICATION entity | Project Intelligence / evidence item |

A Verification Record may **reference** freshness evidence when relevant (e.g., "verified against evidence with freshness_state=CURRENT"), but it does not own the freshness semantics. Freshness is a property of the evidence item itself, not of the verification action.

### Correct Boundary

```
Evidence Item → owns FRESHNESS_BASIS (identity, source, revision, state)
Verification Record → references freshness evidence when consumed
Verification Basis → includes freshness_state as one dimension
```

**Disposition: CORRECTED** — Freshness Evidence belongs to the evidence/intelligence item or its EVIDENCE_FRESHNESS_BASIS, not generically to Verification Record.

---

## BLOCKER 5: MINIMAL EXECUTION CORE — GUARANTEE-BASED RECONSTRUCTION

### Proven Guarantees and Required Components

| Guarantee | Required Component | Type | Entity/Service/Primitive/Projection |
|-----------|-------------------|------|-------------------------------------|
| Idempotent execution with recovery | ATTEMPT + Effect Identity | Runtime | ENTITY |
| Authority scoping per assignment | WORK_ORDER | Runtime | ENTITY |
| L3 signed envelope materialization | AUTHORITY_ENVELOPE | Governance | ENTITY |
| L4 governance evaluation | RUNTIME_EFFECTIVE_AUTHORITY | Governance | PROJECTION (computed by SERVICE) |
| L5 provider-specific permissions | MATERIALIZED_PERMISSIONS | Runtime | PROJECTION (materialized by SERVICE) |
| Evidence-backed verification | VERIFICATION_RECORD + VERIFICATION_BASIS | Governance | ENTITY |
| Governance decision and supersession | DECISION | Governance | ENTITY |
| Concurrency control | RESOURCE_CLAIM + Lease mechanism | Runtime | ENTITY |
| Causal lineage and audit | AUDIT_TRAIL (hash-linked chain) | Governance | ENTITY |
| Identity and trust boundary | FRONT_IDENTITY + CHANNEL | Governance | ENTITY |
| Deterministic authority evaluation | AUTHORITY_EVALUATOR_SERVICE | Runtime | SERVICE |
| Permission materialization | PERMISSION_MATERIALIZER_SERVICE | Runtime | SERVICE |
| Task graph and admission calculation | TASK + DAG + READY rule | Governance | ENTITY |
| Work orchestration and coordination | EXECUTION_ORCHESTRATOR_SERVICE | Runtime | SERVICE |
| Task/Work representation | TASK + WORK_ORDER + ATTEMPT | Runtime | ENTITY |

### Separate Counts

| Category | Count | Items |
|----------|-------|-------|
| **CORE ENTITIES** | 9 | TASK, WORK_ORDER, ATTEMPT, AUTHORITY_ENVELOPE, VERIFICATION_RECORD, DECISION, RESOURCE_CLAIM, FRONT_IDENTITY, AUDIT_TRAIL |
| **CORE SERVICES** | 3 | AUTHORITY_EVALUATOR_SERVICE, PERMISSION_MATERIALIZER_SERVICE, EXECUTION_ORCHESTRATOR_SERVICE |
| **CORE GOVERNANCE PRIMITIVES** | 5 | READY_RULE, REVOCATION> CANCELLATION > RETRY precedence, INDEPENDENCE_CONTRACT, HUMAN_GATE_BOUNDARY, CROSS_DOMAIN_EFFECT_RULE |
| **DERIVED PROJECTIONS** | 2 | RUNTIME_EFFECTIVE_AUTHORITY (L4), MATERIALIZED_PERMISSIONS (L5) |

### What Disappeared and Why It Must Return

| Proposed Deletion | Why It Cannot Disappear |
|-------------------|------------------------|
| Task Passport | Required for authority derivation input; distinct from Permission Envelope |
| Context Receipt | Required for rehydration evidence; irreducible to authority semantics |
| Delta | Required for state reconstruction invariant; generic state-transition concept |
| Freshness Evidence | Required for evidence staleness tracking; belongs to intelligence items |

### Corrected Minimal Core

**Core Entities (9):**
1. TASK — durable repository state
2. WORK_ORDER — bounded assignment
3. ATTEMPT — one execution unit
4. AUTHORITY_ENVELOPE — L3 signed grant
5. VERIFICATION_RECORD — evaluation result
6. DECISION — control-plane choice
7. RESOURCE_CLAIM — concurrency descriptor
8. FRONT_IDENTITY — trust boundary anchor
9. AUDIT_TRAIL — causal lineage

**Core Services (3):**
1. AUTHORITY_EVALUATOR_SERVICE — L4 computation
2. PERMISSION_MATERIALIZER_SERVICE — L5 materialization
3. EXECUTION_ORCHESTRATOR_SERVICE — coordination

**Core Governance Primitives (5):**
1. READY_RULE — deterministic eligibility
2. LIFECYCLE_PRECEDENCE — REVOCATION > CANCELLATION > RETRY
3. INDEPENDENCE_CONTRACT — self-verification prohibition
4. HUMAN_GATE_BOUNDARY — irreversible action gate
5. CROSS_DOMAIN_EFFECT_RULE — silent power acquisition prohibition

**Derived Projections (2):**
1. RUNTIME_EFFECTIVE_AUTHORITY — per WORK_ORDER evaluation
2. MATERIALIZED_PERMISSIONS — per ATTEMPT materialization

**Total: 9 entities + 3 services + 5 primitives + 2 projections = 19 core components**

**Disposition: CORRECTED** — Core reconstructed by proven guarantees, not entity count minimization.

---

## BLOCKER 6: S-401 — INVARIANT FAMILY SEPARATION

### Corrected Classification

The single parent invariant `CROSS_DOMAIN_EFFECT_RULE` does NOT generate all corollaries. The inequalities belong to four distinct semantic families:

#### Family 1: CROSS_DOMAIN_POWER
Silent cross-domain power acquisition is prohibited.

| Invariant | Derivation | Status |
|-----------|-----------|--------|
| `GRAPH_REMOVAL ≠ AUTHORITY_REVOCATION` | Graph domain ≠ Authority domain | NORMATIVE COROLLARY |
| `POOL_INVALIDATION ≠ AUTHORITY_REVOCATION` | Pool domain ≠ Authority domain | NORMATIVE COROLLARY |
| `POOL_REMOVAL ≠ AUTHORITY_REVOCATION` | Derived from POOL_INVALIDATION | DERIVED |
| `ENTITLEMENT_LOSS ≠ AUTHORITY_REVOCATION` | Entitlement domain ≠ Authority domain | NORMATIVE COROLLARY |
| `CREDITS ≠ AUTHORITY` | Economic domain ≠ Authority domain | NORMATIVE COROLLARY |
| `AUTHORITY_CAPABILITY ≠ RESOURCE_CONCURRENCY_COMPATIBILITY` | Authority domain ≠ Concurrency domain | NORMATIVE COROLLARY |

#### Family 2: CAUSALITY / DISTRIBUTED_OBSERVATION
Events in partitioned systems have bounded causal reach.

| Invariant | Derivation | Status |
|-----------|-----------|--------|
| `REVOCATION_ISSUED ≠ REVOCATION_OBSERVED_BY_FRONT` | Propagation delay in partitioned system | NORMATIVE COROLLARY |
| `OLD_GRAPH_PIN ≠ OLD_AUTHORITY_PIN` | Graph mutation ≠ Authority invalidation | NORMATIVE COROLLARY |

#### Family 3: EPISTEMIC / EVIDENCE_VALIDITY
Knowledge claims require evidence; absence of trigger is not evidence.

| Invariant | Derivation | Status |
|-----------|-----------|--------|
| `NO_TRIGGER_OBSERVED ≠ EVIDENCE_CURRENT` | Epistemic humility principle | NORMATIVE COROLLARY |

#### Family 4: AUTHORITY / EXECUTION VALIDITY
Effect identity and scope boundaries.

| Invariant | Derivation | Status |
|-----------|-----------|--------|
| `Effect identity does not grant authority` | Identity ≠ Permission | NORMATIVE COROLLARY |
| `DECISION_SUPERSESSION ≠ EXECUTION_CANCELLATION` | Governance evolution ≠ Runtime abort | NORMATIVE COROLLARY |

### Re-Tested Inequalities

| Inequality | Parent Family | Derivable? | Test Result |
|------------|---------------|------------|-------------|
| `NO_TRIGGER_OBSERVED ≠ EVIDENCE_CURRENT` | EPISTEMIC/EVIDENCE_VALIDITY | Not derivable from CROSS_DOMAIN_POWER | ✓ Distinct semantic: epistemic humility vs. domain isolation |
| `REVOCATION_ISSUED ≠ REVOCATION_OBSERVED_BY_FRONT` | CAUSALITY/DISTRIBUTED_OBSERVATION | Not derivable from CROSS_DOMAIN_POWER | ✓ Distinct semantic: propagation delay vs. domain isolation |
| `OLD_GRAPH_PIN ≠ OLD_AUTHORITY_PIN` | CAUSALITY/DISTRIBUTED_OBSERVATION | Not derivable from CROSS_DOMAIN_POWER | ✓ Distinct semantic: state pinning independence vs. domain isolation |

**Disposition: CORRECTED** — Four distinct invariant families, not one monolithic parent. Only rules genuinely derivable from the same parent semantic are consolidated.

---

## BLOCKER 7: S-402 — STATE MERGE SCOPE

### BLOCKED/SUSPENDED Inventory Per Entity

| Entity | State | Description | Scheduler Behavior | Auto Recovery | Dependency Semantics | Retry Eligibility | Notification/Escalation | Terminal? |
|--------|-------|-------------|-------------------|---------------|---------------------|-------------------|------------------------|-----------|
| Front Agent | `FRONT_SUSPENDED` | Queue/resource exhausted; fail-closed | Buffers outbound; no new requests | Reversible on condition clear | Blocks downstream work orders | No retry (state persists) | Fail-closed alert | NO |
| Front Agent | `FRONT_BLOCKED` | Resource claim denied OR critical invariant violated | Same as SUSPENDED | Reversible on condition clear | Blocks downstream work orders | No retry (state persists) | Fail-closed alert | NO |
| Orchestrator | `ADMISSION_BLOCKED` | Task cannot be admitted (prerequisite unsatisfiable) | Holds in backlog | Manual intervention required | Prevents READY transition | N/A (not an attempt) | Escalation required | NO |
| VERIFICATION | `VERIFICATION_BLOCKED` | Reviewer unable to verify (independence conflict) | Holds result pending | Manual reviewer assignment | Blocks Decision | N/A (waiting for review) | Escalation to reviewer | NO |
| Lease | `LEASE_BLOCKED` | Acquisition denied (conflict with existing lease) | Queued behind holder | Reversible on lease release | Resource unavailable | Retries per budget | Error logged | NO |

### Behavioral Comparison

| Dimension | FRONT_SUSPENDED | FRONT_BLOCKED | ADMISSION_BLOCKED | VERIFICATION_BLOCKED | LEASE_BLOCKED |
|-----------|-----------------|---------------|-------------------|----------------------|---------------|
| Cause | Queue exhaustion OR resource denial OR invariant violation | Same | Unsolvable prerequisite | Independent reviewer unavailable | Lease conflict |
| Scheduler | Buffers, then halts | Buffers, then halts | Holds in BACKLOG | Holds in REVIEW_REQUIRED | Queues acquisition |
| Auto Recovery | Yes (condition clears) | Yes (condition clears) | NO (requires manual) | NO (requires human) | Yes (lease released) |
| Dependency Impact | All downstream blocked | All downstream blocked | Downstream cannot become READY | Decision blocked | Resource unavailable |
| Retry Eligibility | New attempt after recovery | New attempt after recovery | N/A | N/A | Retry per budget |
| Notification | Fail-closed alert | Fail-closed alert | Escalation required | Escalation to reviewer | Error log |
| Terminal | NO | NO | NO | NO | NO |

### Equivalence Analysis

**Front Agent domain:** `FRONT_SUSPENDED` and `FRONT_BLOCKED` are operationally equivalent:
- Both are fail-closed
- Both buffer/halt the same way
- Both recover reversibly
- Both block downstream work orders identically
- Both permit retry after recovery

**Cross-domain:** `ADMISSION_BLOCKED`, `VERIFICATION_BLOCKED`, and `LEASE_BLOCKED` have DISTINCT behaviors:
- ADMISSION_BLOCKED requires manual intervention (no auto-recovery)
- VERIFICATION_BLOCKED requires human reviewer (different escalation path)
- LEASE_BLOCKED auto-recovers on lease release (different cause/recovery)

### Corrected Merge Scope

| Merge | Justified? | Reason |
|-------|-----------|--------|
| FRONT_SUSPENDED ↔ FRONT_BLOCKED | ✓ YES | Identical scheduler behavior, identical recovery, identical dependency impact, identical retry eligibility |
| ADMISSION_BLOCKED → FRONT_SUSPENDED | ✗ NO | Manual intervention required; not reversible automatically |
| VERIFICATION_BLOCKED → FRONT_SUSPENDED | ✗ NO | Different escalation path; requires human reviewer |
| LEASE_BLOCKED → FRONT_SUSPENDED | ✗ NO | Different cause (lease conflict); auto-recovers on lease release |

### Corrected S-402 Disposition

**Per-domain merge only:** `FRONT_SUSPENDED` and `FRONT_BLOCKED` may be merged into a single `FRONT_SUSPENDED` state with cause enumeration (`QUEUE_EXHAUSTED`, `RESOURCE_DENIED`, `INVARIANT_VIOLATED`).

**Global merge rejected:** `ADMISSION_BLOCKED`, `VERIFICATION_BLOCKED`, and `LEASE_BLOCKED` retain distinct semantics because their scheduler behavior, auto-recovery properties, dependency semantics, retry eligibility, notification paths, and terminal behavior differ from Front Agent suspension.

**Disposition: CORRECTED** — Merge limited to Front lifecycle only. Cross-domain BLOCKED states preserved as distinct.

---

## CORRECTED SUMMARY

### S-401 Disposition (Corrected)

| Aspect | Previous | Corrected |
|--------|----------|-----------|
| Classification | All under CROSS_DOMAIN_EFFECT_RULE | Four distinct families |
| `NO_TRIGGER_OBSERVED ≠ EVIDENCE_CURRENT` | DERIVED | NORMATIVE COROLLARY (EPISTEMIC family) |
| `REVOCATION_ISSUED ≠ REVOCATION_OBSERVED_BY_FRONT` | DERIVED | NORMATIVE COROLLARY (CAUSALITY family) |
| `OLD_GRAPH_PIN ≠ OLD_AUTHORITY_PIN` | DERIVED | NORMATIVE COROLLARY (CAUSALITY family) |
| Consolidation approach | Single parent + corollaries | Four family hierarchies |

### S-402 Disposition (Corrected)

| Aspect | Previous | Corrected |
|--------|----------|-----------|
| Merge scope | Global BLOCKED→SUSPENDED | Front lifecycle only |
| Justification | "Identical failure modes" | Only identical for Front Agent |
| ADMISSION_BLOCKED | Merged | Retained (manual intervention) |
| VERIFICATION_BLOCKED | Merged | Retained (human reviewer) |
| LEASE_BLOCKED | Merged | Retained (auto-recover on release) |
| Cause enumeration | QUEUE/RESOURCE/VALIDITY | QUEUE_EXHAUSTED/RESOURCE_DENIED/INVARIANT_VIOLATED |

### Corrected Entity Reduction Map

| Entity | Previous Disposition | Corrected Disposition | Reason |
|--------|---------------------|----------------------|--------|
| Task Passport | DELETE (embed in Permission Envelope) | RETAIN | Distinct from authority; execution context !== authority context |
| Context Receipt | DELETE (derive from Envelope+Decision) | RETAIN | Irreplaceable rehydration evidence; not reconstructible from lineage |
| Delta | DELETE (event in Audit Trail) | RETAIN | Generic state-transition primitive; not merely graph mutation |
| Freshness Evidence | DELETE (field in Verification Record) | RETAIN | Belongs to evidence item; Verification Record only references |
| Handoff | SUBSUME into Result | Keep as semantic variant | Result + Verification Record already covers; low risk |

### Corrected Minimal Governance Kernel

| Primitive | Retained | Reason |
|-----------|----------|--------|
| CROSS_DOMAIN_EFFECT_RULE | ✓ | Parent invariant (Family 1) |
| Four Family Parents | ✓ | CROSS_DOMAIN_POWER, CAUSALITY/OBSERVATION, EPISTEMIC/VALIDITY, AUTHORITY/EXECUTION |
| LIFECYCLE_PRECEDENCE | ✓ | REVOCATION > CANCELLATION > RETRY |
| HUMAN_GATE_BOUNDARY | ✓ | Constitutional requirement |
| VERIFICATION_INDEPENDENCE | ✓ | Security guarantee |
| AUTHORITY_STACK | ✓ | Five layers distinctly observable |
| READY_RULE | ✓ | Deterministic eligibility |
| INDEPENDENCE_CONTRACT | ✓ | Self-verification prohibition |

### Corrected Minimal Execution Core

| Category | Count | Items |
|----------|-------|-------|
| CORE ENTITIES | 9 | TASK, WORK_ORDER, ATTEMPT, AUTHORITY_ENVELOPE, VERIFICATION_RECORD, DECISION, RESOURCE_CLAIM, FRONT_IDENTITY, AUDIT_TRAIL |
| CORE SERVICES | 3 | AUTHORITY_EVALUATOR_SERVICE, PERMISSION_MATERIALIZER_SERVICE, EXECUTION_ORCHESTRATOR_SERVICE |
| CORE GOVERNANCE PRIMITIVES | 5 | READY_RULE, LIFECYCLE_PRECEDENCE, INDEPENDENCE_CONTRACT, HUMAN_GATE_BOUNDARY, CROSS_DOMAIN_EFFECT_RULE (parent) |
| DERIVED PROJECTIONS | 2 | RUNTIME_EFFECTIVE_AUTHORITY (L4), MATERIALIZED_PERMISSIONS (L5) |
| **TOTAL** | **19** | |

### Revised Semantic-Reduction Estimate

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Cross-domain invariant assertions | 11 | 6 (normative) + 5 (family-distinct) | No reduction (corrected over-consolidation) |
| Canonical entities | 17 → 12 (previous) | 17 → 14 (corrected) | -18% (more conservative) |
| State merges | BLOCKED→SUSPENDED global | FRONT_SUSPENDED only | Reduced scope |
| Ceremony points | 10 → 7 (previous) | 10 → 8 (corrected) | -20% |
| Documentation lines | 3853 → ~3200 (previous) | 3853 → ~3400 (corrected) | -12% |

**Key correction:** Previous estimates over-reduced by embedding non-authority semantics into authority and merging cross-domain states that behave differently. Corrected estimates are more conservative and preserve semantic distinctions.

---

## PHASE BOUNDARY

Phase 4 admission blocker correction resolved. No canonical mutation applied. Validation report written to `docs/validation/DPT-PHASE4-ADMISSION-BLOCKER-CORRECTION.md`.

**Next boundary:** Phase 5 consideration (if authorized).
