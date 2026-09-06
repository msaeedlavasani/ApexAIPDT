# DPT-PROVIDER-004.A — OpenCode Programmatic Capability Matrix

**Task ID:** DPT-PROVIDER-004.A
**Status:** Evidence-based capability assessment
**Scope:** Officially supported programmatic control surfaces for OpenCode 1.18.25
**Evidence sources:** CLI help, runtime observation, config schema, debug output

---

## 1. Integration Surface Inventory

| Surface | Available | Version | Evidence |
|---------|-----------|---------|----------|
| SDK (npm package) | **YES** | 1.18.25 | `@opencode-ai/sdk` on npm; confirmed via OFFICIAL_DOCUMENTATION + NPM_REGISTRY_METADATA; installed + tested in 004.B |
| Server API (headless) | **YES** | 1.18.25 | `opencode serve` — HTTP server with auth |
| ACP (Agent Client Protocol) | **YES** | 1.18.25 | `opencode acp` — standardized agent protocol |
| MCP (consumer) | **YES** | 1.18.25 | `opencode mcp add/list/auth/logout/debug` |
| CLI | **YES** | 1.18.25 | Full CLI with 15+ commands |
| Plugin system | **YES** | 1.18.25 | `opencode plugin <module>` — npm-based plugins |

---

## 2. CLI Command Matrix

| Command | Purpose | Non-interactive | Session Mgmt | Evidence Source |
|---------|---------|----------------|--------------|-----------------|
| `opencode run [message]` | Execute with message | YES | `--continue`, `--session`, `--fork` | INSTALLED_RUNTIME_OBSERVATION |
| `opencode serve` | Headless server | YES | N/A (server-managed) | INSTALLED_RUNTIME_OBSERVATION |
| `opencode acp` | ACP server | YES | N/A (protocol-managed) | INSTALLED_RUNTIME_OBSERVATION |
| `opencode session list` | List sessions | YES | READ | INSTALLED_RUNTIME_OBSERVATION |
| `opencode session delete` | Delete session | YES | DELETE | INSTALLED_RUNTIME_OBSERVATION |
| `opencode agent create` | Create agent | YES | N/A | INSTALLED_RUNTIME_OBSERVATION |
| `opencode agent list` | List agents | YES | N/A | INSTALLED_RUNTIME_OBSERVATION |
| `opencode export [sessionID]` | Export session JSON | YES | READ | INSTALLED_RUNTIME_OBSERVATION |
| `opencode stats` | Token usage/cost | YES | N/A | INSTALLED_RUNTIME_OBSERVATION |
| `opencode debug config` | Show resolved config | YES | N/A | INSTALLED_RUNTIME_OBSERVATION |
| `opencode debug info` | Debug information | YES | N/A | INSTALLED_RUNTIME_OBSERVATION |
| `opencode debug paths` | Show file paths | YES | N/A | INSTALLED_RUNTIME_OBSERVATION |
| `opencode providers` | Manage providers | YES | N/A | INSTALLED_RUNTIME_OBSERVATION |
| `opencode models [provider]` | List models | YES | N/A | INSTALLED_RUNTIME_OBSERVATION |
| `opencode upgrade` | Upgrade runtime | YES | N/A | INSTALLED_RUNTIME_OBSERVATION |
| `opencode plugin <module>` | Install plugin | YES | N/A | INSTALLED_RUNTIME_OBSERVATION |

---

## 3. CLI Run Flags

| Flag | Type | Purpose | Evidence |
|------|------|---------|----------|
| `--continue` / `-c` | boolean | Continue last session | INSTALLED_RUNTIME_OBSERVATION |
| `--session` / `-s` | string | Continue specific session | INSTALLED_RUNTIME_OBSERVATION |
| `--fork` | boolean | Fork session before continuing | INSTALLED_RUNTIME_OBSERVATION |
| `--model` / `-m` | string | Select model (provider/model) | INSTALLED_RUNTIME_OBSERVATION |
| `--agent` | string | Select agent | INSTALLED_RUNTIME_OBSERVATION |
| `--format` | default/json | Output format | INSTALLED_RUNTIME_OBSERVATION |
| `--file` / `-f` | array | Attach files to message | INSTALLED_RUNTIME_OBSERVATION |
| `--auto` | boolean | Auto-approve non-denied permissions | INSTALLED_RUNTIME_OBSERVATION |
| `--attach` | string | Attach to running server | INSTALLED_RUNTIME_OBSERVATION |
| `--dir` | string | Working directory | INSTALLED_RUNTIME_OBSERVATION |
| `--title` | string | Session title | INSTALLED_RUNTIME_OBSERVATION |
| `--interactive` / `-i` | boolean | Interactive split-footer mode | INSTALLED_RUNTIME_OBSERVATION |
| `--thinking` | boolean | Show thinking blocks | INSTALLED_RUNTIME_OBSERVATION |
| `--variant` | string | Model variant (reasoning effort) | INSTALLED_RUNTIME_OBSERVATION |

