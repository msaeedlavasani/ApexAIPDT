# DPT-REC-001 — ApexAIPDT ↔ Execution Orchestrator Lab Reconciliation Report

## 1. Artifact Metadata

| Field | Value |
|-------|-------|
| Task ID | DPT-REC-001 |
| Report Type | RECONCILIATION |
| Generated | 2026-09-02 |
| Canonical Repository | `/Users/msl/Documents/GitHub/ApexAIPDT` |
| Canonical Branch | `main` |
| Canonical HEAD | `50b0bd19e957d9a79131508839fbc8b1ca48291a` |
| Lab Repository | `/Users/msl/Apex-Orchestrator-Lab` |
| Lab Branch | `m1.1-hardening` |
| Lab HEAD | `be5ecc10cce50e0f6acdec99b650a10fc16a8556` |
| Analysis Mode | Read-only reconciliation / discovery / migration planning |
| Provider/Runtime | OpenCode (preferred primary execution provider) |
| Model | Not applicable (specification-first + proven runtime modules) |

**Canonical relationship:**

- **ApexAIPDT** = canonical product repository
- **Apex-Orchestrator-Lab** = incubation / proof / hardening environment

Proven Lab capabilities may be ADOPTED, ADAPTED, or REJECTED into ApexAIPDT after compatibility analysis. Do NOT blindly copy the Lab into ApexAIPDT.

---

## 2. Executive Summary

**ApexAIPDT** is a pure specification repository: 8 brain specs, 8 core operational specs, 18 architecture/governance documents, 6 lifecycle workflows, 9 artifact templates. Zero executable code. The V0 operating model layer is complete per ROADMAP; V0.1 through V2 are not started.

**Apex-Orchestrator-Lab** is a working execution control plane implementation: 26 source modules (~2,500 lines of JavaScript), 7 test files (~87 test cases), implementing durable task state, failure classification, provider/model routing, route health and ranking, resource claims and leases, parallel scheduling with bounded concurrency, worker isolation, review authority and journal, batch manifests with member failure isolation, and integration control with provenance.

**Major overlap:** The Lab has implemented runtime capabilities that ApexAIPDT defines only semantically (task state machine, failure classification, resource claims, review, batch, integration). No conflicts exist on these capabilities — the Lab provides concrete implementations of ApexAIPDT's abstract specifications.

**Major drift/conflicts:**
1. Brain/Role/Agent taxonomy is explicitly unresolved in ApexAIPDT (line 118 of DPT_AGENT_ARCHITECTURE.md) and the Lab does not reference brains at all.
2. Task entity model diverges: ApexAIPDT defines Intent→Plan→Task→Work Order→Attempt→Result→Verification; Lab defines a 12-state TaskState machine spanning multiple ApexAIPDT entities.
3. The Lab's proof closure document (APEX_EXECUTION_ORCHESTRATOR_LAB_PROOF_CLOSURE.md) classifies most capabilities as "PROOF_ONLY_NOT_IMPLEMENTED" but the committed runtime at HEAD has implemented many of them.

**Overall adoption direction:** ADOPT core execution control plane modules from Lab into ApexAIPDT's new `core/runtime/` directory, after entity model reconciliation (DPT-MIG-001.A–C). Advisory Plane concepts remain canonical in ApexAIPDT.

**Self-hosting readiness:** NOT_READY. Missing: runtime intent intake, authority policy evaluation engine, task DAG scheduling, Work Order contract, provider adapter abstraction, durable Human Gate implementation, batch orchestration across full pipeline.

**Recommended immediate next step:** DPT-MIG-001.A — Reconcile Task Entity Model (documentation-only mapping).

---

## 3. Canonical ApexAIPDT Baseline

### 3.1 Governance / Documentation

| Artifact | Path | Status |
|----------|------|--------|
| Constitution | `docs/APEX_AI_DPT_CONSTITUTION.md` | 30 articles, accepted |
| Vision | `docs/APEX_AI_DPT_VISION.md` | V0 scope defined |
| Terminology | `docs/APEX_AI_DPT_TERMINOLOGY.md` | 40+ terms defined |
| System Model | `docs/DPT_SYSTEM_MODEL.md` | Two-plane platform, accepted |
| Architecture Decisions | `docs/DPT_ARCHITECTURE_DECISIONS.md` | 26 ADRs accepted |
| Open Decisions | `docs/DPT_OPEN_DECISIONS.md` | 26 open decisions |
| ROADMAP | `ROADMAP.md` | V0 complete, V0.1+ not started |

### 3.2 Advisory Plane

| Concept | Source | Status |
|---------|--------|--------|
| Project Intelligence | `docs/DPT_PROJECT_INTELLIGENCE.md` | Spec-only, 8 intelligence layers |
| Scout / Analyst | `docs/DPT_AGENT_ARCHITECTURE.md` | Spec-only, separate responsibilities |
| Component Pool | `docs/DPT_POOL_ARCHITECTURE.md` | Spec-only, 8 Pool families |
| Pitfall Pool | `docs/DPT_POOL_ARCHITECTURE.md` + `docs/FAILURE_INTELLIGENCE.md` | Spec-only |
| Capability Engine | `docs/CAPABILITY_ENGINE.md` | Spec-only |
| Capability Intelligence | `docs/DPT_PROJECT_INTELLIGENCE.md` | Spec-only |
| Architecture Advisory | `brains/ARCHITECTURE.md` | Spec-only |
| Recommendations | Various | Spec-only |

### 3.3 Execution Control Plane

| Concept | Source | Status |
|---------|--------|--------|
| Execution Orchestrator | `core/ORCHESTRATOR.md` | Spec-only (73 lines) |
| Task Graph / DAG | `docs/DPT_EXECUTION_CONTROL_MODEL.md` | Spec-only, entity model defined |
| Scheduler | `core/TEAM_ASSEMBLY.md` | Spec-only |
| Resource Manager | `docs/DPT_EXECUTION_CONTROL_MODEL.md` | Spec-only, Resource/ResourceClaim model |
| Worker Manager | Not defined | MISSING |
| Model/Provider Router | Not defined | MISSING |
| Failure Classifier | `docs/FAILURE_INTELLIGENCE.md` | Spec-only, domain+runtime taxonomy |
| Result Validator | `docs/DPT_EXECUTION_CONTROL_MODEL.md` | Spec-only, Verification is first-class |
| Review Control | `core/ORCHESTRATOR.md` | Spec-only |
| Batch Control | Not defined | MISSING |
| Integration Control | Not defined | MISSING |
| Human Gates | `docs/DPT_AUTHORITY_MODEL.md` | Spec-only, 6 authority modes |
| Git/Delivery Evidence | Not defined | MISSING |
| Closure/Reconciliation | Not defined | MISSING |

### 3.4 Runtime Implementation

**None.** The repository contains zero executable code. The README explicitly states: "This repository defines the Apex AI DPT V0 framework and architecture. It is intentionally specification-first." The ROADMAP confirms V1 ("Production runtime") is not started.

### 3.5 Brains

8 brain specifications exist in `brains/`, all following `brains/BRAIN_CONTRACT.md`. Each defines Identity, Responsibilities, Authority (Autonomous/Coordinate/Escalate), and partial Outputs. All 8 are **incomplete** relative to their own contract — missing Non-responsibilities, Inputs, Dependencies, Validation, Memory, and Failure modes.

| Brain | Source | Completeness |
|-------|--------|-------------|
| Product | `brains/PRODUCT.md` | ~40% |
| Design | `brains/DESIGN.md` | ~40% |
| Architecture | `brains/ARCHITECTURE.md` | ~40% |
| Engineering | `brains/ENGINEERING.md` | ~35% |
| QA | `brains/QA.md` | ~35% |
| Data | `brains/DATA.md` | ~40% |
| Security | `brains/SECURITY.md` | ~40% |
| Operations | `brains/OPERATIONS.md` | ~35% |

### 3.6 Roles / Agents

8 agent roles defined in `docs/DPT_AGENT_ARCHITECTURE.md`: Front Agent, Gateway Agent, Project Scout, AI Analyst, Greenfield Product/Architecture Agent, Failure/Pitfall Agent, Capability Assembly, Execution Orchestrator.

