/**
 * Durable State Persistence Layer — Snapshot + Append-Only Event Log
 * 
 * Corrected persistence model:
 * - Attempt runtime/process is EPHEMERAL
 * - Attempt Record + Attempt Identity are DURABLE
 * - Supports unknown-outcome reconciliation, late-result rejection, retry lineage, idempotency/effect correlation
 */

import { randomUUID } from 'node:crypto';
import { writeFileSync, readFileSync, appendFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const PERSISTENCE_DIR = '.dpt/persistence';
const SNAPSHOT_FILE = join(PERSISTENCE_DIR, 'snapshot.json');
const EVENT_LOG_FILE = join(PERSISTENCE_DIR, 'events.log');

/**
 * Initialize persistence layer — create directories and empty snapshot
 */
export function initDurableState() {
  mkdirSync(PERSISTENCE_DIR, { recursive: true });
  
  const initial = {
    version: 1,
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    attempts: {},
    task_records: {},
    work_orders: {},
    event_count: 0
  };
  
  writeFileSync(SNAPSHOT_FILE, JSON.stringify(initial, null, 2));
  writeFileSync(EVENT_LOG_FILE, '');
  
  return { initialized: true, snapshot_path: SNAPSHOT_FILE, event_log_path: EVENT_LOG_FILE };
}

/**
 * Read current snapshot
 */
export function readSnapshot() {
  if (!existsSync(SNAPSHOT_FILE)) {
    initDurableState();
  }
  return JSON.parse(readFileSync(SNAPSHOT_FILE, 'utf8'));
}

/**
 * Append event to immutable log
 */
export function appendEvent(event) {
  const timestamp = new Date().toISOString();
  const eventData = { ...event, timestamp, event_id: randomUUID() };
  appendFileSync(EVENT_LOG_FILE, JSON.stringify(eventData) + '\n');
  
  // Update event_count in snapshot
  const snapshot = readSnapshot();
  snapshot.event_count++;
  snapshot.last_updated = new Date().toISOString();
  writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
  
  return eventData;
}

/**
 * Create or update Attempt Record (DURABLE identity)
 * Attempt runtime is ephemeral, but this record persists
 */
export function createAttemptRecord(taskId, workOrderId, attemptType = 'ATTEMPT') {
  const snapshot = readSnapshot();
  const attemptId = randomUUID();
  
  const attemptRecord = {
    attempt_id: attemptId,
    task_id: taskId,
    work_order_id: workOrderId,
    type: attemptType,
    state: 'STARTED',
    created_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
    fencing_token: randomUUID(),
    outcome: null,
    result: null,
    retried_from: null,
    lineage: []
  };
  
  snapshot.attempts[attemptId] = attemptRecord;
  snapshot.last_updated = new Date().toISOString();
  
  writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
  
  appendEvent({
    type: 'ATTEMPT_CREATED',
    attempt_id: attemptId,
    task_id: taskId,
    work_order_id: workOrderId,
    fencing_token: attemptRecord.fencing_token
  });
  
  return attemptRecord;
}

/**
 * Update attempt outcome — supports late-result rejection
 */
export function updateAttemptOutcome(attemptId, outcome, result) {
  const snapshot = readSnapshot();
  
  if (!snapshot.attempts[attemptId]) {
    throw new Error(`Attempt ${attemptId} not found in durable state`);
  }
  
  const attempt = snapshot.attempts[attemptId];
  const previousOutcome = attempt.outcome;
  
  // Late-result rejection: if already resolved, log as late but don't overwrite
  if (previousOutcome !== null && previousOutcome !== 'UNKNOWN') {
    appendEvent({
      type: 'LATE_RESULT_REJECTED',
      attempt_id: attemptId,
      received_outcome: outcome,
      existing_outcome: previousOutcome,
      rejected: true
    });
    return { accepted: false, reason: 'LATE_RESULT_REJECTED', existing_outcome: previousOutcome };
  }
  
  attempt.outcome = outcome;
  attempt.result = result;
  attempt.ended_at = new Date().toISOString();
  attempt.state = outcome === 'UNKNOWN' ? 'UNKNOWN_OUTCOME' : 'COMPLETED';
  snapshot.last_updated = new Date().toISOString();
  
  writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
  
  appendEvent({
    type: 'ATTEMPT_OUTCOME_UPDATED',
    attempt_id: attemptId,
    previous_outcome: previousOutcome,
    new_outcome: outcome,
    is_late: previousOutcome !== null && previousOutcome !== 'UNKNOWN'
  });
  
  return { accepted: true, outcome, result };
}

/**
 * Mark attempt as UNKNOWN_OUTCOME for later reconciliation
 */
export function markUnknownOutcome(attemptId) {
  return updateAttemptOutcome(attemptId, 'UNKNOWN', null);
}

/**
 * Create retry with lineage tracking
 */
export function createRetry(parentAttemptId, retryReason) {
  const snapshot = readSnapshot();
  const parent = snapshot.attempts[parentAttemptId];
  
  if (!parent) {
    throw new Error(`Parent attempt ${parentAttemptId} not found`);
  }
  
  // Create retry record directly (not via createAttemptRecord to avoid double-write)
  const attemptId = randomUUID();
  const fencingToken = randomUUID();
  const now = new Date().toISOString();
  
  const retryRecord = {
    attempt_id: attemptId,
    task_id: parent.task_id,
    work_order_id: parent.work_order_id,
    type: 'RETRY',
    state: 'STARTED',
    created_at: now,
    started_at: now,
    fencing_token: fencingToken,
    outcome: null,
    result: null,
    retried_from: parentAttemptId,
    lineage: [...(parent.lineage || []), parentAttemptId]
  };
  
  snapshot.attempts[attemptId] = retryRecord;
  snapshot.event_count++;
  snapshot.last_updated = now;
  
  // Track retry lineage in parent
  if (!parent.retry_lineage) {
    parent.retry_lineage = [];
  }
  parent.retry_lineage.push(attemptId);
  
  writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
  
  appendEvent({
    type: 'RETRY_CREATED',
    parent_attempt_id: parentAttemptId,
    retry_attempt_id: attemptId,
    reason: retryReason,
    lineage_depth: retryRecord.lineage.length
  });
  
  return retryRecord;
}

/**
 * Idempotency check — correlate effect by attempt_id
 */
export function checkIdempotency(attemptId) {
  const snapshot = readSnapshot();
  const attempt = snapshot.attempts[attemptId];
  
  if (!attempt) {
    return { exists: false, can_retry: true };
  }
  
  // If outcome is known, reject duplicate
  if (attempt.outcome !== null && attempt.outcome !== 'UNKNOWN') {
    return { 
      exists: true, 
      outcome: attempt.outcome, 
      can_retry: false,
      correlation: 'EFFECT_CORRELATED'
    };
  }
  
  // Unknown outcome or no outcome — may be reconciled
  return { 
    exists: true, 
    outcome: attempt.outcome, 
    can_retry: true,
    correlation: 'UNKNOWN_OUTCOME_RECONCILIATION_PENDING'
  };
}

/**
 * Simulate crash/restart — reload from snapshot
 */
export function recoverFromCrash() {
  const snapshot = readSnapshot();
  const eventsContent = existsSync(EVENT_LOG_FILE) ? readFileSync(EVENT_LOG_FILE, 'utf8') : '';
  const events = eventsContent.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
  
  return {
    recovered: true,
    snapshot_version: snapshot.version,
    attempt_count: Object.keys(snapshot.attempts).length,
    event_count: snapshot.event_count,
    total_events_in_log: events.length,
    events: events.slice(-10) // Last 10 events for verification
  };
}

/**
 * Reconcile unknown-outcome attempts
 */
export function reconcileUnknownOutcomes() {
  const snapshot = readSnapshot();
  const unknownAttempts = Object.entries(snapshot.attempts)
    .filter(([_, a]) => a.outcome === 'UNKNOWN')
    .map(([id, a]) => ({ attempt_id: id, ...a }));
  
  return {
    reconcilable_count: unknownAttempts.length,
    attempts: unknownAttempts
  };
}

// Cleanup helper for tests
export function cleanupPersistence() {
  try {
    if (existsSync(PERSISTENCE_DIR)) {
      unlinkSync(EVENT_LOG_FILE);
      unlinkSync(SNAPSHOT_FILE);
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}

// Export for testing
export default {
  initDurableState,
  readSnapshot,
  appendEvent,
  createAttemptRecord,
  updateAttemptOutcome,
  markUnknownOutcome,
  createRetry,
  checkIdempotency,
  recoverFromCrash,
  reconcileUnknownOutcomes,
  cleanupPersistence
};
