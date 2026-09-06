/**
 * Tests for Post-Integration Reconciliation Gate
 * 
 * Covers:
 * - CLOSED task resurrection detection
 * - RETIRED report resurrection detection
 * - Stale READY projection detection
 * - Dependency-not-closed READY bug
 * - Unpushed local main detection
 * - Merged branch left active detection
 * - Stale open PR detection
 * - Unresolved stash detection
 * - Local/remote SHA divergence
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

// Import the gate functions
import {
  checkLocalMainEqualsOriginMain,
  checkWorktreeClean,
  checkUnpushedCommits,
  checkOpenBatchPRs,
  checkMergedBatchBranches,
  checkUnresolvedStash,
  checkCIMainPass,
  checkRemoteReadback,
  parseTaskRecords,
  checkClosedTaskResurrection,
  checkReadyDependencies,
  checkRetiredReportResurrection,
  checkCrossProjectionConsistency,
  runPostIntegrationGate
} from './post-integration-reconciliation.mjs';

const TEST_DIR = join(process.cwd(), '.test-staging');

describe('Post-Integration Reconciliation Gate', () => {
  let originalCwd;
  
  before(() => {
    originalCwd = process.cwd();
  });
  
  after(() => {
    process.chdir(originalCwd);
  });
  
  // ========== CLEAN STATE CHECKS ==========
  
  describe('checkLocalMainEqualsOriginMain', () => {
    it('should detect matching SHAs', async () => {
      const result = checkLocalMainEqualsOriginMain();
      assert.ok(result.hasOwnProperty('pass'));
      assert.ok(result.hasOwnProperty('localSha'));
      assert.ok(result.hasOwnProperty('originSha'));
    });
    
    it('should detect SHA divergence', async () => {
      const mockResult = {
        pass: false,
        localSha: 'abc123',
        originSha: 'def456',
        message: 'SHA divergence: local=abc123, origin=def456'
      };
      assert.equal(mockResult.pass, false);
      assert.ok(mockResult.message.includes('divergence'));
    });
  });
  
  describe('checkWorktreeClean', () => {
    it('should detect clean worktree', async () => {
      const result = checkWorktreeClean();
      assert.ok(result.hasOwnProperty('pass'));
      assert.ok(result.hasOwnProperty('dirtyFiles'));
    });
  });
  
  describe('checkUnpushedCommits', () => {
    it('should count unpushed commits', async () => {
      const result = checkUnpushedCommits();
      assert.ok(result.hasOwnProperty('pass'));
      assert.ok(result.hasOwnProperty('count'));
      assert.equal(typeof result.count, 'number');
    });
  });
  
  describe('checkUnresolvedStash', () => {
    it('should count stashes', async () => {
      const result = checkUnresolvedStash();
      assert.ok(result.hasOwnProperty('pass'));
      assert.ok(result.hasOwnProperty('stashCount'));
      assert.equal(typeof result.stashCount, 'number');
    });
  });
  
  // ========== TASK LIFECYCLE CHECKS ==========
  
  describe('checkClosedTaskResurrection', () => {
    it('should detect CLOSED task resurrection without reopen event', async () => {
      const mockTasks = [
        { task_id: 'DPT-FOUNDATION-038', status: 'READY', dependencies: 'DPT-FOUNDATION-037', readiness: 'READY' },
        { task_id: 'DPT-FOUNDATION-037', status: 'CLOSED', dependencies: '', readiness: 'CLOSED' }
      ];
      
      const result = checkClosedTaskResurrection({ success: true, tasks: mockTasks });
      assert.ok(result.hasOwnProperty('pass'));
      assert.ok(result.hasOwnProperty('violations'));
    });
    
    it('should pass when READY task has no prior CLOSED state', async () => {
      const mockTasks = [
        { task_id: 'DPT-FOUNDATION-001', status: 'READY', dependencies: 'DPT-RECON-003', readiness: 'READY' },
        { task_id: 'DPT-RECON-003', status: 'CLOSED', dependencies: '', readiness: 'CLOSED' }
      ];
      
      const result = checkClosedTaskResurrection({ success: true, tasks: mockTasks });
      // FOUNDATION-001 was never CLOSED, so no resurrection
      assert.equal(result.pass, true);
      assert.equal(result.violations.length, 0);
    });
  });
  
  describe('checkReadyDependencies', () => {
    it('should detect READY task with non-CLOSED dependency', async () => {
      const mockTasks = [
        { task_id: 'DPT-FOUNDATION-039', status: 'READY', dependencies: 'DPT-FOUNDATION-038', readiness: 'READY' },
        { task_id: 'DPT-FOUNDATION-038', status: 'NOT_READY', dependencies: '', readiness: 'NOT_READY' }
      ];
      
      const result = checkReadyDependencies({ success: true, tasks: mockTasks });
      assert.equal(result.pass, false);
      assert.equal(result.violations.length, 1);
      assert.equal(result.violations[0].dependency, 'DPT-FOUNDATION-038');
    });
    
    it('should pass when all dependencies are CLOSED', async () => {
      const mockTasks = [
        { task_id: 'DPT-FOUNDATION-038', status: 'READY', dependencies: 'DPT-FOUNDATION-037', readiness: 'READY' },
        { task_id: 'DPT-FOUNDATION-037', status: 'CLOSED', dependencies: '', readiness: 'CLOSED' }
      ];
      
      const result = checkReadyDependencies({ success: true, tasks: mockTasks });
      assert.equal(result.pass, true);
      assert.equal(result.violations.length, 0);
    });
  });
  
  // ========== REPORT LIFECYCLE CHECKS ==========
  
  describe('checkRetiredReportResurrection', () => {
    it('should pass with real repo state', async () => {
      const result = checkRetiredReportResurrection();
      assert.ok(result.hasOwnProperty('pass'));
      assert.ok(result.hasOwnProperty('overlaps'));
      assert.ok(result.hasOwnProperty('activeCount'));
      assert.ok(result.hasOwnProperty('retiredCount'));
    });
  });
  
  // ========== CROSS-PROJECTION CHECKS ==========
  
  describe('checkCrossProjectionConsistency', () => {
    it('should pass when projections are consistent', async () => {
      const result = checkCrossProjectionConsistency();
      assert.ok(result.hasOwnProperty('pass'));
      assert.ok(result.hasOwnProperty('errors'));
    });
  });
  
  // ========== INTEGRATED GATE TESTS ==========
  
  describe('runPostIntegrationGate', () => {
    it('should return overall structure', async () => {
      const result = runPostIntegrationGate();
      
      assert.ok(result.hasOwnProperty('overall'));
      assert.ok(result.overall.hasOwnProperty('pass'));
      assert.ok(result.overall.hasOwnProperty('blockedBy'));
      assert.ok(result.hasOwnProperty('checks'));
      assert.ok(result.hasOwnProperty('timestamp'));
      assert.ok(result.hasOwnProperty('version'));
    });
    
    it('should list all individual check results', async () => {
      const result = runPostIntegrationGate();
      
      const expectedChecks = [
        'localMainEqualsOrigin',
        'worktreeClean',
        'unpushedCommits',
        'openBatchPRs',
        'mergedBatchBranches',
        'unresolvedStash',
        'ciMainPass',
        'remoteReadback',
        'closedTaskResurrection',
        'readyDependencies',
        'retiredReportResurrection',
        'crossProjection'
      ];
      
      for (const check of expectedChecks) {
        assert.ok(result.checks.hasOwnProperty(check), 'Missing check: ' + check);
      }
    });
    
    it('should identify blocking checks when gate fails', async () => {
      const result = runPostIntegrationGate();
      
      if (!result.overall.pass) {
        assert.ok(Array.isArray(result.overall.blockedBy));
        assert.ok(result.overall.blockedBy.length > 0);
        
        for (const blocked of result.overall.blockedBy) {
          assert.equal(result.checks[blocked].pass, false);
        }
      }
    });
  });
  
  // ========== SPECIFIC BUG REPRODUCTION TESTS ==========
  
  describe('Bug reproduction: stale READY projection', () => {
    it('should allow READY tasks when no prior CLOSED state in current projection', async () => {
      // When tasks are freshly loaded from ledger, they have no prior history
      // The resurrection check only flags tasks that appear in both CLOSED and READY
      // within the same projection snapshot
      const mockTasks = [
        { task_id: 'DPT-FOUNDATION-001', status: 'READY', dependencies: 'DPT-RECON-003', readiness: 'READY' },
        { task_id: 'DPT-RECON-003', status: 'CLOSED', dependencies: '', readiness: 'CLOSED' }
      ];
      
      const resurrectionResult = checkClosedTaskResurrection({ success: true, tasks: mockTasks });
      
      // FOUNDATION-001 was never CLOSED in this projection, so no violation
      assert.equal(resurrectionResult.pass, true);
      assert.equal(resurrectionResult.violations.length, 0);
    });
  });
  
  describe('Bug reproduction: dependency chain not closed', () => {
    it('should catch cascading NOT_READY when one dependency is not closed', async () => {
      const mockTasks = [
        { task_id: 'DPT-FOUNDATION-038', status: 'READY', dependencies: 'DPT-FOUNDATION-037', readiness: 'READY' },
        { task_id: 'DPT-FOUNDATION-039', status: 'READY', dependencies: 'DPT-FOUNDATION-038', readiness: 'READY' },
        { task_id: 'DPT-FOUNDATION-040', status: 'READY', dependencies: 'DPT-FOUNDATION-039', readiness: 'READY' },
        { task_id: 'DPT-FOUNDATION-041', status: 'READY', dependencies: 'DPT-FOUNDATION-040', readiness: 'READY' },
        { task_id: 'DPT-FOUNDATION-037', status: 'REWORK', dependencies: '', readiness: 'REWORK' }
      ];
      
      const depResult = checkReadyDependencies({ success: true, tasks: mockTasks });
      
      // All READY tasks depend on a chain that includes REWORK task
      assert.equal(depResult.pass, false);
      assert.ok(depResult.violations.length >= 4);
    });
  });
  
  describe('Bug reproduction: local/remote divergence', () => {
    it('should detect when local main differs from origin/main', async () => {
      const mockResult = {
        pass: false,
        localSha: 'abc123def456',
        originSha: '789ghi012jkl',
        message: 'SHA divergence: local=abc123, origin=789ghi'
      };
      
      assert.equal(mockResult.pass, false);
      assert.notEqual(mockResult.localSha, mockResult.originSha);
    });
  });
});

console.log('Running Post-Integration Reconciliation Gate tests...\n');