The Brain/Role/Agent distinction is **explicitly unresolved** (DPT_AGENT_ARCHITECTURE.md line 118).

### 3.7 Task / Workflow Concepts

| Concept | Source | Status |
|---------|--------|--------|
| Intent | `docs/DPT_EXECUTION_CONTROL_MODEL.md` | Spec-only entity |
| Plan | `docs/DPT_EXECUTION_CONTROL_MODEL.md` | Spec-only entity |
| Task | `docs/DPT_EXECUTION_CONTROL_MODEL.md` | Spec-only entity |
| Work Order | `docs/DPT_EXECUTION_CONTROL_MODEL.md` | Spec-only entity |
| Attempt | `docs/DPT_EXECUTION_CONTROL_MODEL.md` | Spec-only entity |
| Artifact | `docs/DPT_EXECUTION_CONTROL_MODEL.md` | Spec-only entity |
| Result | `docs/DPT_EXECUTION_CONTROL_MODEL.md` | Spec-only entity |
| Verification | `docs/DPT_EXECUTION_CONTROL_MODEL.md` | Spec-only entity |
| Decision | `docs/DPT_EXECUTION_CONTROL_MODEL.md` | Spec-only entity |
| Escalation | `docs/DPT_EXECUTION_CONTROL_MODEL.md` | Spec-only entity |
| Workflow Engine | `core/WORKFLOW_ENGINE.md` | Spec-only, versioned state machine |
| Task Passport | Not defined | MISSING (future direction) |
| Context Receipt | Not defined | MISSING (future direction) |
| Delta Prompt | Not defined | MISSING (future direction) |

### 3.8 Tests / Evidence

**None.** No test files, no validation artifacts, no runtime evidence exist in ApexAIPDT. The repository is purely specification.

---

## 4. Lab Baseline

### 4.1 Runtime Modules

| Module | Path | Lines | Status |
|--------|------|-------|--------|
| Baseline capture | `orchestrator/core/baseline.mjs` | 142 | IMPLEMENTED |
| Review verdict parser | `orchestrator/core/decision.mjs` | 5 | IMPLEMENTED |
| JSON stream parser | `orchestrator/core/parser.mjs` | 34 | IMPLEMENTED |
| Worker runner | `orchestrator/core/runner.mjs` | 122 | IMPLEMENTED |
| Task policy engine | `orchestrator/core/task-policy.mjs` | 162 | IMPLEMENTED |
| Task model (enums) | `orchestrator/state/task-model.mjs` | 66 | IMPLEMENTED |
| Durable task state | `orchestrator/state/durable-task-state.mjs` | 249 | IMPLEMENTED |
| Task state facade | `orchestrator/state/task-state.mjs` | 38 | IMPLEMENTED |
| Route model | `orchestrator/routing/route-model.mjs` | 91 | IMPLEMENTED |
| Route registry | `orchestrator/routing/route-registry.mjs` | 109 | IMPLEMENTED |
| Route health | `orchestrator/routing/route-health.mjs` | 125 | IMPLEMENTED |
| Route ranking | `orchestrator/routing/route-ranking.mjs` | 69 | IMPLEMENTED |
| Route selector | `orchestrator/routing/route-selector.mjs` | 27 | IMPLEMENTED |
| Route policy integration | `orchestrator/routing/route-policy-integration.mjs` | 78 | IMPLEMENTED |
| Resource claims | `orchestrator/scheduler/resource-claims.mjs` | 72 | IMPLEMENTED |
| Lease manager | `orchestrator/scheduler/lease-manager.mjs` | 111 | IMPLEMENTED |
| Worker manager | `orchestrator/scheduler/worker-manager.mjs` | 52 | IMPLEMENTED |
| Parallel scheduler | `orchestrator/scheduler/parallel-scheduler.mjs` | 203 | IMPLEMENTED |
| Worker result schema | `orchestrator/evidence/worker-result.mjs` | 77 | IMPLEMENTED |
| Failure record schema | `orchestrator/evidence/failure-record.mjs` | 57 | IMPLEMENTED |
| Failure classifier | `orchestrator/evidence/failure-classifier.mjs` | 168 | IMPLEMENTED + TESTED |
| Review model | `orchestrator/review/review-model.mjs` | 68 | IMPLEMENTED |
| Review authority | `orchestrator/review/review-authority.mjs` | 50 | IMPLEMENTED + TESTED |
| Review journal | `orchestrator/review/review-journal.mjs` | 134 | IMPLEMENTED |
| Batch controller | `orchestrator/batch/batch-controller.mjs` | 323 | IMPLEMENTED + TESTED |
| Integration controller | `orchestrator/integration/integration-controller.mjs` | 299 | IMPLEMENTED + TESTED |
| Integration provenance | `orchestrator/integration/integration-provenance.mjs` | 86 | IMPLEMENTED |

### 4.2 Tests

| Test File | Path | Test Cases | Coverage |
|-----------|------|------------|----------|
| Failure classifier regression | `tests/failure-classifier-regression.mjs` | 22 | failure-classifier, worker-result, task-policy, task-model |
| Route registry policy regression | `tests/route-registry-policy-regression.mjs` | 20 | All 6 routing modules |
| Task policy state regression | `tests/task-policy-state-regression.mjs` | 12 | task-policy, durable-task-state, task-model |
| Parallel scheduler regression | `tests/parallel-scheduler-regression.mjs` | 8 | parallel-scheduler, lease-manager, worker-manager, resource-claims |
| Review batch integration regression | `tests/review-batch-integration-regression.mjs` | 25 | review, batch, integration modules |
| Baseline regression | `tests/baseline-regression.mjs` | 11 groups | baseline capture and porcelain parsing |
| Module load regression | `tests/orchestrator-load-regression.mjs` | 30 assertions | All 18+ modules import verification |

**Total: ~128 test cases / assertion groups.**

### 4.3 Capabilities — Status Classification

| Capability | Status |
|-----------|--------|
| Durable task state (journal + snapshot) | IMPLEMENTED |
| Event/journal state (append-only JSONL) | IMPLEMENTED |
| Reconciliation (RUNNING → ESCALATION on restart) | IMPLEMENTED |
| Blocker semantics (6 types, evidence-gated) | IMPLEMENTED |
| Escalation semantics (5 paths, disposition-gated) | IMPLEMENTED |
| Structured WorkerResult (20+ fields) | IMPLEMENTED |
| FailureRecord (8 domains, 3 strengths) | IMPLEMENTED |
| Failure classification (priority-ordered signals) | IMPLEMENTED + TESTED |
| Provider/model routing (deterministic ID) | IMPLEMENTED |
| Route health (9 states, transitions, backoff) | IMPLEMENTED |
| Route ranking (eligibility + scoring) | IMPLEMENTED + TESTED |
| Retry/reroute (post-failure decision integration) | IMPLEMENTED + TESTED |
| Policy-denial handling (bypass forbidden) | IMPLEMENTED + TESTED |
| Resource claims (READ/WRITE/EXCLUSIVE, PHYSICAL/LOGICAL) | IMPLEMENTED |
| Leases/locks (journal-backed, idempotent) | IMPLEMENTED |
| Parallel scheduling (maxConcurrency bounded) | IMPLEMENTED + TESTED |
| Bounded concurrency | IMPLEMENTED |
| Isolated workers (git worktree + DB) | IMPLEMENTED |
| Restart recovery (journal replay) | IMPLEMENTED + TESTED |
| Ambiguous RUNNING recovery (fail-closed) | IMPLEMENTED + TESTED |
| Review authority (role gate, self-approval denied) | IMPLEMENTED + TESTED |
| Exact candidate SHA review binding | IMPLEMENTED + TESTED |
| Developer/reviewer separation | IMPLEMENTED + TESTED |
| Rework (supersede + fresh review) | IMPLEMENTED + TESTED |
| Review journal (append-only, idempotent) | IMPLEMENTED |
| Batch manifests (SHA-256 digest, ORIGINAL/REDUCED) | IMPLEMENTED |
| Immutable original batch | IMPLEMENTED |
| Reduced-batch authorization | IMPLEMENTED + TESTED |
| Member failure isolation | IMPLEMENTED + TESTED |
| Integration control (admit gates, conflict handling) | IMPLEMENTED + TESTED |
| Provenance (SHA binding, content identity) | IMPLEMENTED + TESTED |
| Human Gate — state existence | PARTIAL |
| Human Gate — durable approval state | NOT IMPLEMENTED |
| Human Gate — consume-once semantics | NOT IMPLEMENTED |
| Human Gate — exact action/SHA binding | NOT IMPLEMENTED |
| Authority Policy engine | NOT IMPLEMENTED |
| Context system | NOT IMPLEMENTED |
| Memory system | NOT IMPLEMENTED |
| Capability Engine | NOT IMPLEMENTED |
| Pool Architecture | NOT IMPLEMENTED |
| Front Agent / Gateway | NOT IMPLEMENTED |
| Network API | NOT IMPLEMENTED |
| Credit Economy | NOT IMPLEMENTED |
| Task Passport | NOT IMPLEMENTED |
| Context Receipt | NOT IMPLEMENTED |
| Provider adapter abstraction | NOT IMPLEMENTED |
| General workflow engine (DAG) | NOT IMPLEMENTED |

