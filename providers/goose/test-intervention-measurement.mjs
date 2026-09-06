/**
 * Test suite for INTERVENTION_MEASUREMENT implementation
 * Validates ADR-052 compliance and intervention measurement spec
 */

import {
  INTERVENTION_PROJECTION,
  InterventionMeasurementConfig,
  InterventionEventBuilder,
  isValidInterventionEvent,
  TRIGGER_SOURCES,
  SEVERITY_LEVELS,
  DOMAINS,
  RESOLUTION_METHODS,
  ACTOR_TYPES,
} from './intervention-measurement.mjs';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function section(name) {
  console.log(`\n▶ ${name}`);
}

// Test data setup
const baseTimestamp = new Date('2026-09-06T10:00:00.000Z').toISOString();

const mockInterventionEvents = [
  {
    event_type: 'INTERVENTION',
    intervention_id: 'int-001',
    timestamp: baseTimestamp,
    trigger_source: 'HUMAN_GATE',
    severity: 'MEDIUM',
    domain: 'AUTHORITY',
    context: {
      task_id: 'DPT-FOUNDATION-001',
      work_order_id: 'WO-001',
      attempt_id: 'ATTEMPT-001',
      human_gate_class: 'HG-03',
    },
    description: 'Owner approval required for file write to restricted path',
    evidence_refs: ['hash-abc123', 'hash-def456'],
    resolution: {
      method: 'OWNER_APPROVAL',
      actor: 'owner',
      duration_seconds: 45,
      outcome: 'ALLOW',
    },
    learning: {
      pattern_match: null,
      improvement_proposal: true,
    },
  },
  {
    event_type: 'INTERVENTION',
    intervention_id: 'int-002',
    timestamp: baseTimestamp,
    trigger_source: 'AUTHORITY_ESCALATION',
    severity: 'HIGH',
    domain: 'GRAPH_MUTATION',
    context: {
      task_id: 'DPT-FOUNDATION-002',
      work_order_id: 'WO-002',
      attempt_id: 'ATTEMPT-002',
      human_gate_class: null,
    },
    description: 'L4 evaluation returned ESCALATE for cross-domain power acquisition detection',
    evidence_refs: ['hash-ghi789'],
    resolution: {
      method: 'POLICY_CLARIFICATION',
      actor: 'DPT',
      duration_seconds: 120,
      outcome: 'MODIFIED',
    },
    learning: {
      pattern_match: 'pattern-001',
      improvement_proposal: true,
    },
  },
  {
    event_type: 'INTERVENTION',
    intervention_id: 'int-003',
    timestamp: baseTimestamp,
    trigger_source: 'VERIFICATION_REJECTION',
    severity: 'CRITICAL',
    domain: 'DECISION',
    context: {
      task_id: 'DPT-FOUNDATION-003',
      work_order_id: 'WO-003',
      attempt_id: 'ATTEMPT-003',
      human_gate_class: 'HG-05',
    },
    description: 'Independent verification rejected decision; requires human resolution',
    evidence_refs: ['hash-jkl012', 'hash-mno345'],
    resolution: {
      method: 'ESCALATION',
      actor: 'evaluator',
      duration_seconds: 300,
      outcome: 'DEFERRED',
    },
    learning: {
      pattern_match: null,
      improvement_proposal: false,
    },
  },
];

console.log('═══════════════════════════════════════════════════════');
console.log('INTERVENTION MEASUREMENT TEST SUITE');
console.log('Validating ADR-052 + intervention-measurement-spec');
console.log('═══════════════════════════════════════════════════════');

// Test 1: Basic projection
section('Test 1: Basic Intervention Projection');
const basicResult = INTERVENTION_PROJECTION(mockInterventionEvents);

assert(basicResult.projection_id != null, 'Has projection_id');
assert(basicResult.source_event_count === 3, `Processed 3 source events`);
assert(basicResult.projected_event_count === 3, `Projected all 3 events`);
assert(basicResult.granularity === 'per_intervention', 'Granularity is per_intervention');
assert(basicResult.privacy_mode === true, 'Privacy mode enabled by default');
assert(basicResult.metrics.totalInterventions === 3, 'Total interventions count correct');

