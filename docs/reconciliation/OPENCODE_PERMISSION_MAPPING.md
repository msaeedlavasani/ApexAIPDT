# DPT-MIG-001.D — OpenCode Permission Model Reconciliation

## 1. Purpose

Map Apex AI DPT's permission, authority, and access-control concepts to OpenCode's native permission mechanisms. Identify what OpenCode enforces directly, what is partially supported, and what must remain enforced by the future DPT OpenCode Adapter.

## 2. Source References

**OpenCode:**
- JSON Schema: `https://opencode.ai/config.json`
- Customize-OpenCode skill (permission section)
- Project config: `opencode.json` (provider-only, no permission overrides)
- Global config: `~/.config/opencode/opencode.jsonc` (empty schema reference)
- No `.opencode/` directory exists in workspace root

**ApexAIPDT:**
- `docs/APEX_AI_DPT_CONSTITUTION.md` (Articles 11, 21, 25, 29)
- `docs/APEX_AI_DPT_VISION.md` (§6 Autonomy model, §5 Human/AI boundary)
- `docs/APEX_AI_DPT_TERMINOLOGY.md` (Authority, Authority Policy, Policy Ceiling, Risk Envelope, Work Order, Resource Claim)

## 3. OpenCode Permission Model Summary

### 3.1 Permission Structure

OpenCode uses a flat or tool-keyed permission object at the `permission` level of `opencode.json`. Actions are `"allow"`, `"ask"`, or `"deny"`.

```json
{
  "permission": {
    "edit": "deny",
    "bash": { "git *": "allow", "rm *": "deny", "*": "ask" },
    "external_directory": { "~/secrets/**": "deny", "*": "allow" }
  }
}
```

### 3.2 Known Permission Keys (from schema)

| Key | Accepts Pattern Object | Description |
|-----|----------------------|-------------|
| `read` | YES | Read file tool |
| `edit` | YES | Edit/write file tool |
| `glob` | YES | Glob pattern matching |
| `grep` | YES | Content search |
| `list` | YES | Directory listing |
| `bash` | YES | Shell command execution |
| `task` | YES | Subagent delegation |
| `external_directory` | YES | Access outside workspace root |
| `lsp` | YES | Language server operations |
| `skill` | YES | Skill loading |
| `todowrite` | NO | Flat action only |
| `question` | NO | Flat action only |
| `webfetch` | NO | Flat action only |
| `websearch` | NO | Flat action only |
| `doom_loop` | NO | Flat action only |

### 3.3 Evaluation Semantics

- For tool keys accepting pattern objects: `{ pattern: action }` — insertion order matters; **LAST matching rule wins**.
- Top-level `permission: "allow"` = allow everything (string shorthand).
- Per-agent `permission:` in agent config overrides the top-level `permission:` for that agent.
- Plan mode agent lives on the `plan` agent's permission ruleset (`edit: deny *`).

### 3.4 Per-Agent Permissions

```json
{
  "agent": {
    "my-agent": {
      "mode": "subagent",
      "permission": { "edit": "deny", "bash": "ask" }
    }
  }
}
```

Or in `.opencode/agent/<name>.md` frontmatter:
```yaml
permission:
  edit: deny
  bash: ask
```

### 3.5 Subagent Depth Control

```json
{ "subagent_depth": 1 }
```

Defaults to 1. Controls maximum nesting depth of `task` tool invocations.

## 4. Permission Concept Mapping

### 4.1 Core Tool Permissions

| DPT Permission Concept | OpenCode Native Mechanism | Status | Notes |
|----------------------|--------------------------|--------|-------|
| **File Read** | `read: "allow"` / `read: "deny"` | FULL | Flat or pattern-based. Covers Read tool access. |
| **File Edit/Write** | `edit: "allow"` / `edit: "deny"` | FULL | Flat or pattern-based. Covers Edit and Write tools. |
| **File Glob** | `glob: "allow"` / `glob: "deny"` | FULL | Glob search permission. |
| **File Grep** | `grep: "allow"` / `grep: "deny"` | FULL | Content search permission. |
| **Directory List** | `list: "allow"` / `list: "deny"` | FULL | Directory listing permission. |
| **Shell Execution** | `bash: { pattern: action }` | FULL | Supports command-pattern matching: `{ "git *": "allow", "*": "ask" }`. Last matching rule wins. |
| **Subagent/Task** | `task: "allow"` / `task: "deny"` | FULL | Controls whether subagent delegation is permitted. |
| **External Directory** | `external_directory: { pattern: action }` | FULL | Filesystem path patterns: `{ "~/secrets/**": "deny", "*": "allow" }`. Controls access outside workspace root. |
| **LSP Operations** | `lsp: "allow"` / `lsp: "deny"` | FULL | Language server permission. |
| **Skill Loading** | `skill: "allow"` / `skill: "deny"` | FULL | Controls whether skills can be loaded. |
| **Todo Write** | `todowrite: action` | FULL | Flat action only (no pattern). |
| **Question Asking** | `question: action` | FULL | Flat action only. Controls whether agent can ask questions. |
| **Web Fetch** | `webfetch: action` | FULL | Flat action only. |
| **Web Search** | `websearch: action` | FULL | Flat action only. |
| **Doom Loop Detection** | `doom_loop: action` | FULL | Flat action only. |

