# Apex AI DPT -- Permission Envelope

**Status:** Proposed architecture direction
**Scope:** Provider-neutral runtime permission model; composable from task + mode + project policy.
**Depends on:** `DPT_AUTHORITY_MODEL.md`, `DPT_EXECUTION_CONTROL_MODEL.md`, `APEX_AI_DPT_CONSTITUTION.md`

## Purpose

The Permission Envelope is the runtime-evaluated, provider-neutral structure that carries the effective permissions for an agent at execution time. Every tool invocation, file access, network call, command execution, and destructive operation is evaluated against the envelope before it is permitted.

The envelope makes authority legible to any agent runtime without coupling to a specific provider, framework, or transport. It is the bridge between declarative Authority Policy and imperative agent behavior.

## Design Principles

1. **Fail-closed.** Ambiguous, missing, or malformed entries resolve to DENY.
2. **Auditable.** Every evaluation produces a decision record with evidence, timestamp, and authority source.
3. **Composable.** The envelope is assembled from layers: base policy, mode defaults, project policy, task-level grants, runtime narrowing.
4. **Provider-neutral.** No runtime-specific references (OpenCode, Claude, Cursor, etc.). Any agent runtime can evaluate the envelope.
5. **Specific-overrides-general.** A narrower rule always wins. A prohibition overrides a permission. A HUMAN_GATE overrides an AUTO_ALLOW at the same specificity.
6. **Delegation cannot expand.** The envelope is the policy ceiling. No downstream grant may widen an envelope entry beyond the intersection of its sources.

## Envelope Structure

```
PermissionEnvelope
  envelope_id
  created_at
  source_task_id
  source_work_order_id
  authority_mode                    # effective Service/Authority Mode (0-5)
  policy_ceiling_id                 # reference to governing Authority Policy
  risk_envelope_id                  # reference to governing Risk Envelope
  expires_at                        # optional absolute expiry
  idle_timeout_seconds              # optional inactivity expiry
  permissions[]                     # ordered set of evaluated permission entries
    permission_id
    domain                          # FILESYSTEM | EXECUTION | AGENTS | GIT | NETWORK | SECRETS | DATABASE | PRODUCTION | DESTRUCTIVE
    resource_pattern                # glob/regex/resource-ID matching the target
    operation                       # concrete action within the domain
    decision                        # AUTO_ALLOW | DENY | HUMAN_GATE
    conditions[]                    # preconditions that must hold for the decision
      type                          # env_var | path_exists | mode_gte | budget_remaining | time_window | resource_available | approval_reference
      name
      operator                      # eq | neq | gte | lte | in | matches
      value
    authority_source                # which policy/rule/grant produced this entry
    specificity                     # integer 0-1000; higher wins on conflict (see Specificity Scoring)
    audit                           # audit requirements for this permission
      log_before                    # boolean: record intent before execution
      log_after                     # boolean: record result after execution
      require_justification         # boolean: agent must state reason
      retain_days                   # minimum audit log retention
    expires_at                      # optional per-permission expiry
    metadata                        # arbitrary provider-neutral key-value pairs
  escalation_procedure              # how to escalate when DENY or HUMAN_GATE blocks
  evaluation_trace[]                # ordered history of how each entry was derived
    step
    layer                           # base_policy | mode_default | project_policy | task_grant | runtime_narrowing
    input_decision
    applied_rule
    output_decision
```

## Permission Domains

Each domain groups related operations. The resource_pattern is interpreted within its domain context.

### 1. FILESYSTEM

| Operation | resource_pattern | Mode 0-1 | Mode 2-3 | Mode 4-5 |
|---|---|---|---|---|
| `read` | glob/regex/path | AUTO_ALLOW | AUTO_ALLOW | AUTO_ALLOW |
| `write` | glob/regex/path | DENY | HUMAN_GATE | AUTO_ALLOW |
| `create` | glob/regex/path | DENY | HUMAN_GATE | AUTO_ALLOW |
| `delete` | glob/regex/path | DENY | DENY | HUMAN_GATE |
| `external_dir_access` | absolute_path | DENY | DENY | HUMAN_GATE |

