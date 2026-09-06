# DPT — Phase 7 Connected Project Architecture Review

**Report Date:** 2026-09-06  
**Status:** PENDING_RECONCILIATION  
**Classification:** NG-10 (independent review) + NG-02 (writing artifacts)  
**Owner Permission Popups:** 0

---

## 1. Report Hygiene Result

### Active Reports Audited

| Report | Task Status | Tests PASS | Unresolved | Retired |
|--------|-------------|------------|------------|---------|
| DPT-FOUNDATION-001_SCHEMA_SERIALIZATION_REPORT.md | CLOSED | 28/28 | No | ✅ Retired |
| DPT-FOUNDATION-002_ACCEPTANCE_REPORT.md | CLOSED | 33/33 | No | ✅ Retired |
| DPT-FOUNDATION-002_E2E_ACCEPTANCE_REPORT.md | CLOSED | 35/35 | No | ✅ Retired |
| DPT-FOUNDATION-002_RUNTIME_ENFORCEMENT_REPORT.md | CLOSED | 43/43 | No | ✅ Retired |

### Retired Report Summary

**Total retired this session:** 4  
**Retirement rationale:** All associated tasks are CLOSED. No unresolved contradictions, no pending review dependencies, no ACTION_REQUIRED status. All validation evidence is preserved in history.

### Remaining Active Validation Inbox

This report (`DPT-PHASE7_ARCHITECTURE_REVIEW_REPORT.md`) remains **ACTIVE** until FOUNDATION-037 reconciliation is complete and no further attention is required.

**Canonical report lifecycle state:** `PENDING_RECONCILIATION` → will transition to `REVIEWED` → `NO_FURTHER_ATTENTION_REQUIRED` → `RETIRED` once reconciliation delta is applied.

---

## 2. Current Reality Map — What DPT Has Proven in Runtime

### Runtime Evidence Inventory

| Area | Artifact | Evidence | Pass Rate |
|------|----------|----------|-----------|
| **Task System Schema** | ADR-057 + 7 JSON Schema files + test suite | 28/28 schema + document validation tests | ✅ PROVEN |
| **CapabilityGateway Enforcement** | `goose-adapter.mjs` + `test-goose-enforcement.mjs` | 43/43 tests (positive, negative, bypass, recovery, audit) | ✅ PROVEN |
| **Goose Extension Integration** | `dpt-extension.mjs` + `test-goose-e2e.mjs` | 35/35 MCP protocol + enforcement tests | ✅ PROVEN |
| **Orchestrator Core** | `orchestrator-core.mjs` + `test-v1-runtime-023.mjs` | 7/7 tests | ✅ PROVEN |
| **Agent Adapters (Goose)** | `goose-adapter.mjs` + `test-v1-runtime-024.mjs` | 5/5 tests | ✅ PROVEN |
| **Persistent Memory** | `memory-runtime.mjs` + `test-v1-runtime-025.mjs` | 8/8 tests | ✅ PROVEN |
| **Workflow State** | `workflow-runtime.mjs` + `test-v1-runtime-026.mjs` | 11/11 tests | ✅ PROVEN |
| **Quality Gate** | `qualitygate-runtime.mjs` + `test-v1-runtime-027.mjs` | 4/4 tests | ✅ PROVEN |
| **Human Approval UI** | `approval-ui-runtime.mjs` + `test-v1-runtime-028.mjs` | 8/8 tests | ✅ PROVEN |
| **Freeze Decisions** | `freeze-decisions-runtime.mjs` + `test-v1-runtime-029.mjs` | 5/5 tests | ✅ PROVEN |
| **V2 Learning — Token Efficiency** | `efficiency-projection.mjs` + 31 tests | Implemented, tested | ✅ PROVEN |
| **V2 Learning — Failure Pattern Detection** | `pattern-matching.mjs` + 58 tests | Implemented, tested | ✅ PROVEN |
| **V2 Learning — Auto-Improvement Proposals** | `auto-improvement.mjs` + 48 tests | Implemented, tested | ✅ PROVEN |
| **V2 Learning — Cross-Project Patterns** | `cross-project-extraction.mjs` + 40 tests | Implemented, tested | ✅ PROVEN |
| **Branch Lifecycle Invariant** | `BATCH_BRANCH_LIFECYCLE_INVARIANT.md` | Documented + enforced via PR workflow | ✅ PROVEN |
| **Schema Serialization** | 7 core schemas + manifest | Draft 2020-12, canonical $id, all validated | ✅ PROVEN |

### Notably Absent from Runtime

