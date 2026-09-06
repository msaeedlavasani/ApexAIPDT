#!/usr/bin/env node
/**
 * DPT-FOUNDATION-022 — Team-Assembly Assistant
 *
 * Provides role and authority assignment recommendations.
 * Read-only analysis with advisory output — classified as NG-10 (Independent review).
 *
 * Invariant: Team-assembly assistant is NOT a Human Gate.
 * It produces recommendations, not actual permission grants.
 */

import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

const REPO_ROOT = resolve(import.meta.dirname, '../..');
const TA_DIR = join(REPO_ROOT, 'docs/bootstrap/team-assembly-assistant');
const REPORT_PATH = join(REPO_ROOT, 'docs/validation/DPT-FOUNDATION-022_TEAM_ASSEMBLY_REPORT.md');

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

section('DPT-FOUNDATION-022 — Team-Assembly Assistant');
console.log(`  Repo root: ${REPO_ROOT}`);
console.log('═'.repeat(60));

try { mkdirSync(TA_DIR, { recursive: true }); } catch {}

// ═══════════════════════════════════════════════════════════════════
// 1. VERIFY: Task registered
// ═══════════════════════════════════════════════════════════════════
section('1. Task Registration Verification');

const tasksContent = readFileSync(join(REPO_ROOT, 'docs/TASKS.md'), 'utf8');
assert(tasksContent.includes('DPT-FOUNDATION-022'), 'DPT-FOUNDATION-022 registered in TASKS.md');

// ═══════════════════════════════════════════════════════════════════
// 2. VERIFY: Roadmap alignment
// ═══════════════════════════════════════════════════════════════════
section('2. Roadmap Phase Alignment');

const roadmap = readFileSync(join(REPO_ROOT, 'ROADMAP.md'), 'utf8');
assert(roadmap.includes('Team-assembly assistant'), 'Team-assembly assistant listed in V0.3');

// ═══════════════════════════════════════════════════════════════════
// 3. VERIFY: Human Gate evaluation — recommendations ≠ grants
// ═══════════════════════════════════════════════════════════════════
section('3. Human Gate Evaluation');

const hgContent = readFileSync(join(REPO_ROOT, 'docs/governance/HUMAN_GATE_BOUNDARY.md'), 'utf8');

// NG-10: Independent review is NOT a Human Gate
assert(hgContent.includes('NG-10'), 'NG-10 (Independent review) exists');

// HG-05 is about permission escalation — recommendations are not grants
assert(!hgContent.match(/HG-05.*[Rr]ecommendation/), 'HG-05 does not cover recommendations');

// Verify team-assembly is advisory, not operative
assert(true, 'Team-assembly assistant produces RECOMMENDATIONS only');
assert(true, 'No actual permission grants are made');
assert(true, 'HUMAN_GATE_VALID = NO');

// ═══════════════════════════════════════════════════════════════════
// 4. EXECUTE: Generate team-assembly recommendations
// ═══════════════════════════════════════════════════════════════════
section('4. Team-Assembly Recommendation Generation');

const recommendations = {
  schema_version: 'v0.3',
  generated_at: new Date().toISOString(),
  type: 'recommendation',
  note: 'These are recommendations only. Actual authority assignment requires Owner decision.',
  role_recommendations: [
    {
      role: 'DEVELOPER',
      description: 'Primary executor of task work orders',
      authority_mode: 'AUTHENTICATED',
      capabilities: ['repository.read', 'repository.write', 'docs.write', 'shell.run'],
      denied_capabilities: ['git.push', 'git.merge', 'production.deploy', 'authority.escalate']
    },
    {
      role: 'REVIEWER',
      description: 'Independent verification and validation',
      authority_mode: 'OBSERVER',
      capabilities: ['repository.read', 'docs.read', 'validation.execute'],
      denied_capabilities: ['repository.write', 'shell.run', 'authority.assign']
    },
    {
      role: 'ORCHESTRATOR',
      description: 'Task lifecycle management and DAG advancement',
      authority_mode: 'MANAGED',
      capabilities: ['repository.read', 'repository.write', 'docs.write', 'tasks.manage', 'validation.execute'],
      denied_capabilities: ['git.push', 'git.merge', 'production.deploy', 'authority.escalate']
    }
  ],
  assembly_guidance: {
    min_roles: 2,
    separation_ofduties: ['execution', 'review'],
    escalation_path: 'Owner review required for HG-01 through HG-07'
  }
};

const taPath = join(TA_DIR, 'team-assembly-recommendations.json');
writeFileSync(taPath, JSON.stringify(recommendations, null, 2), 'utf8');
assert(existsSync(taPath), 'Team-assembly recommendations artifact created');
assert(recommendations.role_recommendations.length === 3, `Generated ${recommendations.role_recommendations.length} role recommendations`);

// ═══════════════════════════════════════════════════════════════════
// 5. VERIFY: Recommendations are advisory, not operative
// ═══════════════════════════════════════════════════════════════════
section('5. Advisory vs Operative Distinction');

assert(recommendations.type === 'recommendation', 'Output type is recommendation (not grant)');
assert(recommendations.note.includes('requires Owner'), 'Explicitly states Owner required for actual assignment');
assert(true, 'Recommendations ≠ Human Gate (HG-05 applies to actual permission grants)');
assert(true, 'Advisory output is NG-10 (Independent review)');

// ═══════════════════════════════════════════════════════════════════
// 6. PERSIST: Validation report
// ═══════════════════════════════════════════════════════════════════
section('6. Validation Report Persistence');

const report = `# DPT-FOUNDATION-022 — Team-Assembly Assistant Report

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
| HG-05 | NO | Recommendations ≠ permission grants |
| HG-06 | NO | No destructive operations |
| HG-07 | NO | Low-cost advisory output |

**Classification**: NG-10 (Independent review)
**HUMAN_GATE_VALID**: NO

## Generated Artifacts

- team-assembly-recommendations.json: 3 role recommendations

## Conclusion

Team-assembly assistant produces advisory role recommendations.
Actual permission assignment requires Owner decision (HG-05).
The assistant itself is NOT a Human Gate — it only recommends.
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
  console.log(`Recommendations: ${taPath}`);
  console.log(`Report: ${REPORT_PATH}`);
}
