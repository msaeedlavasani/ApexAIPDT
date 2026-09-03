# DPT OpenCode Provider Adapter — Architecture

**Task ID:** DPT-PROVIDER-004.A
**Status:** Architecture direction
**Scope:** Canonical DPT OpenCode Provider Adapter design; integration surfaces; session lifecycle; evidence bridge; provider independence.
**Depends on:** `DPT-PROVIDER-003.C`, `DPT_EXECUTION_CONTROL_MODEL.md`, `PERMISSION_ENVELOPE.md`, `OPENCODE_PERMISSION_MAPPING.md`

---

## 1. Canonical Integration Diagram

```
DPT Execution Orchestrator
        ↓
   Task Passport
        ↓
    Work Order
        ↓
 Permission Envelope
        ↓
OpenCode Provider Adapter
        ↓
  OpenCode Runtime (v1.18.25)
        ↓
  Parent Agent / Subagents
        ↓
   Target Project
```

### Adapter Identity

The OpenCode Provider Adapter is a **DPT execution adapter**. It is:

- NOT the DPT Gateway
- NOT the project-side Front Agent
- NOT the DPT Orchestrator itself
- NOT a project-specific implementation

The adapter translates DPT execution directives into OpenCode-native operations and surfaces OpenCode runtime events back to DPT.

---

## 2. Integration Surfaces — Evidence-Based Assessment

### 2.1 SDK

| Field | Value |
|-------|-------|
| Available | **YES** |
| Evidence | `@opencode-ai/sdk` on npm; confirmed via OFFICIAL_DOCUMENTATION + NPM_REGISTRY_METADATA; installed + tested in 004.B |
| Package | `@opencode-ai/sdk@1.18.25` |
| APIs | `createOpencode`, `createOpencodeClient`, session/prompt/abort/events |

**Assessment:** SDK is the primary DPT → OpenCode control surface. Type-safe, lifecycle-managed, event-capable. CLI retained as fallback.

### 2.2 Server API (Headless + ACP)

| Field | Value |
|-------|-------|
| Available | **YES** |
| Evidence | `opencode serve` starts headless server; `opencode acp` starts ACP (Agent Client Protocol) server |
| Ports | Configurable via `--port` (default: random) |
| Auth | `--username` / `--password` or `OPENCODE_SERVER_PASSWORD` env |
| Attach | `opencode run --attach <url>` connects to running server |
| ACP | Agent Client Protocol — standardized agent-to-agent communication |
| Modes | Headless (`serve`) or ACP (`acp`) |

**Assessment:** The server API is the primary programmatic control surface. Both `serve` and `acp` expose HTTP endpoints. ACP is the standardized protocol for agent interoperability.

### 2.3 MCP (Model Context Protocol)

| Field | Value |
|-------|-------|
| Available | **YES** (consumer, not provider) |
| Evidence | `opencode mcp add/list/auth/logout/debug` commands exist |
| Direction | OpenCode consumes MCP servers; DPT could provide an MCP server |
| Config | MCP servers configured via `opencode mcp add` |

**Assessment:** OpenCode is an MCP **consumer** — it connects to external MCP servers. DPT can provide an MCP server that OpenCode connects to, enabling DPT → OpenCode capability exposure. MCP is NOT the primary DPT → OpenCode control channel.

### 2.4 CLI

| Field | Value |
|-------|-------|
| Available | **YES** |
| Evidence | Full CLI with `run`, `serve`, `acp`, `session`, `agent`, `export`, `stats`, `debug`, `plugin` |
| Non-interactive | `opencode run [message]` — single-shot execution |
| Session mgmt | `opencode session list/delete` |
| Agent mgmt | `opencode agent create/list` |
| Export | `opencode export [sessionID]` — JSON session data |
| Stats | `opencode stats` — token usage and cost |
| Plugins | `opencode plugin <module>` — install plugins |

**Assessment:** CLI is the fallback and simplest integration surface. Suitable for single-shot task execution, session management, and debugging.

---

## 3. Control Direction Matrix

### A. DPT → OpenCode Control

