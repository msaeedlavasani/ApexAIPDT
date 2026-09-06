# Apex AI DPT — Open Decisions

**Status:** Living backlog for architecture decisions

This document records topics intentionally not frozen yet. It prevents unresolved design questions from being forgotten while the architecture is developed.

## Accepted Decisions

The following decisions have been canonically accepted during architecture review.
They are retained in this document for reference but are no longer open questions.

### #1 — Project Intelligence (ACCEPTED)

**Status:** ACCEPTED  
**Accepted:** 2026-09-05  
**Canonical Model:**

Project Intelligence is:
- PROJECT-OWNED
- PROJECT-SIDE PERSISTED
- REQUEST-DRIVEN
- EPHEMERAL-TO-DPT
- EVIDENCE-BACKED
- INCREMENTAL
- DEPENDENCY/FRESHNESS-AWARE

**Core Rules:**

1. Project Intelligence belongs to the connected Project.
2. Persistent Project Intelligence remains project-side.
3. DPT requests only minimum sufficient context when needed.
4. Context transferred to DPT is ephemeral by default.
5. DPT must not retain project context after bounded processing.
6. DPT returns findings/results; the Project owns canonical persistence.
7. Central DPT Pools must not silently absorb project artifacts/data.
8. Reusable discoveries may become CONTRIBUTION_CANDIDATE.
9. Candidate != accepted DPT asset.
10. Only explicitly accepted bounded reusable artifacts enter DPT Pools.
11. Rejected candidates remain project-local.
12. Secrets/private project context are never implicitly contribution-eligible.
13. Project Intelligence does not create execution authority.

**Invariant:**

```
PROJECT_CONTEXT_RECEIVED
→ BOUNDED_PROCESSING
→ RESULT_RETURNED
→ PROJECT_CONTEXT_DISCARDED
```

**Contribution Path:**

```
REUSABLE_DISCOVERY
→ CONTRIBUTION_CANDIDATE
→ REVIEW
→ ACCEPTED
→ DPT_POOL
```

There is NO direct:
```
PROJECT_CONTEXT → DPT_POOL
```

Exact storage technology/schema serialization remains implementation-open
unless already separately decided.

---

### #2 — Scout Discovery Strategy (ACCEPTED)

**Status:** ACCEPTED  
**Accepted:** 2026-09-05  
**Canonical Model:**

Scout is:
- PROJECT-SIDE COMPREHENSIVE DISCOVERY
- LOCAL INTELLIGENCE BUILDER

Scout may understand the project broadly.
DPT receives project information narrowly.

**Core Invariant:**

```
SCOUT MAY KNOW THE PROJECT BROADLY;
DPT MAY RECEIVE THE PROJECT NARROWLY.
```

**Discovery Scope** = BROAD / COMPREHENSIVE  
**Transfer Scope** = MINIMUM SUFFICIENT / NEED-TO-KNOW

**Core Rules:**

1. Scout operates project-side.
2. Initial discovery is comprehensive enough to accurately map the
   Project Foundation.
3. Primary Scout output is a local Project Intelligence Foundation,
   not a central DPT copy.
4. Persistent intelligence remains on the project host/environment.
5. DPT has no default persistent copy.
6. DPT requests semantic context only when required.
7. Only the relevant bounded slice is transferred.
8. Transferred context follows Decision #1 ephemeral processing rules.
9. After initial discovery, Scout uses incremental refresh.
10. Change detection identifies affected areas.
11. Affected areas receive targeted rescans.
12. Requested stale intelligence must be refreshed before transfer.
13. Intelligence must preserve evidence, inference, decision,
    uncertainty/unknown distinctions.
14. Scout inspection remains within granted Project authority.
15. Scout does not create execution authority.
16. Contribution candidates use the separate explicit contribution pipeline.

**Operational Pattern:**

