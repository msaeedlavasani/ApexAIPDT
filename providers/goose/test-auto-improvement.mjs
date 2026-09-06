/**
 * Test Suite for AUTO_IMPROVEMENT_PROPOSAL — Auto-Improvement Proposals
 * 
 * Validates ADR-055 compliance and OD-T6-002 resolutions.
 * 
 * Expected: 30+ tests passing
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTO_IMPROVEMENT_PROPOSAL,
  AutoImprovementConfig,
  isValidProposal,
  getProposalsBySeverity,
  getProposalsByStatus,
  calculateTotalImpact,
  PROPOSAL_STATUSES,
  EFFORT_LEVELS,
  SEVERITY_LEVELS,
} from './auto-improvement.mjs';

// Mock pattern report for testing
const mockPatternReport = {
  report_id: 'test-report-001',
  time_window: {
    start: '2026-09-05T00:00:00Z',
    end: '2026-09-06T23:59:59Z',
  },
  computed_at: '2026-09-06T06:00:00Z',
  source_event_count: 25,
  pattern_summary: {
    total_failures: 25,
    unique_patterns: 4,
    critical_count: 1,
    high_count: 1,
    medium_count: 1,
    low_count: 1,
  },
  patterns: [
    {
      pattern_type: 'RETRY_EXHAUSTED',
      count: 8,
      severity: 'HIGH',
      task_ids: ['task-001', 'task-002'],
      first_occurrence: '2026-09-05T10:00:00Z',
      last_occurrence: '2026-09-06T05:00:00Z',
      trend: 'INCREASING',
    },
    {
      pattern_type: 'CONTEXT_OVERFLOW',
      count: 5,
      severity: 'MEDIUM',
      task_ids: ['task-003'],
      first_occurrence: '2026-09-05T12:00:00Z',
      last_occurrence: '2026-09-06T03:00:00Z',
      trend: 'STABLE',
    },
    {
      pattern_type: 'PROVIDER_ERROR',
      count: 12,
      severity: 'CRITICAL',
      task_ids: ['task-001', 'task-004', 'task-005'],
      first_occurrence: '2026-09-05T08:00:00Z',
      last_occurrence: '2026-09-06T06:00:00Z',
      trend: 'SPIKE',
    },
    {
      pattern_type: 'TIMEOUT',
      count: 3,
      severity: 'LOW',
      task_ids: ['task-002'],
      first_occurrence: '2026-09-05T15:00:00Z',
      last_occurrence: '2026-09-06T01:00:00Z',
      trend: 'DECREASING',
    },
  ],
  config: {
    severityThresholds: { low: 1, medium: 3, high: 5, critical: 10 },
    windowDefaultHours: 24,
  },
  alerts: [],
};

describe('AUTO_IMPROVEMENT_PROPOSAL — Auto-Improvement Proposals', () => {
  describe('Test 1: Basic Proposal Generation', () => {
    it('should generate proposals for patterns above threshold', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      assert.ok(result.proposals);
      assert.equal(typeof result.total_proposals, 'number');
    });

    it('should include required proposal fields', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const proposal = result.proposals[0];
      assert.ok(proposal.proposal_id);
      assert.ok(Array.isArray(proposal.source_patterns));
      assert.ok(proposal.severity);
      assert.ok(proposal.title);
      assert.ok(proposal.description);
      assert.ok(proposal.recommended_action);
      assert.ok(proposal.status);
    });

    it('should have valid proposal structure', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      for (const proposal of result.proposals) {
        assert.equal(isValidProposal(proposal), true);
      }
    });

    it('should set correct priority scores', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      assert.ok(result.proposals.every(p => typeof p.priority_score === 'number'));
      assert.ok(result.proposals.every(p => p.priority_score > 0));
    });

    it('should sort proposals by priority score descending', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      for (let i = 1; i < result.proposals.length; i++) {
        assert.ok(result.proposals[i-1].priority_score >= result.proposals[i].priority_score);
      }
    });

    it('should include related task IDs', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const proposal = result.proposals.find(p => p.source_patterns[0] === 'PROVIDER_ERROR');
      assert.ok(proposal);
      assert.equal(proposal.related_task_ids.length, 3);
    });

    it('should include estimated impact', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const proposal = result.proposals[0];
      assert.ok(proposal.estimated_impact);
      assert.ok(typeof proposal.estimated_impact.failure_reduction_percent === 'number');
      assert.ok(typeof proposal.estimated_impact.efficiency_gain_percent === 'number');
    });
  });

  describe('Test 2: Threshold Enforcement', () => {
    it('should not generate proposal for low-count pattern', () => {
      const lowCountReport = {
        ...mockPatternReport,
        patterns: [
          {
            pattern_type: 'TIMEOUT',
            count: 1,
            severity: 'LOW',
            task_ids: ['task-001'],
            first_occurrence: '2026-09-05T10:00:00Z',
            last_occurrence: '2026-09-05T10:00:00Z',
            trend: 'STABLE',
          },
        ],
      };
      
      const result = AUTO_IMPROVEMENT_PROPOSAL(lowCountReport);
      assert.equal(result.total_proposals, 0);
    });

    it('should generate proposal when count meets threshold', () => {
      const report = {
        ...mockPatternReport,
        patterns: [
          {
            pattern_type: 'TIMEOUT',
            count: 3,
            severity: 'LOW',
            task_ids: ['task-001'],
            first_occurrence: '2026-09-05T10:00:00Z',
            last_occurrence: '2026-09-05T10:00:00Z',
            trend: 'STABLE',
          },
        ],
      };
      
      const result = AUTO_IMPROVEMENT_PROPOSAL(report);
      assert.equal(result.total_proposals, 1);
    });

    it('should respect different threshold per pattern type', () => {
      // VALIDATION_FAIL has minCount=1, so even count=1 should generate
      const report = {
        ...mockPatternReport,
        patterns: [
          {
            pattern_type: 'VALIDATION_FAIL',
            count: 1,
            severity: 'LOW',
            task_ids: ['task-001'],
            first_occurrence: '2026-09-05T10:00:00Z',
            last_occurrence: '2026-09-05T10:00:00Z',
            trend: 'STABLE',
          },
        ],
      };
      
      const result = AUTO_IMPROVEMENT_PROPOSAL(report);
      assert.equal(result.total_proposals, 1);
    });
  });

  describe('Test 3: Severity Classification', () => {
    it('should preserve pattern severity in proposal', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const criticalProposal = result.proposals.find(p => p.severity === 'CRITICAL');
      assert.ok(criticalProposal);
      assert.equal(criticalProposal.source_patterns[0], 'PROVIDER_ERROR');
    });

    it('should generate proposals for all severity levels above threshold', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const severities = new Set(result.proposals.map(p => p.severity));
      assert.ok(severities.has('CRITICAL'));
      assert.ok(severities.has('HIGH'));
      assert.ok(severities.has('MEDIUM'));
      assert.ok(severities.has('LOW'));
    });

    it('should calculate higher priority for critical severity', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const critical = result.proposals.find(p => p.severity === 'CRITICAL');
      const low = result.proposals.find(p => p.severity === 'LOW');
      assert.ok(critical.priority_score > low.priority_score);
    });
  });

  describe('Test 4: Status Assignment', () => {
    it('should auto-approve LOW severity by default', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const lowProposal = result.proposals.find(p => p.severity === 'LOW');
      assert.equal(lowProposal.status, 'APPROVED');
    });

    it('should require review for HIGH severity', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const highProposal = result.proposals.find(p => p.severity === 'HIGH');
      assert.equal(highProposal.status, 'REVIEW');
    });

    it('should require review for CRITICAL severity', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const criticalProposal = result.proposals.find(p => p.severity === 'CRITICAL');
      assert.equal(criticalProposal.status, 'REVIEW');
    });

    it('should auto-approve MEDIUM when configured', () => {
      const config = new AutoImprovementConfig({ autoApproveMedium: true });
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport, config);
      const mediumProposal = result.proposals.find(p => p.severity === 'MEDIUM');
      assert.equal(mediumProposal.status, 'APPROVED');
    });
  });

  describe('Test 5: Empty and Edge Cases', () => {
    it('should handle empty patterns array', () => {
      const emptyReport = { ...mockPatternReport, patterns: [] };
      const result = AUTO_IMPROVEMENT_PROPOSAL(emptyReport);
      assert.equal(result.total_proposals, 0);
      assert.equal(result.proposals.length, 0);
    });

    it('should handle report with no qualifying patterns', () => {
      const report = {
        ...mockPatternReport,
        patterns: [
          {
            pattern_type: 'TIMEOUT',
            count: 1,
            severity: 'LOW',
            task_ids: ['task-001'],
            first_occurrence: '2026-09-05T10:00:00Z',
            last_occurrence: '2026-09-05T10:00:00Z',
            trend: 'STABLE',
          },
        ],
      };
      const result = AUTO_IMPROVEMENT_PROPOSAL(report);
      assert.equal(result.total_proposals, 0);
    });

    it('should handle unknown pattern types gracefully', () => {
      const report = {
        ...mockPatternReport,
        patterns: [
          {
            pattern_type: 'UNKNOWN',
            count: 5,
            severity: 'MEDIUM',
            task_ids: ['task-001'],
            first_occurrence: '2026-09-05T10:00:00Z',
            last_occurrence: '2026-09-05T10:00:00Z',
            trend: 'STABLE',
          },
        ],
      };
      const result = AUTO_IMPROVEMENT_PROPOSAL(report);
      assert.equal(result.total_proposals, 1);
      assert.equal(result.proposals[0].source_patterns[0], 'UNKNOWN');
    });
  });

  describe('Test 6: Custom Configuration', () => {
    it('should respect custom auto-approve settings', () => {
      const config = new AutoImprovementConfig({ autoApproveLow: false });
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport, config);
      const lowProposal = result.proposals.find(p => p.severity === 'LOW');
      assert.equal(lowProposal.status, 'REVIEW');
    });

    it('should apply custom rules for pattern types', () => {
      const config = new AutoImprovementConfig({
        customRules: {
          TIMEOUT: {
            title: 'Custom Timeout Rule',
            description: 'Custom description',
            action: 'Custom action',
            effort: 'MINIMAL',
            minCount: 1,
            failureReduction: 50,
            efficiencyGain: 10,
          },
        },
      });
      
      const report = {
        ...mockPatternReport,
        patterns: [
          {
            pattern_type: 'TIMEOUT',
            count: 1,
            severity: 'LOW',
            task_ids: ['task-001'],
            first_occurrence: '2026-09-05T10:00:00Z',
            last_occurrence: '2026-09-05T10:00:00Z',
            trend: 'STABLE',
          },
        ],
      };
      
      const result = AUTO_IMPROVEMENT_PROPOSAL(report, config);
      assert.equal(result.total_proposals, 1);
      assert.equal(result.proposals[0].title, 'Custom Timeout Rule');
    });

    it('should use default config when none provided', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      assert.ok(result);
      assert.ok(Array.isArray(result.proposals));
    });
  });

  describe('Test 7: Impact Estimation', () => {
    it('should calculate estimated impact percentages', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      for (const proposal of result.proposals) {
        assert.ok(proposal.estimated_impact);
        assert.ok(proposal.estimated_impact.failure_reduction_percent >= 0);
        assert.ok(proposal.estimated_impact.failure_reduction_percent <= 100);
        assert.ok(proposal.estimated_impact.efficiency_gain_percent >= 0);
        assert.ok(proposal.estimated_impact.efficiency_gain_percent <= 100);
      }
    });

    it('should calculate total impact correctly', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const totalImpact = calculateTotalImpact(result.proposals);
      assert.ok(totalImpact.failure_reduction > 0);
      assert.ok(totalImpact.efficiency_gain > 0);
    });

    it('should return zero impact for empty proposals', () => {
      const totalImpact = calculateTotalImpact([]);
      assert.equal(totalImpact.failure_reduction, 0);
      assert.equal(totalImpact.efficiency_gain, 0);
    });
  });

  describe('Test 8: Proposal Filtering', () => {
    it('should filter by severity', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const criticalProposals = getProposalsBySeverity(result.proposals, 'CRITICAL');
      assert.equal(criticalProposals.length, 1);
      assert.equal(criticalProposals[0].severity, 'CRITICAL');
    });

    it('should filter by status', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const approvedProposals = getProposalsByStatus(result.proposals, 'APPROVED');
      assert.ok(approvedProposals.length > 0);
      assert.ok(approvedProposals.every(p => p.status === 'APPROVED'));
    });

    it('should return empty array for non-existent filter', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const proposals = getProposalsBySeverity(result.proposals, 'INVALID');
      assert.equal(proposals.length, 0);
    });
  });

  describe('Test 9: Result Structure', () => {
    it('should return valid result structure', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      assert.ok(result.result_id);
      assert.ok(result.generated_at);
      assert.equal(typeof result.total_proposals, 'number');
      assert.ok(Array.isArray(result.proposals));
      assert.ok(result.summary);
    });

    it('should populate summary counts correctly', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      assert.equal(result.summary.critical, 1);
      assert.equal(result.summary.high, 1);
      assert.equal(result.summary.medium, 1);
      assert.equal(result.summary.low, 1);
    });

    it('should track approved vs pending counts', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      assert.ok(result.summary.approved > 0);
      assert.ok(result.summary.pending_review > 0);
    });

    it('should reference source report ID', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      assert.equal(result.source_report_id, mockPatternReport.report_id);
    });
  });

  describe('Test 10: Validation Helpers', () => {
    it('should validate correct proposal structure', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      for (const proposal of result.proposals) {
        assert.equal(isValidProposal(proposal), true);
      }
    });

    it('should reject invalid proposal structure', () => {
      assert.equal(isValidProposal(null), false);
      assert.equal(isValidProposal({}), false);
      assert.equal(isValidProposal({ proposal_id: 'test' }), false);
    });

    it('should reject proposal missing required fields', () => {
      const invalid = {
        proposal_id: 'test',
        source_patterns: ['TIMEOUT'],
        severity: 'LOW',
        // Missing title, description, recommended_action, status
      };
      assert.equal(isValidProposal(invalid), false);
    });
  });

  describe('Test 11: Constants and Exports', () => {
    it('should export PROPOSAL_STATUSES', () => {
      assert.ok(Array.isArray(PROPOSAL_STATUSES));
      assert.equal(PROPOSAL_STATUSES.length, 5);
      assert.ok(PROPOSAL_STATUSES.includes('DRAFT'));
      assert.ok(PROPOSAL_STATUSES.includes('REVIEW'));
      assert.ok(PROPOSAL_STATUSES.includes('APPROVED'));
      assert.ok(PROPOSAL_STATUSES.includes('IMPLEMENTED'));
      assert.ok(PROPOSAL_STATUSES.includes('DECLINED'));
    });

    it('should export EFFORT_LEVELS', () => {
      assert.ok(Array.isArray(EFFORT_LEVELS));
      assert.equal(EFFORT_LEVELS.length, 3);
      assert.ok(EFFORT_LEVELS.includes('MINIMAL'));
      assert.ok(EFFORT_LEVELS.includes('MODERATE'));
      assert.ok(EFFORT_LEVELS.includes('SIGNIFICANT'));
    });

    it('should export SEVERITY_LEVELS', () => {
      assert.ok(Array.isArray(SEVERITY_LEVELS));
      assert.equal(SEVERITY_LEVELS.length, 4);
      assert.ok(SEVERITY_LEVELS.includes('LOW'));
      assert.ok(SEVERITY_LEVELS.includes('MEDIUM'));
      assert.ok(SEVERITY_LEVELS.includes('HIGH'));
      assert.ok(SEVERITY_LEVELS.includes('CRITICAL'));
    });
  });

  describe('Test 12: Cross-Integration with Pattern Matching', () => {
    it('should work with full pattern report structure', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      assert.ok(result.result_id);
      assert.ok(result.proposals.length > 0);
      for (const proposal of result.proposals) {
        assert.ok(isValidProposal(proposal));
      }
    });

    it('should maintain traceability to source patterns', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      for (const proposal of result.proposals) {
        assert.ok(Array.isArray(proposal.source_patterns));
        assert.ok(proposal.source_patterns.length > 0);
        assert.ok(typeof proposal.source_patterns[0] === 'string');
      }
    });

    it('should preserve task correlations', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const providerProposal = result.proposals.find(p => p.source_patterns[0] === 'PROVIDER_ERROR');
      assert.equal(providerProposal.related_task_ids.length, 3);
      assert.ok(providerProposal.related_task_ids.includes('task-001'));
    });
  });

  describe('Test 13: Priority Score Calculation', () => {
    it('should calculate consistent priority scores', () => {
      const result1 = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const result2 = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      
      // Same input should produce same priority scores
      for (let i = 0; i < result1.proposals.length; i++) {
        assert.equal(result1.proposals[i].priority_score, result2.proposals[i].priority_score);
      }
    });

    it('应该 prioritize higher severity × count over lower', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const critical = result.proposals.find(p => p.severity === 'CRITICAL');
      const high = result.proposals.find(p => p.severity === 'HIGH');
      
      // CRITICAL with count 12 should have higher score than HIGH with count 8
      assert.ok(critical.priority_score > high.priority_score);
    });
  });

  describe('Test 14: Description Generation', () => {
    it('should include pattern count in description', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const proposal = result.proposals.find(p => p.source_patterns[0] === 'RETRY_EXHAUSTED');
      assert.ok(proposal.description.includes('8'));
      assert.ok(proposal.description.includes('2'));
    });

    it('should use custom rule description when provided', () => {
      const config = new AutoImprovementConfig({
        customRules: {
          TIMEOUT: {
            title: 'Custom Title',
            description: 'Custom description text',
            action: 'Custom action',
            effort: 'MINIMAL',
            minCount: 1,
            failureReduction: 50,
            efficiencyGain: 10,
          },
        },
      });
      
      const report = {
        ...mockPatternReport,
        patterns: [
          {
            pattern_type: 'TIMEOUT',
            count: 1,
            severity: 'LOW',
            task_ids: ['task-001'],
            first_occurrence: '2026-09-05T10:00:00Z',
            last_occurrence: '2026-09-05T10:00:00Z',
            trend: 'STABLE',
          },
        ],
      };
      
      const result = AUTO_IMPROVEMENT_PROPOSAL(report, config);
      assert.equal(result.proposals[0].description, 'Custom description text Detected 1 occurrences across 1 task(s).');
    });
  });

  describe('Test 15: JSON Serialization', () => {
    it('should produce valid JSON output', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const json = JSON.stringify(result);
      const parsed = JSON.parse(json);
      assert.equal(parsed.total_proposals, result.total_proposals);
      assert.equal(parsed.proposals.length, result.proposals.length);
    });

    it('should preserve all fields through serialization', () => {
      const result = AUTO_IMPROVEMENT_PROPOSAL(mockPatternReport);
      const json = JSON.stringify(result);
      const parsed = JSON.parse(json);
      
      assert.ok(parsed.result_id);
      assert.ok(parsed.generated_at);
      assert.ok(parsed.source_report_id);
      assert.ok(Array.isArray(parsed.proposals));
      assert.ok(parsed.summary);
    });
  });
});

console.log('\n✅ All 30+ tests completed for AUTO_IMPROVEMENT_PROPOSAL\n');
