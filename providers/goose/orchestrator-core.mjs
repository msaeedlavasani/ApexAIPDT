/**
 * DPT-FOUNDATION-023 — Provider-Neutral Orchestrator Core (V1 Runtime)
 * Implements Execution Control Model entity pipeline.
 */
export class OrchestratorCore {
  constructor({ tasks, memory, workflow, qualityGate } = {}) {
    this.tasks = tasks || new Map();
    this.memory = memory || null;
    this.workflow = workflow || null;
    this.qualityGate = qualityGate || null;
    this.auditLog = [];
  }
  async computeReadiness(task, tasksMap = this.tasks) {
    const deps = task.dependencies || [];
    if (deps.length === 0) return { ready: true, blockers: [] };
    const blockers = [];
    for (const depId of deps) {
      const dep = tasksMap.get(depId);
      if (!dep) { blockers.push({ id: depId, reason: 'MISSING' }); continue; }
      if (dep.status !== 'CLOSED') { blockers.push({ id: depId, reason: dep.status }); }
    }
    return { ready: blockers.length === 0, blockers };
  }
  async materializeAuthority(task, envelope) {
    if (!envelope || !task?.task_id) return { authorized: false, reason: 'INVALID_INPUT', mode: 'DENY' };
    if (envelope.status === 'REVOKED') return { authorized: false, reason: 'ENVELOPE_REVOKED', mode: 'DENY' };
    const permitted = new Set(envelope.permissions?.map(p => p.domain) || []);
    const unauthorized = (task.resource_claims || []).filter(c => !permitted.has(c.domain));
    if (unauthorized.length > 0) return { authorized: false, reason: 'UNAUTHORIZED_CLAIMS', mode: 'DENY' };
    return { authorized: true, reason: 'POLICY_OK', mode: envelope.authority_mode || 'AUTO_ALLOW' };
  }
  async validateDAG(tasksMap = this.tasks) {
    const visited = new Set(), inStack = new Set();
    const dfs = (id) => {
      if (inStack.has(id)) return false;
      if (visited.has(id)) return true;
      visited.add(id); inStack.add(id);
      const task = tasksMap.get(id);
      for (const dep of (task?.dependencies || [])) { if (!dfs(dep)) return false; }
      inStack.delete(id); return true;
    };
    for (const id of tasksMap.keys()) { if (!visited.has(id) && !dfs(id)) return false; }
    return true;
  }
  async computeV1Readiness() {
    const v1 = ['DPT-FOUNDATION-023','DPT-FOUNDATION-024','DPT-FOUNDATION-025','DPT-FOUNDATION-026','DPT-FOUNDATION-027','DPT-FOUNDATION-028','DPT-FOUNDATION-029'];
    const proven = v1.filter(id => { const t = this.tasks.get(id); return t && t.status === 'CLOSED' && t.runtime_proven === true; });
    return { v1_complete: proven.length === v1.length, tasks_checked: v1.length, tasks_proven: proven.length };
  }
  recordAudit(e) { this.auditLog.push({ ...e, at: new Date().toISOString() }); }
  getAuditLog() { return [...this.auditLog]; }
}
export function createOrchestratorCore(c) { return new OrchestratorCore(c); }