**Conditions (examples):**
- `write`/`create`: require `path_within_project_root` = true
- `delete`: require `backup_exists` = true AND `file_not_in_vcs_protected_set` = true
- `external_dir_access`: require `explicit_owner_allowlist` = true AND `justification_provided` = true

**Authority source:** Authority Policy file-scope rules; Risk Envelope file-sensitivity classification.
**Audit:** `log_before` = true for write/create/delete; `log_after` = true for delete; `require_justification` = true for delete and external_dir_access.

### 2. EXECUTION

| Operation | resource_pattern | Mode 0-1 | Mode 2-3 | Mode 4-5 |
|---|---|---|---|---|
| `run_command` | command_string | DENY | HUMAN_GATE | AUTO_ALLOW |
| `run_tests` | test_pattern | DENY | AUTO_ALLOW | AUTO_ALLOW |
| `run_validation_harness` | harness_id | DENY | AUTO_ALLOW | AUTO_ALLOW |
| `spawn_subprocess` | command_string | DENY | HUMAN_GATE | AUTO_ALLOW |
| `modify_execution_environment` | env_target | DENY | DENY | HUMAN_GATE |

**Conditions (examples):**
- `run_command`: require `command_in_allowed_list` OR `command_matches_allowlist_pattern` AND `not_in_destructive_set`
- `run_tests`: require `tests_within_task_scope` = true
- `spawn_subprocess`: require `subprocess_within_timeout_budget` = true AND `subprocess_has_output_capture` = true
- `modify_execution_environment`: require `explicit_owner_approval` = true

**Authority source:** Authority Policy action permissions; Risk Envelope execution-risk classification; Task-level Resource Claims.
**Audit:** `log_before` = true for all; `log_after` = true for run_command/spawn_subprocess; `require_justification` = true for modify_execution_environment.

### 3. AGENTS

| Operation | resource_pattern | Mode 0-1 | Mode 2-3 | Mode 4-5 |
|---|---|---|---|---|
| `spawn_subagent` | agent_role | DENY | DENY | HUMAN_GATE |
| `parallel_execution` | concurrency_group | DENY | HUMAN_GATE | AUTO_ALLOW |
| `assign_reviewer_agent` | agent_role | DENY | AUTO_ALLOW | AUTO_ALLOW |
| `delegate_authority` | delegation_scope | DENY | DENY | DENY |

**Conditions (examples):**
- `spawn_subagent`: require `role_in_approved_agent_pool` = true AND `spawn_within_mode_ceiling` = true
- `parallel_execution`: require `resource_claims_compatible` = true AND `no_exclusive_conflict` = true
- `delegate_authority`: always DENY unless explicit Owner authorization with fresh policy evaluation (per Constitution Article 29)

**Escalation path for `delegate_authority`:**
1. Agent must not attempt delegation without authorization.
2. Submit EscalationPackage (type: DENY, is_absolute: true) with:
   - delegation_scope and justification
   - risk assessment and reversibility analysis
   - proposed delegation boundaries and time limits
3. Orchestrator reviews and forwards to Owner if warranted.
4. Owner may authorize with:
   - Fresh policy evaluation for delegation scope
   - Explicit time-bounded authorization (max 24 hours)
   - Audit record with delegation terms
   - Emergency revocation capability
5. If authorized, envelope is narrowed with:
   - New permission entry: `AGENTS.delegate_authority` with conditions
   - Specificity = 800 (Owner override)
   - Audit requirement: log_before, log_after, require_justification

**Authority source:** Authority Policy agent-scope rules; Mode-specific delegation ceiling; Task-level agent grants.
**Audit:** `log_before` = true for all; `log_after` = true for spawn_subagent; `require_justification` = true for all; `retain_days` = 90.

### 4. GIT

