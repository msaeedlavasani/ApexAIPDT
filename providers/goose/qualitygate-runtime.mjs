/**
 * DPT-FOUNDATION-027 — Quality-Gate Execution (V1 Runtime)
 * Configurable predicate pipeline per ADR-025 (Verification is first-class).
 */
export class QualityGateRuntime {
  constructor({ gates = [] } = {}) { this.gates = gates; }
  async execute(task, result) {
    const relevant = this.gates.filter(g => g.applies_to.includes(task.task_class) || g.applies_to.includes('*'));
    const results = [];
    for (const gate of relevant) {
      try { const e = await gate.evaluate(result); results.push({ gate_id: gate.id, passed: e.passed, reason: e.reason }); }
      catch (err) { results.push({ gate_id: gate.id, passed: false, reason: err.message }); }
    }
    return { verified: results.every(r => r.passed), gates_executed: results.length, results };
  }
  addGate(g) { this.gates.push(g); }
  getGates() { return [...this.gates]; }
}
export function createQualityGateRuntime(c) { return new QualityGateRuntime(c); }
