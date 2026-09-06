# DPT-PROVIDER-004.A — Dynamic Permission Materialization

**Task ID:** DPT-PROVIDER-004.A
**Status:** Architecture design
**Scope:** How DPT Authority Policy is translated into effective OpenCode permission configurations
**Depends on:** `PERMISSION_ENVELOPE.md`, `AUTHORITY_PERMISSION_MODEL.md`, `OPENCODE_PERMISSION_MAPPING.md`

---

## 1. Permission Materialization Flow

```
DPT Authority Policy + Risk Envelope
   ↓
Permission Envelope (provider-neutral)
   ↓
OpenCode Provider Adapter
   ↓
Effective OpenCode Permission Configuration
   ↓
Parent Agent / Subagents
```

### Design Constraints

1. **Task-scoped:** Permissions are bounded to the current Work Order
2. **Role-scoped:** Each agent/subagent has its own permission set
3. **Path-scoped:** Filesystem access is bounded to specific paths
4. **Command-scoped:** Shell access is bounded to specific command patterns
5. **Time/work-order scoped:** Permissions expire with the Work Order
6. **Revocable:** Permissions can be narrowed by DPT at any time
7. **Auditable:** Every permission decision is recorded
8. **Rehydratable:** Permissions survive restart/session recreation
9. **Least-privilege:** Only what is needed for the Task

---

## 2. Permission Envelope → OpenCode Config Mapping

### 2.1 FILESYSTEM Domain

| Envelope Operation | Envelope Decision | OpenCode Mapping | Config Key |
|-------------------|-------------------|------------------|------------|
| `read` + AUTO_ALLOW | Auto-allow | `read: { <path>: "allow" }` | `permission.read` |
| `write` + AUTO_ALLOW | Auto-allow | `edit: { <path>: "allow" }` | `permission.edit` |
| `create` + AUTO_ALLOW | Auto-allow | `edit: { <path>: "allow" }` | `permission.edit` (native Write creates) |
| `delete` + HUMAN_GATE | Gate | `bash: { "rm <path>": "ask" }` | `permission.bash` |
| `external_dir_access` + HUMAN_GATE | Gate | `external_directory: { <path>: "ask" }` | `permission.external_directory` |

### 2.2 EXECUTION Domain

| Envelope Operation | Envelope Decision | OpenCode Mapping | Config Key |
|-------------------|-------------------|------------------|------------|
| `run_command` + AUTO_ALLOW | Auto-allow | `bash: { <pattern>: "allow" }` | `permission.bash` |
| `run_command` + HUMAN_GATE | Gate | `bash: { <pattern>: "ask" }` | `permission.bash` |
| `run_tests` + AUTO_ALLOW | Auto-allow | `bash: { "<test-cmd>": "allow" }` | `permission.bash` |
| `spawn_subprocess` + HUMAN_GATE | Gate | `bash: { <pattern>: "ask" }` | `permission.bash` |

### 2.3 AGENTS Domain

| Envelope Operation | Envelope Decision | OpenCode Mapping | Config Key |
|-------------------|-------------------|------------------|------------|
| `spawn_subagent` + HUMAN_GATE | Gate | `task: "ask"` + `subagent_depth: N` | `permission.task` |
| `spawn_subagent` + AUTO_ALLOW | Auto-allow | `task: "allow"` + `subagent_depth: N` | `permission.task` |
| `parallel_execution` + AUTO_ALLOW | Auto-allow | `task: "allow"` | `permission.task` |

### 2.4 GIT Domain

| Envelope Operation | Envelope Decision | OpenCode Mapping | Config Key |
|-------------------|-------------------|------------------|------------|
| `status` + AUTO_ALLOW | Auto-allow | `bash: { "git status*": "allow" }` | `permission.bash` |
| `diff` + AUTO_ALLOW | Auto-allow | `bash: { "git diff*": "allow" }` | `permission.bash` |
| `log` + AUTO_ALLOW | Auto-allow | `bash: { "git log*": "allow" }` | `permission.bash` |
| `show` + AUTO_ALLOW | Auto-allow | `bash: { "git show*": "allow" }` | `permission.bash` |
| `commit` + HUMAN_GATE | Gate | `bash: { "git commit*": "ask" }` | `permission.bash` |
| `push` + HUMAN_GATE | Gate | `bash: { "git push*": "ask" }` | `permission.bash` |
| `force_push` + DENY | Deny | `bash: { "git push --force*": "deny" }` | `permission.bash` |
| `reset --hard` + DENY | Deny | `bash: { "git reset --hard*": "deny" }` | `permission.bash` |

### 2.5 NETWORK Domain

| Envelope Operation | Envelope Decision | OpenCode Mapping | Config Key |
|-------------------|-------------------|------------------|------------|
| `provider_api` + AUTO_ALLOW | Auto-allow | Implicit (provider config) | N/A |

### 2.6 DESTRUCTIVE Domain Overlay

