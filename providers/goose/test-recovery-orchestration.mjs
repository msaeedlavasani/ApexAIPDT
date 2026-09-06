/**
 * Test suite for Crash/Restart Recovery Orchestration
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, existsSync, readFileSync } from 'node:fs';
import {
  initDurableState,
  createAttemptRecord,
  updateAttemptOutcome,
  markUnknownOutcome,
  createRetry,
  checkIdempotency,
  recoverFromCrash,
  reconcileUnknownOutcomes,
  cleanupPersistence
} from './durable-state.mjs';
import {
  simulateCrash,
  injectUnknownOutcomeFailure,
  processRecovery,
  verifyIdempotencyAfterRecovery,
  recoverFromCrashOrchestration,
  cleanupTestArtifacts
} from './recovery-orchestration.mjs';

const PERSISTENCE_DIR = '.dpt/persistence';

describe('Crash/Restart Recovery Orchestration', () => {
  function setup() {
    if (existsSync(PERSISTENCE_DIR)) rmSync(PERSISTENCE_DIR, { recursive: true, force: true });
    initDurableState();
  }

  function teardown() {
    cleanupTestArtifacts();
  }

  describe('Unknown-Outcome Failure Injection', () => {
    it('should inject unknown-outcome failure and detect it', () => {
      setup();
      const injection = injectUnknownOutcomeFailure('task-inject-1', 'wo-inject-1');
      
      assert.equal(injection.injected, true);
      assert.equal(injection.state, 'UNKNOWN_OUTCOME');
      assert.equal(injection.requires_recovery, true);
      assert.ok(injection.attempt_id);
      teardown();
    });

    it('should detect unknown outcome after crash simulation', () => {
      setup();
      const record = createAttemptRecord('task-crash-1', 'wo-crash-1');
      simulateCrash(record.attempt_id);
      
      const reconciliation = reconcileUnknownOutcomes();
      
      assert.equal(reconciliation.reconcilable_count, 1);
      assert.equal(reconciliation.attempts[0].outcome, 'UNKNOWN');
      teardown();
    });
  });

  describe('Crash/Restart Recovery', () => {
    it('should recover from crash with lineage preservation', () => {
      setup();
      
      // Create and crash
      const attempt1 = createAttemptRecord('task-recovery-1', 'wo-recovery-1');
      simulateCrash(attempt1.attempt_id);
      
      // Process recovery
      const result = processRecovery(attempt1.attempt_id);
      
      assert.equal(result.recovered, true);
      assert.equal(result.original_attempt_id, attempt1.attempt_id);
      assert.equal(result.final_outcome, 'SUCCESS');
      assert.equal(result.lineage_preserved, true);
      assert.ok(result.retry_attempt_id);
      teardown();
    });

    it('should preserve multi-level retry lineage after crash', () => {
      setup();
      
      // Level 1: Create and fail
      const level1 = createAttemptRecord('task-lineage-1a', 'wo-lineage-1a');
      updateAttemptOutcome(level1.attempt_id, 'FAILURE', null);
      
      // Level 2: Retry and crash
      const level2 = createRetry(level1.attempt_id, 'retry_1');
      simulateCrash(level2.attempt_id);
      
      // Recover
      const result = processRecovery(level2.attempt_id);
      
      // Verify lineage
      const snapshot = JSON.parse(readFileSync('.dpt/persistence/snapshot.json', 'utf8'));
      const recoveredAttempt = snapshot.attempts[result.retry_attempt_id];
      
      assert.equal(recoveredAttempt.lineage.length, 2);
      assert.equal(recoveredAttempt.lineage[0], level1.attempt_id);
      assert.equal(recoveredAttempt.lineage[1], level2.attempt_id);
      teardown();
    });
  });

  describe('Late-Result Rejection', () => {
    it('should reject late results after recovery', () => {
      setup();
      
      const attempt1 = createAttemptRecord('task-late-1', 'wo-late-1');
      simulateCrash(attempt1.attempt_id);
      const result = processRecovery(attempt1.attempt_id);
      
      // Try to send late result to recovered attempt
      const lateResult = updateAttemptOutcome(result.retry_attempt_id, 'FAILURE', { late: true });
      
      assert.equal(lateResult.accepted, false);
      assert.equal(lateResult.reason, 'LATE_RESULT_REJECTED');
      teardown();
    });
  });

  describe('Idempotency/Effect Correlation', () => {
    it('should verify idempotency after recovery', () => {
      setup();
      
      const attempt1 = createAttemptRecord('task-idem-1', 'wo-idem-1');
      simulateCrash(attempt1.attempt_id);
      const result = processRecovery(attempt1.attempt_id);
      
      const idemCheck = verifyIdempotencyAfterRecovery(result.retry_attempt_id);
      
      assert.equal(idemCheck.idempotent, true);
      assert.equal(idemCheck.correlation, 'EFFECT_CORRELATED');
      assert.equal(idemCheck.outcome, 'SUCCESS');
      teardown();
    });

    it('should allow retry for unresolved unknown-outcome', () => {
      setup();
      
      const record = createAttemptRecord('task-unresolved-1', 'wo-unresolved-1');
      markUnknownOutcome(record.attempt_id);
      
      const check = checkIdempotency(record.attempt_id);
      
      assert.equal(check.exists, true);
      assert.equal(check.outcome, 'UNKNOWN');
      assert.equal(check.can_retry, true);
      assert.equal(check.correlation, 'UNKNOWN_OUTCOME_RECONCILIATION_PENDING');
      teardown();
    });
  });

  describe('Full Integration: Crash/Restart with All Components', () => {
    it('should handle complete lifecycle with crash, recovery, and precedence', () => {
      setup();
      
      // Phase 1: Normal operation starts
      const attempt1 = createAttemptRecord('task-integration-1', 'wo-integration-1');
      
      // Phase 2: Crash injection
      simulateCrash(attempt1.attempt_id);
      
      // Phase 3: Recovery orchestration detects unknown outcome
      const recovery = recoverFromCrashOrchestration();
      assert.equal(recovery.unknown_outcome_count, 1);
      assert.equal(recovery.ready_for_reconciliation, true);
      
      // Phase 4: Process recovery with retry
      const processed = processRecovery(attempt1.attempt_id);
      assert.equal(processed.recovered, true);
      assert.equal(processed.final_outcome, 'SUCCESS');
      
      // Phase 5: Verify idempotency
      const idem = verifyIdempotencyAfterRecovery(processed.retry_attempt_id);
      assert.equal(idem.idempotent, true);
      
      // Phase 6: Late result rejection
      const late = updateAttemptOutcome(processed.retry_attempt_id, 'FAILURE', { late: true });
      assert.equal(late.accepted, false);
      
      // Phase 7: Verify event log integrity
      const events = readFileSync('.dpt/persistence/events.log', 'utf8').trim().split('\n');
      assert.ok(events.length >= 4, 'Should have multiple events in log');
      
      teardown();
    });
  });

  describe('Crash Boundary Verification', () => {
    it('should persist state across simulated crash boundary', () => {
      setup();
      
      // Create records before "crash"
      const r1 = createAttemptRecord('task-boundary-1a', 'wo-boundary-1a');
      const r2 = createAttemptRecord('task-boundary-1b', 'wo-boundary-1b');
      markUnknownOutcome(r1.attempt_id);
      updateAttemptOutcome(r2.attempt_id, 'SUCCESS', { data: 'completed' });
      
      // Simulate crash by reading raw files
      const snapshot = JSON.parse(readFileSync('.dpt/persistence/snapshot.json', 'utf8'));
      const events = readFileSync('.dpt/persistence/events.log', 'utf8').trim().split('\n').filter(Boolean);
      
      // Verify persistence
      assert.equal(Object.keys(snapshot.attempts).length, 2);
      assert.ok(events.length >= 3, 'Events persisted across boundary');
      
      // Verify recovery reads correct state
      const recovery = recoverFromCrash();
      assert.equal(recovery.attempt_count, 2);
      assert.equal(recovery.event_count, snapshot.event_count);
      
      teardown();
    });
  });
});

console.log('Recovery Orchestration tests loaded');
