/**
 * DPT-PROVIDER-007 — Phase Transition Admission Enforcer (V5.2)
 * Version-agnostic: derives task ranges from actual task IDs in TASKS.md.
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

export class PhaseAdmissionEnforcer {
  constructor({ repoRoot } = {}) {
    this.repoRoot = repoRoot ? resolve(repoRoot) : process.cwd();
    this.humanGates = this._loadHumanGates();
  }

  _loadHumanGates() {
    const hgPath = join(this.repoRoot, 'docs/governance/HUMAN_GATE_BOUNDARY.md');
    if (!existsSync(hgPath)) return null;
    return readFileSync(hgPath, 'utf8');
  }

  _loadRoadmap() {
    const rp = join(this.repoRoot, 'ROADMAP.md');
    if (!existsSync(rp)) return null;
    return readFileSync(rp, 'utf8');
  }

  _loadTasks() {
    const tp = join(this.repoRoot, 'docs/TASKS.md');
    if (!existsSync(tp)) return null;
    return readFileSync(tp, 'utf8');
  }

  discoverNextPhase(fromPhase) {
    const roadmap = this._loadRoadmap();
    if (!roadmap) return null;
    const lines = roadmap.split('\n');
    const phases = [];
    for (const line of lines) {
      const m = line.match(/^##\s+(V\d+(?:\.\d+)?)\s/i);
      if (m) phases.push(m[1]);
    }
    let fromIdx = phases.indexOf(fromPhase);
    if (fromIdx === -1) {
      const prefix = fromPhase.split('.')[0];
      fromIdx = phases.findIndex(p => p === prefix || p.startsWith(prefix + '.'));
    }
    if (fromIdx === -1 || fromIdx >= phases.length - 1) return null;
    return phases[fromIdx + 1];
  }

  evaluateTransition({ fromPhase, toPhase }) {
    const roadmap = this._loadRoadmap();
    const tasks = this._loadTasks();
    const hgContent = this._loadHumanGates();

    if (!roadmap || !tasks) {
      return { admitted: false, rationale: 'MISSING_ROADMAP_OR_TASKS', humanGateValid: null, fromPhaseComplete: 0, toPhasePending: 0, nextPhaseTasks: [] };
    }

    // Step 1: NEXT_PHASE_FOUND
    const fromRe = new RegExp('^##\\s+' + this._escRe(fromPhase) + '\\s', 'im');
    const toRe = new RegExp('^##\\s+' + this._escRe(toPhase) + '\\s', 'im');
    const fromMatch = roadmap.match(fromRe);
    const toMatch = roadmap.match(toRe);
    
    if (!toMatch) {
      return { admitted: false, rationale: 'NEXT_PHASE_NOT_FOUND: ' + toPhase, humanGateValid: false, fromPhaseComplete: 0, toPhasePending: 0, nextPhaseTasks: [] };
    }
    if (!fromMatch) {
      return { admitted: false, rationale: 'FROM_PHASE_NOT_FOUND: ' + fromPhase, humanGateValid: false, fromPhaseComplete: 0, toPhasePending: 0, nextPhaseTasks: [] };
    }

    const fromIdx = roadmap.indexOf(fromMatch[0]);
    const toIdx = roadmap.indexOf(toMatch[0]);
    const nextIdx = roadmap.indexOf('## ', toIdx + 1);
    const fromSection = roadmap.substring(fromIdx, nextIdx === -1 ? undefined : nextIdx);

    // Step 2: CURRENT_PHASE_VALIDLY_COMPLETE
    const fromItems = fromSection.match(/- \[x\].*/g) || [];
    if (fromItems.length === 0) {
      return { admitted: false, rationale: 'CURRENT_PHASE_NOT_COMPLETE: ' + fromPhase, humanGateValid: false, fromPhaseComplete: 0, toPhasePending: 0, nextPhaseTasks: [] };
    }

    // Step 3: EVALUATE_HG_01_TO_HG_07
    let humanGateMatch = null;
    let hgRationale = '';
    const nextPhaseTasks = [];

    if (hgContent) {
      const hgDefs = {};
      for (const line of hgContent.split('\n')) {
        const m = line.match(/^###\s+(HG-\d+):\s+(.+)$/);
        if (m) hgDefs[m[1]] = m[2].trim();
      }

      const phaseTasks = this._extractPhaseTaskIds(tasks, toPhase);
      
      for (const taskId of phaseTasks) {
        nextPhaseTasks.push(taskId);
        for (const [hgId, hgDesc] of Object.entries(hgDefs)) {
          if (this._taskMatchesHG(taskId, hgDesc)) {
            humanGateMatch = hgId;
            hgRationale = 'Task "' + taskId + '" matches ' + hgId + ': ' + hgDesc;
            break;
          }
        }
        if (humanGateMatch) break;
      }
    }

    const admitted = !humanGateMatch;
    const rationale = humanGateMatch 
      ? 'HUMAN_GATE_REQUIRED: ' + humanGateMatch + ' — ' + hgRationale
      : 'NO_HUMAN_GATE_MATCH: ' + toPhase + ' tasks are repository-controlled, reversible artifacts (NG-01/NG-02/NG-10)';

    return {
      admitted,
      rationale,
      humanGateValid: humanGateMatch ? true : false,
      fromPhaseComplete: fromItems.length,
      toPhasePending: nextPhaseTasks.length,
      nextPhaseTasks
    };
  }

  _escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  _extractPhaseTaskIds(tasksContent, phase) {
    // Get all task IDs and their numbers
    const allTasks = this._findAllFoundationTasks(tasksContent);
    if (allTasks.length === 0) return [];

    // Known canonical ranges per phase (derived from roadmap structure)
    // V0.1: 001-013, V0.2: 014-017, V0.3: 018-022, V1: 023-036, V2: 037+
    const ranges = {
      'V0.1': [1, 13],
      'V0.2': [14, 17],
      'V0.3': [18, 22],
      'V1': [23, 99],
      'V2': [100, 9999]
    };

    // Check if phase has a defined range
    const range = ranges[phase];
    if (range) {
      return allTasks.filter(id => {
        const num = parseInt(id.replace('DPT-FOUNDATION-', ''), 10);
        return num >= range[0] && num <= range[1];
      });
    }

    // For unknown phases, find the boundary from adjacent known phases
    const phaseOrder = ['V0.1', 'V0.2', 'V0.3', 'V1', 'V2'];
    const idx = phaseOrder.indexOf(phase);
    if (idx === -1) return allTasks;

    // Find the min task number for this phase and the max of the previous phase
    const allNums = allTasks.map(id => parseInt(id.replace('DPT-FOUNDATION-', ''), 10)).sort((a, b) => a - b);
    const prevMax = idx > 0 ? ranges[phaseOrder[idx - 1]]?.[1] ?? allNums[allNums.length - 1] : 0;
    const nextMin = idx < phaseOrder.length - 1 ? ranges[phaseOrder[idx + 1]]?.[0] ?? Infinity : Infinity;
    
    return allTasks.filter(id => {
      const num = parseInt(id.replace('DPT-FOUNDATION-', ''), 10);
      return num > prevMax && num < nextMin;
    });
  }

  _findAllFoundationTasks(content) {
    const found = new Set();
    const re = /DPT-FOUNDATION-(\d+)/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      found.add('DPT-FOUNDATION-' + m[1]);
    }
    return Array.from(found);
  }

  _taskMatchesHG(taskId, hgDesc) {
    const desc = hgDesc.toLowerCase();
    const id = taskId.toLowerCase();
    if (desc.includes('merge') && (id.includes('merge') || id.includes('release'))) return true;
    if (desc.includes('deploy') && id.includes('deploy')) return true;
    if (desc.includes('database') && id.includes('migration')) return true;
    if (desc.includes('secret') && id.includes('secret')) return true;
    if (desc.includes('permission') && id.includes('escalat')) return true;
    if (desc.includes('destructive') && id.includes('destroy')) return true;
    if (desc.includes('architecture') && id.includes('framework')) return true;
    return false;
  }
}

export function createPhaseAdmissionEnforcer(config) {
  return new PhaseAdmissionEnforcer(config);
}