// Test 2: Frequency by trigger source
section('Test 2: Frequency by Trigger Source');
assert(basicResult.metrics.frequencyByTrigger['HUMAN_GATE'] === 1, 'HUMAN_GATE count = 1');
assert(basicResult.metrics.frequencyByTrigger['AUTHORITY_ESCALATION'] === 1, 'AUTHORITY_ESCALATION count = 1');
assert(basicResult.metrics.frequencyByTrigger['VERIFICATION_REJECTION'] === 1, 'VERIFICATION_REJECTION count = 1');
assert(basicResult.metrics.frequencyByTrigger['POLICY_AMBIGUITY'] === 0, 'POLICY_AMBIGUITY count = 0');
assert(basicResult.metrics.frequencyByTrigger['CROSS_DOMAIN_CONFLICT'] === 0, 'CROSS_DOMAIN_CONFLICT count = 0');
assert(basicResult.metrics.frequencyByTrigger['FAILURE_RECOVERY'] === 0, 'FAILURE_RECOVERY count = 0');

// Test 3: Frequency by severity
section('Test 3: Frequency by Severity');
assert(basicResult.metrics.frequencyBySeverity['LOW'] === 0, 'LOW severity count = 0');
assert(basicResult.metrics.frequencyBySeverity['MEDIUM'] === 1, 'MEDIUM severity count = 1');
assert(basicResult.metrics.frequencyBySeverity['HIGH'] === 1, 'HIGH severity count = 1');
assert(basicResult.metrics.frequencyBySeverity['CRITICAL'] === 1, 'CRITICAL severity count = 1');

// Test 4: Frequency by domain
section('Test 4: Frequency by Domain');
assert(basicResult.metrics.frequencyByDomain['AUTHORITY'] === 1, 'AUTHORITY domain count = 1');
assert(basicResult.metrics.frequencyByDomain['GRAPH_MUTATION'] === 1, 'GRAPH_MUTATION domain count = 1');
assert(basicResult.metrics.frequencyByDomain['DECISION'] === 1, 'DECISION domain count = 1');
assert(basicResult.metrics.frequencyByDomain['POOL'] === 0, 'POOL domain count = 0');
assert(basicResult.metrics.frequencyByDomain['ENTITLEMENT'] === 0, 'ENTITLEMENT domain count = 0');
assert(basicResult.metrics.frequencyByDomain['CREDIT'] === 0, 'CREDIT domain count = 0');

// Test 5: Frequency by human gate class
section('Test 5: Frequency by Human Gate Class');
assert(basicResult.metrics.frequencyByHumanGateClass['HG-03'] === 1, 'HG-03 count = 1');
assert(basicResult.metrics.frequencyByHumanGateClass['HG-05'] === 1, 'HG-05 count = 1');
assert(basicResult.metrics.frequencyByHumanGateClass['HG-01'] === 0, 'HG-01 count = 0 (not in test data)');

// Test 6: Resolution duration statistics
section('Test 6: Resolution Duration Statistics');
assert(basicResult.metrics.resolutionDurationStats !== null, 'Duration stats computed');
assert(basicResult.metrics.resolutionDurationStats.min === 45, 'Min duration = 45s');
assert(basicResult.metrics.resolutionDurationStats.max === 300, 'Max duration = 300s');
assert(basicResult.metrics.resolutionDurationStats.count === 3, 'Duration count = 3');
assert(basicResult.metrics.resolutionDurationStats.mean > 0, 'Mean duration > 0');

// Test 7: Improvement proposal rate
section('Test 7: Improvement Proposal Rate');
assert(basicResult.metrics.improvementProposalRate > 0, 'Improvement proposal rate > 0');
assert(basicResult.metrics.improvementProposalRate <= 1, 'Improvement proposal rate <= 1');

// Test 8: Empty events
section('Test 8: Empty Event Handling');
const emptyResult = INTERVENTION_PROJECTION([]);
assert(emptyResult.metrics.totalInterventions === 0, 'Zero interventions for empty events');
assert(emptyResult.metrics.resolutionDurationStats === null, 'No duration stats for empty events');
assert(emptyResult.metrics.improvementProposalRate === 0, 'Zero improvement rate for empty events');
assert(emptyResult.projected_event_count === 0, 'Zero projected events');