| Envelope Operation | Envelope Decision | OpenCode Mapping | Config Key |
|-------------------|-------------------|------------------|------------|
| `filesystem` + DENY | Deny | `bash: { "rm -rf*": "deny" }` | `permission.bash` |
| `git_history` + DENY | Deny | `bash: { "git push --force*": "deny" }` | `permission.bash` |

---

## 3. Rule-Order Construction Algorithm

### 3.1 OpenCode Rule-Order Semantics

OpenCode uses **last matching rule wins** for pattern-based permission keys. This means:

1. Catch-all rules (`"*"`) must come FIRST
2. Specific ALLOW rules come AFTER catch-all
3. DENY rules come LAST (highest priority)

### 3.2 Construction Algorithm

```python
def construct_bash_rules(envelope):
    rules = []
    
    # Step 1: Catch-all (must be first)
    rules.append(("*", "ask"))
    
    # Step 2: AUTO_ALLOW rules (from envelope)
    for permission in envelope.permissions:
        if permission.domain == "EXECUTION" and permission.decision == "AUTO_ALLOW":
            rules.append((permission.resource_pattern, "allow"))
        if permission.domain == "GIT" and permission.decision == "AUTO_ALLOW":
            rules.append((permission.resource_pattern, "allow"))
    
    # Step 3: HUMAN_GATE rules (from envelope)
    for permission in envelope.permissions:
        if permission.decision == "HUMAN_GATE":
            rules.append((permission.resource_pattern, "ask"))
    
    # Step 4: DENY rules (from envelope + DPT governance)
    for permission in envelope.permissions:
        if permission.decision == "DENY":
            rules.append((permission.resource_pattern, "deny"))
    
    # Step 5: Always-DENY governance rules (DPT invariant)
    rules.append(("git push --force*", "deny"))
    rules.append(("git reset --hard*", "deny"))
    rules.append(("rm -rf*", "deny"))
    
    return rules
```

### 3.3 Filesystem Rule Construction

```python
def construct_filesystem_rules(envelope):
    read_rules = {}
    edit_rules = {}
    external_rules = {}
    
    for permission in envelope.permissions:
        if permission.domain == "FILESYSTEM":
            if permission.operation == "read" and permission.decision == "AUTO_ALLOW":
                read_rules[permission.resource_pattern] = "allow"
            if permission.operation in ("write", "create") and permission.decision == "AUTO_ALLOW":
                edit_rules[permission.resource_pattern] = "allow"
            if permission.operation == "external_dir_access":
                if permission.decision == "AUTO_ALLOW":
                    external_rules[permission.resource_pattern] = "allow"
                elif permission.decision == "HUMAN_GATE":
                    external_rules[permission.resource_pattern] = "ask"
                elif permission.decision == "DENY":
                    external_rules[permission.resource_pattern] = "deny"
    
    return read_rules, edit_rules, external_rules
```

---

## 4. Role-Scoped Permission Generation

### 4.1 Parent Agent Permissions

The parent agent receives the full envelope-derived permissions minus subagent spawning (if not authorized).

### 4.2 Subagent Permissions

Subagent permissions are the **intersection** of:
1. Parent agent permissions (the ceiling)
2. Subagent-specific grants from the Work Order

```python
def compute_subagent_permissions(parent_permissions, subagent_grants):
    # Intersection: only permissions both parent has and subagent is granted
    result = {}
    for key, value in subagent_grants.items():
        if key in parent_permissions:
            # Take the more restrictive of parent and subagent
            result[key] = intersect(parent_permissions[key], value)
    return result
```

### 4.3 Per-Agent Config Generation

```json
{
  "agent": {
    "dpt-worker": {
      "mode": "subagent",
      "permission": {
        "read": { "<task-scope>": "allow" },
        "edit": { "<task-scope>": "allow" },
        "bash": {
          "*": "ask",
          "<task-allowed-commands>": "allow",
          "<deny-rules>": "deny"
        },
        "task": "deny",
        "external_directory": { "<task-tmp-scope>": "allow" }
      }
    }
  }
}
```

---

## 5. 003.C Unresolved Shell /tmp Behavior — Adapter Design Response

### 5.1 Observed Behavior

- Native Write to `/tmp/dpt-*/` → AUTO_ALLOW (no prompt)
- Native Read from `/tmp/dpt-*/` → AUTO_ALLOW (no prompt)
- Shell `mkdir /tmp/dpt-*/` → External-directory prompt for `/tmp/*` (scope widened)

### 5.2 Adapter Strategy

**Primary strategy:** Avoid shell for task-scoped directory creation.

1. **Pre-create directories via native Write** before session start
   - The adapter generates the task workspace by writing a sentinel file
   - Native Write auto-creates parent directories
   - This avoids the shell mkdir prompt entirely

2. **For required shell operations** (rm, ls, stat, test, find):
   - Pre-authorize specific commands via bash config patterns
   - Example: `bash: { "ls /tmp/dpt-<task-id>/*": "allow" }`
   - Example: `bash: { "stat /tmp/dpt-<task-id>/*": "allow" }`
   - Example: `bash: { "test -e /tmp/dpt-<task-id>/*": "allow" }`
   - Example: `bash: { "find /tmp/dpt-<task-id>/*": "allow" }`

