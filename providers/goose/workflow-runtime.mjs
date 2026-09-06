/**
 * DPT-FOUNDATION-026 — Workflow State Management (V1 Runtime)
 * Deterministic state machine: BACKLOG -> READY -> RUNNING -> REWORK -> CLOSED
 */
export const WORKFLOW_STATES = Object.freeze({ BACKLOG: 'BACKLOG', READY: 'READY', RUNNING: 'RUNNING', REWORK: 'REWORK', CLOSED: 'CLOSED' });
export const VALID_TRANSITIONS = Object.freeze({
  BACKLOG: ['READY', 'CLOSED'], READY: ['RUNNING', 'CLOSED'],
  RUNNING: ['REWORK', 'CLOSED'], REWORK: ['RUNNING', 'CLOSED'], CLOSED: []
});
export class WorkflowRuntime {
  constructor({ initial = 'BACKLOG' } = {}) { this.currentState = initial; this.history = [{ state: initial, at: new Date().toISOString(), event: 'INIT' }]; }
  transition(nextState) {
    const valid = VALID_TRANSITIONS[this.currentState] || [];
    if (!valid.includes(nextState)) {
      throw new Error('Invalid transition: ' + this.currentState + ' -> ' + nextState);
    }
    const r = { from: this.currentState, to: nextState, at: new Date().toISOString() };
    this.history.push(r); this.currentState = nextState; return r;
  }
  canTransition(s) { return (VALID_TRANSITIONS[this.currentState] || []).includes(s); }
  getState() { return this.currentState; }
  getHistory() { return [...this.history]; }
  isTerminal() { return this.currentState === 'CLOSED'; }
}
export function createWorkflowRuntime(c) { return new WorkflowRuntime(c); }
