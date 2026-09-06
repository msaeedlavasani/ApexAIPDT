/**
 * INTERVENTION_MEASUREMENT — Human Intervention Measurement for V2 Learning System
 * 
 * Implements ADR-052's architectural decision to project interventions as 
 * structured events from the existing audit trail, without introducing new 
 * persistent entities.
 * 
 * Design: Event Projection (Design C)
 * - Reads from AUDIT_TRAIL events
 * - Computes intervention projections on-demand
 * - No new persistence layer
 * - Privacy-preserving (aggregate counts only)
 */

import { randomUUID } from 'node:crypto';

/**
 * Trigger source constants per ADR-052 §3.1
 */
export const TRIGGER_SOURCES = Object.freeze({
  HUMAN_GATE: 'HUMAN_GATE',
  AUTHORITY_ESCALATION: 'AUTHORITY_ESCALATION',
  VERIFICATION_REJECTION: 'VERIFICATION_REJECTION',
  POLICY_AMBIGUITY: 'POLICY_AMBIGUITY',
  CROSS_DOMAIN_CONFLICT: 'CROSS_DOMAIN_CONFLICT',
  FAILURE_RECOVERY: 'FAILURE_RECOVERY',
});

/**
 * Severity levels per ADR-052 §3.3
 */
export const SEVERITY_LEVELS = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
});

/**
 * Domain classification per ADR-052 §3.4
 */
export const DOMAINS = Object.freeze({
  GRAPH_MUTATION: 'GRAPH_MUTATION',
  AUTHORITY: 'AUTHORITY',
  DECISION: 'DECISION',
  POOL: 'POOL',
  ENTITLEMENT: 'ENTITLEMENT',
  CREDIT: 'CREDIT',
});

/**
 * Resolution methods per ADR-052
 */
export const RESOLUTION_METHODS = Object.freeze({
  OWNER_APPROVAL: 'OWNER_APPROVAL',
  POLICY_CLARIFICATION: 'POLICY_CLARIFICATION',
  AUTHORITY_ADJUSTMENT: 'AUTHORITY_ADJUSTMENT',
  CANCELLATION: 'CANCELLATION',
  ESCALATION: 'ESCALATION',
});

/**
 * Actor types per ADR-052 privacy boundary
 */
export const ACTOR_TYPES = Object.freeze({
  OWNER: 'owner',
  DPT: 'DPT',
  EVALUATOR: 'evaluator',
});

/**
 * Intervention Measurement Configuration
 */
export class InterventionMeasurementConfig {
  /**
   * @param {Object} options
   * @param {boolean} [options.enablePrivacyMode=true] - Enable privacy-preserving aggregates
   * @param {number} [options.retentionDays=90] - Raw metrics retention period
   * @param {boolean} [options.enableLearningSignals=true] - Generate improvement_proposal signals
   * @param {string[]} [options.excludeDomains=[]) - Domains to exclude from measurement
   */
  constructor(options = {}) {
    this.enablePrivacyMode = options.enablePrivacyMode ?? true;
    this.retentionDays = options.retentionDays ?? 90;
    this.enableLearningSignals = options.enableLearningSignals ?? true;
    this.excludeDomains = options.excludeDomains ?? [];
  }

  /**
   * Create default config (privacy-preserving by default)
   */
  static default() {
    return new InterventionMeasurementConfig({
      enablePrivacyMode: true,
      retentionDays: 90,
      enableLearningSignals: true,
    });
  }
}

/**
 * Intervention Event Builder
 * Creates properly structured intervention events per schema
 */
export class InterventionEventBuilder {
  /**
   * @param {Object} options
   * @param {string} options.triggerSource - From TRIGGER_SOURCES
   * @param {string} options.severity - From SEVERITY_LEVELS
   * @param {string} options.domain - From DOMAINS
   * @param {string} options.description - Human-readable description
   * @param {string[]} options.evidenceRefs - Hash-linked audit trail references
   * @param {string} options.taskId - Associated task ID
   * @param {string} [options.workOrderId] - Associated work order ID
   * @param {string} [options.attemptId] - Associated attempt ID
   * @param {string} [options.humanGateClass] - HG-01 through HG-07 if applicable
   * @param {Object} options.resolution - Resolution details
   * @param {boolean} [options.enableLearningSignals=true] - Generate learning signals
   */
  constructor(options) {
    this.triggerSource = options.triggerSource;
    this.severity = options.severity;
    this.domain = options.domain;
    this.description = options.description;
    this.evidenceRefs = options.evidenceRefs;
    this.taskId = options.taskId;
    this.workOrderId = options.workOrderId;
    this.attemptId = options.attemptId;
    this.humanGateClass = options.humanGateClass || null;
    this.resolution = options.resolution;
    this.enableLearningSignals = options.enableLearningSignals ?? true;
  }

