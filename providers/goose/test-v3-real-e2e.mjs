/**
 * Tests for V3 Real External-Project E2E Validation
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runRealSpineE2E } from './v3-real-e2e.mjs';

describe('V3 Real External-Project E2E', () => {
  it('should execute real cross-boundary E2E', async () => {
    const result = await runRealSpineE2E();
    assert.ok(result.overall_status === 'PASSED' || result.overall_status === 'PARTIAL');
    assert.equal(result.external_project.is_external_to_apex, true);
    assert.equal(result.external_project.verified_via_real_http, true);
    assert.equal(result.stages.stage1_identity_trust.status, 'PASSED');
    assert.equal(result.stages.stage1_identity_trust.real_http_call, true);
    assert.equal(result.stages.stage2_scout_discovery.status, 'PASSED');
    assert.ok(result.stages.stage2_scout_discovery.evidence.real_files_discovered > 0);
    assert.equal(result.stages.stage3_context_transfer.status, 'PASSED');
    assert.ok(result.stages.stage3_context_transfer.evidence.real_content_extracted);
    assert.equal(result.stages.stage4_front_gateway.status, 'PASSED');
    assert.equal(result.stages.stage5_analysis.status, 'PASSED');
    assert.ok(result.stages.stage6_result_delivery.status === 'PASSED' || result.stages.stage6_result_delivery.status === 'PARTIAL');
    assert.equal(result.stages.stage6_result_delivery.evidence.cross_boundary_delivery_attempted, true);
    assert.equal(result.real_external_proof.http_calls_made, true);
    assert.equal(result.real_external_proof.real_repo_interacted, true);
    assert.equal(result.real_external_proof.synthesis_rejected, true);
  });
});

console.log('Running V3 Real External-Project E2E tests...\n');
