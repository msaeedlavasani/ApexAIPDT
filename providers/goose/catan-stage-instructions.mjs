export const CatanStageInstructions = Object.freeze({
  LIFECYCLE: {
    objective: 'Migrate create/join/read/disconnect/reconnect lifecycle mutations to RoomStateStore transactions.',
    allowed_paths: ['server/src/rooms.js','server/src/index.js','server/src/store/RoomStateStore.js','server/test/rooms.test.js','server/test/integration.test.js'],
    commands: ['npm test --prefix server'],
    effects: ['transactional lifecycle entrypoints exist','legacy lifecycle handlers no longer commit Map state','server tests pass'],
  },
  GAME_ACTIONS: {
    objective: 'Route every authoritative game action through RoomStateStore transaction and commit before broadcast.',
    allowed_paths: ['server/src/index.js','server/src/game/engine.js','server/src/rooms.js','server/test/integration.test.js'],
    commands: ['npm test --prefix server'],
    effects: ['handleAction has no direct authoritative Map mutation','broadcast follows committed transaction','server tests pass'],
  },
  TEST_MIGRATION: {
    objective: 'Migrate affected tests to asynchronous authoritative lifecycle and action contracts.',
    allowed_paths: ['server/test'],
    commands: ['npm test --prefix server','npm test --prefix client','npm run build --prefix client'],
    effects: ['regression suites pass','independent process proof passes'],
  },
  INDEPENDENT_PROOF: {
    objective: 'Verify multi-process visibility, stale conflict, restart recovery, and real socket mutation.',
    allowed_paths: ['server/test/integration-persistence','server/test/integration.test.js'],
    commands: ['npm test --prefix server','npm test --prefix client','npm run build --prefix client'],
    effects: ['all acceptance proofs pass','no unauthorized paths changed'],
  },
});

export function instructionsFor(stageId) { return CatanStageInstructions[stageId] || null; }