| Operation | resource_pattern | Mode 0-1 | Mode 2-3 | Mode 4-5 |
|---|---|---|---|---|
| `status` | repo_path | AUTO_ALLOW | AUTO_ALLOW | AUTO_ALLOW |
| `diff` | repo_path | AUTO_ALLOW | AUTO_ALLOW | AUTO_ALLOW |
| `log` | repo_path | AUTO_ALLOW | AUTO_ALLOW | AUTO_ALLOW |
| `show` | repo_path | AUTO_ALLOW | AUTO_ALLOW | AUTO_ALLOW |
| `branch` | branch_pattern | DENY | AUTO_ALLOW | AUTO_ALLOW |
| `worktree` | worktree_path | DENY | HUMAN_GATE | AUTO_ALLOW |
| `commit` | repo_path | DENY | HUMAN_GATE | AUTO_ALLOW |
| `push` | remote_ref | DENY | DENY | HUMAN_GATE |
| `merge` | branch_ref | DENY | DENY | HUMAN_GATE |
| `force_push` | remote_ref | DENY | DENY | DENY |
| `rebase` | branch_ref | DENY | DENY | HUMAN_GATE |
| `reset --hard` | repo_path | DENY | DENY | DENY |

**Conditions (examples):**
- `commit`: require `message_conforms_to_convention` = true AND `changes_within_task_scope` = true
- `push`: require `remote_in_approved_set` = true AND (`branch_not_protected` OR `explicit_approval` = true)
- `merge`: require `conflict_resolution_documented` = true AND `tests_pass` = true
- `force_push`: always DENY; escalate instead

**Authority source:** Authority Policy git-scope rules; Risk Envelope deployment-risk classification; branch protection policies.
**Audit:** `log_before` = true for commit/push/merge/rebase; `log_after` = true for commit/push/merge; `require_justification` = true for push/merge/force_push; `retain_days` = 180.

### 5. NETWORK

| Operation | resource_pattern | Mode 0-1 | Mode 2-3 | Mode 4-5 |
|---|---|---|---|---|
| `provider_api` | provider_id | AUTO_ALLOW | AUTO_ALLOW | AUTO_ALLOW |
| `registry_api` | registry_id | DENY | AUTO_ALLOW | AUTO_ALLOW |
| `arbitrary_outbound` | url_pattern | DENY | DENY | HUMAN_GATE |
| `websocket` | url_pattern | DENY | DENY | HUMAN_GATE |
| `inbound_listeners` | port_or_path | DENY | DENY | DENY |

**Conditions (examples):**
- `provider_api`: require `provider_in_trusted_set` = true AND `within_rate_limit` = true
- `arbitrary_outbound`: require `url_allowlisted_or_manual_approval` = true AND `no_secret_exfiltration` = true (content inspection)
- `inbound_listeners`: always DENY; network listeners require explicit Owner authorization

**Escalation path for `inbound_listeners`:**
1. Agent must not attempt to open inbound listeners without authorization.
2. Submit EscalationPackage (type: DENY, is_absolute: true) with:
   - port_or_path and intended purpose
   - network security assessment
   - alternative approaches considered
3. Orchestrator reviews and forwards to Owner if warranted.
4. Owner may authorize with:
   - Fresh security policy evaluation
   - Explicit time-bounded authorization (max 1 hour)
   - Audit record with listener terms
   - Immediate revocation capability
5. If authorized, envelope is narrowed with:
   - New permission entry: `NETWORK.inbound_listeners` with conditions
   - Specificity = 900 (Owner override, highest for security-critical)
   - Audit requirement: log_before, log_after, require_justification

**Authority source:** Authority Policy network-scope rules; provider trust configuration; rate-limit budgets.
**Audit:** `log_before` = true for arbitrary_outbound/websocket/inbound_listeners; `log_after` = true for all; `require_justification` = true for arbitrary_outbound and inbound_listeners; `retain_days` = 90.

### 6. SECRETS

| Operation | resource_pattern | Mode 0-1 | Mode 2-3 | Mode 4-5 |
|---|---|---|---|---|
| `existence_check` | secret_name | AUTO_ALLOW | AUTO_ALLOW | AUTO_ALLOW |
| `read_value` | secret_name | DENY | HUMAN_GATE | AUTO_ALLOW |
| `use_credential` | credential_scope | DENY | HUMAN_GATE | AUTO_ALLOW |
| `rotate_secret` | secret_name | DENY | DENY | HUMAN_GATE |
| `create_secret` | secret_name | DENY | DENY | HUMAN_GATE |
| `delete_secret` | secret_name | DENY | DENY | DENY |

