/**
 * PATTERN_MATCHING — Failure Pattern Detection Function
 * 
 * Implements the pattern detection layer defined in ADR-054 for analyzing
 * audit trail events and identifying recurring failure patterns.
 * 
 * Design: Projection Layer (Design C)
 * - Reads from AUDIT_TRAIL events
 * - Computes pattern metrics on-demand
 * - No new persistence layer
 * - Privacy-preserving (aggregate counts only)
 */

import { randomUUID } from 'node:crypto';

/**
 * Default severity thresholds per OD-T6-001-B
 */
const DEFAULT_SEVERITY_THRESHOLDS = {
  low: 1,
  medium: 3,
  high: 5,
  critical: 10,
};

/**
 * Default time window in hours per OD-T6-001-C
 */
const DEFAULT_WINDOW_HOURS = 24;

/**
 * Format ISO timestamp (native replacement for date-fns)
 */
function formatISO(date) {
  return date.toISOString();
}

/**
 * Subtract hours from date (native replacement for date-fns)
 */
function subHours(date, hours) {
  const result = new Date(date);
  result.setHours(result.getHours() - hours);
  return result;
}

/**
 * Pattern Matching Configuration
 */
export class PatternMatchingConfig {
  /**
   * @param {Object} options
   * @param {Object} [options.severityThresholds] - Severity threshold mapping
   * @param {number} [options.windowDefaultHours=24] - Default analysis window
   * @param {boolean} [options.enableAlerts=true] - Enable alert generation
   * @param {boolean} [options.trendAnalysis=true] - Enable trend detection
   */
  constructor(options = {}) {
    this.severityThresholds = options.severityThresholds ?? DEFAULT_SEVERITY_THRESHOLDS;
    this.windowDefaultHours = options.windowDefaultHours ?? DEFAULT_WINDOW_HOURS;
    this.enableAlerts = options.enableAlerts ?? true;
    this.trendAnalysis = options.trendAnalysis ?? true;
  }

  /**
   * Create default config (OD-T6-001 resolved defaults)
   */
  static default() {
    return new PatternMatchingConfig({
      severityThresholds: { ...DEFAULT_SEVERITY_THRESHOLDS },
      windowDefaultHours: DEFAULT_WINDOW_HOURS,
    });
  }
}

/**
 * Failure Pattern Alert
 */
export class FailureAlert {
  /**
   * @param {Object} params
   * @param {string} params.severity
   * @param {string} params.message
   * @param {string} [params.pattern_type]
   */
  constructor(params) {
    this.severity = params.severity;
    this.message = params.message;
    this.pattern_type = params.pattern_type || null;
  }

  /**
   * Convert to serializable object
   */
  toJSON() {
    return {
      severity: this.severity,
      message: this.message,
      ...(this.pattern_type ? { pattern_type: this.pattern_type } : {}),
    };
  }
}

/**
 * Pattern Summary
 */
export class PatternSummary {
  /**
   * @param {Object} params
   * @param {number} params.total_failures
   * @param {number} params.unique_patterns
   * @param {number} params.critical_count
   * @param {number} params.high_count
   * @param {number} params.medium_count
   * @param {number} params.low_count
   */
  constructor(params) {
    this.total_failures = params.total_failures;
    this.unique_patterns = params.unique_patterns;
    this.critical_count = params.critical_count;
    this.high_count = params.high_count;
    this.medium_count = params.medium_count;
    this.low_count = params.low_count;
  }

  /**
   * Get overall health status
   */
  getHealthStatus() {
    if (this.critical_count > 0) return 'CRITICAL';
    if (this.high_count > 0) return 'WARNING';
    if (this.total_failures > 0) return 'DEGRADED';
    return 'HEALTHY';
  }

  toJSON() {
    return {
      total_failures: this.total_failures,
      unique_patterns: this.unique_patterns,
      critical_count: this.critical_count,
      high_count: this.high_count,
      medium_count: this.medium_count,
      low_count: this.low_count,
      health_status: this.getHealthStatus(),
    };
  }
}

/**
 * Pattern Detection Result
 */
export class DetectedPattern {
  /**
   * @param {Object} params
   * @param {string} params.pattern_type
   * @param {number} params.count
   * @param {string} params.severity
   * @param {string[]} params.task_ids
   * @param {string} params.first_occurrence
   * @param {string} params.last_occurrence
   * @param {string} [params.trend]
   */
  constructor(params) {
    this.pattern_type = params.pattern_type;
    this.count = params.count;
    this.severity = params.severity;
    this.task_ids = params.task_ids;
    this.first_occurrence = params.first_occurrence;
    this.last_occurrence = params.last_occurrence;
    this.trend = params.trend || 'STABLE';
  }

  toJSON() {
    return {
      pattern_type: this.pattern_type,
      count: this.count,
      severity: this.severity,
      task_ids: this.task_ids,
      first_occurrence: this.first_occurrence,
      last_occurrence: this.last_occurrence,
      trend: this.trend,
    };
  }
}

/**
 * Determine severity based on count and thresholds
 */
function determineSeverity(count, thresholds) {
  if (count >= thresholds.critical) return 'CRITICAL';
  if (count >= thresholds.high) return 'HIGH';
  if (count >= thresholds.medium) return 'MEDIUM';
  return 'LOW';
}