### 4.4 Proof Closure Document Status

The Lab's `docs/validation/APEX_EXECUTION_ORCHESTRATOR_LAB_PROOF_CLOSURE.md` classifies most capabilities as "PROOF_ONLY_NOT_IMPLEMENTED" or "SIMULATED_PROVEN". This is **stale** — HEAD is 6 commits ahead of the closure commit (a759393). Subsequent commits added durable task state, structured worker evidence, failure classification, dynamic route selection, resource-aware parallel scheduler, and review/batch/integration control plane. The closure document should be updated but this is a Lab-internal concern.

---

## 5. Capability Reconciliation Matrix

| Capability | ApexAIPDT State | Lab State | Evidence | Conflict/Overlap | Canonical Owner | Recommendation |
|-----------|----------------|-----------|----------|------------------|-----------------|----------------|
| Task model (states, transitions) | Spec-only: Intent/Plan/Task/Work Order/Attempt | Implemented: 12-state TaskState machine | Lab: task-model.mjs, durable-task-state.mjs | SEMANTIC_OVERLAP | Execution Control Plane | ADAPT |
| Durable task state | Not implemented | Journal + snapshot, revision tracking | Lab: durable-task-state.mjs | NO_CONFLICT | Execution Control Plane | ADOPT |
| Event/journal state | Not implemented | Append-only JSONL in 4 stores | Lab: durable-task-state.mjs, lease-manager.mjs, parallel-scheduler.mjs, review-journal.mjs | NO_CONFLICT | Execution Control Plane | ADOPT |
| Reconciliation | Not implemented | RUNNING → ESCALATION on restart | Lab: parallel-scheduler.mjs:59-67 | NO_CONFLICT | Execution Control Plane | ADOPT |
| Blocker semantics | Spec-only: BACKLOG_BLOCKED mentioned | 6 BlockerType values, evidence-gated | Lab: task-model.mjs, task-policy.mjs | SEMANTIC_OVERLAP | Execution Control Plane | ADAPT |
| Escalation semantics | Spec-only: core/ORCHESTRATOR.md | 5 escalation paths, disposition-gated | Lab: task-policy.mjs | SEMANTIC_OVERLAP | Execution Control Plane | ADAPT |
| WorkerResult schema | Not implemented | 20+ field schema with completion_contract | Lab: worker-result.mjs | NO_CONFLICT | Execution Control Plane | ADOPT |
| FailureRecord schema | Not implemented | 8-domain, 3-strength classification | Lab: failure-record.mjs | NO_CONFLICT | Execution Control Plane | ADOPT |
| Failure classification | Spec-only: FAILURE_INTELLIGENCE.md taxonomy | Priority-ordered signal evaluation, regex patterns | Lab: failure-classifier.mjs | SEMANTIC_OVERLAP | Execution Control Plane | ADAPT |
| Provider/model routing | Not implemented | Deterministic route ID, registry | Lab: route-model.mjs, route-registry.mjs | NO_CONFLICT | Execution Control Plane | ADOPT |
| Route health | Not implemented | 9 health states, transitions, backoff | Lab: route-health.mjs | NO_CONFLICT | Execution Control Plane | ADOPT |
| Route ranking | Not implemented | Eligibility + scoring, stable tie-break | Lab: route-ranking.mjs | NO_CONFLICT | Execution Control Plane | ADOPT |
| Retry/reroute | Not implemented | Post-failure decision integration | Lab: route-policy-integration.mjs | NO_CONFLICT | Execution Control Plane | ADOPT |
| Resource claims | Spec-only: DPT_EXECUTION_CONTROL_MODEL.md | READ/WRITE/EXCLUSIVE, conflict detection | Lab: resource-claims.mjs | SEMANTIC_OVERLAP | Execution Control Plane | ADAPT |
| Leases/locks | Spec-only: open decision #8 | Journal-backed, idempotent acquire/release | Lab: lease-manager.mjs | NO_CONFLICT | Execution Control Plane | ADOPT |
| Parallel scheduling | Not implemented | maxConcurrency bounded, dependency-aware | Lab: parallel-scheduler.mjs | NO_CONFLICT | Execution Control Plane | ADOPT |
| Worker isolation | Not implemented | Git worktree + separate DB per worker | Lab: worker-manager.mjs | NO_CONFLICT | Execution Control Plane | ADOPT |
| Review authority | Spec-only: implied in ORCHESTRATOR.md | Structural: role=REVIEWER, self-approval denied | Lab: review-authority.mjs | NO_CONFLICT | Execution Control Plane | ADOPT |
| Review journal | Not implemented | Append-only JSONL, idempotent, SHA-bound | Lab: review-journal.mjs | NO_CONFLICT | Execution Control Plane | ADOPT |
| Batch manifests | Not implemented | SHA-256 digest, ORIGINAL/REDUCED | Lab: batch-controller.mjs | NO_CONFLICT | Execution Control Plane | ADOPT |
| Member failure isolation | Not implemented | One member's rework never demotes another's approval | Lab: batch-controller.mjs | NO_CONFLICT | Execution Control Plane | ADOPT |
| Integration control | Not implemented | Admit gates, conflict handling, provenance | Lab: integration-controller.mjs | NO_CONFLICT | Execution Control Plane | ADOPT |
| Human Gates | Spec-only: Authority Model | WAITING_FOR_HUMAN_GATE state; no durable approval store | Lab: batch-controller.mjs, task-policy.mjs | PARTIAL_OVERLAP | Execution Control Plane | REQUIRES_DECISION |
| Brain/Role/Agent model | 8 brain specs + Agent Architecture | No brain references; concrete roles only | Both | ARCHITECTURAL_CONFLICT | Advisory Plane | REQUIRES_DECISION |
| Authority Policy | Spec-only: 6 modes, policy structure | Not implemented; role separation via code | ApexAIPDT | MISSING in Lab | Advisory + Execution | DEFER |
| Context system | Spec-only: core/CONTEXT_SYSTEM.md | Not implemented | ApexAIPDT | MISSING | Advisory Plane | DEFER |
| Memory system | Spec-only: core/MEMORY_SYSTEM.md | Not implemented | ApexAIPDT | MISSING | Advisory Plane | DEFER |
| Workflow engine (DAG) | Spec-only: core/WORKFLOW_ENGINE.md | Sequential pipeline only (index.mjs) | Both | SEMANTIC_OVERLAP | Execution Control Plane | DEFER |
| Capability Engine | Spec-only: CAPABILITY_ENGINE.md | Not implemented | ApexAIPDT | MISSING | Advisory Plane | DEFER |
| Pool Architecture | Spec-only: DPT_POOL_ARCHITECTURE.md | Not implemented | ApexAIPDT | MISSING | Advisory Plane | DEFER |
| Failure Intelligence (Pitfall Pool) | Spec-only: FAILURE_INTELLIGENCE.md | Failure classification implemented; Pitfall Pool not | Both | PARTIAL_OVERLAP | Advisory + Execution | ADAPT |
| Front Agent / Gateway | Spec-only: DPT_AGENT_ARCHITECTURE.md | Not implemented | ApexAIPDT | MISSING | Boundary | DEFER |
| Network API | Spec-only: DPT_NETWORK_API.md | Not implemented | ApexAIPDT | MISSING | Boundary | DEFER |
| Credit Economy | Spec-only: DPT_CREDIT_ECONOMY.md | Not implemented | ApexAIPDT | MISSING | Business | REJECT |
| Task Passport | Not defined | Not implemented | Neither | MISSING | Execution Control Plane | DEFER |
| Context Receipt | Not defined | Not implemented | Neither | MISSING | Execution Control Plane | DEFER |
| Provider adapter abstraction | Not defined | OpenCode-specific runner only | Lab: runner.mjs | MISSING | Execution Control Plane | DEFER |

