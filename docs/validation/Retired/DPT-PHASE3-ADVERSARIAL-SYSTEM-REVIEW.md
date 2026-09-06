# Phase 3 — Adversarial System-Level Falsification Review

**Scope:** Complete DPT system end-to-end adversarial scenarios  
**Date:** 2026-09-06  
**Mode:** Architecture-discussion boundary. No canonical mutation.  
**Principle:** A scenario that safely refuses an unauthorized action is NOT a failure. A scenario that cannot make progress on an ordinary authorized action IS a failure.

---

## Methodology

For each of 10 scenarios:
1. Trace the canonical state-transition sequence
2. Execute against all applicable ADR rules simultaneously
3. Test for 16 failure classes
4. Measure conceptual burden
5. Classify finding and propose minimal repair if needed

Canonical sources used: ADR-018 (Two-Plane), ADR-022–029 (Execution model), ADR-030 (Front Agent), ADR-033 (Authority stack), ADR-034 (Leases), ADR-035 (Verification), ADR-036 (Retry/Cancellation/Revocation), ADR-037 (Graph mutation), ADR-038 (Integration), ADR-040 (Idempotency), ADR-041 (Audit), ADR-043 (Decision lifecycle), ADR-045 (Notifications), ADR-046 (Triggers), ADR-048 (Network/API), ADR-049 (Pool), ADR-050 (Credits), Cross-cutting invariant.

---

## SCENARIO 1: ORDINARY AUTONOMOUS TASK

### Canonical State Transition Sequence

```
OWNER grants LAYER 2 delegation (co-signature)
  ↓
LAYER 3 AUTHORITY_ENVELOPE materialized (DPT-signed)
  ↓
Orchestrator receives Intent → creates Plan → decomposes to Task
  ↓
Task enters DAG; ready dependencies → WORK_ORDER created
  ↓
ENTITLEMENT gate: subscription tier OK, credits sufficient
  ↓
LAYER 4: Authority Evaluator SERVICE evaluates (LAYER 1 + LAYER 2 + LAYER 3 + time + WORK_ORDER)
  ↓
LAYER 4 = ALLOW
  ↓
LAYER 5: Provider runtime materializes PERMISSIONS (per attempt)
  ↓
Lease acquired for declared RESOURCE_CLAIMS (fencing token from LAYER 4)
  ↓
Attempt executes → produces Artifact
  ↓
Independent Verification (ADR-035): verifier satisfies INDEPENDENCE_CONTRACT
  ↓
VERIFICATION_RECORD produced → APPROVED
  ↓
Orchestrator Decision: ATTEMPT_COMPLETE + TASK_CLOSED
  ↓
Audit event appended (ADR-041)
```

### Failure Class Testing

| Failure Class | Result | Rationale |
|--------------|--------|-----------|
| DEADLOCK | SAFE | No circular dependency; single WORK_ORDER, single lease |
| LIVELOCK | SAFE | Bounded queue; no indefinite deferral |
| UNBOUNDED_WAIT | SAFE | TTL-bounded leases; retry budget finite |
| CEREMONY_EXPLOSION | ⚠️ NOTED | 7 distinct entity transitions + 3 evaluations + 2 records |
| OWNER_PROMPT_EXPLOSION | SAFE | Mode 4+ requires zero owner interaction post-delegation |
| AUTHORITY_LEAK | SAFE | LAYER 5 never persistent; re-derived per attempt |
| STALE_AUTHORITY | SAFE | LAYER 4 evaluated fresh for each attempt |
| DOUBLE_EFFECT | SAFE | Idempotency keys per boundary (ADR-040) |
| LOST_EFFECT | SAFE | Durable state (ADR-027); audit chain preserves |
| FALSE_CLOSURE | SAFE | Verification mandatory before closure (ADR-025) |
| FALSE_BLOCKER | SAFE | Deterministic READY computation; no confidence-based gating |
| SPLIT_BRAIN | SAFE | Single Orchestrator mutation gate |
| CROSS_PROJECT_CONTAMINATION | SAFE | Single-project scope |
| UNRECOVERABLE_STATE | SAFE | Durable state reconstructible from delta chain |
| AUTONOMY_STALL | SAFE | No Human Gate required for MODE_4 autonomous path |

### Conceptual Burden

| Metric | Count | Assessment |
|--------|-------|------------|
| Distinct entities | 7 (Intent→Plan→Task→WO→Attempt→Verification→Decision) | Standard |
| Lifecycle transitions | 12 | Acceptable |
| Mandatory records | 4 (L3 envelope, L5 materialization, VERIFICATION_RECORD, AUDIT_EVENT) | Acceptable |
| Independent evaluations | 3 (L4 authority, Entitlement, Verification) | Acceptable |
| Human Gates | 0 (mode ≥4) | Correct |
| Duplicate state representations | 2 (L4 computed + L5 derived; separate storage) | Acceptable separation |

### Classification: **SYSTEM_SAFE**

No architectural defects found. The ordinary autonomous path works as designed when operating conditions are met.

---

## SCENARIO 2: MULTI-TASK PARALLEL BATCH

### Setup

3 READY tasks (T1, T2, T3) with shared resource R_write (exclusive) and independent resources R_read_a, R_read_b. T1 depends on T2. All in same WORKFLOW.

### Canonical State Transition Sequence

```
DAG recalculation: T2 READY (no deps), T1 READY (dep on T2), T3 READY (no deps)
  ↓
Orchestrator schedules: T2 and T3 in parallel (independent)
  ↓
T2 acquires WRITE lease on R_write (LEASE_GRANTED)
T3 acquires READ lease on R_read_a (LEASE_GRANTED) — compatible
T1 acquires READ lease on R_read_b (LEASE_GRANTED) — waiting for T2 dep
  ↓
T2 executes → completes → releases WRITE lease (LEASE_RELEASED)
  ↓
T1 reacquires READ on R_write (now available as READ) → executes
T3 continues execution → completes → releases READ lease
  ↓
DAG recalculation: T1, T3 closed → downstream re-evaluated
```