### 4.2 Authority and Role Model

| DPT Authority Concept | OpenCode Native Mechanism | Status | Notes |
|----------------------|--------------------------|--------|-------|
| **Per-Agent Authority** | `agent.<name>.permission: {...}` | FULL | Each agent definition can have its own `permission` object overriding the top-level. |
| **Role-Based Access** | Agent `mode` field (`"primary"`, `"subagent"`, `"all"`) | PARTIAL | Mode controls when agent appears in @autocomplete and whether it can be used as subagent. Not a full RBAC system — no role hierarchy, no role-based permission inheritance. |
| **Authority Boundaries** | Per-agent `permission` overrides | PARTIAL | Each agent can have different permission sets. But no concept of "authority ceiling" or "authority inheritance narrowing" — permissions are absolute per agent, not hierarchical. |
| **Service/Authority Mode** | Not natively supported | UNSUPPORTED | DPT's 6 graduated modes (Observe, Advise, Assisted, Managed, Autonomous, Delegated) have no OpenCode equivalent. The closest is configuring per-agent `permission` objects with different allow/ask/deny levels, but there is no mode concept that governs a session holistically. |

### 4.3 Pattern and Scope Control

| DPT Scope Concept | OpenCode Native Mechanism | Status | Notes |
|------------------|--------------------------|--------|-------|
| **Wildcard Patterns (bash)** | `bash: { "git *": "allow", "rm *": "deny" }` | FULL | Shell-style glob patterns. Last matching rule wins. |
| **File Path Patterns (edit)** | `edit: { "src/**": "allow", "**/*.env": "deny" }` | FULL | Glob-style path patterns on any tool key that accepts a pattern object. |
| **Directory Patterns (external)** | `external_directory: { "~/secrets/**": "deny", "~/projects/**": "allow" }` | FULL | Filesystem path patterns with `~/` support. |
| **Last-Rule-Wins Evaluation** | `permission: { bash: { "*": "allow", "rm *": "deny" } }` | FULL | Insertion-order semantics: evaluate last matching rule. This is the native evaluation model. |
| **Per-Session Scope** | Not natively supported | UNSUPPORTED | OpenCode permissions are config-wide, not per-session or per-work-order scoped. Cannot dynamically narrow permissions for a specific task execution. |

### 4.4 Subagent and Delegation Control

| DPT Delegation Concept | OpenCode Native Mechanism | Status | Notes |
|----------------------|--------------------------|--------|-------|
| **Subagent Delegation** | `task` tool + `subagent_depth` | FULL | `task: "allow"/"deny"` controls delegation. `subagent_depth: N` limits nesting. |
| **Delegation Cannot Expand Authority** | Per-agent `permission` | PARTIAL | Each subagent inherits its own `permission` config. But there is no intersection/ceiling mechanism — a subagent's permissions are defined independently, not derived from the parent's permissions. |
| **Work Order Bounded Scope** | Not natively supported | UNSUPPORTED | No concept of a bounded, time-limited, scoped Work Order. The `task` tool accepts a prompt but there is no native mechanism to declare scope constraints, resource claims, or termination conditions. |
| **Attempt Identity & Lifecycle** | Not natively supported | UNSUPPORTED | No native attempt tracking, attempt identity, or attempt-level permission scoping. |

### 4.5 Policy and Governance

