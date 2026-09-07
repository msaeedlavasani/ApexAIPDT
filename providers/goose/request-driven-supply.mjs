/** ADR-056: request-driven resolver and non-consumable Supply Resolution Memory. */
import { createHash } from 'node:crypto';
export const ResolutionPath = Object.freeze({ POOL_HIT:'POOL_HIT', MEMORY_HIT:'MEMORY_HIT', TARGETED_EXTERNAL_SOURCING:'TARGETED_EXTERNAL_SOURCING', NO_SUPPLY:'NO_SUPPLY' });
export const SupplyQualification = Object.freeze({ PROJECT_COMPATIBLE:'PROJECT_COMPATIBLE', QUALIFIED_FOR_BOUNDED_CONSUMPTION:'QUALIFIED_FOR_BOUNDED_CONSUMPTION', CROSS_PROJECT_REUSABLE:'CROSS_PROJECT_REUSABLE', POOL_ADMISSIBLE:'POOL_ADMISSIBLE' });
const id = x => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0,16);
export function normalizeRequest(request) { return { capability:request.capability, constraints:[...(request.constraints||[])].sort(), acceptance:[...(request.acceptance||[])].sort(), signature:`REQ-${id({capability:request.capability,constraints:request.constraints||[],acceptance:request.acceptance||[]})}` }; }
export function resolveSupply(request, { pool=[], memory=[], sourceCandidates=[], now=Date.now() }={}) {
  const normalized=normalizeRequest(request); const poolHit=pool.find(x=>x.capability===normalized.capability && x.state==='CONSUMABLE_POOL_ENTRY' && x.fresh_until>now);
  if(poolHit) return { path:ResolutionPath.POOL_HIT, request:normalized, candidate:poolHit, project_authority_required:true };
  const memoryHit=memory.find(x=>x.request_signature===normalized.signature && x.fresh_until>now && x.state==='SUPPLY_MEMORY_ENTRY');
  if(memoryHit) return { path:ResolutionPath.MEMORY_HIT, request:normalized, candidate:memoryHit, rediscovery:false, compatibility_recheck_required:true, project_authority_required:true };
  const targeted=sourceCandidates.filter(x=>x.capability===normalized.capability);
  if(targeted.length) return { path:ResolutionPath.TARGETED_EXTERNAL_SOURCING, request:normalized, candidates:targeted, qualification_required:true, project_authority_required:true };
  return { path:ResolutionPath.NO_SUPPLY, request:normalized, candidates:[] };
}
export function createSupplyMemoryRecord(request, candidate, outcome, evidence) { const normalized=normalizeRequest(request); return { memory_id:`MEM-${id({request_signature:normalized.signature,candidate:candidate.identity,version:candidate.version})}`, state:'SUPPLY_MEMORY_ENTRY', request_signature:normalized.signature, source_identity:candidate.identity, acquisition_outcome:outcome, provenance:candidate.provenance, immutable_source_version:candidate.version, license_security:candidate.license_security, compatibility_observations:evidence.compatibility, qualification_history:evidence.qualification, project_consumption_outcome:evidence.outcome, fresh_until:evidence.fresh_until, supersession_lineage:[], reuse_evidence:evidence.reuse_evidence||[], raw_project_context:false, pool_candidate:false }; }
