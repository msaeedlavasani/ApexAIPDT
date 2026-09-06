/**
 * EFFICIENCY_PROJECTION — Token/Context Efficiency Projection Function
 * 
 * Implements the projection layer defined in ADR-053 for computing
 * efficiency metrics from audit trail events.
 * 
 * Design: Projection Layer (Design C)
 * - Reads from AUDIT_TRAIL events
 * - Computes derived metrics on-demand
 * - No new persistence layer
 * - Privacy-preserving (aggregate counts only)
 */

import { randomUUID } from 'node:crypto';

/**
 * Default overflow threshold per OD-T5-002-B
 */
const DEFAULT_OVERFLOW_THRESHOLD = 80;

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
 * Subtract days from date (native replacement for date-fns)
 */
function subDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Efficiency Projection Configuration
 */
export class EfficiencyProjectionConfig {
  /**
   * @param {Object} options
   * @param {number} [options.overflowThreshold=80] - Utilization % threshold for overflow alerts
   * @param {string} [options.granularity='per_provider'] - per_provider | per_model
   * @param {string} [options.countingMode='per_turn'] - per_turn | aggregated
   * @param {boolean} [options.enableAlerts=true] - Enable overflow alerting
   */
  constructor(options = {}) {
    this.overflowThreshold = options.overflowThreshold ?? DEFAULT_OVERFLOW_THRESHOLD;
    this.granularity = options.granularity ?? 'per_provider';
    this.countingMode = options.countingMode ?? 'per_turn';
    this.enableAlerts = options.enableAlerts ?? true;
  }

  /**
   * Create default config (OD-T5-002-B resolved: static 80% threshold)
   */
  static default() {
    return new EfficiencyProjectionConfig({
      overflowThreshold: 80,
      granularity: 'per_provider',
      countingMode: 'per_turn',
    });
  }
}

/**
 * Overflow Alert
 */
export class OverflowAlert {
  /**
   * @param {string} eventId - Related audit event ID
   * @param {number} utilizationPercent - Actual utilization percentage
   * @param {number} threshold - Configured threshold
   */
  constructor(eventId, utilizationPercent, threshold) {
    this.event_id = eventId;
    this.utilization_percent = utilizationPercent;
    this.threshold = threshold;
    this.severity = utilizationPercent >= 100 ? 'CRITICAL' : 'ALERT';
    this.timestamp = formatISO(new Date());
  }

  /**
   * Check if this alert should trigger based on configuration
   */
  shouldTrigger(config) {
    if (!config.enableAlerts) return false;
    return this.utilization_percent >= config.overflowThreshold;
  }
}

/**
 * Compute efficiency projection from audit trail events
 * 
 * @param {Array<Object>} auditEvents - Array of AUDIT_TRAIL events with token_usage
 * @param {Object} timeWindow - { start: ISOString, end: ISOString }
 * @param {EfficiencyProjectionConfig} [config] - Projection configuration
 * @returns {Object} Efficiency projection result
 */
