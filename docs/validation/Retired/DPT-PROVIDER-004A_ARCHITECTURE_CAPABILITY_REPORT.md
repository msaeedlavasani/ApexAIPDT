# DPT-PROVIDER-004.A — Architecture & Capability Report

**Task ID:** DPT-PROVIDER-004.A
**Title:** OpenCode Programmatic Integration & Provider Adapter Architecture
**Status:** CLOSED
**Mode:** BUILD
**Autonomous:** YES
**Started:** 2026-09-03

---

## 1. Task Metadata

| Field | Value |
|-------|-------|
| Task ID | DPT-PROVIDER-004.A |
| Parent Task | DPT-PROVIDER-003.C (CLOSED) |
| Purpose | Design canonical DPT OpenCode Provider Adapter architecture and verify programmatic integration surfaces |
| Execution Policy | AUTONOMOUS |
| Human Gate Required | NO |
| OpenCode Version | 1.18.25 (Homebrew, Mach-O x86_64) |
| Repository | /Users/msl/Documents/GitHub/ApexAIPDT |
| Branch | main |
| HEAD | 50b0bd1 |

---

## 2. Capability Assessment

### 2.1 Integration Surfaces

| Surface | Available | Evidence |
|---------|-----------|----------|
| SDK | **YES** | `@opencode-ai/sdk` on npm; installed + tested in 004.B |
| Server API | **YES** | `opencode serve` + `opencode acp` |
| MCP | **YES** (consumer) | `opencode mcp add/list/auth` |
| CLI | **YES** | Full CLI with 15+ commands |

### 2.2 Primary Control Channels

| Direction | Primary | Rationale |
|-----------|---------|-----------|
| DPT → OpenCode | SDK (`@opencode-ai/sdk`) | Type-safe; lifecycle-managed; event-capable |
| DPT → OpenCode (persistent) | Server API (`serve`/`acp`) | Long-running sessions; ACP standard |
| DPT → OpenCode (capabilities) | MCP (DPT-provided server) | Standardized capability exposure |
| OpenCode → DPT (evidence) | CLI export + plugin hooks | Session data + runtime events |

### 2.3 Work/Codex Dependency

| Field | Value |
|-------|-------|
| WORK_CODEX_REQUIRED | **NO** |
| OPENAI_PROVIDER_REQUIRED | **NO** |
| PROVIDER_MODEL_ROUTING_INDEPENDENT | **YES** |

OpenCode supports multiple providers via `@ai-sdk/openai-compatible`. The adapter uses provider-agnostic CLI flags (`--model provider/model`). No OpenAI/Codex dependency exists.

---

## 3. Architecture Deliverables

### 3.1 Architecture Document

**File:** `docs/architecture/OPENCODE_PROVIDER_ADAPTER_ARCHITECTURE.md`

**Contents:**
- Canonical integration diagram
- SDK/API/MCP/CLI responsibility matrix
- MCP directionality (OpenCode → DPT MCP Server)
- Provider-independence rule
- Dynamic permission materialization design
- 003.C unresolved shell /tmp behavior
- Session lifecycle (CREATE → COMPLETE)
- Failure lifecycle (restart, compaction, timeout, crash, etc.)
- Rehydration requirements
- Subagent boundary
- Evidence bridge
- Capability descriptor
- Failure mapping
- Cost/usage observability design
- Implementation phases (004.B through 004.G)

### 3.2 Capability Matrix

**File:** `docs/reconciliation/OPENCODE_PROGRAMMATIC_CAPABILITY_MATRIX.md`

**Contents:**
- Integration surface inventory
- CLI command matrix (16 commands)
- CLI run flags (14 flags)
- Server API capabilities
- MCP consumer/provider capabilities
- Permission system (15 keys, evaluation semantics)
- Session management (8 capabilities)
- Agent management (6 capabilities)
- Plugin system (4 capabilities)
- Data export & observability (10 capabilities)
- Capability gaps for DPT integration (8 gaps)

### 3.3 Permission Materialization Design

**File:** `docs/governance/DYNAMIC_PERMISSION_MATERIALIZATION.md`

**Contents:**
- Permission Envelope → OpenCode config mapping
- Rule-order construction algorithm
- Role-scoped permission generation
- 003.C shell /tmp behavior adapter strategy
- Full worked example (envelope → config)
- Rehydration after restart
- Revocation mechanism

