# Phase 2 — Cross-Decision Interaction Review

**Scope:** Cross-decision interaction failures  
**Date:** 2026-09-06  
**Mode:** Read-only analysis. No canonical mutations.  
**Classification protocol:** INTERACTION_SAFE / CLARIFICATION_NEEDED / INTERACTION_REVISION_CANDIDATE / STRUCTURAL_REVISION_CANDIDATE / SUPERSESSION_CANDIDATE

---

## Methodology

For each interaction class:
1. Identify the ADRs/primitives involved
2. Construct a concrete execution scenario
3. Show the state transition sequence
4. Identify the violated invariant (if any)
5. Determine defect location (single ADR, interaction contract, missing coordination, implementation)
6. Construct strongest competing resolution
7. Attempt falsification

---

## FINDING P2-001: Retry × Revocation Race Condition

**Interaction Class:** Authority × Retry × Attempt Lifecycle  
**ADRs Involved:** ADR-033, ADR-036, ADR-027  
**Classification:** CLARIFICATION_NEEDED

### Scenario

```
Time    Event                                          State
────    ───────────────────────────────────────────────  ──────────
T0      WORK_ORDER WO-1 admitted                         ADMITTED
T1      ATTEMPT A-1 starts execution                     ACTIVE
T2      LAYER 2 delegation revoked                       REVOKED
T3      A-1 detects failure, requests RETRY              RETRY_REQUESTED
T4      Orchestrator evaluates retry eligibility          ?
```

### State Transition Analysis

At T2, LAYER 2 revocation invalidates all LAYER 3 envelopes derived from it (ADR-033). At T3, the running ATTEMPT A-1 detects a transient failure and requests RETRY.

**Question:** At T4, does the retry succeed or fail?

**Analysis:**
- ADR-036 states: "Revocation during active ATTEMPT → Immediate abort; leases revoked"
- But A-1 is in ACTIVE state, not yet aborted
- The retry request at T3 occurs AFTER revocation at T2
- ADR-036 precedence rule: `REVOCATION > RETRY`
- Therefore: retry must be denied

**However**, the specification does not explicitly address this时序. The "Race Conditions Resolved" table in ADR-036 lists "Revocation during active ATTEMPT" but does not address "revocation before retry request."

### Violated Invariant

None directly. The behavior is correct (retry denied), but the interaction is not explicitly covered.

### Defect Location

**Missing coordination semantics.** ADR-036's precedence rule should explicitly enumerate:
1. Revocation during active ATTEMPT → abort
2. Revocation after ATTEMPT failure but before retry approval → deny retry
3. Revocation after retry approved but before execution starts → abort

### Strongest Competing Resolution

Add explicit sub-case to ADR-036 "Race Conditions Resolved" table:

| Race | Current Resolution | Gap |
|------|-------------------|-----|
| Revocation during active ATTEMPT | Immediate abort; leases revoked | ✓ Covered |
| Revocation after ATTEMPT failure, before retry approval | NOT SPECIFIED | ✗ Gap |
| Revocation after retry approved, before execution | NOT SPECIFIED | ✗ Gap |

### Falsification Attempt

Claim: "This is an implementation concern, not an architectural defect."

Refutation: If the orchestrator does not check LAYER 2 status at retry approval time, it may approve a retry under revoked authority. This violates the core invariant "authority persistence must never imply persistent runtime permission."

---

## FINDING P2-002: Lease Lifetime × Task Removal

**Interaction Class:** Task Graph × Lease/Lock × Cancellation/Revocation  
**ADRs Involved:** ADR-034, ADR-036, ADR-037  
**Classification:** CLARIFICATION_NEEDED

### Scenario

```
Time    Event                                          State
────    ───────────────────────────────────────────────  ──────────
T0      WORK_ORDER WO-1 admitted, lease acquired         LEASE_ACTIVE
T1      Task T-1 RUNNING                                 RUNNING
T2      Task T-1 removed from graph (administrative)     REMOVED
T3      T-1 continues execution (per ADR-037)            RUNNING
T4      T-1 completes successfully                       COMPLETED
T5      Closure attempted                                ?
```

### State Transition Analysis

