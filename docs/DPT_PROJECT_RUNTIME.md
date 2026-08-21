# Apex AI DPT — Project Runtime & Bootstrap Architecture

## Purpose

This document defines how a project becomes a DPT-connected project and how the project runtime communicates with Apex AI DPT.

The implementation mechanism is intentionally separated from the contract. A project may eventually use a local package, CLI bootstrapper, sidecar, service, or another runtime adapter. The project-facing contract must remain stable.

## Core rule

A DPT-managed project MUST establish its DPT connection before substantive product implementation begins.

The project must not start by blindly generating application code. It first establishes identity, capabilities, component/module access, Pitfall access, and the project operating context.

## Bootstrap flow

```text
Project Idea
  ↓
DPT Project Initialization
  ↓
Project Identity + Subscription/Auth
  ↓
Install/Initialize DPT Connector
  ↓
Sync DPT Contracts + Required Core Assets
  ↓
Analyze Project Requirements
  ↓
Capability Discovery
  ↓
Search Component/Module Pools
  ↓
Search Pitfall Pool
  ↓
Build/Acquire Missing Skills and Agents
  ↓
Assemble Project Team
  ↓
Generate Project DPT Manifest
  ↓
Begin Product Work
```

## Project runtime structure

A reference project should contain a DPT-owned boundary that does not mix DPT internals with product code:

```text
project/
├── .dpt/
│   ├── manifest.yaml
│   ├── context/
│   ├── registry/
│   ├── runtime/
│   ├── cache/
│   └── queue/
├── src/
├── tests/
└── ...
```

`.dpt/` is a reference structure, not yet a mandatory implementation technology.

### `.dpt/manifest.yaml`

The manifest should identify:

- project identity;
- DPT version/contract version;
- subscription/tenant reference without storing secrets;
- connector version;
- enabled pools;
- selected agents and skills;
- project component/module registry location;
- sync policy;
- contribution policy;
- update policy.

Secrets MUST NOT be committed to the project repository. Credentials belong in the runtime's secret/configuration mechanism.

## DPT Connector

The project connector is the controlled boundary between the local project runtime and the DPT network.

```text
Project Agents / Orchestrator
          ↓
     DPT Connector
          ↕
     DPT Network API
          ↕
     DPT Intelligence + Pools
```

Agents MUST NOT directly depend on Pool storage, databases, or DPT infrastructure details.

The connector is responsible for:

- authentication;
- project identity;
- fetch/search requests;
- contribution submission;
- update/event reception;
- local caching;
- retry and offline queueing;
- synchronization;
- compatibility checks at the boundary;
- telemetry/usage metadata subject to project policy.

## Two-way runtime relationship

DPT is both a provider and a learner.

### DPT → Project

DPT may provide:

- reusable components and modules;
- skills and agents;
- Pitfall intelligence;
- patterns and decisions;
- security/quality notices;
- compatible asset updates;
- migration guidance.

### Project → DPT

Subject to subscription and contribution policy, a project may contribute:

- new reusable components/modules;
- improvements to existing assets;
- newly validated skills;
- newly created agents;
- new Pitfalls and root-cause resolutions;
- reusable patterns and decisions;
- evidence and compatibility information.

## Initialization is a capability assessment, not a code-generation phase

At project start, DPT must determine:

1. What the project is trying to achieve.
2. What capabilities are required.
3. Which capabilities already exist.
4. Which reusable assets already exist.
5. Which Pitfalls are relevant.
6. Which skills/agents are missing.
7. What must be created before implementation can safely begin.

## Continuous runtime loop

The same mechanism remains active throughout the project:

```text
Task
 ↓
Capability Check
 ↓
Pool/Pitfall Check
 ↓
Execute
 ↓
Validate
 ↓
Contribute reusable learning
 ↓
Check incoming DPT updates/events
 ↓
Continue
```

If a new capability gap appears mid-project, DPT MUST be allowed to create or acquire the required skill/agent and continue after validation.

## Open implementation decision

The exact transport and packaging mechanism is intentionally not frozen yet. Candidate implementations include:

- project-local SDK/package;
- DPT CLI bootstrapper + connector;
- sidecar/service connector;
- hybrid local connector with cloud DPT API.

The architecture must be selected only after evaluating security, developer experience, offline behavior, language/framework support, update propagation, and operational cost.