---

## 4. Key Architecture Decisions

### 4.1 SDK as Primary Control Surface

**Decision:** Use SDK (`@opencode-ai/sdk`) as the primary DPT → OpenCode control surface.

**Rationale:**
- Type-safe programmatic control
- Lifecycle-managed (SDK starts/stops server internally)
- Event-capable (`client.event.subscribe()`)
- Session/prompt/abort are first-class typed APIs
- No subprocess overhead
- CLI retained as fallback/diagnostic

**Trade-off:** SDK requires npm package; CLI remains available as fallback for single-shot execution and debugging.

### 4.2 MCP as Capability Channel (Not Control)

**Decision:** MCP is the channel for DPT capability exposure to OpenCode, NOT the primary control channel.

**Rationale:**
- MCP is request-response, not command-control
- OpenCode is MCP consumer; DPT provides MCP server
- Better suited for capability exposure and evidence collection
- CLI/Server API provide direct execution control

### 4.3 Config-Based Permission Materialization

**Decision:** Materialize permissions via `opencode.json` config generation.

**Rationale:**
- OpenCode's native permission surface is config-based
- Per-agent permission overrides available
- Pattern-based bash/file permissions supported
- Last-rule-wins semantics are well-understood

**Trade-off:** Config has infinite TTL; changes require session restart.

### 4.4 Native Tools for External Directory Operations

**Decision:** Use native Read/Write tools for task-scoped external directory operations; avoid shell mkdir.

**Rationale:**
- 003.C proved native tools respect `external_directory` patterns
- Shell mkdir triggers scope widening to `/tmp/*`
- Root cause unresolved; adapter must work around it

**Trade-off:** Limits shell flexibility for directory operations.

---

## 5. 003.C Unresolved Shell /tmp Behavior

### 5.1 Evidence Summary

| Operation | Tool | Result |
|-----------|------|--------|
| Write to `/tmp/dpt-*/` | native Write | AUTO_ALLOW — zero prompts |
| Read from `/tmp/dpt-*/` | native Read | AUTO_ALLOW — zero prompts |
| `mkdir /tmp/dpt-*/` | bash | External-directory prompt for `/tmp/*` |

### 5.2 Root Cause

**UNRESOLVED** — provider-level scope normalization behavior.

### 5.3 Adapter Design Response

1. Pre-create directories via native Write before session start
2. Pre-authorize specific shell commands via bash config patterns
3. Accept permission prompts as Human Gates for unresolvable cases
4. Investigate in 004.B+ (plugin hooks, MCP pre-authorization)

### 5.4 Investigation Required

- Test adapter permission injection via plugin hooks
- Test MCP-based pre-authorization
- Test exact provider scope normalization behavior
- Document findings in 004.C

---

## 6. Subagent Boundary

| Concern | Owner |
|---------|-------|
| Task authority | DPT Execution Orchestrator |
| Durable state | DPT Task State |
| Lifecycle | DPT Orchestrator |
| Evidence requirements | DPT |
| Retry policy | DPT |
| Rerouting | DPT |
| Resource claims | DPT |
| Human Gates | DPT |
| Completion semantics | DPT |
| Subagent spawn | OpenCode (task tool) |
| Subagent permissions | Adapter (generated config) |
| Subagent depth | Adapter (subagent_depth config) |

---

## 7. Failure Mapping

| Provider Event | DPT FailureClass | DPT Disposition |
|---------------|-----------------|-----------------|
| provider unavailable | PROVIDER_UNAVAILABLE | REROUTE |
| transport failure | TRANSPORT_ERROR | REWORK_REQUIRED |
| timeout | TIMEOUT | REWORK_REQUIRED |
| rate limit | RATE_LIMIT | REWORK_REQUIRED |
| auth failure | AUTH_ERROR | ESCALATE |
| policy denial | POLICY_DENIED | ESCALATE |
| agent crash | WORKER_EXIT_FAILURE | REWORK_REQUIRED |
| session loss | UNKNOWN | REWORK_REQUIRED |
| invalid result | INVALID_REPORT | REWORK_REQUIRED |
| unknown | UNKNOWN | ESCALATE |

---

## 8. Cost/Usage Observability

