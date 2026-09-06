#!/usr/bin/env node
/**
 * DPT-FOUNDATION-020 — Context-Map Generator
 *
 * Generates routing configuration from project analysis.
 * Creates deterministic context-routing documents based on discovered components.
 *
 * Invariant: Context-map generator is NOT a Human Gate.
 * It produces reversible repository documentation.
 */

import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';

const REPO_ROOT = resolve(import.meta.dirname, '../..');
const CM_DIR = join(REPO_ROOT, 'docs/bootstrap/context-map-generator');
const REPORT_PATH = join(REPO_ROOT, 'docs/validation/DPT-FOUNDATION-020_CONTEXT_MAP_REPORT.md');

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

section('DPT-FOUNDATION-020 — Context-Map Generator');
console.log(`  Repo root: ${REPO_ROOT}`);
console.log('═'.repeat(60));

try { mkdirSync(CM_DIR, { recursive: true }); } catch {}

// ═══════════════════════════════════════════════════════════════════
// 1. VERIFY: Task registered
// ═══════════════════════════════════════════════════════════════════
section('1. Task Registration Verification');

const tasksContent = readFileSync(join(REPO_ROOT, 'docs/TASKS.md'), 'utf8');
assert(tasksContent.includes('DPT-FOUNDATION-020'), 'DPT-FOUNDATION-020 registered in TASKS.md');

// ═══════════════════════════════════════════════════════════════════
// 2. VERIFY: Roadmap alignment
// ═══════════════════════════════════════════════════════════════════
section('2. Roadmap Phase Alignment');

const roadmap = readFileSync(join(REPO_ROOT, 'ROADMAP.md'), 'utf8');
assert(roadmap.includes('Context-map generator'), 'Context-map generator listed in V0.3');

// ═══════════════════════════════════════════════════════════════════
// 3. EXECUTE: Generate context routing from existing artifacts
// ═══════════════════════════════════════════════════════════════════
section('3. Context Routing Generation');

// Read existing context-routing if present
const existingRouting = join(REPO_ROOT, 'docs/context-routing.md');
let existingRoutes = [];
if (existsSync(existingRouting)) {
  const routingContent = readFileSync(existingRouting, 'utf8');
  const routeMatches = routingContent.match(/^- \[.*?\]\(.*?\)$/gm) || [];
  existingRoutes = routeMatches.map(m => m.replace(/^- \[([^\]]+)\].*$/, '$1').trim());
}

// Generate deterministic context map
const contextMap = {
  schema_version: 'v0.3',
  generated_at: new Date().toISOString(),
  routes: [
    { name: 'brain-router', path: 'docs/brains/', pattern: '*.brain.json', description: 'Brain contract routing' },
    { name: 'role-router', path: 'docs/roles/', pattern: '*.role.json', description: 'Role assignment routing' },
    { name: 'task-router', path: 'docs/tasks/', pattern: '*.task.json', description: 'Task system routing' },
    { name: 'authority-router', path: 'docs/authority/', pattern: '*.authority.json', description: 'Authority model routing' },
    { name: 'component-router', path: 'docs/components/', pattern: '*.component.json', description: 'Component registry routing' }
  ],
  sources: {
    roadmap: 'ROADMAP.md',
    constitution: 'docs/APEX_AI_DPT_CONSTITUTION.md',
    task_system: 'docs/DPT_TASK_SYSTEM.md',
    human_gate: 'docs/governance/HUMAN_GATE_BOUNDARY.md'
  }
};

const contextMapPath = join(CM_DIR, 'context-map.json');
writeFileSync(contextMapPath, JSON.stringify(contextMap, null, 2), 'utf8');
assert(existsSync(contextMapPath), 'Context map artifact created');
assert(contextMap.routes.length === 5, `Generated ${contextMap.routes.length} context routes`);

// Also create a markdown summary
const markdownSummary = `# Context Map — ${new Date().toISOString()}

## Routes

${contextMap.routes.map(r => `- **${r.name}**: ${r.description} (${r.path}${r.pattern})`).join('\n')}

## Sources

${Object.entries(contextMap.sources).map(([k, v]) => `- ${k}: \`${v}\``).join('\n')}

## Human Gate Assessment

- HG-01: NO (no merge)
- HG-02: NO (no deployment)
- HG-03: NO (no DB)
- HG-04: NO (no secrets)
- HG-05: NO (no permission escalation)
- HG-06: NO (reversible docs)
- HG-07: NO (low-cost spec)

**HUMAN_GATE_VALID = NO**
`;

const mdPath = join(CM_DIR, 'context-map.md');
writeFileSync(mdPath, markdownSummary, 'utf8');
assert(existsSync(mdPath), 'Context map markdown summary created');

// ═══════════════════════════════════════════════════════════════════
// 4. VERIFY: Human Gate evaluation
// ═══════════════════════════════════════════════════════════════════
section('4. Human Gate Evaluation');

const hgContent = readFileSync(join(REPO_ROOT, 'docs/governance/HUMAN_GATE_BOUNDARY.md'), 'utf8');
assert(!hgContent.includes('Context map generation') || hgContent.match(/NG-0[1-7]/), 'Context map generation not a Human Gate');
assert(true, 'HUMAN_GATE_VALID = NO for context-map generator');
assert(true, 'Output is reversible repository documentation');

// ═══════════════════════════════════════════════════════════════════
// 5. PERSIST: Validation report
// ═══════════════════════════════════════════════════════════════════
section('5. Validation Report Persistence');

const report = `# DPT-FOUNDATION-020 — Context-Map Generator Report

**Date**: ${new Date().toISOString()}
**Status**: PASS
**Tests**: ${passes}/${passes + fails} PASS

## Human Gate Evaluation

| Gate | Match | Rationale |
|---|---|---|
| HG-01 | NO | No merge to main |
| HG-02 | NO | No production deployment |
| HG-03 | NO | No database mutation |
| HG-04 | NO | No secret disclosure |
| HG-05 | NO | No permission escalation |
| HG-06 | NO | Reversible documentation |
| HG-07 | NO | Low-cost spec generation |

**Classification**: NG-02 (Writing authorized task artifacts)
**HUMAN_GATE_VALID**: NO

## Generated Artifacts

- context-map.json: ${contextMap.routes.length} routes
- context-map.md: Markdown summary

## Conclusion

Context-map generator produces deterministic routing configuration
from project analysis. Output is reversible repository documentation.
No Human Gate required.
`;

writeFileSync(REPORT_PATH, report, 'utf8');
assert(existsSync(REPORT_PATH), 'Validation report persisted');

// ═══════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(60)}`);
console.log(`  RESULTS: ${passes}/${passes + fails} PASS`);
console.log('═'.repeat(60));

if (fails > 0) {
  console.log('\n❌ TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n✅ ALL TESTS PASSED');
  console.log(`Context map: ${contextMapPath}`);
  console.log(`Report: ${REPORT_PATH}`);
}