---

## 6. Brain / Role / Agent Map

| Name | Current Type | Source | Purpose | Authority | Proposed Canonical Type | Notes |
|------|-------------|--------|---------|-----------|------------------------|-------|
| Product Brain | BRAIN (spec) | brains/PRODUCT.md | Product intent, outcomes, priorities | Autonomous: requirements, criteria, prioritization; Coordinate: design/architecture implications; Escalate: strategy, scope, brand | Brain | Incomplete (missing non-responsibilities, inputs, dependencies, validation, memory, failure modes) |
| Design Brain | BRAIN (spec) | brains/DESIGN.md | UX, visual, interaction patterns | Autonomous: composition, spacing, asset analysis; Coordinate: product/architecture; Escalate: brand, creative direction | Brain | Same gaps |
| Architecture Brain | BRAIN (spec) | brains/ARCHITECTURE.md | System boundaries, tech architecture | Autonomous: within boundaries, pattern selection; Coordinate: cross-domain, data model; Escalate: foundational changes, breaking contracts | Brain | Same gaps |
| Engineering Brain | BRAIN (spec) | brains/ENGINEERING.md | Implementation, tests, integration | Autonomous: routine coding, composition, tests; Coordinate: architecture, design system; Escalate: unapproved changes, dependency changes | Brain | Same gaps |
| QA Brain | BRAIN (spec) | brains/QA.md | Verification strategy, quality gates | Autonomous: layer selection, test creation, classification; Escalate: unresolved ambiguity, release-blocking quality | Brain | Missing Coordinate authority |
| Data Brain | BRAIN (spec) | brains/DATA.md | Analytics, metrics, instrumentation | Autonomous: derive instrumentation, define events; Coordinate: product, privacy; Escalate: KPI changes, privacy-sensitive | Brain | Same gaps |
| Security Brain | BRAIN (spec) | brains/SECURITY.md | Threats, auth, data protection | Autonomous: standard patterns, hygiene; Coordinate: architecture, operations; Escalate: material changes, regulated data | Brain | Same gaps |
| Operations Brain | BRAIN (spec) | brains/OPERATIONS.md | Deployability, observability, reliability | Autonomous: CI improvements, observability; Escalate: production-impacting changes, cost, reliability | Brain | Missing Coordinate authority |
| Front Agent | AGENT (spec) | docs/DPT_AGENT_ARCHITECTURE.md | Project-specific DPT representative | Represent project, maintain context, communicate through Gateway | Agent | Not a coding agent or orchestrator |
| Gateway Agent | AGENT (spec) | docs/DPT_AGENT_ARCHITECTURE.md | DPT-side trust boundary | Receive/route messages, enforce protocol | Agent | Not an orchestrator |
| Project Scout | AGENT (spec) | docs/DPT_AGENT_ARCHITECTURE.md | Discovery for existing projects | Discover facts, produce Project Intelligence | Agent | Does not modify project |
| AI Analyst | AGENT (spec) | docs/DPT_AGENT_ARCHITECTURE.md | Intelligence interpretation | Interpret, compare, generate proposals | Agent | Does not modify project |
| Greenfield Agent | AGENT (spec) | docs/DPT_AGENT_ARCHITECTURE.md | New project advisory | Process intent, propose structure | Agent | Blueprint is advisory |
| Failure/Pitfall Agent | AGENT (spec) | docs/DPT_AGENT_ARCHITECTURE.md | Failure intelligence | Classify, search pitfalls, diagnose, validate, contribute | Agent | Active at first failure |
| Capability Assembly | AGENT (spec) | docs/DPT_AGENT_ARCHITECTURE.md | Gap identification, capability assembly | Identify gaps, reuse/extend/create capabilities | Agent | Continuous during project |
| Execution Orchestrator | ROLE (spec) | core/ORCHESTRATOR.md + docs/ | Runtime coordination | Receive Intent, produce Plans/Task DAGs, evaluate policy, issue Work Orders, track Attempts, decide complete/retry/replan/cancel/escalate | Role | Belongs to Execution Control Plane; NOT a Brain |
| Architect | ROLE (runtime) | Lab: index.mjs | Produce implementation plan | Inspect source, identify risks, produce ARCHITECT_REPORT | Role (Lab-specific) | Maps to Engineering + Architecture brains |
| Developer | ROLE (runtime) | Lab: index.mjs | Implement task | Implement, test, produce DEVELOPER_REPORT | Role (Lab-specific) | Maps to Engineering brain |
| Reviewer | ROLE (runtime) | Lab: index.mjs | Independent verification | Inspect, verify, produce REVIEW_REPORT with STATUS: PASS/FAIL | Role (Lab-specific) | Maps to QA brain; developer/reviewer separation enforced |
| Integration Controller | ROLE (runtime) | Lab: integration-controller.mjs | Compose approved candidates | Admit, apply, verify integration | Role (Lab-specific) | Not in ApexAIPDT agent architecture |

**Key ambiguity:** DPT_AGENT_ARCHITECTURE.md line 118: "The exact boundary between a Skill, Agent, Workflow, and Brain remains an architectural decision to be finalized." The Lab uses concrete roles (architect, developer, reviewer) without referencing any brain abstraction. This requires governance cleanup before migration.

---

## 7. Documentation Drift

| # | Source | Claim | Observed Implementation | Recommended Correction Timing |
|---|--------|-------|------------------------|------------------------------|
| 1 | README.md:53 | "Execution Control — an Execution Orchestrator manages authorized Intent, Plans, Task DAGs, Work Orders, Attempts, Resources, Claims, Verification, Decisions, and Escalations" | No runtime exists in ApexAIPDT. The Lab implements many of these concepts. | Before migration batch DPT-MIG-002 — clarify that runtime is in Lab, not canonical repo |
| 2 | README.md:126-131 | "This repository defines the Apex AI DPT V0 framework... intentionally specification-first" and "Current runtime/connector and Orchestrator R&D is a validation implementation" | Correct for ApexAIPDT; but the Lab has progressed beyond "validation implementation" to tested runtime modules | After migration — update to reflect canonical runtime exists |
| 3 | Lab proof closure document | Most capabilities classified as "PROOF_ONLY_NOT_IMPLEMENTED" or "SIMULATED_PROVEN" | HEAD is 6 commits ahead; many capabilities are now IMPLEMENTED with tests | Lab-internal: update closure document to reflect current HEAD |
| 4 | DPT_OPEN_DECISIONS.md | Decision #26: "Define the actual project-side packaging and deployment mechanism" | Lab has a concrete packaging: `orchestrator/` directory with modular ES modules | After migration — some decisions may be partially resolved by Lab adoption |
| 5 | ROADMAP.md | V1 lists "Provider-neutral orchestrator runtime" as future | Lab has a provider-specific (OpenCode) runtime that could inform V1 | After migration — Lab evidence can inform V1 design |
| 6 | All brain files | Missing Non-responsibilities, Inputs, Dependencies, Validation, Memory, Failure modes | BRAIN_CONTRACT.md requires these sections | Before brain migration — complete brain specs per contract |
| 7 | DPT_AGENT_ARCHITECTURE.md:118 | "The exact boundary between a Skill, Agent, Workflow, and Brain remains an architectural decision to be finalized" | Lab uses concrete roles without brain abstraction; this decision remains unresolved | Before DPT-GOV-001 — resolve taxonomy |

