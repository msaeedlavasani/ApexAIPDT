# DPT-VAL-001 — OpenCode Multi-Agent Runtime Gap Conformance Validation

## 1. Task Metadata

| Field | Value |
|-------|-------|
| Task ID | DPT-VAL-001 |
| Title | OpenCode Multi-Agent Runtime Gap Conformance Validation |
| Mode | VALIDATE |
| Risk | LOW — isolated validation only |
| Created | 2026-09-02 |
| Provider | opencode/mimo-v2.5-free |
| Model | opencode/mimo-v2.5-free |

## 2. Baseline Provenance

| Repository | Branch | SHA | Role |
|-----------|--------|-----|------|
| ApexAIPDT | main | `50b0bd19e957d9a79131508839fbc8b1ca48291a` | Canonical spec |
| Apex-Orchestrator-Lab | m1.1-hardening | `be5ecc10cce50e0f6acdec99b650a10fc16a8556` | Incubation runtime |

## 3. Prior Evidence Reused

DPT-MIG-001 provided prior conformance evidence for:

| Capability | Evidence Source | Status |
|-----------|----------------|--------|
| SUBAGENT_DELEGATION | DPT-MIG-001: 11 task tool invocations | REUSED |
| PARALLEL_MEMBER_EXECUTION | DPT-MIG-001: B-r2 + C-r1 concurrent | REUSED |
| PARALLEL_INDEPENDENT_REVIEW | DPT-MIG-001: A-r2 + B-r2 + C-r1 concurrent | REUSED |
| REWORK_LOOP | DPT-MIG-001: 22 findings resolved across 3 rounds | REUSED |
| SELECTIVE_RETRY | DPT-MIG-001: C required 3 rounds, A required 1 | REUSED |
| MEMBER_ISOLATION | DPT-MIG-001: each member independent | REUSED |
| COORDINATOR_ONLY_PARENT | DPT-MIG-001: parent did not perform member work | REUSED |
| JOIN_AGGREGATION | DPT-MIG-001: results collected and aggregated | REUSED |

## 4. Provider Capability Observations

| Attribute | Value | Evidence |
|-----------|-------|----------|
| NATIVE_SUBAGENT_CAPABILITY | AVAILABLE | `task` tool used throughout DPT-MIG-001 and DPT-VAL-001 |
| MAX_OBSERVED_CONCURRENCY | 5 | 5 independent scenarios dispatched concurrently |
| PARALLEL_EXECUTION | YES | VAL-01, VAL-03, VAL-04, VAL-05, VAL-06 launched concurrently |
| PARENT_COORDINATOR_ONLY | YES | Parent dispatched subagents, did not execute scenarios |
| PROVIDER_CAPABILITY_LIMITATION | NONE | No limitations observed |

## 5. Scenario Dependency Graph

```
VAL-01 ──→ VAL-02 (depends on route exhaustion)
VAL-03    (independent)
VAL-04    (independent)
VAL-05    (independent)
VAL-06    (independent)
VAL-07    (independent)
VAL-08    (independent)
VAL-09    (independent)
VAL-10    (independent)
VAL-11    (independent)
```

Execution batches:
- Batch 1 (concurrent): VAL-01, VAL-03, VAL-04, VAL-05, VAL-06
- Batch 2 (concurrent): VAL-07, VAL-08, VAL-09, VAL-10, VAL-11
- Batch 3 (after VAL-01): VAL-02

## 6. Parallel Execution Topology

| Batch | Scenarios | Concurrency | Evidence |
|-------|-----------|-------------|----------|
| 1 | VAL-01, VAL-03, VAL-04, VAL-05, VAL-06 | 5 | 5 subagents dispatched concurrently |
| 2 | VAL-07, VAL-08, VAL-09, VAL-10, VAL-11 | 5 | 5 subagents dispatched concurrently |
| 3 | VAL-02 | 1 | Dispatched after VAL-01 completion |

