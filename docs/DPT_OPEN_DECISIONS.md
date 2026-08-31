# Apex AI DPT — Open Decisions

**Status:** Living backlog for architecture decisions

This document records topics intentionally not frozen yet. It prevents unresolved design questions from being forgotten while the architecture is developed.

## Priority 1 — Core architecture

### 1. Project Intelligence machine-readable schema

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

### 2. Scout discovery strategy

Define how Scout obtains information efficiently across different stacks and repository shapes without defaulting to full-repository repeated reading.

Questions:

- what is the baseline scan?
- what is incremental?
- how is relevance determined?
- what evidence is sufficient?
- how are uncertain findings represented?

### 3. Agent vs Skill boundary

Define when a capability should be:

- a Skill;
- an Agent;
- a Brain;
- a Workflow;
- a reusable Component/Module.

### 4. Front Agent lifecycle

Define:

- provisioning of a Project Front Agent instance;
- identity and project binding;
- update/version strategy from the DPT reference;
- local persistence;
- offline behavior;
- isolation between projects.

### 5. Gateway and Trust Boundary

Define the exact boundary between:

```text
Project
  ↓
Front Agent
  ↓
Trust Boundary
  ↓
Gateway Agent
  ↓
DPT Ecosystem
```

Including identity, authentication, authorization, isolation, policy enforcement, audit, and direct-access rejection.

### 6. Exact mode and entity state names

Finalize machine identifiers and lifecycle states without reopening the accepted six-mode semantics. Decide whether "Service Mode" and "Authority Mode" remain aliases or become separate presentation/policy terms. Define exact state names and transition guards for Plan, Task, Work Order, Attempt, Verification, Decision, and Escalation.

### 7. Authority persistence and evaluation model

Define policy storage, versioning, resolution, effective-time behavior, audit records, approval evidence, revocation propagation, and consistency guarantees. The semantic rule that specific policy overrides general mode is already accepted.

### 8. Resource lock / lease model

Define claim compatibility, lock versus lease semantics, acquisition order, expiry, renewal, fencing, deadlock avoidance, stale executor recovery, and behavior during network partitions.

### 9. Verifier independence

Decide when the executor may verify its own Result and when policy/risk requires an independent Agent, tool, human, or environment. Define how conflicting verification evidence is resolved.

### 10. Retry, cancellation, and revocation semantics

Define retry budgets and backoff, idempotency requirements, Attempt lineage, cooperative versus forced cancellation, safe points, compensation, partial Results, kill-switch propagation, and containment when immediate cancellation is more dangerous than controlled completion.

### 11. Task graph mutation rules

Define who may add, remove, split, merge, or reorder Tasks; cycle detection; graph versioning; invalidation of downstream readiness/verification; and which mutations require approval or re-evaluation of authority.

### 12. Merge ownership and integration authority

Define who owns branch/worktree integration, conflict resolution, merge order, final acceptance, rollback, and protected-branch gates when multiple executors produce compatible but overlapping Artifacts.

### 13. Routing taxonomy

Define the routing dimensions used to select Analyst, Orchestrator, executor, verifier, workflow, and escalation destination, including capability, risk, authority, environment, data sensitivity, cost, latency, and resource affinity.

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

### 18. Greenfield advisory flow

Define the complete flow from product idea to project blueprint and capability/agent assembly while preserving the non-invasive Advisory Plane. Any later execution must enter the separate Execution Control Plane through explicit Authority Policy.

### 19. Proactive DPT behavior

Define when DPT may proactively notify a project about:

- relevant Components/Modules;
- Pitfalls;
- security issues;
- updates;
- capability gaps;
- architecture opportunities;
- contribution opportunities.

### 20. Project intelligence update triggers

Define how changes in a project cause targeted Scout refreshes and when a broader rescan is justified.

### 21. DPT update propagation

Define how subscribed projects receive validated asset/intelligence updates, compatibility information, deprecations, and migration notices without DPT modifying project code.

## Priority 4 — Platform and business

### 22. Network API protocol

Choose transport and finalize request/response/event schemas, authentication, versioning, rate limits, retries, and offline synchronization.

### 23. Pool architecture

Finalize Pool types, asset lifecycle, validation, versioning, compatibility metadata, and discovery/search semantics.

### 24. Credit economy

Finalize contribution rewards, consumption costs, free period, subscription plans, request limits, validation status, and anti-abuse rules.

The currently discussed example is:

```text
Consume reusable Component → -10 Credits
Valid Pitfall contribution → +3 Credits after approval
```

This is a concept, not a final price.

### 25. API monetization

Decide when/how the two-way DPT API moves from free contribution/data enrichment to subscription or usage-based access.

### 26. Runtime/packaging and execution persistence

Define the actual project-side packaging and deployment mechanism for the Front Agent/Connector and any local DPT boundary. Select the persistence model for Plans, Task DAGs, Work Orders, Attempts, Artifacts, Results, Verification, Decisions, Escalations, policy snapshots, and audit history, including recovery and consistency guarantees.

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