| Metric | Source | Available |
|--------|--------|-----------|
| Token usage | `opencode stats` | YES |
| Cost statistics | `opencode stats` | YES |
| Model statistics | `opencode stats --models` | YES |
| Session data | `opencode export` | YES |
| Provider-reported cost | Provider API | UNKNOWN |
| Free-tier usage | Computed | YES (if free model) |

---

## 9. Unsupported / Unknown Capabilities

| Capability | Status | Impact |
|-----------|--------|--------|
| Standalone SDK | **SUPPORTED** | `@opencode-ai/sdk` — createOpencode, createOpencodeClient, session, events |
| Runtime permission injection | UNKNOWN | Config regeneration + restart |
| Session compaction control | UNKNOWN | Prompt injection workaround |
| Structured event stream | PARTIAL (plugin hooks) | Plugin system |
| Process leak detection | UNSUPPORTED | Adapter-managed monitoring |
| Permission audit trail | UNSUPPORTED | Adapter-implemented logging |

---

## 10. Implementation Phases

| Phase | ID | Focus |
|-------|-----|-------|
| 1 | DPT-PROVIDER-004.B | Minimal CLI adapter control spike |
| 2 | DPT-PROVIDER-004.C | Dynamic permission materialization |
| 3 | DPT-PROVIDER-004.D | Session/restart/rehydration proof |
| 4 | DPT-PROVIDER-004.E | Evidence + event bridge |
| 5 | DPT-PROVIDER-004.F | MCP capability surface |
| 6 | DPT-PROVIDER-004.G | Provider-neutral cost/routing proof |

---

## 11. Independent Review

| Check | Verdict |
|-------|---------|
| SDK/API/MCP/CLI roles not conflated | PASS |
| MCP directionality explicit | PASS |
| OpenCode SDK does not imply OpenAI/Codex | PASS |
| Work/Codex not required | PASS |
| Provider/model routing independent | PASS |
| 003.C shell /tmp behavior preserved honestly | PASS |
| Permission materialization preserves least privilege | PASS |
| Subagents correctly classified | PASS |
| DPT retains authority/durable-state ownership | PASS |
| Unsupported capabilities marked UNKNOWN | PASS |
| Implementation NOT performed | PASS |
| Deliverables internally consistent | PASS |

**Overall Verdict: PASS** (rework verified)

---

## 12. Revision History

| Rev | Date | Author | Changes |
|-----|------|--------|---------|
| 1 | 2026-09-03 | opencode/mimo-v2.5-free | Architecture + capability report created |
| 2 | 2026-09-03 | opencode/mimo-v2.5-free | SDK reconciliation — corrected SDK_AVAILABLE NO→YES, CLI→SDK as primary control surface, updated architecture doc |

---

## 13. Final Response

```
TASK_ID:
DPT-PROVIDER-004.A

TITLE:
OpenCode Programmatic Integration & Provider Adapter Architecture

SDK_AVAILABLE:
YES

SERVER_API_AVAILABLE:
YES

MCP_AVAILABLE:
YES (consumer)

CLI_FALLBACK_AVAILABLE:
YES

PRIMARY_DPT_TO_OPENCODE_CONTROL:
SDK

PRIMARY_OPENCODE_TO_DPT_CAPABILITY_CHANNEL:
MCP (DPT-provided server)

WORK_CODEX_REQUIRED:
NO

OPENAI_PROVIDER_REQUIRED:
NO

PROVIDER_MODEL_ROUTING_INDEPENDENT:
YES

DYNAMIC_PERMISSION_MATERIALIZATION_DESIGNED:
YES

SHELL_TMP_SCOPE_BEHAVIOR:
UNRESOLVED (adapter strategy documented)

SUBAGENT_BOUNDARY_DEFINED:
YES

SESSION_REHYDRATION_DESIGNED:
YES

EVIDENCE_BRIDGE_DESIGNED:
YES

COST_USAGE_OBSERVABILITY_DESIGNED:
YES

IMPLEMENTATION_PERFORMED:
NO

INDEPENDENT_REVIEW:
PASS (rework verified)

REPORT_READ_BACK_VERIFIED:
YES

TASK_STATUS:
CLOSED

NEXT_TASK:
DPT-PROVIDER-004.B

HUMAN_GATE_REQUIRED:
NO
```

---

*DPT-PROVIDER-004A_ARCHITECTURE_CAPABILITY_REPORT.md — 2026-09-03*
