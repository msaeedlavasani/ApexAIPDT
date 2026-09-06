/**
 * AUTO_IMPROVEMENT_PROPOSAL — Auto-Improvement Proposal Generation Function
 * 
 * Implements the proposal generation layer defined in ADR-055 for generating
 * actionable improvement proposals from failure pattern reports.
 * 
 * Design: Rule-Based Generator (Design A)
 * - Deterministic rule-based proposal generation
 * - No ML models or external dependencies
 * - Clear traceability from pattern to proposal
 * - Severity-weighted prioritization
 */

import { randomUUID } from 'node:crypto';

/**
 * Proposal generation rules per ADR-055
 */
const PROPOSAL_RULES = {
  RETRY_EXHAUSTED: {
    title: 'Implement Exponential Backoff Strategy',
    description: 'Multiple retry exhaustion failures detected. Implement exponential backoff with jitter to reduce rapid retry storms.',
    action: 'Add exponential backoff with random jitter to retry logic. Start with base delay of 1s, max 30s, multiplier 2x.',
    effort: 'MODERATE',
    minCount: 5,
    failureReduction: 60,
    efficiencyGain: 15,
  },
  CONTEXT_OVERFLOW: {
    title: 'Optimize Context Composition',
    description: 'Context window overflow failures indicate excessive context usage. Optimize context composition to reduce token consumption.',
    action: 'Review context composition pipeline. Implement context pruning, compression, and selective loading based on relevance.',
    effort: 'SIGNIFICANT',
    minCount: 3,
    failureReduction: 70,
    efficiencyGain: 25,
  },
  AUTHORITY_DENIED: {
    title: 'Review Delegation Policy',
    description: 'Frequent authority denial failures suggest delegation policy misconfiguration or overly restrictive policies.',
    action: 'Audit current delegation policies. Review authority evaluation rules. Consider hierarchical delegation or scope expansion.',
    effort: 'MODERATE',
    minCount: 10,
    failureReduction: 50,
    efficiencyGain: 10,
  },
  PROVIDER_ERROR: {
    title: 'Add Provider Fallback Chain',
    description: 'Provider error failures indicate reliability issues with current provider configuration.',
    action: 'Implement provider fallback chain with health checking. Configure primary/secondary providers with automatic failover.',
    effort: 'SIGNIFICANT',
    minCount: 5,
    failureReduction: 80,
    efficiencyGain: 20,
  },
  TIMEOUT: {
    title: 'Adjust Timeout Thresholds',
    description: 'Timeout failures suggest current timeout settings are too aggressive for workload characteristics.',
    action: 'Analyze request duration distribution. Increase timeout thresholds by 50% or implement adaptive timeouts based on operation complexity.',
    effort: 'MINIMAL',
    minCount: 3,
    failureReduction: 40,
    efficiencyGain: 5,
  },
  VALIDATION_FAIL: {
    title: 'Fix Validation Rules',
    description: 'Validation failures indicate incorrect or overly strict validation rules in the pipeline.',
    action: 'Review validation rules against actual data patterns. Relax constraints where appropriate. Add validation error diagnostics.',
    effort: 'MINIMAL',
    minCount: 1,
    failureReduction: 85,
    efficiencyGain: 10,
  },
  UNKNOWN: {
    title: 'Investigate Unknown Failure Pattern',
    description: 'Unknown failure pattern detected. Requires manual investigation to classify and address.',
    action: 'Collect detailed failure logs. Classify pattern type. Develop targeted remediation strategy.',
    effort: 'MODERATE',
    minCount: 1,
    failureReduction: 30,
    efficiencyGain: 10,
  },
};

/**
 * Severity weights for priority scoring
 */
const SEVERITY_WEIGHTS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

/**
 * Effort factors for priority scoring (higher = more effort = lower priority weight)
 */
const EFFORT_FACTORS = {
  MINIMAL: 3,
  MODERATE: 2,
  SIGNIFICANT: 1,
};

/**
 * Format ISO timestamp (native replacement for date-fns)
 */
function formatISO(date) {
  return date.toISOString();
}

/**
 * Auto-Improvement Configuration
 */
export class AutoImprovementConfig {
  /**
   * @param {Object} options
   * @param {boolean} [options.autoApproveLow=true] - Auto-approve LOW severity proposals
   * @param {boolean} [options.autoApproveMedium=false] - Auto-approve MEDIUM severity proposals
   * @param {Object} [options.customRules] - Override default proposal rules
   */
  constructor(options = {}) {
    this.autoApproveLow = options.autoApproveLow ?? true;
    this.autoApproveMedium = options.autoApproveMedium ?? false;
    this.customRules = options.customRules ?? {};
  }

  /**
   * Create default config (OD-T6-002 resolved defaults)
   */
  static default() {
    return new AutoImprovementConfig({
      autoApproveLow: true,
      autoApproveMedium: false,
    });
  }
}