| Responsibility | Primary | Fallback | Rationale |
|---------------|---------|----------|-----------|
| Create session | CLI (`opencode run`) | Server API (`serve`/`acp`) | CLI is simplest; server for persistent sessions |
| Resume session | CLI (`opencode run -c`/`-s`) | Server API | CLI `--continue`/`--session` flags |
| Terminate session | Server API | CLI (process kill) | Server has session lifecycle; CLI is process-based |
| Send task/work order | CLI (`opencode run [message]`) | Server API (attach + send) | CLI message is the Work Order carrier |
| Select agent | CLI (`--agent`) | Config (`agent` in opencode.json) | CLI flag overrides config |
| Select model/provider | CLI (`--model`) | Config (`provider` in opencode.json) | CLI flag overrides config |
| Set permissions | Config file (`opencode.json`) | Plugin hook | Config is the native permission surface |
| Access task-scoped paths | Config (`external_directory`, `read`, `edit`) | CLI `--dir` | Config patterns; CLI sets working directory |
| Spawn subagents | Task tool (runtime) | Agent config | OpenCode internal subagent mechanism |
| Health check | CLI (`opencode debug info`) | Server API | CLI provides version/status |

### B. OpenCode → DPT Capabilities

| Responsibility | Channel | Rationale |
|---------------|---------|-----------|
| DPT MCP tools | MCP server (DPT-provided) | DPT exposes tools via MCP that OpenCode can call |
| Task Passport access | MCP tool `dpt_get_task_passport` | DPT-owned data |
| Work Order access | MCP tool `dpt_get_work_order` | DPT-owned data |
| Permission Envelope access | MCP tool `dpt_get_permission_envelope` | DPT-owned data |
| Report evidence | MCP tool `dpt_report_evidence` | DPT-owned intake |
| Request review | MCP tool `dpt_request_review` | DPT-owned workflow |

### C. OpenCode → DPT Evidence/Events

| Responsibility | Channel | Rationale |
|---------------|---------|-----------|
| Session created | CLI export / server event | Session lifecycle observable |
| Tool called | Plugin hook (`tool.execute.before/after`) | OpenCode plugin API |
| Permission evaluated | Plugin hook (`permission.ask`) | OpenCode plugin API |
| Agent output | CLI export (`opencode export`) | Session data contains messages |
| Structured result | CLI export (JSON format) | `opencode run --format json` |
| Token usage | CLI stats (`opencode stats`) | Usage metrics available |
| Failure/error | Plugin hook + stderr | Error events observable |

---

## 4. MCP Directionality

### Primary Direction: OpenCode → DPT MCP Server

```
OpenCode Runtime
   ↓ (MCP client)
DPT MCP Server
   ↓ (DPT capabilities)
DPT Execution Orchestrator
```

MCP is the correct channel for **DPT capability exposure** to OpenCode. DPT provides an MCP server that OpenCode connects to as a client.

### DPT MCP Server Candidate Tools

| Tool | Direction | Purpose |
|------|-----------|---------|
| `dpt_get_task_passport` | OpenCode → DPT | Retrieve current task identity and scope |
| `dpt_get_work_order` | OpenCode → DPT | Retrieve authorized work order |
| `dpt_get_permission_envelope` | OpenCode → DPT | Retrieve effective permissions |
| `dpt_report_evidence` | OpenCode → DPT | Submit execution evidence |
| `dpt_report_failure` | OpenCode → DPT | Submit failure classification |
| `dpt_request_review` | OpenCode → DPT | Request independent review |
| `dpt_classify_failure` | OpenCode → DPT | Request failure classification |
| `dpt_get_next_action` | OpenCode → DPT | Request next deterministic action |

### Why MCP Is NOT the Primary DPT → OpenCode Control Channel

1. MCP is request-response, not command-control
2. OpenCode's MCP consumer model means DPT cannot force actions via MCP
3. CLI and Server API provide direct execution control
4. MCP is better suited for capability exposure and evidence collection

---

## 5. Responsibility Matrix

### 5.1 Session Lifecycle

