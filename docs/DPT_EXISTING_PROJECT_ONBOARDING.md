# Apex AI DPT — Existing Project Onboarding

**Status:** Concept / V0 — architecture direction

## Purpose

Apex AI DPT must support projects that did not start with DPT.

A project may be partially implemented, feature-complete, in production, actively maintained, or legacy. DPT integration must add capability without requiring a disruptive rewrite or forcing the project into a greenfield architecture immediately.

## Core principle

> **DPT must meet projects where they are.**

DPT integration is additive before it becomes transformative.

The first objective is to understand and connect to the existing project, not to refactor it.

## Progressive integration levels

### Level 0 — Observer

DPT is read-only.

Typical capabilities:

- architecture discovery;
- dependency discovery;
- documentation analysis;
- test/CI discovery;
- component and module inventory;
- Pitfall discovery;
- capability assessment.

No product code changes are required.

### Level 1 — Advisor

DPT can produce recommendations, plans, risk assessments, missing-capability reports, and targeted improvement proposals.

DPT does not automatically modify production code.

### Level 2 — Contributor

DPT may create isolated branches, changes, tests, documentation, or pull requests according to project policy.

```text
DPT
 ↓
Branch
 ↓
Change + Tests
 ↓
PR
 ↓
Project approval
```

### Level 3 — Managed

DPT participates in a larger portion of project execution, including tasks, components, Pitfalls, skills, agents, reusable modules, and controlled updates.

### Level 4 — Native DPT Project

The project adopts the full DPT runtime model, including the project DPT boundary, Network API, Pools, capabilities, agents, and update mechanisms.

A project does not need to reach Level 4 to receive meaningful value from DPT.

## Existing Project Onboarding Flow

```text
Existing Project
      ↓
DPT Discovery
      ↓
Architecture + State Assessment
      ↓
Inventory Components / Modules / Dependencies
      ↓
Assess Tests, CI/CD, Documentation, Risks
      ↓
Capability Assessment
      ↓
Pitfall / Pool Discovery
      ↓
Generate Integration Plan
      ↓
Select Minimum Safe Integration Level
      ↓
Install/Initialize DPT Connector
      ↓
Validate Integration Boundary
      ↓
Enable DPT Services Incrementally
```

## Onboarding Agent

An Existing Project should use a dedicated **DPT Onboarding Agent**.

Its responsibility is discovery and safe integration planning, not uncontrolled refactoring.

The agent should answer:

1. What exists?
2. What is stable and should not be disturbed?
3. What architectural boundaries already exist?
4. What components/modules can DPT understand and reuse?
5. What DPT capabilities are immediately useful?
6. What integration changes are strictly necessary?
7. What risks could integration introduce?
8. What can be deferred?
9. What is the safest next integration level?

## Non-destructive integration rules

DPT MUST NOT:

- rewrite the repository merely to make DPT integration easier;
- perform broad refactors without a justified product/engineering reason;
- replace established frameworks without authorization;
- introduce DPT dependencies into unrelated product modules unnecessarily;
- move working code merely to satisfy an idealized greenfield structure;
- weaken production stability for architectural purity.

DPT SHOULD:

- establish a narrow connector boundary;
- preserve existing interfaces where possible;
- integrate incrementally;
- isolate DPT metadata from product code;
- use adapters around existing architecture where needed;
- document discovered constraints;
- improve architecture selectively when there is measurable value.

## Existing Project State Model

The onboarding process should classify the project approximately as:

```text
GREENFIELD / EARLY
MVP
ACTIVE DEVELOPMENT
PRODUCTION
MATURE / STABLE
LEGACY
```

The classification affects the integration strategy and acceptable change radius.

For example, a production or legacy project should generally begin closer to Observer/Advisor mode, while an early-stage project may move more quickly toward Contributor or Managed mode.

## DPT Boundary

The preferred direction is to introduce a DPT-owned boundary without mixing DPT infrastructure into business logic unnecessarily.

```text
Existing Product
│
├── Existing architecture
├── Existing business logic
├── Existing tests
│
└── DPT Integration Boundary
     ├── Connector
     ├── Project Manifest / metadata
     ├── Local cache
     ├── Sync queue
     └── DPT policies
```

The exact packaging mechanism remains an open engineering decision.

## Progressive adoption

Existing projects can move through the levels over time:

```text
Existing Project
 ↓
Observe
 ↓
Understand
 ↓
Assist
 ↓
Contribute
 ↓
Manage selected capabilities
 ↓
Native DPT project (optional)
```

This prevents DPT from becoming an all-or-nothing migration.

## Success criteria

An onboarding is successful when DPT can provide meaningful value while:

- preserving existing product behavior;
- maintaining project ownership and authority boundaries;
- avoiding unnecessary architectural churn;
- establishing a reliable DPT Connector;
- discovering reusable assets and Pitfalls;
- enabling the appropriate capabilities;
- creating a path toward deeper DPT adoption when valuable.

## Future implementation work

This document should eventually be translated into:

- an onboarding protocol;
- DPT Onboarding Agent contract;
- project scanner/discovery tooling;
- integration-level detection rules;
- migration checklists;
- connector installation strategy;
- rollback and recovery procedures.