/**
 * Calculate priority score for a proposal
 */
function calculatePriorityScore(severity, count, effort) {
  const severityWeight = SEVERITY_WEIGHTS[severity] || 1;
  const effortFactor = EFFORT_FACTORS[effort] || 2;
  return (severityWeight * count) / effortFactor;
}

/**
 * Determine initial status based on severity and config
 */
function determineInitialStatus(severity, config) {
  if (severity === 'LOW' && config.autoApproveLow) return 'APPROVED';
  if (severity === 'MEDIUM' && config.autoApproveMedium) return 'APPROVED';
  return 'REVIEW';
}

/**
 * Generate proposal from pattern and config
 */
function generateProposal(pattern, config) {
  const rule = PROPOSAL_RULES[pattern.pattern_type] || PROPOSAL_RULES.UNKNOWN;
  const customRule = config.customRules[pattern.pattern_type];
  
  const effectiveRule = customRule || rule;
  const severity = pattern.severity;
  const count = pattern.count;
  const effort = effectiveRule.effort;
  
  // Only generate proposal if count meets minimum threshold
  if (count < effectiveRule.minCount) {
    return null;
  }
  
  const priorityScore = calculatePriorityScore(severity, count, effort);
  const status = determineInitialStatus(severity, config);
  
  return {
    proposal_id: randomUUID(),
    source_patterns: [pattern.pattern_type],
    severity,
    title: effectiveRule.title,
    description: `${effectiveRule.description} Detected ${count} occurrences across ${pattern.task_ids.length} task(s).`,
    recommended_action: effectiveRule.action,
    estimated_impact: {
      failure_reduction_percent: effectiveRule.failureReduction,
      efficiency_gain_percent: effectiveRule.efficiencyGain,
    },
    effort_estimate: effort,
    priority_score: Math.round(priorityScore * 100) / 100,
    created_at: formatISO(new Date()),
    status,
    related_task_ids: pattern.task_ids,
  };
}

/**
 * AUTO_IMPROVEMENT_PROPOSAL — Main Exported Function
 * 
 * Generates improvement proposals from failure pattern reports.
 * 
 * @param {Object} patternReport - FailurePatternReport from PATTERN_MATCHING()
 * @param {AutoImprovementConfig} [config] - Configuration options
 * @returns {Object} ImprovementProposalResult
 */
export function AUTO_IMPROVEMENT_PROPOSAL(patternReport, config = AutoImprovementConfig.default()) {
  const proposals = [];
  
  for (const pattern of patternReport.patterns) {
    const proposal = generateProposal(pattern, config);
    if (proposal) {
      proposals.push(proposal);
    }
  }
  
  // Sort by priority score descending
  proposals.sort((a, b) => b.priority_score - a.priority_score);
  
  return {
    result_id: randomUUID(),
    generated_at: formatISO(new Date()),
    source_report_id: patternReport.report_id,
    total_proposals: proposals.length,
    proposals,
    summary: {
      critical: proposals.filter(p => p.severity === 'CRITICAL').length,
      high: proposals.filter(p => p.severity === 'HIGH').length,
      medium: proposals.filter(p => p.severity === 'MEDIUM').length,
      low: proposals.filter(p => p.severity === 'LOW').length,
      approved: proposals.filter(p => p.status === 'APPROVED').length,
      pending_review: proposals.filter(p => p.status === 'REVIEW').length,
    },
  };
}

/**
 * Validate proposal structure
 */
export function isValidProposal(proposal) {
  if (!proposal) return false;
  if (!proposal.proposal_id) return false;
  if (!proposal.source_patterns?.length) return false;
  if (!proposal.severity) return false;
  if (!proposal.title) return false;
  if (!proposal.description) return false;
  if (!proposal.recommended_action) return false;
  if (!proposal.status) return false;
  return true;
}

/**
 * Get proposals by severity
 */
export function getProposalsBySeverity(proposals, severity) {
  return proposals.filter(p => p.severity === severity);
}

/**
 * Get proposals by status
 */
export function getProposalsByStatus(proposals, status) {
  return proposals.filter(p => p.status === status);
}

/**
 * Calculate total estimated impact
 */
export function calculateTotalImpact(proposals) {
  return proposals.reduce((acc, p) => ({
    failure_reduction: acc.failure_reduction + (p.estimated_impact?.failure_reduction_percent || 0),
    efficiency_gain: acc.efficiency_gain + (p.estimated_impact?.efficiency_gain_percent || 0),
  }), { failure_reduction: 0, efficiency_gain: 0 });
}

/**
 * Proposal generation constants
 */
export const PROPOSAL_STATUSES = ['DRAFT', 'REVIEW', 'APPROVED', 'IMPLEMENTED', 'DECLINED'];
export const EFFORT_LEVELS = ['MINIMAL', 'MODERATE', 'SIGNIFICANT'];
export const SEVERITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export { calculatePriorityScore, determineInitialStatus, generateProposal };