```
INITIAL:
PROJECT
→ COMPREHENSIVE SCOUT
→ LOCAL PROJECT INTELLIGENCE FOUNDATION

ONGOING:
CHANGE DETECTION
→ AFFECTED AREA
→ TARGETED RESCAN
→ LOCAL INTELLIGENCE UPDATE

DPT REQUEST:
SEMANTIC CONTEXT REQUEST
→ LOCAL INTELLIGENCE RETRIEVAL
→ FRESHNESS CHECK
→ REFRESH IF REQUIRED
→ MINIMUM SUFFICIENT CONTEXT
→ DPT EPHEMERAL PROCESSING
```

Exact scanner implementation/tooling remains implementation-open.

---

## Priority 1 — Core architecture

### 1. Project Intelligence machine-readable schema ✅ ACCEPTED

**Accepted:** 2026-09-05  
**Canonical model:** Project Intelligence is PROJECT-OWNED, PROJECT-SIDE PERSISTED, REQUEST-DRIVEN, EPHEMERAL-TO-DPT, EVIDENCE-BACKED, INCREMENTAL, DEPENDENCY/FRESHNESS-AWARE. Full canonical model in Accepted Decisions section above.

Decide the canonical schema for Project Intelligence, including:

- identity;
- product/intent;
- architecture;
- capabilities;
- components/modules;
- dependencies;
- interfaces;
- constraints/risks;
- evidence;
- confidence;
- versioning and incremental updates.

### 2. Scout discovery strategy ✅ ACCEPTED

**Accepted:** 2026-09-05  
**Canonical model:** Scout is PROJECT-SIDE COMPREHENSIVE DISCOVERY + LOCAL INTELLIGENCE BUILDER. SCOUT MAY KNOW THE PROJECT BROADLY; DPT MAY RECEIVE THE PROJECT NARROWLY. Full canonical model in Accepted Decisions section above.

Define how Scout obtains information efficiently across different stacks and repository shapes without defaulting to full-repository repeated reading.

Questions:

- what is the baseline scan?
- what is incremental?
- how is relevance determined?
- what evidence is sufficient?
- how are uncertain findings represented?

### 3. Agent vs Skill boundary (Decision #3) ✅ ACCEPTED

**Status:** ACCEPTED 2026-09-05 — see ADR-029 in `docs/DPT_ARCHITECTURE_DECISIONS.md`.

**Canonical model:** See ADR-029. Design-time: BRAIN, ROLE, SKILL, WORKFLOW, SERVICE, POLICY, AGENT_DEFINITION, INDEPENDENCE_CONTRACT. Runtime: AGENT_INSTANCE, WORKFLOW_INSTANCE, SERVICE_INSTANCE, WORK_ORDER, ATTEMPT, ROLE_FULFILLMENT.

Define when a capability should be:

- a Skill;
- an Agent;
- a Brain;
- a Workflow;
- a reusable Component/Module.

### 4. Front Agent lifecycle (Decision #4) ✅ ACCEPTED

**Status:** ACCEPTED 2026-09-05 — see ADR-030 in `docs/DPT_ARCHITECTURE_DECISIONS.md`.

**Canonical model:** Lifecycle states PROVISIONING → INITIALIZING → ONLINE; DEGRADED ↔ RECONNECTING; SUSPENDED/BLOCKED (fail-closed on queue/resource exhaustion); UPDATING; REVOKING → RETIRED. Multi-instance allowed only with non-overlapping authority scopes or active/standby lease coordination. Scout is a sibling ROLE, not a Front sub-role. Recovery respects distributed ownership (DPT-owned, project-owned, front operational). State ownership: identity keys DPT, project binding project owner, Project Intelligence project, DPT canonical state DPT, Front operational state Front Agent (locally recoverable).

### 5. Gateway and Trust Boundary (Decision #5) ✅ ACCEPTED

**Status:** ACCEPTED 2026-09-05 — see ADR-031 in `docs/DPT_ARCHITECTURE_DECISIONS.md`.