  /**
   * Build the intervention event object
   * @returns {Object} Validated intervention event
   */
  build() {
    const interventionId = randomUUID();
    const timestamp = new Date().toISOString();

    // Validate required fields
    this._validate();

    const context = {
      task_id: this.taskId,
      work_order_id: this.workOrderId || null,
      attempt_id: this.attemptId || null,
      human_gate_class: this.humanGateClass,
    };

    const event = {
      event_type: 'INTERVENTION',
      intervention_id: interventionId,
      timestamp,
      trigger_source: this.triggerSource,
      severity: this.severity,
      domain: this.domain,
      context,
      description: this.description,
      evidence_refs: this.evidenceRefs,
      resolution: this.resolution,
    };

    // Add learning signals if enabled
    if (this._shouldGenerateLearningSignal()) {
      event.learning = {
        pattern_match: null,
        improvement_proposal: true,
      };
    }

    return event;
  }

  _validate() {
    if (!Object.values(TRIGGER_SOURCES).includes(this.triggerSource)) {
      throw new Error(`Invalid trigger_source: ${this.triggerSource}`);
    }
    if (!Object.values(SEVERITY_LEVELS).includes(this.severity)) {
      throw new Error(`Invalid severity: ${this.severity}`);
    }
    if (!Object.values(DOMAINS).includes(this.domain)) {
      throw new Error(`Invalid domain: ${this.domain}`);
    }
    if (!this.description || this.description.length < 1 || this.description.length > 2000) {
      throw new Error('Description must be 1-2000 characters');
    }
    if (!Array.isArray(this.evidenceRefs) || this.evidenceRefs.length < 1) {
      throw new Error('At least one evidence_ref is required');
    }
    if (!this.taskId) {
      throw new Error('task_id is required');
    }
    if (!this.resolution || !this.resolution.method || !this.resolution.actor || 
        !this.resolution.duration_seconds !== undefined && this.resolution.duration_seconds < 0 ||
        !this.resolution.outcome) {
      throw new Error('Valid resolution with method, actor, duration_seconds, outcome is required');
    }
    if (!Object.values(RESOLUTION_METHODS).includes(this.resolution.method)) {
      throw new Error(`Invalid resolution method: ${this.resolution.method}`);
    }
    if (!Object.values(ACTOR_TYPES).includes(this.resolution.actor)) {
      throw new Error(`Invalid actor: ${this.resolution.actor}`);
    }
    if (!Object.values(['ALLOW', 'DENY', 'MODIFIED', 'DEFERRED']).includes(this.resolution.outcome)) {
      throw new Error('Invalid outcome');
    }
    if (this.humanGateClass && !/^HG-0[1-7]$/.test(this.humanGateClass)) {
      throw new Error('human_gate_class must match HG-01 through HG-07');
    }
  }

  _shouldGenerateLearningSignal() {
    return this.enableLearningSignals && this.domain !== DOMAINS.CREDIT;
  }
}

/**
 * Measurement Aggregation Results
 */
export class InterventionMetrics {
  constructor(data) {
    this.totalInterventions = data.totalInterventions ?? 0;
    this.frequencyByTrigger = data.frequencyByTrigger ?? {};
    this.frequencyBySeverity = data.frequencyBySeverity ?? {};
    this.frequencyByDomain = data.frequencyByDomain ?? {};
    this.frequencyByHumanGateClass = data.frequencyByHumanGateClass ?? {};
    this.resolutionDurationStats = data.resolutionDurationStats ?? null;
    this.improvementProposalRate = data.improvementProposalRate ?? 0;
    this.timeRange = data.timeRange ?? null;
  }
}

/**
 * INTERVENTION_PROJECTION — Core measurement function
 * 
 * Projects intervention events from audit trail and computes measurement aggregates.
 * 
 * @param {Array<Object>} auditTrailEvents - Array of audit trail events
 * @param {Object} options - Projection options
 * @param {string} [options.timeWindowStart] - ISO 8601 start time
 * @param {string} [options.timeWindowEnd] - ISO 8601 end time
 * @param {string[]} [options.triggerSources] - Filter by trigger sources
 * @param {string[]} [options.domains] - Filter by domains
 * @param {string} [options.severity] - Filter by severity
 * @returns {Object} Projection result with metrics
 */
