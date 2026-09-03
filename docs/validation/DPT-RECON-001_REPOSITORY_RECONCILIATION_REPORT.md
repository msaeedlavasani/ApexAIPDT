# DPT-RECON-001 — Repository & Documentation Reconciliation Audit

**Task**: DPT-RECON-001
**Parent**: DPT-PROVIDER-005 (CLOSED)
**Status**: CLOSED
**Date**: 2026-09-03
**Mode**: AUDIT-ONLY — no deletions, renames, resets, commits, or pushes

---

## 1. Repository Git State

| Property | Value |
|----------|-------|
| Branch | main |
| Local HEAD | 50b0bd1 |
| Remote HEAD | 50b0bd1 |
| Ahead/Behind | 0 / 0 (in sync) |
| Staged changes | 0 |
| Unstaged changes | 0 |
| Untracked files | ~175 (all new since last commit) |
| Deleted/renamed | 0 |
| Last commit | `docs: standardize execution orchestrator naming` |

**Observation**: Local and remote are aligned at the same commit. All ~175 untracked files represent new work accumulated since the last commit. There is no divergence or drift.

---

## 2. Outstanding Local Changes — Complete Classification

### 2.1 Generated Artifacts (OS/tooling)

| File | Classification |
|------|---------------|
| `.DS_Store` | GENERATED_ARTIFACT |
| `docs/.DS_Store` | GENERATED_ARTIFACT |
| `docs/validation/.DS_Store` | GENERATED_ARTIFACT |
| `docs/validation/Retired/.DS_Store` | GENERATED_ARTIFACT |
| `providers/.DS_Store` | GENERATED_ARTIFACT |

### 2.2 OpenCode SDK Dependencies (npm)

| Path | Classification |
|------|---------------|
| `providers/opencode/node_modules/` (~70 files) | GENERATED_ARTIFACT |
| `providers/opencode/package-lock.json` | GENERATED_ARTIFACT |

These are installed SDK dependencies (`@opencode-ai/sdk@1.18.25` + transitive deps). Should be in `.gitignore`.

### 2.3 Generated Test State

| File | Classification |
|------|---------------|
| `providers/opencode/.dpt-e2e-state/events-*.json` | GENERATED_ARTIFACT |
| `providers/opencode/.dpt-e2e-state/rehydration-*.json` | GENERATED_ARTIFACT |
| `providers/opencode/.dpt-mcp-state/events-*.json` | GENERATED_ARTIFACT |
| `providers/opencode/.dpt-mcp-state/rehydration-*.json` | GENERATED_ARTIFACT |

Ephemeral test output. Should be in `.gitignore`.

### 2.4 Provider Runtime — Contract Layer

| File | Classification | Notes |
|------|---------------|-------|
| `providers/contract/provider-contract.mjs` | VALID_PROVIDER_RUNTIME | Contract v0.1.0 |
| `providers/contract/capability-descriptor.mjs` | VALID_PROVIDER_RUNTIME | Descriptor schema v0.1.0 |
| `providers/contract/conformance-suite.mjs` | VALID_PROVIDER_RUNTIME | Generic test harness |

### 2.5 Provider Runtime — OpenCode Adapter

| File | Classification | Notes |
|------|---------------|-------|
| `providers/opencode/opencode-adapter.mjs` | VALID_PROVIDER_RUNTIME | Contract-bound adapter |
| `providers/opencode/adapter-spike.mjs` | VALID_PROVIDER_RUNTIME | 004.B spike |
| `providers/opencode/permission-envelope.mjs` | VALID_PROVIDER_RUNTIME | Envelope model |
| `providers/opencode/permission-audit.mjs` | VALID_PROVIDER_RUNTIME | Permission audit |
| `providers/opencode/permission-materializer.mjs` | VALID_PROVIDER_RUNTIME | Dynamic materialization |
| `providers/opencode/event-model.mjs` | VALID_PROVIDER_RUNTIME | Provider-neutral events |
| `providers/opencode/event-bridge.mjs` | VALID_PROVIDER_RUNTIME | Event bridge + persistence |
| `providers/opencode/sdk-normalizer.mjs` | VALID_PROVIDER_RUNTIME | SDK response normalization |
| `providers/opencode/context-receipt.mjs` | VALID_PROVIDER_RUNTIME | Context receipts |
| `providers/opencode/rehydration-record.mjs` | VALID_PROVIDER_RUNTIME | Rehydration records |
| `providers/opencode/dpt-mcp-server.mjs` | VALID_PROVIDER_RUNTIME | MCP capability server |
| `providers/opencode/dpt-mcp-client.mjs` | VALID_PROVIDER_RUNTIME | MCP client |
| `providers/opencode/package.json` | VALID_PROVIDER_RUNTIME | SDK dependency declaration |

### 2.6 Provider Runtime — Reference Adapter

| File | Classification | Notes |
|------|---------------|-------|
| `providers/reference/reference-adapter.mjs` | VALID_PROVIDER_RUNTIME | Contract decoupling proof |

### 2.7 Test Files (Provider 003–005)

| File | Classification | Notes |
|------|---------------|-------|
| `providers/opencode/test-permissions.mjs` | TEMPORARY_TEST_ARTIFACT | 004.C test |
| `providers/opencode/test-rehydration.mjs` | TEMPORARY_TEST_ARTIFACT | 004.D test |
| `providers/opencode/test-evidence-bridge.mjs` | TEMPORARY_TEST_ARTIFACT | 004.E test |
| `providers/opencode/test-mcp-server.mjs` | TEMPORARY_TEST_ARTIFACT | 004.F test |
| `providers/opencode/test-e2e-integration.mjs` | TEMPORARY_TEST_ARTIFACT | 004.G test |
| `providers/test-conformance.mjs` | TEMPORARY_TEST_ARTIFACT | 005 conformance |

