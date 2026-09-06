/**
 * Tests for Scout + Project-Owned PI Runtime Module
 * 
 * Covers:
 * - Scout creation with external project validation
 * - PI discovery
 * - Front projection from PI (not ownership)
 * - Scout binding
 * - Operational status checks
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

import {
  DISCOVERY_STATUSES,
  createScout,
  discoverPI,
  projectFront,
  bindScout,
  isScoutOperational,
  getScoutStatus,
  listScouts
} from './scout-pi-runtime.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TEST_DIR = join(__dirname, '.test-scouts-staging');

describe('Scout + Project-Owned PI Runtime', () => {
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
  
  describe('createScout', () => {
    it('should create scout for external project', async () => {
      const scout = createScout({
        repository_url: 'https://github.com/external/test-repo',
        project_name: 'External Test Repo',
        is_external_to_apex: true
      });
      
      assert.ok(scout.scout_id.startsWith('SCOUT-'));
      assert.equal(scout.discovery_status, 'DISCOVERING');
      assert.equal(scout.target_project.is_external_to_apex, true);
      assert.ok(scout.created_at);
    });
    
    it('should reject non-external project', async () => {
      assert.throws(() => {
        createScout({
          repository_url: 'https://github.com/apex/apextdt',
          project_name: 'ApexAIPDT',
          is_external_to_apex: false
        });
      }, /must target external project/);
    });
  });
  
  describe('discoverPI', () => {
    it('should discover PI and advance status', async () => {
      const scout = createScout({
        repository_url: 'https://github.com/external/test-repo',
        project_name: 'External Test Repo',
        is_external_to_apex: true
      });
      const sid = scout.scout_id;
      
      const result = discoverPI(sid);
      
      assert.equal(result.discovery_status, 'DISCOVERED');
      assert.ok(result.project_intelligence);
      assert.ok(result.project_intelligence.pi_id.startsWith('PI-'));
      assert.equal(result.project_intelligence.owner, 'External Test Repo');
      assert.ok(result.project_intelligence.discovered_at);
    });
    
    it('should fail if not in DISCOVERING state', async () => {
      const scout = createScout({
        repository_url: 'https://github.com/external/test-repo',
        project_name: 'External Test Repo',
        is_external_to_apex: true
      });
      const sid = scout.scout_id;
      
      discoverPI(sid);
      
      assert.throws(() => {
        discoverPI(sid);
      }, /Cannot discover at status/);
    });
    
    it('should fail for non-existent scout', async () => {
      assert.throws(() => {
        discoverPI('SCOUT-NONEXISTENT');
      }, /Scout not found/);
    });
  });
  
  describe('projectFront', () => {
    it('should project Front FROM PI without owning it', async () => {
      const scout = createScout({
        repository_url: 'https://github.com/external/test-repo',
        project_name: 'External Test Repo',
        is_external_to_apex: true
      });
      const sid = scout.scout_id;
      
      discoverPI(sid);
      const result = projectFront(sid);
      
      assert.ok(result.front_projection);
      assert.equal(result.front_projection.projected_from_pi, result.project_intelligence.pi_id);
      assert.equal(result.front_projection.role, 'ANALYST');
      assert.ok(result.front_projection.front_id.startsWith('FRONT-'));
      
      // Verify Front does NOT own PI
      assert.notEqual(result.front_projection, result.project_intelligence);
    });
    
    it('should fail if PI not discovered', async () => {
      const scout = createScout({
        repository_url: 'https://github.com/external/test-repo',
        project_name: 'External Test Repo',
        is_external_to_apex: true
      });
      const sid = scout.scout_id;
      
      assert.throws(() => {
        projectFront(sid);
      }, /Cannot project front before discovery/);
    });
  });
  
  describe('bindScout', () => {
    it('should bind scout and complete setup', async () => {
      const scout = createScout({
        repository_url: 'https://github.com/external/test-repo',
        project_name: 'External Test Repo',
        is_external_to_apex: true
      });
      const sid = scout.scout_id;
      
      discoverPI(sid);
      projectFront(sid);
      const result = bindScout(sid, 'cross_project');
      
      assert.equal(result.discovery_status, 'BOUND');
      assert.ok(result.binding);
      assert.equal(result.binding.binding_type, 'cross_project');
      assert.ok(result.binding.bound_at);
    });
    
    it('should fail if not fully prepared', async () => {
      const scout = createScout({
        repository_url: 'https://github.com/external/test-repo',
        project_name: 'External Test Repo',
        is_external_to_apex: true
      });
      const sid = scout.scout_id;
      
      discoverPI(sid);
      // Skip projectFront
      
      assert.throws(() => {
        bindScout(sid);
      }, /Cannot bind before projecting front/);
    });
  });
  
  describe('isScoutOperational', () => {
    it('should return true for fully bound scout', async () => {
      const scout = createScout({
        repository_url: 'https://github.com/external/test-repo',
        project_name: 'External Test Repo',
        is_external_to_apex: true
      });
      const sid = scout.scout_id;
      
      discoverPI(sid);
      projectFront(sid);
      bindScout(sid);
      
      assert.equal(isScoutOperational(sid), true);
    });
    
    it('should return false for incomplete scout', async () => {
      const scout = createScout({
        repository_url: 'https://github.com/external/test-repo',
        project_name: 'External Test Repo',
        is_external_to_apex: true
      });
      const sid = scout.scout_id;
      
      assert.equal(isScoutOperational(sid), false);
    });
    
    it('should return false for non-existent scout', async () => {
      assert.equal(isScoutOperational('SCOUT-NONEXISTENT'), false);
    });
  });
  
  describe('getScoutStatus', () => {
    it('should return complete status summary', async () => {
      const scout = createScout({
        repository_url: 'https://github.com/external/test-repo',
        project_name: 'External Test Repo',
        is_external_to_apex: true
      });
      const sid = scout.scout_id;
      
      discoverPI(sid);
      projectFront(sid);
      bindScout(sid);
      
      const status = getScoutStatus(sid);
      
      assert.equal(status.scout_id, sid);
      assert.equal(status.discovery_status, 'BOUND');
      assert.equal(status.has_pi, true);
      assert.equal(status.has_front_projection, true);
      assert.equal(status.has_binding, true);
      assert.equal(status.is_operational, true);
      assert.ok(status.pi_id.startsWith('PI-'));
      assert.ok(status.front_id.startsWith('FRONT-'));
    });
    
    it('should return null for non-existent scout', async () => {
      const status = getScoutStatus('SCOUT-NONEXISTENT');
      assert.equal(status, null);
    });
  });
  
  describe('listScouts', () => {
    it('should list all scouts', async () => {
      const s1 = createScout({
        repository_url: 'https://github.com/external/repo1',
        project_name: 'Repo 1',
        is_external_to_apex: true
      });
      const s2 = createScout({
        repository_url: 'https://github.com/external/repo2',
        project_name: 'Repo 2',
        is_external_to_apex: true
      });
      
      const scouts = listScouts();
      assert.ok(scouts.length >= 2);
      assert.ok(scouts.some(s => s.scout_id === s1.scout_id));
      assert.ok(scouts.some(s => s.scout_id === s2.scout_id));
    });
  });
  
  describe('End-to-end scout lifecycle', () => {
    it('should complete full scout lifecycle', async () => {
      // Step 1: Create scout for external project
      const scout = createScout({
        repository_url: 'https://github.com/external/e2e-project',
        project_name: 'E2E External Project',
        is_external_to_apex: true
      });
      const sid = scout.scout_id;
      
      assert.equal(scout.discovery_status, 'DISCOVERING');
      
      // Step 2: Discover PI
      const discovered = discoverPI(sid);
      assert.equal(discovered.discovery_status, 'DISCOVERED');
      assert.ok(discovered.project_intelligence);
      
      // Step 3: Project Front FROM PI
      const projected = projectFront(sid);
      assert.ok(projected.front_projection);
      assert.equal(projected.front_projection.projected_from_pi, discovered.project_intelligence.pi_id);
      
      // Step 4: Bind scout
      const bound = bindScout(sid, 'cross_project');
      assert.equal(bound.discovery_status, 'BOUND');
      assert.ok(bound.binding);
      
      // Step 5: Verify operational
      assert.equal(isScoutOperational(sid), true);
      
      const status = getScoutStatus(sid);
      assert.equal(status.is_operational, true);
      assert.equal(status.target_project.is_external_to_apex, true);
    });
  });
});

console.log('Running Scout + PI Runtime tests...\n');
