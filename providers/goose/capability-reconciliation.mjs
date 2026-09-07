export const TaskGraphState = Object.freeze({ READY:'READY', IDLE:'IDLE', BLOCKED:'BLOCKED', EXHAUSTED:'EXHAUSTED' });
export const CapabilityPosture = Object.freeze({ SATISFIED:'SATISFIED', DEFERRED:'DEFERRED_DEPENDENCY', MATERIAL_UNTASKED:'MATERIAL_GAP_NOT_YET_TASKED', BLOCKED:'BLOCKED_BOUNDARY', UNPROVEN:'UNPROVEN' });

export function reconcileCapabilityInventory(inventory, { readyTasks = [], evidence = [] } = {}) {
  const capabilities = inventory.map(c => ({ ...c, evidence: evidence.filter(e => e.capability_id === c.capability_id) }));
  const gaps = capabilities.filter(c => [CapabilityPosture.MATERIAL_UNTASKED, CapabilityPosture.BLOCKED, CapabilityPosture.DEFERRED, CapabilityPosture.UNPROVEN].includes(c.posture));
  const taskGraphState = readyTasks.length ? TaskGraphState.READY : TaskGraphState.IDLE;
  const noMaterialGap = gaps.length === 0;
  return { taskGraphState, capabilities, gaps, noMaterialGap, canClaimNoMaterialGap: noMaterialGap && capabilities.every(c => c.reconciled === true) };
}

export function classifyExhaustion(reconciliation) {
  if (reconciliation.taskGraphState !== TaskGraphState.IDLE) return 'NOT_EXHAUSTED';
  if (!reconciliation.canClaimNoMaterialGap) return 'EXHAUSTED_WITH_CAPABILITY_GAPS';
  return 'EXHAUSTED_GRAPH_WITH_NO_MATERIAL_GAP';
}