### Failure Class Testing

| Failure Class | Result | Rationale |
|--------------|--------|-----------|
| DEADLOCK | SAFE | Canonical acquire order `(resource_type, resource_id)` prevents circular wait (ADR-034) |
| LIVELOCK | ⚠️ POTENTIAL | If T1 repeatedly requests WRITE after being blocked, and T3 holds long READ, T1 may starve. Bounded wait + timeout prevents unbounded stall but not indefinite preemption. |
| UNBOUNDED_WAIT | SAFE | TTL expiry auto-releases; bounded wait per ADR-034 |
| CEREMONY_EXPLOSION | ⚠️ NOTED | 3× lease acquisition + 3× release + 3× L4 eval + 3× verification = high ceremony for simple batch |
| OWNER_PROMPT_EXPLOSION | SAFE | No owner interaction needed |
| AUTHORITY_LEAK | SAFE | Each attempt re-derives L5; leases released on completion |
| STALE_AUTHORITY | SAFE | L4 evaluated per-attempt with current time window |
| DOUBLE_EFFECT | SAFE | Idempotency keys per boundary; lease fencing prevents concurrent WRITE |
| LOST_EFFECT | SAFE | Durable state preserves each attempt's result |
| FALSE_CLOSURE | SAFE | Each task requires independent verification |
| FALSE_BLOCKER | ⚠️ POTENTIAL | A task blocked on READ of R_write cannot proceed even if its *actual* work only needs R_read_a. Overly conservative claim matching may block unrelated work. |
| SPLIT_BRAIN | SAFE | Single DAG, single Orchestrator mutation gate |
| CROSS_PROJECT_CONTAMINATION | SAFE | Same project scope |
| UNRECOVERABLE_STATE | SAFE | Per-attempt durable state |
| AUTONOMY_STALL | SAFE | No owner intervention required |

### Burden Analysis

- 6 lease operations (3 acquire, 3 release) for 3 tasks with 1 shared resource
- 3 independent L4 evaluations
- 3 independent verifications
- Each task requires its own WORK_ORDER + ATTEMPT + VERIFICATION_RECORD

The architecture correctly handles concurrency but the conservative claim model (ADR-026: "uncertainty, incomplete coverage, or an unresolved conflict domain prevents concurrency") means every shared resource creates a serialization point. For N tasks sharing M resources, the ceremony scales as O(N×M).

### Finding: SYSTEM_CLARIFICATION_NEEDED

**Issue:** ADR-026's conservative claim model combined with ADR-034's "No silent upgrades" rule creates unnecessary serialization. A WRITE lease holder could theoretically grant subordinate READ access to other tasks without upgrading its own claim, but the architecture doesn't specify this optimization.

**Minimal repair:** Clarify that a WRITE lease implies READ compatibility for other lease holders — the WRITE holder's fence token covers both modes. This eliminates redundant READ acquisitions when a WRITE is already held.

**Falsification of repair:** If a task holds WRITE and another concurrently acquires READ on the same resource, can the READ task observe partial writes? Answer: No — the WRITE lease grants exclusive access; concurrent READs are blocked until WRITE releases. The lease manager enforces mutual exclusion. Repair is safe.

**Classification: SYSTEM_CLARIFICATION_NEEDED**

---

## SCENARIO 3: PROVIDER FAILURE MID-ATTEMPT

### Setup

Attempt executing with primary provider. Provider returns 5xx error mid-computation after producing partial artifact.

### Canonical State Transition Sequence

```
Attempt ACTIVE → Provider returns 5xx
  ↓
Orchestrator receives failure → marks ATTEMPT_FAILED
  ↓
Retry eligibility check: 5xx → RETRY_ELIGIBLE (per ADR-036)
  ↓
New ATTEMPT created under same WORK_ORDER
  ↓
LAYER 4 re-evaluated for new ATTEMPT (P2-001: every retry re-evaluates authority)
  ↓
LAYER 5 re-derived (fresh per attempt)
  ↓
Lease re-acquired with new fencing token
  ↓
Routing taxonomy (ADR-039): primary failed → FALLBACK to alternative provider
  ↓
Fallback attempt executes
```

### Failure Class Testing

| Failure Class | Result | Rationale |
|--------------|--------|-----------|
| DEADLOCK | SAFE | Retry budget finite; falls through to ESCALATION |
| LIVELOCK | ⚠️ POTENTIAL | If provider consistently returns 5xx and no fallback exists, retry exhausts budget → ESCALATION. Not livelock, but the retry loop itself is a bounded live-work loop. |
| UNBOUNDED_WAIT | SAFE | Retry budget enforced by Orchestrator |
| CEREMONY_EXPLOSION | ⚠️ NOTED | Each retry re-runs L4 evaluation + L5 materialization + lease acquisition + idempotency key generation |
| OWNER_PROMPT_EXPLOSION | SAFE | Transient failures handled autonomously |
| AUTHORITY_LEAK | SAFE | L5 re-derived fresh per retry; old provider state discarded |
| STALE_AUTHORITY | ⚠️ RISK | If LAYER 2 delegation expires during retry backoff, the new ATTEMPT will fail L4 evaluation. The architecture handles this (revocation before retry approval → denied), but the delay between failure and retry approval may span delegation expiry. |
| DOUBLE_EFFECT | SAFE | Idempotency keys prevent duplicate effects across retries |
| LOST_EFFECT | ⚠️ RISK | Partial artifact from failed attempt is discarded. If the partial artifact had side effects (e.g., file written, API call made), those effects persist without corresponding audit linkage to a completed attempt. Compensation must be explicit. |
| FALSE_CLOSURE | SAFE | Verification is separate from attempt completion |
| FALSE_BLOCKER | SAFE | Fallback routing is deterministic per ADR-039 |
| SPLIT_BRAIN | SAFE | Single Orchestrator |
| CROSS_PROJECT_CONTAMINATION | SAFE | Single project |
| UNRECOVERABLE_STATE | SAFE | Attempt lineage preserved |
| AUTONOMY_STALL | SAFE | Retry and fallback are autonomous |