// Test 9: Time window filtering
section('Test 9: Time Window Filtering');
const oldTimestamp = new Date('2026-08-01T10:00:00.000Z').toISOString();
const recentTimestamp = new Date('2026-09-06T10:00:00.000Z').toISOString();

const mixedEvents = [
  { ...mockInterventionEvents[0], timestamp: oldTimestamp },
  { ...mockInterventionEvents[1], timestamp: recentTimestamp },
  { ...mockInterventionEvents[2], timestamp: recentTimestamp },
];

const filteredResult = INTERVENTION_PROJECTION(mixedEvents, {
  timeWindowStart: '2026-09-01T00:00:00.000Z',
  timeWindowEnd: '2026-09-07T00:00:00.000Z',
});

assert(filteredResult.projected_event_count === 2, 'Filtered to 2 events in window');
assert(filteredResult.metrics.totalInterventions === 2, 'Metrics reflect filtered count');

// Test 10: Trigger source filter
section('Test 10: Trigger Source Filter');
const triggerFiltered = INTERVENTION_PROJECTION(mockInterventionEvents, {
  triggerSources: ['HUMAN_GATE'],
});
assert(triggerFiltered.projected_event_count === 1, 'Filtered to 1 HUMAN_GATE event');
assert(triggerFiltered.metrics.frequencyByTrigger['HUMAN_GATE'] === 1, 'HUMAN_GATE count correct after filter');

// Test 11: Domain filter
section('Test 11: Domain Filter');
const domainFiltered = INTERVENTION_PROJECTION(mockInterventionEvents, {
  domains: ['AUTHORITY'],
});
assert(domainFiltered.projected_event_count === 1, 'Filtered to 1 AUTHORITY event');

// Test 12: Severity filter
section('Test 12: Severity Filter');
const severityFiltered = INTERVENTION_PROJECTION(mockInterventionEvents, {
  severity: 'CRITICAL',
});
assert(severityFiltered.projected_event_count === 1, 'Filtered to 1 CRITICAL event');
assert(severityFiltered.metrics.frequencyBySeverity['CRITICAL'] === 1, 'CRITICAL count correct');

// Test 13: Event builder — valid event
section('Test 13: InterventionEventBuilder — Valid Event');
const builder = new InterventionEventBuilder({
  triggerSource: TRIGGER_SOURCES.HUMAN_GATE,
  severity: SEVERITY_LEVELS.MEDIUM,
  domain: DOMAINS.AUTHORITY,
  description: 'Test intervention for unit testing',
  evidenceRefs: ['hash-test123'],
  taskId: 'DPT-TEST-001',
  workOrderId: 'WO-TEST-001',
  attemptId: 'ATTEMPT-TEST-001',
  humanGateClass: 'HG-02',
  resolution: {
    method: RESOLUTION_METHODS.OWNER_APPROVAL,
    actor: ACTOR_TYPES.OWNER,
    duration_seconds: 30,
    outcome: 'ALLOW',
  },
});

const builtEvent = builder.build();
assert(builtEvent.event_type === 'INTERVENTION', 'Event type is INTERVENTION');
assert(builtEvent.trigger_source === 'HUMAN_GATE', 'Trigger source preserved');
assert(builtEvent.severity === 'MEDIUM', 'Severity preserved');
assert(builtEvent.domain === 'AUTHORITY', 'Domain preserved');
assert(builtEvent.intervention_id != null, 'Generated intervention_id');
assert(builtEvent.context.task_id === 'DPT-TEST-001', 'Task ID preserved');
assert(builtEvent.context.human_gate_class === 'HG-02', 'Human gate class preserved');
assert(builtEvent.evidence_refs.length === 1, 'Evidence refs preserved');
assert(builtEvent.resolution.method === 'OWNER_APPROVAL', 'Resolution method preserved');
assert(builtEvent.learning?.improvement_proposal === true, 'Learning signal generated');