**Canonical model:** Gateway is a SERVICE (deterministic) + GATEWAY_SERVICE_INSTANCE (long-lived). Enforces boundary policy only; execution policy is Orchestrator's. Seven sub-concerns: identity, authentication (mutual mTLS), authorization (envelope validation), isolation (per-instance, per-project), enforcement (boundary layer), audit (signed, append-only, tamper-evident), direct-access rejection (allowlist-based). Gateway never holds canonical state, never originates policy, never grants authority. "Gateway Agent" is deprecated; the canonical term is "Gateway SERVICE."

### 6. Exact mode and entity state names (Decision #6) ✅ ACCEPTED

**Status:** ACCEPTED 2026-09-05 — see ADR-032 in `docs/DPT_ARCHITECTURE_DECISIONS.md`.

**Canonical model:** Two-dimensional mode model — `MODE_AUTHORITY_*` (policy) × `PRESENTATION_SERVICE_*` (presentation); distinct, not aliases. Six authority modes: DEFAULT, INFORMATIONAL_ADVISORY, MANAGED_EXECUTION, AUTONOMOUS_WITHIN_POLICY, DELEGATED_AUTONOMY, RESERVED. State names entity-qualified when shared: `TASK_CLOSED`, `REPORT_RETIRED`, `FRONT_BLOCKED`, `ADMISSION_BLOCKED`, etc. Reserved-to-owner: `ONLINE/DEGRADED/SUSPENDED` to Front Agent; `STARTING/DRAINING/STOPPED` to Gateway; `IDLE` to Orchestrator. Backward compatibility via deprecated aliases (read-only valid; forbidden in new artifacts).

### 7. Authority persistence and evaluation model (Decision #7) ✅ ACCEPTED

**Status:** ACCEPTED 2026-09-05 — see ADR-033 in `docs/DPT_ARCHITECTURE_DECISIONS.md`.

**Canonical model:** Five-layer authority stack — LAYER 1 `DURABLE_AUTHORITY_POLICY` (immutable, DPT governance) → LAYER 2 `DELEGATED_AUTHORITY` (revocable, owner grants) → LAYER 3 `AUTHORITY_ENVELOPE` (signed, append-only, time-bounded) → LAYER 4 `RUNTIME_EFFECTIVE_AUTHORITY` (per WORK_ORDER, evaluated) → LAYER 5 `MATERIALIZED_PERMISSIONS` (per ATTEMPT, re-derived). Evaluator is `AUTHORITY_EVALUATOR_SERVICE_INSTANCE` (SERVICE per ADR-029 determinism). Core invariant: authority persistence ≠ persistent runtime permission. NO EXECUTION BEFORE GOVERNANCE REHYDRATION. NO AGENT EXECUTION BEFORE AUTHORITY MATERIALIZATION. Specific overrides general.

### 8. Resource lock / lease model ✅ ACCEPTED

Finalize the V1 Resource and ResourceClaim mechanics without reopening ADR-026. Decide:

- the V1 Resource type set;
- `READ` + `WRITE` compatibility and upgrade semantics;
- claim granularity and hierarchy overlap rules;
- whether and how automatic claim inference may propose claims;
- conflict-domain generation and maintenance;
- snapshot-read and stale-read semantics;
- the adapter model for external Resources;
- lock versus lease semantics, acquisition order, expiry, renewal, fencing, deadlock avoidance, stale executor recovery, and behavior during network partitions.

**Status:** ACCEPTED 2026-09-05 — see ADR-034 in `docs/DPT_ARCHITECTURE_DECISIONS.md`. Canonical: leases with fencing tokens (not bare locks); lease ≠ authority source; acquire-in-canonical-order deadlock prevention; idempotent release; Orchestrator preflight cycle check.

Accepted constraints: every Task declares claims before execution; silent runtime scope expansion is forbidden; only the Orchestrator may approve expansion; sensitivity participates in Authority/Governance evaluation; uncertain V1 compatibility prevents parallel execution.

### 9. Verifier independence (Decision #9) ✅ ACCEPTED

