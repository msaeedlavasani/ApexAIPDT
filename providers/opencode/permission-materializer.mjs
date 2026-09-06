/**
 * DPT-PROVIDER-004.C — OpenCode Permission Materializer
 *
 * Translates provider-neutral Permission Envelope → OpenCode config.
 * Deterministic, auditable, least-privilege preserving.
 *
 * OpenCode rule semantics: LAST MATCHING RULE WINS.
 * Generated order: catch-all → specific allows → asks → denies
 */

import { AUTHORITY_MODE, DOMAIN } from "./permission-envelope.mjs";

/**
 * Materialize a Permission Envelope into an OpenCode config object.
 *
 * @param {object} envelope - PermissionEnvelope
 * @param {object} [options]
 * @param {string} [options.agent_name] - per-agent config (optional)
 * @returns {object} OpenCode config fragment (permission section)
 */
export function materialize(envelope, { agent_name } = {}) {
  const bash_rules = constructBashRules(envelope);
  const read_rules = constructPathRules(envelope, "read");
  const edit_rules = constructPathRules(envelope, "write");
  const external_rules = constructPathRules(envelope, "external_dir");
  const task_permission = constructTaskPermission(envelope);

  const permission = {
    external_directory: external_rules,
    read: read_rules,
    edit: edit_rules,
    bash: bash_rules,
    task: task_permission,
    glob: "allow",
    grep: "allow",
    list: "allow",
    todowrite: "allow",
    webfetch: "ask",
    websearch: "ask",
  };

  if (agent_name) {
    return {
      agent: {
        [agent_name]: {
          mode: "subagent",
          permission,
        },
      },
    };
  }

  return { permission };
}

/**
 * Construct bash rules following LAST MATCHING RULE WINS semantics.
 * Order: catch-all → specific allows → specific asks → specific denies → governance denies
 */
function constructBashRules(envelope) {
  const rules = [];

  // Step 1: Catch-all (must be first)
  rules.push(["*", "ask"]);

  // Step 2: AUTO_ALLOW rules
  for (const p of envelope.permissions) {
    if (p.domain === DOMAIN.EXECUTION && p.decision === AUTHORITY_MODE.AUTO_ALLOW) {
      rules.push([p.resource_pattern, "allow"]);
    }
  }

  // Step 3: ASK rules (human gates)
  for (const p of envelope.permissions) {
    if (p.domain === DOMAIN.EXECUTION && p.decision === AUTHORITY_MODE.ASK) {
      rules.push([p.resource_pattern, "ask"]);
    }
  }

  // Step 4: DENY rules (specific)
  for (const p of envelope.permissions) {
    if (p.domain === DOMAIN.EXECUTION && p.decision === AUTHORITY_MODE.DENY) {
      rules.push([p.resource_pattern, "deny"]);
    }
  }

  // Step 5: Governance DENY rules (DPT invariant — always last)
  for (const p of envelope.permissions) {
    if (p.domain === DOMAIN.GIT && p.decision === AUTHORITY_MODE.DENY) {
      rules.push([p.resource_pattern, "deny"]);
    }
  }
  for (const p of envelope.permissions) {
    if (p.domain === DOMAIN.DESTRUCTIVE && p.decision === AUTHORITY_MODE.DENY) {
      rules.push([p.resource_pattern, "deny"]);
    }
  }

  // Deduplicate: last occurrence wins (matching OpenCode semantics)
  const seen = new Map();
  for (const [pattern, action] of rules) {
    seen.set(pattern, action);
  }

  // Rebuild in order, preserving first-seen order for new entries
  const ordered = [];
  const added = new Set();
  for (const [pattern, action] of rules) {
    if (!added.has(pattern)) {
      ordered.push([pattern, action]);
      added.add(pattern);
    }
  }
  // Override with last-seen values, return as object (OpenCode config format)
  const result = {};
  for (const [pattern] of ordered) {
    result[pattern] = seen.get(pattern);
  }
  return result;
}

/**
 * Construct path-based rules (read, edit, external_directory).
 * AUTO_ALLOW → "allow", ASK → "ask", DENY → "deny"
 */
function constructPathRules(envelope, operation) {
  // OpenCode evaluates path rules in insertion order with the last match winning.
  // Start fail-closed so static project rules cannot leak access outside this envelope.
  const rules = { "*": "deny" };
  const operations = operation === "write" ? new Set(["write", "create"]) : new Set([operation]);

  for (const p of envelope.permissions) {
    if (p.domain !== DOMAIN.FILESYSTEM) continue;
    if (!operations.has(p.operation)) continue;

    const action = p.decision === AUTHORITY_MODE.AUTO_ALLOW
      ? "allow"
      : p.decision === AUTHORITY_MODE.ASK
        ? "ask"
        : p.decision === AUTHORITY_MODE.DENY
          ? "deny"
          : null;
    if (!action) continue;

    // OpenCode matches paths inside the active worktree relative to that
    // worktree, while external-directory checks use canonical absolute paths.
    // Retain the canonical envelope pattern for audit/compatibility and add
    // the native internal form; never broaden the external boundary.
    const nativePattern = operation === "external_dir"
      ? p.resource_pattern
      : toNativePathPattern(p.resource_pattern, envelope.workspace);
    const patterns = [...new Set([
      p.resource_pattern,
      nativePattern,
    ])];
    for (const sourcePattern of patterns) {
      for (const pattern of expandPathPattern(sourcePattern)) {
        rules[pattern] = action;
      }
    }
  }

  // Keep known secret-bearing file shapes denied after the repository allow.
  // Include both native internal forms and absolute forms for provider paths
  // that are evaluated outside the active worktree.
  if ((operation === "read" || operation === "write") && envelope.workspace) {
    for (const pattern of sensitivePathPatterns(envelope.workspace)) {
      rules[pattern] = "deny";
    }
  }

  return rules;
}

