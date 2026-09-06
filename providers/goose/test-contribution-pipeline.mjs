/**
 * Tests for Contribution Pipeline (V3-007)
 */
import { describe, it, before, after } from 'node:test';
import { contributions } from './contribution-pipeline.mjs';
import assert from 'node:assert';
import { fileURLToPath } from 'url';
import {
  submitCandidate,
  assignReview,
  submitReview,
  admitToPool,
  isAdmitted,
  getContribution,
  listContributions,
  listPoolReady
} from './contribution-pipeline.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

describe('Contribution Pipeline', () => {
  before(() => { contributions.clear(); });
  it('should submit a contribution candidate', async () => {
    const cont = submitCandidate('source-proj', 'target-proj', { type: 'fix' });
    assert.ok(cont.contribution_id.startsWith('CONT-'));
    assert.equal(cont.stage, 'CANDIDATE');
    assert.equal(cont.pool_status, 'NOT_IN_POOL');
    assert.equal(cont.reviewer_id, null);
  });

  it('should assign review to contributor', async () => {
    const cont = submitCandidate('source', 'target');
    const assigned = assignReview(cont.contribution_id, 'reviewer-1');
    assert.equal(assigned.stage, 'REVIEW_PENDING');
    assert.equal(assigned.reviewer_id, 'reviewer-1');
  });

  it('should reject review submission for non-pending contribution', async () => {
    const cont = submitCandidate('source', 'target');
    assert.throws(() => {
      submitReview(cont.contribution_id, 'APPROVED');
    }, /not in REVIEW_PENDING/);
  });

  it('should approve and advance to pool waiting', async () => {
    const cont = submitCandidate('source', 'target');
    assignReview(cont.contribution_id, 'reviewer-1');
    const reviewed = submitReview(cont.contribution_id, 'APPROVED');
    
    assert.equal(reviewed.stage, 'REVIEW_COMPLETE');
    assert.equal(reviewed.review_decision, 'APPROVED');
    assert.equal(reviewed.pool_status, 'WAITING');
  });

  it('should reject contribution fully', async () => {
    const cont = submitCandidate('source', 'target');
    assignReview(cont.contribution_id, 'reviewer-1');
    const reviewed = submitReview(cont.contribution_id, 'REJECTED');
    
    assert.equal(reviewed.stage, 'REJECTED');
    assert.equal(reviewed.review_decision, 'REJECTED');
  });

  it('should request changes', async () => {
    const cont = submitCandidate('source', 'target');
    assignReview(cont.contribution_id, 'reviewer-1');
    const reviewed = submitReview(cont.contribution_id, 'CHANGES_REQUESTED', 'Please fix formatting');
    
    assert.equal(reviewed.stage, 'REVIEW_COMPLETE');
    assert.equal(reviewed.review_decision, 'CHANGES_REQUESTED');
  });

  it('should admit approved contribution to pool', async () => {
    const cont = submitCandidate('source', 'target');
    assignReview(cont.contribution_id, 'reviewer-1');
    submitReview(cont.contribution_id, 'APPROVED');
    
    const admitted = admitToPool(cont.contribution_id);
    assert.equal(admitted.pool_status, 'ADMITTED');
    assert.equal(admitted.stage, 'POOL_ADMITTED');
    assert.ok(admitted.admitted_at);
  });

  it('should reject admission for non-approved contribution', async () => {
    const cont = submitCandidate('source', 'target');
    assignReview(cont.contribution_id, 'reviewer-1');
    submitReview(cont.contribution_id, 'CHANGES_REQUESTED');
    
    assert.throws(() => {
      admitToPool(cont.contribution_id);
    }, /must be APPROVED/);
  });

  it('should check admission status', async () => {
    const cont = submitCandidate('source', 'target');
    assert.equal(isAdmitted(cont.contribution_id), false);
    
    assignReview(cont.contribution_id, 'reviewer-1');
    submitReview(cont.contribution_id, 'APPROVED');
    admitToPool(cont.contribution_id);
    
    assert.equal(isAdmitted(cont.contribution_id), true);
  });

  it('should list contributions', async () => {
    submitCandidate('a', 'b');
    submitCandidate('c', 'd');
    
    const list = listContributions();
    assert.ok(list.length >= 2);
  });

  it('should list pool-ready contributions', async () => {
    contributions.clear();
    const c1 = submitCandidate('a', 'b');
    const c2 = submitCandidate('c', 'd');
    
    assignReview(c1.contribution_id, 'r1');
    submitReview(c1.contribution_id, 'APPROVED');
    admitToPool(c1.contribution_id);
    
    const poolReady = listPoolReady();
    assert.equal(poolReady.length, 1);
    assert.equal(poolReady[0].contribution_id, c1.contribution_id);
  });

  it('full pipeline: candidate → review → approve → admit', async () => {
    const cont = submitCandidate('proj-a', 'proj-b');
    assert.equal(cont.stage, 'CANDIDATE');
    
    assignReview(cont.contribution_id, 'independent-reviewer');
    assert.equal(cont.stage, 'REVIEW_PENDING');
    
    submitReview(cont.contribution_id, 'APPROVED');
    assert.equal(cont.stage, 'REVIEW_COMPLETE');
    
    admitToPool(cont.contribution_id);
    assert.equal(cont.stage, 'POOL_ADMITTED');
    assert.equal(cont.pool_status, 'ADMITTED');
    assert.equal(isAdmitted(cont.contribution_id), true);
  });
});

console.log('Running Contribution Pipeline tests...\n');