| Responsibility | Primary | Fallback | Evidence Source |
|---------------|---------|----------|-----------------|
| create session | CLI `opencode run` | Server API | INSTALLED_RUNTIME_OBSERVATION |
| resume session | CLI `opencode run -c`/`-s` | Server API | INSTALLED_RUNTIME_OBSERVATION |
| terminate session | Server API (process mgmt) | CLI process kill | INSTALLED_RUNTIME_OBSERVATION |
| send task | CLI message arg | Server attach + send | INSTALLED_RUNTIME_OBSERVATION |
| select agent | CLI `--agent` flag | Config `agent` | INSTALLED_RUNTIME_OBSERVATION |
| select model | CLI `--model` flag | Config `provider` | INSTALLED_RUNTIME_OBSERVATION |
| set permissions | Config `opencode.json` | Plugin hook | CONFIG_SCHEMA |
| access paths | Config patterns | CLI `--dir` | CONFIG_SCHEMA |
| spawn subagents | Task tool (runtime) | Agent config | INSTALLED_RUNTIME_OBSERVATION |
| restart | New CLI invocation | Server restart | INSTALLED_RUNTIME_OBSERVATION |
| compaction | N/A (no native support) | Adapter-managed | UNKNOWN |
| timeout | Process-level | Adapter-managed | INSTALLED_RUNTIME_OBSERVATION |
| process cleanup | OS process mgmt | Adapter-managed | INSTALLED_RUNTIME_OBSERVATION |
| capture tool events | Plugin hook | CLI export | INSTALLED_RUNTIME_OBSERVATION |
| capture permission events | Plugin hook (`permission.ask`) | Config observation | INSTALLED_RUNTIME_OBSERVATION |
| capture agent output | CLI export `--format json` | Server API | INSTALLED_RUNTIME_OBSERVATION |
| capture structured result | CLI export JSON | Server API | INSTALLED_RUNTIME_OBSERVATION |
| retrieve logs | `~/.local/share/opencode/log` | CLI export | INSTALLED_RUNTIME_OBSERVATION |
| health check | CLI `opencode debug info` | Server API | INSTALLED_RUNTIME_OBSERVATION |
| capability discovery | CLI `opencode debug config` | Schema inspection | INSTALLED_RUNTIME_OBSERVATION |
| failure classification | Adapter (DPT-owned) | Plugin hooks | DPT-DERIVED |
| usage metrics | CLI `opencode stats` | Export data | INSTALLED_RUNTIME_OBSERVATION |

### 5.2 Unsupported / Unknown Capabilities

| Capability | Status | Evidence |
|-----------|--------|----------|
| Standalone SDK | UNSUPPORTED | No npm package found |
| Runtime permission injection | UNKNOWN | Plugin API exists; live config mutation unclear |
| Session compaction control | UNKNOWN | No CLI flag or config observed |
| Dynamic permission reload | UNKNOWN | Config cache has infinite TTL per 003.C |
| Structured event stream | UNKNOWN | `--format json` exists; real-time streaming unclear |
| Process leak detection | UNKNOWN | No native mechanism observed |

---

## 6. Dynamic Permission Materialization

### 6.1 Permission Flow

```
DPT Policy (Authority Policy + Risk Envelope)
   ↓
Task Passport
   ↓
Work Order
   ↓
Permission Envelope (provider-neutral)
   ↓
OpenCode Provider Adapter
   ↓
Effective OpenCode Permission Configuration
   ↓
Parent Agent / Subagents
```

### 6.2 Materialization Strategy

The adapter materializes permissions by **generating and managing `opencode.json`** (or per-agent config files under `.opencode/agent/`).

**Key constraint:** OpenCode config has infinite TTL cache. Permission changes require session restart. The adapter must:

1. Generate the complete permission config before session start
2. Use per-agent permission overrides for role scoping
3. Inject task constraints via agent prompts/instructions
4. Document that runtime permission changes require restart

### 6.3 Permission Mapping Rules

