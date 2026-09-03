# DPT-AUTH-001 — Authority and Permission Envelope

## 1. Task Metadata

| Field | Value |
|-------|-------|
| Task ID | DPT-AUTH-001 |
| Title | Authority and Permission Envelope |
| Mode | EXECUTE |
| Risk | LOW — governance/specification only |
| Created | 2026-09-02 |
| Provider | opencode/mimo-v2.5-free |

## 2. Baseline Provenance

| Repository | Branch | SHA | Role |
|-----------|--------|-----|------|
| ApexAIPDT | main | `50b0bd19e957d9a79131508839fbc8b1ca48291a` | Canonical spec |
| Apex-Orchestrator-Lab | m1.1-hardening | `be5ecc10cce50e0f6acdec99b650a10fc16a8556` | Reference runtime |

## 3. Problem Statement

During DPT-VAL-001, OpenCode repeatedly requested user permission for operations that were already explicitly authorized by the DPT task scope, including access to task-specific disposable paths under `/tmp/dpt-val-001/**`. This created repeated unnecessary human interruptions and degraded autonomous execution.

**Canonical principle:** `PROVIDER_PERMISSION_REQUEST ≠ DPT_HUMAN_GATE`

The DPT authority system must determine what is AUTO_ALLOW, DENY, or HUMAN_GATE before provider execution. Provider adapters must translate that authority into provider-native permissions as closely and safely as possible.

## 4. Observed Permission-Spam Evidence

From DPT-VAL-001 execution:
- OpenCode prompted for permission to read files under `/tmp/dpt-val-001/` (disposable validation workspace)
- OpenCode prompted for permission to execute Node.js validation scripts
- These operations were within the authorized task scope and should have been AUTO_ALLOW
- Each prompt degraded autonomous execution and required human intervention

## 5. Canonical Authority Model

**Decision Outcomes (3, mutually exclusive):**
- AUTO_ALLOW: Operation pre-authorized by DPT policy; no human interruption
- DENY: Operation forbidden by DPT policy; fail-closed
- HUMAN_GATE: Operation requires explicit human judgment; genuine policy requirement

**Distinguished Concepts:**
- Authorization: what DPT policy permits
- Permission: what provider/runtime allows
- Capability: what provider can physically do
- Policy: DPT rules governing behavior
- Provider Prompt: runtime permission request (NOT a Human Gate)
- Human Gate: genuine DPT policy requirement for human judgment
- Scope Violation: operation outside authorized task scope

**Precedence:** Task-specific policy > Generic mode policy > DPT defaults

**Fail-Closed:** Ambiguous authority resolves to DENY

**Authority Properties:** Scoped, Auditable, Revocable, Explicit, Durable, Action-specific

## 6. Permission Envelope Model

**Provider-neutral interface** covering 9 domains:
FILESYSTEM, EXECUTION, AGENTS, GIT, NETWORK, SECRETS, DATABASE, PRODUCTION, DESTRUCTIVE

**Five-layer composition:** Base Policy > Mode Defaults > Project Policy > Task Grant > Runtime Narrowing

**Key Design Decisions:**
- Destructive operations are dual-gated (domain permission + DESTRUCTIVE overlay)
- HUMAN_GATE is sticky (cannot be overridden by less-specific AUTO_ALLOW)
- Specificity-based conflict resolution (DENY wins at equal specificity)
- Fail-closed by default (missing entries = DENY)
- No always-DENY override for force_push, reset --hard, etc.

## 7. Human Gate Boundary

**Genuine Human Gates (7):**
- HG-01: Merge to real main branch
- HG-02: Production deployment or release
- HG-03: Destructive database/data mutation (policy-gated)
- HG-04: Secret/credential disclosure or elevated access
- HG-05: Permission/ACL escalation
- HG-06: Destructive or hard-to-reverse operations
- HG-07: High-cost architecture decisions (policy-gated)

**Non-Gates (11):**
- NG-01 through NG-11: Reading repos, writing artifacts, /tmp workspace, validation, tests, subagents, parallel execution, Git inspection, rework, review, reporting

