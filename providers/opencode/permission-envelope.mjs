/**
 * DPT-PROVIDER-004.C — Permission Envelope Schema (Provider-Neutral)
 *
 * Canonical DPT permission representation.
 * OpenCode-specific translation belongs exclusively in the materializer.
 */

export const SCHEMA_VERSION = "0.1.0";

export const AUTHORITY_MODE = Object.freeze({
  AUTO_ALLOW: "AUTO_ALLOW",
  ASK: "ASK",
  DENY: "DENY",
});

export const DOMAIN = Object.freeze({
  FILESYSTEM: "FILESYSTEM",
  EXECUTION: "EXECUTION",
  GIT: "GIT",
  NETWORK: "NETWORK",
  AGENTS: "AGENTS",
  DESTRUCTIVE: "DESTRUCTIVE",
});

export const ROLE = Object.freeze({
  ARCHITECT: "ARCHITECT",
  DEVELOPER: "DEVELOPER",
  REVIEWER: "REVIEWER",
  INTEGRATION_CONTROLLER: "INTEGRATION_CONTROLLER",
});

/**
 * Create a Permission Envelope from a Work Order definition.
 *
 * @param {object} params
 * @param {string} params.task_id
 * @param {string} params.task_passport_revision
 * @param {string} params.work_order_id
 * @param {string} params.work_order_revision
 * @param {string} params.role - one of ROLE values
 * @param {string} params.actor_id
 * @param {string} params.workspace - project root path
 * @param {string} [params.expires_at] - ISO timestamp
 * @param {Array} params.permissions - array of PermissionEntry
 * @param {object} [params.human_gates]
 * @param {object} [params.prohibitions]
 * @param {object} [params.metadata]
 * @returns {object} PermissionEnvelope
 */
export function createEnvelope({
  task_id,
  task_passport_revision = "1",
  work_order_id,
  work_order_revision = "1",
  role,
  actor_id = "dpt-adapter",
  workspace,
  expires_at,
  permissions = [],
  human_gates = {},
  prohibitions = {},
  metadata = {},
}) {
  const envelope_id = `env-${work_order_id}-${Date.now()}`;
  const issued_at = new Date().toISOString();

  return {
    envelope_id,
    schema_version: SCHEMA_VERSION,
    task_id,
    task_passport_revision,
    work_order_id,
    work_order_revision,
    role,
    actor_id,
    authority_mode: "DELEGATED",
    issued_at,
    expires_at: expires_at ?? null,
    lifetime: expires_at ? new Date(expires_at).getTime() - Date.now() : null,
    workspace,
    permissions: permissions.map(normalizePermission),
    human_gates,
    prohibitions,
    metadata: {
      ...metadata,
      generated_by: "dpt-opencode-provider-adapter",
      generated_at: issued_at,
    },
  };
}

function normalizePermission(p) {
  return {
    domain: p.domain,
    operation: p.operation,
    resource_pattern: p.resource_pattern,
    decision: p.decision,
    source: p.source ?? "WORK_ORDER",
    human_gate: p.human_gate ?? (p.decision === AUTHORITY_MODE.ASK),
  };
}

/**
 * Role-specific default permissions for DPT roles.
 */
export const ROLE_DEFAULTS = Object.freeze({
  [ROLE.ARCHITECT]: {
    filesystem: {
      read: ["/**"],
      write: [],
      create: [],
      delete: [],
    },
    execution: {
      allow: ["git status*", "git diff*", "git log*", "git show*", "git rev-parse*", "node -e*"],
      ask: [],
      deny: ["git push*", "git commit*", "git merge*", "git rebase*"],
    },
    git: {
      read: ["status", "diff", "log", "show", "rev-parse"],
      commit: "ASK",
      push: "ASK",
      merge: "ASK",
      rebase: "ASK",
      force_push: "DENY",
      reset_hard: "DENY",
    },
    agents: { subagents: "DENY" },
  },
  [ROLE.DEVELOPER]: {
    filesystem: {
      read: ["/**"],
      write: ["<task_workspace>/**"],
      create: ["<task_workspace>/**"],
      delete: ["<task_workspace>/**"],
    },
    execution: {
      allow: ["git status*", "git diff*", "git log*", "git show*", "git rev-parse*", "node *", "npm test*", "npm run build*"],
      ask: ["git commit*", "git push*"],
      deny: ["git push --force*", "git reset --hard*", "rm -rf*"],
    },
    git: {
      read: ["status", "diff", "log", "show", "rev-parse"],
      commit: "ASK",
      push: "ASK",
      force_push: "DENY",
      reset_hard: "DENY",
    },
    agents: { subagents: "ASK" },
  },
  [ROLE.REVIEWER]: {
    filesystem: {
      read: ["/**"],
      write: [],
      create: [],
      delete: [],
    },
    execution: {
      allow: ["git status*", "git diff*", "git log*", "git show*", "git rev-parse*"],
      ask: [],
      deny: ["git push*", "git commit*", "git merge*", "git rebase*", "git push --force*", "git reset --hard*", "rm -rf*"],
    },
    git: {
      read: ["status", "diff", "log", "show", "rev-parse"],
      commit: "DENY",
      push: "DENY",
      merge: "DENY",
      rebase: "DENY",
      force_push: "DENY",
      reset_hard: "DENY",
    },
    agents: { subagents: "DENY" },
  },
  [ROLE.INTEGRATION_CONTROLLER]: {
    filesystem: {
      read: ["/**"],
      write: ["<task_workspace>/**"],
      create: ["<task_workspace>/**"],
      delete: ["<task_workspace>/**"],
    },
    execution: {
      allow: ["git status*", "git diff*", "git log*", "git show*", "git rev-parse*", "node *", "npm *"],
      ask: ["git commit*", "git push*"],
      deny: ["git push --force*", "git reset --hard*", "rm -rf*"],
    },
    git: {
      read: ["status", "diff", "log", "show", "rev-parse"],
      commit: "ASK",
      push: "ASK",
      force_push: "DENY",
      reset_hard: "DENY",
    },
    agents: { subagents: "ASK" },
  },
});

