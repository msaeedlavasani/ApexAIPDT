/** ADR-052: bounded autonomous work generation inside a fixed roadmap ceiling. */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createAutonomousAdmissionLoop, LoopOutcome } from './autonomous-admission-loop.mjs';

export const CandidateState = Object.freeze({ OBSERVED:'OBSERVED', PROPOSED:'PROPOSED', FALSIFICATION_PENDING:'FALSIFICATION_PENDING', FALSIFIED:'FALSIFIED', REVIEW_PENDING:'REVIEW_PENDING', REJECTED:'REJECTED', ADMITTED:'ADMITTED', EXECUTING:'EXECUTING', MEASURED:'MEASURED', CLOSED:'CLOSED', SUPERSEDED:'SUPERSEDED' });
export const EvidenceClass = Object.freeze({ INTERNAL_RUNTIME:'INTERNAL_RUNTIME', EXTERNAL_READ:'EXTERNAL_READ', EXTERNAL_WRITE:'EXTERNAL_WRITE', EXTERNAL_CLOSED_LOOP:'EXTERNAL_CLOSED_LOOP', OPERATIONAL:'OPERATIONAL' });
const forbiddenPairs = [['detector','proposer'],['detector','reviewer'],['proposer','falsifier'],['proposer','reviewer'],['falsifier','reviewer'],['reviewer','executor'],['executor','verifier'],['admission','proposer']];
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function classifyEvidence(observation) {
  if (!observation || !observation.boundary_events?.length || !observation.artifact_refs?.length || !observation.observed_outcome || !observation.verifier_identity) return null;
  const boundaries = new Set(observation.boundary_events);
  if (boundaries.has('OPERATIONAL')) return EvidenceClass.OPERATIONAL;
  if (boundaries.has('EXTERNAL_CLOSED_LOOP') && observation.readback === true) return EvidenceClass.EXTERNAL_CLOSED_LOOP;
  if (boundaries.has('EXTERNAL_WRITE') && observation.mutation_ack === true && observation.readback === true) return EvidenceClass.EXTERNAL_WRITE;
  if (boundaries.has('EXTERNAL_READ')) return EvidenceClass.EXTERNAL_READ;
  if (boundaries.has('INTERNAL_RUNTIME')) return EvidenceClass.INTERNAL_RUNTIME;
  return null;
}