---

## 8. Conflict Register

### CONFLICT-001: Brain/Role/Agent Taxonomy

- **Classification:** ARCHITECTURAL_CONFLICT
- **Sources:** `brains/` directory (8 brain specs), `docs/DPT_AGENT_ARCHITECTURE.md` (8 agent roles), Lab (4 concrete roles)
- **Description:** ApexAIPDT defines 8 Brain specifications as knowledge domains and 8 named agent roles. Lab uses concrete runtime roles (architect, developer, reviewer, integration_controller) without referencing any brain abstraction. DPT_AGENT_ARCHITECTURE.md explicitly states the boundary is unresolved.
- **Canonical meaning:** Advisory Plane defines Brains (knowledge/policy); Execution Control Plane assigns Roles (responsibility/permissions); Agents are executable actors. But this distinction is not enforced anywhere.
- **Evidence:** brains/ has 8 files; DPT_AGENT_ARCHITECTURE.md has 8 agent definitions; Lab has 0 brain references; DPT_AGENT_ARCHITECTURE.md:118 explicitly admits ambiguity.
- **Recommended disposition:** ADAPT — Lab's concrete roles should map to the future Brain → Role → Agent model, but governance cleanup is prerequisite.
- **Prerequisite before migration:** Resolve Brain/Role/Agent taxonomy in DPT-GOV-001.

### CONFLICT-002: Task Entity Model Divergence

- **Classification:** SEMANTIC_OVERLAP
- **Sources:** `docs/DPT_EXECUTION_CONTROL_MODEL.md` (10 entities), Lab `state/task-model.mjs` (12 TaskStates), Lab `evidence/worker-result.mjs` (20+ fields)
- **Description:** ApexAIPDT defines Intent→Plan→Task→Work Order→Attempt→Result→Verification→Decision. Lab defines a 12-state TaskState machine that spans multiple ApexAIPDT entities (RUNNING maps to Attempt; VERIFYING maps to Verification; REWORK_REQUIRED maps to a loop). WorkerResult maps to Attempt+Result.
- **Canonical meaning:** ApexAIPDT's entities are semantic; Lab's states are runtime transitions.
- **Evidence:** DPT_EXECUTION_CONTROL_MODEL.md defines 10 entities; Lab/task-model.mjs defines 12 states; Lab/worker-result.mjs defines 20+ fields.
- **Recommended disposition:** ADAPT — Produce a mapping document showing correspondence.
- **Prerequisite before migration:** Complete DPT-MIG-001.A entity mapping.

### CONFLICT-003: Failure Taxonomy Partial Overlap

- **Classification:** SEMANTIC_OVERLAP
- **Sources:** `docs/FAILURE_INTELLIGENCE.md` (domain+runtime taxonomy), Lab `evidence/failure-classifier.mjs` (FailureClass 16 values, FailureDomain 8 values)
- **Description:** ApexAIPDT defines domain classes (product, design, architecture, implementation, data, security, operations, test) and runtime classes (executor error, verification failure, policy denial, etc.). Lab implements FailureClass (16 values) which is more granular than ApexAIPDT's runtime class. Lab's FailureDomain (8 values) closely matches ApexAIPDT's domain classes.
- **Canonical meaning:** ApexAIPDT's taxonomy is advisory-level; Lab's is runtime-level.
- **Evidence:** FAILURE_INTELLIGENCE.md:27-33; Lab/failure-classifier.mjs:16-23; Lab/failure-record.mjs:9-18.
- **Recommended disposition:** ADAPT — Map Lab's FailureClass to ApexAIPDT's runtime taxonomy; map Lab's FailureDomain to ApexAIPDT's domain classes.
- **Prerequisite before migration:** Complete DPT-MIG-001.B taxonomy mapping.

### CONFLICT-004: Resource Model Simplification

- **Classification:** SEMANTIC_OVERLAP
- **Sources:** `docs/DPT_EXECUTION_CONTROL_MODEL.md` (hierarchical Resources with conflict domains, sensitivity, governance), Lab `scheduler/resource-claims.mjs` (READ/WRITE/EXCLUSIVE, PHYSICAL/LOGICAL)
- **Description:** ApexAIPDT defines Resources as hierarchical control-plane objects with conflict domains, sensitivity, governance classification, and ownership. Lab implements a simpler model with kind/mode and conflict detection. Lab lacks hierarchy, sensitivity, and governance.
- **Canonical meaning:** ApexAIPDT's model is the target; Lab's is V1.
- **Evidence:** DPT_EXECUTION_CONTROL_MODEL.md:36-92; Lab/resource-claims.mjs.
- **Recommended disposition:** ADOPT Lab's implementation as V1 with extension points for hierarchy, sensitivity, governance.
- **Prerequisite before migration:** Complete DPT-MIG-001.C resource mapping; identify extension points.

### CONFLICT-005: Proof Closure Staleness

- **Classification:** DOCUMENTATION_DRIFT
- **Sources:** Lab `docs/validation/APEX_EXECUTION_ORCHESTRATOR_LAB_PROOF_CLOSURE.md`, Lab HEAD (be5ecc1)
- **Description:** The proof closure document classifies most capabilities as "PROOF_ONLY_NOT_IMPLEMENTED" but the committed runtime at HEAD has implemented many of them with tests.
- **Canonical meaning:** The closure document is an historical artifact; current HEAD is the truth.
- **Evidence:** HEAD is 6 commits ahead of closure commit a759393. Subsequent commits added durable task state, structured evidence, failure classification, routing, scheduling, review, batch, integration.
- **Recommended disposition:** KEEP_CANONICAL — Lab-internal concern, not a migration blocker.
- **Prerequisite before migration:** None ( Lab updates its own closure document).

---

## 9. Lab Adoption Register

### ADOPT

| Capability | Rationale |
|-----------|-----------|
| Durable task state (journal + snapshot) | Proven, tested, provider-neutral, directly implements ApexAIPDT's execution control needs |
| Event/journal state (append-only JSONL) | Consistent pattern across 4 stores, testable, crash-safe |
| Reconciliation (RUNNING → ESCALATION) | Fail-closed, matches ApexAIPDT's escalation semantics |
| WorkerResult schema | Structured evidence, schema-versioned, completion_contract pattern |
| FailureRecord schema | 8-domain, 3-strength, schema-versioned |
| Failure classification | Priority-ordered, deterministic, regex-based provider error patterns, 22 test cases |
| Provider/model routing (registry + health + ranking) | Deterministic, provider-neutral, health-aware, 20 test cases |
| Retry/reroute (post-failure decision) | Integrates health, policy, selection; bypass-forbidden for security |
| Resource claims (READ/WRITE/EXCLUSIVE) | Provider-neutral, conflict detection, physical path containment |
| Leases/locks (journal-backed) | Idempotent, serialized, crash-safe |
| Parallel scheduling | maxConcurrency bounded, dependency-aware, 8 test cases |
| Worker isolation (git worktree + DB) | Provider-specific (OpenCode) but pattern is generalizable |
| Review authority (role gate, self-approval denied) | Structural invariant, 6+ test cases |
| Review journal (append-only, idempotent) | SHA-bound, crash-safe, idempotent replay |
| Batch manifests (SHA-256, ORIGINAL/REDUCED) | Immutability guard, authorization gating |
| Member failure isolation | One member's rework never demotes another's approval |
| Integration control (admit gates, provenance) | Fail-closed, SHA-bound, 13 error codes, 10+ test cases |

### ADAPT

| Capability | Rationale |
|-----------|-----------|
| Task model (TaskState) | Must be mapped to ApexAIPDT's Intent/Plan/Task/Work Order/Attempt entity model |
| Blocker semantics (BlockerType) | Must be aligned with ApexAIPDT's escalation model and Authority Policy |
| Escalation semantics (Disposition) | Must be aligned with ApexAIPDT's escalation package format |
| Failure taxonomy (FailureClass/FailureDomain) | Must be mapped to ApexAIPDT's domain+runtime failure taxonomy |
| Resource model (kinds/modes) | Must be extended with hierarchy, sensitivity, governance per ApexAIPDT spec |
| Failure Intelligence (classification) | Adopt runtime classification; map Pitfall Pool contribution to Advisory Plane |