Total subagents used: 11 (10 scenario runners + 1 VAL-02 runner)

## 7. VAL-01 Result — Route Rework Budget Exhaustion

| Field | Value |
|-------|-------|
| SCENARIO_ID | VAL-01 |
| WORKER_AGENT_ID | ses_f9d1a06d6ffeoDlNK7jrAadE7Y |
| PROVIDER | opencode/mimo-v2.5-free |
| EXECUTION_MODE | PARALLEL (batch 1) |
| EXPECTED_STATE | READY (reroute) after budget exhaustion |
| OBSERVED_STATE | READY (reroute) after budget exhaustion |
| EXPECTED_DISPOSITION | REROUTE |
| OBSERVED_DISPOSITION | REROUTE |
| RESULT | **PASS** |

Evidence:
- Budget=3, route=test-route-A
- Attempts 1–3: REWORK_REQUIRED (within budget)
- Attempt 4: READY/REROUTE (budget exhausted, NOT BACKLOG_BLOCKED)
- ROUTE_EXHAUSTED with alternatives: READY/REROUTE
- 10/10 assertions passed

## 8. VAL-02 Result — Next-Best Route

| Field | Value |
|-------|-------|
| SCENARIO_ID | VAL-02 |
| WORKER_AGENT_ID | ses_f9d15d4b4ffeWT8zpopqqpC7yk |
| PROVIDER | opencode/mimo-v2.5-free |
| EXECUTION_MODE | SEQUENTIAL (after VAL-01) |
| EXPECTED_STATE | READY (reroute) → next route attempted |
| OBSERVED_STATE | READY (reroute) → next route attempted |
| EXPECTED_DISPOSITION | REROUTE |
| OBSERVED_DISPOSITION | REROUTE |
| RESULT | **PASS** |

Evidence:
- Step 1: Route A exhausted → READY/REROUTE
- Step 2: Route B attempt → READY/NONE
- Step 3: Route B fails → REWORK_REQUIRED
- Step 4: Route B exhausted → READY/REROUTE to C
- Step 5: All routes exhausted → ESCALATION_REQUIRED
- 15/15 assertions passed

## 9. VAL-03 Result — Global Task Attempt Exhaustion

| Field | Value |
|-------|-------|
| SCENARIO_ID | VAL-03 |
| WORKER_AGENT_ID | ses_f9d1a0518ffeT5ElSMVN14NbJK |
| PROVIDER | opencode/mimo-v2.5-free |
| EXECUTION_MODE | PARALLEL (batch 1) |
| EXPECTED_STATE | ESCALATION_REQUIRED (not BACKLOG_BLOCKED) |
| OBSERVED_STATE | ESCALATION_REQUIRED |
| EXPECTED_DISPOSITION | ESCALATE_REPLAN_OR_REROUTE |
| OBSERVED_DISPOSITION | ESCALATE_REPLAN_OR_REROUTE |
| RESULT | **PASS** |

Evidence:
- Global exhausted (count=5, budget=5): ESCALATION_REQUIRED
- Global not exhausted (count=4, budget=5): REWORK_REQUIRED
- No global budget (budget=0): REWORK_REQUIRED (unlimited)
- 4/4 assertions passed

## 10. VAL-04 Result — Real Blocker

| Field | Value |
|-------|-------|
| SCENARIO_ID | VAL-04 |
| WORKER_AGENT_ID | ses_f9d1a0393fferW2EE97358zOA2 |
| PROVIDER | opencode/mimo-v2.5-free |
| EXECUTION_MODE | PARALLEL (batch 1) |
| EXPECTED_STATE | BACKLOG_BLOCKED with blocker disposition |
| OBSERVED_STATE | BACKLOG_BLOCKED with blocker disposition |
| EXPECTED_DISPOSITION | Matches blocker type |
| OBSERVED_DISPOSITION | Matches blocker type |
| RESULT | **PASS** |