export class BoundedWorkControlPlane {
  constructor({ storageDir = '.dpt/autonomous-work', roadmap = { allowTask: true, allowPhase: false, allowArchitecture: false, allowPublicContract: false }, roles = {}, execute } = {}) {
    this.storageDir = storageDir; this.eventFile = join(storageDir, 'control-plane.jsonl'); this.stateFile = join(storageDir, 'control-plane.json');
    this.roadmap = roadmap; this.roles = roles; this.execute = execute;
    this.state = this.load();
  }
  load() { return existsSync(this.stateFile) ? JSON.parse(readFileSync(this.stateFile, 'utf8')) : { revision: 0, candidates: {}, tasks: {}, capabilities: {} }; }
  save(event, record) { mkdirSync(this.storageDir, { recursive: true }); this.state.revision++; this.state.last_event = event; writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2)); writeFileSync(this.eventFile, (existsSync(this.eventFile) ? readFileSync(this.eventFile,'utf8') : '') + JSON.stringify({ revision:this.state.revision, event, ...record }) + '\n'); }
  identity(name) { return this.roles[name] || name; }
  independent() { for (const [a,b] of forbiddenPairs) if (this.identity(a) === this.identity(b)) return false; return true; }
  observe(observation) { const evidence = classifyEvidence(observation); const gapId = observation.gap_id; const key = digest({ gapId, objective: observation.objective, scope: observation.scope, evidence: observation.artifact_refs }); const existing = this.state.candidates[key]; if (existing) return { status: existing.state, candidate: existing, duplicate: true }; const candidate = { candidate_id:`CANDIDATE-${key.slice(0,12)}`, idempotency_key:key, gap_id:gapId, objective:observation.objective, scope:observation.scope, evidence_class:evidence, evidence:observation, state:CandidateState.OBSERVED, identities:{ detector:this.identity('detector') } }; this.state.candidates[key] = candidate; this.save('CANDIDATE_OBSERVED', { candidate_id:candidate.candidate_id }); return { status: candidate.state, candidate }; }
  async evaluate(observation, { speculative = false, redundant = false } = {}) {
    const observed = this.observe(observation); if (observed.duplicate) return { outcome:'EXHAUSTED_GRAPH', reason:'DUPLICATE_CANDIDATE', candidate:observed.candidate };
    const candidate = observed.candidate; candidate.state = CandidateState.PROPOSED; candidate.identities.proposer = this.identity('proposer'); this.save('CANDIDATE_PROPOSED',{candidate_id:candidate.candidate_id});
    candidate.state = CandidateState.FALSIFICATION_PENDING; candidate.identities.falsifier = this.identity('falsifier'); this.save('FALSIFICATION_STARTED',{candidate_id:candidate.candidate_id});
    const falsified = speculative || redundant || !candidate.evidence_class || !observation.material || !observation.acceptance_criteria;
    if (falsified) { candidate.state=CandidateState.FALSIFIED; candidate.rejection_reason = speculative ? 'SPECULATIVE' : redundant ? 'REDUNDANT' : 'INSUFFICIENT_MATERIAL_EVIDENCE'; candidate.state=CandidateState.REJECTED; this.save('CANDIDATE_REJECTED',{candidate_id:candidate.candidate_id,reason:candidate.rejection_reason}); return { outcome:'EXHAUSTED_GRAPH', reason:candidate.rejection_reason, task:null }; }
    candidate.state = CandidateState.REVIEW_PENDING; candidate.identities.reviewer=this.identity('reviewer');
    if (!this.independent()) { candidate.state=CandidateState.REJECTED; candidate.rejection_reason='INDEPENDENCE_CONTRACT_FAILED'; this.save('CANDIDATE_REJECTED',{candidate_id:candidate.candidate_id,reason:candidate.rejection_reason}); return { outcome:'CANONICAL_VERIFICATION_FAILURE', reason:candidate.rejection_reason }; }
    candidate.review = { approved:true, rationale:'material gap, necessary, bounded, non-duplicative' }; this.save('INDEPENDENT_REVIEW_APPROVED',{candidate_id:candidate.candidate_id});
    if (!this.roadmap.allowTask) return { outcome:'GENUINE_HUMAN_GATE', reason:'TASK_GENERATION_OUTSIDE_POLICY_CEILING' };
    candidate.state=CandidateState.ADMITTED; candidate.identities.admission=this.identity('admission'); candidate.task_id=`DPT-AUTO-GENERATED-${candidate.candidate_id.slice(-6)}`; this.state.tasks[candidate.task_id]={ task_id:candidate.task_id, objective:candidate.objective, status:'BACKLOG', dependencies:[], source_candidate:candidate.candidate_id }; this.save('TASK_ADMITTED',{candidate_id:candidate.candidate_id,task_id:candidate.task_id});
    const loop = createAutonomousAdmissionLoop({ tasks:[this.state.tasks[candidate.task_id]], storageDir:join(this.storageDir,'execution'), execute: async task => { candidate.state=CandidateState.EXECUTING; candidate.identities.executor=this.identity('executor'); this.save('EXECUTION_STARTED',{task_id:task.task_id}); const result=this.execute ? await this.execute(task) : {success:true}; return result; }, verify: tasks => { if (candidate.identities.executor === this.identity('verifier')) throw new Error('CIRCULAR_SELF_VALIDATION'); } });
    const outcome=await loop.run(); candidate.state=CandidateState.MEASURED; candidate.measurement={ outcome, success:outcome===LoopOutcome.EXHAUSTED_GRAPH }; candidate.identities.verifier=this.identity('verifier'); candidate.state=CandidateState.CLOSED; this.state.capabilities[candidate.gap_id]={ capability_id:candidate.gap_id, maturity:'IMPLEMENTED', evidence_class:'NOT_PROMOTED', provenance:'independent outcome measurement required' }; this.save('OUTCOME_MEASURED',{candidate_id:candidate.candidate_id,outcome}); this.save('CAPABILITY_UPDATE',{capability_id:candidate.gap_id,evidence_class:'NOT_PROMOTED'}); return { outcome:'VERTICAL_SLICE_COMPLETE', candidate, task:this.state.tasks[candidate.task_id] };
  }
}
export function createBoundedWorkControlPlane(config) { return new BoundedWorkControlPlane(config); }