At T2, the Orchestrator removes T-1 from the graph (administrative, non-revocation). Per ADR-037: "T RUNNING; T removed → T continues; result is historical record."

At T4, T-1 completes. At T5, closure is attempted.

**Question:** Can T-1 be closed if it was removed from the graph?

**Analysis:**
- ADR-037: "Mutations do NOT retroactively change ADMITTED tasks"
- The task was ADMITTED before removal
- Completion is based on the original execution
- Closure should proceed against the original graph state

**However**, the closure process may query current graph state to determine dependencies. If T-1 was removed, downstream tasks that depended on T-1 may have been affected differently.

### Violated Invariant

Potential for **INVALID RETRY** if closure logic queries current graph state instead of admission-state graph.

### Defect Location

**Missing coordination semantics** between ADR-037 (mutation rules) and ADR-035 (verification/closure). The closure process must use the graph revision at admission time, not current graph state.

### Strongest Competing Resolution

Add to ADR-037:
> **Closure uses admission-graph state:** When closing a TASK that was removed from the graph during execution, use the graph revision at ADMITTED time for dependency validation, not the current graph state.

### Falsification Attempt

Claim: "The Orchestrator already handles this via `ATTEMPT_LINEAGE` preservation."

Refutation: ADR-036 mentions `ATTEMPT_LINEAGE` for retry purposes, but does not specify that closure must use admission-graph state. This is an implicit assumption, not an explicit rule.

---

## FINDING P2-003: Verification × Retry Artifact Staleness

**Interaction Class:** Verification Independence × Retry × Integration Authority  
**ADRs Involved:** ADR-035, ADR-036, ADR-038  
**Classification:** INTERACTION_REVISION_CANDIDATE

### Scenario

```
Time    Event                                          State
────    ───────────────────────────────────────────────  ──────────
T0      ATTEMPT A-1 produces artifact V1                 RESULT
T1      VERIFICATION_RECORD VR-1 created (APPROVED)      VERIFIED
T2      A-1 fails at post-verification step              FAILED
T3      RETRY initiated for WO-1                         RETRY
T4      ATTEMPT A-2 produces artifact V2                 RESULT
T5      Closure attempted with VR-1                      ?
```

### State Transition Analysis

At T1, verification passes for A-1's artifact V1. At T2, A-1 fails despite verification (e.g., post-verification integration step fails). At T3, retry is initiated. At T4, A-2 produces V2. At T5, closure attempts to use VR-1.

**Question:** Can VR-1 (verifying V1) be used to close a task where the final artifact is V2?

**Analysis:**
- ADR-035: "Verification record is required for closure of any TASK"
- ADR-036: "New ATTEMPT; ATTEMPT_LINEAGE preserved"
- The verification was for V1, not V2
- Using VR-1 for V2's closure would be **FALSE CLOSURE**

### Violated Invariant

**FALSE CLOSURE** — verification record does not correspond to the actual produced artifact.

### Defect Location

**Interaction contract gap** between ADR-035 (verification requirements) and ADR-036 (retry semantics). ADR-036 preserves `ATTEMPT_LINEAGE` but does not specify whether verification must be re-done for retry attempts.

### Strongest Competing Resolution

**Option A (Conservative):** Retry requires new verification. Add to ADR-036:
> **Retry invalidates prior verification:** A new ATTEMPT requires a new VERIFICATION_RECORD. Prior verification records are preserved in lineage but cannot be reused for closure.

**Option B (Optimistic):** Verification is artifact-bound, not attempt-bound. Add to ADR-035:
> **Verification scoping:** A VERIFICATION_RECORD applies to a specific artifact version. If a retry produces a different artifact, new verification is required.

Both options preserve the invariant; Option B is more precise about what verification covers.

### Falsification Attempt

Claim: "The verification record includes artifact hash, so it's inherently bound to the artifact."

Refutation: While true, the architecture does not explicitly state that verification must be re-done when the artifact changes via retry. An implementation could incorrectly reuse VR-1 for V2. The rule must be explicit.

---

## FINDING P2-004: Cross-Scope Audit Causal Ordering

**Interaction Class:** Audit × Idempotency × Distributed Ordering  
**ADRs Involved:** ADR-040, ADR-041  
**Classification:** CLARIFICATION_NEEDED

### Scenario