export function INTERVENTION_PROJECTION(auditTrailEvents, options = {}) {
  const config = options.config || InterventionMeasurementConfig.default();
  
  const timeWindowStart = options.timeWindowStart || subDays(new Date(), 30).toISOString();
  const timeWindowEnd = options.timeWindowEnd || new Date().toISOString();
  
  // Filter events to time window
  const filteredEvents = auditTrailEvents.filter(event => {
    const eventTime = new Date(event.timestamp);
    const start = new Date(timeWindowStart);
    const end = new Date(timeWindowEnd);
    return eventTime >= start && eventTime <= end;
  });

  // Extract intervention events (event_type === 'INTERVENTION')
  const interventionEvents = filteredEvents.filter(e => e.event_type === 'INTERVENTION');

  // Apply additional filters
  let projectedEvents = interventionEvents;
  
  if (options.triggerSources && options.triggerSources.length > 0) {
    projectedEvents = projectedEvents.filter(e => options.triggerSources.includes(e.trigger_source));
  }
  
  if (options.domains && options.domains.length > 0) {
    projectedEvents = projectedEvents.filter(e => options.domains.includes(e.domain));
  }
  
  if (options.severity) {
    projectedEvents = projectedEvents.filter(e => e.severity === options.severity);
  }

  // Compute aggregates
  const metrics = _computeMetrics(projectedEvents, config);

  return {
    projection_id: randomUUID(),
    source_event_count: interventionEvents.length,
    projected_event_count: projectedEvents.length,
    time_window: {
      start: timeWindowStart,
      end: timeWindowEnd,
    },
    metrics,
    granularity: 'per_intervention',
    privacy_mode: config.enablePrivacyMode,
  };
}

/**
 * Compute measurement aggregates from projected intervention events
 */
function _computeMetrics(events, config) {
  if (events.length === 0) {
    return new InterventionMetrics({
      totalInterventions: 0,
      frequencyByTrigger: {},
      frequencyBySeverity: {},
      frequencyByDomain: {},
      frequencyByHumanGateClass: {},
      resolutionDurationStats: null,
      improvementProposalRate: 0,
      timeRange: null,
    });
  }

  // Frequency by trigger source
  const frequencyByTrigger = {};
  for (const source of Object.values(TRIGGER_SOURCES)) {
    frequencyByTrigger[source] = 0;
  }
  for (const event of events) {
    frequencyByTrigger[event.trigger_source] = (frequencyByTrigger[event.trigger_source] || 0) + 1;
  }

  // Frequency by severity
  const frequencyBySeverity = {};
  for (const level of Object.values(SEVERITY_LEVELS)) {
    frequencyBySeverity[level] = 0;
  }
  for (const event of events) {
    frequencyBySeverity[event.severity] = (frequencyBySeverity[event.severity] || 0) + 1;
  }

  // Frequency by domain
  const frequencyByDomain = {};
  for (const domain of Object.values(DOMAINS)) {
    if (!config.excludeDomains.includes(domain)) {
      frequencyByDomain[domain] = 0;
    }
  }
  for (const event of events) {
    if (!config.excludeDomains.includes(event.domain)) {
      frequencyByDomain[event.domain] = (frequencyByDomain[event.domain] || 0) + 1;
    }
  }

  // Frequency by human gate class
  const frequencyByHumanGateClass = {};
  // Initialize all possible HG classes to 0
  for (let i = 1; i <= 7; i++) {
    frequencyByHumanGateClass[`HG-0${i}`] = 0;
  }
  for (const event of events) {
    const hgClass = event.context?.human_gate_class;
    if (hgClass && frequencyByHumanGateClass.hasOwnProperty(hgClass)) {
      frequencyByHumanGateClass[hgClass]++;
    }
  }

  // Resolution duration statistics
  const durations = events
    .map(e => e.resolution?.duration_seconds)
    .filter(d => typeof d === 'number' && d >= 0);
  
  let resolutionDurationStats = null;
  if (durations.length > 0) {
    durations.sort((a, b) => a - b);
    const p50Index = Math.floor(durations.length * 0.5);
    const p95Index = Math.floor(durations.length * 0.95);
    
    resolutionDurationStats = {
      min: durations[0],
      max: durations[durations.length - 1],
      p50: durations[p50Index] ?? durations[Math.floor(durations.length / 2)],
      p95: durations[p95Index] ?? durations[Math.floor(durations.length * 0.95)],
      mean: durations.reduce((a, b) => a + b, 0) / durations.length,
      count: durations.length,
    };
  }

  // Improvement proposal rate
  const improvementProposals = events.filter(e => 
    e.learning?.improvement_proposal === true
  ).length;
  const improvementProposalRate = events.length > 0 
    ? improvementProposals / events.length 
    : 0;

  return new InterventionMetrics({
    totalInterventions: events.length,
    frequencyByTrigger,
    frequencyBySeverity,
    frequencyByDomain,
    frequencyByHumanGateClass,
    resolutionDurationStats,
    improvementProposalRate,
    timeRange: {
      earliest: events.reduce((min, e) => e.timestamp < min ? e.timestamp : min, events[0].timestamp),
      latest: events.reduce((max, e) => e.timestamp > max ? e.timestamp : max, events[0].timestamp),
    },
  });
}

