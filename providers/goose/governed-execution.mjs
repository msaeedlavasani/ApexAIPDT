/**
 * Governed Project Execution Module (V3-006)
 * 
 * Implements authority modes 0-5 operational with Human Gate enforcement
 * for external project interactions.
 */

import { randomUUID } from 'crypto';

const AUTHORITY_MODES = {
  OBSERVE: 0,
  ADVISE: 1,
  ASSISTED_EXECUTION: 2,
  MANAGED_EXECUTION: 3,
  AUTONOMOUS_WITHIN_POLICY: 4,
  DELEGATED_AUTONOMY: 5
};

const HUMAN_GATE_STATES = {
  NONE: 'NONE',
  HG_01_REQUIRED: 'HG-01_REQUIRED',
  HG_02_REQUIRED: 'HG-02_REQUIRED',
  PENDING_REVIEW: 'PENDING_REVIEW'
};

const EXECUTION_STATUSES = {
  INITIALIZED: 'INITIALIZED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  ESCALATED: 'ESCALATED',
  REVOKED: 'REVOKED'
};

/** In-memory store (would be persistent in production) */
const executions = new Map();

/**
 * Create a new governed execution
 */
export function createExecution(projectId, authorityMode = AUTHORITY_MODES.OBSERVE) {
  const executionId = 'EXEC-' + randomUUID().replace(/-/g, '').toUpperCase().slice(0, 8);
  
  // Validate authority mode
  if (authorityMode < 0 || authorityMode > 5) {
    throw new Error(`Invalid authority mode: ${authorityMode}. Must be 0-5.`);
  }
  
  const execution = {
    execution_id: executionId,
    authority_mode: authorityMode,
    project_id: projectId,
    human_gate_state: HUMAN_GATE_STATES.NONE,
    status: EXECUTION_STATUSES.INITIALIZED,
    delegation_chain: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  executions.set(executionId, execution);
  return execution;
}

/**
 * Set human gate state for an execution
 */
export function setHumanGate(executionId, gateState) {
  const exec = executions.get(executionId);
  if (!exec) {
    throw new Error(`Execution not found: ${executionId}`);
  }
  
  exec.human_gate_state = gateState;
  exec.updated_at = new Date().toISOString();
  return exec;
}

/**
 * Start execution (requires no human gate or gate resolved)
 */
export function startExecution(executionId) {
  const exec = executions.get(executionId);
  if (!exec) {
    throw new Error(`Execution not found: ${executionId}`);
  }
  
  if (exec.human_gate_state !== HUMAN_GATE_STATES.NONE) {
    throw new Error(`Cannot start execution: human gate pending (${exec.human_gate_state})`);
  }
  
  exec.status = EXECUTION_STATUSES.RUNNING;
  exec.updated_at = new Date().toISOString();
  return exec;
}

/**
 * Complete execution
 */
export function completeExecution(executionId) {
  const exec = executions.get(executionId);
  if (!exec) {
    throw new Error(`Execution not found: ${executionId}`);
  }
  
  if (exec.status !== EXECUTION_STATUSES.RUNNING) {
    throw new Error(`Cannot complete execution: not in RUNNING state`);
  }
  
  exec.status = EXECUTION_STATUSES.COMPLETED;
  exec.updated_at = new Date().toISOString();
  return exec;
}

/**
 * Check if action is authorized at current authority mode
 */
export function checkAuthorization(executionId, action) {
  const exec = executions.get(executionId);
  if (!exec) {
    throw new Error(`Execution not found: ${executionId}`);
  }
  
  // Mode 0 (Observe): read-only
  if (exec.authority_mode === AUTHORITY_MODES.OBSERVE) {
    if (!action.startsWith('read') && action !== 'list') {
      return { authorized: false, reason: 'Mode 0: read-only operations only' };
    }
  }
  
  // Mode 1 (Advise): analysis only, no writes
  if (exec.authority_mode === AUTHORITY_MODES.ADVISE) {
    if (action.includes('write') || action.includes('create') || action.includes('delete')) {
      return { authorized: false, reason: 'Mode 1: advisory operations only' };
    }
  }
  
  // Modes 2+ allow more operations with appropriate gates
  // Mode 2 requires approval for major actions
  if (exec.authority_mode === AUTHORITY_MODES.ASSISTED_EXECUTION) {
    if (['deploy', 'destroy', 'migrate'].includes(action)) {
      return { authorized: false, reason: 'Mode 2: major actions require approval gate' };
    }
  }
  
  // Human gate check
  if (exec.human_gate_state !== HUMAN_GATE_STATES.NONE) {
    return { authorized: false, reason: `Human gate pending: ${exec.human_gate_state}` };
  }
  
  return { authorized: true, mode: exec.authority_mode, action };
}

/**
 * Get execution status
 */
export function getExecution(executionId) {
  return executions.get(executionId) || null;
}

/**
 * List all executions
 */
export function listExecutions() {
  return Array.from(executions.values());
}

/**
 * List available authority modes
 */
export function getAuthorityModes() {
  return AUTHORITY_MODES;
}

/**
 * List human gate states
 */
export function getHumanGateStates() {
  return HUMAN_GATE_STATES;
}

export default {
  createExecution,
  setHumanGate,
  startExecution,
  completeExecution,
  checkAuthorization,
  getExecution,
  listExecutions,
  getAuthorityModes,
  getHumanGateStates
};