/**
 * Detect trend based on event timestamps
 */
function detectTrend(timestamps, windowStart) {
  if (timestamps.length < 2) return 'STABLE';
  
  // Use the midpoint of the time range covered by the events
  const firstTs = new Date(timestamps[0]);
  const lastTs = new Date(timestamps[timestamps.length - 1]);
  const midPoint = new Date(firstTs.getTime() + (lastTs.getTime() - firstTs.getTime()) / 2);
  
  const firstHalf = timestamps.filter(t => new Date(t) < midPoint).length;
  const secondHalf = timestamps.filter(t => new Date(t) >= midPoint).length;
  
  if (secondHalf > firstHalf * 1.5) return 'SPIKE';
  if (secondHalf > firstHalf * 1.2) return 'INCREASING';
  if (firstHalf > secondHalf * 1.2) return 'DECREASING';
  return 'STABLE';
}

/**
 * Validate that an event is a valid pattern candidate
 */
export function isValidPatternEvent(event) {
  if (!event) return false;
  if (event.event_type !== 'ATTEMPT_FAILURE') return false;
  if (!event.task_id) return false;
  if (!event.attempt_id) return false;
  if (!event.timestamp) return false;
  return true;
}

/**
 * PATTERN_MATCHING — Main Exported Function
 * 
 * Analyzes audit trail events to detect recurring failure patterns.
 * 
 * @param {Array} auditEvents - Array of audit trail events
 * @param {Object} timeWindow - Time window with start/end ISO strings
 * @param {PatternMatchingConfig} [config] - Configuration options
 * @returns {Object} FailurePatternReport
 */
export function PATTERN_MATCHING(auditEvents, timeWindow, config = PatternMatchingConfig.default()) {
  const startTime = new Date(timeWindow.start);
  const endTime = new Date(timeWindow.end);
  
  // Filter to failure events within time window
  const relevantEvents = auditEvents.filter(event => {
    if (!isValidPatternEvent(event)) return false;
    const eventTime = new Date(event.timestamp).getTime();
    return eventTime >= startTime.getTime() && eventTime <= endTime.getTime();
  });
  
  // Group by pattern_type (or UNKNOWN if not specified)
  const patternGroups = {};
  for (const event of relevantEvents) {
    const patternType = event.failure_pattern?.pattern_type || 'UNKNOWN';
    if (!patternGroups[patternType]) {
      patternGroups[patternType] = [];
    }
    patternGroups[patternType].push(event);
  }
  
  // Build patterns array
  const patterns = [];
  let totalCritical = 0;
  let totalHigh = 0;
  let totalMedium = 0;
  let totalLow = 0;
  
  for (const [patternType, events] of Object.entries(patternGroups)) {
    const taskIds = [...new Set(events.map(e => e.task_id))];
    const timestamps = events.map(e => e.timestamp).sort();
    const count = events.length;
    const severity = determineSeverity(count, config.severityThresholds);
    const trend = config.trendAnalysis ? detectTrend(timestamps, startTime) : 'STABLE';
    
    switch (severity) {
      case 'CRITICAL': totalCritical++; break;
      case 'HIGH': totalHigh++; break;
      case 'MEDIUM': totalMedium++; break;
      default: totalLow++;
    }
    
    patterns.push(new DetectedPattern({
      pattern_type: patternType,
      count,
      severity,
      task_ids: taskIds,
      first_occurrence: timestamps[0],
      last_occurrence: timestamps[timestamps.length - 1],
      trend,
    }));
  }
  
  // Sort by severity (CRITICAL first) then by count
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  patterns.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.count - a.count;
  });
  
  // Generate alerts
  const alerts = [];
  if (config.enableAlerts) {
    for (const pattern of patterns) {
      if (pattern.severity === 'CRITICAL' || pattern.severity === 'HIGH') {
        alerts.push(new FailureAlert({
          severity: pattern.severity,
          message: `Failure pattern "${pattern.pattern_type}" detected ${pattern.count} times (${pattern.trend})`,
          pattern_type: pattern.pattern_type,
        }));
      }
    }
  }
  
  // Build report
  const report = {
    report_id: randomUUID(),
    time_window: timeWindow,
    computed_at: formatISO(new Date()),
    source_event_count: relevantEvents.length,
    pattern_summary: new PatternSummary({
      total_failures: relevantEvents.length,
      unique_patterns: patterns.length,
      critical_count: totalCritical,
      high_count: totalHigh,
      medium_count: totalMedium,
      low_count: totalLow,
    }),
    patterns,
    config: {
      severityThresholds: config.severityThresholds,
      windowDefaultHours: config.windowDefaultHours,
    },
    alerts,
  };
  
  return report;
}

/**
 * Pattern Matching Constants
 */
export const PATTERN_TYPES = [
  'RETRY_EXHAUSTED',
  'CONTEXT_OVERFLOW',
  'AUTHORITY_DENIED',
  'PROVIDER_ERROR',
  'TIMEOUT',
  'VALIDATION_FAIL',
  'UNKNOWN',
];

export const SEVERITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export { determineSeverity, detectTrend };


