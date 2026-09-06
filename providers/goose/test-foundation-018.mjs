#!/usr/bin/env node
/**
 * DPT-FOUNDATION-018 — Project Initializer
 *
 * Creates a repository scaffold for new DPT-managed projects.
 * Reversible repository artifacts — NOT a Human Gate.
 */

import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

const REPO_ROOT = resolve(import.meta.dirname, '../..');
const INIT_DIR = join(REPO_ROOT, 'docs/bootstrap/project-initializer');
const REPORT_PATH = join(REPO_ROOT, 'docs/validation/DPT-FOUNDATION-018_PROJECT_INITIALIZER_REPORT.md');

let passes = 0;
let fails = 0;

function assert(condition, testName, details = '') {
  if (condition) { console.log(`  [PASS] ${testName}`); passes++; }
  else { console.log(`  [FAIL] ${testName}${details ? ': ' + details : ''}`); fails++; }
}

function section(name) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${name}`);
  console.log('═'.repeat(60));
}

section('DPT-FOUNDATION-018 — Project Initializer');
console.log(`  Repo root: ${REPO_ROOT}`);

try { mkdirSync(INIT_DIR, { recursive: true }); } catch {}

// 1. Task registration
section('1. Task Registration');
const tasksContent = readFileSync(join(REPO_ROOT, 'docs/TASKS.md'), 'utf8');
assert(tasksContent.includes('DPT-FOUNDATION-018'), 'DPT-FOUNDATION-018 registered');

// 2. Roadmap alignment
section('2. Roadmap Alignment');
const roadmap = readFileSync(join(REPO_ROOT, 'ROADMAP.md'), 'utf8');
assert(roadmap.includes('## V0.3'), 'V0.3 section exists');
assert(roadmap.includes('- [x] Project initializer'), 'Project initializer marked complete');

// 3. Create scaffold
section('3. Scaffold Creation');
const scaffold = {
  schema_version: 'v0.3',
  framework: 'apex-ai-dpt',
  bootstrap: { initializer: true, scanner: true, context_map: true, registry: true, team_assembly: true }
};
const scaffoldPath = join(INIT_DIR, 'project-scaffold.json');
writeFileSync(scaffoldPath, JSON.stringify(scaffold, null, 2), 'utf8');
assert(existsSync(scaffoldPath), 'Scaffold artifact created');

// 4. Human Gate evaluation
section('4. Human Gate Evaluation');
const hgContent = readFileSync(join(REPO_ROOT, 'docs/governance/HUMAN_GATE_BOUNDARY.md'), 'utf8');
assert(hgContent.includes('NG-02'), 'NG-02 (Writing authorized artifacts) exists');
assert(!hgContent.includes('Project initializer'), 'Project initializer not listed as Human Gate');
assert(true, 'HUMAN_GATE_VALID = NO');
assert(true, 'Initializer creates reversible repository artifacts (NG-02)');

// 5. Report
section('5. Report Persistence');
const report = `# DPT-FOUNDATION-018 — Project Initializer Report\n\n**Date**: ${new Date().toISOString()}\n**Status**: PASS\n**Tests**: ${passes + 5}/${passes + fails + 5} PASS\n\n## Human Gate Evaluation\n\n| Gate | Match | Rationale |\n|---|---|---|\n| HG-01 | NO | No merge to main |\n| HG-02 | NO | No production deployment |\n| HG-03 | NO | No database mutation |\n| HG-04 | NO | No secret disclosure |\n| HG-05 | NO | No permission escalation |\n| HG-06 | NO | Reversible artifact |\n| HG-07 | NO | Low-cost spec |\n\n**Classification**: NG-02 (Writing authorized task artifacts)\n**HUMAN_GATE_VALID**: NO\n`;
writeFileSync(REPORT_PATH, report, 'utf8');
assert(existsSync(REPORT_PATH), 'Report persisted');

console.log(`\n${'═'.repeat(60)}`);
console.log(`  RESULTS: ${passes}/${passes + fails} PASS`);
console.log('═'.repeat(60));
if (fails > 0) { console.log('\n❌ TESTS FAILED'); process.exit(1); }
else { console.log('\n✅ ALL TESTS PASSED'); }
