import test from 'node:test';
import assert from 'node:assert/strict';
import { instructionsFor } from './catan-stage-instructions.mjs';

test('all admitted Catan stages have bounded executable instructions', () => {
  for (const id of ['LIFECYCLE','GAME_ACTIONS','TEST_MIGRATION','INDEPENDENT_PROOF']) {
    const i = instructionsFor(id); assert.ok(i); assert.ok(i.objective); assert.ok(i.allowed_paths.length); assert.ok(i.commands.length); assert.ok(i.effects.length);
  }
});