// Test 14: Event builder — invalid trigger source
section('Test 14: InterventionEventBuilder — Invalid Trigger Source');
try {
  new InterventionEventBuilder({
    triggerSource: 'INVALID_SOURCE',
    severity: 'LOW',
    domain: 'AUTHORITY',
    description: 'Should fail',
    evidenceRefs: ['hash'],
    taskId: 'DPT-TEST-002',
    resolution: {
      method: 'OWNER_APPROVAL',
      actor: 'owner',
      duration_seconds: 10,
      outcome: 'ALLOW',
    },
  }).build();
  assert(false, 'Should have thrown for invalid trigger source');
} catch (e) {
  assert(true, 'Correctly threw for invalid trigger source');
}

// Test 15: Event builder — missing evidence refs
section('Test 15: InterventionEventBuilder — Missing Evidence Refs');
try {
  new InterventionEventBuilder({
    triggerSource: 'HUMAN_GATE',
    severity: 'LOW',
    domain: 'AUTHORITY',
    description: 'Should fail',
    evidenceRefs: [],
    taskId: 'DPT-TEST-003',
    resolution: {
      method: 'OWNER_APPROVAL',
      actor: 'owner',
      duration_seconds: 10,
      outcome: 'ALLOW',
    },
  }).build();
  assert(false, 'Should have thrown for empty evidence refs');
} catch (e) {
  assert(true, 'Correctly threw for empty evidence refs');
}

// Test 16: Schema validation — valid event
section('Test 16: isValidInterventionEvent — Valid Event');
const validEvent = {
  event_type: 'INTERVENTION',
  intervention_id: 'test-uuid',
  timestamp: new Date().toISOString(),
  trigger_source: 'HUMAN_GATE',
  severity: 'LOW',
  domain: 'AUTHORITY',
  context: { task_id: 'T-1', human_gate_class: 'HG-01' },
  description: 'Valid test event',
  evidence_refs: ['hash-1'],
  resolution: {
    method: 'OWNER_APPROVAL',
    actor: 'owner',
    duration_seconds: 10,
    outcome: 'ALLOW',
  },
};

const validResult = isValidInterventionEvent(validEvent);
assert(validResult.valid === true, 'Valid event passes validation');
assert(validResult.errors.length === 0, 'No errors for valid event');

// Test 17: Schema validation — invalid event
section('Test 17: isValidInterventionEvent — Invalid Event');
const invalidEvent = {
  event_type: 'INTERVENTION',
  intervention_id: 'test-uuid',
  timestamp: new Date().toISOString(),
  trigger_source: 'INVALID',
  severity: 'LOW',
  domain: 'AUTHORITY',
  context: {},
  description: '',
  evidence_refs: [],
  resolution: {},
};

const invalidResult = isValidInterventionEvent(invalidEvent);
assert(invalidResult.valid === false, 'Invalid event fails validation');
assert(invalidResult.errors.length > 0, 'Errors reported for invalid event');

// Test 18: Config defaults
section('Test 18: InterventionMeasurementConfig Defaults');
const defaultConfig = InterventionMeasurementConfig.default();
assert(defaultConfig.enablePrivacyMode === true, 'Privacy mode enabled by default');
assert(defaultConfig.retentionDays === 90, 'Retention days = 90');
assert(defaultConfig.enableLearningSignals === true, 'Learning signals enabled');

// Test 19: Config with custom options
section('Test 19: InterventionMeasurementConfig Custom Options');
const customConfig = new InterventionMeasurementConfig({
  enablePrivacyMode: false,
  retentionDays: 180,
  excludeDomains: ['CREDIT'],
});
assert(customConfig.enablePrivacyMode === false, 'Custom privacy mode');
assert(customConfig.retentionDays === 180, 'Custom retention days');
assert(customConfig.excludeDomains.includes('CREDIT'), 'Custom excluded domains');

// Test 20: Projection with config
section('Test 20: Projection with Custom Config');
const configFiltered = INTERVENTION_PROJECTION(mockInterventionEvents, {
  config: new InterventionMeasurementConfig({ excludeDomains: ['CREDIT'] }),
});
assert(configFiltered.metrics.frequencyByDomain['CREDIT'] === undefined, 'Excluded domain not present');

// Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log(`RESULTS: ${passed} PASS, ${failed} FAIL`);
console.log('═══════════════════════════════════════════════════════');

if (failed > 0) {
  process.exit(1);
}