| DPT Policy Concept | OpenCode Native Mechanism | Status | Notes |
|-------------------|--------------------------|--------|-------|
| **Allow / Ask / Deny** | `"allow"`, `"ask"`, `"deny"` actions | FULL | OpenCode's native 3-state permission model aligns with DPT's allow/ask/deny semantics. `"ask"` presents a user prompt. |
| **Policy Ceiling** | Not natively supported | UNSUPPORTED | No mechanism to declare a maximum permission level that cannot be expanded by downstream grants. Each agent's permissions are absolute. |
| **Approval Gates** | `"ask"` action | PARTIAL | `bash: "ask"` triggers a user prompt before execution. This is the closest to an approval gate, but it is per-tool-invocation, not per-work-order or per-phase. |
| **Risk Envelope** | Not natively supported | UNSUPPORTED | No mechanism to declare risk bounds (impact, cost, reversibility, environment). Permissions are binary (allow/ask/deny), not risk-scored. |
| **Revocation** | Config edit + restart | PARTIAL | Permissions can be changed by editing config and restarting OpenCode. No runtime revocation without restart. |
| **Audit Trail** | Not natively supported | UNSUPPORTED | No native permission audit log. Tool calls are logged but permission decisions are not tracked as structured audit entries. |

### 4.6 Context and Information Boundaries

| DPT Context Concept | OpenCode Native Mechanism | Status | Notes |
|--------------------|--------------------------|--------|-------|
| **Minimum Sufficient Context** | Not natively enforced | UNSUPPORTED | OpenCode does not enforce context minimization. Agents can read any permitted file. Context control is advisory (via agent prompts/instructions), not enforced. |
| **External Directory Boundary** | `external_directory: { pattern: action }` | FULL | Filesystem boundary between workspace and external paths is enforced. |
| **Reference Directories** | `references` config + auto-allow | PARTIAL | References declared in `references` are auto-allowed through `external_directory`. But no mechanism to scope which tools can access referenced content. |

## 5. Current State Assessment

### 5.1 Observed Configuration

| Config File | Exists | Permission Config | Notes |
|-------------|--------|-------------------|-------|
| `opencode.json` (project) | YES | None | Only provider config present. No `permission` key. |
| `.opencode/` directory | NO | N/A | No project-level agents, skills, or commands defined. |
| `~/.config/opencode/opencode.jsonc` (global) | YES | None | Empty schema reference only. |

**Implication:** All tools run with default OpenCode permissions (likely `"ask"` for destructive operations, `"allow"` for read-only operations). No DPT-specific permission constraints are currently enforced.

### 5.2 DPT VAL-001 Evidence

The DPT-VAL-001 conformance report (`docs/validation/DPT-VAL-001_OPENCODE_CONFORMANCE_REPORT.md`) confirms:
- Subagent delegation (`task` tool): AVAILABLE, 5 concurrent sessions observed
- No permission violations or capability gaps observed
- Provider supports parallel execution without limitations

## 6. Capability Gap Summary

| Gap Category | DPT Concept | OpenCode Status | Adapter Requirement |
|-------------|-------------|-----------------|---------------------|
| **Authority Hierarchy** | Policy Ceiling, Authority Inheritance | UNSUPPORTED | Adapter must implement ceiling intersection logic — subagent permissions = ∩(parent, defined) |
| **Mode-Based Permissions** | 6 Service/Authority Modes | UNSUPPORTED | Adapter must translate DPT mode to per-agent permission sets |
| **Work Order Scoping** | Bounded, time-limited assignments | UNSUPPORTED | Adapter must inject scope constraints into agent prompts and validate post-execution |
| **Resource Claims** | Pre-declared bounded access | UNSUPPORTED | Adapter must declare and enforce resource claims via permission config + agent prompts |
| **Risk Envelope** | Risk-scored permission decisions | UNSUPPORTED | Adapter must map risk scores to allow/ask/deny thresholds |
| **Approval Gates** | Phase-gated approvals | UNSUPPORTED | Adapter must use `ask` action as gate mechanism + prompt-based gate enforcement |
| **Audit Trail** | Permission decision logging | UNSUPPORTED | Adapter must implement permission decision logging externally |
| **Context Minimization** | Minimum sufficient context | UNSUPPORTED | Adapter must control context via agent instructions and reference scoping |
| **Dynamic Scoping** | Per-session/per-task permissions | UNSUPPORTED | Adapter must generate per-task permission configs or use prompt-level enforcement |
| **Revocation** | Runtime kill-switch | UNSUPPORTED | Adapter must support config reload or implement runtime revocation via plugin hooks |

## 7. Recommendations for DPT OpenCode Adapter

