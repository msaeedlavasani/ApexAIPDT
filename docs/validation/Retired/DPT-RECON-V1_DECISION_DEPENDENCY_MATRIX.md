# Open Decision → V1 Dependency Matrix

**Date**: 2026-09-04
**Purpose**: Reconcile canonical open-decision backlog (DPT_OPEN_DECISIONS.md) with V1 roadmap tasks.
**Classification**: MAJOR_VERSION_PHASE_TRANSITION_DEFECT (repaired)

## V1 Roadmap Items

| # | Task | Task ID |
|---|---|---|
| 1 | Provider-neutral orchestrator runtime | DPT-FOUNDATION-023 |
| 2 | Agent adapters | DPT-FOUNDATION-024 |
| 3 | Persistent project memory | DPT-FOUNDATION-025 |
| 4 | Workflow state management | DPT-FOUNDATION-026 |
| 5 | Quality-gate execution | DPT-FOUNDATION-027 |
| 6 | Human approval interface | DPT-FOUNDATION-028 |
| 7 | Freeze transport/persistence/deployment/topology/packaging | DPT-FOUNDATION-029 |

## Decision Dependency Matrix

### Priority 1 — Core Architecture

| OD | Decision | BLOCKING? | Scope | Rationale | Can V1 spec proceed? |
|---|---|---|---|---|---|
| OD-003 | Agent vs Skill boundary | **NON_BLOCKING_V1** | V1-024 (Agent adapters) | Spec can define boundary conceptually; exact classification deferred to V1 implementation evidence | YES — spec defines conceptual boundary, exact classification deferred |
| OD-004 | Front Agent lifecycle | **NON_BLOCKING_V1** | V1-024 (Agent adapters) | ADR-006, ADR-021 already accepted; spec documents accepted ADRs, adds lifecycle details for V1 evidence | YES — ADRs resolve core; spec adds V1-specific details |
| OD-005 | Gateway / Trust Boundary | **NON_BLOCKING_V1** | V1-024, V1-023 | ADR-007, ADR-008, ADR-021 already accepted; spec documents accepted boundary | YES — ADRs resolve core; spec adds V1-specific boundary details |
| OD-006 | Exact mode/entity state names | **TASK_LOCAL_BLOCKER** | V1-023 (Orchestrator) | ADR-020 accepts 6 modes; exact machine identifiers affect orchestrator runtime spec | SPEC PROCEEDS — ADR-020 bounds the decision; exact identifiers are V1 implementation |
| OD-007 | Authority persistence/evaluation | **NON_BLOCKING_V1** | All V1 tasks | ADR-019, Authority Model already accepted; spec documents accepted model, adds V1 persistence details | YES — Authority Model resolves core; spec adds V1 persistence details |
| OD-008 | Resource / ResourceClaim lock/lease | **TASK_LOCAL_BLOCKER** | V1-023 (Orchestrator), V1-026 (Workflow) | ADR-024, ADR-026 accepted; exact lock/lease semantics affect orchestrator scheduling spec | SPEC PROCEEDS — ADRs bound the contract; exact mechanics are V1 implementation |
| OD-009 | Verifier independence | **TASK_LOCAL_BLOCKER** | V1-027 (Quality-gate) | ADR-025 accepted; exact independence threshold affects quality-gate spec | SPEC PROCEEDS — ADR-025 bounds the contract; exact threshold is V1 evidence |
| OD-010 | Retry / cancellation / revocation | **TASK_LOCAL_BLOCKER** | V1-023 (Orchestrator) | No ADR yet; execution control model describes semantics conceptually | SPEC PROCEEDS — Execution Control Model bounds the decision; exact semantics are V1 implementation |
| OD-011 | Task DAG mutation | **TASK_LOCAL_BLOCKER** | V1-023 (Orchestrator) | No ADR yet; execution control model describes DAG conceptually | SPEC PROCEEDS — Execution Control Model bounds the decision; exact mutation rules are V1 implementation |
| OD-012 | Merge/integration ownership | **NON_BLOCKING_V1** | V1-023 (Orchestrator) | ADR-027 accepted; spec documents accepted decision, adds V1 integration details | YES — ADR-027 resolves core; spec adds V1-specific integration details |
| OD-013 | Routing taxonomy | **NON_BLOCKING_V1** | V1-024 (Agent adapters) | No ADR yet; spec can define routing dimensions conceptually | YES — spec defines routing dimensions; exact taxonomy deferred to V1 evidence |

### Execution-Control Register (OD-001 to OD-012)

