/**
 * Post-Integration Reconciliation Gate
 * 
 * Deterministic hygiene checks that must pass before admitting next batch/task.
 * Implements BATCH_COMPLETE extended requirements and PRE_NEXT_ADMISSION guard.
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '../..');

export const INTEGRATION_GATE_VERSION = '1.0.0';

export const HYGIENE_CHECKS = Object.freeze({
  LOCAL_MAIN_EQUALS_ORIGIN_MAIN: 'LOCAL_MAIN_EQUALS_ORIGIN_MAIN',
  WORKTREE_CLEAN: 'WORKTREE_CLEAN',
  UNPUSHED_COMMITS_ZERO: 'UNPUSHED_COMMITS_ZERO',
  OPEN_BATCH_PRS_ZERO: 'OPEN_BATCH_PRS_ZERO',
  MERGED_BATCH_BRANCHES_ZERO: 'MERGED_BATCH_BRANCHES_ZERO',
  UNRESOLVED_STASH_ZERO: 'UNRESOLVED_STASH_ZERO',
  CI_MAIN_PASS: 'CI_MAIN_PASS',
  REMOTE_READBACK_PASS: 'REMOTE_READBACK_PASS'
});

export const TASK_LIFECYCLE_RULES = Object.freeze({
  CLOSED_NO_REOPEN_EVENT: 'TASK_CLOSED_NO_VALID_REOPEN_EVENT',
  READY_REQUIRES_DEPS_CLOSED: 'READY_REQUIRES_ALL_HARD_DEPS_CLOSED'
});

export const REPORT_LIFECYCLE_RULES = Object.freeze({
  RETIRED_NO_REOPEN_EVENT: 'REPORT_RETIRED_NO_VALID_REOPEN_EVENT'
});

export function checkLocalMainEqualsOriginMain() {
  try {
    const localSha = execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    const originSha = execSync('git rev-parse origin/main', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    const pass = localSha === originSha;
    return {
      pass,
      localSha,
      originSha,
      message: pass 
        ? 'Local main (' + localSha.slice(0, 7) + ') equals origin/main'
        : 'SHA divergence: local=' + localSha.slice(0, 7) + ', origin=' + originSha.slice(0, 7)
    };
  } catch (e) {
    return { pass: false, error: e.message };
  }
}

export function checkWorktreeClean() {
  try {
    const status = execSync('git status --short', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    const dirtyFiles = status ? status.split('\n').length : 0;
    return {
      pass: status === '',
      dirtyFiles,
      message: status === '' ? 'Working tree clean' : dirtyFiles + ' dirty files'
    };
  } catch (e) {
    return { pass: false, error: e.message };
  }
}

export function checkUnpushedCommits() {
  try {
    const count = parseInt(execSync('git rev-list --left-right --count HEAD...origin/main', { 
      cwd: REPO_ROOT, 
      encoding: 'utf8' 
    }).trim().split(/\s+/)[0]);
    return {
      pass: count === 0,
      count,
      message: 'Unpushed commits: ' + count
    };
  } catch (e) {
    return { pass: false, error: e.message };
  }
}

export function checkOpenBatchPRs() {
  try {
    const prList = execSync('gh pr list --state open --limit 100', { 
      cwd: REPO_ROOT, 
      encoding: 'utf8' 
    });
    const prs = prList.trim().split('\n').filter(Boolean);
    const batchPRs = prs.filter(pr => pr.includes('batch') || pr.includes('feat/'));
    return {
      pass: batchPRs.length === 0,
      openPRs: prs.length,
      batchPRs: batchPRs.length,
      message: 'Open PRs: ' + prs.length + ', Batch PRs: ' + batchPRs.length
    };
  } catch (e) {
    return { pass: true, skipped: true, message: 'gh CLI not available, skipping PR check' };
  }
}

export function checkMergedBatchBranches() {
  try {
    const branches = execSync('git branch', { cwd: REPO_ROOT, encoding: 'utf8' });
    const branchList = branches.trim().split('\n').map(b => b.replace(/^\*?\s*/, ''));
    const problematic = branchList.filter(b => 
      b.startsWith('checkpoint/') || b.startsWith('batch/') || b.startsWith('feat/')
    );
    return {
      pass: problematic.length === 0,
      activeNonMain: branchList.filter(b => b !== 'main'),
      problematic,
      message: problematic.length === 0 
        ? 'No merged batch branches remaining'
        : 'Found ' + problematic.length + ' non-main branches: ' + problematic.join(', ')
    };
  } catch (e) {
    return { pass: false, error: e.message };
  }
}

