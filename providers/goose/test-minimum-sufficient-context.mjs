/**
 * Tests for Minimum-Sufficient Context Package Module
 * 
 * Covers:
 * - Context package creation
 * - Minimum extraction (capped artifacts)
 * - Privacy boundary validation
 * - Readiness checks
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

import {
  EXTRACTION_STATUSES,
  PRIVACY_CLASSIFICATIONS,
  createContextPackage,
  extractContext,
  validateContext,
  isContextReady,
  getContextStatus,
  listContextPackages
} from './minimum-sufficient-context.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TEST_DIR = join(__dirname, '.test-context-staging');

describe('Minimum-Sufficient Context Package', () => {
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
  
  describe('createContextPackage', () => {
    it('should create package with EXTRACTING status', async () => {
      const pkg = createContextPackage('SCOUT-TEST001', 'test-scope');
      
      assert.ok(pkg.package_id.startsWith('CTX-'));
      assert.equal(pkg.extraction_status, 'EXTRACTING');
      assert.equal(pkg.source_scout, 'SCOUT-TEST001');
      assert.equal(pkg.context, null);
      assert.equal(pkg.validation, null);
      assert.ok(pkg.created_at);
    });
  });
  
  describe('extractContext', () => {
    it('should extract minimum artifacts and cap at 10', async () => {
      const pkg = createContextPackage('SCOUT-TEST002', 'scope-2');
      const pid = pkg.package_id;
      
      // Pass more than 10 artifacts
      const manyArtifacts = Array.from({ length: 20 }, (_, i) => 'artifact-' + i);
      const result = extractContext(pid, manyArtifacts);
      
      assert.equal(result.extraction_status, 'EXTRACTED');
      assert.ok(result.context);
      assert.equal(result.context.relevant_artifacts.length, 10); // Capped at 10
      assert.equal(result.context.privacy_classification, 'INTERNAL');
    });
    
    it('should fail if not in EXTRACTING state', async () => {
      const pkg = createContextPackage('SCOUT-TEST003', 'scope-3');
      const pid = pkg.package_id;
      
      extractContext(pid, ['art1']);
      
      assert.throws(() => {
        extractContext(pid, ['art2']);
      }, /Cannot extract at status/);
    });
    
    it('should fail for non-existent package', async () => {
      assert.throws(() => {
        extractContext('CTX-NONEXISTENT', []);
      }, /Context package not found/);
    });
  });
  
  describe('validateContext', () => {
    it('should validate and mark as VALIDATED', async () => {
      const pkg = createContextPackage('SCOUT-TEST004', 'scope-4');
      const pid = pkg.package_id;
      
      extractContext(pid, ['art1', 'art2']);
      const result = validateContext(pid, ['boundary1', 'boundary2']);
      
      assert.equal(result.extraction_status, 'VALIDATED');
      assert.ok(result.validation);
      assert.equal(result.validation.passed_privacy_check, true);
      assert.ok(result.validation.boundaries_verified.length > 0);
    });
    
    it('should fail if not EXTRACTED', async () => {
      const pkg = createContextPackage('SCOUT-TEST005', 'scope-5');
      const pid = pkg.package_id;
      
      assert.throws(() => {
        validateContext(pid, []);
      }, /Cannot validate before extraction/);
    });
  });
  
  describe('isContextReady', () => {
    it('should return true for validated package', async () => {
      const pkg = createContextPackage('SCOUT-TEST006', 'scope-6');
      const pid = pkg.package_id;
      
      extractContext(pid, ['art1']);
      validateContext(pid, ['boundary1']);
      
      assert.equal(isContextReady(pid), true);
    });
    
    it('should return false for incomplete package', async () => {
      const pkg = createContextPackage('SCOUT-TEST007', 'scope-7');
      const pid = pkg.package_id;
      
      assert.equal(isContextReady(pid), false);
    });
    
    it('should return false for non-existent package', async () => {
      assert.equal(isContextReady('CTX-NONEXISTENT'), false);
    });
  });
  
  describe('getContextStatus', () => {
    it('should return complete status', async () => {
      const pkg = createContextPackage('SCOUT-TEST008', 'scope-8');
      const pid = pkg.package_id;
      
      extractContext(pid, ['art1', 'art2', 'art3']);
      validateContext(pid, ['boundary1']);
      
      const status = getContextStatus(pid);
      
      assert.equal(status.package_id, pid);
      assert.equal(status.extraction_status, 'VALIDATED');
      assert.equal(status.is_ready, true);
      assert.equal(status.privacy_classification, 'INTERNAL');
      assert.equal(status.artifact_count, 3);
    });
    
    it('should return null for non-existent', async () => {
      const status = getContextStatus('CTX-NONEXISTENT');
      assert.equal(status, null);
    });
  });
  
  describe('listContextPackages', () => {
    it('should list all packages', async () => {
      const p1 = createContextPackage('SCOUT-TEST009', 'scope-9');
      const p2 = createContextPackage('SCOUT-TEST010', 'scope-10');
      
      const packages = listContextPackages();
      assert.ok(packages.length >= 2);
      assert.ok(packages.some(p => p.package_id === p1.package_id));
      assert.ok(packages.some(p => p.package_id === p2.package_id));
    });
  });
  
  describe('End-to-end context lifecycle', () => {
    it('should complete full context lifecycle', async () => {
      // Step 1: Create package
      const pkg = createContextPackage('SCOUT-E2E-001', 'e2e-scope');
      const pid = pkg.package_id;
      
      assert.equal(pkg.extraction_status, 'EXTRACTING');
      
      // Step 2: Extract (with many artifacts to test capping)
      const manyArtifacts = Array.from({ length: 15 }, (_, i) => 'doc/' + i);
      const extracted = extractContext(pid, manyArtifacts);
      
      assert.equal(extracted.extraction_status, 'EXTRACTED');
      assert.equal(extracted.context.relevant_artifacts.length, 10); // Capped
      
      // Step 3: Validate
      const validated = validateContext(pid, ['privacy-boundary', 'authority-boundary']);
      
      assert.equal(validated.extraction_status, 'VALIDATED');
      assert.equal(validated.validation.passed_privacy_check, true);
      
      // Step 4: Verify ready
      assert.equal(isContextReady(pid), true);
      
      const status = getContextStatus(pid);
      assert.equal(status.is_ready, true);
      assert.equal(status.artifact_count, 10);
    });
  });
});

console.log('Running Minimum-Sufficient Context tests...\n');
