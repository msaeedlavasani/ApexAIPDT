/** ADR-055: internal Pool supply qualification, distinct from project adoption. */
import { createHash } from 'node:crypto';
export const SupplyOrigin = Object.freeze({ DPT_PRODUCED:'DPT_PRODUCED', PROJECT_CONTRIBUTION:'PROJECT_CONTRIBUTION', EXTERNAL_ECOSYSTEM:'EXTERNAL_ECOSYSTEM' });
export const AcquisitionOutcome = Object.freeze({ REFERENCE:'REFERENCE', DEPENDENCY:'DEPENDENCY', ADAPTER_WRAPPER:'ADAPTER_WRAPPER', EXTRACTED_PATTERN:'EXTRACTED_PATTERN', REUSABLE_COMPONENT_MODULE:'REUSABLE_COMPONENT_MODULE', SKILL_WORKFLOW:'SKILL_WORKFLOW', KNOWLEDGE_EVIDENCE:'KNOWLEDGE_EVIDENCE', REJECT:'REJECT' });
export const SupplyState = Object.freeze({ CANDIDATE:'CANDIDATE', QUALIFIED_REUSABLE_ASSET:'QUALIFIED_REUSABLE_ASSET', CONSUMABLE_POOL_ENTRY:'CONSUMABLE_POOL_ENTRY', REJECTED:'REJECTED' });
const hash = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function qualifySupplyCandidate(input, { reviewer = 'independent-reviewer', admission = 'admission-controller' } = {}) {
  const identity = `SUPPLY-${hash({ source:input.source, version:input.version, origin:input.origin }).slice(0,16)}`;
  const base = { identity, candidate_id:`CANDIDATE-${identity.slice(7)}`, source:input.source, version:input.version, origin:input.origin, acquisition_outcome:input.acquisition_outcome, provenance:input.provenance, license:input.license, security:input.security, maintenance_health:input.maintenance_health, compatibility:input.compatibility, reusability:input.reusability, qualification_evidence:input.qualification_evidence, maintainer_responsibility:input.maintainer_responsibility, update_lineage:[input.version], deprecation:{status:'ACTIVE'}, reviewer, admission };
  const reasons=[];
  if (!base.source || !base.version || !base.provenance) reasons.push('IDENTITY_OR_PROVENANCE_MISSING');
  if (base.origin === SupplyOrigin.EXTERNAL_ECOSYSTEM && (!base.license || base.license === 'UNKNOWN')) reasons.push('LICENSE_AMBIGUOUS_NO_COPY_REFERENCE_ONLY');
  if (base.security !== 'PASS') reasons.push('SECURITY_NOT_QUALIFIED');
  if (base.maintenance_health !== 'PASS') reasons.push('MAINTENANCE_NOT_QUALIFIED');
  if (base.compatibility !== 'PASS') reasons.push('COMPATIBILITY_NOT_QUALIFIED');
  if (base.reusability !== 'PASS') reasons.push('REUSABILITY_NOT_PROVEN');
  if (!base.qualification_evidence || base.reviewer === input.producer) reasons.push('INDEPENDENCE_FAILURE');
  if (base.acquisition_outcome === AcquisitionOutcome.REJECT || reasons.length) return { ...base, state:SupplyState.REJECTED, rejection_reasons:reasons.length ? reasons : ['EXPLICIT_REJECT'], consumable:false };
  return { ...base, state:SupplyState.CONSUMABLE_POOL_ENTRY, qualified_asset_id:`ASSET-${identity.slice(7)}`, consumable:true, project_adoption_authority:false };
}
export function matchConsumableEntries(entries, needs) { return entries.filter(e => e.state === SupplyState.CONSUMABLE_POOL_ENTRY && e.compatibility === 'PASS' && needs.some(n => n.capability === e.capability && n.baseline_gap === true)); }