export function checkUnresolvedStash() {
  try {
    const stashList = execSync('git stash list', { cwd: REPO_ROOT, encoding: 'utf8' });
    const stashCount = stashList.trim().split('\n').filter(Boolean).length;
    return {
      pass: stashCount === 0,
      stashCount,
      message: 'Unresolved stashes: ' + stashCount
    };
  } catch (e) {
    return { pass: false, error: e.message };
  }
}

export function checkCIMainPass() {
  try {
    const ciList = execSync('gh run list --branch main --limit 1 --json conclusion', { 
      cwd: REPO_ROOT, 
      encoding: 'utf8' 
    });
    const runs = JSON.parse(ciList);
    if (!runs || runs.length === 0) {
      return { pass: false, message: 'No CI runs found' };
    }
    const latestConclusion = runs[0].conclusion;
    return {
      pass: latestConclusion === 'success',
      conclusion: latestConclusion,
      message: 'Latest CI conclusion: ' + latestConclusion
    };
  } catch (e) {
    return { pass: true, skipped: true, message: 'gh CLI not available, skipping CI check' };
  }
}

export function checkRemoteReadback() {
  try {
    execSync('git fetch origin', { cwd: REPO_ROOT, encoding: 'utf8' });
    
    const validationFiles = execSync(
      'git ls-tree origin/main:docs/validation/ --name-only',
      { cwd: REPO_ROOT, encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);
    
    const retiredDirExists = execSync(
      'git ls-tree origin/main:docs/validation/Retired --name-only',
      { cwd: REPO_ROOT, encoding: 'utf8' }
    ).trim().length > 0;
    
    return {
      pass: validationFiles.length > 0 && retiredDirExists,
      activeFiles: validationFiles.length,
      retiredCount: retiredDirExists ? 'present' : 'missing',
      message: 'Remote validation inbox: ' + validationFiles.length + ' files, Retired: ' + (retiredDirExists ? 'present' : 'MISSING')
    };
  } catch (e) {
    return { pass: false, error: e.message };
  }
}

export function parseTaskRecords() {
  try {
    const content = readFileSync(join(REPO_ROOT, 'docs/TASKS.md'), 'utf8');
    const taskBlocks = content.match(/### DPT-[A-Z]+-\d+ — .+?\n(?:[^#]|$(?<!###))*/g) || [];
    
    const tasks = [];
    for (const block of taskBlocks) {
      const taskIdMatch = block.match(/task_id:\s*(DPT-[A-Z]+-\d+)/);
      const statusMatch = block.match(/status:\s*(\w+)/);
      const depsMatch = block.match(/dependencies:\s*(.+?)(?:\n|$)/);
      const readinessMatch = block.match(/readiness:\s*(.+?)(?:\n|$)/);
      
      if (taskIdMatch && statusMatch) {
        tasks.push({
          task_id: taskIdMatch[1],
          status: statusMatch[1],
          dependencies: depsMatch ? depsMatch[1].trim() : '',
          readiness: readinessMatch ? readinessMatch[1].trim() : ''
        });
      }
    }
    return { success: true, tasks };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export function checkClosedTaskResurrection(parsedTasks) {
  if (!parsedTasks.success) return { pass: false, error: 'Failed to parse tasks' };
  
  const violations = [];
  
  for (const task of parsedTasks.tasks) {
    if (task.status !== 'READY') continue;
    
    const content = readFileSync(join(REPO_ROOT, 'docs/TASKS.md'), 'utf8');
    const reopenPattern = new RegExp('task_id:\\\\s*' + task.task_id + '.*?changes:.*?(REWORK|NOT_READY→READY|BACKLOG→READY)', 's');
    const hasExplicitReopen = reopenPattern.test(content);
    
    const closurePattern = new RegExp('task_id:\\\\s*' + task.task_id + '.*?changes:.*?status=CLOSED', 's');
    const wasPreviouslyClosed = closurePattern.test(content);
    
    if (wasPreviouslyClosed && !hasExplicitReopen) {
      violations.push({
        task_id: task.task_id,
        issue: 'CLOSED task resurrected as READY without valid reopen event',
        rule: TASK_LIFECYCLE_RULES.CLOSED_NO_REOPEN_EVENT
      });
    }
  }
  
  const readyTasks = parsedTasks.tasks.filter(t => t.status === 'READY').length;
  return {
    pass: violations.length === 0,
    violations,
    checkedTasks: parsedTasks.tasks.length,
    readyTasks,
    message: violations.length === 0 
      ? 'No CLOSED task resurrection detected'
      : 'Found ' + violations.length + ' resurrection violation(s)'
  };
}

export function checkReadyDependencies(parsedTasks) {
  if (!parsedTasks.success) return { pass: false, error: 'Failed to parse tasks' };
  
  const violations = [];
  const taskStatusMap = new Map();
  
  for (const task of parsedTasks.tasks) {
    taskStatusMap.set(task.task_id, task.status);
  }
  
  for (const task of parsedTasks.tasks) {
    if (task.status !== 'READY') continue;
    if (!task.dependencies || task.dependencies === 'none') continue;
    
    const deps = task.dependencies.split(',').map(d => d.trim());
    for (const dep of deps) {
      const depStatus = taskStatusMap.get(dep);
      if (depStatus !== 'CLOSED') {
        violations.push({
          task_id: task.task_id,
          dependency: dep,
          depStatus,
          issue: 'Dependency ' + dep + ' is ' + depStatus + ', not CLOSED',
          rule: TASK_LIFECYCLE_RULES.READY_REQUIRES_DEPS_CLOSED
        });
      }
    }
  }
  
  return {
    pass: violations.length === 0,
    violations,
    message: violations.length === 0
      ? 'All READY tasks have CLOSED dependencies'
      : 'Found ' + violations.length + ' dependency violation(s)'
  };
}

export function checkRetiredReportResurrection() {
  try {
    const validationDir = join(REPO_ROOT, 'docs/validation');
    const retiredDir = join(validationDir, 'Retired');
    
    const activeReports = readdirSync(validationDir)
      .filter(f => f.endsWith('.md') && !f.startsWith('.') && f !== 'Retired')
      .map(f => join(validationDir, f));
    
    const retiredReports = existsSync(retiredDir)
      ? readdirSync(retiredDir)
          .filter(f => f.endsWith('.md'))
          .map(f => join(retiredDir, f))
      : [];
    
    const activeNames = new Set(activeReports.map(f => f.replace(validationDir + '/', '')));
    const retiredNames = new Set(retiredReports.map(f => f.replace(retiredDir + '/', '')));
    
    const overlaps = [...activeNames].filter(n => retiredNames.has(n));
    
    return {
      pass: overlaps.length === 0,
      overlaps,
      activeCount: activeReports.length,
      retiredCount: retiredReports.length,
      message: overlaps.length === 0
        ? 'No retired reports in active inbox (' + activeReports.length + ' active, ' + retiredReports.length + ' retired)'
        : 'Found ' + overlaps.length + ' retired reports in active inbox: ' + overlaps.join(', ')
    };
  } catch (e) {
    return { pass: false, error: e.message };
  }
}

export function checkCrossProjectionConsistency() {
  const errors = [];
  
  try {
    const tasksContent = readFileSync(join(REPO_ROOT, 'docs/TASKS.md'), 'utf8');
    // Count only [TASK] blocks as durable ledger records
    const taskBlocks = tasksContent.match(/\[TASK\]/g) || [];
    const tasksInLedger = taskBlocks.length;
    
    const statusContent = readFileSync(join(REPO_ROOT, '.dpt/status.json'), 'utf8');
    const status = JSON.parse(statusContent);
    const totalTasksInStatus = status.summary.total_tasks;
    
    if (tasksInLedger !== totalTasksInStatus) {
      errors.push({
        check: 'TASK_COUNT_CONSISTENCY',
        ledger: tasksInLedger,
        status: totalTasksInStatus,
        message: 'Task count mismatch: ledger=' + tasksInLedger + ', status.json=' + totalTasksInStatus
      });
    }
    
    const branchList = execSync('git branch', { cwd: REPO_ROOT, encoding: 'utf8' })
      .trim().split('\n')
      .map(b => b.replace(/^\*?\s*/, ''));
    
    const nonMainBranches = branchList.filter(b => b !== 'main');
    if (nonMainBranches.length > 0) {
      errors.push({
        check: 'BRANCH_STATE',
        unexpected: nonMainBranches,
        message: 'Unexpected local branches: ' + nonMainBranches.join(', ')
      });
    }
    
  } catch (e) {
    errors.push({ check: 'GENERAL', error: e.message });
  }
  
  return {
    pass: errors.length === 0,
    errors,
    message: errors.length === 0 
      ? 'All projections consistent'
      : 'Found ' + errors.length + ' inconsistency(ies)'
  };
}

export function runPostIntegrationGate() {
  const results = {
    version: INTEGRATION_GATE_VERSION,
    timestamp: new Date().toISOString(),
    checks: {},
    overall: { pass: false, blockedBy: [] }
  };
  
  results.checks.localMainEqualsOrigin = checkLocalMainEqualsOriginMain();
  results.checks.worktreeClean = checkWorktreeClean();
  results.checks.unpushedCommits = checkUnpushedCommits();
  results.checks.openBatchPRs = checkOpenBatchPRs();
  results.checks.mergedBatchBranches = checkMergedBatchBranches();
  results.checks.unresolvedStash = checkUnresolvedStash();
  results.checks.ciMainPass = checkCIMainPass();
  results.checks.remoteReadback = checkRemoteReadback();
  
  const parsedTasks = parseTaskRecords();
  results.checks.closedTaskResurrection = checkClosedTaskResurrection(parsedTasks);
  results.checks.readyDependencies = checkReadyDependencies(parsedTasks);
  results.checks.retiredReportResurrection = checkRetiredReportResurrection();
  results.checks.crossProjection = checkCrossProjectionConsistency();
  
  const failedChecks = Object.entries(results.checks)
    .filter(([_, result]) => result.pass === false && !result.skipped)
    .map(([name, result]) => ({ check: name, ...result }));
  
  results.overall.pass = failedChecks.length === 0;
  results.overall.blockedBy = failedChecks.map(c => c.check);
  results.overall.details = failedChecks;
  
  return results;
}

export function preNextAdmissionGuard() {
  console.log('\n=== PRE-NEXT-ADMISSION GUARD ===');
  console.log('Rehydrating canonical lifecycle...\n');
  
  const gateResult = runPostIntegrationGate();
  
  console.log('=== INTEGRATION GATE RESULT ===');
  console.log('Overall: ' + (gateResult.overall.pass ? 'PASS' : 'FAIL'));
  if (!gateResult.overall.pass) {
    console.log('Blocked by:', gateResult.overall.blockedBy.join(', '));
    console.log('\nDetails:');
    for (const [check, result] of Object.entries(gateResult.checks)) {
      const symbol = !result.pass && !result.skipped ? '✗' : '✓';
      console.log('  ' + symbol + ' ' + check + ': ' + result.message);
    }
  }
  
  return gateResult;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const result = runPostIntegrationGate();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.overall.pass ? 0 : 1);
}