/**
 * Generate permissions from a role profile and task-specific overrides.
 */
export function generatePermissions(role, { workspace, task_workspace, allowed_commands = [], denied_commands = [], external_dirs = [] }) {
  const defaults = ROLE_DEFAULTS[role];
  if (!defaults) throw new Error(`Unknown role: ${role}`);

  const permissions = [];

  // Filesystem read
  for (const pattern of defaults.filesystem.read) {
    const resolved = pattern === "/**" ? `${workspace}/**` : pattern.replace("<task_workspace>", task_workspace);
    permissions.push({ domain: DOMAIN.FILESYSTEM, operation: "read", resource_pattern: resolved, decision: AUTHORITY_MODE.AUTO_ALLOW });
  }

  // Filesystem write
  for (const pattern of defaults.filesystem.write) {
    const resolved = pattern.replace("<task_workspace>", task_workspace);
    permissions.push({ domain: DOMAIN.FILESYSTEM, operation: "write", resource_pattern: resolved, decision: AUTHORITY_MODE.AUTO_ALLOW });
  }

  // Filesystem create
  for (const pattern of defaults.filesystem.create) {
    const resolved = pattern.replace("<task_workspace>", task_workspace);
    permissions.push({ domain: DOMAIN.FILESYSTEM, operation: "create", resource_pattern: resolved, decision: AUTHORITY_MODE.AUTO_ALLOW });
  }

  // External directories
  for (const dir of external_dirs) {
    permissions.push({ domain: DOMAIN.FILESYSTEM, operation: "external_dir", resource_pattern: `${dir}/**`, decision: AUTHORITY_MODE.AUTO_ALLOW });
  }

  // Execution allow
  for (const cmd of defaults.execution.allow) {
    permissions.push({ domain: DOMAIN.EXECUTION, operation: "run_command", resource_pattern: cmd, decision: AUTHORITY_MODE.AUTO_ALLOW });
  }

  // Task-specific allowed commands
  for (const cmd of allowed_commands) {
    permissions.push({ domain: DOMAIN.EXECUTION, operation: "run_command", resource_pattern: cmd, decision: AUTHORITY_MODE.AUTO_ALLOW });
  }

  // Execution ask (human gates)
  for (const cmd of defaults.execution.ask) {
    permissions.push({ domain: DOMAIN.EXECUTION, operation: "run_command", resource_pattern: cmd, decision: AUTHORITY_MODE.ASK });
  }

  // Execution deny
  for (const cmd of defaults.execution.deny) {
    permissions.push({ domain: DOMAIN.EXECUTION, operation: "run_command", resource_pattern: cmd, decision: AUTHORITY_MODE.DENY });
  }

  // Denied commands
  for (const cmd of denied_commands) {
    permissions.push({ domain: DOMAIN.EXECUTION, operation: "run_command", resource_pattern: cmd, decision: AUTHORITY_MODE.DENY });
  }

  // Git operations
  for (const op of defaults.git.read) {
    permissions.push({ domain: DOMAIN.GIT, operation: op, resource_pattern: `git ${op}*`, decision: AUTHORITY_MODE.AUTO_ALLOW });
  }

  if (defaults.git.commit === "ASK") {
    permissions.push({ domain: DOMAIN.GIT, operation: "commit", resource_pattern: "git commit*", decision: AUTHORITY_MODE.ASK });
  }
  if (defaults.git.push === "ASK") {
    permissions.push({ domain: DOMAIN.GIT, operation: "push", resource_pattern: "git push*", decision: AUTHORITY_MODE.ASK });
  }
  if (defaults.git.force_push === "DENY") {
    permissions.push({ domain: DOMAIN.GIT, operation: "force_push", resource_pattern: "git push --force*", decision: AUTHORITY_MODE.DENY });
  }
  if (defaults.git.reset_hard === "DENY") {
    permissions.push({ domain: DOMAIN.GIT, operation: "reset_hard", resource_pattern: "git reset --hard*", decision: AUTHORITY_MODE.DENY });
  }

  // Destructive overlay (always deny)
  permissions.push({ domain: DOMAIN.DESTRUCTIVE, operation: "filesystem", resource_pattern: "rm -rf*", decision: AUTHORITY_MODE.DENY });

  // Agents
  if (defaults.agents.subagents === "ASK") {
    permissions.push({ domain: DOMAIN.AGENTS, operation: "spawn_subagent", resource_pattern: "task", decision: AUTHORITY_MODE.ASK });
  } else if (defaults.agents.subagents === "DENY") {
    permissions.push({ domain: DOMAIN.AGENTS, operation: "spawn_subagent", resource_pattern: "task", decision: AUTHORITY_MODE.DENY });
  }

  return permissions;
}
