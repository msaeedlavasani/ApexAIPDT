/**
 * Tests for Governed Project Execution (V3-006)
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'url';
import {
  createExecution,
  setHumanGate,
  startExecution,
  completeExecution,
  checkAuthorization,
  getExecution,
  listExecutions,
  getAuthorityModes,
  getHumanGateStates
} from './governed-execution.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

describe('Governed Project Execution', () => {
  it('should create execution with default OBSERVE mode', async () => {
    const exec = createExecution('test-project');
    assert.ok(exec.execution_id.startsWith('EXEC-'));
    assert.equal(exec.authority_mode, 0); // OBSERVE
    assert.equal(exec.status, 'INITIALIZED');
    assert.equal(exec.human_gate_state, 'NONE');
  });

  it('should create execution with specified authority mode', async () => {
    const exec = createExecution('test-project', 3);
    assert.equal(exec.authority_mode, 3); // MANAGED_EXECUTION
  });

  it('should reject invalid authority mode', async () => {
    assert.throws(() => {
      createExecution('test-project', 6);
    }, /Invalid authority mode/);
  });

  it('should enforce observe mode restrictions', async () => {
    const exec = createExecution('test-project', 0);
    const result = checkAuthorization(exec.execution_id, 'read_file');
    assert.equal(result.authorized, true);
    
    const writeResult = checkAuthorization(exec.execution_id, 'write_file');
    assert.equal(writeResult.authorized, false);
    assert.ok(writeResult.reason.includes('read-only'));
  });

  it('should enforce advise mode restrictions', async () => {
    const exec = createExecution('test-project', 1);
    const result = checkAuthorization(exec.execution_id, 'analyze');
    assert.equal(result.authorized, true);
    
    const createResult = checkAuthorization(exec.execution_id, 'create_resource');
    assert.equal(createResult.authorized, false);
    assert.ok(createResult.reason.includes('advisory'));
  });

  it('should block assisted execution for major actions', async () => {
    const exec = createExecution('test-project', 2);
    const deployResult = checkAuthorization(exec.execution_id, 'deploy');
    assert.equal(deployResult.authorized, false);
    assert.ok(deployResult.reason.includes('approval gate'));
  });

  it('should enforce human gate requirement', async () => {
    const exec = createExecution('test-project', 4);
    setHumanGate(exec.execution_id, 'HG-01_REQUIRED');
    
    const result = checkAuthorization(exec.execution_id, 'read_file');
    assert.equal(result.authorized, false);
    assert.ok(result.reason.includes('Human gate'));
  });

  it('should prevent starting execution with unresolved human gate', async () => {
    const exec = createExecution('test-project', 3);
    setHumanGate(exec.execution_id, 'HG-01_REQUIRED');
    
    assert.throws(() => {
      startExecution(exec.execution_id);
    }, /human gate pending/);
  });

  it('should complete execution lifecycle', async () => {
    const exec = createExecution('test-project', 3);
    const started = startExecution(exec.execution_id);
    assert.equal(started.status, 'RUNNING');
    
    const completed = completeExecution(exec.execution_id);
    assert.equal(completed.status, 'COMPLETED');
  });

  it('should return null for non-existent execution', async () => {
    const result = getExecution('EXEC-NONEXISTENT');
    assert.equal(result, null);
  });

  it('should list executions', async () => {
    createExecution('project-a');
    createExecution('project-b');
    
    const list = listExecutions();
    assert.ok(list.length >= 2);
  });

  it('should define correct authority modes', async () => {
    const modes = getAuthorityModes();
    assert.equal(modes.OBSERVE, 0);
    assert.equal(modes.ADVISE, 1);
    assert.equal(modes.ASSISTED_EXECUTION, 2);
    assert.equal(modes.MANAGED_EXECUTION, 3);
    assert.equal(modes.AUTONOMOUS_WITHIN_POLICY, 4);
    assert.equal(modes.DELEGATED_AUTONOMY, 5);
  });

  it('should define correct human gate states', async () => {
    const gates = getHumanGateStates();
    assert.equal(gates.NONE, 'NONE');
    assert.equal(gates.HG_01_REQUIRED, 'HG-01_REQUIRED');
    assert.equal(gates.HG_02_REQUIRED, 'HG-02_REQUIRED');
    assert.equal(gates.PENDING_REVIEW, 'PENDING_REVIEW');
  });

  it('full lifecycle: create → gate → resolve → run → complete', async () => {
    const exec = createExecution('external-project', 4);
    setHumanGate(exec.execution_id, 'HG-01_REQUIRED');
    assert.equal(exec.human_gate_state, 'HG-01_REQUIRED');
    
    setHumanGate(exec.execution_id, 'NONE');
    const started = startExecution(exec.execution_id);
    assert.equal(started.status, 'RUNNING');
    
    const completed = completeExecution(exec.execution_id);
    assert.equal(completed.status, 'COMPLETED');
  });
});

console.log('Running Governed Execution tests...\n');