Evidence:
- BLOCKED_EXTERNAL_DEPENDENCY → BACKLOG_BLOCKED, blocker=true
- BLOCKED_BY_PERMISSION → BACKLOG_BLOCKED, blocker=true
- BLOCKED_BY_SECRET → BACKLOG_BLOCKED, blocker=true
- BLOCKED_BY_RESOURCE → BACKLOG_BLOCKED, blocker=true
- BLOCKED_BY_TASK → BACKLOG_BLOCKED, blocker=true
- Repeated failure without evidence → ESCALATION_REQUIRED (NOT BACKLOG_BLOCKED)
- 11/11 assertions passed

## 11. VAL-05 Result — Resource Claim Conflict

| Field | Value |
|-------|-------|
| SCENARIO_ID | VAL-05 |
| WORKER_AGENT_ID | ses_f9d1a01b9ffeUWND6AkZgZsKbF |
| PROVIDER | opencode/mimo-v2.5-free |
| EXECUTION_MODE | PARALLEL (batch 1) |
| EXPECTED_STATE | READ+READ compatible, others conflict |
| OBSERVED_STATE | READ+READ compatible, others conflict |
| EXPECTED_DISPOSITION | N/A (resource claims, not task state) |
| OBSERVED_DISPOSITION | N/A |
| RESULT | **PASS** |

Evidence:
- READ+READ: false (compatible)
- READ+WRITE: true (conflict)
- WRITE+READ: true (conflict)
- WRITE+WRITE: true (conflict)
- EXCLUSIVE+READ: true (conflict)
- EXCLUSIVE+WRITE: true (conflict)
- EXCLUSIVE+EXCLUSIVE: true (conflict)
- Different resources: false (no conflict)
- Different kinds: false (no conflict)
- 9/9 assertions passed

## 12. VAL-06 Result — Worker Exit Failure

| Field | Value |
|-------|-------|
| SCENARIO_ID | VAL-06 |
| WORKER_AGENT_ID | ses_f9d1a0006ffeswTzh52xq350HJ |
| PROVIDER | opencode/mimo-v2.5-free |
| EXECUTION_MODE | PARALLEL (batch 1) |
| EXPECTED_STATE | READY (reroute) or ESCALATION_REQUIRED |
| OBSERVED_STATE | READY (reroute) or ESCALATION_REQUIRED |
| EXPECTED_DISPOSITION | REROUTE or ESCALATE_REPLAN_OR_REROUTE |
| OBSERVED_DISPOSITION | REROUTE or ESCALATE_REPLAN_OR_REROUTE |
| RESULT | **PASS** |

Evidence:
- Worker exit with alternatives → READY/REROUTE
- Worker exit without alternatives → ESCALATION_REQUIRED
- WORKER_EXIT_FAILURE ≠ TASK_FAILURE (verified)
- WORKER_EXIT_FAILURE in reroutable set, TASK_FAILURE not
- 9/9 assertions passed

## 13. VAL-07 Result — Timeout and Cleanup

| Field | Value |
|-------|-------|
| SCENARIO_ID | VAL-07 |
| WORKER_AGENT_ID | ses_f9d1872deffee2fk6q2tsq0Gun |
| PROVIDER | opencode/mimo-v2.5-free |
| EXECUTION_MODE | PARALLEL (batch 2) |
| EXPECTED_STATE | READY (reroute) or ESCALATION_REQUIRED |
| OBSERVED_STATE | READY (reroute) or ESCALATION_REQUIRED |
| EXPECTED_DISPOSITION | REROUTE or ESCALATE_REPLAN_OR_REROUTE |
| OBSERVED_DISPOSITION | REROUTE or ESCALATE_REPLAN_OR_REROUTE |
| RESULT | **PASS** |

Evidence:
- Timeout with alternatives → READY/REROUTE
- Timeout without alternatives → ESCALATION_REQUIRED
- TIMEOUT in reroutable set (verified)
- TIMEOUT does not set blocker flag
- TIMEOUT does not → BACKLOG_BLOCKED
- 7/7 assertions passed