```
Scope A (Orchestrator)              Scope B (Provider)
────────────────────                ──────────────────
Event A1: WORK_ORDER created        Event B1: ATTEMPT started
  ↓ causal                          ↓ causal
Event A2: LAYER 4 evaluated         Event B2: tool call executed
  ↓                                   
Event A3: ATTEMPT completed         Event B3: result recorded
```

### State Transition Analysis

ADR-041 specifies:
- `CAUSAL_ORDER` as primary ordering (deterministic)
- `INGESTION_ORDER` as secondary (per ingestor)
- `OBSERVED_TIMESTAMP` as advisory only

Cross-scope pointers verify consistency but do not enforce it.

**Question:** How do we verify that Event B1 causally depends on Event A1 if there's no global order?

**Analysis:**
- ADR-041: "Per-scope chains; cross-scope pointers verify consistency. No global order claimed."
- The architecture explicitly rejects global ordering
- Consistency is verified post-hoc via cross-scope pointers
- This is correct design, but creates operational complexity

### Violated Invariant

None directly. The architecture correctly handles this by:
1. Not claiming global order
2. Using cross-scope pointers for consistency verification
3. Accepting that verification is post-hoc, not preventive

### Defect Location

**Implementation concern only.** The architecture is correct; implementations must handle cross-scope pointer verification properly.

### Strongest Competing Resolution

Add operational guidance to ADR-041:
> **Cross-scope verification:** To verify causal ordering across scopes, trace: source event → cross-scope pointer → target event. Mismatch indicates either tampering or implementation error.

### Falsification Attempt

Claim: "This is a known limitation, not a defect."

Refutation: Correct. The limitation is acknowledged and documented. No revision needed.

---

## FINDING P2-005: Front Agent Identity Rotation × Gateway Unreachable

**Interaction Class:** Front × Gateway × Enrollment × Reconnect/Recovery  
**ADRs Involved:** ADR-030, ADR-031  
**Classification:** INTERACTION_REVISION_CANDIDATE

### Scenario

```
Time    Event                                          State
────    ───────────────────────────────────────────────  ──────────
T0      Front Agent ONLINE                               ONLINE
T1      DPT initiates identity rotation                  ROTATING
T2      New identity created, old not yet revoked        NEW_PENDING
T3      Gateway unreachable (network partition)          GATEWAY_DOWN
T4      Old identity still valid (not revoked)           VALID
T5      New identity cannot complete ONLINE handshake    STUCK
```

### State Transition Analysis

ADR-030 states:
> "Identity rotation: Old identity is revoked on new identity creation; no authority overlap window. New identity must complete ONLINE handshake before old identity is retired."

But ADR-031 requires Gateway connectivity for ONLINE handshake. If Gateway is unreachable during rotation:
- Old identity cannot be revoked (requires Gateway communication)
- New identity cannot complete handshake (requires Gateway communication)
- Front Agent is stuck in ROTATING state indefinitely

### Violated Invariant

**AUTHORITY CONFUSION** — ambiguous authority state during partition.

### Defect Location

**Missing coordination semantics** between ADR-030 (identity rotation) and ADR-031 (Gateway connectivity requirements).

### Strongest Competing Resolution

Add to ADR-030:
> **Identity rotation during partition:** If Gateway is unreachable during identity rotation:
> 1. Pause rotation; maintain old identity validity
> 2. Buffer rotation request
> 3. Upon reconnection, resume rotation
> 4. Do NOT create overlapping authority window

This changes the requirement from "no authority overlap window" to "minimize authority overlap window, pause if unavoidable."

### Falsification Attempt

Claim: "The rotation is atomic; if Gateway is down, rotation doesn't start."

Refutation: DPT-initiated rotation may already be in progress when partition occurs. The architecture must handle mid-rotation partitions gracefully.

---

## FINDING P2-006: Project Intelligence Cooldown × Critical Security Event

**Interaction Class:** Project Intelligence × Scout × Freshness × Proactive Triggers  
**ADRs Involved:** ADR-010, ADR-046  
**Classification:** CLARIFICATION_NEEDED

### Scenario