| OD | Decision | Status | BLOCKING? | Scope | Rationale |
|---|---|---|---|---|---|
| OD-001 | Task Passport schema and lifecycle | BOUND at contract; runtime lifecycle OPEN | **NON_BLOCKING_V1** | V1-023 (Orchestrator) | DPT_TASK_SYSTEM.md (ADR-027) bounds the contract; runtime lifecycle is V1 implementation |
| OD-002 | Work Order contract formalization | BOUND at contract; serialization/transport OPEN | **NON_BLOCKING_V1** | V1-023 (Orchestrator) | ADR-027 bounds the contract; serialization is V1 implementation |
| OD-003 | Delta relationship to Work Order | BOUND at contract; storage mechanism OPEN | **NON_BLOCKING_V1** | V1-025 (Memory), V1-026 (Workflow) | ADR-027 bounds the contract; storage mechanism is V1 implementation |
| OD-004 | Task DAG scheduling algorithm | READY rule BOUND; scheduling algorithm OPEN | **NON_BLOCKING_V1** | V1-023 (Orchestrator), V1-026 (Workflow) | READY rule is deterministic per ADR-027; scheduling algorithm is V1 implementation |
| OD-005 | Runtime authority policy evaluation mechanism | BOUND: materialize-before-execute + preflight; mechanism OPEN | **NON_BLOCKING_V1** | All V1 tasks | ADR-019 + Execution Control Model bound the decision; mechanism is V1 implementation |
| OD-006 | Runtime intent intake format | OPEN | **NON_BLOCKING_V1** | V1-023 (Orchestrator) | Spec can define intake format conceptually; exact format deferred |
| OD-007 | Batch scheduling and subagent delegation | Delegation contract BOUND; batch scheduling OPEN | **NON_BLOCKING_V1** | V1-023 (Orchestrator) | Delegation contract bounded; batch scheduling is V1 implementation |
| OD-008 | Provider-neutral orchestrator runtime transport | OPEN | **NON_BLOCKING_V1** | V1-023 (Orchestrator) | ADR-018 explicitly defers transport; spec defines transport-agnostic contract |
| OD-009 | Persistent project memory schema | OPEN | **TASK_LOCAL_BLOCKER** | V1-025 (Memory) | Memory spec defines schema; exact schema deferred to V1 evidence |
| OD-010 | Workflow state management mechanism | Lifecycle states BOUND; mechanism OPEN | **NON_BLOCKING_V1** | V1-026 (Workflow) | Lifecycle states bounded by ADR-027; mechanism is V1 implementation |
| OD-011 | Quality-gate execution mechanism | Gate semantics preserved; execution mechanism OPEN | **NON_BLOCKING_V1** | V1-027 (Quality-gate) | Gate semantics bounded by ADR-025; execution mechanism is V1 implementation |
| OD-012 | Human approval interface | Human Gate semantics BOUND; approval interface OPEN | **NON_BLOCKING_V1** | V1-028 (Approval interface) | HG-01..HG-07 bounded by HUMAN_GATE_BOUNDARY.md; interface design is V1 implementation |

### Priority 2-4 (Non-execution-control)

| OD | Decision | BLOCKING? | Scope | Rationale |
|---|---|---|---|---|
| OD-014 to OD-017 | Adoption proposal, comparison, contribution, privacy | **DEFER_TO_LATER_PHASE** | V2 or later | Advisory-plane decisions; outside V1 Execution Control Plane scope |
| OD-018 to OD-021 | Greenfield flow, proactive behavior, intelligence updates, propagation | **DEFER_TO_LATER_PHASE** | V2 or later | Advisory-plane decisions; outside V1 scope |
| OD-022 | Network API protocol | **DEFER_TO_LATER_PHASE** | V1 implementation | ADR-018 explicitly defers transport protocol |
| OD-023 | Pool architecture | **DEFER_TO_LATER_PHASE** | V2 or later | Platform-level decision; outside V1 scope |
| OD-024 | Credit economy | **DEFER_TO_LATER_PHASE** | V2 or later | Business decision; outside V1 scope |
| OD-025 | API monetization | **DEFER_TO_LATER_PHASE** | V2 or later | Business decision; outside V1 scope |
| OD-026 | Runtime/packaging and execution persistence | **NON_BLOCKING_V1** | V1-029 (Freeze decisions) | ADR-018 explicitly defers packaging; V1-029 gathers evidence for this decision |

## Summary: Blocking Analysis

### Zero BLOCKING_V1 decisions

No open decision BLOCKS V1 spec work. Every V1 task can proceed because:

1. **ADR-027 (Durable task state)** bounds the canonical contract for tasks, passports, work orders, deltas — all V1 foundational concepts
2. **ADR-019 (Authority)** bounds the authority model — all V1 tasks operate within delegated authority
3. **ADR-018 (Two planes)** bounds the advisory/execution separation — V1 specs are execution-control artifacts
4. **ADR-020 (Six modes)** bounds the mode semantics — V1 tasks don't reopen mode design
5. **ADR-024-026 (Resources, parallelism, verification)** bound the execution control model — V1 specs document accepted boundaries
6. **HUMAN_GATE_BOUNDARY.md** bounds HG-01..HG-07 — V1-028 documents accepted gates, doesn't redefine them
7. **Explicit non-goals** in DPT_OPEN_DECISIONS.md state: "Do not prematurely freeze a specific transport protocol; a specific AI vendor; a specific database; a specific Agent framework; a runtime, database schema, queue, lock service, or agent-provider integration"

