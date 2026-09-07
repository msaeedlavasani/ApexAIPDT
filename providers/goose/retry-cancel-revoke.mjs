/**
 * Retry/Cancel/Revocation Runtime — ADR-036
 * 
 * Precedence: REVOCATION > CANCELLATION > RETRY at all times
 * Effect Recovery Contract (F-302): idempotent/replay-safe/reversible/compensatable/irreversible taxonomy
 */

import { randomUUID } from 'node:crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { 
  checkLease, 
  revokeLease, 
  cancelLease, 
  LeaseState,
  Precedence 
} from './lease-enforcement.mjs';

const CONTROL_DIR = '.dpt/control';
const CONTROL_FILE = join(CONTROL_DIR, 'control.json');

/**
 * Effect Recovery Taxonomy (F-302)
 */
export const EffectType = {
  IDEMPOTENT: 'IDEMPOTENT',           // Safe to replay
  REPLAY_SAFE: 'REPLAY_SAFE',         // Safe to replay with dedup
  REVERSIBLE: 'REVERSIBLE',           // Can be undone with compensation
  COMPENSATABLE: 'COMPENSATABLE',     // Has compensation action
  IRREVERSIBLE: 'IRREVERSIBLE'        // Cannot be undone
};

/**
 * Initialize control state
 */
export function initControl() {
  mkdirSync(CONTROL_DIR, { recursive: true });
  
  if (!existsSync(CONTROL_FILE)) {
    writeFileSync(CONTROL_FILE, JSON.stringify({
      version: 1,
      controls: {},
      event_log: []
    }, null, 2));
  }
  
  return { initialized: true };
}

/**
 * Read control state
 */
export function readControl() {
  if (!existsSync(CONTROL_FILE)) {
    initControl();
  }
  return JSON.parse(readFileSync(CONTROL_FILE, 'utf8'));
}

/**
 * Submit retry — lowest precedence
 */
export function submitRetry(attemptId, reason, effectType = EffectType.IDEMPOTENT) {
  const control = readControl();
  const controlId = randomUUID();
  
  const controlRecord = {
    control_id: controlId,
    attempt_id: attemptId,
    type: Precedence.RETRY,
    reason,
    effect_type: effectType,
    status: 'PENDING',
    created_at: new Date().toISOString(),
    executed_at: null,
    precedence: Precedence.RETRY
  };
  
  control.controls[controlId] = controlRecord;
  control.event_log.push({
    type: 'RETRY_SUBMITTED',
    control_id: controlId,
    attempt_id: attemptId,
    timestamp: new Date().toISOString()
  });
  
  writeFileSync(CONTROL_FILE, JSON.stringify(control, null, 2));
  
  return controlRecord;
}

/**
 * Submit cancellation — middle precedence
 */
export function submitCancellation(attemptId, reason, effectType = EffectType.IDEMPOTENT) {
  const control = readControl();
  const controlId = randomUUID();
  
  const controlRecord = {
    control_id: controlId,
    attempt_id: attemptId,
    type: Precedence.CANCELLATION,
    reason,
    effect_type: effectType,
    status: 'PENDING',
    created_at: new Date().toISOString(),
    executed_at: null,
    precedence: Precedence.CANCELLATION
  };
  
  control.controls[controlId] = controlRecord;
  control.event_log.push({
    type: 'CANCELLATION_SUBMITTED',
    control_id: controlId,
    attempt_id: attemptId,
    timestamp: new Date().toISOString()
  });
  
  writeFileSync(CONTROL_FILE, JSON.stringify(control, null, 2));
  
  return controlRecord;
}

/**
 * Submit revocation — highest precedence
 */
export function submitRevocation(attemptId, revokerId, reason, effectType = EffectType.IRREVERSIBLE) {
  const control = readControl();
  const controlId = randomUUID();
  
  const controlRecord = {
    control_id: controlId,
    attempt_id: attemptId,
    type: Precedence.REVOCATION,
    reason,
    effect_type: effectType,
    revoker_id: revokerId,
    status: 'PENDING',
    created_at: new Date().toISOString(),
    executed_at: null,
    precedence: Precedence.REVOCATION
  };
  
  control.controls[controlId] = controlRecord;
  control.event_log.push({
    type: 'REVOCATION_SUBMITTED',
    control_id: controlId,
    attempt_id: attemptId,
    revoker_id: revokerId,
    timestamp: new Date().toISOString()
  });
  
  writeFileSync(CONTROL_FILE, JSON.stringify(control, null, 2));
  
  return controlRecord;
}

/**
 * Execute controls respecting precedence: REVOCATION > CANCELLATION > RETRY
 */
