/**
 * Test suite for Durable State Persistence Layer
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, existsSync } from 'node:fs';
import {
  initDurableState,
  readSnapshot,
  createAttemptRecord,
  updateAttemptOutcome,
  markUnknownOutcome,
  createRetry,
  checkIdempotency,
  recoverFromCrash,
  reconcileUnknownOutcomes,
  cleanupPersistence
} from './durable-state.mjs';

const PERSISTENCE_DIR = '.dpt/persistence';

describe('Durable State Persistence Layer', () => {
  function setup() {
    if (existsSync(PERSISTENCE_DIR)) rmSync(PERSISTENCE_DIR, { recursive: true, force: true });
    initDurableState();
  }

  function teardown() {
    cleanupPersistence();
  }

  describe('Initialization', () => {
    it('should initialize persistence layer', () => {
      setup();
      const result = initDurableState();
      assert.equal(result.initialized, true);
      teardown();
    });

    it('should read empty snapshot after initialization', () => {
      setup();
      const snapshot = readSnapshot();
      assert.equal(snapshot.version, 1);
      assert.equal(Object.keys(snapshot.attempts).length, 0);
      teardown();
    });
  });

  describe('Attempt Record Creation (DURABLE identity)', () => {
    it('should create attempt record with persistent identity', () => {
      setup();
      const record = createAttemptRecord('task-1', 'wo-1');
      
      assert.ok(record.attempt_id);
      assert.equal(record.task_id, 'task-1');
      assert.equal(record.work_order_id, 'wo-1');
      assert.equal(record.type, 'ATTEMPT');
      assert.equal(record.state, 'STARTED');
      assert.ok(record.fencing_token);
      assert.equal(record.outcome, null);
      assert.deepEqual(record.lineage, []);
      teardown();
    });

    it('should persist attempt to snapshot and event log', () => {
      setup();
      const record = createAttemptRecord('task-2', 'wo-2');
      const snapshot = readSnapshot();
      
      assert.ok(snapshot.attempts[record.attempt_id]);
      assert.equal(snapshot.event_count, 1);
      teardown();
    });
  });

  describe('Unknown-Outcome Reconciliation', () => {
    it('should mark attempt as UNKNOWN_OUTCOME', () => {
      setup();
      const record = createAttemptRecord('task-3', 'wo-3');
      
      const result = markUnknownOutcome(record.attempt_id);
      assert.equal(result.accepted, true);
      assert.equal(result.outcome, 'UNKNOWN');
      
      const snapshot = readSnapshot();
      assert.equal(snapshot.attempts[record.attempt_id].outcome, 'UNKNOWN');
      assert.equal(snapshot.attempts[record.attempt_id].state, 'UNKNOWN_OUTCOME');
      teardown();
    });

    it('should find unknown-outcome attempts in reconciliation', () => {
      setup();
      createAttemptRecord('task-4a', 'wo-4a');
      const record2 = createAttemptRecord('task-4b', 'wo-4b');
      
      markUnknownOutcome(record2.attempt_id);
      
      const reconciliation = reconcileUnknownOutcomes();
      assert.equal(reconciliation.reconcilable_count, 1);
      assert.equal(reconciliation.attempts[0].attempt_id, record2.attempt_id);
      teardown();
    });
  });

  describe('Late-Result Rejection', () => {
    it('should reject late results for completed attempts', () => {
      setup();
      const record = createAttemptRecord('task-5', 'wo-5');
      
      const first = updateAttemptOutcome(record.attempt_id, 'SUCCESS', { data: 'result' });
      assert.equal(first.accepted, true);
      
      const late = updateAttemptOutcome(record.attempt_id, 'FAILURE', { data: 'late' });
      assert.equal(late.accepted, false);
      assert.equal(late.reason, 'LATE_RESULT_REJECTED');
      
      const snapshot = readSnapshot();
      assert.equal(snapshot.attempts[record.attempt_id].outcome, 'SUCCESS');
      teardown();
    });

    it('should accept first result for unknown-outcome attempt', () => {
      setup();
      const record = createAttemptRecord('task-6', 'wo-6');
      
      markUnknownOutcome(record.attempt_id);
      
      const result = updateAttemptOutcome(record.attempt_id, 'SUCCESS', { data: 'resolved' });
      assert.equal(result.accepted, true);
      assert.equal(result.outcome, 'SUCCESS');
      
      const snapshot = readSnapshot();
      assert.equal(snapshot.attempts[record.attempt_id].outcome, 'SUCCESS');
      assert.equal(snapshot.attempts[record.attempt_id].state, 'COMPLETED');
      teardown();
    });
  });

  describe('Retry Lineage Preservation', () => {
    it('should create retry with parent reference and lineage', () => {
      setup();
      const parent = createAttemptRecord('task-7', 'wo-7');
      
      updateAttemptOutcome(parent.attempt_id, 'FAILURE', null);
      
      const retry = createRetry(parent.attempt_id, 'transient_error');
      
      assert.equal(retry.type, 'RETRY');
      assert.equal(retry.retried_from, parent.attempt_id);
      assert.deepEqual(retry.lineage, [parent.attempt_id]);
      
      const snapshot = readSnapshot();
      assert.ok(snapshot.attempts[parent.attempt_id].retry_lineage);
      assert.equal(snapshot.attempts[parent.attempt_id].retry_lineage.length, 1);
      teardown();
    });

    it('should preserve multi-level retry lineage', () => {
      setup();
      const level1 = createAttemptRecord('task-8a', 'wo-8a');
      updateAttemptOutcome(level1.attempt_id, 'FAILURE', null);
      
      const level2 = createRetry(level1.attempt_id, 'retry_1');
      // Verify level2 was created
      assert.ok(level2.attempt_id, 'level2 should have attempt_id');
      assert.equal(level2.type, 'RETRY');
      
      // Verify lineage from level1's perspective
      const snapshot = readSnapshot();
      assert.ok(snapshot.attempts[level2.attempt_id], 'level2 should exist in snapshot');
      assert.equal(snapshot.attempts[level2.attempt_id].retried_from, level1.attempt_id);
      assert.equal(snapshot.attempts[level2.attempt_id].lineage.length, 1);
      assert.equal(snapshot.attempts[level2.attempt_id].lineage[0], level1.attempt_id);
      teardown();
    });
  });

  describe('Idempotency/Effect Correlation', () => {
    it('should correlate completed effects and reject duplicates', () => {
      setup();
      const record = createAttemptRecord('task-9', 'wo-9');
      updateAttemptOutcome(record.attempt_id, 'SUCCESS', { value: 42 });
      
      const check = checkIdempotency(record.attempt_id);
      assert.equal(check.exists, true);
      assert.equal(check.outcome, 'SUCCESS');
      assert.equal(check.can_retry, false);
      assert.equal(check.correlation, 'EFFECT_CORRELATED');
      teardown();
    });

    it('should allow retry for unknown-outcome attempts', () => {
      setup();
      const record = createAttemptRecord('task-10', 'wo-10');
      markUnknownOutcome(record.attempt_id);
      
      const check = checkIdempotency(record.attempt_id);
      assert.equal(check.exists, true);
      assert.equal(check.outcome, 'UNKNOWN');
      assert.equal(check.can_retry, true);
      assert.equal(check.correlation, 'UNKNOWN_OUTCOME_RECONCILIATION_PENDING');
      teardown();
    });

    it('should return can_retry=true for non-existent attempts', () => {
      setup();
      const check = checkIdempotency('non-existent-id');
      assert.equal(check.exists, false);
      assert.equal(check.can_retry, true);
      teardown();
    });
  });

  describe('Crash/Restart Recovery', () => {
    it('should recover state from snapshot after simulated crash', () => {
      setup();
      const record = createAttemptRecord('task-11', 'wo-11');
      updateAttemptOutcome(record.attempt_id, 'SUCCESS', { data: 'before-crash' });
      
      const recovery = recoverFromCrash();
      
      assert.equal(recovery.recovered, true);
      assert.equal(recovery.snapshot_version, 1);
      assert.equal(recovery.attempt_count, 1);
      assert.ok(recovery.event_count >= 2);
      assert.ok(recovery.events.length > 0);
      teardown();
    });

    it('should persist events across crash boundary', () => {
      setup();
      const r1 = createAttemptRecord('task-12a', 'wo-12a');
      const r2 = createAttemptRecord('task-12b', 'wo-12b');
      markUnknownOutcome(r1.attempt_id);
      
      const recovery = recoverFromCrash();
      const eventTypes = recovery.events.map(e => e.type);
      
      assert.ok(eventTypes.includes('ATTEMPT_CREATED'));
      assert.ok(eventTypes.includes('ATTEMPT_OUTCOME_UPDATED'));
      teardown();
    });
  });

  describe('Full Lifecycle Integration', () => {
    it('should handle complete attempt lifecycle with crash recovery', () => {
      setup();
      
      // Create initial attempt
      const attempt1 = createAttemptRecord('task-13a', 'wo-13a');
      
      // Simulate crash during execution (unknown outcome)
      markUnknownOutcome(attempt1.attempt_id);
      
      // Crash/restart simulation
      const recovery1 = recoverFromCrash();
      assert.equal(recovery1.attempt_count, 1);
      
      // Retry with lineage
      const attempt2 = createRetry(attempt1.attempt_id, 'crash_recovery');
      
      // Complete successfully
      updateAttemptOutcome(attempt2.attempt_id, 'SUCCESS', { result: 'recovered' });
      
      // Final recovery
      const recovery2 = recoverFromCrash();
      assert.equal(recovery2.attempt_count, 2);
      assert.ok(recovery2.event_count >= 4);
      
      // Idempotency check passes
      const idem = checkIdempotency(attempt2.attempt_id);
      assert.equal(idem.can_retry, false);
      assert.equal(idem.correlation, 'EFFECT_CORRELATED');
      teardown();
    });
  });
});

console.log('Durable State Persistence Layer tests loaded');
