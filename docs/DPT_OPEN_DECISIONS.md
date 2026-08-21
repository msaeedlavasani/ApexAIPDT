# Apex AI DPT — Open Decisions

**Status:** Living backlog for architecture decisions

This document records topics intentionally not frozen yet. It prevents unresolved design questions from being forgotten while the architecture is developed.

## Priority 1 — Core architecture

### 1. Project Intelligence machine-readable schema

Decide the canonical schema for Project Intelligence, including:

- identity;
- product/intent;
- architecture;
- capabilities;
- components/modules;
- dependencies;
- interfaces;
- constraints/risks;
- evidence;
- confidence;
- versioning and incremental updates.

### 2. Scout discovery strategy

Define how Scout obtains information efficiently across different stacks and repository shapes without defaulting to full-repository repeated reading.

Questions:

- what is the baseline scan?
- what is incremental?
- how is relevance determined?
- what evidence is sufficient?
- how are uncertain findings represented?

### 3. Agent vs Skill boundary

Define when a capability should be:

- a Skill;
- an Agent;
- a Brain;
- a Workflow;
- a reusable Component/Module.

### 4. Front Agent lifecycle

Define:

- provisioning of a Project Front Agent instance;
- identity and project binding;
- update/version strategy from the DPT reference;
- local persistence;
- offline behavior;
- isolation between projects.

### 5. Gateway and Trust Boundary

Define the exact boundary between:

```text
Project
  ↓
Front Agent
  ↓
Trust Boundary
  ↓
Gateway Agent
  ↓
DPT Ecosystem
```

Including identity, authentication, authorization, isolation, policy enforcement, audit, and direct-access rejection.

## Priority 2 — Recommendation and adoption

### 6. DPT Adoption Proposal schema

Define the canonical proposal structure and recommendation outcomes.

Potential sections:

- current state;
- detected needs;
- existing project solutions;
- DPT candidates;
- compatibility/value analysis;
- keep/adopt/extend/no-action decisions;
- contribution candidates;
- implementation requirements for the project team;
- expected benefits;
- risks;
- effort/complexity;
- optional adoption roadmap.

### 7. Comparison/evaluation framework

Define how DPT compares a project-owned solution with a DPT asset without assuming DPT is superior.

Potential dimensions:

- correctness;
- security;
- maintainability;
- testability;
- performance;
- reuse;
- maturity;
- compatibility;
- operational cost;
- migration effort.

### 8. Contribution acceptance model

Define how project-owned Components, Modules, Skills, Agents, Pitfalls, patterns, evidence, or decisions become Pool candidates and then accepted shared assets.

### 9. Privacy and contribution classification

Define what may leave a project and what must remain private. Confirm default classification and approval requirements.

## Priority 3 — Lifecycle and intelligence

### 10. Greenfield advisory flow

Define the complete flow from product idea to project blueprint and capability/agent assembly, while preserving the rule that DPT does not implement the project.

### 11. Proactive DPT behavior

Define when DPT may proactively notify a project about:

- relevant Components/Modules;
- Pitfalls;
- security issues;
- updates;
- capability gaps;
- architecture opportunities;
- contribution opportunities.

### 12. Project intelligence update triggers

Define how changes in a project cause targeted Scout refreshes and when a broader rescan is justified.

### 13. DPT update propagation

Define how subscribed projects receive validated asset/intelligence updates, compatibility information, deprecations, and migration notices without DPT modifying project code.

## Priority 4 — Platform and business

### 14. Network API protocol

Choose transport and finalize request/response/event schemas, authentication, versioning, rate limits, retries, and offline synchronization.

### 15. Pool architecture

Finalize Pool types, asset lifecycle, validation, versioning, compatibility metadata, and discovery/search semantics.

### 16. Credit economy

Finalize contribution rewards, consumption costs, free period, subscription plans, request limits, validation status, and anti-abuse rules.

The currently discussed example is:

```text
Consume reusable Component → -10 Credits
Valid Pitfall contribution → +3 Credits after approval
```

This is a concept, not a final price.

### 17. API monetization

Decide when/how the two-way DPT API moves from free contribution/data enrichment to subscription or usage-based access.

### 18. Runtime/packaging

Define the actual project-side packaging and deployment mechanism for the Front Agent/Connector and any local DPT boundary.

## Explicit non-goals until architecture is settled

Do not prematurely freeze:

- a specific transport protocol;
- a specific AI vendor;
- a specific database;
- a specific Agent framework;
- implementation details of the Trust Dome;
- credit pricing;
- code-writing capabilities inside DPT.