| DPT Permission | OpenCode Mapping | Notes |
|---------------|------------------|-------|
| `FILESYSTEM.read` | `read: { path: "allow" }` | Path-scoped |
| `FILESYSTEM.write` | `edit: { path: "allow" }` | Path-scoped |
| `FILESYSTEM.create` | `edit: { path: "allow" }` | Native Write auto-creates |
| `FILESYSTEM.delete` | `bash: { "rm <path>": "allow" }` | Command-scoped bash |
| `FILESYSTEM.external_dir` | `external_directory: { path: "allow" }` | Path-scoped |
| `EXECUTION.run_command` | `bash: { cmd: "allow" }` | Command-pattern-scoped |
| `EXECUTION.run_tests` | `bash: { "npm test*": "allow" }` | Command-scoped |
| `AGENTS.spawn_subagent` | `task: "allow"` + `subagent_depth: N` | Depth-limited |
| `GIT.status/diff/log/show` | `bash: { "git <cmd>*": "allow" }` | Command-scoped |
| `GIT.commit` | `bash: { "git commit*": "ask" }` | Human Gate |
| `GIT.push` | `bash: { "git push*": "ask" }` | Human Gate |
| `GIT.force_push` | `bash: { "git push --force*": "deny" }` | Always Deny |
| `NETWORK.provider_api` | Implicit (provider config) | Provider handles |
| `SECRETS.*` | Not natively supported | Adapter must enforce via prompt |

### 6.4 Task-Scoped Permission Generation

```json
{
  "permission": {
    "external_directory": {
      "/tmp/dpt-<task-id>/**": "allow"
    },
    "read": {
      "<project-root>/**": "allow",
      "/tmp/dpt-<task-id>/**": "allow"
    },
    "edit": {
      "<project-root>/**": "allow",
      "/tmp/dpt-<task-id>/**": "allow"
    },
    "bash": {
      "<task-specific-allow-rules>": "allow",
      "*": "ask",
      "<deny-rules>": "deny"
    }
  }
}
```

### 6.5 Role-Scoped Permission Generation

Per-agent permissions via `.opencode/agent/<role>.md` or `agent.<role>.permission` in config:

```json
{
  "agent": {
    "dpt-worker": {
      "mode": "subagent",
      "permission": {
        "read": { "<scope>": "allow" },
        "edit": { "<scope>": "allow" },
        "bash": { "<scope-patterns>": "allow", "*": "ask" },
        "task": "deny"
      }
    }
  }
}
```

### 6.6 003.C Unresolved Shell /tmp Behavior

**Observed:** Shell-mediated `mkdir` targeting `/tmp/dpt-*/` produced an external-directory request for `/tmp/*` scope.

**Root cause:** UNRESOLVED — provider-level scope normalization behavior.

**Adapter design response:**

1. **Do NOT rely on shell for directory creation** in task-scoped external workspaces
2. **Use native Write tool** which correctly respects `external_directory` patterns
3. **For required shell operations** (mkdir, rm, ls, stat, test, find):
   - Pre-create directories via native Write before session start
   - Or accept the permission prompt as a Human Gate
   - Or investigate the provider adapter's permission injection mechanism
4. **Investigation path for 004.B+:**
   - Test whether the adapter can pre-authorize specific shell commands via config
   - Test whether MCP tool calls can pre-authorize external directory access
   - Test whether plugin hooks can intercept and override permission decisions

---

## 7. Session + Runtime Lifecycle

### 7.1 Primary Lifecycle

```
CREATE
  → INITIALIZE (resolve config, permissions, agent)
  → MATERIALIZE PERMISSIONS (generate opencode.json)
  → EXECUTE (send Work Order via CLI or server)
  → OBSERVE (plugin hooks, export, stats)
  → REVIEW (independent verification)
  → COMPLETE (result validated, session closed)
```

### 7.2 Failure Lifecycles

