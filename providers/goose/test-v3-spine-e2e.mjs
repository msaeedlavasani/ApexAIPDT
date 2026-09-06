/**
 * Tests for V3 Spine E2E Verification
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { runSpineE2E, getE2EStatus, listE2EVerifications } from './v3-spine-e2e.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TEST_DIR = join(__dirname, '.test-e2e-staging');

describe('V3 Spine E2E', () => {
  before(() => { mkdirSync(TEST_DIR, { recursive: true }); process.chdir(__dirname); });
  after(() => { try { rmSync(TEST_DIR, { recursive: true, force: true }); } catch (e) {} });

  it('should reject ApexAIPDT as external project', async () => {
    assert.throws(() => {
      runSpineE2E('https://github.com/msaeedlavasani/ApexAIPDT', 'ApexAIPDT');
    }, /EXTERNAL to ApexAIPDT/);
  });

  it('should accept truly external project', async () => {
    const result = runSpineE2E('https://github.com/example/external-project', 'Example External Project');
    
    assert.ok(result.verification_id.startsWith('E2E-'));
    assert.equal(result.external_project.is_external_to_apex, true);
    assert.equal(result.overall_status, 'PASSED');
    assert.ok(result.completed_at);
    
    // All stages should pass
    assert.equal(result.stages.v3_001_identity_trust.status, 'PASSED');
    assert.equal(result.stages.v3_002_scout_pi.status, 'PASSED');
    assert.equal(result.stages.v3_003_context.status, 'PASSED');
    assert.equal(result.stages.v3_004_front_gateway.status, 'PASSED');
    assert.equal(result.stages.v3_005_analysis.status, 'PASSED');
  });

  it('should retrieve E2E status', async () => {
    const result = runSpineE2E('https://github.com/other/repo', 'Other Repo');
    const status = getE2EStatus(result.verification_id);
    assert.equal(status.verification_id, result.verification_id);
    assert.equal(status.overall_status, 'PASSED');
  });

  it('should list verifications', async () => {
    runSpineE2E('https://github.com/a/b', 'Repo A');
    runSpineE2E('https://github.com/c/d', 'Repo C');
    
    const list = listE2EVerifications();
    assert.ok(list.length >= 2);
  });
});

console.log('Running V3 Spine E2E tests...\n');