### KEEP_CANONICAL

| Capability | Rationale |
|-----------|-----------|
| 8 Brain specifications | Advisory Plane knowledge domains; not duplicated in Lab |
| Agent Architecture (8 roles) | Spec-level definitions; Lab implements subset as concrete roles |
| Authority Model (6 modes) | Governance semantics; not implemented in Lab |
| Context System | Advisory Plane; not implemented in Lab |
| Memory System | Advisory Plane; not implemented in Lab |
| Capability Engine | Advisory Plane; not implemented in Lab |
| Pool Architecture | Advisory Plane; not implemented in Lab |
| All governance docs | Constitution, vision, terminology, ADRs — remain canonical |

### REJECT

| Capability | Rationale |
|-----------|-----------|
| Credit Economy | Premature; no evidence of need for self-hosting or bounded DPT tasks |

### DEFER

| Capability | Rationale |
|-----------|-----------|
| Authority Policy engine | Separate concern; requires governance design before implementation |
| General workflow engine (DAG) | Lab has sequential pipeline; DAG scheduling is future work |
| Task Passport + Context Receipt | Future direction; requires governance design |
| Work Order + Delta Prompt + Result/Handoff contract | Future direction; requires governance design |
| Provider adapter abstraction | Future; OpenCode is current preferred provider |
| Front Agent / Gateway | Explicitly deferred until self-hosting path reliable |
| Network API | Boundary concern; deferred |
| Pool Architecture (runtime) | Advisory Plane; deferred |
| Capability Engine (runtime) | Advisory Plane; deferred |

### REQUIRES_DECISION

| Capability | Rationale |
|-----------|-----------|
| Human Gate implementation | Lab has state existence (WAITING_FOR_HUMAN_GATE) but lacks durable approval store, consume-once semantics, exact action/SHA binding. Requires design before implementation. |
| Brain/Role/Agent taxonomy resolution | Lab uses roles without brains; ApexAIPDT has 8 brains + 8 agents; boundary is explicitly unresolved. Requires governance decision. |
| Task entity model mapping | Lab's 12-state TaskState spans multiple ApexAIPDT entities. Requires explicit mapping before migration. |

---

## 10. Migration Dependency Graph

```
DPT-MIG-001.A ─── Reconcile Task Entity Model ──────────────────┐
DPT-MIG-001.B ─── Reconcile Failure Taxonomy ──────────────────┤ (PARALLEL_SAFE)
DPT-MIG-001.C ─── Reconcile Resource Model ────────────────────┘
        │
        ▼
DPT-MIG-002.A ─── Adopt Durable Task State Module ─────┐
DPT-MIG-002.B ─── Adopt Evidence Schemas ──────────────┤
DPT-MIG-002.C ─── Adopt Route Model + Registry ───────┤ (PARALLEL_SAFE)
DPT-MIG-002.D ─── Adopt Resource Claims + Lease ──────┤
DPT-MIG-002.E ─── Adopt Review Model + Journal ───────┤
DPT-MIG-002.F ─── Adopt Batch Controller ─────────────┤
DPT-MIG-002.G ─── Adopt Integration Controller ───────┘
        │
        ▼
DPT-MIG-002.H ─── Adopt Parallel Scheduler + Worker Mgr (depends on 002.A, 002.C, 002.D)
DPT-MIG-002.I ─── Adopt Task Policy Engine (depends on 002.A, 002.B)
        │
        ▼
DPT-MIG-003.A ─── Adopt All Tests (depends on 002.A-I)
DPT-MIG-003.B ─── Adopt Task JSON Format (depends on 002.A)
        │
        ▼
DPT-MIG-004.A ─── Task Passport Schema Design (depends on 001.A)
DPT-MIG-004.B ─── Context Receipt Schema Design (depends on 001.A)
```

---

## 11. Proposed Migration Batches

### Batch 1: DPT-MIG-001

| Field | Value |
|-------|-------|
| Batch ID | DPT-MIG-001 |
| Member Tasks | DPT-MIG-001.A, DPT-MIG-001.B, DPT-MIG-001.C |
| Dependencies | None |
| Parallel Safety | PARALLEL_SAFE |
| Risk | LOW |
| Expected Artifacts | 3 mapping documents in `docs/reconciliation/` |
| Acceptance Criteria | Each document maps Lab concepts to ApexAIPDT concepts; no existing behavior modified |
| Human Gate Required | No |

### Batch 2: DPT-MIG-002 (Core Modules)

| Field | Value |
|-------|-------|
| Batch ID | DPT-MIG-002 |
| Member Tasks | DPT-MIG-002.A through DPT-MIG-002.G |
| Dependencies | DPT-MIG-001 complete |
| Parallel Safety | PARALLEL_SAFE |
| Risk | LOW |
| Expected Artifacts | 7 modules in `core/runtime/` subsystems |
| Acceptance Criteria | Each module copied, imports adapted, no existing behavior modified |
| Human Gate Required | No |

### Batch 2b: DPT-MIG-002 (Dependent Modules)

| Field | Value |
|-------|-------|
| Batch ID | DPT-MIG-002b |
| Member Tasks | DPT-MIG-002.H, DPT-MIG-002.I |
| Dependencies | DPT-MIG-002.A, 002.B, 002.C, 002.D complete |
| Parallel Safety | PARALLEL_SAFE |
| Risk | LOW |
| Expected Artifacts | 2 modules in `core/runtime/` |
| Acceptance Criteria | Modules copied, imports adapted, no existing behavior modified |
| Human Gate Required | No |

### Batch 3: DPT-MIG-003

| Field | Value |
|-------|-------|
| Batch ID | DPT-MIG-003 |
| Member Tasks | DPT-MIG-003.A, DPT-MIG-003.B |
| Dependencies | DPT-MIG-002 complete |
| Parallel Safety | PARALLEL_SAFE |
| Risk | LOW |
| Expected Artifacts | Test files in `tests/runtime/`, task JSON schema in `schemas/` |
| Acceptance Criteria | Tests pass in ApexAIPDT; task JSON schema documented |
| Human Gate Required | No |

### Batch 4: DPT-MIG-004

| Field | Value |
|-------|-------|
| Batch ID | DPT-MIG-004 |
| Member Tasks | DPT-MIG-004.A, DPT-MIG-004.B |
| Dependencies | DPT-MIG-001.A complete |
| Parallel Safety | PARALLEL_SAFE |
| Risk | LOW |
| Expected Artifacts | 2 schema design documents in `docs/` |
| Acceptance Criteria | Schemas define provider-neutral Task Passport and Context Receipt |
| Human Gate Required | No |

---

## 12. First Executable Migration Batch

