/**
 * Test suite for EFFICIENCY_PROJECTION implementation
 * Validates ADR-053 compliance and OD-T5-002 resolutions
 */

import { EFFICIENCY_PROJECTION, EfficiencyProjectionConfig, getOverflowSummary, isValidProjectionEvent, subHours, subDays } from './efficiency-projection.mjs';

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

// Helper to create mock audit events
function makeEvent(id, hoursAgo, tokens = { input: 1000, output: 500 }, utilization = 60, overflow = false, routing = 'SERVICE') {
  return {
    event_id: id,
    event_type: 'PROVIDER_CALL',
    timestamp: subHours(new Date(), hoursAgo).toISOString(),
    actor_id: 'test-agent',
    causal_ref: 'prev-hash',
    task_id: 'DPT-FOUNDATION-038',
    token_usage: {
      input_tokens: tokens.input,
      output_tokens: tokens.output,
      context_window_size: 4096,
      utilization_percent: utilization,
      overflow_flag: overflow,
      routing_type: routing,
    },
  };
}

// Test data setup
const timeWindow = {
  start: subDays(new Date(), 1).toISOString(),
  end: new Date().toISOString(),
};

const normalEvents = [
  makeEvent('evt-001', 12, { input: 1000, output: 500 }, 60, false, 'SERVICE'),
  makeEvent('evt-002', 10, { input: 2000, output: 1000 }, 75, false, 'SERVICE'),
  makeEvent('evt-003', 8, { input: 1500, output: 750 }, 55, false, 'ROLE'),
  makeEvent('evt-004', 6, { input: 3000, output: 1500 }, 85, false, 'SERVICE'), // Above 80% threshold but no overflow
  makeEvent('evt-005', 4, { input: 4000, output: 2000 }, 95, true, 'SERVICE'), // Overflow!
];

const emptyEvents = [];

console.log('═══════════════════════════════════════════════════════');
console.log('EFFICIENCY PROJECTION TEST SUITE');
console.log('Validating ADR-053 + OD-T5-002 resolutions');
console.log('═══════════════════════════════════════════════════════');

// Test 1: Basic projection
section('Test 1: Basic Efficiency Projection');
const basicResult = EFFICIENCY_PROJECTION(normalEvents, timeWindow);

assert(basicResult.projection_id != null, 'Has projection_id');
assert(basicResult.time_window.start === timeWindow.start, 'Preserves time window start');
assert(basicResult.metrics.total_tokens === 17250, `Total tokens correct: expected 17250, got ${basicResult.metrics.total_tokens}`);
assert(basicResult.metrics.input_tokens === 11500, `Input tokens: expected 11500, got ${basicResult.metrics.input_tokens}`);
assert(basicResult.metrics.output_tokens === 5750, `Output tokens: expected 5750, got ${basicResult.metrics.output_tokens}`);
assert(basicResult.source_event_count === 5, `Processed 5 events`);
assert(basicResult.granularity === 'per_provider', 'Default granularity is per_provider (OD-T5-002-A)');
assert(basicResult.counting_mode === 'per_turn', 'Default counting mode is per_turn (OD-T5-002-C)');
assert(basicResult.overflow_threshold === 80, 'Default overflow threshold is 80% (OD-T5-002-B)');

// Test 2: Overflow detection
section('Test 2: Overflow Detection at 80% Threshold');
assert(basicResult.metrics.overflow_count === 2, `Detected 2 overflow events (evt-004 at 85%, evt-005 with flag)`);
assert(basicResult.alerts.length >= 1, 'Generated overflow alert(s)');
assert(basicResult.metrics.efficiency_score < 1.0, `Efficiency score < 1.0 with overflow: ${basicResult.metrics.efficiency_score}`);

// Test 3: Service ratio calculation
section('Test 3: Service Ratio (Determinism Routing)');
assert(basicResult.metrics.service_ratio != null, 'Service ratio computed');
const expectedServiceRatio = 4/5; // 4 SERVICE calls out of 5 total
assert(Math.abs(basicResult.metrics.service_ratio - expectedServiceRatio) < 0.01, 
  `Service ratio correct: expected ~${expectedServiceRatio}, got ${basicResult.metrics.service_ratio}`);

// Test 4: Empty events
section('Test 4: Empty Event Handling');
const emptyResult = EFFICIENCY_PROJECTION(emptyEvents, timeWindow);
assert(emptyResult.metrics.total_tokens === 0, 'Zero tokens for empty events');
assert(emptyResult.metrics.efficiency_score === 1, 'Perfect efficiency with no events');
assert(emptyResult.metrics.service_ratio === null, 'Null service ratio with no calls');
assert(emptyResult.alerts.length === 0, 'No alerts with no events');

// Test 5: Config override
section('Test 5: Custom Configuration');
const customConfig = new EfficiencyProjectionConfig({
  overflowThreshold: 90,
  granularity: 'per_model',
  enableAlerts: false,
});
const customResult = EFFICIENCY_PROJECTION(normalEvents, timeWindow, customConfig);
assert(customResult.overflow_threshold === 90, 'Custom threshold applied');
assert(customResult.granularity === 'per_model', 'Custom granularity applied');
assert(customResult.alerts.length === 0, 'No alerts when disabled');

// Test 6: Overflow summary
section('Test 6: Overflow Summary');
const summary = getOverflowSummary(basicResult);
assert(summary.status === 'WARNING', `Status is WARNING (score=${basicResult.metrics.efficiency_score})`);
assert(summary.recommendation != null, 'Recommendation provided');
assert(summary.overflow_count === 2, 'Overflow count matches (2 events)');
assert(summary.alert_count === basicResult.alerts.length, 'Alert count matches');

// Test 7: Critical efficiency
section('Test 7: Critical Efficiency Scenario');
const criticalEvents = [
  makeEvent('crit-1', 2, { input: 4000, output: 2000 }, 120, true, 'ROLE'),
  makeEvent('crit-2', 1, { input: 4000, output: 2000 }, 150, true, 'ROLE'),
];
const criticalResult = EFFICIENCY_PROJECTION(criticalEvents, timeWindow);
const criticalSummary = getOverflowSummary(criticalResult);
assert(criticalSummary.status === 'CRITICAL', `Status is CRITICAL with multiple overflows`);
assert(criticalSummary.recommendation.includes('Immediate'), 'Critical recommendation provided');

// Test 8: Event validation
section('Test 8: Event Validation');
assert(isValidProjectionEvent(normalEvents[0]), 'Valid event passes validation');
assert(!isValidProjectionEvent({ event_id: 'x', event_type: 'PROVIDER_CALL' }), 'Event without token_usage fails validation');
assert(!isValidProjectionEvent({ token_usage: {} }), 'Event with empty token_usage fails validation');

// Test 9: P95 utilization calculation
section('Test 9: Statistical Metrics');
const statsEvents = [
  makeEvent('s1', 20, { input: 100, output: 50 }, 50, false),
  makeEvent('s2', 19, { input: 200, output: 100 }, 60, false),
  makeEvent('s3', 18, { input: 300, output: 150 }, 70, false),
  makeEvent('s4', 17, { input: 400, output: 200 }, 80, false),
  makeEvent('s5', 16, { input: 500, output: 250 }, 90, false),
];
const statsResult = EFFICIENCY_PROJECTION(statsEvents, timeWindow);
assert(statsResult.metrics.p95_utilization > statsResult.metrics.avg_utilization, 
  `P95 (${statsResult.metrics.p95_utilization}) > avg (${statsResult.metrics.avg_utilization})`);

// Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('═══════════════════════════════════════════════════════');

if (failed > 0) {
  process.exit(1);
}
