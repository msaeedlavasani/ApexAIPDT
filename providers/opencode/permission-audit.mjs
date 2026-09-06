/**
 * DPT-PROVIDER-004.C — Permission Audit Module
 *
 * Records every permission decision for the DPT audit trail.
 * Foundation for the future DPT permission audit system.
 */

export class PermissionAudit {
  constructor({ task_id, work_order_id, envelope_id }) {
    this.task_id = task_id;
    this.work_order_id = work_order_id;
    this.envelope_id = envelope_id;
    this.records = [];
  }

  /**
   * Record a permission decision.
   */
  record({
    actor,
    actor_role,
    operation,
    requested_scope,
    authorized_scope,
    materialized_rule,
    decision,
    source_policy,
    human_gate = false,
    provider_prompt = false,
    scope_widening = false,
  }) {
    this.records.push({
      task_id: this.task_id,
      work_order_id: this.work_order_id,
      envelope_id: this.envelope_id,
      actor,
      actor_role,
      operation,
      requested_scope,
      authorized_scope,
      materialized_rule,
      decision,
      source_policy,
      human_gate,
      provider_prompt,
      scope_widening,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get all records.
   */
  getRecords() {
    return [...this.records];
  }

  /**
   * Get records filtered by criteria.
   */
  query({ actor, decision, human_gate, provider_prompt, scope_widening } = {}) {
    return this.records.filter((r) => {
      if (actor !== undefined && r.actor !== actor) return false;
      if (decision !== undefined && r.decision !== decision) return false;
      if (human_gate !== undefined && r.human_gate !== human_gate) return false;
      if (provider_prompt !== undefined && r.provider_prompt !== provider_prompt) return false;
      if (scope_widening !== undefined && r.scope_widening !== scope_widening) return false;
      return true;
    });
  }

  /**
   * Check if any scope widening occurred.
   */
  hasScopeWidening() {
    return this.records.some((r) => r.scope_widening);
  }

  /**
   * Check if any manual permission grants were used.
   */
  hasManualGrants() {
    return this.records.some((r) => r.provider_prompt && r.decision !== "DPT_HUMAN_GATE");
  }

  /**
   * Generate summary statistics.
   */
  summary() {
    const total = this.records.length;
    const auto_allow = this.records.filter((r) => r.decision === "AUTO_ALLOW").length;
    const ask = this.records.filter((r) => r.decision === "ASK").length;
    const deny = this.records.filter((r) => r.decision === "DENY").length;
    const human_gates = this.records.filter((r) => r.human_gate).length;
    const provider_prompts = this.records.filter((r) => r.provider_prompt).length;
    const scope_widenings = this.records.filter((r) => r.scope_widening).length;

    return {
      total,
      auto_allow,
      ask,
      deny,
      human_gates,
      provider_prompts,
      scope_widenings,
      has_scope_widening: scope_widenings > 0,
      has_manual_grants: this.hasManualGrants(),
    };
  }

  /**
   * Export audit trail as JSON.
   */
  export() {
    return {
      task_id: this.task_id,
      work_order_id: this.work_order_id,
      envelope_id: this.envelope_id,
      summary: this.summary(),
      records: this.getRecords(),
    };
  }
}