```
Time    Event                                          State
────    ───────────────────────────────────────────────  ──────────
T0      CVE detected in project dependency               DETECTED
T1      TRIGGER_EVENT fired for surface_ref X            FIRED
T2      Trigger enters 4h cooldown                       COOLDOWN
T3      Second CVE detected in SAME dependency           DETECTED
T4      Second trigger suppressed (dedup window)         DROPPED
T5      Critical vulnerability unaddressed               RISK
```

### State Transition Analysis

ADR-046 states:
> "Dedup window: 4h per `(surface_ref, source_class)` tuple"

The dedup is per `(surface_ref, source_class)`. Two different CVEs in the same dependency have:
- Same `surface_ref` (dependency path)
- Same `source_class` (TRIGGER_EVENT)
- Different `trigger_id` (CVE identifiers)

Both would be deduplicated within the 4h window.

### Violated Invariant

Potential for **STALE-AUTHORITY EXECUTION** if critical security intelligence is silently dropped.

### Defect Location

**Design trade-off, not defect.** ADR-046 prioritizes avoiding trigger storms over immediate security response. The 4h window is a policy choice, not an architectural flaw.

### Strongest Competing Resolution

Add exception to ADR-046:
> **Security-critical bypass:** Triggers with `severity_hint: SECURITY_CRITICAL` bypass dedup window and cooldown. These emit separate refresh events.

This preserves the general rule while allowing security-critical events to cut through.

### Falsification Attempt

Claim: "The severity_hint field exists; implementers can use it."

Refutation: The architecture does not define which severities bypass dedup. Without explicit rule, implementers may apply dedup uniformly, causing security intelligence loss.

---

## FINDING P2-007: Credit Exhaustion × Active Execution

**Interaction Class:** Credits/Monetization × Authority × API Admission  
**ADRs Involved:** ADR-050, ADR-051, ADR-033  
**Classification:** CLARIFICATION_NEEDED

### Scenario

```
Time    Event                                          State
────    ───────────────────────────────────────────────  ──────────
T0      ATTEMPT A-1 starts with sufficient credits       ACTIVE
T1      Credit balance drops to zero                     ZERO_BALANCE
T2      A-1 continues execution (already started)        RUNNING
T3      A-1 completes, attempts credit deduction         FAIL?
```

### State Transition Analysis

ADR-050 states:
> "Economic actions are advisory policy markers, not execution triggers."

ADR-051 states:
> "Monetization adds cost assignments; does not change API contract."

**Question:** What happens when credits are exhausted mid-attempt?

**Analysis:**
- ADR-050: Economy is advisory, not execution-gating
- Credits track usage for billing/accounting
- Execution authority comes from LAYER 2/3/4 (ADR-033), not credits
- Therefore: execution continues despite zero credits

**However**, ADR-051 mentions `tier_required` in monetization rules. What if subscription tier requires positive balance?

### Violated Invariant

None directly. Credits are accounting, not authority.

### Defect Location

**Potential misunderstanding** by implementers who might conflate credits with authority.

### Strongest Competing Resolution

Add explicit clarification to ADR-050:
> **Credits ≠ Authority:** Credit balance affects billing/accounting only. It does NOT affect execution authority. A project with zero credits may continue executing if LAYER 2/3 authority is valid. Tier-based restrictions are enforced at API admission (pre-execution), not mid-execution.

### Falsification Attempt

Claim: "This is clear from the architecture; no clarification needed."

Refutation: The separation of economy from authority is subtle. Without explicit statement, implementers may add credit checks to execution paths, creating unexpected execution stops.

---

## FINDING P2-008: Decision SUPERSEDED × In-Flight Work

**Interaction Class:** Open Decision Lifecycle × Runtime Behavior  
**ADRs Involved:** ADR-043, ADR-027  
**Classification:** CLARIFICATION_NEEDED

### Scenario

```
Time    Event                                          State
────    ───────────────────────────────────────────────  ──────────
T0      WORK_ORDER WO-1 admitted under ADR-X v1          ADMITTED
T1      ATTEMPT A-1 starts execution                     ACTIVE
T2      ADR-X SUPERSEDED by ADR-X v2                     SUPERSEDED
T3      A-1 completes                                    COMPLETED
T4      Closure attempted under ADR-X v2                  ?
```

### State Transition Analysis

