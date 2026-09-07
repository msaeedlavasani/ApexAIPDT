/**
 * Canonical autonomous admission loop.
 * VALID_TERMINAL_BOUNDARY -> DURABLE_COMMIT -> INDEPENDENT_VERIFICATION
 * -> DAG_RECALCULATION -> NEXT_ADMISSIBLE_SELECTION -> AUTHORITY_DERIVATION
 * -> EXECUTION -> REPEAT
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const LoopOutcome = Object.freeze({
  EXHAUSTED_GRAPH: 'EXHAUSTED_GRAPH',
  GENUINE_HUMAN_GATE: 'GENUINE_HUMAN_GATE',
  PROVEN_BLOCKER: 'PROVEN_BLOCKER',
  AUTONOMOUS_LOOP_FAILURE: 'AUTONOMOUS_LOOP_FAILURE'
});

const TERMINAL = new Set(['CLOSED', 'BLOCKED', 'CANCELLED', 'REVOKED']);

export class AutonomousAdmissionLoop {
  constructor({ tasks, storageDir = '.dpt/autonomous-loop', maxRetries = 2,
    authority = () => ({ allowed: true }), verify = defaultVerify,
    execute = async task => ({ task_id: task.task_id, success: true }),
    failureInjection = {} } = {}) {
    if (!Array.isArray(tasks)) throw new Error('tasks are required');
    this.tasks = tasks.map(t => ({ status: 'BACKLOG', dependencies: [], ...t }));
    this.storageDir = storageDir;
    this.stateFile = join(storageDir, 'loop-state.json');
    this.eventFile = join(storageDir, 'events.jsonl');
    this.maxRetries = maxRetries;
    this.authority = authority;
    this.verify = verify;
    this.execute = execute;
    this.failureInjection = { ...failureInjection };
    this.state = this.load();
  }

  load() {
    if (!existsSync(this.stateFile)) return { revision: 0, phase: 'REHYDRATED', tasks: {}, retries: {}, admitted: null, outcome: null };
    const saved = JSON.parse(readFileSync(this.stateFile, 'utf8'));
    for (const task of this.tasks) if (saved.tasks[task.task_id]) Object.assign(task, saved.tasks[task.task_id]);
    return saved;
  }

  persist(event, data = {}) {
    mkdirSync(this.storageDir, { recursive: true });
    this.state.revision++;
    this.state.phase = event;
    this.state.tasks = Object.fromEntries(this.tasks.map(t => [t.task_id, { status: t.status, dependencies: t.dependencies, human_gate: t.human_gate } ]));
    writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
    const line = JSON.stringify({ revision: this.state.revision, event, ...data });
    writeFileSync(this.eventFile, (existsSync(this.eventFile) ? readFileSync(this.eventFile, 'utf8') : '') + line + '\n');
    if (this.failureInjection[event]) { delete this.failureInjection[event]; throw new Error(`INJECTED_CRASH:${event}`); }
  }

  readyTasks() {
    return this.tasks.filter(t => (t.status === 'BACKLOG' || t.status === 'READY') &&
      (t.dependencies || []).every(id => this.tasks.find(d => d.task_id === id)?.status === 'CLOSED'))
      .sort((a, b) => String(a.task_id).localeCompare(String(b.task_id)));
  }

  select(tasks) {
    // Canonical deterministic tie-break: explicit priority, then stable task identity.
    return [...tasks].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0) || a.task_id.localeCompare(b.task_id))[0];
  }

  async step() {
    // Rehydration makes crashes before admission/execution resumable.
    if (this.state.admitted) {
      const task = this.tasks.find(t => t.task_id === this.state.admitted.task_id);
      if (task && task.status !== 'CLOSED' && task.status !== 'REVOKED') return this.executeAdmitted(task);
      this.state.admitted = null;
      this.persist('ADMISSION_RECONCILED');
    }

    const terminal = this.tasks.filter(t => TERMINAL.has(t.status));
    if (terminal.length) this.persist('DURABLE_COMMIT', { task_ids: terminal.map(t => t.task_id) });
    this.verify(this.tasks);
    this.persist('INDEPENDENT_VERIFICATION');
    const ready = this.readyTasks();
    this.persist('DAG_RECALCULATION', { ready: ready.map(t => t.task_id) });
    if (!ready.length) {
      const gated = this.tasks.find(t => t.human_gate === true && !TERMINAL.has(t.status));
      this.state.outcome = gated ? LoopOutcome.GENUINE_HUMAN_GATE :
        (this.tasks.some(t => t.status === 'BLOCKED') ? LoopOutcome.PROVEN_BLOCKER : LoopOutcome.EXHAUSTED_GRAPH);
      this.persist(this.state.outcome);
      return this.state.outcome;
    }
    const task = this.select(ready);
    if (task.human_gate === true) {
      this.state.outcome = LoopOutcome.GENUINE_HUMAN_GATE;
      this.persist(this.state.outcome, { task_id: task.task_id });
      return this.state.outcome;
    }
    this.state.admitted = { task_id: task.task_id, revision: this.state.revision + 1 };
    this.persist('ADMISSION', { task_id: task.task_id });
    return this.executeAdmitted(task);
  }

  async executeAdmitted(task) {
    const decision = await this.authority(task);
    this.persist('AUTHORITY_DERIVATION', { task_id: task.task_id, allowed: decision.allowed });
    if (!decision.allowed) {
      task.status = 'REVOKED';
      this.state.admitted = null;
      this.persist('REVOKED', { task_id: task.task_id });
      return this.step();
    }
    task.status = 'RUNNING';
    this.persist('EXECUTION_STARTED', { task_id: task.task_id });
    try {
      const result = await this.execute(task);
      if (!result?.success) throw new Error(result?.error || 'provider failure');
      task.status = 'CLOSED';
      this.state.admitted = null;
      this.persist('TASK_CLOSED', { task_id: task.task_id });
      return this.step();
    } catch (error) {
      task.status = 'BACKLOG';
      const count = (this.state.retries[task.task_id] || 0) + 1;
      this.state.retries[task.task_id] = count;
      this.state.admitted = null;
      this.persist('PROVIDER_FAILURE', { task_id: task.task_id, retry: count, error: error.message });
      if (count <= this.maxRetries) return this.step();
      task.status = 'BLOCKED';
      this.persist('RETRY_EXHAUSTED', { task_id: task.task_id });
      this.state.outcome = LoopOutcome.PROVEN_BLOCKER;
      this.persist(this.state.outcome, { task_id: task.task_id });
      return this.state.outcome;
    }
  }

  async run() {
    try { return await this.step(); }
    catch (error) { this.state.outcome = LoopOutcome.AUTONOMOUS_LOOP_FAILURE; this.persist(this.state.outcome, { error: error.message }); return this.state.outcome; }
  }
}

function defaultVerify(tasks) {
  for (const task of tasks) if (task.status === 'CLOSED' && task.verification === false) throw new Error(`INDEPENDENT_VERIFICATION_FAILED:${task.task_id}`);
}

export function createAutonomousAdmissionLoop(config) { return new AutonomousAdmissionLoop(config); }

/** Rehydrate and continue across durable nonterminal attempt boundaries. */
export async function continueAutonomously(config = {}, { maxAttempts = 10 } = {}) {
  let attempts = 0;
  let nextConfig = { ...config };
  while (attempts < maxAttempts) {
    attempts++;
    const loop = createAutonomousAdmissionLoop(nextConfig);
    const outcome = await loop.run();
    if (outcome !== LoopOutcome.AUTONOMOUS_LOOP_FAILURE) return { outcome, attempts, loop };
    const hasWork = loop.tasks.some(task => !TERMINAL.has(task.status) &&
      (task.status === 'READY' || task.status === 'BACKLOG' || task.status === 'RUNNING'));
    if (!hasWork) return { outcome, attempts, loop };
    nextConfig = { ...nextConfig, failureInjection: {} };
  }
  return { outcome: LoopOutcome.AUTONOMOUS_LOOP_FAILURE, attempts };
}