export function executeControls(attemptId) {
  const control = readControl();
  const attemptControls = Object.values(control.controls)
    .filter(c => c.attempt_id === attemptId && c.status === 'PENDING');
  
  if (attemptControls.length === 0) {
    return { executed: [], has_blocking: false };
  }
  
  // Sort by precedence: REVOCATION > CANCELLATION > RETRY
  const precedenceOrder = {
    [Precedence.REVOCATION]: 3,
    [Precedence.CANCELLATION]: 2,
    [Precedence.RETRY]: 1
  };
  
  attemptControls.sort((a, b) => precedenceOrder[b.precedence] - precedenceOrder[a.precedence]);
  
  const executed = [];
  let blockingFound = false;
  
  for (const ctrl of attemptControls) {
    if (blockingFound) {
      // Lower precedence controls are blocked by higher precedence
      ctrl.status = 'BLOCKED';
      executed.push({ ...ctrl, blocked_by: 'higher_precedence_control' });
      continue;
    }
    
    ctrl.status = 'EXECUTING';
    ctrl.executed_at = new Date().toISOString();
    
    // Execute based on type
    if (ctrl.type === Precedence.REVOCATION) {
      // Revocation takes precedence — mark all others as blocked
      blockingFound = true;
      executed.push({ ...ctrl, result: 'REVOKED' });
    } else if (ctrl.type === Precedence.CANCELLATION) {
      // Cancellation also blocks lower precedence controls
      blockingFound = true;
      executed.push({ ...ctrl, result: 'CANCELLED' });
    } else if (ctrl.type === Precedence.RETRY) {
      executed.push({ ...ctrl, result: 'RETRIED' });
    }
  }
  
  // Update all controls
  for (const ctrl of attemptControls) {
    control.controls[ctrl.control_id] = ctrl;
  }
  
  writeFileSync(CONTROL_FILE, JSON.stringify(control, null, 2));
  
  return { executed, has_blocking: blockingFound };
}

/**
 * Execute revocation with lease check
 */
export function executeRevocation(attemptId, leaseId, fencingToken, revokerId, reason) {
  // First verify lease
  const leaseCheck = checkLease(leaseId, fencingToken);
  if (!leaseCheck.valid) {
    return { success: false, reason: `Lease invalid: ${leaseCheck.reason}` };
  }
  
  // Execute revocation
  revokeLease(leaseId, revokerId, reason);
  
  // Submit and execute revocation control
  const ctrl = submitRevocation(attemptId, revokerId, reason);
  const result = executeControls(attemptId);
  
  return { success: true, control: ctrl, execution: result };
}

/**
 * Check if effect can be compensated
 */
export function canCompensate(effectType) {
  return [EffectType.REVERSIBLE, EffectType.COMPENSATABLE].includes(effectType);
}

/**
 * Get compensation action for effect type
 */
export function getCompensationAction(effectType, effectId) {
  switch (effectType) {
    case EffectType.IDEMPOTENT:
      return { action: 'NOOP', description: 'Idempotent effects are safe to ignore' };
    case EffectType.REPLAY_SAFE:
      return { action: 'DEDUP_CHECK', description: 'Verify no duplicate effect via dedup key' };
    case EffectType.REVERSIBLE:
      return { action: 'REVERSE', description: 'Execute reverse operation' };
    case EffectType.COMPENSATABLE:
      return { action: 'COMPENSATE', description: `Execute compensation for ${effectId}` };
    case EffectType.IRREVERSIBLE:
      return { action: 'ACCEPT_LOSS', description: 'Effect cannot be reversed — accept loss' };
    default:
      return { action: 'UNKNOWN', description: 'Unknown effect type' };
  }
}

/**
 * Get precedence summary for an attempt
 */
export function getPrecedenceSummary(attemptId) {
  const control = readControl();
  const attempts = Object.values(control.controls)
    .filter(c => c.attempt_id === attemptId);
  
  const hasRevocation = attempts.some(c => c.type === Precedence.REVOCATION && c.status !== 'BLOCKED');
  const hasCancellation = attempts.some(c => c.type === Precedence.CANCELLATION && c.status !== 'BLOCKED');
  const hasRetry = attempts.some(c => c.type === Precedence.RETRY && c.status !== 'BLOCKED');
  
  return {
    attempt_id: attemptId,
    has_revocation: hasRevocation,
    has_cancellation: hasCancellation,
    has_retry: hasRetry,
    effective_action: hasRevocation ? 'REVOCATION' : hasCancellation ? 'CANCELLATION' : hasRetry ? 'RETRY' : 'NONE',
    precedence_applied: true  // REVOCATION > CANCELLATION > RETRY enforced by executeControls sorting
  };
}

export default {
  initControl,
  readControl,
  submitRetry,
  submitCancellation,
  submitRevocation,
  executeControls,
  executeRevocation,
  canCompensate,
  getCompensationAction,
  getPrecedenceSummary,
  EffectType,
  Precedence
};