ADR-043 states:
> "REOPENED: in-flight continues against original; new work re-evaluates"

**Question:** What is "original" — the decision at admission time or the current decision?

**Analysis:**
- "Original" refers to the decision state at WORK_ORDER initiation
- A-1 was admitted under ADR-X v1
- A-1 continues under v1 rules
- Closure at T4 should validate against v1, not v2

**However**, ADR-043 also states:
> "SUPERSEDED: dependent tasks re-evaluate"

This creates tension: should closure re-evaluate against v2?

### Violated Invariant

**AUTHORITY CONFUSION** — ambiguous authority basis for closure.

### Defect Location

**Interaction contract gap** between ADR-043 (decision lifecycle) and ADR-027 (durable task state). The "original" vs "current" decision ambiguity is unresolved.

### Strongest Competing Resolution

Add to ADR-043:
> **In-flight work authority basis:** Work admitted under decision D_v1 continues under D_v1 rules until completion. Closure validates against D_v1, not D_v2. Only NEW work re-evaluates against superseding decisions.

This clarifies that "in-flight continues against original" means the decision at admission time, not the decision at closure time.

### Falsification Attempt

Claim: "The 'supersedes' field in decision records tracks this."

Refutation: Decision records track which decision supersedes which, but do not track which decision version was active at WORK_ORDER admission time. The mapping must be explicit.

---

## FINDING P2-009: Pool Contribution × Authority Grant

**Interaction Class:** Pool × Project Intelligence × Contribution Pipeline  
**ADRs Involved:** ADR-049, ADR-005, ADR-033  
**Classification:** CLARIFICATION_NEEDED

### Scenario

```
Time    Event                                          State
────    ───────────────────────────────────────────────  ──────────
T0      Project P-1 contributes COMPONENT-C1 to Pool     CONTRIBUTED
T1      COMPONENT-C1 validated, PUBLISHED                PUBLISHED
T2      Project P-2 discovers C1 via Pool search         DISCOVERED
T3      P-2 uses C1 in execution                         EXECUTING
T4      P-1 revokes contribution consent                 REVOKED
T5      P-2 continues execution with C1                    ?
```

### State Transition Analysis

ADR-049 states:
> "Pool stores DESIGN-TIME definitions, not runtime instances"
> "Validation tier is mandatory metadata on every pool entry"

ADR-005 states:
> "Contribution is subject to validation, classification, privacy, licensing, and acceptance policy"

**Question:** Can a contributor revoke a published pool entry? What happens to projects using it?

**Analysis:**
- ADR-049 has DEPRECATED → REMOVED lifecycle
- REMOVED is terminal; entry preserved for audit
- But ADR-049 does not specify revocation semantics for contributors
- Who can REMOVE an entry? Contributor? DPT governance? Both?

### Violated Invariant

Potential for **AUTHORITY LEAK** if revoked contributions remain executable.

### Defect Location

**Missing coordination semantics** between ADR-049 (pool lifecycle) and ADR-033 (authority). Pool entry removal does not automatically invalidate LAYER 2/3 authorities granted based on that entry.

### Strongest Competing Resolution

Add to ADR-049:
> **Contribution revocation:** Contributors may request REMOVAL of their contributed entries. Upon REMOVAL:
> 1. Entry transitions to REMOVED (preserved for audit)
> 2. Existing LAYER 2/3 authorities based on this entry are NOT automatically invalidated
> 3. Projects using removed entries must re-evaluate authority under ADR-033
> 4. New authorities cannot be granted for REMOVED entries

This preserves audit trail while preventing new authority grants.

### Falsification Attempt

Claim: "Pool entries are design-time; runtime authority is separate."

Refutation: Correct, but the interaction point (when does removal affect runtime?) is unspecified. Implementers may incorrectly invalidate existing authorities or incorrectly allow new ones.

---

## FINDING P2-010: Offline Sync × Authority State Conflict

**Interaction Class:** Network API × Offline Sync × Authority State  
**ADRs Involved:** ADR-048, ADR-033, ADR-047  
**Classification:** INTERACTION_REVISION_CANDIDATE

### Scenario