## 14. VAL-08 Result — Restart / Reconciliation

| Field | Value |
|-------|-------|
| SCENARIO_ID | VAL-08 |
| WORKER_AGENT_ID | ses_f9d18720affe27MN72Hk0y2mbB |
| PROVIDER | opencode/mimo-v2.5-free |
| EXECUTION_MODE | PARALLEL (batch 2) |
| EXPECTED_STATE | Deterministic convergence, no duplicate execution |
| OBSERVED_STATE | Deterministic convergence, no duplicate execution |
| EXPECTED_DISPOSITION | N/A (state machine validation) |
| OBSERVED_DISPOSITION | N/A |
| RESULT | **PASS** |

Evidence:
- Full lifecycle: PENDING→READY→RUNNING→VERIFYING→APPROVED
- Duplicate event idempotency: revision unchanged
- Journal resume: state reconstructed correctly (revision=3, 3 events)
- Terminal state immutability: APPROVED mutation rejected
- 6/6 assertions passed

## 15. VAL-09 Result — Evidence Integrity

| Field | Value |
|-------|-------|
| SCENARIO_ID | VAL-09 |
| WORKER_AGENT_ID | ses_f9d11ac92ffeCQGp1mts3DGJiL |
| PROVIDER | opencode/mimo-v2.5-free |
| EXECUTION_MODE | PARALLEL (batch 2) |
| EXPECTED_STATE | FAIL CLOSED on ambiguous/incomplete evidence |
| OBSERVED_STATE | FAIL CLOSED on ambiguous/incomplete evidence |
| EXPECTED_DISPOSITION | N/A (validation checks) |
| OBSERVED_DISPOSITION | N/A |
| RESULT | **PASS** |

Evidence:
- BACKLOG_BLOCKED without evidence → rejected
- BACKLOG_BLOCKED with mismatched disposition → rejected
- ESCALATION_REQUIRED without escalation disposition → rejected
- Policy-level idempotency → correct (state unchanged)
- Store-level idempotency → correct (state unchanged)
- Corrupted journal → rejected on load
- Invalid transition → rejected
- Terminal state mutation → rejected
- 8/8 checks passed

## 16. VAL-10 Result — Deterministic Aggregation

| Field | Value |
|-------|-------|
| SCENARIO_ID | VAL-10 |
| WORKER_AGENT_ID | ses_f9d186e1dffeykUbFfqowbtkRA |
| PROVIDER | opencode/mimo-v2.5-free |
| EXECUTION_MODE | PARALLEL (batch 2) |
| EXPECTED_STATE | Same canonical state regardless of execution order |
| OBSERVED_STATE | Same canonical state regardless of execution order |
| EXPECTED_DISPOSITION | N/A (determinism validation) |
| OBSERVED_DISPOSITION | N/A |
| RESULT | **PASS** |

Evidence:
- 3 identical runs (A→B→C→D): all produce APPROVED, revision=4
- Out-of-order transition (C before B) → rejected
- Failure escalation paths deterministic
- 5/5 assertions passed

## 17. VAL-11 Result — Provider Topology Compliance

| Field | Value |
|-------|-------|
| SCENARIO_ID | VAL-11 |
| WORKER_AGENT_ID | ses_f9d186be7ffejZKuIE7gPcCUAaL |
| PROVIDER | opencode/mimo-v2.5-free |
| EXECUTION_MODE | PARALLEL (batch 2) |
| EXPECTED_STATE | Concurrent dispatch when >=2 READY tasks |
| OBSERVED_STATE | Concurrent dispatch when >=2 READY tasks |
| EXPECTED_DISPOSITION | N/A (topology validation) |
| OBSERVED_DISPOSITION | N/A |
| RESULT | **PASS** |

Evidence:
- Subagents used: YES (11 task tool invocations in DPT-MIG-001)
- Parallel member execution: YES (B-r2 + C-r1 concurrent)
- Parallel review execution: YES (max concurrency: 3)
- No provider capability limitation recorded
- Provider supports parallel execution
- 5/5 checks passed

