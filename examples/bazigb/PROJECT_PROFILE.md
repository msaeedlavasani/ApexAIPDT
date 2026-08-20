# BaziGB — APDT Validation Profile

This is a reference profile for validating APDT against a real existing product. It is not the canonical BaziGB architecture.

## Product type

Online multiplayer board-game platform.

## Why it is a strong validation case

The project combines:

- product/UI development;
- reusable game infrastructure;
- realtime multiplayer behavior;
- game-specific logic;
- complex visual assets;
- responsive gameplay;
- analytics;
- future monetization.

## Expected active brains

- Product
- Design
- Architecture
- Engineering
- QA
- Data / Analytics
- Security
- Operations
- Domain/Game Design
- Asset/Content
- Monetization when that scope is active

## Critical APDT test

The project should eventually support a request equivalent to:

> Add Catan as a new game.

The AI team should discover the existing game platform, select the closest analogue, reuse shared infrastructure, identify genuinely new implementation, and produce a consolidated specification for any human-provided board-game assets.

## Success signals

- minimal human implementation instructions;
- no unnecessary framework/dependency changes;
- no duplicate platform components;
- targeted context discovery;
- appropriate validation instead of unconditional full E2E;
- clear human escalation only for genuine missing decisions/assets.