**Critical Distinction:** `PROVIDER_PERMISSION_REQUEST ≠ DPT_HUMAN_GATE`

## 8. Provider Permission vs Human Gate

| Provider Permission Request | DPT Human Gate |
|---------------------------|---------------|
| Runtime event | Durable policy requirement |
| May be suppressed by config | Cannot be suppressed by config |
| Provider-specific | Provider-neutral |
| Optional/mandatory per provider | Mandatory per DPT policy |
| Can be auto-resolved | Requires human judgment |

## 9. OpenCode Native Capability Mapping

| DPT Concept | OpenCode Mechanism | Coverage |
|------------|-------------------|----------|
| Read permission | `permission.read` | FULL |
| Edit/write permission | `permission.edit` | FULL |
| Bash/command permission | `permission.bash` | FULL |
| External directory | `permission.external_directory` | FULL |
| Subagent/task | `permission.task` | FULL |
| Per-agent permissions | `AgentConfig.permission` | FULL |
| Allow/ask/deny | `PermissionRuleConfig` | FULL |
| Wildcard/path patterns | Pattern syntax in rules | FULL |
| Service/Authority Modes | (none) | UNSUPPORTED |
| Work Order scoping | (none) | UNSUPPORTED |
| Policy Ceiling | (none) | UNSUPPORTED |
| Audit Trail | Plugin hooks only | PARTIAL |
| Dynamic Scoping | (none) | UNSUPPORTED |

**Coverage:** ~58% FULL, ~16% PARTIAL, ~26% UNSUPPORTED

## 10. Unsupported/Partial Provider Capabilities

The DPT OpenCode Adapter must implement:
- Policy Translator (Authority Policy → per-agent permission configs)
- Policy Ceiling intersection logic
- Mode-to-Permission translation
- Work Order injection via prompts
- Resource Claim enforcement
- Audit logging via plugin hooks
- Context control via instructions + references

## 11. DPT-VAL-001 Worked Example