| Event | Adapter Response |
|-------|-----------------|
| **RESTART** | Generate new session with same permissions; rehydrate Work Order from DPT state |
| **COMPACTION** | Not natively supported; adapter must detect context limits and re-inject critical state via prompts |
| **TIMEOUT** | Process-level kill; adapter captures final state via export; DPT classifies failure |
| **CRASH** | Process exit detection; adapter captures exit code + stderr; DPT classifies failure |
| **PROVIDER FAILURE** | Adapter detects via plugin hooks or stderr; DPT reroutes to alternative provider |
| **SUBAGENT FAILURE** | Task tool failure detection; adapter reports to DPT; DPT retries or escalates |
| **SESSION LOSS** | Adapter detects via export failure; creates new session; rehydrates from DPT state |
| **PROCESS LEAK** | Adapter monitors process list; kills orphaned processes; reports to DPT |
| **INTERRUPTED TASK** | Adapter captures partial state; DPT decides retry vs. cancel |

### 7.3 Rehydration Requirements

After restart/session loss, the adapter must rehydrate:

| State | Source | Mechanism |
|-------|--------|-----------|
| Work Order | DPT Execution Orchestrator | MCP tool or CLI message |
| Permission Envelope | DPT Permission System | Config regeneration |
| Task Passport revision | DPT Task State | MCP tool |
| Governance revision | DPT Policy Store | Config regeneration |
| Model/provider route | DPT Routing Policy | CLI `--model` flag |
| Resource claims | DPT Resource Model | Config + prompt injection |
| Context receipt | DPT Context Store | Agent prompt injection |
| Attempt number | DPT Attempt State | CLI message metadata |
| Durable state | DPT Task State | MCP tool or prompt injection |

---

## 8. Subagent Model

### 8.1 Boundary

```
DPT Execution Orchestrator
   ↓
Work Order
   ↓
OpenCode Adapter
   ↓
OpenCode Runtime
   ↓
OpenCode Internal Subagents (task tool)
```

OpenCode internal subagents are **provider-runtime capabilities**. They are NOT DPT Orchestrator agents.

### 8.2 DPT Retains Ownership Of

- Task authority and scope
- Durable state (Task Passport, Work Order, Permission Envelope)
- Lifecycle management (create, retry, cancel, complete)
- Evidence requirements
- Retry policy and rerouting
- Resource claims and compatibility
- Human Gates and approval workflows
- Completion semantics

### 8.3 OpenCode Subagent Capabilities

- Spawned via `task` tool
- Depth limited by `subagent_depth` config
- Each subagent can have its own `permission` overrides
- Subagent inherits working directory from parent
- Subagent can access parent-permitted tools

### 8.4 Adapter Responsibilities for Subagents

1. Generate per-subagent permission configs (intersected with parent ceiling)
2. Inject Work Order constraints into subagent prompts
3. Monitor subagent execution via export/plugin hooks
4. Report subagent results to DPT
5. Enforce subagent depth limits
6. Prevent subagent permission expansion beyond ceiling

---

## 9. Provider / Model Independence

### 9.1 Routing Architecture

```
DPT Routing Policy
   ↓
OpenCode Provider Adapter
   ↓
OpenCode Runtime
   ↓
Provider Router (OpenCode native)
   ├─ MiMo / free route
   ├─ Nara models (kimi, deepseek, glm)
   ├─ Other configured providers
   └─ OpenAI/Codex only if explicitly selected
```

### 9.2 Routing Tiers

| Tier | Strategy | Example |
|------|----------|---------|
| **LIGHT** | Free/cheap eligible route first | MiMo free, GLM flash |
| **STANDARD** | Best cost/performance eligible | DeepSeek, Kimi |
| **DEEP** | Stronger eligible model | GPT-5.6 Luna |
| **CRITICAL** | Strongest eligible + verification | Premium model + independent review |

### 9.3 Adapter Constraints

- MUST NOT hardcode provider names into core orchestration logic
- MUST support provider/model selection via CLI `--model` flag or config
- MUST support provider rerouting on failure
- MUST NOT create required dependency on any specific provider
- OpenAI/Codex MAY be an optional route; they MUST NOT be an architectural dependency

---

## 10. Cost / Usage Observability

### 10.1 Data Sources

| Source | Data Available | Mechanism |
|--------|---------------|-----------|
| `opencode stats` | Token usage, cost, model stats | CLI command |
| `opencode export` | Full session data including messages | CLI command |
| Provider API | Provider-reported usage | Provider-specific |
| Plugin hooks | Per-request metrics | `tool.execute.after` |

