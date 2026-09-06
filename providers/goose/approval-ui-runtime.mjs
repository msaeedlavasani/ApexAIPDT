/**
 * DPT-FOUNDATION-028 — Human Approval Interface (V1 Runtime)
 * Surfaces HG-01..HG-07 decisions. Building interface != approval event.
 */
const HG_PATTERNS = {
  'HG-01': /\b(merge|merging)\b.*\b(main|master|production)\b/i,
  'HG-02': /\b(deploy|deploying|release)\b.*\b(production|prod)\b/i,
  'HG-03': /\b(drop|truncate|delete)\b.*\b(table|database)\b/i,
  'HG-04': /\b(secret|credential)\b.*\b(expose|disclose|rotate)\b/i,
  'HG-05': /\b(permission|access)\b.*\b(escalat|grant.*elevat)\b/i,
  'HG-06': /\b(destruct|irrevers|remove.*permanent)\b/i,
  'HG-07': /\b(framework|architecture)\b.*\b(decision|change|restruktur)\b/i
};
export class ApprovalUIRuntime {
  constructor({ promptFn } = {}) { this.promptFn = promptFn || (async (d) => ({ action: 'approve', choice: d.choice_a })); }
  async presentDecision(decision) {
    return { hg_id: decision.hg_id || null, task_id: decision.task_id, question: decision.question, choice_a: decision.choice_a, choice_b: decision.choice_b, response: await this.promptFn(decision) };
  }
  evaluateHgMatch(taskId, operation) {
    const op = (operation || '').toLowerCase();
    for (const [hgId, p] of Object.entries(HG_PATTERNS)) { if (p.test(op)) return { match: hgId, task_id: taskId }; }
    return { match: null, task_id: taskId };
  }
  isHumanGate(taskId, operation) { return this.evaluateHgMatch(taskId, operation).match !== null; }
}
export function createApprovalUIRuntime(c) { return new ApprovalUIRuntime(c); }