```
BATCH_ID: DPT-MIG-001

TASKS:
  DPT-MIG-001.A:
    Title: Reconcile Task Entity Model
    Purpose: Map Lab's 12-state TaskState machine and WorkerResult schema to ApexAIPDT's
             Intent/Plan/Task/Work Order/Attempt/Result/Verification/Decision entity model.
    Source Capability: Lab state/task-model.mjs, Lab state/durable-task-state.mjs,
                       Lab evidence/worker-result.mjs
    Target Location: docs/reconciliation/TASK_ENTITY_MAPPING.md
    Dependencies: None
    Compatibility Checks: Verify Lab states map to ApexAIPDT entities without contradiction
    Required Tests: None (documentation only)
    Required Evidence: Entity mapping table, state-to-entity correspondence
    Rollback/Reversibility: Delete the mapping document
    Risk Level: LOW
    Parallel Safety: PARALLEL_SAFE
    Human Gate Required: No

  DPT-MIG-001.B:
    Title: Reconcile Failure Taxonomy
    Purpose: Map Lab's FailureClass (16 values) and FailureDomain (8 values) to ApexAIPDT's
             domain classes (product, design, architecture, implementation, data, security,
             operations, test) and runtime classes (executor error, verification failure,
             policy denial, etc.).
    Source Capability: Lab evidence/failure-classifier.mjs, Lab evidence/failure-record.mjs
    Target Location: docs/reconciliation/FAILURE_TAXONOMY_MAPPING.md
    Dependencies: None
    Compatibility Checks: Verify all Lab FailureClass values map to ApexAIPDT runtime classes
    Required Tests: None (documentation only)
    Required Evidence: Taxonomy mapping table, gap analysis
    Rollback/Reversibility: Delete the mapping document
    Risk Level: LOW
    Parallel Safety: PARALLEL_SAFE
    Human Gate Required: No

  DPT-MIG-001.C:
    Title: Reconcile Resource Model
    Purpose: Map Lab's resource claims (READ/WRITE/EXCLUSIVE, PHYSICAL/LOGICAL) to
             ApexAIPDT's Resource/ResourceClaim model (hierarchy, conflict domains,
             sensitivity, governance). Identify extension points.
    Source Capability: Lab scheduler/resource-claims.mjs
    Target Location: docs/reconciliation/RESOURCE_MODEL_MAPPING.md
    Dependencies: None
    Compatibility Checks: Verify Lab claim modes map to ApexAIPDT access modes;
                          identify missing features (hierarchy, sensitivity, governance)
    Required Tests: None (documentation only)
    Required Evidence: Mapping table, extension point inventory
    Rollback/Reversibility: Delete the mapping document
    Risk Level: LOW
    Parallel Safety: PARALLEL_SAFE
    Human Gate Required: No

DEPENDENCIES: None — all three are independent documentation tasks
PARALLELISM: All PARALLEL_SAFE
ACCEPTANCE:
  - Each produces a mapping document in docs/reconciliation/
  - No existing ApexAIPDT file is modified
  - No Lab file is modified
  - Documents are self-contained and auditable
RISKS: Minimal — read-only analysis producing reference documentation
HUMAN_GATE_REQUIRED: No
```

---

## 13. Governance Follow-up

| Task ID | Title | Rationale | Priority | Dependencies |
|---------|-------|-----------|----------|-------------|
| DPT-GOV-001 | Resolve Brain/Role/Agent taxonomy | Lab uses roles without brains; ApexAIPDT has 8 brains + 8 agents; boundary explicitly unresolved (DPT_AGENT_ARCHITECTURE.md:118) | HIGH | None |
| DPT-OPS-001 | Define DPT Operating Model | Clarify how Brains, Roles, Agents, and Providers compose at runtime; align Lab's concrete roles with ApexAIPDT's abstraction | HIGH | DPT-GOV-001 |
| DPT-TASK-001 | Task Passport + Context Receipt | Define provider-neutral execution context based on Lab's baseline + WorkerResult patterns | MEDIUM | DPT-MIG-001.A |
| DPT-TASK-002 | Work Order + Delta Prompt + Result/Handoff contract | Define the work assignment contract; map to Lab's task JSON + prompt pattern | MEDIUM | DPT-TASK-001 |
| DPT-SCHEMA-001 | Machine-readable schemas | Generate manifests from schemas for brains, roles, authority, artifacts, workflows | MEDIUM | DPT-GOV-001 |
| DPT-PROVIDER-001 | Provider-neutral execution contract | Define adapter interface behind which OpenCode/FreeBuff/Codex behavior lives | MEDIUM | DPT-MIG-002 complete |
| DPT-PROVIDER-002 | FreeBuff adapter | Define FreeBuff adapter (bounded execution/reconciliation) | LOW | DPT-PROVIDER-001 |
| DPT-PROVIDER-003 | OpenCode adapter | Wrap Lab's OpenCode-specific runner.mjs behind provider contract | LOW | DPT-PROVIDER-001 |
| DPT-PILOT-001 | DPT self-hosting pilot | Execute bounded DPT development tasks through the canonical pipeline | LOW | DPT-MIG-003, DPT-PROVIDER-001, DPT-GOV-001 |

**Front/Gateway:** Explicitly DEFERRED. Neither repository has Front/Gateway implementation. Architecture correctly defers it until the core self-hosting path is reliable. No evidence in either repository suggests Front/Gateway should come before self-hosting.

---

## 14. Self-Hosting Readiness

### Pipeline Assessment

| Stage | ApexAIPDT | Lab | Gap |
|-------|-----------|-----|-----|
| Owner Intent | Authority Model (spec) | Not implemented | No runtime intent intake |
| Authorized Task | Authority Policy (spec) | Not implemented | No runtime policy evaluation |
| Task Passport | Not defined | baseline.json + WorkerResult (partial) | No standardized schema |
| Plan / DAG | Task Graph (spec) | Sequential pipeline only | No DAG scheduling |
| Work Orders | Work Order (spec) | Task JSON + prompt (loose) | No standardized contract |
| Provider Adapter | Not defined | runner.mjs (OpenCode-specific) | No adapter abstraction |
| Agents / Workers | Not defined | worker-manager.mjs (OpenCode-specific) | Provider-specific only |
| Evidence | Not defined | WorkerResult + FailureRecord (IMPLEMENTED) | Provider-neutral schemas exist |
| Independent Review | Verification (spec) | review-authority.mjs + review-journal.mjs (IMPLEMENTED) | Structural enforcement exists |
| Integration | Not defined | integration-controller.mjs (IMPLEMENTED) | Fail-closed, provenance tracked |
| Human Gate | Authority Model (spec) | WAITING_FOR_HUMAN_GATE state (PARTIAL) | No durable approval, no consume-once |
| Closure / Reconciliation | Not defined | durable-task-state.mjs (IMPLEMENTED) | Journal + snapshot pattern exists |

### Self-Hosting Status

```
SELF_HOSTING_READINESS: NOT_READY
```

### Exact Missing Capabilities

1. **Runtime intent intake** — No mechanism to receive an Owner's intent and produce a Task Passport
2. **Runtime authority policy evaluation** — No policy engine that evaluates Authority Policy before issuing Work Orders
3. **Task DAG scheduling** — Lab runs a sequential 3-agent pipeline; no dependency graph scheduling for multi-task work
4. **Work Order contract** — No standardized, provider-neutral work assignment schema
5. **Provider adapter abstraction** — Runner is OpenCode-specific; no adapter interface for multiple providers
6. **Human Gate durability** — No durable, consume-once, action/SHA-bound approval store
7. **Batch orchestration** — Lab runs one task at a time; no multi-task batch orchestration through the full pipeline

### What IS Ready (from Lab, post-migration)

- Durable task state with journal + snapshot
- Failure classification and routing
- Resource claims and parallel scheduling
- Review authority and journal
- Batch manifests and member isolation
- Integration control and provenance
- Worker isolation

---

## 15. Recommended Next Task

```
Task ID: DPT-MIG-001.A
Purpose: Reconcile Task Entity Model — map Lab's 12-state TaskState machine to
         ApexAIPDT's Intent/Plan/Task/Work Order/Attempt/Result/Verification/Decision
         entity model.
Dependencies: None
Why it comes next: The task entity model is the foundational mapping that all subsequent
  migration tasks depend on. Without this mapping, module adoption (DPT-MIG-002) cannot
  be validated for compatibility. This is documentation-only with zero risk.
Expected Acceptance Criteria:
  - Mapping document exists at docs/reconciliation/TASK_ENTITY_MAPPING.md
  - Every Lab TaskState has a corresponding ApexAIPDT entity or transition
  - Every ApexAIPDT entity has a Lab implementation reference or explicit gap noted
  - No existing ApexAIPDT or Lab file is modified
```

---

## 16. Evidence and Provenance

### Principal Files Used

