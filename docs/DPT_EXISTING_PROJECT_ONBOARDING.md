# Apex AI DPT — Existing Project Onboarding

**Status:** Architecture direction / V0

## Purpose

Apex AI DPT must support projects that did not start with DPT.

A project may be partially implemented, feature-complete, in production, actively maintained, or legacy. DPT integration must add advisory and intelligence value without requiring a disruptive rewrite or forcing the project into a greenfield architecture.

## Core principle

> **DPT must meet projects where they are.**

The first objective is to understand the existing project, not to change it.

DPT is an advisory/intelligence layer. The project owner and the project's developers or AI development agents remain responsible for implementation.

## Existing Project Flow

```text
Existing Project
      ↓
Project Front Agent
      ↓
Project Scout
      ↓
Project Intelligence
      ↓
AI Analyst
      ↓
DPT Adoption Proposal
      ↓
Project Owner / Project Development Team
      ↓
Optional implementation by the project team
```

DPT does not execute the implementation step.

## Stage 1 — Discovery

Project Scout builds an evidence-backed understanding of the existing project.

Typical discovery areas:

- product purpose and intent where available;
- lifecycle stage;
- technology stack;
- architecture;
- capabilities;
- components/modules;
- dependencies;
- interfaces;
- constraints;
- risks;
- existing reusable solutions;
- relevant tests/documentation/operational evidence.

Scout should produce/update the Project Intelligence package and should not modify project code.

## Stage 2 — Analysis

The AI Analyst consumes Project Intelligence together with DPT Pool intelligence and explicit project intent.

It should:

1. identify project needs;
2. identify existing project solutions;
3. discover relevant DPT assets;
4. compare alternatives objectively;
5. identify compatibility and value;
6. identify what should remain unchanged;
7. identify possible project-to-DPT contribution candidates;
8. generate a DPT Adoption Proposal.

The Analyst does not modify project code.

## Stage 3 — DPT Adoption Proposal

The proposal is advisory. It may recommend:

- keep the existing solution;
- adopt a DPT Component/Module/asset;
- extend an existing solution using a DPT capability;
- do nothing because DPT adds insufficient value;
- identify a project-owned solution as a DPT Pool contribution candidate;
- identify unresolved capability gaps.

The proposal should explain expected benefits, relevant work required from the project team, compatibility considerations, risks, and optional adoption sequencing.

## DPT must not assume its own solution is better

A project-owned Authentication, Notification, Payment, UI, or other capability may be better than the corresponding DPT asset.

The correct outcome can therefore be:

```text
Project Solution
      ↓
Better / more appropriate
      ↓
KEEP
      │
      └── optional → DPT Contribution Candidate
```

DPT adoption is value-driven, not replacement-driven.

## Contribution is part of onboarding

The relationship is intentionally two-way:

```text
              DPT
             ↙   ↘
       Consume   Learn
           ↓       ↑
        Project ───┘
```

A project may benefit from DPT reusable assets while DPT benefits from validated project-owned Components, Modules, Patterns, Skills, Agents, Pitfalls, evidence, or other reusable intelligence, subject to privacy, licensing, validation, and contribution policy.

## Existing project integration boundary

Each connected project has a project-specific DPT Front Agent instance.

Conceptually:

```text
Existing Product
│
├── Existing architecture
├── Existing business logic
├── Existing tests
│
└── DPT Boundary
     └── Project Front Agent
              ↓
        DPT Trust Boundary
              ↓
        Gateway Agent
              ↓
         DPT Ecosystem
```

The exact packaging and transport mechanisms remain open engineering decisions.

## Direct access rule

External project agents must not communicate directly with DPT internal services or Pools. The supported path is through the project's Front Agent and the DPT Gateway boundary.

This is a communication/trust-boundary rule. It does not mean the Front Agent is the only security control.

## Non-invasive integration rules

DPT MUST NOT:

- rewrite the repository merely to make DPT integration easier;
- inject code into the project;
- refactor project code;
- perform migration work itself;
- replace established frameworks or Components;
- deploy project changes;
- force an idealized greenfield structure onto an existing project.

DPT SHOULD:

- establish a narrow communication boundary;
- preserve existing interfaces where practical;
- understand existing architecture before making recommendations;
- isolate DPT metadata from product code;
- provide evidence-backed recommendations;
- minimize required project-side changes;
- allow the project team to implement or reject recommendations.

## Project state

Scout should classify the project approximately as:

```text
GREENFIELD / EARLY
MVP
ACTIVE DEVELOPMENT
PRODUCTION
MATURE / STABLE
LEGACY
```

The state affects the relevance and urgency of recommendations, but it does not change the fundamental non-invasive DPT boundary.

## Open architecture questions

The following remain to be finalized:

- Project Intelligence machine-readable schema;
- Scout discovery/incremental update strategy;
- Front Agent lifecycle and update mechanism;
- Gateway/Trust Boundary implementation;
- DPT Adoption Proposal schema;
- compatibility/value scoring framework;
- contribution acceptance workflow;
- privacy/data classification;
- network protocol and connector packaging.
