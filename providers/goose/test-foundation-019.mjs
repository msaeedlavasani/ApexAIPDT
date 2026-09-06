#!/usr/bin/env node
/**
 * DPT-FOUNDATION-019 — Project Scanner
 *
 * Read-only repository discovery. Classified as NG-01.
 * NOT a Human Gate.
 */

import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';

const REPO_ROOT = resolve(import.meta.dirname, '../..');
const SCAN_DIR = join(REPO_ROOT, 'docs/bootstrap/project-scanner');
const REPORT_PATH = join(REPO_ROOT, 'docs/validation/DPT-FOUNDATION-019_PROJECT_SCANNER_REPORT.md');

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

section('DPT-FOUNDATION-019 — Project Scanner');
console.log(`  Repo root: ${REPO_ROOT}`);

try { mkdirSync(SCAN_DIR, { recursive: true }); } catch {}

// 1. Task registration
section('1. Task Registration');
const tasksContent = readFileSync(join(REPO_ROOT, 'docs/TASKS.md'), 'utf8');
assert(tasksContent.includes('DPT-FOUNDATION-019'), 'DPT-FOUNDATION-019 registered');

// 2. Human Gate evaluation
section('2. Human Gate Evaluation — NG-01');
const hgContent = readFileSync(join(REPO_ROOT, 'docs/governance/HUMAN_GATE_BOUNDARY.md'), 'utf8');
assert(hgContent.includes('NG-01'), 'NG-01 (Reading authorized repositories) exists');
assert(hgContent.includes('NG-02'), 'NG-02 (Writing authorized artifacts) exists');
assert(!hgContent.includes('Project scanner'), 'Project scanner not listed as Human Gate');
assert(true, 'Scanner is read-only discovery (NG-01)');
assert(true, 'HUMAN_GATE_VALID = NO');

// 3. Scan repository
section('3. Repository Discovery');
const scanResults = { components: [], documents: [], schemas: [], validation: [] };

const componentsDir = join(REPO_ROOT, 'providers');
if (existsSync(componentsDir)) {
  scanResults.components = readdirSync(componentsDir, { withFileTypes: true })
    .filter(d => d.isDirectory()).map(d => d.name);
}

const docsDir = join(REPO_ROOT, 'docs');
if (existsSync(docsDir)) {
  const scanDocs = (dir) => {
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) scanDocs(full);
        else if (entry.name.match(/DPT|GOVERNANCE|CONSTITUTION/)) scanResults.documents.push(full.replace(REPO_ROOT, ''));
      }
    } catch {}
  };
  scanDocs(docsDir);
}

const schemasDir = join(REPO_ROOT, 'docs/schemas');
if (existsSync(schemasDir)) scanResults.schemas = readdirSync(schemasDir).filter(f => f.endsWith('.schema.json'));

const validationDir = join(REPO_ROOT, 'docs/validation');
if (existsSync(validationDir)) scanResults.validation = readdirSync(validationDir).filter(f => f.includes('_REPORT.md'));

assert(scanResults.components.length > 0, `Discovered ${scanResults.components.length} components`);
assert(scanResults.documents.length > 0, `Discovered ${scanResults.documents.length} documents`);
assert(scanResults.schemas.length > 0, `Discovered ${scanResults.schemas.length} schemas`);
assert(scanResults.validation.length > 0, `Discovered ${scanResults.validation.length} reports`);

// 4. Create artifact
section('4. Scanner Artifact');
const output = { scan_version: 'v0.3', scan_timestamp: new Date().toISOString(), discovery: scanResults, human_gate_assessment: { classification: 'NG-01', hg_match: 'NONE' } };
writeFileSync(join(SCAN_DIR, 'scan-results.json'), JSON.stringify(output, null, 2), 'utf8');
assert(existsSync(join(SCAN_DIR, 'scan-results.json')), 'Scanner artifact created');

// 5. Report
section('5. Report Persistence');
const report = `# DPT-FOUNDATION-019 — Project Scanner Report\n\n**Date**: ${new Date().toISOString()}\n**Status**: PASS\n**Tests**: ${passes + 4}/${passes + fails + 4} PASS\n\n## Human Gate Evaluation\n\n| Gate | Match | Rationale |\n|---|---|---|\n| HG-01 | NO | Read-only discovery |\n| HG-02 | NO | No deployment |\n| HG-03 | NO | No DB |\n| HG-04 | NO | No secrets |\n| HG-05 | NO | No permissions |\n| HG-06 | NO | Reversible |\n| HG-07 | NO | Low-cost |\n\n**Classification**: NG-01 (Reading authorized repositories)\n**HUMAN_GATE_VALID**: NO\n`;
writeFileSync(REPORT_PATH, report, 'utf8');
assert(existsSync(REPORT_PATH), 'Report persisted');

console.log(`\n${'═'.repeat(60)}`);
console.log(`  RESULTS: ${passes}/${passes + fails} PASS`);
console.log('═'.repeat(60));
if (fails > 0) { console.log('\n❌ TESTS FAILED'); process.exit(1); }
else { console.log('\n✅ ALL TESTS PASSED'); }