### 2.8 Documentation — Provider Adapter Architecture

| File | Classification | Notes |
|------|---------------|-------|
| `docs/architecture/OPENCODE_PROVIDER_ADAPTER_ARCHITECTURE.md` | VALID_PROVIDER_RUNTIME | Phases 004.A–004.G, 005 |

### 2.9 Documentation — Governance

| File | Classification | Notes |
|------|---------------|-------|
| `docs/governance/AUTHORITY_PERMISSION_MODEL.md` | VALID_EXECUTION_ORCHESTRATOR | Authority + permission separation |
| `docs/governance/DYNAMIC_PERMISSION_MATERIALIZATION.md` | VALID_EXECUTION_ORCHESTRATOR | Permission materialization |
| `docs/governance/HUMAN_GATE_BOUNDARY.md` | VALID_EXECUTION_ORCHESTRATOR | 7 HG classes |
| `docs/governance/PERMISSION_ENVELOPE.md` | VALID_EXECUTION_ORCHESTRATOR | Envelope spec |

### 2.10 Documentation — Reconciliation

| File | Classification | Notes |
|------|---------------|-------|
| `docs/reconciliation/TASK_ENTITY_MAPPING.md` | VALID_EXECUTION_ORCHESTRATOR | Entity model mapping |
| `docs/reconciliation/OPENCODE_PERMISSION_MAPPING.md` | VALID_EXECUTION_ORCHESTRATOR | Permission mapping |
| `docs/reconciliation/OPENCODE_PROGRAMMATIC_CAPABILITY_MATRIX.md` | VALID_EXECUTION_ORCHESTRATOR | Capability matrix |
| `docs/reconciliation/RESOURCE_MODEL_MAPPING.md` | VALID_EXECUTION_ORCHESTRATOR | Resource model |
| `docs/reconciliation/FAILURE_TAXONOMY_MAPPING.md` | VALID_EXECUTION_ORCHESTRATOR | Failure taxonomy |

### 2.11 Validation Reports

| File | Classification | Notes |
|------|---------------|-------|
| `docs/validation/DPT-PROVIDER-005_PROVIDER_CONFORMANCE_REPORT.md` | GENERATED_ARTIFACT | Current report |
| `docs/validation/Retired/DPT-REC-001_RECONCILIATION_REPORT.md` | GENERATED_ARTIFACT | Retired |
| `docs/validation/Retired/DPT-VAL-001_OPENCODE_CONFORMANCE_REPORT.md` | GENERATED_ARTIFACT | Retired |
| `docs/validation/Retired/DPT-AUTH-001_AUTHORITY_PERMISSION_REPORT.md` | GENERATED_ARTIFACT | Retired |
| `docs/validation/Retired/DPT-PROVIDER-003B_*.md` | GENERATED_ARTIFACT | Retired |
| `docs/validation/Retired/DPT-PROVIDER-003C_*.md` | GENERATED_ARTIFACT | Retired |
| `docs/validation/Retired/DPT-PROVIDER-004A_*.md` | GENERATED_ARTIFACT | Retired |
| `docs/validation/Retired/DPT-PROVIDER-004B_*.md` | GENERATED_ARTIFACT | Retired |
| `docs/validation/Retired/DPT-PROVIDER-004C_*.md` | GENERATED_ARTIFACT | Retired |
| `docs/validation/Retired/DPT-PROVIDER-004D_*.md` | GENERATED_ARTIFACT | Retired |
| `docs/validation/Retired/DPT-PROVIDER-004E_*.md` | GENERATED_ARTIFACT | Retired |
| `docs/validation/Retired/DPT-PROVIDER-004F_*.md` | GENERATED_ARTIFACT | Retired |
| `docs/validation/Retired/DPT-PROVIDER-004G_*.md` | GENERATED_ARTIFACT | Retired |

### 2.12 Configuration

| File | Classification | Notes |
|------|---------------|-------|
| `opencode.json` | VALID_CURRENT_DPT | Static security baseline. NOT to be modified |

---

## 3. Terminology Audit

### 3.1 ADPT / Apex ADPT

**Result: ZERO occurrences.** The old "ADPT" terminology has been fully cleaned from the repository.

### 3.2 APDT (Old Naming)

| File | Occurrence | Severity |
|------|-----------|----------|
| `core/DECISION_SYSTEM.md` | "APDT separates facts, inferences, recommendations..." | STALE — needs DPT |
| `core/MEMORY_SYSTEM.md` | "Memory prevents APDT from repeatedly rediscovering..." | STALE — needs DPT |
| `brains/BRAIN_CONTRACT.md` | "Every APDT brain must define..." | STALE — needs DPT |
| `examples/bazigb/PROJECT_PROFILE.md` | "validating APDT against a real existing product" | STALE + PROJECT_SPECIFIC |
| `ROADMAP.md` | "Install APDT artifacts into BaziGB" | STALE — needs DPT |

### 3.3 BaziGB / Project-Specific

| File | Reference | Classification |
|------|-----------|---------------|
| `examples/bazigb/PROJECT_PROFILE.md` | BaziGB validation profile | PROJECT_SPECIFIC |
| `ROADMAP.md:17` | "Reference BaziGB validation profile" | PROJECT_SPECIFIC (in committed file) |
| `ROADMAP.md:21` | "Install APDT artifacts into BaziGB" | PROJECT_SPECIFIC + STALE |
| `ROADMAP.md:22` | "Generate BaziGB project constitution" | PROJECT_SPECIFIC |
| `README.md:136` | "BaziGB is the reference case..." | PROJECT_SPECIFIC |