### Burden Analysis

- L4 evaluation × 2 (original + retry)
- L5 materialization × 2
- Lease acquisition × 2 (new fencing tokens)
- Audit events × 4 (attempt start, failure, retry start, completion)
- Idempotency key management × 2

### Findings

**Finding 3a: STALE_AUTHORITY during retry window**
**Severity:** LOW — handled by existing revocation-before-retry rule
**Repair:** None needed — the architecture correctly denies retry when revocation precedes approval. The risk is visibility: operators should see the retry denial reason clearly.
**Classification: SYSTEM_SAFE**

**Finding 3b: PARTIAL-EFFECT COMPENSATION**
**Severity:** MEDIUM — ADR-036 specifies "Compensation: Required for side effects" but does not define the compensation protocol or who triggers it.
**Minimal repair:** Define a `COMPENSATION_REQUIRED` state that flags attempts with potential side effects, requiring explicit owner or automated compensation before the WORK_ORDER can be retried or closed.
**Falsification:** If compensation is omitted for a file-write side effect, the next retry overwrites the same file (idempotent by design). For non-idempotent effects (API calls), compensation is needed. This is an implementation gap, not architectural.
**Classification: SYSTEM_CLARIFICATION_NEEDED**

---

## SCENARIO 4: REVOCATION DURING DISCONNECTION

### Setup

Front Agent in DEGRADED state (Gateway unreachable). While partitioned:
1. Owner issues LAYER 2 revocation
2. Front Agent continues executing buffered requests under old LAYER 3 envelope
3. Partition heals → RECONNECTING → ONLINE

### Canonical State Transition Sequence

```
Front Agent: ONLINE → DEGRADED (heartbeat timeout)
  ↓
Owner issues LAYER 2 revocation (DPT governance)
  ↓
Front Agent: continues buffered execution under old LAYER 3 envelope
  ↓
[TIME ELAPSES — P2-005 offline validity proof expires]
  ↓
Front Agent: authority_freshness_proof EXPIRED → SUSPENDED/BLOCKED
  ↓
Front Agent: RECONNECTING (attempts to re-establish Gateway)
  ↓
On reconnect: mandatory canonical revalidation
  ↓
LAYER 2 revocation detected → LAYER 3 envelopes INVALIDATED
  ↓
LAYER 4 = DENY for all pending WORK_ORDERs
  ↓
Queued effects BLOCKED until revalidation succeeds
  ↓
Front Agent: SUSPENDED (cannot execute under stale authority)
  ↓
Owner re-grants LAYER 2 delegation → new LAYER 3 envelope materialized
  ↓
Front Agent: RECONNECTING → ONLINE
```

### Failure Class Testing

| Failure Class | Result | Rationale |
|--------------|--------|-----------|
| DEADLOCK | SAFE | Finite offline validity bound; eventual reconnect or suspension |
| LIVELOCK | ⚠️ POTENTIAL | If Gateway is permanently unreachable and revocation persists, Front stays SUSPENDED indefinitely. This is correct fail-closed behavior, but could be misinterpreted as a stall. |
| UNBOUNDED_WAIT | ⚠️ MARGINAL | P2-005 specifies bounded offline validity, but does not define what bound. If the bound is too long, stale authority persists; if too short, legitimate partitions cause unnecessary suspension. |
| CEREMONY_EXPLOSION | ⚠️ NOTED | Reconnect requires full L3 revalidation for ALL held envelopes — potentially expensive |
| OWNER_PROMPT_EXPLOSION | SAFE | Automatic; no owner intervention needed for reconnection |
| AUTHORITY_LEAK | SAFE | Stale envelopes invalidated on reconnect; L5 re-derived fresh |
| STALE_AUTHORITY | ⚠️ WINDOW | Between revocation issuance and Front observation (P2-005 invariant), the Front may execute N additional requests under revoked authority. The bounded validity proof limits this window. |
| DOUBLE_EFFECT | SAFE | Idempotency keys prevent duplicate effects on reconnect replay |
| LOST_EFFECT | SAFE | Buffered effects preserved in durable queue; replayed on reconnect |
| FALSE_CLOSURE | SAFE | No closure possible without Gateway acknowledgment |
| FALSE_BLOCKER | SAFE | SUSPENDED is the correct fail-closed state |
| SPLIT_BRAIN | SAFE | Single canonical authority source; Front is projection |
| CROSS_PROJECT_CONTAMINATION | SAFE | Same project scope |
| UNRECOVERABLE_STATE | SAFE | Local persistence survives partition; reconstructible on reconnect |
| AUTONOMY_STALL | SAFE | Auto-suspension and auto-reconnect are autonomous |

### Finding: STALE_AUTHORITY_WINDOW

**Severity:** MEDIUM — The bounded offline validity window is the critical parameter. During this window, the Front operates under authority that may have been revoked at the canonical source. The window must be short enough to be安全, but long enough to survive brief partitions.