| Area | Expected | Actual |
|------|----------|--------|
| **Intervention Measurement Runtime** | `providers/goose/intervention-measurement.mjs` + tests | Schema + spec only; function NOT implemented |
| **Front Agent Runtime** | Project-side agent instance | Role defined; no provider code |
| **Gateway Boundary Service** | DPT-side trust/protocol boundary | Contract conceptual; no service |
| **Scout Implementation** | Discovery + Project Intelligence builder | Strategy accepted; zero code |
| **Contribution Pipeline** | Candidate submission → review → pool admission | Governance documented; no intake mechanism |
| **Update Propagation** | Event delivery to connected projects | Subscribe/Push documented; no delivery |

### Total Verified Runtime Proofs: 16 areas with ≥80% test coverage across provider implementations

---

## 3. Gap Map — 10 Evaluation Areas

### 1. Project Enrollment and Trust Establishment

**Classification:** SPEC_ONLY

**What's proven:**
- Bootstrap flow documented (`DPT_PROJECT_RUNTIME.md`)
- Project identity model exists conceptually
- Manifest structure defined

**Mechanism-neutral progression:**
```
Identity Establishment → Authentication → Trust Binding → Gateway Admission
```

**What's missing:**
- No concrete enrollment protocol implementation
- No authentication mechanism between project and DPT
- No trust binding verification at runtime
- No Gateway Admission decision point

**Gap severity:** CRITICAL — Foundation primitive for all external project interaction.

---

### 2. Front Runtime Lifecycle (Project-Side Agent)

**Classification:** SPEC_ONLY

**Role clarification:**
- **Front** = project-bound ROLE / AGENT_INSTANCE
- Front does NOT own Project Intelligence (PI is project-owned, produced by Scout)
- Front represents the project at the DPT boundary

**What's missing:**
- No project-side Front Agent runtime
- No ability for a project to initiate DPT interaction
- No project-to-DPT request serialization

**Gap severity:** CRITICAL — Without Front, projects cannot reach DPT.

---

### 3. Scout / Project Intelligence Runtime

**Classification:** SPEC_ONLY

**What's proven:**
- Discovery strategy accepted (OD-T5-001)
- Intelligence layers defined
- Core invariant codified: "SCOUT MAY KNOW THE PROJECT BROADLY; DPT MAY RECEIVE THE PROJECT NARROWLY"

**What's missing:**
- No Scout implementation in `providers/`
- No Project Intelligence data structure
- No discovery tooling against real repositories

**Gap severity:** HIGH — Advisory Plane intelligence engine absent.

---

### 4. Gateway Boundary and Reconnect Behavior

**Classification:** SPEC_ONLY

**Role clarification:**
- **Gateway** = deterministic SERVICE (not a role/concept)
- Gateway enforces the DPT-side trust/protocol boundary
- Gateway routes approved messages; does not become Execution Orchestrator

**What's missing:**
- No Gateway Agent runtime
- No trust/protocol boundary between projects and DPT ecosystem
- No reconnect behavior
- Network API contract is conceptual

**Gap severity:** CRITICAL — Two-plane architecture requires this boundary.

---

### 5. Minimum-Sufficient Project Context Transfer

**Classification:** SPEC_ONLY

**What's proven:**
- Principle accepted in OpenDecisions
- Core rules codified (project-owned persistence, ephemeral-to-DPT, bounded processing)
- Invariant: `PROJECT_CONTEXT_RECEIVED → BOUNDED_PROCESSING → RESULT_RETURNED → PROJECT_CONTEXT_DISCARDED`

**What's missing:**
- No transfer mechanism
- No serialization format for context packages
- No tested transport

**Gap severity:** MEDIUM — Governance established; transport absent.

---

### 6. Capability-to-Role-to-Executor Routing

**Classification:** PARTIALLY_PROVEN

**What's proven:**
- CapabilityGateway enforces tool-call authorization at adapter layer
- Role definitions exist (Front Agent, Gateway, Scout, Analyst, Orchestrator, Failure Agent)
- Authority pipeline: derive → materialize → preflight → execute

**Analyst role clarification:**
- Analyst is a COGNITIVE ROLE, not inherently human
- Human Gate applies only when canonical governance requires it (HG-01..HG-07)
- Remove default "human-in-the-loop" language; analyst functions autonomously within policy

**What's missing:**
- No multi-provider routing proven beyond Goose
- No dynamic executor selection at runtime

**Gap severity:** MEDIUM — Single-provider works; cross-provider routing unproven.

---

### 7. Project-Side Governed Execution

**Classification:** SPEC_ONLY

**What's proven:**
- Execution Control Plane architecture defined
- Work Order / Attempt / Verification lifecycle implemented internally
- Quality gate and approval interfaces proven

**What's missing:**
- No project-side execution agent
- All execution runs inside ApexAIPDT repo, not consumer projects
- No delegation mechanism to project developers/agents

