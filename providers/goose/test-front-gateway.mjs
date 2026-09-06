/**
 * Tests for Front Runtime + Gateway Boundary Service
 * 
 * Covers:
 * - Front creation
 * - Gateway initialization
 * - Protocol boundary setting
 * - Operation checking
 * - Bounds enforcement
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

import {
  ENFORCEMENT_MODES,
  createFront,
  initializeGateway,
  setBoundaries,
  checkOperation,
  executeWithinBounds,
  isFrontOperational,
  getFrontStatus,
  listFronts
} from './front-gateway.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TEST_DIR = join(__dirname, '.test-frontures-staging');

describe('Front Runtime + Gateway Boundary', () => {
  before(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(__dirname);
  });
  
  after(() => {
    try {
      rmSync(TEST_DIR, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });
  
  describe('createFront', () => {
    it('should create Front with initial state', async () => {
      const front = createFront('GW-TEST001', 'ANALYST', 'project-001', { maxTrust: 'HIGH' });
      
      assert.ok(front.front_id.startsWith('FRONT-'));
      assert.equal(front.gateway_id, 'GW-TEST001');
      assert.equal(front.protocol_version, 'v3.0');
      assert.equal(front.front.role, 'ANALYST');
      assert.equal(front.front.project_bound_to, 'project-001');
      assert.equal(front.gateway, null);
      assert.equal(front.boundaries, null);
    });
  });
  
  describe('initializeGateway', () => {
    it('should initialize Gateway for Front', async () => {
      const front = createFront('GW-TEST002', 'ANALYST', 'project-002');
      const fid = front.front_id;
      
      const result = initializeGateway(fid, 'STRICT', ['read', 'analyze'], ['delete']);
      
      assert.ok(result.gateway);
      assert.equal(result.gateway.enforcement_mode, 'STRICT');
      assert.deepEqual(result.gateway.allowed_operations, ['read', 'analyze']);
      assert.deepEqual(result.gateway.blocked_operations, ['delete']);
      assert.ok(result.gateway.active_since);
    });
    
    it('should reject invalid enforcement mode', async () => {
      const front = createFront('GW-TEST003', 'ANALYST', 'project-003');
      const fid = front.front_id;
      
      initializeGateway(fid, 'STRICT', []);
      
      assert.throws(() => {
        initializeGateway(fid, 'INVALID', []);
      }, /already initialized/);
    });
  });
  
  describe('setBoundaries', () => {
    it('should set protocol boundaries', async () => {
      const front = createFront('GW-TEST004', 'ANALYST', 'project-004');
      const fid = front.front_id;
      
      initializeGateway(fid, 'STRICT', ['read']);
      const result = setBoundaries(fid, 5000, ['text', 'json'], 'CONFIDENTIAL');
      
      assert.ok(result.boundaries);
      assert.equal(result.boundaries.max_context_size, 5000);
      assert.deepEqual(result.boundaries.allowed_data_types, ['text', 'json']);
      assert.equal(result.boundaries.privacy_threshold, 'CONFIDENTIAL');
    });
    
    it('should fail if gateway not initialized', async () => {
      const front = createFront('GW-TEST005', 'ANALYST', 'project-005');
      const fid = front.front_id;
      
      assert.throws(() => {
        setBoundaries(fid, 1000, [], 'PUBLIC');
      }, /Gateway not initialized/);
    });
  });
  
  describe('checkOperation', () => {
    it('should allow permitted operations in STRICT mode', async () => {
      const front = createFront('GW-TEST006', 'ANALYST', 'project-006');
      const fid = front.front_id;
      
      initializeGateway(fid, 'STRICT', ['read', 'analyze']);
      
      const result = checkOperation(fid, 'read');
      assert.equal(result.allowed, true);
    });
    
    it('should block operations not in allowed list (STRICT)', async () => {
      const front = createFront('GW-TEST007', 'ANALYST', 'project-007');
      const fid = front.front_id;
      
      initializeGateway(fid, 'STRICT', ['read']);
      
      const result = checkOperation(fid, 'write');
      assert.equal(result.allowed, false);
      assert.ok(result.reason.includes('not in allowed list'));
    });
    
    it('should block explicitly blocked operations', async () => {
      const front = createFront('GW-TEST008', 'ANALYST', 'project-008');
      const fid = front.front_id;
      
      initializeGateway(fid, 'PERMISSIVE', ['read'], ['delete']);
      
      const result = checkOperation(fid, 'delete');
      assert.equal(result.allowed, false);
      assert.ok(result.reason.includes('blocked'));
    });
  });
  
  describe('executeWithinBounds', () => {
    it('should execute allowed operations within bounds', async () => {
      const front = createFront('GW-TEST009', 'ANALYST', 'project-009');
      const fid = front.front_id;
      
      initializeGateway(fid, 'STRICT', ['analyze']);
      setBoundaries(fid, 10000, ['json'], 'INTERNAL');
      
      const result = executeWithinBounds(fid, 'analyze', '{"data": "test"}');
      
      assert.equal(result.operation, 'analyze');
      assert.equal(result.bounds_respected, true);
      assert.ok(result.timestamp);
    });
    
    it('should throw for disallowed operations', async () => {
      const front = createFront('GW-TEST010', 'ANALYST', 'project-010');
      const fid = front.front_id;
      
      initializeGateway(fid, 'STRICT', ['read']);
      
      assert.throws(() => {
        executeWithinBounds(fid, 'write', {});
      }, /not allowed/);
    });
    
    it('should throw for oversized data', async () => {
      const front = createFront('GW-TEST011', 'ANALYST', 'project-011');
      const fid = front.front_id;
      
      initializeGateway(fid, 'STRICT', ['analyze']);
      setBoundaries(fid, 100, ['json'], 'INTERNAL');
      
      const largeData = 'x'.repeat(200);
      
      assert.throws(() => {
        executeWithinBounds(fid, 'analyze', largeData);
      }, /exceeds max context size/);
    });
  });
  
  describe('isFrontOperational', () => {
    it('should return true for complete Front', async () => {
      const front = createFront('GW-TEST012', 'ANALYST', 'project-012');
      const fid = front.front_id;
      
      initializeGateway(fid, 'STRICT', []);
      setBoundaries(fid, 1000, [], 'PUBLIC');
      
      assert.equal(isFrontOperational(fid), true);
    });
    
    it('should return false for incomplete Front', async () => {
      const front = createFront('GW-TEST013', 'ANALYST', 'project-013');
      const fid = front.front_id;
      
      assert.equal(isFrontOperational(fid), false);
    });
  });
  
  describe('getFrontStatus', () => {
    it('should return complete status', async () => {
      const front = createFront('GW-TEST014', 'ANALYST', 'project-014');
      const fid = front.front_id;
      
      initializeGateway(fid, 'STRICT', ['read']);
      setBoundaries(fid, 5000, ['json'], 'INTERNAL');
      
      const status = getFrontStatus(fid);
      
      assert.equal(status.front_id, fid);
      assert.equal(status.role, 'ANALYST');
      assert.equal(status.project_bound_to, 'project-014');
      assert.equal(status.has_gateway, true);
      assert.equal(status.has_boundaries, true);
      assert.equal(status.enforcement_mode, 'STRICT');
      assert.equal(status.is_operational, true);
    });
    
    it('should return null for non-existent Front', async () => {
      const status = getFrontStatus('FRONT-NONEXISTENT');
      assert.equal(status, null);
    });
  });
  
  describe('listFronts', () => {
    it('should list all fronts', async () => {
      const f1 = createFront('GW-LIST001', 'ANALYST', 'project-list-1');
      const f2 = createFront('GW-LIST002', 'AGENT', 'project-list-2');
      
      const fronts = listFronts();
      assert.ok(fronts.length >= 2);
      assert.ok(fronts.some(f => f.front_id === f1.front_id));
      assert.ok(fronts.some(f => f.front_id === f2.front_id));
    });
  });
  
  describe('End-to-end Front lifecycle', () => {
    it('should complete full Front + Gateway lifecycle', async () => {
      // Step 1: Create Front
      const front = createFront('GW-E2E-001', 'ANALYST', 'external-project-e2e', {
        maxTrustLevel: 'HIGH',
        authorityScope: 'analysis'
      });
      const fid = front.front_id;
      
      assert.equal(front.gateway, null);
      assert.equal(front.boundaries, null);
      
      // Step 2: Initialize Gateway
      const withGateway = initializeGateway(fid, 'STRICT', ['read', 'analyze', 'report'], ['delete', 'modify']);
      
      assert.equal(withGateway.gateway.enforcement_mode, 'STRICT');
      
      // Step 3: Set Boundaries
      const withBoundaries = setBoundaries(fid, 10000, ['json', 'text'], 'CONFIDENTIAL');
      
      assert.equal(withBoundaries.boundaries.max_context_size, 10000);
      
      // Step 4: Verify operational
      assert.equal(isFrontOperational(fid), true);
      
      // Step 5: Execute operations within bounds
      const analysisResult = executeWithinBounds(fid, 'analyze', '{"query": "test"}');
      assert.equal(analysisResult.bounds_respected, true);
      
      // Step 6: Verify blocked operations fail
      assert.throws(() => {
        executeWithinBounds(fid, 'delete', {});
      }, /not allowed/);
      
      // Step 7: Get final status
      const status = getFrontStatus(fid);
      assert.equal(status.is_operational, true);
      assert.equal(status.role, 'ANALYST');
      assert.equal(status.enforcement_mode, 'STRICT');
    });
  });
});

console.log('Running Front + Gateway tests...\n');