**Conditions (examples):**
- `read_value`: require `secret_in_task_scope` = true AND `not_logged_to_output` = true (enforced by runtime, not trust)
- `use_credential`: require `credential_scope_matches_task_need` = true AND `credential_not_expired` = true
- `rotate_secret`: require `rotation_policy_allows` = true AND `replacement_credential_available` = true

**Authority source:** Authority Policy secrets-scope rules; credential lifecycle policy; Environment constraints.
**Audit:** `log_before` = true, `log_after` = true, `require_justification` = true for ALL secret operations. Values must never appear in audit logs; names and scopes only. `retain_days` >= 365.

### 7. DATABASE / DATA

| Operation | resource_pattern | Mode 0-1 | Mode 2-3 | Mode 4-5 |
|---|---|---|---|---|
| `read` | data_scope | DENY | HUMAN_GATE | AUTO_ALLOW |
| `query` | query_scope | DENY | HUMAN_GATE | AUTO_ALLOW |
| `mutation` | data_scope | DENY | DENY | HUMAN_GATE |
| `migration` | schema_scope | DENY | DENY | HUMAN_GATE |
| `seed_data` | data_scope | DENY | DENY | HUMAN_GATE |
| `drop_table_or_schema` | schema_scope | DENY | DENY | DENY |

**Conditions (examples):**
- `read`/`query`: require `data_in_task_scope` = true AND `environment_is_not_production` = true (unless explicit override)
- `mutation`: require `transaction_bounded` = true AND `rollback_available` = true AND `data_classification_allows` = true
- `migration`: require `migration_tested` = true AND `backward_compatible` = true AND `owner_approval` = true
- `drop_table_or_schema`: always DENY; requires separate Owner authorization and a migration plan

**Authority source:** Authority Policy data-scope rules; data classification and governance; environment constraints.
**Audit:** `log_before` = true for mutation/migration/drop; `log_after` = true for mutation/migration; `require_justification` = true for mutation/migration/drop; `retain_days` >= 365.

### 8. PRODUCTION

| Operation | resource_pattern | Mode 0-1 | Mode 2-3 | Mode 4-5 |
|---|---|---|---|---|
| `inspect_logs` | service_id | DENY | AUTO_ALLOW | AUTO_ALLOW |
| `inspect_metrics` | service_id | DENY | AUTO_ALLOW | AUTO_ALLOW |
| `inspect_traces` | service_id | DENY | AUTO_ALLOW | AUTO_ALLOW |
| `deploy` | service_id | DENY | DENY | HUMAN_GATE |
| `rollback` | service_id | DENY | DENY | HUMAN_GATE |
| `scale` | service_id | DENY | DENY | HUMAN_GATE |
| `feature_flag_toggle` | flag_id | DENY | DENY | HUMAN_GATE |
| `database_direct_access` | data_scope | DENY | DENY | DENY |

**Conditions (examples):**
- `deploy`: require `ci_pipeline_green` = true AND `approval_count_meets_minimum` = true AND `within_deploy_window` = true AND `canary_strategy_defined` = true
- `rollback`: require `incident_declared` = true OR `approval_count_meets_minimum` = true
- `database_direct_access`: always DENY in production; requires Owner direct intervention

**Authority source:** Authority Policy production-scope rules; deployment policy; incident response policy.
**Audit:** `log_before` = true for all; `log_after` = true for deploy/rollback/scale/feature_flag_toggle; `require_justification` = true for all; `retain_days` >= 365.

### 9. DESTRUCTIVE

This domain gates operations that are irreversible or have broad blast radius. A permission in this domain overlays a permission in another domain (e.g., `filesystem.delete` is also evaluated under `DESTRUCTIVE.filesystem`). Both must pass.