**Status:** ACCEPTED 2026-09-05 — see ADR-035 in `docs/DPT_ARCHITECTURE_DECISIONS.md`.

**Canonical model:** Self-verification is informational only; closure requires independent verification through a Reviewer satisfying INDEPENDENCE_CONTRACT. Risk class (derived from existing canonical classification) determines minimum contract. REASONING_ISOLATION + EVIDENCE_INDEPENDENCE mandatory for all independent verification. Higher-independence verdict wins conflicts. Producer-self-review prohibition is a workflow rule, not a definition rule. Definition inequality is necessary but not sufficient.

---

Decide when the executor may verify its own Result and when policy/risk requires an independent Agent, tool, human, or environment. Define how conflicting verification evidence is resolved.

### 10. Retry, cancellation, and revocation semantics (Decision #10) ✅ ACCEPTED

**Status:** ACCEPTED 2026-09-05 — see ADR-036 in `docs/DPT_ARCHITECTURE_DECISIONS.md`.

**Canonical model:** Three semantically distinct operations: `RETRY` (transient failure, same WORK_ORDER new ATTEMPT, producer-driven), `CANCELLATION` (owner/Orchestrator decision, cooperative with safe points + forced after grace), `REVOCATION` (authority invalidation, atomic, immediate). **Precedence: REVOCATION > CANCELLATION > RETRY at all times.** Revocation invalidates authority before further execution. Leases become `LEASE_REVOKED` on revocation (per ADR-034). Closure denied if revocation precedes closure event; post-closure revocation triggers `POST_CLOSURE_REVOCATION` flow.

---

Define retry budgets and backoff, idempotency requirements, Attempt lineage, cooperative versus forced cancellation, safe points, compensation, partial Results, kill-switch propagation, and containment when immediate cancellation is more dangerous than controlled completion.

### 11. Task graph mutation rules (Decision #11) ✅ ACCEPTED

**Status:** ACCEPTED 2026-09-05 — see ADR-037 in `docs/DPT_ARCHITECTURE_DECISIONS.md`.

**Canonical model:** Mutations are append-only. Each produces new graph revision; old revision immutable. **Core rule: mutation must not retroactively legitimize already-started execution.** Remove of executed/RUNNING task is **prohibited** (use CANCELLATION/REVOCATION). Concurrent mutations serialized through single Orchestrator gate. Cycle preflight mandatory per ADR-034. Every mutation produces signed `GRAPH_MUTATION_RECORD` (revision, type, author, hashes, affected tasks). DAG recalculation remains deterministic.

---

Define who may add, remove, split, merge, or reorder Tasks; cycle detection; graph versioning; invalidation of downstream readiness/verification; and which mutations require approval or re-evaluation of authority.

### 12. Merge ownership and integration authority (Decision #12) ✅ ACCEPTED

**Status:** ACCEPTED 2026-09-05 — see ADR-038 in `docs/DPT_ARCHITECTURE_DECISIONS.md`.

**Canonical model:** Three distinct roles — Proposer, Authorizer, Integrator. Core rule: **producing an artifact must never imply authority to integrate it.** Integration requires explicit `INTEGRATION_AUTHORIZATION` derived from LAYER 2/3 over target scope. Workflow: PROPOSE → PREFILIGHT → VERIFY → AUTHORIZE → EXECUTE → RECORD → RE-EVALUATE. Cross-project integration is DPT-mediated. Revert is integration (requires authority). Branch-level exclusive leases per ADR-034. Pre-merge verification per ADR-035.

---

Define who owns branch/worktree integration, conflict resolution, merge order, final acceptance, rollback, and protected-branch gates when multiple executors produce compatible but overlapping Artifacts.

### 13. Routing taxonomy ✅ ACCEPTED

Define the routing dimensions used to select Analyst, Orchestrator, executor, verifier, workflow, and escalation destination, including capability, risk, authority, environment, data sensitivity, cost, latency, and resource affinity.