### 7.1 What OpenCode Enforces Directly (Adapter Delegates)

1. **Tool-level permissions** — read, edit, bash, glob, grep, list, task, external_directory, lsp, skill, webfetch, websearch, todowrite, question, doom_loop. All have native allow/ask/deny support.
2. **Pattern-based bash control** — shell-style command patterns with last-rule-wins.
3. **Path-based edit/read control** — glob-style file patterns on any tool key.
4. **External directory boundary** — filesystem path patterns with `~/` support.
5. **Subagent depth limit** — `subagent_depth` config.
6. **Per-agent permission overrides** — `agent.<name>.permission` config.

### 7.2 What the Adapter Must Implement

1. **Authority Policy Engine** — Translate DPT Authority Policy (scoped, auditable, revocable) into OpenCode per-agent `permission` configs. Generate `opencode.json` or `.opencode/agent/*.md` files with correct permission objects.

2. **Policy Ceiling Enforcement** — Before granting a subagent its permissions, compute the intersection with parent/upstream permissions. Inject resulting permissions into agent config. Never allow a subagent to have permissions exceeding the ceiling.

3. **Mode-to-Permission Translation** — Map DPT Service/Authority Modes to OpenCode permission sets:
   - Observe: `read: "allow", edit: "deny", bash: "deny", task: "deny"`
   - Advise: `read: "allow", edit: "deny", bash: "ask", task: "deny"`
   - Assisted: `read: "allow", edit: "ask", bash: "ask", task: "allow"`
   - Managed: `read: "allow", edit: "allow", bash: "ask", task: "allow"`
   - Autonomous: `read: "allow", edit: "allow", bash: "allow", task: "allow"`
   - Delegated: same as Autonomous but with additional risk-envelope constraints

4. **Work Order Injection** — Since OpenCode has no Work Order entity, the adapter must encode Work Order scope, constraints, resource claims, and termination conditions into the agent's `prompt` or `instructions`. Validate outputs against Work Order bounds post-execution.

5. **Resource Claim Enforcement** — Declare resource claims as `external_directory` and `edit`/`read` patterns in agent permission configs. Use `bash: { "<claimed-path>/*": "allow", "*": "deny" }` patterns to scope filesystem access.

6. **Approval Gate Implementation** — Use `bash: "ask"` and `edit: "ask"` as gate mechanisms. The adapter's prompt injection must instruct the agent to pause at gate checkpoints and the `ask` action provides the runtime enforcement.

7. **Audit Trail** — Implement via OpenCode plugin hooks (`tool.execute.before`, `tool.execute.after`, `permission.ask`) to log all permission decisions and tool executions with structured metadata.

8. **Context Control** — Use `instructions` config and agent `prompt` fields to enforce context boundaries. Use `references` with `hidden: true` to control what surfaces in autocomplete. Validate that agents do not read outside their declared scope.

9. **Runtime Revocation** — Use OpenCode plugin hooks or config file manipulation + session restart. For immediate revocation, the adapter could use the `permission.ask` hook to inject deny rules dynamically (if the plugin API supports live config mutation).

### 7.3 Adapter Architecture Sketch

```
DPT Authority Policy
    ↓
[Adapter: Policy Translator]
    ↓
opencode.json (generated/managed)
├── permission: { read, edit, bash, task, external_directory, ... }
├── agent: { <role>: { permission: {...}, mode, prompt } }
├── subagent_depth: N
└── instructions: [DPT constraint files]
    ↓
[Adapter: Plugin (permission.ask hook)]
├── Audit logging
├── Dynamic revocation
└── Gate enforcement
    ↓
OpenCode Runtime
```

## 8. Mapping Summary

| Category | FULL | PARTIAL | UNSUPPORTED |
|----------|------|---------|-------------|
| Tool Permissions | 14 | 0 | 0 |
| Authority Model | 1 | 2 | 1 |
| Pattern/Scope Control | 3 | 0 | 1 |
| Subagent/Delegation | 2 | 1 | 2 |
| Policy/Governance | 1 | 2 | 4 |
| Context Boundaries | 1 | 1 | 2 |
| **Totals** | **22** | **6** | **10** |

**OpenCode covers ~61% of DPT permission concepts natively (FULL). The remaining 39% (PARTIAL + UNSUPPORTED) must be implemented by the DPT OpenCode Adapter.**

---

*DPT-MIG-001.D — OpenCode Permission Model Reconciliation — 2026-09-02*
