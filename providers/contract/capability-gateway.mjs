/**
 * DPT Provider-Neutral Capability Gateway & Interceptor
 *
 * Enforces PermissionEnvelope bounds independently of model compliance or LLM prompts.
 * Intercepts tool requests (filesystem operations, shell commands, process executions)
 * and evaluates them against the materialized Permission Envelope.
 */

import { AUTHORITY_MODE, DOMAIN } from "../contract/provider-contract.mjs";
import { resolve, normalize, relative, isAbsolute } from "path";

export class CapabilityGateway {
  constructor({ envelope, root_dir } = {}) {
    this.envelope = envelope ?? null;
    this.root_dir = root_dir ? resolve(root_dir) : process.cwd();
  }

  setEnvelope(envelope) {
    this.envelope = envelope;
  }

  /**
   * Evaluate whether a filesystem operation is authorized by the current Permission Envelope.
   * 
   * @param {Object} params
   * @param {string} params.action - 'read' | 'write' | 'list' | 'delete' | 'search'
   * @param {string} params.target_path - Absolute or relative path to operate on
   * @returns {{ authorized: boolean, mode: string, reason: string, resolved_path: string }}
   */
  evaluateFilesystemAccess({ action, target_path }) {
    if (!this.envelope) {
      return { authorized: false, mode: AUTHORITY_MODE.DENY, reason: "NO_ENVELOPE_LOADED", resolved_path: target_path };
    }

    const absPath = isAbsolute(target_path) ? resolve(target_path) : resolve(this.root_dir, target_path);

    // Find applicable filesystem rules in the envelope
    const fsPermissions = (this.envelope.permissions ?? []).filter(
      (p) => p.domain === DOMAIN.FILESYSTEM || p.domain === "filesystem" || p.action?.startsWith("filesystem.")
    );

    // Fail closed if no filesystem rules exist
    if (fsPermissions.length === 0) {
      return { authorized: false, mode: AUTHORITY_MODE.DENY, reason: "NO_FILESYSTEM_RULES_IN_ENVELOPE", resolved_path: absPath };
    }

    // Evaluate rules (DENY overrides ALLOW)
    let matchedRule = null;

    for (const rule of fsPermissions) {
      const mode = rule.mode ?? rule.authority_mode ?? rule.decision;
      const resourcePattern = rule.resource ?? rule.resource_pattern ?? rule.path_pattern ?? "*";

      if (this._pathMatchesPattern(absPath, resourcePattern)) {
        if (this._actionMatchesRule(action, rule)) {
          if (mode === AUTHORITY_MODE.DENY || mode === "DENY") {
            return {
              authorized: false,
              mode: AUTHORITY_MODE.DENY,
              reason: `EXPLICIT_DENY_RULE: ${rule.description || resourcePattern}`,
              resolved_path: absPath,
            };
          }

          if (mode === AUTHORITY_MODE.AUTO_ALLOW || mode === "AUTO_ALLOW" || mode === "ALLOW") {
            matchedRule = rule;
          }
        }
      }
    }

    if (matchedRule) {
      return {
        authorized: true,
        mode: AUTHORITY_MODE.AUTO_ALLOW,
        reason: `AUTHORIZED_BY_RULE: ${matchedRule.description || matchedRule.resource}`,
        resolved_path: absPath,
      };
    }

    return {
      authorized: false,
      mode: AUTHORITY_MODE.DENY,
      reason: "PATH_OUTSIDE_ALLOWED_ENVELOPE_SCOPE",
      resolved_path: absPath,
    };
  }

  /**
   * Evaluate whether a command execution is authorized.
   */
  evaluateExecution({ command, args = [] }) {
    if (!this.envelope) {
      return { authorized: false, mode: AUTHORITY_MODE.DENY, reason: "NO_ENVELOPE_LOADED" };
    }

    const execPermissions = (this.envelope.permissions ?? []).filter(
      (p) => p.domain === DOMAIN.EXECUTION || p.domain === "execution" || p.action?.startsWith("execution.")
    );

    for (const rule of execPermissions) {
      const mode = rule.mode ?? rule.authority_mode ?? rule.decision;
      if (mode === AUTHORITY_MODE.DENY || mode === "DENY") {
        if (this._commandMatches(command, rule.resource ?? rule.resource_pattern ?? rule.path_pattern ?? "*")) {
          return { authorized: false, mode: AUTHORITY_MODE.DENY, reason: `EXPLICIT_EXEC_DENY: ${command}` };
        }
      }
    }

    for (const rule of execPermissions) {
      const mode = rule.mode ?? rule.authority_mode ?? rule.decision;
      if (mode === AUTHORITY_MODE.AUTO_ALLOW || mode === "AUTO_ALLOW") {
        if (this._commandMatches(command, rule.resource ?? rule.resource_pattern ?? rule.path_pattern ?? "*")) {
          return { authorized: true, mode: AUTHORITY_MODE.AUTO_ALLOW, reason: `EXEC_AUTHORIZED: ${command}` };
        }
      }
    }

    return { authorized: false, mode: AUTHORITY_MODE.DENY, reason: "COMMAND_NOT_EXPLICITLY_ALLOWED" };
  }

  _pathMatchesPattern(targetPath, pattern) {
    if (pattern === "*" || pattern === "**") return true;
    const normTarget = normalize(resolve(this.root_dir, targetPath));
    
    // Handle glob prefix or directory scope
    let cleanPattern = pattern;
    if (cleanPattern.endsWith("/**")) cleanPattern = cleanPattern.slice(0, -3);
    if (cleanPattern.endsWith("/*")) cleanPattern = cleanPattern.slice(0, -2);
    
    const absPattern = isAbsolute(cleanPattern) ? resolve(cleanPattern) : resolve(this.root_dir, cleanPattern);

    console.log(`Matching target: "${normTarget}" vs pattern: "${absPattern}"`);

    if (normTarget === absPattern) return true;
    if (normTarget.startsWith(absPattern + "/")) return true;
    if (absPattern.endsWith("/") && normTarget.startsWith(absPattern)) return true;

    return false;
  }

  _actionMatchesRule(action, rule) {
    // Check both canonical 'operation' and legacy 'action' field names
    const op = rule.operation ?? rule.action;
    if (!op || op === "*" || op === "all") return true;
    if (Array.isArray(op)) return op.includes(action);
    if (op.includes(action)) return true;
    if (action === "write" && (op.includes("create") || op.includes("modify"))) return true;
    if (action === "read" && (op.includes("view") || op.includes("list"))) return true;
    return false;
  }

  _commandMatches(command, pattern) {
    if (!pattern || pattern === "*") return true;
    return command.includes(pattern);
  }
}

export function createCapabilityGateway(config) {
  return new CapabilityGateway(config);
}