function toNativePathPattern(pattern, workspace) {
  if (!workspace) return pattern;
  const normalizedWorkspace = workspace.replace(/[\\/]+$/, "");
  if (pattern === `${normalizedWorkspace}/**`) return "**";
  if (pattern.startsWith(`${normalizedWorkspace}/`)) {
    return pattern.slice(normalizedWorkspace.length + 1);
  }
  return pattern;
}

function expandPathPattern(pattern) {
  if (!pattern.endsWith("/**")) return [pattern];
  const base = pattern.slice(0, -3);
  // Keep the canonical /** rule and add explicit direct/nested forms. The
  // unique forms remain after a static config's catch-all during deep merge.
  return [pattern, `${base}/*`, `${base}/**/*`];
}

function sensitivePathPatterns(workspace) {
  return [
    ".env*",
    "**/.env*",
    "**/*.pem",
    "**/*.key",
    "**/*credentials*",
    `${workspace}/.env*`,
    `${workspace}/**/.env*`,
    `${workspace}/**/*.pem`,
    `${workspace}/**/*.key`,
    `${workspace}/**/*credentials*`,
  ];
}

/**
 * Construct task (subagent) permission.
 */
function constructTaskPermission(envelope) {
  for (const p of envelope.permissions) {
    if (p.domain === DOMAIN.AGENTS && p.operation === "spawn_subagent") {
      if (p.decision === AUTHORITY_MODE.AUTO_ALLOW) return "allow";
      if (p.decision === AUTHORITY_MODE.ASK) return "ask";
      if (p.decision === AUTHORITY_MODE.DENY) return "deny";
    }
  }
  return "ask"; // default: ask
}

/**
 * Validate materialized config for correctness.
 *
 * @param {object} config - OpenCode config fragment
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMaterialized(config) {
  const errors = [];
  const perm = config.permission ?? config.agent?.[Object.keys(config.agent ?? {})[0]]?.permission;

  if (!perm) {
    errors.push("No permission section found");
    return { valid: false, errors };
  }

  // Check bash rules
  if (perm.bash) {
    const bashEntries = Array.isArray(perm.bash) ? perm.bash : Object.entries(perm.bash);
    const firstEntry = bashEntries[0];
    if (firstEntry) {
      const [firstPattern] = Array.isArray(firstEntry) ? firstEntry : [firstEntry];
      if (firstPattern !== "*") {
        errors.push(`Bash catch-all rule must be first, got: ${firstPattern}`);
      }
    }

    // Check no broad allows
    const broadPatterns = ["/*", "/**", "~/**", "/tmp/*"];
    for (const [pattern, action] of bashEntries) {
      if (broadPatterns.includes(pattern) && action === "allow") {
        errors.push(`Broad allow rule detected: ${pattern}`);
      }
    }
  }

  // Check external_directory
  if (perm.external_directory) {
    const extEntries = Object.entries(perm.external_directory);
    for (const [pattern, action] of extEntries) {
      if (pattern === "/tmp/*" && action === "allow") {
        errors.push("Broad /tmp/* external_directory allow detected");
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Dry-run: evaluate what decision OpenCode would make for a given command.
 * Simulates LAST MATCHING RULE WINS.
 *
 * @param {object|Array} bash_rules - { pattern: action } or [[pattern, action], ...]
 * @param {string} command
 * @returns {{ decision: string, matched_pattern: string }}
 */
export function evaluateBashRule(bash_rules, command) {
  let decision = "ask"; // default if no rules match
  let matched_pattern = null;

  const entries = Array.isArray(bash_rules)
    ? bash_rules
    : Object.entries(bash_rules);

  for (const [pattern, action] of entries) {
    if (matchesPattern(pattern, command)) {
      decision = action;
      matched_pattern = pattern;
    }
  }

  return { decision, matched_pattern };
}

/**
 * Simple glob-like pattern matching.
 * Supports * wildcard at end of pattern.
 */
function matchesPattern(pattern, command) {
  if (pattern === "*") return true;
  if (pattern.endsWith("*")) {
    return command.startsWith(pattern.slice(0, -1));
  }
  return command === pattern;
}