**Gap severity:** HIGH — Product promise is project-connected, not self-contained.

---

### 8. Contribution Candidate → Review → Pool Admission

**Classification:** SPEC_ONLY

**What's proven:**
- Pool families defined
- Two-way value loop documented
- Credit economy concept defined

**What's missing:**
- No pool implementation
- No contribution submission mechanism
- No review workflow
- Zero projects have contributed assets

**Gap severity:** CRITICAL — Two-way loop broken at intake.

---

### 9. Update Propagation Back to Projects

**Classification:** SPEC_ONLY

**What's proven:**
- Event model documented conceptually
- Subscribe/Push operations defined in Network API contract

**What's missing:**
- No propagation mechanism
- No event delivery system
- No project notification infrastructure

**Propagation approach for V3:**
- Prove transport-independent semantics with ONE reference transport first
- Do not require multiple transports in V3

**Gap severity:** HIGH — Completes two-way loop.

---

### 10. Installation, Upgrade, Migration, Recovery, Observability

**Classification:** PARTIALLY_PROVEN

**What's proven:**
- Recovery after adapter restart verified
- Persistent memory module exists
- Workflow state management proven
- Bootstrap tooling exists for DPT itself

**What's missing:**
- No installation procedure for connecting new projects
- No upgrade path for connected projects
- No observability dashboard

**Gap severity:** MEDIUM — Core recovery works; operational lifecycle absent.

---

## 4. Falsification Findings

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| F-001 | **DPT operates only on itself** | CRITICAL | All runtime proofs execute within ApexAIPDT. Zero external project interactions tested. |
| F-002 | **Front Agent / Gateway are role concepts without runtime instances** | HIGH | Architecture documents define roles. No corresponding provider code. |
| F-003 | **Scout and Analyst have no implementation** | HIGH | Both core Advisory Plane functions absent from providers/. |
| F-004 | **Contribution path is governance, not runtime** | HIGH | Credit economy and pool admission documented but no intake mechanism. |
| F-005 | **FOUNDATION-037 prematurely CLOSED** | MEDIUM | See reconciliation verdict below. |
| F-006 | **Roadmap V2 checkboxes lag documentation** | LOW | Tasks 037–041 CLOSED in TASKS.md; ROADMAP.md shows `[ ]`. |
| F-007 | **Network API has no implementation anchor** | MEDIUM | Operations documented conceptually; no server/client stub. |
| F-008 | **Multi-provider routing unproven** | LOW | OpenCode adapter exists; no dispatch/test evidence beyond Goose. |

---

## 5. FOUNDATION-037 RECONCILIATION VERDICT

### Original Acceptance Contract

**Task:** DPT-FOUNDATION-037 — V2 Learning System: Intervention Measurement  
**Objective:** "Implement runtime intervention measurement for V2 learning system. Measures human intervention frequency, type, and duration across DPT-managed projects."  
**Status in TASKS.md:** CLOSED

### Evidence Review

| Deliverable | Expected | Actual |
|-------------|----------|--------|
| Runtime function | `providers/goose/intervention-measurement.mjs` | ❌ NOT EXISTS |
| Test suite | `providers/goose/test-intervention-measurement.mjs` | ❌ NOT EXISTS |
| Schema | `docs/schemas/intervention-event.schema.json` | ✅ EXISTS |
| Specification | `docs/v2/intervention-measurement-spec.md` | ✅ EXISTS |
| ADR | `docs/adr/ADR-052.md` | ❌ NOT EXISTS (ADR-052 referenced in spec but not created) |

### Spec Self-Assessment

The specification document (`docs/v2/intervention-measurement-spec.md`) states:
- **Status:** "Specification complete. Ready for implementation."
- **Next Steps:**
  - ⏳ Step 5: Implement intervention event projection in runtime — NOT completed
  - ⏳ Step 6: Add measurement queries to analytics layer — NOT completed
  - ⏳ Step 7: Integrate with T5-004 and T5-005 — NOT completed

### Verdict

**FOUNDATION-037 is PREMATURELY_CLOSED.**

The task objective explicitly requires "implement runtime intervention measurement." Schema and specification are design artifacts, not runtime implementation. The task delivered design but not implementation.

**Corrective action required:** Reopen FOUNDATION-037 to RUNNING or BACKLOG, implement the runtime function, add tests, re-validate, then CLOSE with proper evidence.

**Do not silently convert missing implementation into a V3 feature.** The work belongs to FOUNDATION-037's original scope.

---

## 6. Corrected V3 Vertical-Slice Architecture

### Principle