/**
 * isValidInterventionEvent — Schema validation helper
 * 
 * Validates an intervention event against the schema constraints.
 * 
 * @param {Object} event - Event to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function isValidInterventionEvent(event) {
  const errors = [];

  if (!event) {
    return { valid: false, errors: ['Event is null or undefined'] };
  }

  // Required fields
  const requiredFields = [
    'event_type', 'intervention_id', 'timestamp', 'trigger_source',
    'severity', 'domain', 'context', 'description', 'evidence_refs', 'resolution'
  ];
  for (const field of requiredFields) {
    if (event[field] === undefined || event[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // event_type must be 'INTERVENTION'
  if (event.event_type !== 'INTERVENTION') {
    errors.push('event_type must be "INTERVENTION"');
  }

  // Trigger source validation
  if (!Object.values(TRIGGER_SOURCES).includes(event.trigger_source)) {
    errors.push(`Invalid trigger_source: ${event.trigger_source}`);
  }

  // Severity validation
  if (!Object.values(SEVERITY_LEVELS).includes(event.severity)) {
    errors.push(`Invalid severity: ${event.severity}`);
  }

  // Domain validation
  if (!Object.values(DOMAINS).includes(event.domain)) {
    errors.push(`Invalid domain: ${event.domain}`);
  }

  // Description length
  if (typeof event.description !== 'string' || 
      event.description.length < 1 || 
      event.description.length > 2000) {
    errors.push('Description must be 1-2000 characters');
  }

  // Evidence refs
  if (!Array.isArray(event.evidence_refs) || event.evidence_refs.length < 1) {
    errors.push('At least one evidence_ref is required');
  }

  // Resolution validation
  if (event.resolution) {
    const resolutionRequired = ['method', 'actor', 'duration_seconds', 'outcome'];
    for (const field of resolutionRequired) {
      if (event.resolution[field] === undefined) {
        errors.push(`Missing required resolution field: ${field}`);
      }
    }
    if (event.resolution.method && !Object.values(RESOLUTION_METHODS).includes(event.resolution.method)) {
      errors.push(`Invalid resolution method: ${event.resolution.method}`);
    }
    if (event.resolution.actor && !Object.values(ACTOR_TYPES).includes(event.resolution.actor)) {
      errors.push(`Invalid actor: ${event.resolution.actor}`);
    }
    if (typeof event.resolution.duration_seconds !== 'number' || event.resolution.duration_seconds < 0) {
      errors.push('duration_seconds must be a non-negative number');
    }
    if (event.resolution.outcome && !['ALLOW', 'DENY', 'MODIFIED', 'DEFERRED'].includes(event.resolution.outcome)) {
      errors.push('Invalid outcome');
    }
  }

  // Human gate class pattern
  if (event.context?.human_gate_class && !/^HG-0[1-7]$/.test(event.context.human_gate_class)) {
    errors.push('human_gate_class must match HG-01 through HG-07');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper functions
 */

/**
 * Format ISO timestamp (native replacement for date-fns)
 */
function formatISO(date) {
  return date.toISOString();
}

/**
 * Subtract hours from date
 */
function subHours(date, hours) {
  const result = new Date(date);
  result.setHours(result.getHours() - hours);
  return result;
}

/**
 * Subtract days from date
 */
function subDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Export all public API
 */
export const INTERVENTION_MEASUREMENT = {
  TRIGGER_SOURCES,
  SEVERITY_LEVELS,
  DOMAINS,
  RESOLUTION_METHODS,
  ACTOR_TYPES,
  InterventionMeasurementConfig,
  InterventionEventBuilder,
  InterventionMetrics,
  INTERVENTION_PROJECTION,
  isValidInterventionEvent,
};

export default INTERVENTION_MEASUREMENT;