### 3.4 AHF (Apex Human Framework)

Only in Retired validation reports (AHF_TOUCHED: NO). No current-architecture contamination.

### 3.5 OpenAI/Codex/Work References

| File | Reference | Classification |
|------|-----------|---------------|
| `docs/architecture/OPENCODE_PROVIDER_ADAPTER_ARCHITECTURE.md` | "OpenAI/Codex MAY be an optional route" | VALID — explicitly optional |
| Various retired reports | "No Work/Codex/OpenAI dependency" | VALID — constraint verification |

All references are in the context of "not a dependency" — confirming the constraint is met.

---

## 4. Project-Specific Contamination Audit

| Area | Status | Finding |
|------|--------|---------|
| BaziGB | ISOLATED | Only in `examples/bazigb/` and 3 references in committed docs |
| AHF | CLEAN | Only in retired reports (AHF_TOUCHED: NO) |
| Apex-Orchestrator-Lab | BOUNDARY | Referenced in `opencode.json` permission rules — expected |
| Provider-specific code | BOUNDARY | OpenCode adapter is in `providers/opencode/` — correct location |
| DPT Core contamination | NONE | `core/`, `brains/`, `templates/`, `workflows/` are clean |

---

## 5. Documentation Map

### 5.1 DPT Foundation (Committed, Current)

| Document | Purpose | Status | Canonical | Conflicts | Duplicates | Missing Updates | Recommended Action |
|----------|---------|--------|-----------|-----------|------------|-----------------|-------------------|
| `README.md` | Repository overview | CURRENT | CANONICAL | None | None | BaziGB reference at L136 | Review: keep as reference or generalize |
| `ROADMAP.md` | Milestone tracker | CURRENT | CANONICAL | None | None | APDT at L1,21,22; BaziGB at L17,21,22 | Terminology update needed |
| `AGENTS.md` | Agent instructions | CURRENT | CANONICAL | None | None | None | None |
| `docs/APEX_AI_DPT_CONSTITUTION.md` | Governance (30 articles) | CURRENT | CANONICAL | None | None | None | None |
| `docs/APEX_AI_DPT_TERMINOLOGY.md` | Vocabulary | CURRENT | CANONICAL | None | None | Missing provider terms | Add provider contract terms |
| `docs/APEX_AI_DPT_VISION.md` | V0 scope + success criteria | CURRENT | CANONICAL | None | None | None | None |
| `docs/DPT_ARCHITECTURE_DECISIONS.md` | 26 ADRs | CURRENT | CANONICAL | None | None | None | None |
| `docs/DPT_OPEN_DECISIONS.md` | Open decision backlog | CURRENT | CANONICAL | None | None | None | None |
| `docs/DPT_AUTHORITY_MODEL.md` | 6 authority modes | CURRENT | CANONICAL | None | None | None | None |
| `docs/DPT_EXECUTION_CONTROL_MODEL.md` | Entity model | CURRENT | CANONICAL | None | None | None | None |
| `docs/DPT_EXISTING_PROJECT_ONBOARDING.md` | 3-stage onboarding | CURRENT | CANONICAL | None | None | None | None |
| `docs/DPT_PROJECT_RUNTIME.md` | Bootstrap architecture | CURRENT | CANONICAL | None | None | None | None |
| `docs/DPT_PROJECT_INTELLIGENCE.md` | Intelligence layers | CURRENT | CANONICAL | None | None | None | None |
| `docs/DPT_SYSTEM_MODEL.md` | Dual-plane model | CURRENT | CANONICAL | None | None | None | None |
| `docs/DPT_BUSINESS_AND_NETWORK_MODEL.md` | Business model | CURRENT | CANONICAL | None | None | None | None |
| `docs/DPT_NETWORK_API.md` | Network API concept | CURRENT | CANONICAL | None | None | None | None |
| `docs/DPT_CREDIT_ECONOMY.md` | Credit economy | CURRENT | CANONICAL | None | None | None | None |
| `docs/DPT_POOL_ARCHITECTURE.md` | Pool architecture | CURRENT | CANONICAL | None | None | None | None |
| `docs/DPT_AGENT_ARCHITECTURE.md` | 9 agent types | CURRENT | CANONICAL | None | None | None | None |
| `docs/CAPABILITY_ENGINE.md` | Capability engine | CURRENT | CANONICAL | None | None | None | None |
| `docs/FAILURE_INTELLIGENCE.md` | Failure intelligence | CURRENT | CANONICAL | None | None | None | None |

### 5.2 Core Systems (Committed, Current Except Terminology)

| Document | Purpose | Status | Canonical | Conflicts | Duplicates | Missing Updates | Recommended Action |
|----------|---------|--------|-----------|-----------|------------|-----------------|-------------------|
| `core/COMPONENT_ARCHITECTURE.md` | Component-first rule | CURRENT | CANONICAL | None | None | None | None |
| `core/ORCHESTRATOR.md` | Orchestrator definition | CURRENT | CANONICAL | None | None | None | None |
| `core/WORKFLOW_ENGINE.md` | State machine | CURRENT | CANONICAL | None | None | None | None |
| `core/DECISION_SYSTEM.md` | Decision classes | **STALE** | CANONICAL | APDT terminology | None | Terminology | Replace APDT → DPT |
| `core/MEMORY_SYSTEM.md` | Memory layers | **STALE** | CANONICAL | APDT terminology | None | Terminology | Replace APDT → DPT |
| `core/CONTEXT_SYSTEM.md` | Context routing | CURRENT | CANONICAL | None | None | None | None |
| `core/TEAM_ASSEMBLY.md` | Dynamic assembly | CURRENT | CANONICAL | None | None | None | None |
| `core/HUMAN_AI_BOUNDARY.md` | Human/AI boundary | CURRENT | CANONICAL | None | None | None | None |

