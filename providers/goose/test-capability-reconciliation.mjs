import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileCapabilityInventory, classifyExhaustion, CapabilityPosture } from './capability-reconciliation.mjs';

test('Rev93 failure path cannot claim no material gap from empty task graph', () => {
  const r = reconcileCapabilityInventory([
    { capability_id:'V4_BOUNDED_EXTERNAL_CLOSED_LOOP', posture:CapabilityPosture.SATISFIED, reconciled:true },
    { capability_id:'CATAN_ISS_005', posture:CapabilityPosture.MATERIAL_UNTASKED, reconciled:true },
  ]);
  assert.equal(r.taskGraphState, 'IDLE');
  assert.equal(r.noMaterialGap, false);
  assert.equal(classifyExhaustion(r), 'EXHAUSTED_WITH_CAPABILITY_GAPS');
});

test('bounded V4 proof remains separate from broader unproven capability', () => {
  const r = reconcileCapabilityInventory([
    { capability_id:'V4_BOUNDED_EXTERNAL_CLOSED_LOOP', scope:'fixture', posture:CapabilityPosture.SATISFIED, reconciled:true },
    { capability_id:'GENERAL_EXTERNAL_CLOSED_LOOP', scope:'ecosystem', posture:CapabilityPosture.UNPROVEN, reconciled:true },
  ]);
  assert.equal(r.gaps.length, 1); assert.equal(r.canClaimNoMaterialGap, false);
});

test('no material gap requires full inventory reconciliation', () => {
  const r = reconcileCapabilityInventory([{ capability_id:'X', posture:CapabilityPosture.SATISFIED, reconciled:false }]);
  assert.equal(r.canClaimNoMaterialGap, false);
});