| Operation | resource_pattern | Mode 0-1 | Mode 2-3 | Mode 4-5 |
|---|---|---|---|---|
| `filesystem` | path_or_scope | DENY | DENY | HUMAN_GATE |
| `git_history` | repo_ref | DENY | DENY | DENY |
| `infrastructure` | infra_scope | DENY | DENY | DENY |
| `data` | data_scope | DENY | DENY | DENY |
| `credentials` | credential_scope | DENY | DENY | DENY |
| `project_dependencies` | dependency_scope | DENY | DENY | HUMAN_GATE |

**Conditions (examples):**
- All: require `destructive_impact_assessed` = true AND `reversibility_or_mitigation_documented` = true AND `owner_or_gate_approval` = true
- `git_history`: always DENY (force-push, rewrite history); escalate instead
- `infrastructure`: always DENY; requires Owner direct intervention
- `project_dependencies`: require `major_version_change_authorized` = true per Constitution Article 18

**Domain-operation mapping for DESTRUCTIVE overlay:**
The following operations in other domains trigger the DESTRUCTIVE overlay:
- FILESYSTEM: `delete`, `external_dir_access`
- GIT: `force_push`, `reset --hard`, `rebase`
- NETWORK: `inbound_listeners`
- SECRETS: `rotate_secret`, `create_secret`, `delete_secret`
- DATABASE: `mutation`, `migration`, `seed_data`, `drop_table_or_schema`
- PRODUCTION: `deploy`, `rollback`, `scale`, `feature_flag_toggle`, `database_direct_access`

**Authority source:** Authority Policy destructive-scope rules; Risk Envelope severity classification; Constitution Articles 18, 19, 29.
**Audit:** `log_before` = true, `log_after` = true, `require_justification` = true for ALL destructive operations. `retain_days` >= 365.

## Evaluation Algorithm

```
function evaluate(envelope, requested_action):

  1. Parse requested_action into (domain, operation, resource_pattern, context).

  2. Collect all permission entries from envelope.permissions where
     domain matches AND resource_pattern matches the requested target.

  3. If no entries match:
        DECISION = DENY
        Record "no matching permission" in evaluation trace
        Go to step 11.

  4. Sort matching entries by:
       primary: specificity (descending, higher wins)
       secondary: layer order (runtime_narrowing > task_grant >
                  project_policy > mode_default > base_policy)

  5. For each entry in sorted order:
        a. If entry.decision == DENY:
             Record decision in trace and STOP.
             (Specific DENY always wins. This early-exit is intentional
             per fail-closed semantics and may override specificity
             in some cases - see note below.)
        b. If entry.decision == HUMAN_GATE:
             Record HUMAN_GATE as pending outcome.
             Continue checking for narrowing but do not overwrite
             with a less-specific AUTO_ALLOW.
             (Sticky semantics: HUMAN_GATE persists unless a
             more-specific DENY or narrower AUTO_ALLOW overrides it.)
        c. If entry.decision == AUTO_ALLOW:
             Check all entry.conditions.
             If any condition fails: skip this entry (treat as absent).
             If all conditions pass: record AUTO_ALLOW as pending outcome.

  6. After iterating all matching entries:
        a. If any surviving decision is HUMAN_GATE -> DECISION = HUMAN_GATE.
        b. If any surviving decision is AUTO_ALLOW -> DECISION = AUTO_ALLOW.
        c. Otherwise -> DECISION = DENY.

  7. DESTRUCTIVE domain overlay check:
        If requested_action.domain != DESTRUCTIVE AND
        action is destructive (identified by domain/operation mapping):
          a. Evaluate DESTRUCTIVE domain permission for same resource:
             - Collect DESTRUCTIVE domain entries matching the action's scope.
             - Apply steps 4-6 to DESTRUCTIVE entries.
             - Result = DESTRUCTIVE_DECISION.
          b. Compose with domain permission:
             - If DECISION == DENY OR DESTRUCTIVE_DECISION == DENY:
                 DECISION = DENY (either gate blocks).
             - If both are AUTO_ALLOW:
                 DECISION = AUTO_ALLOW.
             - If either is HUMAN_GATE (and neither is DENY):
                 DECISION = HUMAN_GATE.
          c. Record DESTRUCTIVE overlay evaluation in trace.

  8. If envelope.expires_at < now:
        DECISION = DENY (envelope expired).

  9. If envelope.idle_timeout_seconds is set AND
        (now - last_activity_timestamp) > envelope.idle_timeout_seconds:
        DECISION = DENY (idle timeout exceeded).
        NOTE: idle_timeout_seconds is optional and may not be enforced
        by all runtimes. If not enforced, this step is skipped.

  10. If envelope.authority_mode < minimum_mode_for_operation(domain, operation):
        DECISION = DENY (mode too low for this operation).

  11. Record full evaluation trace:
        step, layer, input_decision, applied_rule, output_decision.

  12. Persist audit record:
        envelope_id, action, decision, context, timestamp,
        actor, authority_source, evaluation_trace.

  13. Return decision.
```