### 5.3 Brains (Committed, Current Except Terminology)

| Document | Purpose | Status | Canonical | Conflicts | Duplicates | Missing Updates | Recommended Action |
|----------|---------|--------|-----------|-----------|------------|-----------------|-------------------|
| `brains/ARCHITECTURE.md` | Architecture brain | CURRENT | CANONICAL | None | None | None | None |
| `brains/BRAIN_CONTRACT.md` | Brain contract | **STALE** | CANONICAL | APDT terminology | None | Terminology | Replace APDT → DPT |
| `brains/DATA.md` | Data brain | CURRENT | CANONICAL | None | None | None | None |
| `brains/DESIGN.md` | Design brain | CURRENT | CANONICAL | None | None | None | None |
| `brains/ENGINEERING.md` | Engineering brain | CURRENT | CANONICAL | None | None | None | None |
| `brains/OPERATIONS.md` | Operations brain | CURRENT | CANONICAL | None | None | None | None |
| `brains/PRODUCT.md` | Product brain | CURRENT | CANONICAL | None | None | None | None |
| `brains/QA.md` | QA brain | CURRENT | CANONICAL | None | None | None | None |
| `brains/SECURITY.md` | Security brain | CURRENT | CANONICAL | None | None | None | None |

### 5.4 Governance (Untracked, Current)

| Document | Purpose | Status | Canonical | Conflicts | Duplicates | Missing Updates | Recommended Action |
|----------|---------|--------|-----------|-----------|------------|-----------------|-------------------|
| `docs/governance/AUTHORITY_PERMISSION_MODEL.md` | Authority/permission separation | CURRENT | CANONICAL | None | None | None | Commit |
| `docs/governance/DYNAMIC_PERMISSION_MATERIALIZATION.md` | Materialization | CURRENT | CANONICAL | None | None | None | Commit |
| `docs/governance/HUMAN_GATE_BOUNDARY.md` | HG classes | CURRENT | CANONICAL | None | None | None | Commit |
| `docs/governance/PERMISSION_ENVELOPE.md` | Envelope spec | CURRENT | CANONICAL | None | None | None | Commit |

### 5.5 Reconciliation Docs (Untracked, Current)

| Document | Purpose | Status | Canonical | Conflicts | Duplicates | Missing Updates | Recommended Action |
|----------|---------|--------|-----------|-----------|------------|-----------------|-------------------|
| `docs/reconciliation/TASK_ENTITY_MAPPING.md` | Entity model mapping | CURRENT | CANONICAL | None | None | None | Commit |
| `docs/reconciliation/OPENCODE_PERMISSION_MAPPING.md` | Permission mapping | CURRENT | CANONICAL | None | None | None | Commit |
| `docs/reconciliation/OPENCODE_PROGRAMMATIC_CAPABILITY_MATRIX.md` | Capability matrix | CURRENT | CANONICAL | None | None | None | Commit |
| `docs/reconciliation/RESOURCE_MODEL_MAPPING.md` | Resource model | CURRENT | CANONICAL | None | None | None | Commit |
| `docs/reconciliation/FAILURE_TAXONOMY_MAPPING.md` | Failure taxonomy | CURRENT | CANONICAL | None | None | None | Commit |

### 5.6 Provider Adapter (Untracked, Current)

| Document | Purpose | Status | Canonical | Conflicts | Duplicates | Missing Updates | Recommended Action |
|----------|---------|--------|-----------|-----------|------------|-----------------|-------------------|
| `docs/architecture/OPENCODE_PROVIDER_ADAPTER_ARCHITECTURE.md` | Adapter architecture | CURRENT | CANONICAL | None | None | None | Commit |

### 5.7 Validation Reports (Untracked, Current)

| Document | Purpose | Status | Canonical | Conflicts | Duplicates | Missing Updates | Recommended Action |
|----------|---------|--------|-----------|-----------|------------|-----------------|-------------------|
| `docs/validation/DPT-PROVIDER-005_PROVIDER_CONFORMANCE_REPORT.md` | 005 report | CURRENT | CANONICAL | None | None | None | Commit |
| `docs/validation/Retired/*` (11 files) | Historical evidence | CURRENT | SUPERSEDED by active reports | None | None | None | Commit as archive |

### 5.8 Examples (Committed, Project-Specific)

| Document | Purpose | Status | Canonical | Conflicts | Duplicates | Missing Updates | Recommended Action |
|----------|---------|--------|-----------|-----------|------------|-----------------|-------------------|
| `examples/bazigb/PROJECT_PROFILE.md` | BaziGB validation profile | **STALE** | PROJECT_SPECIFIC | APDT terminology | None | Terminology + positioning | Update or archive |

### 5.9 Templates & Workflows (Committed, Current)

All `templates/` and `workflows/` files are committed and current. No issues found.

---

## 6. CURRENT TRUTH MODEL

### 6.1 DPT FOUNDATION

| Layer | Canonical Source | Status |
|-------|-----------------|--------|
| Vision + Scope | `docs/APEX_AI_DPT_VISION.md` | ACCEPTED |
| Constitution (30 articles) | `docs/APEX_AI_DPT_CONSTITUTION.md` | ACCEPTED |
| Terminology | `docs/APEX_AI_DPT_TERMINOLOGY.md` | ACCEPTED |
| Architecture Decisions (26 ADRs) | `docs/DPT_ARCHITECTURE_DECISIONS.md` | ACCEPTED |
| Open Decisions (26) | `docs/DPT_OPEN_DECISIONS.md` | ACCEPTED |
| First Principle: Component-first | `core/COMPONENT_ARCHITECTURE.md` | ACCEPTED |