---

## 4. Server API Capabilities

### 4.1 `opencode serve`

| Capability | Supported | Evidence |
|-----------|-----------|----------|
| Headless execution | YES | `--port`, `--hostname` flags |
| Authentication | YES | `--username`, `--password`, env vars |
| CORS | YES | `--cors` flag |
| mDNS discovery | YES | `--mdns`, `--mdns-domain` flags |
| Session management | UNKNOWN | Server-managed; specifics unclear |
| Real-time events | UNKNOWN | No evidence of WebSocket/SSE |
| Config injection | UNKNOWN | How permissions are set per-session unclear |

### 4.2 `opencode acp`

| Capability | Supported | Evidence |
|-----------|-----------|----------|
| Agent Client Protocol | YES | Standardized agent-to-agent protocol |
| Working directory | YES | `--cwd` flag |
| Authentication | YES | Same as serve |
| Interoperability | YES | ACP is a standard protocol |

---

## 5. MCP Capabilities

### 5.1 Consumer (OpenCode as MCP Client)

| Capability | Supported | Evidence |
|-----------|-----------|----------|
| Add MCP server | YES | `opencode mcp add [name]` |
| List MCP servers | YES | `opencode mcp list` |
| OAuth authentication | YES | `opencode mcp auth [name]` |
| Remove credentials | YES | `opencode mcp logout [name]` |
| Debug connection | YES | `opencode mcp debug <name>` |

### 5.2 Provider (DPT as MCP Server)

| Capability | Supported | Evidence |
|-----------|-----------|----------|
| DPT can expose MCP tools | YES (design) | MCP is bidirectional; DPT provides server |
| OpenCode connects to DPT MCP | YES (design) | OpenCode has MCP consumer support |

---

## 6. Permission System

### 6.1 Permission Keys (from config schema)

| Key | Pattern Support | Description | Evidence |
|-----|----------------|-------------|----------|
| `read` | YES (path patterns) | Read file tool | CONFIG_SCHEMA |
| `edit` | YES (path patterns) | Edit/write file tool | CONFIG_SCHEMA |
| `glob` | YES (flat allow/deny) | Glob pattern matching | CONFIG_SCHEMA |
| `grep` | YES (flat allow/deny) | Content search | CONFIG_SCHEMA |
| `list` | YES (flat allow/deny) | Directory listing | CONFIG_SCHEMA |
| `bash` | YES (command patterns) | Shell command execution | CONFIG_SCHEMA |
| `task` | YES (flat allow/deny) | Subagent delegation | CONFIG_SCHEMA |
| `external_directory` | YES (path patterns) | Access outside workspace | CONFIG_SCHEMA |
| `lsp` | YES (flat allow/deny) | Language server ops | CONFIG_SCHEMA |
| `skill` | YES (flat allow/deny) | Skill loading | CONFIG_SCHEMA |
| `todowrite` | NO (flat only) | Todo write | CONFIG_SCHEMA |
| `question` | NO (flat only) | Question asking | CONFIG_SCHEMA |
| `webfetch` | NO (flat only) | Web fetch | CONFIG_SCHEMA |
| `websearch` | NO (flat only) | Web search | CONFIG_SCHEMA |
| `doom_loop` | NO (flat only) | Doom loop detection | CONFIG_SCHEMA |

### 6.2 Permission Evaluation

- Pattern objects: `{ pattern: action }` — **LAST matching rule wins**
- Flat strings: `"allow"`, `"ask"`, `"deny"`
- Per-agent overrides: `agent.<name>.permission`

### 6.3 Per-Agent Permissions

```json
{
  "agent": {
    "<name>": {
      "mode": "subagent",
      "permission": { "<key>": "<action-or-pattern>" }
    }
  }
}
```

### 6.4 Subagent Depth

```json
{ "subagent_depth": 1 }
```

Default: 1. Controls maximum nesting depth of `task` tool invocations.

---

## 7. Session Management

