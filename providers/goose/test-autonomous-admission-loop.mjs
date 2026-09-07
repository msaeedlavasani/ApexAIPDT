import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAutonomousAdmissionLoop, LoopOutcome } from './autonomous-admission-loop.mjs';

const make = (tasks, extra = {}) => {
  const dir = mkdtempSync(join(tmpdir(), 'dpt-loop-'));
  const loop = createAutonomousAdmissionLoop({ tasks, storageDir: dir, ...extra });
  return { loop, dir };
};
const chain = () => [{ task_id: 'A', status: 'BACKLOG', dependencies: [] }, { task_id: 'B', status: 'BACKLOG', dependencies: ['A'] }];

test('crash after closure resumes next admission', async () => { const { loop, dir } = make(chain(), { failureInjection: { TASK_CLOSED: true } }); assert.equal(await loop.run(), LoopOutcome.EXHAUSTED_GRAPH); const resumed = createAutonomousAdmissionLoop({ tasks: chain(), storageDir: dir }); assert.equal(await resumed.run(), LoopOutcome.EXHAUSTED_GRAPH); rmSync(dir, { recursive: true, force: true }); });
test('crash after admission resumes execution', async () => { const { loop, dir } = make([{ task_id: 'A', status: 'BACKLOG', dependencies: [] }], { failureInjection: { ADMISSION: true } }); assert.equal(await loop.run(), LoopOutcome.AUTONOMOUS_LOOP_FAILURE); const resumed = createAutonomousAdmissionLoop({ tasks: [{ task_id: 'A', status: 'BACKLOG', dependencies: [] }], storageDir: dir }); assert.equal(await resumed.run(), LoopOutcome.EXHAUSTED_GRAPH); rmSync(dir, { recursive: true, force: true }); });
test('provider failure retries then continues', async () => { let calls = 0; const { loop, dir } = make([{ task_id: 'A', status: 'BACKLOG', dependencies: [] }], { execute: async () => (++calls > 1 ? { success: true } : { success: false, error: 'provider down' }) }); assert.equal(await loop.run(), LoopOutcome.EXHAUSTED_GRAPH); assert.equal(calls, 2); rmSync(dir, { recursive: true, force: true }); });
test('retry exhaustion is a proven blocker', async () => { const { loop, dir } = make([{ task_id: 'A', status: 'BACKLOG', dependencies: [] }], { maxRetries: 1, execute: async () => { throw Error('down'); } }); assert.equal(await loop.run(), LoopOutcome.PROVEN_BLOCKER); rmSync(dir, { recursive: true, force: true }); });
test('revoked authority is fail-closed and continues', async () => { const { loop, dir } = make([{ task_id: 'A', status: 'BACKLOG', dependencies: [] }], { authority: async () => ({ allowed: false }) }); assert.equal(await loop.run(), LoopOutcome.EXHAUSTED_GRAPH); assert.equal(loop.tasks[0].status, 'REVOKED'); rmSync(dir, { recursive: true, force: true }); });
test('competing READY tasks use deterministic selection', async () => { const order = []; const { loop, dir } = make([{ task_id: 'Z', status: 'READY', dependencies: [] }, { task_id: 'A', status: 'READY', dependencies: [] }], { execute: async t => { order.push(t.task_id); return { success: true }; } }); assert.equal(await loop.run(), LoopOutcome.EXHAUSTED_GRAPH); assert.deepEqual(order, ['A', 'Z']); rmSync(dir, { recursive: true, force: true }); });
test('no READY tasks is exhausted graph', async () => { const { loop, dir } = make([{ task_id: 'A', status: 'BACKLOG', dependencies: ['MISSING'] }]); assert.equal(await loop.run(), LoopOutcome.EXHAUSTED_GRAPH); rmSync(dir, { recursive: true, force: true }); });
test('genuine human gate stops only at consequential decision', async () => { const { loop, dir } = make([{ task_id: 'A', status: 'BACKLOG', dependencies: [], human_gate: true }]); assert.equal(await loop.run(), LoopOutcome.GENUINE_HUMAN_GATE); rmSync(dir, { recursive: true, force: true }); });
test('durable nonterminal checkpoint auto-admits next attempt', async () => { const dir = mkdtempSync(join(tmpdir(), 'dpt-loop-')); const tasks = chain(); const first = createAutonomousAdmissionLoop({ tasks, storageDir: dir, failureInjection: { ADMISSION: true } }); assert.equal(await first.run(), LoopOutcome.AUTONOMOUS_LOOP_FAILURE); const { continueAutonomously } = await import('./autonomous-admission-loop.mjs'); const { outcome, attempts } = await continueAutonomously({ tasks, storageDir: dir }); assert.equal(outcome, LoopOutcome.EXHAUSTED_GRAPH); assert.equal(attempts, 1); rmSync(dir, { recursive: true, force: true }); });
test('independent verification is required before closure', async () => { const { loop, dir } = make([{ task_id: 'A', status: 'CLOSED', dependencies: [], verification: false }]); assert.equal(await loop.run(), LoopOutcome.AUTONOMOUS_LOOP_FAILURE); rmSync(dir, { recursive: true, force: true }); });