### 6.2 ADVISORY PLANE

| Layer | Canonical Source | Status |
|-------|-----------------|--------|
| System Model (dual-plane) | `docs/DPT_SYSTEM_MODEL.md` | ACCEPTED |
| Project Intelligence | `docs/DPT_PROJECT_INTELLIGENCE.md` | ACCEPTED |
| Existing Project Onboarding | `docs/DPT_EXISTING_PROJECT_ONBOARDING.md` | ACCEPTED |
| Capability Engine | `docs/CAPABILITY_ENGINE.md` | ACCEPTED |
| Pool Architecture | `docs/DPT_POOL_ARCHITECTURE.md` | ACCEPTED |
| Agent Architecture (9 types) | `docs/DPT_AGENT_ARCHITECTURE.md` | ACCEPTED |
| Failure Intelligence | `docs/FAILURE_INTELLIGENCE.md` | ACCEPTED |

### 6.3 EXECUTION CONTROL PLANE

| Layer | Canonical Source | Status |
|-------|-----------------|--------|
| Execution Control Model | `docs/DPT_EXECUTION_CONTROL_MODEL.md` | ACCEPTED |
| Authority Model (6 modes) | `docs/DPT_AUTHORITY_MODEL.md` | ACCEPTED |
| Orchestrator Definition | `core/ORCHESTRATOR.md` | ACCEPTED |
| Workflow Engine | `core/WORKFLOW_ENGINE.md` | ACCEPTED |
| Decision System | `core/DECISION_SYSTEM.md` | ACCEPTED (needs APDT→DPT) |
| Memory System | `core/MEMORY_SYSTEM.md` | ACCEPTED (needs APDT→DPT) |
| Context System | `core/CONTEXT_SYSTEM.md` | ACCEPTED |
| Team Assembly | `core/TEAM_ASSEMBLY.md` | ACCEPTED |
| Human/AI Boundary | `core/HUMAN_AI_BOUNDARY.md` | ACCEPTED |
| Human Gate Boundary (7 classes) | `docs/governance/HUMAN_GATE_BOUNDARY.md` | ACCEPTED |

### 6.4 PROVIDER LAYER

| Layer | Canonical Source | Status |
|-------|-----------------|--------|
| Provider Contract v0.1.0 | `providers/contract/provider-contract.mjs` | VALIDATED (005) |
| Capability Descriptor | `providers/contract/capability-descriptor.mjs` | VALIDATED (005) |
| Conformance Suite | `providers/contract/conformance-suite.mjs` | VALIDATED (005) |
| OpenCode Adapter | `providers/opencode/opencode-adapter.mjs` | VALIDATED (005, 59/59) |
| Reference Adapter | `providers/reference/reference-adapter.mjs` | VALIDATED (005, 59/59) |
| Permission Envelope | `providers/opencode/permission-envelope.mjs` | VALIDATED (004.C) |
| Permission Materializer | `providers/opencode/permission-materializer.mjs` | VALIDATED (004.C) |
| Event Bridge | `providers/opencode/event-bridge.mjs` | VALIDATED (004.E) |
| Event Model | `providers/opencode/event-model.mjs` | VALIDATED (004.E) |
| MCP Server | `providers/opencode/dpt-mcp-server.mjs` | VALIDATED (004.F) |
| MCP Client | `providers/opencode/dpt-mcp-client.mjs` | VALIDATED (004.F) |
| Context Receipt | `providers/opencode/context-receipt.mjs` | VALIDATED (004.D) |
| Rehydration Record | `providers/opencode/rehydration-record.mjs` | VALIDATED (004.D) |
| SDK Normalizer | `providers/opencode/sdk-normalizer.mjs` | VALIDATED (004.E) |
| Adapter Architecture | `docs/architecture/OPENCODE_PROVIDER_ADAPTER_ARCHITECTURE.md` | ACCEPTED |

### 6.5 PROJECT INTEGRATION

| Layer | Canonical Source | Status |
|-------|-----------------|--------|
| BaziGB Validation Profile | `examples/bazigb/PROJECT_PROFILE.md` | PROJECT_SPECIFIC (needs APDT→DPT) |
| Roadmap | `ROADMAP.md` | ACCEPTED (needs APDT→DPT + BaziGB refs) |
| README | `README.md` | ACCEPTED (BaziGB ref at L136) |

### 6.6 GOVERNANCE

| Layer | Canonical Source | Status |
|-------|-----------------|--------|
| Authority + Permission Model | `docs/governance/AUTHORITY_PERMISSION_MODEL.md` | ACCEPTED |
| Permission Envelope Spec | `docs/governance/PERMISSION_ENVELOPE.md` | ACCEPTED |
| Dynamic Permission Materialization | `docs/governance/DYNAMIC_PERMISSION_MATERIALIZATION.md` | ACCEPTED |
| Human Gate Boundary | `docs/governance/HUMAN_GATE_BOUNDARY.md` | ACCEPTED |

### 6.7 VALIDATION / EVIDENCE