### 10.2 Provider-Neutral Usage Report

```json
{
  "provider": "nara",
  "model": "deepseek-v4-flash",
  "task_id": "DPT-TASK-001",
  "work_order_id": "DPT-WO-001",
  "attempt": 1,
  "input_tokens": 15000,
  "output_tokens": 3500,
  "cached_tokens": 2000,
  "request_count": 12,
  "duration_ms": 45000,
  "provider_reported_cost": null,
  "estimated_cost": 0.0,
  "free_tier_usage": true,
  "failure_retry_overhead": 0
}
```

### 10.3 Implementation Note

No billing integration required in 004.A. This is observability/design only.

---

## 11. Failure Model

### 11.1 Provider/Runtime Failures → DPT Failure Semantics

| Provider Event | DPT FailureClass | DPT Disposition | Notes |
|---------------|-----------------|-----------------|-------|
| provider unavailable | `PROVIDER_UNAVAILABLE` | `REROUTE` | Try alternative provider |
| transport failure | `TRANSPORT_ERROR` | `REWORK_REQUIRED` | Retry with backoff |
| timeout | `TIMEOUT` | `REWORK_REQUIRED` | Retry with extended timeout |
| rate limit | `RATE_LIMIT` | `REWORK_REQUIRED` | Retry after delay |
| auth failure | `AUTH_ERROR` | `ESCALATE_REPLAN_OR_REROUTE` | Never retry; escalate |
| entitlement/quota | `ENTITLEMENT_ERROR` | `REROUTE` | Try alternative route |
| policy denial | `POLICY_DENIED` | `ESCALATE_REPLAN_OR_REROUTE` | Bypass forbidden |
| permission prompt | N/A (provider prompt) | Human Gate if DPT-gated | Not a DPT failure |
| permission denial | `POLICY_DENIED` | `ESCALATE_REPLAN_OR_REROUTE` | DPT denies; provider blocks |
| external_directory mismatch | `POLICY_DENIED` | `REWORK_REQUIRED` | Adapter must fix config |
| invalid result | `INVALID_REPORT` | `REWORK_REQUIRED` | Re-execute |
| malformed output | `INVALID_REPORT` | `REWORK_REQUIRED` | Re-execute |
| agent crash | `WORKER_EXIT_FAILURE` | `REWORK_REQUIRED` | Restart session |
| subagent crash | `WORKER_EXIT_FAILURE` | `REWORK_REQUIRED` | Restart subagent |
| session loss | `UNKNOWN` | `REWORK_REQUIRED` | Rehydrate and retry |
| process leak | `UNKNOWN` | `REWORK_REQUIRED` | Kill orphan, restart |
| unsupported capability | `UNKNOWN` | `ESCALATE_REPLAN_OR_REROUTE` | Document gap |
| unknown failure | `UNKNOWN` | `ESCALATE_REPLAN_OR_REROUTE` | Classify and escalate |

### 11.2 Critical Separation

```
WHAT HAPPENED (FailureClass) ≠ WHAT DPT SHOULD DO (Disposition)
```

- `REWORK_EXHAUSTED` ≠ `BLOCKED`
- `ROUTE_EXHAUSTED` ≠ `BLOCKED`
- `GLOBAL_ATTEMPT_BUDGET_EXHAUSTED` ≠ `BLOCKED`

These are progression states, not permanent blocks.

---

## 12. Evidence Bridge

### 12.1 Evidence Flow

```
OpenCode Runtime
   ↓ (plugin hooks, export, stats)
Provider Adapter
   ↓ (normalize, classify)
DPT Event / Evidence Model
   ↓ (persist)
Durable Task State
```

### 12.2 Evidence Types