### Conflict resolution rules

1. **Specific resource pattern wins.** `src/components/Button.tsx` beats `src/**/*.tsx`.
2. **Higher specificity wins.** Specificity is computed from pattern literalness, condition count, and policy inheritance depth (see Specificity Scoring below).
3. **DENY wins over AUTO_ALLOW.** A specific DENY at any specificity overrides a less-specific AUTO_ALLOW.
4. **HUMAN_GATE is sticky.** Once HUMAN_GATE applies at any specificity, only a more-specific DENY or a narrower AUTO_ALLOW (with fewer resources) can change the outcome.
5. **Layer ordering breaks ties.** Runtime narrowing > Task grant > Project policy > Mode default > Base policy.
6. **DESTRUCTIVE overlays.** If an action triggers both its domain permission and the DESTRUCTIVE domain, both must pass. A DENY in either blocks the action.

### Specificity Scoring

Specificity is an integer from 0 to 1000, computed as follows:

**Scoring rubric:**
- **Pattern literalness (0-600):**
  - Exact match (e.g., `src/components/Button.tsx`): 600
  - Single wildcard (e.g., `src/components/*.tsx`): 400
  - Double wildcard (e.g., `src/**/*.tsx`): 200
  - Domain-wide pattern (e.g., `*.tsx`): 100
  - No pattern (all resources): 0

- **Condition count (0-300):**
  - Per condition: +30 points
  - Maximum 300 points (10 conditions)

- **Policy inheritance depth (0-100):**
  - Base policy: 0
  - Mode default: 20
  - Project policy: 40
  - Task grant: 60
  - Runtime narrowing: 80
  - Owner override: 100

**Example computation:**
Entry: `FILESYSTEM.write` for `src/**/*.tsx` with 3 conditions, from Project Policy.
- Pattern: `src/**/*.tsx` (double wildcard) = 200
- Conditions: 3 × 30 = 90
- Layer: Project Policy = 40
- **Total specificity = 200 + 90 + 40 = 330**

Entry: `FILESYSTEM.write` for `src/components/Button.tsx` with 1 condition, from Task Grant.
- Pattern: `src/components/Button.tsx` (exact match) = 600
- Conditions: 1 × 30 = 30
- Layer: Task Grant = 60
- **Total specificity = 600 + 30 + 60 = 690**

Result: Task Grant entry wins (690 > 330).

## Envelope Composition

The envelope is assembled at Work Order issuance time and narrowed at runtime. Each layer may only narrow or preserve; it cannot widen.

```
Envelope = BasePolicy AND ModeDefaults AND ProjectPolicy AND TaskGrant [+ RuntimeNarrowing]
```

### Layer 1: Base Policy (Owner-defined)

The Authoritative base. Defines the full permission space, prohibited actions, and global constraints. This is the widest possible envelope for the project.

**Source:** Authority Policy document or equivalent owner-controlled configuration.
**Invariants:** Cannot be overridden by any downstream layer. Defines absolute prohibitions (always-DENY entries) that no other layer can lift.

### Layer 2: Mode Defaults (derived from Service/Authority Mode)

Each Service/Authority Mode (0-5) carries a set of default permission decisions per domain and operation. These defaults are defined in the Permission Domains tables above.