**Status:** ACCEPTED 2026-09-05 — see ADR-039 in `docs/DPT_ARCHITECTURE_DECISIONS.md`. Canonical: six dimensions (Authority, Capability, Availability, Deterministic-first, Cognitive, Fallback) with AUTHORITY-first precedence; deterministic-first per ADR-029.

## Priority 2 — Recommendation and adoption

### 14. DPT Adoption Proposal schema

Define the canonical proposal structure and recommendation outcomes.

Potential sections:

- current state;
- detected needs;
- existing project solutions;
- DPT candidates;
- compatibility/value analysis;
- keep/adopt/extend/no-action decisions;
- contribution candidates;
- implementation requirements for the project team;
- expected benefits;
- risks;
- effort/complexity;
- optional adoption roadmap.

### 15. Comparison/evaluation framework

Define how DPT compares a project-owned solution with a DPT asset without assuming DPT is superior.

Potential dimensions:

- correctness;
- security;
- maintainability;
- testability;
- performance;
- reuse;
- maturity;
- compatibility;
- operational cost;
- migration effort.

### 16. Contribution acceptance model

Define how project-owned Components, Modules, Skills, Agents, Pitfalls, patterns, evidence, or decisions become Pool candidates and then accepted shared assets.

### 17. Privacy and contribution classification

Define what may leave a project and what must remain private. Confirm default classification and approval requirements.

## Priority 3 — Lifecycle and intelligence

### 18. Greenfield advisory flow ✅ ACCEPTED

Define the complete flow from product idea to project blueprint and capability/agent assembly while preserving the non-invasive Advisory Plane. Any later execution must enter the separate Execution Control Plane through explicit Authority Policy.

**Status:** ACCEPTED 2026-09-05 — see ADR-044 in `docs/DPT_ARCHITECTURE_DECISIONS.md`. Canonical: INTAKE_RECEIVED → INTAKE_CLARIFIED → ADVISORY_DRAFTED → BLUEPRINT_PROPOSED → ACCEPTED_BY_OWNER → ADVISORY_FINALIZED → TRANSFERRED_TO_PROJECT. Advisory never executes, never grants authority, never instantiates. Mandatory Human Gate at BLUEPRINT_PROPOSED. Scout has no role in pure greenfield (no project to observe). ASSEMBLY_RECOMMENDATION (Advisory) ≠ ASSEMBLY_INSTANTIATION (Execution, Authority-gated). Cross-project reuse only via CONTRIBUTION_CANDIDATE path.

---

## Reconciliation Note: Section/Decision Numbering Alignment (added 2026-09-05)