| Capability | Supported | Mechanism | Evidence |
|-----------|-----------|-----------|----------|
| Create session | YES | `opencode run [message]` | INSTALLED_RUNTIME_OBSERVATION |
| Resume session | YES | `opencode run -c` or `-s <id>` | INSTALLED_RUNTIME_OBSERVATION |
| Fork session | YES | `opencode run --fork -c`/`-s` | INSTALLED_RUNTIME_OBSERVATION |
| List sessions | YES | `opencode session list` | INSTALLED_RUNTIME_OBSERVATION |
| Delete session | YES | `opencode session delete <id>` | INSTALLED_RUNTIME_OBSERVATION |
| Export session | YES | `opencode export [sessionID]` | INSTALLED_RUNTIME_OBSERVATION |
| Session title | YES | `opencode run --title <title>` | INSTALLED_RUNTIME_OBSERVATION |
| Compaction control | NO | No CLI flag or config observed | UNKNOWN |
| Session timeout | NO | No CLI flag observed | UNKNOWN |

---

## 8. Agent Management

| Capability | Supported | Mechanism | Evidence |
|-----------|-----------|-----------|----------|
| Create agent | YES | `opencode agent create` | INSTALLED_RUNTIME_OBSERVATION |
| List agents | YES | `opencode agent list` | INSTALLED_RUNTIME_OBSERVATION |
| Per-agent permissions | YES | Config `agent.<name>.permission` | CONFIG_SCHEMA |
| Agent mode | YES | `agent.<name>.mode` (primary/subagent/all) | CONFIG_SCHEMA |
| Agent instructions | YES | `.opencode/agent/<name>.md` | CONFIG_SCHEMA |
| Agent prompting | YES | `--agent <name>` flag | INSTALLED_RUNTIME_OBSERVATION |

---

## 9. Plugin System

| Capability | Supported | Mechanism | Evidence |
|-----------|-----------|-----------|----------|
| Install plugin | YES | `opencode plugin <module>` | INSTALLED_RUNTIME_OBSERVATION |
| Global install | YES | `opencode plugin -g <module>` | INSTALLED_RUNTIME_OBSERVATION |
| Plugin hooks | YES | `tool.execute.before/after`, `permission.ask` | INSTALLED_RUNTIME_OBSERVATION |
| Pure mode | YES | `--pure` flag disables plugins | INSTALLED_RUNTIME_OBSERVATION |

---

## 10. Data Export & Observability

| Capability | Supported | Mechanism | Evidence |
|-----------|-----------|-----------|----------|
| Export session JSON | YES | `opencode export [sessionID]` | INSTALLED_RUNTIME_OBSERVATION |
| Sanitized export | YES | `opencode export --sanitize` | INSTALLED_RUNTIME_OBSERVATION |
| Token usage stats | YES | `opencode stats` | INSTALLED_RUNTIME_OBSERVATION |
| Cost statistics | YES | `opencode stats` (cost column) | INSTALLED_RUNTIME_OBSERVATION |
| Model statistics | YES | `opencode stats --models` | INSTALLED_RUNTIME_OBSERVATION |
| Project filtering | YES | `opencode stats --project` | INSTALLED_RUNTIME_OBSERVATION |
| Time filtering | YES | `opencode stats --days N` | INSTALLED_RUNTIME_OBSERVATION |
| Debug paths | YES | `opencode debug paths` | INSTALLED_RUNTIME_OBSERVATION |
| Debug config | YES | `opencode debug config` | INSTALLED_RUNTIME_OBSERVATION |
| Debug info | YES | `opencode debug info` | INSTALLED_RUNTIME_OBSERVATION |

---

## 11. Capability Gaps for DPT Integration

| Gap | DPT Need | OpenCode Status | Adapter Workaround |
|-----|----------|-----------------|-------------------|
| SDK available | Programmatic JS/TS control | SUPPORTED | `@opencode-ai/sdk` — createOpencode, session, prompt, events |
| No runtime permission injection | Dynamic permission changes | UNKNOWN | Config regeneration + restart |
| No session compaction control | Context management | UNSUPPORTED | Prompt injection + context monitoring |
| No structured event stream | Real-time tool/permission events | PARTIAL (plugin hooks) | Plugin system |
| No process leak detection | Resource cleanup | UNSUPPORTED | Adapter-managed process monitoring |
| No per-session permissions | Task-scoped permissions | UNSUPPORTED | Per-task config generation |
| No permission audit trail | DPT audit requirements | UNSUPPORTED | Adapter-implemented logging |
| External directory scope widening | Task-scoped /tmp access | OBSERVED (003.C) | Native tools only; shell investigation pending |

---

*OPENCODE_PROGRAMMATIC_CAPABILITY_MATRIX.md — DPT-PROVIDER-004.A — 2026-09-03*