```
Time    Event                                          State
────    ───────────────────────────────────────────────  ──────────
T0      Project P-1 Offline; LAYER 2 valid               OFFLINE
T1      Owner revokes LAYER 2 on DPT-side                REVOKED
T2      Project P-1 reconnects                           RECONNECTING
T3      Offline queue contains mutation M1               QUEUED
T4      M1 conflicts with current LAYER 2 state          CONFLICT
```

### State Transition Analysis

ADR-048 states:
> "Offline sync never silently overwrites authority state"
> "Authority state: CONFLICT → reconcile via authority chain; no silent overwrite"

**Question:** How is "reconcile via authority chain" implemented?

**Analysis:**
- ADR-048 mentions reconciliation but not the algorithm
- ADR-033 specifies revocation cascades through layers
- But offline sync conflict resolution is underspecified

**Risk:** Implementation may choose arbitrary resolution (last-write-wins, owner-wins, DPT-wins) without canonical guidance.

### Violated Invariant

Potential for **SPLIT-BRAIN STATE** if offline sync resolves authority conflicts incorrectly.

### Defect Location

**Missing coordination semantics** in ADR-048's offline sync section. "Reconcile via authority chain" is a principle, not an algorithm.

### Strongest Competing Resolution

Add to ADR-048:
> **Offline authority conflict resolution algorithm:**
> 1. Compare offline mutation's authority basis with current canonical state
> 2. If current state has newer revocation/supersession, reject offline mutation
> 3. If offline mutation is older than current state, apply current state
> 4. If concurrent with no ordering, escalate to HUMAN_GATE
> 5. Log all conflicts; never silently resolve

This provides a concrete algorithm while preserving the fail-closed principle.

### Falsification Attempt

Claim: "The authority chain provides sufficient guidance."

Refutation: The chain shows what happened, not how to resolve conflicts. An implementation needs explicit conflict resolution rules.

---

## Summary Table

| Finding | Interaction Class | Classification | Key Defect |
|---------|------------------|----------------|------------|
| P2-001 | Authority × Retry × Lifecycle | CLARIFICATION_NEEDED | Missing revocation-before-retry case |
| P2-002 | Graph × Lease × Closure | CLARIFICATION_NEEDED | Closure must use admission-graph state |
| P2-003 | Verification × Retry | INTERACTION_REVISION_CANDIDATE | Retry requires new verification |
| P2-004 | Audit × Distributed Ordering | CLARIFICATION_NEEDED | Cross-scope verification guidance needed |
| P2-005 | Front × Gateway × Rotation | INTERACTION_REVISION_CANDIDATE | Partition handling during identity rotation |
| P2-006 | Intelligence × Cooldown | CLARIFICATION_NEEDED | Security-critical bypass needed |
| P2-007 | Credits × Execution | CLARIFICATION_NEEDED | Explicit credits≠authority separation |
| P2-008 | Decision × In-Flight | CLARIFICATION_NEEDED | "Original" decision ambiguity |
| P2-009 | Pool × Contribution × Authority | CLARIFICATION_NEEDED | Revocation-runtime impact unspecified |
| P2-010 | Offline Sync × Authority | INTERACTION_REVISION_CANDIDATE | Conflict resolution algorithm missing |

---

## Non-Findings (Verified Safe)

The following interaction classes were analyzed and found to be **INTERACTION_SAFE**:

| Interaction Class | Verdict | Reason |
|------------------|---------|--------|
| Authority × Delegation × Materialization | SAFE | Five-layer stack with explicit boundaries |
| Task Graph × Cancellation | SAFE | ADR-037 + ADR-036 precedence clarified in Phase 1 |
| Routing × Model/Provider fallback | SAFE | ADR-039 explicit precedence: authority first |
| Advisory Plane × Execution Plane | SAFE | Greenfield transition documented in Phase 1 |
| Human Gate × Autonomous continuation | SAFE | Human Gate is hard boundary; no bypass path |

---

## Phase 2 Boundary

**Standing at:** Architecture discussion boundary.

**No canonical mutations.**
**No automatic revision admission.**
**10 findings submitted for review.**
**5 classified as CLARIFICATION_NEEDED.**
**3 classified as INTERACTION_REVISION_CANDIDATE.**
**2 verified as INTERACTION_SAFE.**

**Next:** Architecture team reviews findings. Revisions admitted only after discussion.