**Issue:** Numbered sections 14–17 in this document originally described
"Adoption Proposal schema / Comparison framework / Contribution acceptance
model / Privacy classification" (Priority 2 topics). The canonical
DECISION_CANONICALIZATION cycle (Decisions #14–#17) instead closed the
**execution-control priority-1 backlog items** Idempotency/Dedup, Audit
Chain, Conformance/Certification, and Open Decision Lifecycle — which had
no numbered section of their own and were tracked only in the OD-code
register at the foot of this document.

**Resolution per ADR-043 (Single decision, single resolution):** The ADRs
are authoritative. Numbered sections 14–17 remain OPEN as their original
Priority 2 topics and are the next batch to be addressed under a future
canonicalization cycle once Priority 1 OD-code items are fully closed.
No silent re-numbering is applied.

### 19. Proactive DPT behavior ✅ ACCEPTED

Define when DPT may proactively notify a project about:

- relevant Components/Modules;
- Pitfalls;
- security issues;
- updates;
- capability gaps;
- architecture opportunities;
- contribution opportunities.


**Status:** ACCEPTED 2026-09-05 — see ADR-045 in `docs/DPT_ARCHITECTURE_DECISIONS.md`. Canonical: subscription-gated, advisory-only, severity-prioritized, throttle-bounded, connection-state-gated notification channel. `advisory_only: true` invariant. No notification may trigger Task/Agent/claim/lease/Authority. Silence ≠ consent.

### 20. Project intelligence update triggers ✅ ACCEPTED

Define how changes in a project cause targeted Scout refreshes and when a broader rescan is justified.


**Status:** ACCEPTED 2026-09-05 — see ADR-046 in `docs/DPT_ARCHITECTURE_DECISIONS.md`. Canonical: 3 trigger classes (SCHEDULED/EVENT/SIGNAL); 2 refresh modes (TARGETED/BROAD); broad only on threshold breach; trigger budget 20/day; connection-state-gated per ADR-030; prior intelligence SUPERSEDED with lineage per ADR-043.

### 21. DPT update propagation ✅ ACCEPTED

Define how subscribed projects receive validated asset/intelligence updates, compatibility information, deprecations, and migration notices without DPT modifying project code.


**Status:** ACCEPTED 2026-09-05 — see ADR-047 in `docs/DPT_ARCHITECTURE_DECISIONS.md`. Canonical: 8 UPDATE_* kinds; PROPAGATION_RECORD schema; mandatory COMPATIBILITY_BREAK+MIGRATION_GUIDE_REF+DEPRECATION_UNTIL triplet for breaking changes; DPT never modifies project code; subscription-gated per ADR-045; audit-chained per ADR-041; deprecation ≠ removal; cross-project = asset-level only per ADR-009.

## Priority 4 — Platform and business

### 22. Network API protocol ✅ ACCEPTED

Choose transport and finalize request/response/event schemas, authentication, versioning, rate limits, retries, and offline synchronization.


**Status:** ACCEPTED 2026-09-05 — see ADR-048 in `docs/DPT_ARCHITECTURE_DECISIONS.md`. Canonical: transport-independent contract; canonical API_MESSAGE envelope (api_version, sender_identity, caller_authority, idempotency_key, severity_tier, audit_chain_ref); AUTHENTICATION ≠ AUTHORIZATION; internal vs external surfaces; codec-neutral schema registry; transport = adapter (deferred choice); per-caller rate limits with severity bypass; idempotent mutations per ADR-040; offline sync distinguishes advisory/authority/audit/PI state classes.

### 23. Pool architecture ✅ ACCEPTED

Finalize Pool types, asset lifecycle, validation, versioning, compatibility metadata, and discovery/search semantics.


**Status:** ACCEPTED 2026-09-05 — see ADR-049 in `docs/DPT_ARCHITECTURE_DECISIONS.md`. Canonical: 8 POOL_* types; Pool stores DESIGN-TIME definitions per ADR-029; 5-state lifecycle (DRAFT→UNDER_REVIEW→PUBLISHED→DEPRECATED→REMOVED); 3 validation tiers per ADR-042 (VALIDATED/CERTIFIED/REJECTED); 6 mandatory compatibility dimensions; capability-routed discovery per ADR-039; audit-chained mutations per ADR-041; Pool ≠ Project Intelligence per ADR-009.

### 24. Credit economy ✅ ACCEPTED

Finalize contribution rewards, consumption costs, free period, subscription plans, request limits, validation status, and anti-abuse rules.

The currently discussed example is:

```text
Consume reusable Component → -10 Credits
Valid Pitfall contribution → +3 Credits after approval
```

This is a concept, not a final price.


**Status:** ACCEPTED 2026-09-06 — see ADR-050 in `docs/DPT_ARCHITECTURE_DECISIONS.md`. Canonical: credits are internal governance abstraction (NOT real currency); economy is advisory-only; all unit costs/rewards configurable_with_defaults (TBD pending real-project evidence); free period = temporary access with revert-on-expiry; subscription tiers = feature flags + request limits (not architecture changes); anti-abuse rules observable (ABUSE_INDICATOR events mandatory); validation × economy independent; cross-project transfer gated by CONTRIBUTION_CANDIDATE approval (ADR-042); audit-chained via ECONOMY_MUTATION_RECORD per ADR-041.

### 25. API monetization ✅ ACCEPTED

Decide when/how the two-way DPT API moves from free contribution/data enrichment to subscription or usage-based access.


**Status:** ACCEPTED 2026-09-06 — see ADR-051 in `docs/DPT_ARCHITECTURE_DECISIONS.md`. Canonical: monetization = policy-layer mapping between API methods and credit costs (ADR-050); DPT API does NOT process payments; emits MONETIZED_OPERATION_RECORD with audit-chain ref (ADR-041); rate limits ≠ quotas (two independent mechanisms); pricing visibility OWNER_ONLY default; all decisions versioned per ADR-043; external billing out of scope.

### 26. Runtime/packaging and execution persistence ⏸️ DEFERRED

Define the actual project-side packaging and deployment mechanism for the Front Agent/Connector and any local DPT boundary. Select the persistence model for Plans, Task DAGs, Work Orders, Attempts, Artifacts, Results, Verification, Decisions, Escalations, policy snapshots, and audit history, including recovery and consistency guarantees.


**Status:** DEFERRED 2026-09-06. This decision describes implementation-tier choices that are explicitly listed in the document's own 'Explicit non-goals until architecture is settled' section: 'a runtime, database schema, queue, lock service, or agent-provider integration.' Per Apex AI DPT V0 spec-first mode: runtime, packaging, persistence model selection, and agent-provider integration are intentionally deferred to Foundation work + real-project evidence. The architecture IS the deferral. No ADR created. Revisit only when (a) Foundation work produces concrete project-side agent artifacts, (b) ≥1 real deployment provides usage-data on persistence patterns, (c) governance review confirms implementation is stable enough for canonicalization.

## Execution-control decision status (DPT-RECON-003 reconciliation)

Appendix added by DPT-RECON-003. The numbered items above are the canonical
living backlog. The execution-control register (OD codes traced to the
DPT-RECON-001 audit) is reconciled here. Status semantics:

- **BOUND** — the framework contract is now explicit (`docs/DPT_TASK_SYSTEM.md`,
  ADR-027); the implementation decision remains OPEN pending Foundation work
  and real-project evidence. BOUND does not falsely close implementation
  decisions.
- **OPEN** — genuinely unresolved; unchanged.

| ID | Decision | Status after DPT-RECON-003 |
|----|----------|---------------------------|
| OD-001 | Task Passport schema and lifecycle | BOUND at contract level; runtime lifecycle OPEN |
| OD-002 | Work Order contract formalization | BOUND at contract level; serialization/transport OPEN |
| OD-003 | Agent vs Skill boundary (Decision #3 ontology) | ACCEPTED 2026-09-05 — see ADR-029 |
| OD-004 | Task DAG scheduling algorithm | READY rule BOUND (deterministic); scheduling algorithm OPEN |
| OD-005 | Runtime authority policy evaluation mechanism | BOUND: materialize-before-execute + preflight; mechanism OPEN |
| OD-006 | Runtime intent intake format | OPEN |
| OD-007 | Batch scheduling and subagent delegation | Delegation contract BOUND; batch scheduling OPEN |
| OD-008 | Provider-neutral orchestrator runtime transport | OPEN |
| OD-009 | Persistent project memory schema | OPEN |
| OD-010 | Workflow state management mechanism | Lifecycle states BOUND; mechanism OPEN |
| OD-011 | Quality-gate execution mechanism | Gate semantics preserved; execution mechanism OPEN |
| OD-012 | Human approval interface | Human Gate semantics BOUND; approval interface OPEN |
| OD-013–OD-020 | Non-execution-control decisions | OPEN (outside DPT-RECON-003 scope) |

## Explicit non-goals until architecture is settled

Do not prematurely freeze:

- a specific transport protocol;
- a specific AI vendor;
- a specific database;
- a specific Agent framework;
- implementation details of the Trust Dome;
- credit pricing;
- a runtime, database schema, queue, lock service, or agent-provider integration;
- execution outside explicit Authority Policy.