### TASK_LOCAL_BLOCKER decisions (4)

These affect specific V1 tasks but the spec can proceed with:
- Conceptual definitions
- Placeholders for exact implementation
- References to accepted ADRs as the binding constraint

| Decision | Affected Task | V1 spec approach |
|---|---|---|
| OD-006 (mode/entity state names) | V1-023 (Orchestrator) | Use accepted ADR-020 names; exact machine identifiers deferred |
| OD-008 (Resource lock/lease) | V1-023, V1-026 | Document ADR-024/026 constraints; exact lock/lease mechanism deferred |
| OD-009 (Verifier independence) | V1-027 (Quality-gate) | Document ADR-025 constraints; exact independence threshold deferred |
| OD-010 (Retry/cancellation) | V1-023 (Orchestrator) | Document Execution Control Model semantics; exact retry budget deferred |
| OD-011 (Task DAG mutation) | V1-023 (Orchestrator) | Document Execution Control Model DAG rules; exact mutation API deferred |
| OD-009 (Memory schema) | V1-025 (Memory) | Define conceptual schema; exact schema deferred to V1 evidence |

### NON_BLOCKING_V1 decisions (15)

These are relevant but the V1 spec can proceed by:
- Documenting the accepted ADR/bound decision
- Deferring exact implementation to V1 evidence
- Using placeholders where the ADR doesn't resolve the detail

### DEFER_TO_LATER_PHASE decisions (9)

These belong to V2 or later. V1-029 (Freeze decisions) will gather evidence that informs these decisions but does not resolve them.

## V1 DAG Recalculation

### Dependencies

```
V1-023 (Orchestrator)  ← depends on: ADR-027 (contract), ADR-019 (authority), ADR-020 (modes)
V1-024 (Agent adapters) ← depends on: ADR-006/007/008/021 (boundaries), ADR-013 (modularity)
V1-025 (Memory)        ← depends on: ADR-027 (durable state), OD-003 (Delta)
V1-026 (Workflow)      ← depends on: ADR-027 (DAG), ADR-024/026 (Resources)
V1-027 (Quality-gate)  ← depends on: ADR-025 (Verification), ADR-027 (Decision)
V1-028 (Approval)      ← depends on: HUMAN_GATE_BOUNDARY.md, ADR-019 (Authority)
V1-029 (Freeze)        ← depends on: V1-023 through V1-028 (all specs gathered)
```

### Parallel-safe READY tasks (no shared Resource Claims)

All V1 tasks operate on independent repository paths (docs/bootstrap/*) and independent schema definitions. No Resource Claim conflicts exist between V1 tasks at the spec-definition level.

**Parallel batch 1** (all independent):
- V1-023: Provider-neutral orchestrator runtime
- V1-024: Agent adapters
- V1-025: Persistent project memory

**Parallel batch 2** (depends on batch 1 for cross-reference):
- V1-026: Workflow state management
- V1-027: Quality-gate execution
- V1-028: Human approval interface

**Sequential final** (depends on all above):
- V1-029: Freeze transport/persistence/deployment decisions

### HUMAN_GATE_REQUIRED for each task

| Task | HG Required? | Rationale |
|---|---|---|
| V1-023 | NO | Spec definition; ADR-027/019/020 bound the contract |
| V1-024 | NO | Spec definition; ADR-006/007/008/021 bound boundaries |
| V1-025 | NO | Spec definition; ADR-027 bounds durable state |
| V1-026 | NO | Spec definition; ADR-027/024/026 bound DAG and Resources |
| V1-027 | NO | Spec definition; ADR-025 bounds Verification |
| V1-028 | NO | Spec definition; HUMAN_GATE_BOUNDARY.md bounds HG-01..HG-07 |
| V1-029 | NO | Evidence gathering; ADR-018 explicitly defers transport/packaging |

## Conclusion

**HUMAN_GATE_VALID = NO** for all V1 tasks.
**Classification**: MAJOR_VERSION_PHASE_TRANSITION_DEFECT (repaired)

The stop at V0.3→V1 was caused by:
1. PhaseAdmissionEnforcer V1 had hardcoded V0.x numeric ranges (14-17, 18-22)
2. No auto-discovery of next phase from ROADMAP
3. No V1/V2 task extraction logic

Both defects repaired in PhaseAdmissionEnforcer V3.

All V1 tasks are spec-definition work within accepted ADR boundaries. No open decision materially constrains V1 spec creation. The V1-029 freeze-decisions task gathers evidence for OD-026 (runtime/packaging) but does not resolve it — that is the intended behavior per ADR-018.

**OWNER_PERMISSION_POPUPS = 0**