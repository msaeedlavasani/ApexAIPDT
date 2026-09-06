/**
 * Contribution Pipeline Module (V3-007)
 * 
 * Implements cross-project contribution pipeline with independent review gate.
 * Flow: CANDIDATE → REVIEW_PENDING → REVIEW_COMPLETE → POOL_ADMITTED | REJECTED
 */

import { randomUUID } from 'crypto';

const STAGES = {
  CANDIDATE: 'CANDIDATE',
  REVIEW_PENDING: 'REVIEW_PENDING',
  REVIEW_COMPLETE: 'REVIEW_COMPLETE',
  POOL_ADMITTED: 'POOL_ADMITTED',
  REJECTED: 'REJECTED'
};

const REVIEW_DECISIONS = {
  APPROVED: 'APPROVED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  REJECTED: 'REJECTED'
};

const POOL_STATUSES = {
  NOT_IN_POOL: 'NOT_IN_POOL',
  WAITING: 'WAITING',
  ADMITTED: 'ADMITTED'
};

/** In-memory store */
export const contributions = new Map();

/**
 * Submit a contribution candidate
 */
export function submitCandidate(sourceProject, targetProject, contributionData) {
  const contributionId = 'CONT-' + randomUUID().replace(/-/g, '').toUpperCase().slice(0, 8);
  
  const contribution = {
    contribution_id: contributionId,
    source_project: sourceProject,
    target_project: targetProject,
    data: contributionData || {},
    stage: STAGES.CANDIDATE,
    reviewer_id: null,
    review_decision: null,
    pool_status: POOL_STATUSES.NOT_IN_POOL,
    submitted_at: new Date().toISOString(),
    reviewed_at: null,
    admitted_at: null
  };
  
  contributions.set(contributionId, contribution);
  return contribution;
}

/**
 * Assign for independent review
 */
export function assignReview(contributionId, reviewerId) {
  const cont = contributions.get(contributionId);
  if (!cont) {
    throw new Error(`Contribution not found: ${contributionId}`);
  }
  
  if (cont.stage !== STAGES.CANDIDATE) {
    throw new Error(`Cannot assign review: contribution not in CANDIDATE stage`);
  }
  
  cont.reviewer_id = reviewerId;
  cont.stage = STAGES.REVIEW_PENDING;
  return cont;
}

/**
 * Submit review decision
 */
export function submitReview(contributionId, decision, feedback) {
  const cont = contributions.get(contributionId);
  if (!cont) {
    throw new Error(`Contribution not found: ${contributionId}`);
  }
  
  if (cont.stage !== STAGES.REVIEW_PENDING) {
    throw new Error(`Cannot submit review: contribution not in REVIEW_PENDING stage`);
  }
  
  if (!Object.values(REVIEW_DECISIONS).includes(decision)) {
    throw new Error(`Invalid review decision: ${decision}`);
  }
  
  cont.review_decision = decision;
  cont.feedback = feedback;
  cont.stage = STAGES.REVIEW_COMPLETE;
  cont.reviewed_at = new Date().toISOString();
  
  // Auto-advance based on decision
  if (decision === REVIEW_DECISIONS.APPROVED) {
    cont.pool_status = POOL_STATUSES.WAITING;
  } else if (decision === REVIEW_DECISIONS.REJECTED) {
    cont.stage = STAGES.REJECTED;
  }
  
  return cont;
}

/**
 * Admit contribution to pool (requires APPROVED review)
 */
export function admitToPool(contributionId) {
  const cont = contributions.get(contributionId);
  if (!cont) {
    throw new Error(`Contribution not found: ${contributionId}`);
  }
  
  if (cont.stage !== STAGES.REVIEW_COMPLETE) {
    throw new Error(`Cannot admit: contribution not in REVIEW_COMPLETE stage`);
  }
  
  if (cont.review_decision !== REVIEW_DECISIONS.APPROVED) {
    throw new Error(`Cannot admit: review decision must be APPROVED`);
  }
  
  cont.pool_status = POOL_STATUSES.ADMITTED;
  cont.stage = STAGES.POOL_ADMITTED;
  cont.admitted_at = new Date().toISOString();
  
  return cont;
}

/**
 * Check if contribution is ready for use
 */
export function isAdmitted(contributionId) {
  const cont = contributions.get(contributionId);
  if (!cont) return false;
  return cont.pool_status === POOL_STATUSES.ADMITTED;
}

/**
 * Get contribution details
 */
export function getContribution(contributionId) {
  return contributions.get(contributionId) || null;
}

/**
 * List all contributions
 */
export function listContributions() {
  return Array.from(contributions.values());
}

/**
 * List pool-ready contributions
 */
export function listPoolReady() {
  return Array.from(contributions.values())
    .filter(c => c.pool_status === POOL_STATUSES.ADMITTED);
}

export default {
  submitCandidate,
  assignReview,
  submitReview,
  admitToPool,
  isAdmitted,
  getContribution,
  listContributions,
  listPoolReady
};
