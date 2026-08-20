# New Game Workflow

## Purpose
Provide a reusable workflow for adding a visually and technically complex game to an existing game platform.

## Discovery

Identify:

- common game shell;
- lobby/room infrastructure;
- player model;
- realtime model;
- game state architecture;
- input/action system;
- shared UI components;
- existing game with the closest architecture;
- existing asset conventions.

## Reuse

Reuse established platform infrastructure before creating game-specific infrastructure.

## Game-specific analysis

Define:

- rules engine requirements;
- game state;
- player actions;
- turn model;
- win/finish states;
- reconnect behavior;
- spectator/observer needs if applicable;
- responsive behavior;
- accessibility;
- analytics events.

## Asset analysis

Separate assets into:

1. existing reusable assets;
2. assets that can be generated from existing primitives;
3. human-provided source assets.

For category 3, produce one consolidated asset request using `ASSET_REQUEST.md`.

## Implementation

Build platform integration first, then game-specific logic/UI/assets.

Do not approximate protected or supplied game artwork when fidelity is required.

## Validation

Use targeted unit/integration/contract tests first. Add targeted E2E/smoke coverage for critical gameplay flows. Full E2E is used only when justified by risk.

## Completion

The game is complete only when platform integration, gameplay states, visual consistency, responsive behavior, assets, analytics, and relevant quality gates are satisfied.
