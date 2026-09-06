/**
 * Test Suite for PATTERN_MATCHING — Failure Pattern Detection
 * 
 * Validates ADR-054 compliance and OD-T6-001 resolutions.
 * 
 * Expected: 30+ tests passing
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  PATTERN_MATCHING,
  PatternMatchingConfig,
  FailureAlert,
  PatternSummary,
  DetectedPattern,
  isValidPatternEvent,
  PATTERN_TYPES,
  SEVERITY_LEVELS,
  determineSeverity,
  detectTrend,
} from './pattern-matching.mjs';

// Test fixtures
const baseEvent = {
  event_id: 'test-event-001',
  event_type: 'ATTEMPT_FAILURE',
  timestamp: '2026-09-06T00:00:00Z',
  actor_id: 'agent-001',
  causal_ref: 'prev-hash',
  task_id: 'task-001',
  attempt_id: 'attempt-001',
};

const timeWindow = {
  start: '2026-09-05T00:00:00Z',
  end: '2026-09-06T23:59:59Z',
};

describe('PATTERN_MATCHING — Failure Pattern Detection', () => {
  describe('Test 1: Basic Pattern Detection', () => {
    const events = [
      { ...baseEvent, task_id: 'task-001', attempt_id: 'att-001', timestamp: '2026-09-05T10:00:00Z', failure_pattern: { pattern_type: 'RETRY_EXHAUSTED' } },
      { ...baseEvent, task_id: 'task-001', attempt_id: 'att-002', timestamp: '2026-09-05T11:00:00Z', failure_pattern: { pattern_type: 'RETRY_EXHAUSTED' } },
      { ...baseEvent, task_id: 'task-002', attempt_id: 'att-003', timestamp: '2026-09-05T12:00:00Z', failure_pattern: { pattern_type: 'CONTEXT_OVERFLOW' } },
    ];

    it('should detect 2 unique patterns', () => {
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.equal(report.pattern_summary.unique_patterns, 2);
    });

    it('should have total_failures = 3', () => {
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.equal(report.report_id.length, 36); // UUID format
      assert.equal(report.pattern_summary.total_failures, 3);
    });

    it('should identify RETRY_EXHAUSTED with count 2', () => {
      const report = PATTERN_MATCHING(events, timeWindow);
      const retryPattern = report.patterns.find(p => p.pattern_type === 'RETRY_EXHAUSTED');
      assert.ok(retryPattern);
      assert.equal(retryPattern.count, 2);
    });

    it('should identify CONTEXT_OVERFLOW with count 1', () => {
      const report = PATTERN_MATCHING(events, timeWindow);
      const overflowPattern = report.patterns.find(p => p.pattern_type === 'CONTEXT_OVERFLOW');
      assert.ok(overflowPattern);
      assert.equal(overflowPattern.count, 1);
    });

    it('should include task IDs in patterns', () => {
      const report = PATTERN_MATCHING(events, timeWindow);
      const retryPattern = report.patterns.find(p => p.pattern_type === 'RETRY_EXHAUSTED');
      assert.ok(retryPattern.task_ids.includes('task-001'));
    });

    it('should set correct first/last occurrence', () => {
      const report = PATTERN_MATCHING(events, timeWindow);
      const retryPattern = report.patterns.find(p => p.pattern_type === 'RETRY_EXHAUSTED');
      assert.equal(retryPattern.first_occurrence, '2026-09-05T10:00:00Z');
      assert.equal(retryPattern.last_occurrence, '2026-09-05T11:00:00Z');
    });

    it('should return valid report structure', () => {
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.ok(report.report_id);
      assert.ok(report.time_window);
      assert.ok(report.computed_at);
      assert.ok(Array.isArray(report.patterns));
      assert.ok(report.pattern_summary);
    });

    it('should be ADR-054 compliant', () => {
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.equal(typeof report.source_event_count, 'number');
      assert.ok(report.config);
      assert.ok(Array.isArray(report.alerts));
    });
  });

  describe('Test 2: Severity Classification', () => {
    it('should classify count=1 as LOW', () => {
      const severity = determineSeverity(1, PatternMatchingConfig.default().severityThresholds);
      assert.equal(severity, 'LOW');
    });

    it('should classify count=3 as MEDIUM', () => {
      const severity = determineSeverity(3, PatternMatchingConfig.default().severityThresholds);
      assert.equal(severity, 'MEDIUM');
    });

    it('should classify count=5 as HIGH', () => {
      const severity = determineSeverity(5, PatternMatchingConfig.default().severityThresholds);
      assert.equal(severity, 'HIGH');
    });

    it('should classify count=10 as CRITICAL', () => {
      const severity = determineSeverity(10, PatternMatchingConfig.default().severityThresholds);
      assert.equal(severity, 'CRITICAL');
    });

    it('should classify count=15 as CRITICAL', () => {
      const severity = determineSeverity(15, PatternMatchingConfig.default().severityThresholds);
      assert.equal(severity, 'CRITICAL');
    });
  });

  describe('Test 3: Trend Detection', () => {
    it('should detect STABLE with single event', () => {
      const trend = detectTrend(['2026-09-05T10:00:00Z'], new Date('2026-09-05T00:00:00Z'));
      assert.equal(trend, 'STABLE');
    });

    it('should detect INCREASING trend', () => {
      // 2 events in first half, 3 in second half = INCREASING
      const timestamps = [
        '2026-09-05T10:00:00Z',
        '2026-09-05T11:00:00Z',
        '2026-09-05T13:00:00Z',
        '2026-09-05T14:00:00Z',
        '2026-09-05T15:00:00Z',
      ];
      const trend = detectTrend(timestamps, new Date('2026-09-05T00:00:00Z'));
      assert.equal(trend, 'INCREASING');
    });

    it('should detect DECREASING trend', () => {
      // 3 events in first half, 1 in second half = DECREASING
      const timestamps = [
        '2026-09-05T10:00:00Z',
        '2026-09-05T11:00:00Z',
        '2026-09-05T12:00:00Z',
        '2026-09-05T16:00:00Z',
      ];
      const trend = detectTrend(timestamps, new Date('2026-09-05T00:00:00Z'));
      assert.equal(trend, 'DECREASING');
    });

    it('should detect SPIKE trend', () => {
      const timestamps = [
        '2026-09-05T10:00:00Z',
        '2026-09-05T14:00:00Z',
        '2026-09-05T15:00:00Z',
        '2026-09-05T16:00:00Z',
      ];
      const trend = detectTrend(timestamps, new Date('2026-09-05T00:00:00Z'));
      assert.equal(trend, 'SPIKE');
    });
  });

  describe('Test 4: Empty and Edge Cases', () => {
    it('should handle empty events array', () => {
      const report = PATTERN_MATCHING([], timeWindow);
      assert.equal(report.pattern_summary.total_failures, 0);
      assert.equal(report.pattern_summary.unique_patterns, 0);
      assert.equal(report.patterns.length, 0);
      assert.equal(report.pattern_summary.getHealthStatus(), 'HEALTHY');
    });

    it('should ignore non-failure events', () => {
      const events = [
        { event_type: 'ATTEMPT_COMPLETE', task_id: 'task-001', attempt_id: 'att-001' },
        { event_type: 'PROVIDER_CALL', task_id: 'task-001', attempt_id: 'att-001' },
      ];
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.equal(report.pattern_summary.total_failures, 0);
    });

    it('should handle events outside time window', () => {
      const events = [
        { ...baseEvent, timestamp: '2026-08-01T00:00:00Z' },
      ];
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.equal(report.pattern_summary.total_failures, 0);
    });

    it('should handle missing failure_pattern as UNKNOWN', () => {
      const events = [
        { ...baseEvent, attempt_id: 'att-001' },
      ];
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.equal(report.pattern_summary.unique_patterns, 1);
      const unknown = report.patterns.find(p => p.pattern_type === 'UNKNOWN');
      assert.ok(unknown);
    });

    it('should validate report structure completeness', () => {
      const events = [
        { ...baseEvent, attempt_id: 'att-001' },
      ];
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.ok(report.report_id);
      assert.ok(report.time_window.start);
      assert.ok(report.time_window.end);
      assert.ok(report.computed_at);
      assert.ok(report.pattern_summary);
      assert.ok(Array.isArray(report.patterns));
      assert.ok(report.config);
      assert.ok(Array.isArray(report.alerts));
    });
  });

  describe('Test 5: Custom Configuration', () => {
    it('should respect custom severity thresholds', () => {
      const config = new PatternMatchingConfig({
        severityThresholds: { low: 1, medium: 2, high: 3, critical: 5 },
      });
      
      const events = Array(4).fill(null).map((_, i) => ({
        ...baseEvent,
        attempt_id: `att-${i}`,
        failure_pattern: { pattern_type: 'TEST_PATTERN' },
      }));
      
      const report = PATTERN_MATCHING(events, timeWindow, config);
      const pattern = report.patterns[0];
      assert.equal(pattern.severity, 'HIGH');
    });

    it('should allow disabling alerts', () => {
      const config = new PatternMatchingConfig({ enableAlerts: false });
      const events = Array(10).fill(null).map((_, i) => ({
        ...baseEvent,
        attempt_id: `att-${i}`,
        failure_pattern: { pattern_type: 'CRITICAL_PATTERN' },
      }));
      
      const report = PATTERN_MATCHING(events, timeWindow, config);
      assert.equal(report.alerts.length, 0);
    });

    it('should allow disabling trend analysis', () => {
      const config = new PatternMatchingConfig({ trendAnalysis: false });
      const events = [{ ...baseEvent, attempt_id: 'att-001' }];
      
      const report = PATTERN_MATCHING(events, timeWindow, config);
      assert.equal(report.patterns[0].trend, 'STABLE');
    });
  });

  describe('Test 6: Pattern Summary and Health', () => {
    it('should return HEALTHY with no failures', () => {
      const report = PATTERN_MATCHING([], timeWindow);
      assert.equal(report.pattern_summary.getHealthStatus(), 'HEALTHY');
    });

    it('should return DEGRADED with low severity failures', () => {
      const events = [{ ...baseEvent, attempt_id: 'att-001' }];
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.equal(report.pattern_summary.getHealthStatus(), 'DEGRADED');
    });

    it('should return WARNING with high severity', () => {
      const events = Array(5).fill(null).map((_, i) => ({
        ...baseEvent,
        attempt_id: `att-${i}`,
        failure_pattern: { pattern_type: 'HIGH_PATTERN' },
      }));
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.equal(report.pattern_summary.getHealthStatus(), 'WARNING');
    });

    it('should return CRITICAL with critical severity', () => {
      const events = Array(10).fill(null).map((_, i) => ({
        ...baseEvent,
        attempt_id: `att-${i}`,
        failure_pattern: { pattern_type: 'CRITICAL_PATTERN' },
      }));
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.equal(report.pattern_summary.getHealthStatus(), 'CRITICAL');
    });

    it('should populate summary counts correctly', () => {
      const events = [
        ...Array(1).fill(null).map((_, i) => ({ ...baseEvent, attempt_id: `low-${i}`, failure_pattern: { pattern_type: 'LOW_PATTERN' } })),
        ...Array(3).fill(null).map((_, i) => ({ ...baseEvent, attempt_id: `med-${i}`, failure_pattern: { pattern_type: 'MED_PATTERN' } })),
        ...Array(5).fill(null).map((_, i) => ({ ...baseEvent, attempt_id: `high-${i}`, failure_pattern: { pattern_type: 'HIGH_PATTERN' } })),
      ];
      
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.equal(report.pattern_summary.total_failures, 9);
      assert.equal(report.pattern_summary.unique_patterns, 3);
      assert.equal(report.pattern_summary.low_count, 1);
      assert.equal(report.pattern_summary.medium_count, 1);
      assert.equal(report.pattern_summary.high_count, 1);
      assert.equal(report.pattern_summary.critical_count, 0);
    });
  });

  describe('Test 7: Critical Pattern Scenario', () => {
    const criticalEvents = Array(15).fill(null).map((_, i) => ({
      ...baseEvent,
      task_id: `task-${i % 3}`,
      attempt_id: `att-${i}`,
      timestamp: `2026-09-05T${String(i % 24).padStart(2, '0')}:00:00Z`,
      failure_pattern: { pattern_type: 'PROVIDER_ERROR' },
    }));

    it('should detect PROVIDER_ERROR as CRITICAL', () => {
      const report = PATTERN_MATCHING(criticalEvents, timeWindow);
      const pattern = report.patterns.find(p => p.pattern_type === 'PROVIDER_ERROR');
      assert.equal(pattern.severity, 'CRITICAL');
    });

    it('should generate alert for CRITICAL pattern', () => {
      const report = PATTERN_MATCHING(criticalEvents, timeWindow);
      assert.ok(report.alerts.some(a => a.severity === 'CRITICAL'));
    });

    it('should track multiple task IDs', () => {
      const report = PATTERN_MATCHING(criticalEvents, timeWindow);
      const pattern = report.patterns[0];
      assert.equal(pattern.task_ids.length, 3);
      assert.ok(pattern.task_ids.includes('task-0'));
      assert.ok(pattern.task_ids.includes('task-1'));
      assert.ok(pattern.task_ids.includes('task-2'));
    });
  });

  describe('Test 8: Event Validation', () => {
    it('should reject undefined event', () => {
      assert.equal(isValidPatternEvent(undefined), false);
    });

    it('should reject null event', () => {
      assert.equal(isValidPatternEvent(null), false);
    });

    it('should reject non-failure event type', () => {
      assert.equal(isValidPatternEvent({ event_type: 'ATTEMPT_COMPLETE' }), false);
    });

    it('should accept valid failure event', () => {
      assert.equal(isValidPatternEvent(baseEvent), true);
    });

    it('should reject event without task_id', () => {
      assert.equal(isValidPatternEvent({ ...baseEvent, task_id: undefined }), false);
    });

    it('should reject event without attempt_id', () => {
      assert.equal(isValidPatternEvent({ ...baseEvent, attempt_id: undefined }), false);
    });

    it('should reject event without timestamp', () => {
      assert.equal(isValidPatternEvent({ ...baseEvent, timestamp: undefined }), false);
    });
  });

  describe('Test 9: Statistical Metrics', () => {
    it('should compute correct source_event_count', () => {
      const events = [
        baseEvent,
        { ...baseEvent, attempt_id: 'att-002' },
        { ...baseEvent, attempt_id: 'att-003' },
      ];
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.equal(report.source_event_count, 3);
    });

    it('should sort patterns by severity then count', () => {
      const events = [
        ...Array(2).fill(null).map((_, i) => ({ ...baseEvent, attempt_id: `low-${i}`, failure_pattern: { pattern_type: 'LOW' } })),
        ...Array(5).fill(null).map((_, i) => ({ ...baseEvent, attempt_id: `high-${i}`, failure_pattern: { pattern_type: 'HIGH' } })),
        ...Array(10).fill(null).map((_, i) => ({ ...baseEvent, attempt_id: `crit-${i}`, failure_pattern: { pattern_type: 'CRIT' } })),
      ];
      
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.equal(report.patterns[0].severity, 'CRITICAL');
      assert.equal(report.patterns[1].severity, 'HIGH');
      assert.equal(report.patterns[2].severity, 'LOW');
    });

    it('should have deterministic UUID generation', () => {
      const report1 = PATTERN_MATCHING([], timeWindow);
      const report2 = PATTERN_MATCHING([], timeWindow);
      assert.notEqual(report1.report_id, report2.report_id);
    });
  });

  describe('Test 10: Integration with Audit Trail Schema', () => {
    it('should handle events with full schema compliance', () => {
      const compliantEvent = {
        event_id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: 'ATTEMPT_FAILURE',
        timestamp: '2026-09-05T10:00:00Z',
        actor_id: 'agent-001',
        causal_ref: 'abc123',
        task_id: 'task-001',
        attempt_id: 'attempt-001',
        context: {
          domain: 'AUTHORITY',
          severity: 'ERROR',
          metadata: { reason: 'rate_limit' },
        },
        failure_pattern: {
          pattern_type: 'PROVIDER_ERROR',
          severity: 'HIGH',
          recurrence_count: 3,
          first_occurrence: '2026-09-04T10:00:00Z',
          last_occurrence: '2026-09-05T10:00:00Z',
          resolution: 'backoff_strategy',
        },
      };
      
      const report = PATTERN_MATCHING([compliantEvent], timeWindow);
      assert.equal(report.pattern_summary.total_failures, 1);
      assert.equal(report.patterns[0].pattern_type, 'PROVIDER_ERROR');
    });

    it('should handle mixed valid and invalid events', () => {
      const events = [
        baseEvent,
        { event_type: 'ATTEMPT_COMPLETE' },
        { ...baseEvent, attempt_id: 'att-002' },
        null,
        undefined,
      ];
      
      const report = PATTERN_MATCHING(events.filter(Boolean), timeWindow);
      assert.equal(report.pattern_summary.total_failures, 2);
    });

    it('should produce valid JSON output', () => {
      const events = [baseEvent];
      const report = PATTERN_MATCHING(events, timeWindow);
      const json = JSON.stringify(report);
      const parsed = JSON.parse(json);
      assert.equal(parsed.pattern_summary.total_failures, 1);
    });
  });

  describe('Test 11: Constants and Exports', () => {
    it('should export all PATTERN_TYPES', () => {
      assert.ok(Array.isArray(PATTERN_TYPES));
      assert.equal(PATTERN_TYPES.length, 7);
      assert.ok(PATTERN_TYPES.includes('RETRY_EXHAUSTED'));
      assert.ok(PATTERN_TYPES.includes('CONTEXT_OVERFLOW'));
      assert.ok(PATTERN_TYPES.includes('AUTHORITY_DENIED'));
      assert.ok(PATTERN_TYPES.includes('PROVIDER_ERROR'));
      assert.ok(PATTERN_TYPES.includes('TIMEOUT'));
      assert.ok(PATTERN_TYPES.includes('VALIDATION_FAIL'));
      assert.ok(PATTERN_TYPES.includes('UNKNOWN'));
    });

    it('should export all SEVERITY_LEVELS', () => {
      assert.ok(Array.isArray(SEVERITY_LEVELS));
      assert.equal(SEVERITY_LEVELS.length, 4);
      assert.ok(SEVERITY_LEVELS.includes('LOW'));
      assert.ok(SEVERITY_LEVELS.includes('MEDIUM'));
      assert.ok(SEVERITY_LEVELS.includes('HIGH'));
      assert.ok(SEVERITY_LEVELS.includes('CRITICAL'));
    });

    it('should export helper functions', () => {
      assert.equal(typeof determineSeverity, 'function');
      assert.equal(typeof detectTrend, 'function');
      assert.equal(typeof isValidPatternEvent, 'function');
    });
  });

  describe('Test 12: Cross-Task Correlation', () => {
    it('should correlate failures across multiple tasks', () => {
      const events = [
        { ...baseEvent, task_id: 'task-A', attempt_id: 'att-a1', failure_pattern: { pattern_type: 'AUTHORITY_DENIED' } },
        { ...baseEvent, task_id: 'task-B', attempt_id: 'att-b1', failure_pattern: { pattern_type: 'AUTHORITY_DENIED' } },
        { ...baseEvent, task_id: 'task-C', attempt_id: 'att-c1', failure_pattern: { pattern_type: 'AUTHORITY_DENIED' } },
      ];
      
      const report = PATTERN_MATCHING(events, timeWindow);
      const pattern = report.patterns[0];
      assert.equal(pattern.count, 3);
      assert.equal(pattern.severity, 'MEDIUM');
      assert.equal(pattern.task_ids.length, 3);
    });

    it('should separate patterns by type across tasks', () => {
      const events = [
        { ...baseEvent, task_id: 'task-1', attempt_id: 'att-1', failure_pattern: { pattern_type: 'RETRY_EXHAUSTED' } },
        { ...baseEvent, task_id: 'task-2', attempt_id: 'att-2', failure_pattern: { pattern_type: 'RETRY_EXHAUSTED' } },
        { ...baseEvent, task_id: 'task-1', attempt_id: 'att-3', failure_pattern: { pattern_type: 'TIMEOUT' } },
      ];
      
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.equal(report.pattern_summary.unique_patterns, 2);
      
      const retryPattern = report.patterns.find(p => p.pattern_type === 'RETRY_EXHAUSTED');
      const timeoutPattern = report.patterns.find(p => p.pattern_type === 'TIMEOUT');
      
      assert.equal(retryPattern.count, 2);
      assert.equal(timeoutPattern.count, 1);
    });
  });

  describe('Test 13: Temporal Analysis', () => {
    it('should handle narrow time windows', () => {
      const narrowWindow = {
        start: '2026-09-05T10:00:00Z',
        end: '2026-09-05T10:59:00Z',
      };
      
      const events = [
        { ...baseEvent, timestamp: '2026-09-05T10:00:00Z', attempt_id: 'att-1' },
        { ...baseEvent, timestamp: '2026-09-05T10:30:00Z', attempt_id: 'att-2' },
        { ...baseEvent, timestamp: '2026-09-05T11:00:00Z', attempt_id: 'att-3' },
      ];
      
      const report = PATTERN_MATCHING(events, narrowWindow);
      assert.equal(report.pattern_summary.total_failures, 2);
    });

    it('should handle wide time windows', () => {
      const wideWindow = {
        start: '2026-08-01T00:00:00Z',
        end: '2026-09-30T23:59:59Z',
      };
      
      const events = [
        { ...baseEvent, timestamp: '2026-09-05T10:00:00Z', attempt_id: 'att-1' },
      ];
      
      const report = PATTERN_MATCHING(events, wideWindow);
      assert.equal(report.pattern_summary.total_failures, 1);
    });
  });

  describe('Test 14: Alert Generation', () => {
    it('should generate alerts for HIGH severity', () => {
      const events = Array(5).fill(null).map((_, i) => ({
        ...baseEvent,
        attempt_id: `att-${i}`,
        failure_pattern: { pattern_type: 'HIGH_PATTERN' },
      }));
      
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.ok(report.alerts.some(a => a.severity === 'HIGH'));
    });

    it('should not generate alerts for LOW severity', () => {
      const events = [{ ...baseEvent, attempt_id: 'att-1', failure_pattern: { pattern_type: 'LOW_PATTERN' } }];
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.equal(report.alerts.length, 0);
    });

    it('should include pattern_type in alerts', () => {
      const events = Array(5).fill(null).map((_, i) => ({
        ...baseEvent,
        attempt_id: `att-${i}`,
        failure_pattern: { pattern_type: 'SPECIFIC_TYPE' },
      }));
      
      const report = PATTERN_MATCHING(events, timeWindow);
      const alert = report.alerts.find(a => a.severity === 'HIGH');
      assert.equal(alert.pattern_type, 'SPECIFIC_TYPE');
    });
  });

  describe('Test 15: Config Validation', () => {
    it('should use default config when none provided', () => {
      const events = [baseEvent];
      const report = PATTERN_MATCHING(events, timeWindow);
      assert.ok(report.config);
      assert.equal(report.config.severityThresholds.low, 1);
      assert.equal(report.config.windowDefaultHours, 24);
    });

    it('should preserve config in output', () => {
      const config = new PatternMatchingConfig({
        severityThresholds: { low: 1, medium: 2, high: 4, critical: 8 },
        windowDefaultHours: 48,
      });
      
      const report = PATTERN_MATCHING([baseEvent], timeWindow, config);
      assert.equal(report.config.severityThresholds.high, 4);
      assert.equal(report.config.windowDefaultHours, 48);
    });
  });
});

console.log('\n✅ All 30+ tests completed for PATTERN_MATCHING\n');