**Minimal repair:** No architecture change needed. The contract is sound: bounded offline validity + fail-closed suspension + mandatory revalidation. The implementation must choose an appropriate bound based on partition characteristics. This is a CONFIGURABLE_WITH_DEFAULTS parameter (following ADR-050's pattern).

**Falsification:** Shortening the bound increases suspension frequency during brief partitions (availability cost). Lengthening increases stale-authority exposure (safety cost). The trade-off is operational, not architectural.
**Classification: SYSTEM_SAFE**

### Finding: RECONNECT_CEREMONY

**Severity:** LOW — Full L3 revalidation on reconnect may be expensive if many envelopes were issued. However, the revalidation is just a set of lookups against canonical state — not recomputation.
**Classification: SYSTEM_SAFE**

---

## SCENARIO 5: DECISION CHANGE DURING EXECUTION

### Setup

WORK_ORDER W is in ATTEMPT_ACTIVE state. While executing, Decision D_v1 is SUPERSEDED by D_v2.

### Canonical State Transition Sequence

```
WORK_ORDER W admitted under D_v1 (t=0)
  ↓
ATTEMPT A1 ACTIVE (L4+L5 valid, lease held)
  ↓
[Time passes] D_v1 SUPERSEDED by D_v2 (governance action)
  ↓
Impact evaluation per P2-008:
  - Is W's execution basis invalidated by D_v2?
  ↓
PATH A: Execution basis REMAINS VALID
  → W continues under D_v1 pin
  → A1 completes
  → Verification against D_v1 criteria
  → Closure validates admission-time decision
  ↓
PATH B: Execution basis INVALIDATED
  → Separate AUTHORITY_REVOCATION emitted (ADR-036)
  → Or EXECUTION_CANCELLATION emitted (ADR-036)
  → A1 aborted; leases revoked
  → W re-evaluated under D_v2
```

### Failure Class Testing

| Failure Class | Result | Rationale |
|--------------|--------|-----------|
| DEADLOCK | SAFE | Bifurcated paths; either completes or aborts deterministically |
| LIVELOCK | ⚠️ POTENTIAL | If D_v1/D_v2 are mutually incompatible and the impact evaluation oscillates (each re-evaluation finds new supercession), W could cycle. But ADR-043 states SUPERSEDED is terminal — once superseded, no further supercession of the same decision. |
| UNBOUNDED_WAIT | SAFE | Impact evaluation is a bounded computation |
| CEREMONY_EXPLOSION | ⚠️ NOTED | Path B requires: impact evaluation + revocation/cancellation emission + lease invalidation + attempt abort + re-admission under D_v2 |
| OWNER_PROMPT_EXPLOSION | SAFE | Impact evaluation is automated; cancellation is governed, not owner-interaction-dependent |
| AUTHORITY_LEAK | SAFE | Path B explicitly emits revocation; leases invalidated |
| STALE_AUTHORITY | ⚠️ CRITICAL IF MISIMPLEMENTED | If the architecture fails to emit the separate revocation/cancellation in Path B, W continues under stale authority. The P2-008 separation (`DECISION_SUPERSESSION ≠ AUTHORITY_REVOCATION`) prevents this if followed. |
| DOUBLE_EFFECT | SAFE | Idempotent cancellation; single abort |
| LOST_EFFECT | SAFE | A1's partial results recorded; never silently discarded |
| FALSE_CLOSURE | SAFE | Closure requires verification; supersession doesn't auto-close |
| FALSE_BLOCKER | SAFE | Path A correctly allows continuation |
| SPLIT_BRAIN | SAFE | Single canonical decision state |
| CROSS_PROJECT_CONTAMINATION | SAFE | Same project scope |
| UNRECOVERABLE_STATE | SAFE | Durable state preserves W's position |
| AUTONOMY_STALL | SAFE | Both paths are autonomous |

### Finding: PATH_B_EMISSION_GAP

**Severity:** HIGH if unaddressed — The architecture now explicitly separates decision supercession from runtime effect (P2-008), but the mechanism for triggering the separate revocation/cancellation in Path B needs explicit definition. Currently: "emit a separate AUTHORITY_REVOCATION and/or EXECUTION_CANCELLATION through the appropriate execution lifecycle." Who triggers this emission? How does the system know Path B applies vs. Path A?

**Minimal repair:** Add an explicit impact-evaluation rule to ADR-043:
> **Impact Evaluation Rule:** When a decision enters SUPERSEDED state, the Orchestrator evaluates whether any active WORK_ORDER's LAYER 3 envelope derives authority from the superseded decision's resolution. If yes → emit EXECUTION_CANCELLATION for that WORK_ORDER. If no → continue under admission pin.

This makes the Path A/Path B distinction operational rather than conceptual.

**Falsification:** If the impact evaluation incorrectly classifies Path B as Path A, work continues under potentially invalidated authority. This would violate the cross-cutting invariant. The evaluation must be conservative: if there's any uncertainty about authority derivation, emit cancellation.

**Classification: SYSTEM_REVISION_CANDIDATE** — requires explicit impact-evaluation rule definition.

---

## SCENARIO 6: RETRY AFTER VERIFIED ARTIFACT

### Setup

Attempt A1 produces Artifact V1. Verification APPROVES V1. VERIFICATION_RECORD created. Then, before closure, A1's effect is discovered to have failed (side channel, external validator). Attempt fails. Retry A2 produces Artifact V2.

### Canonical State Transition Sequence

**Case 6a: A2 produces IDENTICAL artifact V1 (same hash)**
```
A1: produces V1 → Verification APPROVED → VERIFICATION_RECORD(V1, R1)
A1: fails post-verification (external defect)
  ↓
Retry A2: produces V1 (identical hash)
  ↓
P2-003 verification scoping: 
  - artifact identity unchanged ✓
  - independence requirements satisfied ✓
  - risk assumptions valid ✓
  - no superseding governance event ✓
  ↓
VERIFICATION_RECORD(V1, R1) REUSED for A2
  ↓
Closure proceeds under original verification
```

**Case 6b: A2 produces DIFFERENT artifact V2**
```
A1: produces V1 → Verification APPROVED → VERIFICATION_RECORD(V1, R1)
A1: fails post-verification
  ↓
Retry A2: produces V2 (different hash)
  ↓
P2-003: different artifact identity → NEW verification REQUIRED
  ↓
Reviewer independently verifies V2
  ↓
VERIFICATION_RECORD(V2, R2) produced
  ↓
Closure proceeds under R2
```

### Failure Class Testing

| Failure Class | Result | Rationale |
|--------------|--------|-----------|
| DEADLOCK | SAFE | Verification always produces a deterministic outcome |
| LIVELOCK | ⚠️ POTENTIAL | If A2 also produces V1 but the external defect is in V1's semantics (not its content), reusing V1's verification skips the defect detection. The defect was found post-verification, so the original verification was insufficient for the actual use case. |
| UNBOUNDED_WAIT | SAFE | Retry budget finite |
| CEREMONY_EXPLOSION | ⚠️ NOTED | Case 6a reuses verification (minimal); Case 6b requires full re-verification (maximal) |
| OWNER_PROMPT_EXPLOSION | SAFE | Autonomous retry and verification |
| AUTHORITY_LEAK | SAFE | New attempt gets fresh L4/L5 |
| STALE_AUTHORITY | SAFE | Verification record is artifact-bound, not time-bound |
| DOUBLE_EFFECT | SAFE | Idempotent; single closure per WORK_ORDER |
| LOST_EFFECT | SAFE | Both artifacts recorded in attempt lineage |
| FALSE_CLOSURE | ⚠️ CRITICAL | Case 6a: if V1 has a semantic defect invisible to the artifact hash but visible to the external validator, reusing V1's verification produces FALSE CLOSURE. The P2-003 rule says "reuse if exact verified artifact identity is unchanged" — but the defect was discovered AFTER the original verification. |
| FALSE_BLOCKER | SAFE | Verification always proceeds |
| SPLIT_BRAIN | SAFE | Single verification outcome |
| CROSS_PROJECT_CONTAMINATION | SAFE | Single project |
| UNRECOVERABLE_STATE | SAFE | Attempt lineage preserves history |
| AUTONOMY_STALL | SAFE | No owner intervention needed |

### Finding: POST-VERIFICATION_DEFECT_REUSE

**Severity:** HIGH — The P2-003 artifact-bound verification reuse rule creates a gap: if an artifact passes verification but a LATER-discovered defect exists in the artifact's semantic content (not its syntactic identity), reusing the verification record for a retry with identical output produces false closure.

**Example:** A1 compiles code V1 → verification checks syntax (PASS) → later, an integration test reveals V1 has a runtime bug → A2 re-compiles → produces identical V1 → P2-003 says reuse verification → but the runtime bug is still present → FALSE CLOSURE.

**Minimal repair:** Add a temporal dimension to verification reuse:
> A VERIFICATION_RECORD may be reused only if the verifying assumption set was comprehensive enough to catch the type of defect that caused the later failure. If the later failure reveals a verification gap (an assumption that was not checked), the verification record CANNOT be reused regardless of artifact identity.

This adds complexity but closes the false closure gap.

**Falsification of repair:** If we always require fresh verification after any failure, we lose the efficiency benefit of verification reuse for truly identical retries. The temporal/comprehensiveness check is implementation-dependent — the orchestrator must track which assumptions were verified vs. which were not.
**Classification: SYSTEM_REVISION_CANDIDATE**

---

## SCENARIO 7: PROJECT INTELLIGENCE STALENESS

### Setup

Project's dependency tree changes (new CVE in transitive dep). No clean trigger fires because the change was detected by an external tool, not by DPT's Scout.

### Canonical State Transition Sequence

```
External tool detects CVE in dependency
  ↓
No DPT trigger fired (out-of-band change)
  ↓
Project Intelligence item for this dependency remains CURRENT (stale)
  ↓
DPT Advisor uses stale intelligence → recommends actions based on outdated state
  ↓
Potential: advice references non-existent vulnerability or misses real one
```

### Failure Class Testing

| Failure Class | Result | Rationale |
|--------------|--------|-----------|
| DEADLOCK | SAFE | No deadlock; advisory is non-blocking |
| LIVELOCK | SAFE | Advisory continues with stale data; no loop |
| UNBOUNDED_WAIT | ⚠️ RISK | If no trigger fires, Project Intelligence never refreshes. The freshness states (CURRENT/SUSPECT/STALE/UNKNOWN) exist but the trigger mechanism (ADR-046) depends on DPT-observed events. External changes are invisible. |
| CEREMONY_EXPLOSION | N/A | Advisory-only; no execution ceremony |
| OWNER_PROMPT_EXPLOSION | SAFE | No owner interaction |
| AUTHORITY_LEAK | SAFE | Advisory plane; no authority involved |
| STALE_AUTHORITY | SAFE | Authority is separate from Project Intelligence |
| DOUBLE_EFFECT | N/A | No effects |
| LOST_EFFECT | N/A | No effects to lose |
| FALSE_CLOSURE | N/A | No closure |
| FALSE_BLOCKER | N/A | Advisory never blocks |
| SPLIT_BRAIN | ⚠️ RISK | DPT has stale view; project has current view. Not a split brain per se, but a consistent divergence. |
| CROSS_PROJECT_CONTAMINATION | SAFE | Same project |
| UNRECOVERABLE_STATE | N/A | Advisory state |
| AUTONOMY_STALL | ⚠️ RISK | DPT operates autonomously but on stale intelligence. The autonomy is not stalled, but the quality of advice degrades. |

### Finding: BLIND_SPOT_TO_EXTERNAL_CHANGES

**Severity:** MEDIUM — ADR-046's trigger model is event-driven (framework upgrade, CVE in dep, breaking change). These are DPT-observable events. Changes detected externally (by CI, by manual git pull, by package manager) are invisible to DPT until the next periodic refresh or manual trigger.

**Minimal repair:** Add a periodic baseline refresh as a safety net:
> Even when no trigger fires, Project Intelligence items expire from CURRENT to STALE after a maximum age threshold (e.g., 7 days for dependencies, configurable per evidence type). STALE items trigger REFRESH_BROAD automatically.

This is consistent with the freshness states already defined in F-003 (CURRENT/SUSPECT/STALE/UNKNOWN) and ADR-046's refresh semantics. The trigger mechanism already supports REFRESH_BROAD for STALE state.

**Falsification:** Periodic refresh adds overhead. For stable projects with infrequent changes, the overhead is acceptable (lightweight scan). The maximum age is a CONFIGURABLE_WITH_DEFAULTS parameter.
**Classification: SYSTEM_CLARIFICATION_NEEDED** — the freshness model exists but lacks a time-bounded expiration safety net.

---

## SCENARIO 8: ECONOMIC / ENTITLEMENT CHANGE

### Setup

Project's credit balance drops to zero mid-execution. Also test entitlement loss before admission.

### Canonical State Transition Sequence

**Case 8a: Entitlement lost BEFORE admission**
```
WORK_ORDER W ready
  ↓
Entitlement gate: credits = 0, subscription tier expired
  ↓
ENTITLEMENT_VALID = FALSE
  ↓
ADMISSIBLE = AUTHORITY_VALID ∧ FALSE ∧ ... = FALSE
  ↓
WORK_ORDER not created. Admission denied.
  ↓
LAYER 1-5 untouched. No authority manufactured.
```

**Case 8b: Entitlement lost DURING execution**
```
W admitted (credits > 0 at admission)
  ↓
LAYER 3 envelope materialized; LAYER 4 = ALLOW; LAYER 5 = PERMISSIONS
  ↓
Lease acquired; ATTEMPT ACTIVE
  ↓
[during execution] credits consumed → balance = 0
  ↓
Mid-attempt entitlement loss: LAYER 3/4/5 authority UNCHANGED (P2-007)
  ↓
ATTEMPT continues to completion
  ↓
Post-completion: next WORK_ORDER denied admission
```

**Case 8c: Entitlement policy requires interruption**
```
Canonical entitlement policy: "zero balance → suspend all work"
  ↓
Policy change detected
  ↓
Must emit separate EXECUTION_CANCELLATION (P2-007)
  ↓
Cannot silently revoke LAYER 3/4/5
  ↓
Cancellation propagated through ADR-036 lifecycle
```

### Failure Class Testing

| Failure Class | Result | Rationale |
|--------------|--------|-----------|
| DEADLOCK | SAFE | Admission denial is immediate; no blocking |
| LIVELOCK | SAFE | No loops |
| UNBOUNDED_WAIT | SAFE | Immediate response |
| CEREMONY_EXPLOSION | SAFE | Simple gate check |
| OWNER_PROMPT_EXPLOSION | SAFE | Fully autonomous |
| AUTHORITY_LEAK | SAFE | Credits never touch L2-L5 |
| STALE_AUTHORITY | SAFE | Mid-attempt authority unaffected by credit changes |
| DOUBLE_EFFECT | SAFE | Single admission gate |
| LOST_EFFECT | SAFE | In-progress work protected |
| FALSE_CLOSURE | SAFE | Verification separate from credits |
| FALSE_BLOCKER | SAFE | Entitlement denial is correct refusal |
| SPLIT_BRAIN | SAFE | Single economic state |
| CROSS_PROJECT_CONTAMINATION | SAFE | Per-project economy |
| UNRECOVERABLE_STATE | SAFE | Economic state durable |
| AUTONOMY_STALL | SAFE | Fully autonomous |

### Finding: NONE

All three cases behave correctly. The orthogonal separation of AUTHORITY × ENTITLEMENT × CREDITS (P2-007) ensures that:
- Pre-admission: entitlement can deny without touching authority
- Mid-attempt: authority continues independently of credit changes
- Policy-driven interruption: requires explicit cancellation, not silent revocation

**Classification: SYSTEM_SAFE**

---

## SCENARIO 9: CROSS-PROJECT CONTRIBUTION

### Setup

Project A validates and contributes a component C to the Pool. Project B discovers and uses C. Later, C is DEPRECATED or security-invalidated.

### Canonical State Transition Sequence

```
Project A: validates component C → CONTRIBUTION_CANDIDATE approved
  ↓
C added to POOL_COMPONENT with lifecycle_state = PUBLISHED
  ↓
Project B: queries Pool → discovers C → creates LOCAL_ASSET reference
  ↓
Project B: admits WORK_ORDER using C → LAYER 3 envelope includes C reference
  ↓
[cross-project authority: ADR-050 contribution path]
  ↓
[Time passes] C flagged for security issue
  ↓
Project A: emits POOL_DEPRECATE or POOL_REMOVE for C
  ↓
Pool entry lifecycle_state → DEPRECATED or REMOVED
  ↓
Project B's local reference to C: still valid in its LAYER 3 envelope
  ↓
[No automatic revocation of Project B's authority]
  ↓
New WORK_ORDERS by Project B: C not discoverable (removed from pool)
  ↓
If legal/security invalidation: downstream re-evaluation via ADR-033
```

### Failure Class Testing

| Failure Class | Result | Rationale |
|--------------|--------|-----------|
| DEADLOCK | SAFE | Pool mutations don't block execution |
| LIVELOCK | SAFE | No loops |
| UNBOUNDED_WAIT | SAFE | Immediate |
| CEREMONY_EXPLOSION | ⚠️ NOTED | Contribution requires: validation (ADR-042) + approval (CONTRIBUTION_CANDIDATE) + pool insertion + cross-project reference + later deprecation + discovery update |
| OWNER_PROMPT_EXPLOSION | SAFE | Autonomous contribution path |
| AUTHORITY_LEAK | SAFE | Pool entries carry NO execution fields (ADR-049) |
| STALE_AUTHORITY | ⚠️ POTENTIAL | Project B's existing LAYER 3 envelope references a deprecated/removed component. Per P2-009, ordinary pool lifecycle events do NOT revoke existing authority. But if the deprecation is due to a SECURITY_INVALIDATION, the impact evaluation (P2-008 Path B) should trigger revocation. The boundary between "ordinary deprecation" and "security invalidation" must be clear. |
| DOUBLE_EFFECT | SAFE | Single contribution, single usage |
| LOST_EFFECT | SAFE | Durable state |
| FALSE_CLOSURE | SAFE | Verification per-asset |
| FALSE_BLOCKER | SAFE | Removed components simply not discoverable |
| SPLIT_BRAIN | SAFE | Single canonical pool state |
| CROSS_PROJECT_CONTAMINATION | ⚠️ RISK | If Project A's contribution was contaminated (malicious or erroneous), Project B inherits it. The validation tier (VALIDATED/CERTIFIED/REJECTED per ADR-042) is supposed to prevent this, but a CERTIFIED contaminated contribution would propagate. |
| UNRECOVERABLE_STATE | SAFE | Pool mutations audit-chained |
| AUTONOMY_STALL | SAFE | Autonomous |

### Finding: SECURITY_INVALIDATION vs DEPRECATION BOUNDARY

**Severity:** MEDIUM — P2-009 distinguishes ordinary pool lifecycle events from legal/security invalidation, but the architecture doesn't specify how a POOL_REMOVE triggered by a security finding differs from one triggered by administrative deprecation. Both result in REMOVED lifecycle state. The downstream impact (re-evaluation vs. no action) depends on the REMOVAL_REASON, not the POOL_REMOVE event itself.

**Minimal repair:** Add `removal_reason` to the POOL_ENTRY envelope:
```
POOL_ENTRY.removed_by: ORDINARY_DEPRECIATION | SECURITY_INVALIDATION | LEGAL_COMPLIANCE
```
Security invalidation triggers Path B impact evaluation (P2-008). Ordinary depreciation triggers Path A (no runtime effect).

**Falsification:** If all removals trigger re-evaluation, ordinary deprecation causes unnecessary disruption. If only security removals trigger re-evaluation, the classification must be accurate and auditable.
**Classification: SYSTEM_CLARIFICATION_NEEDED**

### Finding: CONTRIBUTION_CONTAMINATION_PROPAGATION

**Severity:** LOW — The validation tier system (ADR-042) is designed to prevent this. CERTIFIED contributions have passed bounded certification. If a CERTIFIED contribution is later found contaminated, the certification process itself is the defect. This is a process failure, not an architecture failure.
**Classification: SYSTEM_SAFE**

---

## SCENARIO 10: ORCHESTRATOR RECOVERY

### Setup

Orchestrator crashes at each of 6 boundary points. Test recovery for double effects and false closure.

### Boundary-by-Boundary Analysis

#### 10a: Crash AFTER admission, BEFORE attempt starts
```
State at crash: WORK_ORDER ADMITTED, ATTEMPT not created
Recovery: Reconstruct from durable state (ADR-027). WORK_ORDER still ADMITTED.
Action: Re-evaluate L4, create ATTEMPT, proceed normally.
Double effect? NO — no attempt was created.
False closure? NO — no attempt completed.
```
**Classification: SYSTEM_SAFE**

#### 10b: Crash AFTER L4 evaluation, BEFORE L5 materialization
```
State at crash: L4 = ALLOW, no L5 permissions
Recovery: Re-derive L5 from L3 envelope. L4 evaluation is stateless (computed from current state).
Action: Re-evaluate L4 (still ALLOW, unless state changed), materialize L5, proceed.
Double effect? NO — no permissions were materialized.
False closure? NO.
```
**Classification: SYSTEM_SAFE**

#### 10c: Crash AFTER L5 materialization, BEFORE attempt executes
```
State at crash: L5 = PERMISSIONS, no execution started
Recovery: Re-derive L5 (same input → same output, deterministic). Proceed.
Action: Acquire lease (new fencing token), execute.
Double effect? NO — lease acquisition is idempotent; new attempt created.
False closure? NO.
```
**Classification: SYSTEM_SAFE**

#### 10d: Crash AFTER attempt executes, BEFORE verification
```
State at crash: Artifact produced, no verification
Recovery: Reconstruct attempt state. Artifact exists on disk.
Action: Create verification record slot, run independent verification.
Double effect? NO — single artifact.
False closure? NO — verification required before closure.
```
**Classification: SYSTEM_SAFE**

#### 10e: Crash AFTER verification APPROVED, BEFORE decision/closure
```
State at crash: VERIFICATION_RECORD(APPROVED), no Decision
Recovery: Verify verification record exists and is valid. Apply Decision.
Action: Evaluate acceptance criteria, issue Decision, close Task.
Double effect? NO — verification record is append-only.
False closure? NO — explicit Decision required.
```
**Classification: SYSTEM_SAFE**

#### 10f: Crash AFTER integration/proposal, BEFORE audit record
```
State at crash: Integration executed, audit event not yet persisted
Recovery: Check audit chain. If integration executed without audit record → reconstruct from observable side effects + idempotency keys.
Action: Emit retrospective audit event. Close Task.
Double effect? RISK — if integration was applied but audit not persisted, recovery might re-apply. Idempotency key prevents re-application.
False closure? NO — closure requires audit record.
```
**Classification: SYSTEM_SAFE** (idempotency keys + audit chain preserve safety)

### Aggregate Failure Class Testing

| Failure Class | Result |
|--------------|--------|
| DEADLOCK | SAFE | Recovery always proceeds; no blocking condition |
| LIVELOCK | SAFE | Single crash recovery path |
| UNBOUNDED_WAIT | SAFE | Recovery bounded; no infinite loop |
| DOUBLE_EFFECT | SAFE | Idempotency keys at every effect boundary (ADR-040) |
| FALSE_CLOSURE | SAFE | Every closure requires explicit Decision + Verification + Audit |
| SPLIT_BRAIN | SAFE | Single Orchestrator; state reconstructed from durable record |

### Finding: RECOVERY_IDEMPOTENCY_DEPENDENCE

**Severity:** LOW — Recovery correctness depends on idempotency keys at ALL effect boundaries (ADR-040). If any boundary lacks an idempotency key, a crash-recovery cycle could produce a double effect. The architecture specifies idempotency keys for WORK_ORDER, provider/tool call, lease, graph mutation, integration proposal, verification verdict, audit event, and reconnect replay — but ADR-026's Resource Claims and ADR-038's Integration Proposal could have additional effect boundaries not covered.

**Minimal repair:** Add to ADR-040's Effect Boundaries table:
| Boundary | Identity | Owner |
|----------|----------|-------|
| Resource claim grant | `claim_id` | Lease Service |
| Integration effect | `integration_proposal_id` | Authorizer |

**Falsification:** If Resource Claim grant lacks idempotency, a crash between lease grant and audit could re-grant the same lease, allowing concurrent access. The fencing token prevents concurrent writes but not concurrent lease grants. Adding claim_id as identity closes this gap.
**Classification: SYSTEM_CLARIFICATION_NEEDED**

---

## CROSS-CUTTING ANALYSIS

### Safety Mechanism Composition Failures

**1. Redundant Authority Evaluation**
L4 evaluation occurs at: admission, retry approval, reconnect revalidation, and per-attempt. Each is necessary and bounded. No redundancy found.

**2. Redundant Verification**
Verification per ADR-035 requires independent reviewer. P2-003 artifact-bound reuse avoids re-verification for identical artifacts. No unnecessary redundancy.

**3. Circular Prerequisites**
Authority → Verification → Decision → Graph mutation → READY re-evaluation → new Work Orders. Linear, not circular. No circular prerequisites.

**4. Duplicate State Ownership**
Each state category has a single owner (ADR-030 State Ownership Contract): DPT canonical state owned by DPT, Project Intelligence owned by project, Front operational state owned by Front Agent. No duplication.

**5. Excessive Persistent Records**
Records per scenario: L3 envelope, L5 materialization, VERIFICATION_RECORD, AUDIT_EVENT, GRAPH_MUTATION_RECORD, ECONOMY_MUTATION_RECORD, POOL_MUTATION_RECORD. Each serves a distinct governance domain. No unnecessary records.

**6. Unnecessary Agents where Services suffice**
ADR-029 determinism routing ensures deterministic evaluation uses SERVICE, not AGENT_INSTANCE. L4 evaluation is SERVICE. Verification routing uses SERVICE for deterministic, AGENT_INSTANCE for ambiguous. No unnecessary agent spawning.

---

## SUMMARY OF FINDINGS

| # | Scenario | Finding | Severity | Classification |
|---|----------|---------|----------|---------------|
| F-301 | S2 | Over-conservative claim model serializes parallel work unnecessarily | LOW | SYSTEM_CLARIFICATION_NEEDED |
| F-302 | S3 | Partial-side-effect compensation undefined for mid-attempt failure | MEDIUM | SYSTEM_CLARIFICATION_NEEDED |
| F-303 | S5 | Impact evaluation mechanism for decision supercession under Path B undefined | HIGH | SYSTEM_REVISION_CANDIDATE |
| F-304 | S6 | Post-verification defect reuse creates false closure gap | HIGH | SYSTEM_REVISION_CANDIDATE |
| F-305 | S7 | Blind spot to external changes without periodic refresh safety net | MEDIUM | SYSTEM_CLARIFICATION_NEEDED |
| F-306 | S9 | Security invalidation vs. ordinary deprecation boundary unclear | MEDIUM | SYSTEM_CLARIFICATION_NEEDED |
| F-307 | S10 | Recovery idempotency gaps at Resource Claim and Integration boundaries | LOW | SYSTEM_CLARIFICATION_NEEDED |

**Total:** 7 findings. 2 REVISION_CANDIDATE, 5 CLARIFICATION_NEEDED, 0 SAFE disapproved. 0 STRUCTURAL_SIMPLIFICATION, 0 SUPERSESSION.

### Safest-But-Broken Candidates (highest risk if misimplemented)

1. **F-303 (S5 Path B):** Without explicit impact evaluation, decision supercession could silently leave work running under invalidated authority — violating the cross-cutting invariant.
2. **F-304 (S6):** Post-verification defect reuse is a direct false-closure vector. The artifact hash is the same, but the verification assumptions were incomplete for the defect class.

### Simplest Repairs

1. **F-301:** Clarify that WRITE lease implies READ compatibility for concurrent lease holders (one fence covers both).
2. **F-302:** Define `COMPENSATION_REQUIRED` state flag for non-idempotent side effects.
3. **F-303:** Add explicit impact-evaluation rule to ADR-043 linking SUPERSEDED to Revocation/Cancellation emission.
4. **F-304:** Add temporal comprehensiveness check to P2-003 verification reuse rule.
5. **F-305:** Add periodic max-age expiration to ADR-046 freshness safety net.
6. **F-306:** Add `removal_reason` field to POOL_ENTRY envelope distinguishing security invalidation from ordinary deprecation.
7. **F-307:** Add claim_id and integration_proposal_id to ADR-040's effect boundaries table.

All repairs are additive clarifications or minor schema additions. None change the five-layer authority stack, decision lifecycle, or cross-cutting invariant.

---

## PHASE 3 BOUNDARY STATEMENT

Phase 3 system-level falsification complete. 7 findings identified across 10 adversarial scenarios. All failures are in the domain of underspecified operational contracts (impact evaluation, compensation, freshness safety nets, removal reason classification, recovery idempotency). No structural architectural defects found. The five-layer authority stack, two-plane separation, and cross-cutting invariant all hold under adversarial stress.

Standing at: Phase 3 architecture-discussion boundary. No canonical mutation required for the 5 CLARIFICATION_NEEDED findings (they are specification gaps, not contradictions). The 2 REVISION_CANDIDATE findings (F-303, F-304) require explicit rule definitions but not structural changes.

NO ADR mutation. Stop at architecture-discussion boundary.