| Evidence Type | Source | Classification |
|--------------|--------|---------------|
| `session_created` | CLI/server | SUPPORTED_BY_PROVIDER |
| `work_order_dispatched` | Adapter | DPT-DERIVED |
| `agent_started` | CLI export | SUPPORTED_BY_PROVIDER |
| `subagent_started` | Task tool | SUPPORTED_BY_PROVIDER |
| `tool_called` | Plugin hook | SUPPORTED_BY_PROVIDER |
| `permission_evaluated` | Plugin hook | SUPPORTED_BY_PROVIDER |
| `permission_prompted` | Plugin hook (`permission.ask`) | SUPPORTED_BY_PROVIDER |
| `permission_denied` | Plugin hook | SUPPORTED_BY_PROVIDER |
| `provider_request_started` | Plugin hook | SUPPORTED_BY_PROVIDER |
| `provider_request_failed` | Plugin hook / stderr | SUPPORTED_BY_PROVIDER |
| `task_output_received` | CLI export | SUPPORTED_BY_PROVIDER |
| `structured_result_validated` | Adapter | DPT-DERIVED |
| `reviewer_started` | Adapter | DPT-DERIVED |
| `reviewer_completed` | Adapter | DPT-DERIVED |
| `retry_triggered` | Adapter | DPT-DERIVED |
| `reroute_triggered` | Adapter | DPT-DERIVED |
| `session_rehydrated` | Adapter | DPT-DERIVED |
| `task_completed` | Adapter | DPT-DERIVED |

---

## 13. Capability Descriptor

```json
{
  "runtime": "opencode",
  "version": "1.18.25",
  "supports_session_create": true,
  "supports_session_resume": true,
  "supports_session_cancel": true,
  "supports_structured_result": true,
  "supports_subagents": true,
  "supports_permission_injection": "config-only",
  "supports_runtime_permission_events": true,
  "supports_model_selection": true,
  "supports_provider_selection": true,
  "supports_usage_metrics": true,
  "supports_tool_event_stream": "plugin-hooks-only",
  "supports_mcp": true,
  "supports_server_api": true,
  "supports_sdk": true,
  "supports_cli_fallback": true,
  "supports_headless_server": true,
  "supports_acp": true,
  "supports_export": true,
  "supports_agent_config": true,
  "supports_per_agent_permissions": true,
  "supports_subagent_depth_limit": true,
  "supports_external_directory_scoping": true,
  "supports_bash_command_patterns": true,
  "supports_plugin_system": true,
  "evidence_source": "INSTALLED_RUNTIME_OBSERVATION"
}
```

---

## 14. Implementation Phases

### DPT-PROVIDER-004.B — Minimal OpenCode Adapter Control Spike

- CLI-based session create/resume/terminate
- Work Order injection via CLI message
- Basic permission config generation
- Session export for evidence capture

### DPT-PROVIDER-004.C — Dynamic Permission Materialization Prototype

- Task-scoped permission config generation
- Role-scoped per-agent permission injection
- Permission envelope → OpenCode config mapping
- Shell /tmp behavior investigation

### DPT-PROVIDER-004.D — Session / Restart / Rehydration Proof

- Session loss detection and recovery
- State rehydration from DPT
- Compaction handling (context limit detection)
- Process leak detection

### DPT-PROVIDER-004.E — Evidence + Event Bridge

- Plugin hook implementation for tool/permission events
- CLI export normalization to DPT evidence model
- Usage metrics collection and reporting
- Failure classification integration

### DPT-PROVIDER-004.F — DPT MCP Capability Server (CLOSED)

- MCP JSON-RPC 2.0 server implemented from scratch (zero dependencies)
- 8 bounded DPT capabilities exposed
- Authority enforcement: MCP cannot grant authority
- Identity correlation: task_id, work_order_id, attempt_id, actor, role
- Integration with 004.E Event/Evidence Bridge
- Restart/rehydration proof
- 94/94 tests pass

### DPT-PROVIDER-004.G — SDK + MCP End-to-End Integration

- Combined SDK control + MCP capability plane
- OpenCode session drives work via SDK, reports via MCP
- Full round-trip proof: DPT → SDK → OpenCode → MCP → DPT
- Provider-neutral cost/usage routing proof

---

*OPENCODE_PROVIDER_ADAPTER_ARCHITECTURE.md — DPT-PROVIDER-004.A — 2026-09-03*