V3 must prove a **minimal external-project vertical slice** before layering subsystems. Subsystem-first objectives (enrollment, gateway, scout as separate initiatives) create integration risk. A vertical slice proves the full chain end-to-end.

### Vertical Slice Spine

```
External Project
      ↓
[1] Scout evidence gathering (project-side)
      ↓
[2] Project-owned Project Intelligence (local persistence)
      ↓
[3] Minimum-sufficient context transfer (bounded package)
      ↓
[4] Front Agent (project-side runtime instance)
      ↓
[5] Gateway (DPT-side deterministic service)
      ↓
[6] DPT analysis (Advisory Plane: Scout + Analyst)
      ↓
[7] Bounded result returned to Project
```

### Post-Spine Layering

Once the spine is proven, layer in sequence:

```
Layer A: Governed project execution
        → Work Orders executed within project scope
        → Authority evaluated per project policy

Layer B: Contribution candidate / review / pool admission
        → Project contributes validated reusable assets
        → DPT validates, reviews, admits to relevant Pool

Layer C: Update propagation
        → DPT notifies project of relevant changes
        → One reference transport proven first
        → Transport-independent semantics verified
```

### Dependency Shape

```
V3-SPINE: External Project Connection
├── V3-001: Identity Establishment (prerequisite for all)
├── V3-002: Front Agent Runtime (project-side)
├── V3-003: Gateway Boundary Service (DPT-side)
├── V3-004: Minimum-Sufficient Context Transfer
└── V3-005: DPT Analysis Integration (Scout + Analyst)

V3-LAYER-A: Governed Execution
├── Depends on: V3-SPINE
└── V3-006: Project-Side Execution Delegation

V3-LAYER-B: Contribution Pipeline
├── Depends on: V3-SPINE
└── V3-007: Candidate Submission + Review + Pool Admission

V3-LAYER-C: Update Propagation
├── Depends on: V3-SPINE
└── V3-008: Event Delivery (one reference transport)
```

### Key Architectural Constraints (Preserved)

1. **Gateway = deterministic SERVICE** (not a role concept; implements protocol boundary)
2. **Front = project-bound ROLE / AGENT_INSTANCE** (does NOT own Project Intelligence)
3. **Analyst = COGNITIVE ROLE** (not inherently human; Human Gate applies only per canonical governance HG-01..HG-07)
4. **One reference transport first** (prove semantics, not multiple transports)

---

## 7. Items That Should Explicitly NOT Enter V3

| Item | Rationale |
|------|-----------|
| **New governance rules** | Current governance is sound and well-tested. Extend existing. |
| **Monolithic framework rewrite** | Component-first principle is invariant. Compose from existing modular components. |
| **Vendor-specific hard-coding** | DPT is provider-neutral. Keep abstraction boundaries clean. |
| **New core schemas without proven need** | 7 core schemas validated. Do not add without real-project interaction evidence. |
| **Self-contained DPT internal tooling** | Focus on project-connection capabilities, not internal improvements. |
| **Full Credit Economy implementation** | Premature without contribution flow proven. Defer to post-V3-LAYER-B. |
| **Over-automated Analyst** | Analysis requires judgment. Keep human-in-the-loop only when Human Gate governs. |
| **Multiple transport finalization** | Prove one reference transport. Do not freeze transport in V3. |
| **FOUNDATION-037 gap as V3 feature** | Missing intervention measurement belongs to FOUNDATION-037 reconciliation, not V3 scope. |

---

## 8. Summary

DPT has **proven its internal machinery** thoroughly: task system, authority pipeline, CapabilityGateway enforcement, learning system projections (except intervention measurement), and batch branch lifecycle. What remains **unproven at runtime** is the connection to external projects.

The corrected architecture progression is:

```
V0: Prove core (DONE)
V1: Prove provider adapters (DONE)
V2: Prove learning system (PARTIALLY DONE — intervention measurement missing)
V3: Prove external project connection vertical slice (NEXT)
```

**Foundation-037 reconciliation must precede V3 planning.** The premature closure must be corrected before admissible graph recalculation proceeds.

---

---

## 9. Lifecycle Update — Reconciliation Complete

**Foundation-037 Reconciliation:** COMPLETED  
**Date:** 2026-09-06  
**PR:** #26 (feat/foundation-037-intervention-measurement)  
**Tests:** 66/66 PASS

Foundation-037 has been reopened from premature CLOSED to REWORK, implemented, tested (66/66 PASS), and re-closed with full runtime evidence. The gap identified in F-005 is now closed.

**Report Status:** REVIEW_COMPLETE  
**Next Action:** V3 planning may proceed per corrected vertical-slice architecture  
**Classification:** NG-02 + NG-10  
**Owner Permission Popups:** 0