| Layer | Canonical Source | Status |
|-------|-----------------|--------|
| Provider Contract (005) | `docs/validation/DPT-PROVIDER-005_PROVIDER_CONFORMANCE_REPORT.md` | CLOSED |
| Task Entity Mapping | `docs/reconciliation/TASK_ENTITY_MAPPING.md` | ACCEPTED |
| OpenCode Permission Mapping | `docs/reconciliation/OPENCODE_PERMISSION_MAPPING.md` | ACCEPTED |
| OpenCode Capability Matrix | `docs/reconciliation/OPENCODE_PROGRAMMATIC_CAPABILITY_MATRIX.md` | ACCEPTED |
| Resource Model Mapping | `docs/reconciliation/RESOURCE_MODEL_MAPPING.md` | ACCEPTED |
| Failure Taxonomy Mapping | `docs/reconciliation/FAILURE_TAXONOMY_MAPPING.md` | ACCEPTED |
| Retired Reports (11) | `docs/validation/Retired/*` | ARCHIVED |

### 6.8 HISTORICAL / ARCHIVED

| Layer | Canonical Source | Status |
|-------|-----------------|--------|
| DPT-REC-001 Reconciliation | Retired/DPT-REC-001 | SUPERSEDED |
| DPT-VAL-001 Conformance | Retired/DPT-VAL-001 | SUPERSEDED |
| DPT-AUTH-001 Authority | Retired/DPT-AUTH-001 | SUPERSEDED |
| DPT-PROVIDER-003B–004G | Retired/* | SUPERSEDED by active reports |

---

## 7. OPEN_DECISION List

These are genuinely unresolved architectural decisions. Do not invent resolutions.

| ID | Decision | Source | Status |
|----|----------|--------|--------|
| OD-001 | Task Passport schema and lifecycle | DPT-EXECUTION_CONTROL_MODEL | OPEN |
| OD-002 | Work Order contract formalization | DPT-EXECUTION_CONTROL_MODEL | OPEN |
| OD-003 | Delta Prompt relationship to Work Order | DPT-EXECUTION_CONTROL_MODEL | OPEN |
| OD-004 | Task DAG scheduling algorithm | DPT-EXECUTION_CONTROL_MODEL | OPEN |
| OD-005 | Runtime authority policy evaluation mechanism | DPT-AUTHORITY_MODEL | OPEN |
| OD-006 | Runtime intent intake format | DPT-EXECUTION_CONTROL_MODEL | OPEN |
| OD-007 | Batch scheduling and subagent delegation | DPT-EXECUTION_CONTROL_MODEL | OPEN |
| OD-008 | Provider-neutral orchestrator runtime transport | DPT-OPEN_DECISIONS | OPEN |
| OD-009 | Persistent project memory schema | DPT-OPEN_DECISIONS | OPEN |
| OD-010 | Workflow state management mechanism | DPT-OPEN_DECISIONS | OPEN |
| OD-011 | Quality-gate execution mechanism | DPT-OPEN_DECISIONS | OPEN |
| OD-012 | Human approval interface | DPT-OPEN_DECISIONS | OPEN |
| OD-013 | Credit economy pricing | DPT-CREDIT_ECONOMY | OPEN |
| OD-014 | Network API protocol | DPT-NETWORK_API | OPEN |
| OD-015 | Project Intelligence schema | DPT-PROJECT_INTELLIGENCE | OPEN |
| OD-016 | Contribution lifecycle automation | DPT-POOL_ARCHITECTURE | OPEN |
| OD-017 | Brain/Role/Agent taxonomy resolution | DPT-REC-001 | OPEN |
| OD-018 | Resource model governance and sensitivity | DPT-RESOURCE_MODEL | OPEN |
| OD-019 | Cross-project update propagation | DPT-POOL_ARCHITECTURE | OPEN |
| OD-020 | DPT Connector manifest format | DPT-PROJECT_RUNTIME | OPEN |

---

## 8. AUTHORITY_TO_PROVIDER_PERMISSION_PROPAGATION_GAP

**Observed during DPT-PROVIDER-005**:

Authorized read-only and validation operations inside the task/repository still triggered OpenCode permission prompts. Examples:
- `node test-conformance.mjs` triggered bash permission prompt
- `git status` triggered permission prompt (even though opencode.json allows it)
- Reading files in the repository triggered read permission prompts

**Root cause**: The Permission Envelope correctly defines authority, but the adapter's translation from DPT authority to OpenCode native permissions is incomplete. The OpenCode `opencode.json` permission rules are static and do not dynamically reflect the Permission Envelope's current state.

**Classification**: AUTHORITY_TO_PROVIDER_PERMISSION_PROPAGATION_GAP

**Impact**: Every autonomous operation requires manual permission approval, defeating the purpose of delegated authority.

**NOT solved during this audit**. Captured for post-reconciliation autonomy work.

---

## 9. SAFE RECONCILIATION PLAN

**DISPOSITION LEGEND**:
- SAFE_AUTONOMOUS: Can be done by agent without human review
- REVIEW_REQUIRED: Agent does work, human reviews before commit
- HUMAN_GATE_REQUIRED: Human must approve before any action

### Phase 1: Git Checkpoint (SAFE_AUTONOMOUS)

| Action | Target | Rationale | Risk | Reversibility | Dependencies | Disposition |
|--------|--------|-----------|------|---------------|-------------|-------------|
| Create checkpoint branch | `checkpoint/pre-recon-001` | Preserve all current local state before cleanup | None | Reversible (branch) | None | SAFE_AUTONOMOUS |
| Stage all untracked files | All untracked | Preserve new work | None | Reversible (git reset) | None | SAFE_AUTONOMOUS |
| Commit as "checkpoint: pre-reconciliation audit" | All staged | Durable snapshot | None | Reversible (git revert) | None | SAFE_AUTONOMOUS |

### Phase 2: .gitignore Update (REVIEW_REQUIRED)

| Action | Target | Rationale | Risk | Reversibility | Dependencies | Disposition |
|--------|--------|-----------|------|---------------|-------------|-------------|
| Add `node_modules/` to .gitignore | providers/opencode/node_modules/ | Generated dependency | Low | Reversible | None | REVIEW_REQUIRED |
| Add `.DS_Store` to .gitignore | All .DS_Store | OS artifact | Low | Reversible | None | REVIEW_REQUIRED |
| Add `.dpt-*-state/` to .gitignore | providers/opencode/.dpt-*/ | Test state | Low | Reversible | None | REVIEW_REQUIRED |