| Domain | Operation | DPT Decision | OpenCode Enforcement |
|--------|-----------|-------------|---------------------|
| READ | ApexAIPDT context | AUTO_ALLOW | `permission.read: allow` |
| READ | Lab reference context | AUTO_ALLOW | `permission.read: allow` |
| WRITE | /tmp/dpt-val-001/** | AUTO_ALLOW | `permission.edit: allow /tmp/**` |
| WRITE | Validation report | AUTO_ALLOW | `permission.edit: allow docs/validation/**` |
| WRITE | Unrelated repo files | DENY | `permission.edit: deny *` |
| EXECUTION | Validation harness | AUTO_ALLOW | `permission.bash: allow node *` |
| AGENTS | Spawn subagents | AUTO_ALLOW | `permission.task: allow` |
| GIT | Read-only inspection | AUTO_ALLOW | `permission.bash: allow git status/diff/log` |
| GIT | Merge main | HUMAN_GATE | Not enforceable by OpenCode |
| PRODUCTION | Deploy | HUMAN_GATE | Not enforceable by OpenCode |

## 12. Mode-5 Autonomy Target

**Target:** `UNNECESSARY_HUMAN_INTERRUPTION_COUNT = 0`

For a LOW-risk Mode-5 task whose complete operations remain inside its authorized Permission Envelope:
- All AUTO_ALLOW operations execute without prompts
- All DENY operations are blocked without prompts
- Only genuine HUMAN_GATES require human intervention
- Provider-native prompts caused by missing permission translation are counted as unnecessary

**Measurement:** Count of provider permission prompts that are NOT genuine DPT Human Gates.

## 13. Specialist Agent Results

| Specialist | Artifact | Status | Key Decisions |
|-----------|----------|--------|---------------|
| AUTH-A | AUTHORITY_PERMISSION_MODEL.md | APPROVED | 3 outcomes, 7 concepts, fail-closed, 8-step algorithm |
| AUTH-B | PERMISSION_ENVELOPE.md | APPROVED (after rework) | 9 domains, 5-layer composition, DESTRUCTIVE overlay |
| AUTH-C | HUMAN_GATE_BOUNDARY.md | APPROVED | 7 gates, 11 non-gates, provider≠gate distinction |
| AUTH-D | OPENCODE_PERMISSION_MAPPING.md | APPROVED | 22 FULL, 6 PARTIAL, 10 UNSUPPORTED |

## 14. Parallel Execution Topology

| Phase | Agents | Concurrency | Evidence |
|-------|--------|-------------|----------|
| Specialist dispatch | AUTH-A, AUTH-B, AUTH-C, AUTH-D | 4 | 4 subagents dispatched concurrently |
| Initial review | 4 reviewers | 4 | 4 reviewer agents dispatched concurrently |
| Rework | AUTH-B ( PERMISSION_ENVELOPE) | 1 | 1 member agent |
| Re-review | 1 reviewer | 1 | 1 reviewer agent |

**Total subagents used:** 10 (4 specialists + 4 reviewers + 1 reworker + 1 re-reviewer)
**Max observed concurrency:** 4

## 15. Independent Review Results

| Artifact | Reviewer | Result | Findings |
|----------|----------|--------|----------|
| AUTHORITY_PERMISSION_MODEL | independent-dpt-authority-reviewer | APPROVED | 0 blocking |
| PERMISSION_ENVELOPE | opencode/mimo-v2-free | REWORK_REQUIRED | 2 critical, 3 moderate, 4 minor |
| HUMAN_GATE_BOUNDARY | opencode/mimo-v2-free | APPROVED | 0 blocking |
| OPENCODE_PERMISSION_MAPPING | opencode/mimo-v2.5-free | APPROVED | 0 blocking (2 minor) |

## 16. Rework History

| Artifact | Round | Findings Fixed | Result |
|----------|-------|---------------|--------|
| PERMISSION_ENVELOPE | Round 1 | F1-F9 (2 critical, 3 moderate, 4 minor) | APPROVED on re-review |

## 17. Security Analysis

- **Fail-closed:** All ambiguity resolves to DENY
- **Human Gates preserved:** 7 genuine gates for sensitive operations
- **No secret exposure:** Audit logs exclude secret values
- **Provider-neutral:** Envelope works for any AI agent runtime
- **No silent weakening:** Constitution Articles 11, 19, 21, 29 explicitly referenced
- **DESTRUCTIVE overlay:** Dual-gating prevents accidental destructive operations

## 18. Remaining Gaps

| Gap | Severity | Mitigation |
|-----|----------|-----------|
| OpenCode audit trail is partial (plugin hooks only) | MEDIUM | DPT adapter must implement structured audit |
| Dynamic scoping not supported by OpenCode | MEDIUM | DPT adapter must handle via prompt injection |
| Policy Ceiling not enforceable by OpenCode | HIGH | DPT adapter must implement intersection logic |
| idle_timeout_seconds not enforced by OpenCode | LOW | Future capability |

## 19. Implementation Plan

**Phase 1 (Next Task):** DPT-PROVIDER-003.A — Implement OpenCode permission configuration
**Phase 2:** DPT-PROVIDER-003.B — Implement DPT OpenCode Adapter (Policy Translator)
**Phase 3:** DPT-PROVIDER-003.C — Implement audit logging via plugin hooks

## 20. Recommended Next Task

DPT-PROVIDER-003.A — Implement verified OpenCode permission configuration based on this authority model.

## 21. Safety / Change Record

| Action | Status |
|--------|--------|
| Lab runtime modified | NO |
| DPT spec modified | NO |
| OpenCode config modified | NO |
| Repository files modified | 4 (governance artifacts only) |
| Secrets exposed | NO |
| AHF/Testbed/Production/DB accessed | NO |

## 22. Revision History

| Rev | Date | Author | Changes |
|-----|------|--------|---------|
| 1 | 2026-09-02 | opencode | Initial authority and permission envelope design |

---

*DPT-AUTH-001 — Authority and Permission Envelope — 2026-09-02*