**Source:** Derived from the effective `authority_mode` in the Work Order.
**Invariants:** Mode defaults narrow Base Policy. They cannot widen any Base Policy entry. Mode 0-1 are strictly advisory (read-only + observe). Mode 5 is the widest but still bounded by Base Policy and Risk Envelope.

### Layer 3: Project Policy (project-specific overrides)

Project-level customizations that further narrow Mode Defaults based on project context: technology stack, team conventions, security posture, deployment model, and governance requirements.

**Source:** Project Authority Policy configuration.
**Invariants:** Must not widen Mode Defaults. Must not violate Base Policy. Must be auditable and versioned.

### Layer 4: Task Grant (Work Order scope)

Task-specific permissions granted by the Orchestrator when issuing a Work Order. The narrowest policy-level layer. Grants only what the Task needs to complete its Work Order.

**Source:** Work Order issued by the Execution Orchestrator.
**Invariants:** Must not widen Project Policy. Must align with declared Resource Claims. Must be bounded by task scope and success criteria.

### Layer 5: Runtime Narrowing (dynamic, transient)

Runtime adjustments made by the Orchestrator or agent during execution based on real-time conditions: discovered constraints, failed conditions, budget exhaustion, security events, or scope expansion requests.

**Source:** Orchestrator decisions during Attempt lifecycle.
**Invariants:** Cannot widen any prior layer. Must produce an audit record. Must be justified and time-bounded. Scope expansion requests require fresh policy evaluation before approval (per Execution Control Model).

### Composition example

```
Base Policy:    FILESYSTEM.write -> DENY for all
Mode 3 default: FILESYSTEM.write -> HUMAN_GATE for project/**
Project Policy: FILESYSTEM.write -> AUTO_ALLOW for src/**/*.ts (conditions: tests_pass, within_task_scope)
Task Grant:     FILESYSTEM.write -> AUTO_ALLOW for src/components/Button.tsx

Effective for writing src/components/Button.tsx: AUTO_ALLOW
  (Task Grant narrows Project Policy, which narrows Mode Default, which narrows Base Policy)
  (All layers agree or narrow; no expansion occurred)
```

## Audit Trail

Every envelope evaluation produces a durable audit record. The audit trail is a first-class governance artifact, not a debug convenience.

### Audit record structure

```
AuditRecord
  record_id
  envelope_id
  timestamp
  actor                             # agent identity, role, executor ID
  action                            # requested action (domain, operation, target)
  decision                          # AUTO_ALLOW | DENY | HUMAN_GATE
  decision_reason                   # summary of why this decision was reached
  authority_source                  # which policy/rule produced the decision
  evaluation_trace                  # full trace from the evaluation algorithm
  context                           # environment, task, work_order, attempt IDs
  conditions_evaluated[]            # each condition checked and its result
  justification                     # agent-provided reason (when required)
  override_by                       # if decision was overridden, by what
  parent_record_id                  # link to the triggering audit record
  retention_policy                  # minimum retention period
```

### Audit invariants

1. **Every evaluation is recorded.** ALLOW, DENY, and HUMAN_GATE all produce audit records.
2. **No gap.** An agent action without a preceding audit record is a policy violation.
3. **Immutable.** Audit records are append-only. No record may be modified or deleted after creation.
4. **Retrievable.** Audit records must be queryable by envelope_id, actor, action, decision, and time range.
5. **Retention.** Minimum retention periods by domain:
   - FILESYSTEM: 90 days
   - EXECUTION: 90 days
   - AGENTS: 90 days
   - GIT: 180 days
   - NETWORK: 90 days
   - SECRETS: 365 days
   - DATABASE: 365 days
   - PRODUCTION: 365 days
   - DESTRUCTIVE: 365 days
6. **Secrets protection.** Secret values must never appear in audit records. Only names, scopes, and operation metadata are recorded.

## Escalation Protocol

When an evaluation produces DENY or HUMAN_GATE, the agent must follow the escalation protocol rather than proceeding or silently failing.

### HUMAN_GATE escalation