**ApexAIPDT:**
- `README.md` — repository overview and current status
- `ROADMAP.md` — milestone tracking
- `AGENTS.md` — agent behavior rules and architectural invariants
- `brains/BRAIN_CONTRACT.md` — brain specification schema
- `brains/PRODUCT.md` through `brains/OPERATIONS.md` — 8 brain specifications
- `core/ORCHESTRATOR.md` — Execution Orchestrator specification
- `core/WORKFLOW_ENGINE.md` — workflow engine specification
- `core/CONTEXT_SYSTEM.md` — context system specification
- `core/DECISION_SYSTEM.md` — decision system specification
- `core/MEMORY_SYSTEM.md` — memory system specification
- `core/TEAM_ASSEMBLY.md` — team assembly specification
- `core/HUMAN_AI_BOUNDARY.md` — human/AI boundary specification
- `core/COMPONENT_ARCHITECTURE.md` — component architecture specification
- `docs/APEX_AI_DPT_CONSTITUTION.md` — 30-article constitution
- `docs/APEX_AI_DPT_VISION.md` — vision and V0 scope
- `docs/APEX_AI_DPT_TERMINOLOGY.md` — 40+ term definitions
- `docs/DPT_SYSTEM_MODEL.md` — two-plane platform model
- `docs/DPT_EXECUTION_CONTROL_MODEL.md` — execution entity model and Task DAG
- `docs/DPT_AGENT_ARCHITECTURE.md` — 8 agent role definitions
- `docs/DPT_AUTHORITY_MODEL.md` — 6 authority modes and policy model
- `docs/DPT_ARCHITECTURE_DECISIONS.md` — 26 accepted ADRs
- `docs/DPT_OPEN_DECISIONS.md` — 26 open decisions
- `docs/DPT_PROJECT_RUNTIME.md` — project runtime and connector
- `docs/FAILURE_INTELLIGENCE.md` — failure taxonomy and Pitfall Pool
- `docs/DPT_POOL_ARCHITECTURE.md` — 8 Pool families
- `docs/CAPABILITY_ENGINE.md` — capability-first principles
- `docs/DPT_NETWORK_API.md` — conceptual API contract
- `docs/DPT_PROJECT_INTELLIGENCE.md` — intelligence model
- `docs/DPT_CREDIT_ECONOMY.md` — credit economy concept
- `docs/DPT_BUSINESS_AND_NETWORK_MODEL.md` — business model
- `workflows/BUG_FIX.md` through `workflows/VALIDATION_GATES.md` — 6 lifecycle workflows
- `templates/TEAM_MANIFEST.md` — team manifest template (brain/role bridge attempt)

**Lab:**
- `orchestrator/index.mjs` — main orchestrator entry point
- `orchestrator/core/baseline.mjs` — git provenance capture
- `orchestrator/core/decision.mjs` — review verdict parser
- `orchestrator/core/parser.mjs` — JSON stream parser
- `orchestrator/core/runner.mjs` — worker process execution
- `orchestrator/core/task-policy.mjs` — policy decision engine
- `orchestrator/state/task-model.mjs` — domain enums (TaskState, FailureClass, Disposition)
- `orchestrator/state/durable-task-state.mjs` — event-sourced durable state store
- `orchestrator/state/task-state.mjs` — public API facade
- `orchestrator/routing/route-model.mjs` — route identity and validation
- `orchestrator/routing/route-registry.mjs` — mutable route registry
- `orchestrator/routing/route-health.mjs` — health state machine
- `orchestrator/routing/route-ranking.mjs` — eligibility and scoring
- `orchestrator/routing/route-selector.mjs` — route selection
- `orchestrator/routing/route-policy-integration.mjs` — post-failure decision
- `orchestrator/scheduler/resource-claims.mjs` — claim normalization and conflict detection
- `orchestrator/scheduler/lease-manager.mjs` — journal-backed lease management
- `orchestrator/scheduler/worker-manager.mjs` — isolated worker contexts
- `orchestrator/scheduler/parallel-scheduler.mjs` — bounded concurrency scheduler
- `orchestrator/evidence/worker-result.mjs` — structured worker evidence schema
- `orchestrator/evidence/failure-record.mjs` — failure record schema
- `orchestrator/evidence/failure-classifier.mjs` — deterministic failure classifier
- `orchestrator/review/review-model.mjs` — review result schema
- `orchestrator/review/review-authority.mjs` — structural review authority
- `orchestrator/review/review-journal.mjs` — durable review journal
- `orchestrator/batch/batch-controller.mjs` — batch manifest and member aggregation
- `orchestrator/integration/integration-controller.mjs` — integration control
- `orchestrator/integration/integration-provenance.mjs` — integration provenance
- `tests/failure-classifier-regression.mjs` — 22 failure classification tests
- `tests/route-registry-policy-regression.mjs` — 20 routing tests
- `tests/task-policy-state-regression.mjs` — 12 task policy tests
- `tests/parallel-scheduler-regression.mjs` — 8 scheduler tests
- `tests/review-batch-integration-regression.mjs` — 25 review/batch/integration tests
- `tests/baseline-regression.mjs` — 11 baseline capture tests
- `tests/orchestrator-load-regression.mjs` — 30 module load assertions
- `docs/validation/APEX_EXECUTION_ORCHESTRATOR_LAB_PROOF_CLOSURE.md` — proof closure document
- `tasks/TASK-002.json`, `TASK-003.json`, `TASK-004.json` — sample task definitions
- `package.json` — project configuration and test script

### Git Provenance Verified

- ApexAIPDT HEAD: `50b0bd19e957d9a79131508839fbc8b1ca48291a` (main)
- Lab HEAD: `be5ecc10cce50e0f6acdec99b650a10fc16a8556` (m1.1-hardening)
- Both repositories clean at time of analysis

---

## 17. Safety / Change Record

```
RECONCILIATION_SOURCE_FILES_MODIFIED: NO
LAB_FILES_MODIFIED: NO
AHF_TOUCHED: NO
TESTBED_TOUCHED: NO
PRODUCTION_TOUCHED: NO
DB_TOUCHED: NO
SECRETS_ACCESSED: NO
PUSH_PERFORMED: NO
MERGE_PERFORMED: NO
COMMITS_CREATED: NO

REPORT_ARTIFACT_CREATED:
  docs/validation/DPT-REC-001_RECONCILIATION_REPORT.md
```

---

## 18. Revision History

| Rev | Date | Task | Change |
|-----|------|------|--------|
| 1 | 2026-09-02 | DPT-REC-001 | Initial reconciliation report. Compared ApexAIPDT main vs. Apex-Orchestrator-Lab m1.1-hardening. Identified 17 migration tasks across 4 batches. Provider numbering: DPT-PROVIDER-002=OpenCode, DPT-PROVIDER-003=FreeBuff. |
| 2 | 2026-09-02 | DPT-REC-001.A | Addendum: investigated `feat/ahf-001-execution-orchestrator` development branch. Branch does not exist in any ref (local, remote, reflog, unreachable) of either repository. No Python files, no execution_orchestrator/ directory, no competing runtime implementation found anywhere. Confirmed Lab is the sole runtime source. Provider numbering corrected: DPT-PROVIDER-002=FreeBuff, DPT-PROVIDER-003=OpenCode (alphabetical). |

### Development Branch Investigation (DPT-REC-001.A)

The branch `feat/ahf-001-execution-orchestrator` was investigated to determine whether a competing runtime implementation existed in ApexAIPDT outside main.

**Investigation methods:**
- `git branch -a` — only `main` and `origin/main` exist
- `git reflog --all | grep ahf` — no entries
- `git fsck --unreachable --no-reflogs` — no unreachable commits
- `git log --all --diff-filter=A -- "*.py"` — zero Python files in entire history
- `git log --all --name-only -- "execution_orchestrator*"` — zero entries
- `git ls-remote --heads --tags | grep ahf` — no remote refs
- `git tag -l` — no tags
- Lab repository cross-check — no reference to the branch name

**Conclusion:** The branch does not exist and never existed in the accessible Git history of either repository. The Lab is the sole source of all runtime implementation. The original DPT-REC-001 analysis was complete and correct.

### Provider Task Numbering (Corrected)

The original report (Rev 1) inadvertently swapped FreeBuff and OpenCode from the initial proposal. Corrected scheme (alphabetical by provider name):

| Task ID | Title |
|---------|-------|
| DPT-PROVIDER-001 | Provider-neutral execution contract |
| DPT-PROVIDER-002 | FreeBuff adapter |
| DPT-PROVIDER-003 | OpenCode adapter |
