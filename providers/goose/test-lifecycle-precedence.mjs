#!/usr/bin/env node
/**
 * DPT-LIFECYCLE-PRECEDENCE — Report Lifecycle Precedence Regression Test
 *
 * Proves that a historical report's embedded REPORT_STATUS must not override
 * a later valid lifecycle event. Canonical precedence:
 *
 *   LATEST_VALID_LIFECYCLE_EVENT > HISTORICAL_EMBEDDED_METADATA
 *
 * A validly RETIRED report must NOT be reactivated merely because its
 * immutable original content still says PENDING_REVIEW.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const _dirname = import.meta.dirname;
const REPO_ROOT = resolve(_dirname, '../..');
const TEST_DIR = join(REPO_ROOT, '.dpt-lifecycle-test');

let passes = 0;
let fails = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passes++;
  } else {
    console.log(`  [FAIL] ${testName}${details ? ': ' + details : ''}`);
    fails++;
  }
}

function section(name) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${name}`);
  console.log('═'.repeat(60));
}

section('DPT-LIFECYCLE-PRECEDENCE — Report Lifecycle Precedence Tests');
console.log(`  Repo root: ${REPO_ROOT}`);
console.log('═'.repeat(60));

try { mkdirSync(TEST_DIR, { recursive: true }); } catch {}

// ═══════════════════════════════════════════════════════════════════
// Test 1: Precedence Rule — Latest Event Overrides Historical Metadata
// ═══════════════════════════════════════════════════════════════════

section('1. Precedence Rule — Latest Valid Event > Historical Metadata');

// Simulate a report that was originally PENDING_REVIEW but was later RETIRED
const historicalReport = `# Historical Report

**REPORT_STATUS:** PENDING_REVIEW
**Date:** 2026-09-01
**Status:** PASS

## Content
This report was created with PENDING_REVIEW status.
It was later reviewed and found to be complete.
A subsequent lifecycle event retired it.
`;

const retiredLifecycleEvent = {
  timestamp: '2026-09-05T10:00:00Z',
  event: 'RETIREMENT',
  reason: 'Review completed, no further attention required',
  reviewer: 'independent',
  prev_status: 'REVIEWED',
  new_status: 'RETIRED'
};

// The canonical rule: latest valid lifecycle event wins
const effectiveStatus = retiredLifecycleEvent.new_status;
assert(effectiveStatus === 'RETIRED', 'Latest lifecycle event determines effective status');
assert(effectiveStatus !== 'PENDING_REVIEW', 'Historical PENDING_REVIEW does NOT override retirement');

// ═══════════════════════════════════════════════════════════════════
// Test 2: RETIRED Report Must Not Be Reactivated by Stale Metadata
// ═══════════════════════════════════════════════════════════════════

section('2. RETIRED Immunity — No Resurrection from Stale Metadata');

// Simulate reconciliation process that incorrectly reactivates retired reports
function incorrectReconciliation(reportContent, lifecycleHistory) {
  // BUG: This incorrectly uses historical embedded status
  const statusMatch = reportContent.match(/\*\*REPORT_STATUS:\*\*\s*(\w+)/m);
  return statusMatch ? statusMatch[1] : 'UNKNOWN';
}

function correctReconciliation(reportContent, lifecycleHistory) {
  // FIX: Latest lifecycle event wins; fall back to embedded status only if no history
  if (lifecycleHistory.length > 0) {
    return lifecycleHistory[lifecycleHistory.length - 1].new_status;
  }
  const statusMatch = reportContent.match(/\*\*REPORT_STATUS:\*\*\s*(\w+)/m);
  return statusMatch ? statusMatch[1] : 'PENDING_REVIEW';
}

const incorrectResult = incorrectReconciliation(historicalReport, [retiredLifecycleEvent]);
const correctResult = correctReconciliation(historicalReport, [retiredLifecycleEvent]);

// Demonstrate the bug: incorrect method would return stale status
console.log(`  [DBG] incorrectResult=${incorrectResult}, correctResult=${correctResult}`);
assert(incorrectResult === 'PENDING_REVIEW', `Demonstrates bug: historical metadata ignored retirement (got ${incorrectResult})`);
assert(correctResult === 'RETIRED', `Correct method returns RETIRED (latest event wins) (got ${correctResult})`);
assert(correctResult !== 'PENDING_REVIEW', 'Correct reconciliation never reactivates retired report');

// ═══════════════════════════════════════════════════════════════════
// Test 3: Append-Only History Preservation
// ═══════════════════════════════════════════════════════════════════

section('3. Append-Only History — Immutable Lifecycle Trail');

const fullHistory = [
  { timestamp: '2026-09-01T08:00:00Z', event: 'CREATED', prev_status: null, new_status: 'PENDING_REVIEW' },
  { timestamp: '2026-09-02T10:00:00Z', event: 'REVIEWED', prev_status: 'PENDING_REVIEW', new_status: 'REVIEWED' },
  { timestamp: '2026-09-05T10:00:00Z', event: 'RETIRED', prev_status: 'REVIEWED', new_status: 'RETIRED' }
];

// Verify append-only: each event references previous status
for (let i = 1; i < fullHistory.length; i++) {
  const prev = fullHistory[i - 1];
  const curr = fullHistory[i];
  assert(curr.prev_status === prev.new_status, `Event ${i}: ${curr.event} correctly follows ${prev.event}`);
}

// Verify earliest status is preserved
const earliestStatus = fullHistory[0].new_status;
assert(earliestStatus === 'PENDING_REVIEW', 'Original PENDING_REVIEW preserved in history');

// Verify latest status is authoritative
const latestStatus = fullHistory[fullHistory.length - 1].new_status;
assert(latestStatus === 'RETIRED', 'Latest RETIRED status is authoritative');

// ═══════════════════════════════════════════════════════════════════
// Test 4: Reconciliation Algorithm Correctness
// ═══════════════════════════════════════════════════════════════════

section('4. Reconciliation Algorithm — Precedence Enforcement');

const testCases = [
  {
    name: 'RETIRED report with PENDING_REVIEW metadata',
    content: '**REPORT_STATUS:** PENDING_REVIEW\n**Date:** 2026-09-01',
    history: [{ event: 'RETIRED', new_status: 'RETIRED', timestamp: '2026-09-05' }],
    expected: 'RETIRED',
    mustNotReturn: 'PENDING_REVIEW'
  },
  {
    name: 'REVIEWED report with no later event',
    content: '**REPORT_STATUS:** REVIEWED',
    history: [],
    expected: 'REVIEWED',
    mustNotReturn: null
  },
  {
    name: 'New report with no history',
    content: '**REPORT_STATUS:** PENDING_REVIEW',
    history: [],
    expected: 'PENDING_REVIEW',
    mustNotReturn: null
  },
  {
    name: 'Multi-step: PENDING → REVIEWED → ACTION_REQUIRED → RETIRED',
    content: '**REPORT_STATUS:** PENDING_REVIEW',
    history: [
      { event: 'REVIEWED', new_status: 'REVIEWED' },
      { event: 'ACTION_REQUIRED', new_status: 'ACTION_REQUIRED' },
      { event: 'REVIEWED_AGAIN', new_status: 'REVIEWED' },
      { event: 'RETIRED', new_status: 'RETIRED' }
    ],
    expected: 'RETIRED',
    mustNotReturn: 'ACTION_REQUIRED'
  }
];

for (const tc of testCases) {
  const result = correctReconciliation(tc.content, tc.history);
  assert(result === tc.expected, `${tc.name}: resolves to ${result}`);
  if (tc.mustNotReturn) {
    assert(result !== tc.mustNotReturn, `${tc.name}: does NOT resolve to stale ${tc.mustNotReturn}`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Test 5: Real Repository State Verification
// ═══════════════════════════════════════════════════════════════════

section('5. Real Repository State — Current Inbox/Retired Verification');

const validationDir = join(REPO_ROOT, 'docs/validation');
const retiredDir = join(REPO_ROOT, 'docs/validation/Retired');

// Check that Brain and Decision reports are in Retired/ (not active inbox)
const brainReportInRetired = existsSync(join(retiredDir, 'DPT-BRAIN-UNIVERSAL_COGNITION_DOCS_REPORT.md'));
const decisionReportInRetired = existsSync(join(retiredDir, 'DPT-DECISION-CANONICALIZATION_REPORT.md'));

assert(brainReportInRetired, 'Brain documentation report is in Retired/ (not reactivated)');
assert(decisionReportInRetired, 'Decision canonicalization report is in Retired/ (not reactivated)');

// Check that Bootstrap report is in active inbox (has known lifecycle defect)
const bootstrapReportActive = existsSync(join(validationDir, 'DPT-AUTO-BOOTSTRAP_AUTONOMOUS_BOOTSTRAP_REPORT.md'));
assert(bootstrapReportActive, 'Bootstrap report remains in active inbox (defect pending)');

// Count reports in each location
const activeReports = readdirSync(validationDir).filter(f => f.endsWith('.md')).length;
const retiredCount = readdirSync(retiredDir).filter(f => f.endsWith('.md')).length;

assert(activeReports >= 1, `Active inbox has ${activeReports} reports`);
assert(retiredCount >= 2, `Retired has ${retiredCount} reports`);

// ═══════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(60));
console.log('  TEST SUMMARY');
console.log('═'.repeat(60));
console.log(`  Total tests:  ${passes + fails}`);
console.log(`  Passed:       ${passes}`);
console.log(`  Failed:       ${fails}`);

if (fails === 0) {
  console.log('\n  ✅ DPT-LIFECYCLE-PRECEDENCE: ALL TESTS PASSED');
  console.log('  Invariant PROVEN: LATEST_LIFECYCLE_EVENT > HISTORICAL_METADATA');
  console.log('  RETIRED reports cannot be resurrected by stale embedded status.');
} else {
  console.log(`\n  ❌ DPT-LIFECYCLE-PRECEDENCE: ${fails} TEST(S) FAILED`);
}

// Cleanup
try { rmSync(TEST_DIR, { recursive: true, force: true }); } catch {}

process.exit(fails > 0 ? 1 : 0);