## 18. Conformance Matrix

| Scenario | Topic | Result | State Conformance | Disposition Conformance |
|----------|-------|--------|-------------------|------------------------|
| VAL-01 | Route Rework Budget | PASS | ✅ | ✅ |
| VAL-02 | Next-Best Route | PASS | ✅ | ✅ |
| VAL-03 | Global Attempt Exhaustion | PASS | ✅ | ✅ |
| VAL-04 | Real Blocker | PASS | ✅ | ✅ |
| VAL-05 | Resource Claim Conflict | PASS | ✅ | N/A |
| VAL-06 | Worker Exit Failure | PASS | ✅ | ✅ |
| VAL-07 | Timeout and Cleanup | PASS | ✅ | ✅ |
| VAL-08 | Restart/Reconciliation | PASS | ✅ | N/A |
| VAL-09 | Evidence Integrity | PASS | ✅ | N/A |
| VAL-10 | Deterministic Aggregation | PASS | ✅ | N/A |
| VAL-11 | Provider Topology | PASS | ✅ | N/A |

**Overall: 11/11 PASS**

## 19. Provider Capability Gaps

None observed. OpenCode native subagent capability is AVAILABLE and fully functional.

- `task` tool supports concurrent dispatch
- Maximum observed concurrency: 5 (batch 1 scenarios)
- No provider capability limitations recorded
- No silent fallback to sequential execution

## 20. Canonical DPT Policy Gaps

None identified. All tested DPT policies conform to expected behavior:

- Route rework budget exhaustion → reroute (not block)
- Global attempt exhaustion → escalation (not block)
- Real blocker → BACKLOG_BLOCKED with evidence
- Worker exit failure → reroute (not task failure)
- Timeout → reroute (not block)
- Evidence integrity → fail closed

## 21. Evidence Inventory

| Scenario | Evidence File | Status |
|----------|--------------|--------|
| VAL-01 | `/tmp/dpt-val-001/val-01/evidence.json` | CREATED |
| VAL-02 | `/tmp/dpt-val-001/val-02/evidence.json` | CREATED |
| VAL-03 | `/tmp/dpt-val-001/val-03/evidence.json` | CREATED |
| VAL-04 | `/tmp/dpt-val-001/val-04/evidence.json` | CREATED |
| VAL-05 | `/tmp/dpt-val-001/val-05/evidence.json` | CREATED |
| VAL-06 | `/tmp/dpt-val-001/val-06/evidence.json` | CREATED |
| VAL-07 | `/tmp/dpt-val-001/val-07/evidence.json` | CREATED |
| VAL-08 | `/tmp/dpt-val-001/val-08/evidence.json` | CREATED |
| VAL-09 | `/tmp/dpt-val-001/val-09/evidence.json` | CREATED |
| VAL-10 | `/tmp/dpt-val-001/val-10/evidence.json` | CREATED |
| VAL-11 | `/tmp/dpt-val-001/val-11/evidence.json` | CREATED |

## 22. Recommended Next Task

DPT-VAL-002 — Extended provider conformance testing with failure injection, or DPT-MIG-002 — Reconcile additional DPT concepts.

## 23. Safety / Change Record

| Action | Status |
|--------|--------|
| Lab runtime modified | NO |
| DPT spec modified | NO |
| Disposable fixtures used | YES (/tmp/dpt-val-001/) |
| Real repository files modified | NO |
| SSH used | NO |
| Dependencies installed | NO |
| AHF/Testbed/Production/DB/secrets accessed | NO |

## 24. Revision History

| Rev | Date | Author | Changes |
|-----|------|--------|---------|
| 1 | 2026-09-02 | opencode | Initial conformance validation — 11/11 scenarios PASS |

---

*DPT-VAL-001 — OpenCode Multi-Agent Runtime Gap Conformance Validation — 2026-09-02*