export function EFFICIENCY_PROJECTION(auditEvents, timeWindow, config = EfficiencyProjectionConfig.default()) {
  const startTime = new Date(timeWindow.start).getTime();
  const endTime = new Date(timeWindow.end).getTime();

  // Filter events within time window that have token_usage
  const relevantEvents = auditEvents.filter(event => {
    if (!event.token_usage) return false;
    const eventTime = new Date(event.timestamp).getTime();
    return eventTime >= startTime && eventTime <= endTime;
  });

  // Aggregate metrics
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const utilizations = [];
  let overflowCount = 0;
  let serviceCalls = 0;
  let totalCalls = 0;
  const alerts = [];

  for (const event of relevantEvents) {
    const usage = event.token_usage;
    
    totalInputTokens += usage.input_tokens || 0;
    totalOutputTokens += usage.output_tokens || 0;
    
    if (usage.utilization_percent != null) {
      utilizations.push(usage.utilization_percent);
      
      // Check for overflow
      if (usage.overflow_flag || usage.utilization_percent >= config.overflowThreshold) {
        overflowCount++;
        
        const alert = new OverflowAlert(
          event.event_id,
          usage.utilization_percent,
          config.overflowThreshold
        );
        if (alert.shouldTrigger(config)) {
          alerts.push(alert);
        }
      }
    }

    // Track SERVICE vs ROLE routing for service_ratio
    if (usage.routing_type) {
      totalCalls++;
      if (usage.routing_type === 'SERVICE') {
        serviceCalls++;
      }
    }
  }

  const totalTokens = totalInputTokens + totalOutputTokens;
  
  // Compute derived metrics
  const inputRatio = totalTokens > 0 ? totalInputTokens / totalTokens : 0;
  const avgUtilization = utilizations.length > 0
    ? utilizations.reduce((a, b) => a + b, 0) / utilizations.length
    : 0;
  const p95Utilization = utilizations.length > 0
    ? percentile(utilizations, 95)
    : 0;
  const efficiencyScore = relevantEvents.length > 0
    ? 1 - (overflowCount / relevantEvents.length)
    : 1;
  const serviceRatio = totalCalls > 0
    ? serviceCalls / totalCalls
    : null;

  return {
    projection_id: randomUUID(),
    time_window: timeWindow,
    computed_at: formatISO(new Date()),
    source_event_count: relevantEvents.length,
    metrics: {
      total_tokens: totalTokens,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      input_ratio: parseFloat(inputRatio.toFixed(4)),
      avg_utilization: parseFloat(avgUtilization.toFixed(2)),
      p95_utilization: parseFloat(p95Utilization.toFixed(2)),
      overflow_count: overflowCount,
      efficiency_score: parseFloat(efficiencyScore.toFixed(4)),
      service_ratio: serviceRatio !== null ? parseFloat(serviceRatio.toFixed(4)) : null,
    },
    overflow_threshold: config.overflowThreshold,
    granularity: config.granularity,
    counting_mode: config.countingMode,
    alerts: alerts.map(a => ({
      event_id: a.event_id,
      severity: a.severity,
      utilization_percent: a.utilization_percent,
      threshold: a.threshold,
      timestamp: a.timestamp,
    })),
  };
}

/**
 * Calculate percentile from array
 * @param {number[]} values - Array of numeric values
 * @param {number} percentile - Percentile to calculate (0-100)
 * @returns {number} Percentile value
 */
function percentile(values, percentile) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Validate audit event has required token_usage fields for projection
 * @param {Object} event - Audit trail event
 * @returns {boolean} True if event is valid for projection
 */
export function isValidProjectionEvent(event) {
  if (!event.token_usage) return false;
  
  const { input_tokens, output_tokens, utilization_percent } = event.token_usage;
  
  // At minimum, need some token data
  const hasTokenData = input_tokens != null || output_tokens != null;
  const hasUtilization = utilization_percent != null;
  
  return hasTokenData || hasUtilization;
}

/**
 * Batch projection for multiple time windows
 * @param {Array<Object>} auditEvents - All audit events
 * @param {Array<Object>} timeWindows - Array of {start, end} objects
 * @param {EfficiencyProjectionConfig} [config] - Optional config
 * @returns {Array<Object>} Array of projections
 */
export function BATCH_EFFICIENCY_PROJECTION(auditEvents, timeWindows, config) {
  return timeWindows.map(tw => EFFICIENCY_PROJECTION(auditEvents, tw, config));
}

/**
 * Get overflow summary for alerting
 * @param {Object} projection - Projection result
 * @returns {Object} Summary with alert recommendations
 */
export function getOverflowSummary(projection) {
  const { metrics, overflow_threshold, alerts } = projection;
  
  let status = 'HEALTHY';
  let recommendation = null;
  
  if (metrics.efficiency_score < 0.5) {
    status = 'CRITICAL';
    recommendation = 'Immediate context optimization required';
  } else if (metrics.efficiency_score < 0.8) {
    status = 'WARNING';
    recommendation = 'Review context composition for redundancy';
  } else if (alerts.length > 0) {
    status = 'ALERT';
    recommendation = 'Monitor utilization trends';
  }
  
  return {
    status,
    efficiency_score: metrics.efficiency_score,
    overflow_count: metrics.overflow_count,
    avg_utilization: metrics.avg_utilization,
    threshold: overflow_threshold,
    alert_count: alerts.length,
    recommendation,
    recent_alerts: alerts.slice(-5), // Last 5 alerts
  };
}

// Export helpers for testing
export { subHours, subDays };

// Export for testing
export default {
  EFFICIENCY_PROJECTION,
  BATCH_EFFICIENCY_PROJECTION,
  EfficiencyProjectionConfig,
  OverflowAlert,
  isValidProjectionEvent,
  getOverflowSummary,
  DEFAULT_OVERFLOW_THRESHOLD,
  subHours,
  subDays,
};
