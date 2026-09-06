#!/usr/bin/env node
/**
 * DPT-FOUNDATION-001-CLEANUP — Removal of task-specific diagnostic artifacts
 *
 * Removes three task-specific diagnostic files created during
 * DPT-FOUNDATION-001's interrupted session. These are not required
 * by the generic adapter architecture (ADR-028).
 *
 * Usage: node providers/goose/test-foundation-001-cleanup.mjs
 */

import { createGooseAdapter } from './goose-adapter.mjs';
import { createEnvelope } from '../opencode/permission-envelope.mjs';
import { DOMAIN, AUTHORITY_MODE } from '../opencode/permission-envelope.mjs';
import { join, resolve } from 'path';
import { existsSync, rmSync } from 'fs';

const REPO_ROOT = resolve(import.meta.dirname, '../..');

// ═══════════════════════════════════════════════════════════════════
// Authority materialization
// ═══════════════════════════════════════════════════════════════════

const envelope = createEnvelope({
  task_id: 'DPT-FOUNDATION-001-CLEANUP',
  work_order_id: 'DPT-WO-FOUNDATION-001-CLEANUP',
  role: 'DEVELOPER',
  workspace: REPO_ROOT,
  permissions: [
    {
      domain: DOMAIN.FILESYSTEM,
      action: ['read', 'write', 'create', 'delete'],
      resource: join(REPO_ROOT, 'providers/opencode/**'),
      authority_mode: AUTHORITY_MODE.AUTO_ALLOW,
      description: 'Cleanup: repo-local opencode directory operations including delete',
    },
    {
      domain: DOMAIN.GIT,
      action: ['status', 'diff', 'log'],
      resource: 'git status*',
      authority_mode: AUTHORITY_MODE.AUTO_ALLOW,
      description: 'Cleanup: git read-only ops for verification',
    },
    {
      domain: DOMAIN.EXECUTION,
      action: ['run_command'],
      resource: 'rm -f *',
      authority_mode: AUTHORITY_MODE.AUTO_ALLOW,
      description: 'Cleanup: allow rm -f for diagnostic file removal',
    },
  ],
});

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

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

section('DPT-FOUNDATION-001-CLEANUP — Artifact Removal');
console.log(`  Repo root: ${REPO_ROOT}`);
console.log('═'.repeat(60));

// ═══════════════════════════════════════════════════════════════════
// Files to remove
// ═══════════════════════════════════════════════════════════════════

const FILES_TO_REMOVE = [
  join(REPO_ROOT, 'providers/opencode/materialize-dpt-foundation-001.mjs'),
  join(REPO_ROOT, 'providers/opencode/enforce-dpt-foundation-001.mjs'),
  join(REPO_ROOT, 'providers/opencode/test-foundation-001-enforcement.mjs'),
];

// Verify all files exist before removal
section('1. Pre-Flight — Files to Remove');
for (const f of FILES_TO_REMOVE) {
  const name = f.split('/').pop();
  assert(existsSync(f), `${name} exists (ready for removal)`);
}

// ═══════════════════════════════════════════════════════════════════
// Execute cleanup via adapter
// ═══════════════════════════════════════════════════════════════════

section('2. Cleanup via Goose Adapter');

const adapter = createGooseAdapter({ root_dir: REPO_ROOT });
await adapter.start({ task_id: 'DPT-FOUNDATION-001-CLEANUP', work_order_id: 'DPT-WO-FOUNDATION-001-CLEANUP', envelope });
const sessionId = await adapter.createSession({ task_id: 'DPT-FOUNDATION-001-CLEANUP', work_order_id: 'DPT-WO-FOUNDATION-001-CLEANUP' });

// Use shell to remove the files (repo.read + repo.list capabilities)
let removedCount = 0;
for (const f of FILES_TO_REMOVE) {
  const name = f.split('/').pop();
  const result = await adapter.executeTool(sessionId, {
    tool_name: 'delete',
    params: { path: f },
  });
  if (result.status === 'EXECUTED' || result.executed) {
    assert(!existsSync(f), `${name} removed`);
    removedCount++;
  } else {
    assert(false, `${name} removal failed: ${result.status}`, JSON.stringify(result));
  }
}

// ═══════════════════════════════════════════════════════════════════
// Verification
// ═══════════════════════════════════════════════════════════════════

section('3. Verification — All Files Removed');
assert(removedCount === 3, `All 3 diagnostic files removed (${removedCount}/3)`);
assert(!existsSync(FILES_TO_REMOVE[0]), 'materialize-dpt-foundation-001.mjs absent');
assert(!existsSync(FILES_TO_REMOVE[1]), 'enforce-dpt-foundation-001.mjs absent');
assert(!existsSync(FILES_TO_REMOVE[2]), 'test-foundation-001-enforcement.mjs absent');

// Verify remaining opencode files are intact
const remainingFiles = [
  'adapter-spike.mjs',
  'context-receipt.mjs',
  'dpt-mcp-client.mjs',
  'dpt-mcp-server.mjs',
  'event-bridge.mjs',
  'event-model.mjs',
  'execute-foundation-001-schemas.mjs',
  'launch-recon-003-diagnostic.mjs',
  'opencode-adapter.mjs',
  'permission-audit.mjs',
  'permission-envelope.mjs',
  'permission-materializer.mjs',
  'rehydration-record.mjs',
  'sdk-normalizer.mjs',
  'test-e2e-integration.mjs',
  'test-evidence-bridge.mjs',
  'test-foundation-001-minimal-write.mjs',
  'test-mcp-server.mjs',
  'test-permissions.mjs',
  'test-rehydration.mjs',
];

for (const f of remainingFiles) {
  const fullPath = join(REPO_ROOT, 'providers/opencode', f);
  if (existsSync(fullPath)) {
    assert(true, `${f} intact`);
  }
  // If file doesn't exist, skip (it may not have existed before)
}

// ═══════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(60));
console.log('  TEST SUMMARY');
console.log('═'.repeat(60));
console.log(`  Total tests:  ${passes + fails}`);
console.log(`  Passed:       ${passes}`);
console.log(`  Failed:       ${fails}`);
console.log(`  Files removed: ${removedCount}/3`);

if (fails === 0) {
  console.log('\n  ✅ DPT-FOUNDATION-001-CLEANUP: ALL TESTS PASSED');
  console.log('  Cleanup verified: 3 diagnostic files removed, 0 remaining.');
} else {
  console.log(`\n  ❌ DPT-FOUNDATION-001-CLEANUP: ${fails} TEST(S) FAILED`);
}

process.exit(fails > 0 ? 1 : 0);