```
EscalationPackage
  type                              # HUMAN_GATE
  envelope_id
  action                            # what the agent was attempting
  domain / operation / resource     # precise action description
  reason                            # why HUMAN_GATE was triggered
  authority_source                  # which rule imposed the gate
  conditions[]                      # what conditions would need to change
  options[]                         # alternative approaches the agent considered
  risk_assessment                   # impact if the action is taken
  recommendation                    # what the agent recommends and why
  smallest_owner_action             # minimum human decision required
  time_sensitivity                  # none | low | medium | high | critical
  evidence                          # supporting context for the decision
```

### DENY escalation

```
EscalationPackage
  type                              # DENY
  envelope_id
  action                            # what the agent was attempting
  domain / operation / resource     # precise action description
  reason                            # why DENY was produced
  authority_source                  # which rule produced the denial
  is_absolute                       # true if always-DENY; false if conditional
  options[]                         # alternative approaches
  request                           # if the agent believes this is an error,
                                    # what policy change would be needed
  time_sensitivity                  # none | low | medium | high | critical
  evidence                          # supporting context
```

### Escalation rules

1. An agent must not attempt to work around a DENY by reinterpretating the action, splitting it, or retrying with altered parameters.
2. An agent must not silently skip a HUMAN_GATE by finding an alternative action that achieves the same effect without the gate.
3. Escalation is a valid controlled outcome, not an execution failure (Constitution Article 19).
4. The Orchestrator receives escalations and decides whether to approve, deny, narrow, or forward to the Owner.
5. Time-sensitive escalations include a deadline. If no response is received, the default is DENY.

## Provider Integration

The Permission Envelope is provider-neutral. Any AI agent runtime can evaluate it by implementing the following interface:

### Required runtime capabilities

1. **Action interception.** The runtime must intercept every tool invocation, file access, network call, command execution, and agent operation before it reaches the target.
2. **Envelope evaluation.** The runtime must evaluate the intercepted action against the current envelope using the defined algorithm.
3. **Decision enforcement.** The runtime must enforce the decision: permit, block, or present a human gate.
4. **Audit recording.** The runtime must produce audit records for every evaluation.
5. **Escalation delivery.** The runtime must deliver escalation packages to the designated escalation target.
6. **Envelope refresh.** The runtime must support envelope updates (narrowing) during an Attempt without restarting.

### Provider mapping (non-normative)

Different agent runtimes will map the envelope to their native permission models:

- **OpenCode:** Map to tool permission rules, file access controls, and bash command filters.
- **Claude Code:** Map to tool permissions and bash tool restrictions.
- **Cursor:** Map to tool permissions and file system access rules.
- **Custom runtimes:** Implement the required interface directly.

The envelope does not prescribe a specific mapping. Each runtime provider implements the mapping that fits its architecture while preserving the semantic guarantees: fail-closed, auditable, composable, and provider-neutral.

### Minimum viable integration

A provider integration is minimally viable if it:
1. Intercepts all tool invocations.
2. Evaluates each against the envelope.
3. Enforces DENY by blocking.
4. Enforces HUMAN_GATE by pausing and requesting human input.
5. Records audit entries for all three outcomes.
6. Delivers escalation packages for DENY and HUMAN_GATE.

## Glossary

| Term | Definition |
|---|---|
| **Permission Envelope** | The runtime-evaluated, provider-neutral structure carrying effective permissions for an agent at execution time. |
| **Permission Entry** | A single domain-operation-resource decision within the envelope. |
| **Decision** | The outcome of evaluating a permission entry: AUTO_ALLOW, DENY, or HUMAN_GATE. |
| **Specificity** | A numeric measure (0-1000) of how precisely a resource_pattern matches a target. Higher = more specific. Computed from pattern literalness, condition count, and policy inheritance depth (see Specificity Scoring). |
| **Authority Source** | The policy, rule, or grant that produced a permission entry. |
| **Policy Ceiling** | The maximum authority that may be delegated; the envelope cannot be widened beyond this. |
| **DESTRUCTIVE overlay** | A dual-gate mechanism where destructive operations must pass both their domain permission and the DESTRUCTIVE domain. |
| **Fail-closed** | The principle that ambiguous, missing, or unresolvable permission states resolve to DENY. |