3. **For operations that cannot be pre-authorized:**
   - Accept the permission prompt as a Human Gate
   - Or investigate provider adapter permission injection in 004.B+

### 5.3 Investigation Path for 004.B+

1. Test whether the adapter can pre-authorize specific shell commands via config patterns
2. Test whether MCP tool calls can pre-authorize external directory access
3. Test whether plugin hooks can intercept and override permission decisions
4. Test the exact provider-level scope normalization behavior
5. Document findings in 004.C

---

## 6. Permission Envelope → OpenCode Config — Full Example

### 6.1 Input: Permission Envelope

```
PermissionEnvelope
  envelope_id: "env-001"
  source_task_id: "DPT-TASK-001"
  authority_mode: 3
  permissions:
    - domain: FILESYSTEM, operation: read, resource_pattern: "/Users/msl/Documents/GitHub/MyProject/**", decision: AUTO_ALLOW
    - domain: FILESYSTEM, operation: write, resource_pattern: "/Users/msl/Documents/GitHub/MyProject/src/**", decision: AUTO_ALLOW
    - domain: FILESYSTEM, operation: external_dir_access, resource_pattern: "/tmp/dpt-TASK-001/**", decision: AUTO_ALLOW
    - domain: EXECUTION, operation: run_command, resource_pattern: "git status*", decision: AUTO_ALLOW
    - domain: EXECUTION, operation: run_command, resource_pattern: "git diff*", decision: AUTO_ALLOW
    - domain: EXECUTION, operation: run_command, resource_pattern: "git log*", decision: AUTO_ALLOW
    - domain: EXECUTION, operation: run_command, resource_pattern: "git show*", decision: AUTO_ALLOW
    - domain: EXECUTION, operation: run_command, resource_pattern: "git rev-parse*", decision: AUTO_ALLOW
    - domain: EXECUTION, operation: run_command, resource_pattern: "node *", decision: AUTO_ALLOW
    - domain: GIT, operation: commit, resource_pattern: "git commit*", decision: HUMAN_GATE
    - domain: GIT, operation: push, resource_pattern: "git push*", decision: HUMAN_GATE
    - domain: GIT, operation: force_push, resource_pattern: "git push --force*", decision: DENY
    - domain: GIT, operation: reset_hard, resource_pattern: "git reset --hard*", decision: DENY
    - domain: DESTRUCTIVE, operation: filesystem, resource_pattern: "rm -rf*", decision: DENY
```

### 6.2 Output: OpenCode Config

```json
{
  "permission": {
    "external_directory": {
      "/tmp/dpt-TASK-001/**": "allow"
    },
    "read": {
      "/Users/msl/Documents/GitHub/MyProject/**": "allow",
      "/tmp/dpt-TASK-001/**": "allow"
    },
    "edit": {
      "/Users/msl/Documents/GitHub/MyProject/src/**": "allow",
      "/tmp/dpt-TASK-001/**": "allow"
    },
    "bash": {
      "*": "ask",
      "node *": "allow",
      "git status*": "allow",
      "git diff*": "allow",
      "git log*": "allow",
      "git show*": "allow",
      "git rev-parse*": "allow",
      "git commit*": "ask",
      "git push *": "ask",
      "git push --force*": "deny",
      "git reset --hard*": "deny",
      "rm -rf*": "deny"
    },
    "task": "allow",
    "glob": "allow",
    "grep": "allow",
    "list": "allow",
    "todowrite": "allow",
    "webfetch": "ask",
    "websearch": "ask"
  }
}
```

---

## 7. Rehydration After Restart

### 7.1 Rehydration Sequence

```
1. Detect session loss (export failure, process exit)
2. Query DPT for current Work Order and Permission Envelope
3. Regenerate OpenCode config from Permission Envelope
4. Create new session with regenerated config
5. Re-inject Work Order context via CLI message
6. Resume execution from last known state
```

### 7.2 State Preservation

| State | Stored Where | Rehydrated How |
|-------|-------------|---------------|
| Work Order | DPT Task State | MCP tool or CLI message |
| Permission Envelope | DPT Permission System | Config regeneration |
| Task Passport | DPT Task State | MCP tool |
| Attempt number | DPT Attempt State | CLI message metadata |
| Context receipt | DPT Context Store | Agent prompt injection |
| Model/provider route | DPT Routing Policy | CLI `--model` flag |

---

## 8. Revocation

### 8.1 Config-Level Revocation

When DPT narrows permissions:

1. Generate new, narrower config
2. Terminate current session
3. Create new session with narrower config
4. Resume or cancel based on DPT decision

### 8.2 Runtime Revocation (Investigation Required)

- Plugin hooks may support live permission injection
- `permission.ask` hook could intercept and deny
- Investigation needed in 004.B+

---

*DYNAMIC_PERMISSION_MATERIALIZATION.md — DPT-PROVIDER-004.A — 2026-09-03*
