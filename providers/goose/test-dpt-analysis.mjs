/**
 * Tests for DPT Analysis + Bounded Result Module
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { createAnalysis, executeAnalysis, deliverResult, isAnalysisComplete, getAnalysisStatus } from './dpt-analysis.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TEST_DIR = join(__dirname, '.test-analyses-staging');

describe('DPT Analysis', () => {
  before(() => { mkdirSync(TEST_DIR, { recursive: true }); process.chdir(__dirname); });
  after(() => { try { rmSync(TEST_DIR, { recursive: true, force: true }); } catch (e) {} });

  it('should create analysis', async () => {
    const a = createAnalysis('CTX-T1', 'FRONT-T1');
    assert.ok(a.analysis_id.startsWith('ANALYSIS-'));
    assert.equal(a.result, null);
  });

  it('should execute analysis', async () => {
    const a = createAnalysis('CTX-T2', 'FRONT-T2');
    const r = executeAnalysis(a.analysis_id, ['f1', 'f2'], 0.9);
    assert.equal(r.result.findings.length, 2);
    assert.equal(r.result.confidence, 0.9);
    assert.equal(r.result.bounds_respected, true);
  });

  it('should deliver result', async () => {
    const a = createAnalysis('CTX-T3', 'FRONT-T3');
    executeAnalysis(a.analysis_id, ['f1'], 0.8);
    const r = deliverResult(a.analysis_id, 'json');
    assert.equal(r.readback.readable_by_project, true);
  });

  it('should be complete after delivery', async () => {
    const a = createAnalysis('CTX-T4', 'FRONT-T4');
    executeAnalysis(a.analysis_id, ['f1'], 0.7);
    deliverResult(a.analysis_id);
    assert.equal(isAnalysisComplete(a.analysis_id), true);
  });

  it('should return status', async () => {
    const a = createAnalysis('CTX-T5', 'FRONT-T5');
    executeAnalysis(a.analysis_id, ['f1'], 0.95);
    deliverResult(a.analysis_id);
    const s = getAnalysisStatus(a.analysis_id);
    assert.equal(s.is_complete, true);
    assert.equal(s.findings_count, 1);
  });
});

console.log('Running DPT Analysis tests...\n');