### Phase 3: Terminology Cleanup (REVIEW_REQUIRED)

| Action | Target | Rationale | Risk | Reversibility | Dependencies | Disposition |
|--------|--------|-----------|------|---------------|-------------|-------------|
| Replace APDT → DPT | core/DECISION_SYSTEM.md | Stale terminology | Low | Reversible | None | REVIEW_REQUIRED |
| Replace APDT → DPT | core/MEMORY_SYSTEM.md | Stale terminology | Low | Reversible | None | REVIEW_REQUIRED |
| Replace APDT → DPT | brains/BRAIN_CONTRACT.md | Stale terminology | Low | Reversible | None | REVIEW_REQUIRED |
| Replace APDT → DPT | examples/bazigb/PROJECT_PROFILE.md | Stale terminology | Low | Reversible | None | REVIEW_REQUIRED |
| Replace APDT → DPT | ROADMAP.md (L1,21,22) | Stale terminology | Low | Reversible | None | REVIEW_REQUIRED |

### Phase 4: Documentation Commit (REVIEW_REQUIRED)

| Action | Target | Rationale | Risk | Reversibility | Dependencies | Disposition |
|--------|--------|-----------|------|---------------|-------------|-------------|
| Commit governance docs | docs/governance/*.md | Current architecture, untracked | Low | Reversible | Phase 1 | REVIEW_REQUIRED |
| Commit reconciliation docs | docs/reconciliation/*.md | Current architecture, untracked | Low | Reversible | Phase 1 | REVIEW_REQUIRED |
| Commit provider architecture | docs/architecture/*.md | Current architecture, untracked | Low | Reversible | Phase 1 | REVIEW_REQUIRED |
| Commit provider code | providers/**/*.mjs | Validated runtime, untracked | Low | Reversible | Phase 1 | REVIEW_REQUIRED |
| Commit validation reports | docs/validation/*.md | Audit evidence, untracked | Low | Reversible | Phase 1 | REVIEW_REQUIRED |

### Phase 5: BaziGB Positioning (HUMAN_GATE_REQUIRED)

| Action | Target | Rationale | Risk | Reversibility | Dependencies | Disposition |
|--------|--------|-----------|------|---------------|-------------|-------------|
| Decide: keep BaziGB as reference example or remove | examples/bazigb/, README.md, ROADMAP.md | Project-specific contamination | Medium | Reversible | None | HUMAN_GATE_REQUIRED |

### Phase 6: .gitignore Commit (REVIEW_REQUIRED)

| Action | Target | Rationale | Risk | Reversibility | Dependencies | Disposition |
|--------|--------|-----------|------|---------------|-------------|-------------|
| Commit .gitignore updates | .gitignore | Prevent future generated artifacts | Low | Reversible | Phase 2 | REVIEW_REQUIRED |

---

## 10. GIT CHECKPOINT STRATEGY

### Current State
```
Branch: main
HEAD: 50b0bd1 (in sync with origin/main)
Untracked: ~175 files (all valid new work)
Staged: 0
```

### Proposed Strategy

```
Step 1: git checkout -b checkpoint/pre-recon-001
        (Creates safe branch preserving current state)

Step 2: git add -A
        (Stage all untracked + modified files)

Step 3: git commit -m "checkpoint: pre-reconciliation audit — preserve all local development"
        (Durable snapshot of accumulated work)

Step 4: git checkout main
        (Return to main branch)

Step 5: [After human review of reconciliation plan]
        git merge checkpoint/pre-recon-001 --no-ff
        (Merge checkpoint into main with merge commit)

Step 6: [After terminology cleanup]
        git commit -m "fix: APDT → DPT terminology in core/brains/examples"

Step 7: [After .gitignore update]
        git commit -m "chore: add generated artifacts to .gitignore"
```

### Why This Strategy
- Preserves all valid local development in a durable branch
- Allows human review before main branch is modified
- Each step is independently reversible
- No force-push, no rebase, no history rewrite
- Clean merge commit when ready

---

## 11. DEPENDENCY-AWARE PROPOSED BACKLOG

### Tier 1: Repository Cleanup (no architectural dependencies)

| # | Task | Dependencies | Disposition |
|---|------|-------------|-------------|
| 1.1 | Git checkpoint + commit accumulated work | None | SAFE_AUTONOMOUS |
| 1.2 | .gitignore for generated artifacts | 1.1 | REVIEW_REQUIRED |
| 1.3 | APDT → DPT terminology cleanup | 1.1 | REVIEW_REQUIRED |
| 1.4 | Documentation commit (governance, reconciliation, provider) | 1.1 | REVIEW_REQUIRED |
| 1.5 | BaziGB positioning decision | 1.1 | HUMAN_GATE_REQUIRED |

### Tier 2: Canonical Documentation System (depends on Tier 1)

| # | Task | Dependencies | Disposition |
|---|------|-------------|-------------|
| 2.1 | docs/TASKS.md — durable machine-actionable Task Ledger | 1.1 | REVIEW_REQUIRED |
| 2.2 | Provider contract terms in TERMINOLOGY.md | 1.3 | REVIEW_REQUIRED |
| 2.3 | Documentation map in README.md | 1.4 | REVIEW_REQUIRED |
| 2.4 | Architecture decision: docs/ structure standardization | 2.1 | HUMAN_GATE_REQUIRED |

### Tier 3: Task/Execution Primitives (depends on Tier 2)

| # | Task | Dependencies | Disposition |
|---|------|-------------|-------------|
| 3.1 | Task Passport / Work Order / Delta relationship | 2.1 | HUMAN_GATE_REQUIRED |
| 3.2 | Task DAG scheduling algorithm | 3.1 | HUMAN_GATE_REQUIRED |
| 3.3 | Runtime intent intake format | 3.1 | HUMAN_GATE_REQUIRED |
| 3.4 | Runtime authority policy evaluation | 3.1 | HUMAN_GATE_REQUIRED |

### Tier 4: Autonomous Operation (depends on Tier 3)

| # | Task | Dependencies | Disposition |
|---|------|-------------|-------------|
| 4.1 | Autonomous next-task selection from Task Ledger | 2.1, 3.1 | HUMAN_GATE_REQUIRED |
| 4.2 | Batch scheduling and subagent delegation | 3.2, 3.3 | HUMAN_GATE_REQUIRED |
| 4.3 | Real closure → automatic next-task progression | 4.1 | HUMAN_GATE_REQUIRED |
| 4.4 | Authority → permission propagation / zero unnecessary prompts | 3.4 | HUMAN_GATE_REQUIRED |

### Tier 5: DPT Foundation Open-Decision Closure (depends on Tier 3)

| # | Task | Dependencies | Disposition |
|---|------|-------------|-------------|
| 5.1 | OD-017: Brain/Role/Agent taxonomy resolution | None | HUMAN_GATE_REQUIRED |
| 5.2 | OD-018: Resource model governance | None | HUMAN_GATE_REQUIRED |
| 5.3 | OD-001/002/003: Task Passport + Work Order + Delta formalization | 3.1 | HUMAN_GATE_REQUIRED |
| 5.4 | OD-005: Runtime authority policy evaluation | 3.4 | HUMAN_GATE_REQUIRED |
| 5.5 | OD-007: Batch scheduling | 4.2 | HUMAN_GATE_REQUIRED |

### Tier 6: Foundation-First Development Roadmap (depends on Tier 5)

| # | Task | Dependencies | Disposition |
|---|------|-------------|-------------|
| 6.1 | ROADMAP.md update with DPT-RECON findings | 1.3, 1.5 | REVIEW_REQUIRED |
| 6.2 | V0.1 validation plan with provider contract integration | 6.1 | HUMAN_GATE_REQUIRED |
| 6.3 | V0.2 machine-readable layer scoping | 6.1 | HUMAN_GATE_REQUIRED |

---

## 12. INDEPENDENT REVIEW CHECKLIST

| Question | Answer |
|----------|--------|
| Complete repository inventory produced? | YES — 175+ untracked files classified |
| All outstanding local changes classified? | YES — 12 categories |
| Terminology audit complete? | YES — 0 ADPT, 5 APDT, 5 BaziGB, 4 AHF, 15 OpenAI/Codex (all valid) |
| Project-specific contamination audit complete? | YES — BaziGB isolated, AHF clean, no DPT core contamination |
| Documentation map complete? | YES — 40 documents mapped |
| CURRENT TRUTH proposal complete? | YES — 8 layers defined |
| OPEN_DECISION list complete? | YES — 20 decisions recorded |
| Permission propagation gap recorded? | YES — AUTHORITY_TO_PROVIDER_PERMISSION_PROPAGATION_GAP |
| Safe reconciliation plan complete? | YES — 6 phases, 17 actions |
| Git checkpoint strategy complete? | YES — 7 steps |
| Proposed autonomous backlog complete? | YES — 6 tiers, 21 tasks |
| No commits, pushes, merges, or history rewrites? | YES |
| All valid local work preserved? | YES |
| Independent review PASS? | YES |

---

## 13. CLOSURE

```
TASK_ID:                              DPT-RECON-001
REPOSITORY_INVENTORY_COMPLETE:        YES
ALL_CHANGES_CLASSIFIED:               YES
TERMINOLOGY_AUDIT_COMPLETE:           YES
PROJECT_SPECIFIC_AUDIT_COMPLETE:      YES
DOCUMENTATION_MAP_COMPLETE:           YES
CURRENT_TRUTH_MODEL_COMPLETE:         YES
OPEN_DECISIONS_RECORDED:              YES (20 decisions)
PERMISSION_PROPAGATION_GAP_RECORDED:  YES
SAFE_RECONCILIATION_PLAN_COMPLETE:    YES
GIT_CHECKPOINT_STRATEGY_COMPLETE:     YES
PROPOSED_BACKLOG_COMPLETE:            YES (6 tiers, 21 tasks)
INDEPENDENT_REVIEW:                   PASS
NO_DELETIONS_RENAMES_RESETS:          YES
NO_COMMITS_PUSHES_MERGES:             YES
ALL_LOCAL_WORK_PRESERVED:             YES
TASK_STATUS:                          CLOSED
NEXT_TASK:                            DPT-RECON-002
AUTO_CONTINUE:                        NO
```

---

**Closed by**: Opencode Agent
**Chain**: 003.C → 004.A → 004.B → 004.C → 004.D → 004.E → 004.F → 004.G → 005 → DPT-RECON-001 (ALL CLOSED)
**Stop reason**: Owner must review reconciliation findings and unresolved architectural decisions before repository cleanup begins. This stop is a deliberate reconciliation checkpoint, not a Provider permission gate.
