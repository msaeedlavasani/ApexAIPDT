# Apex AI DPT — Project Intelligence Model

**Status:** Architecture direction / V0 concept  
**Purpose:** Define the information DPT should maintain about a connected project without turning Project Scout into a repeated full-repository reader.

## 1. Objective

Project Intelligence is the structured, durable understanding of a project that DPT uses for analysis and recommendations.

The goal is not to copy the repository into DPT. The goal is to maintain the minimum sufficient, evidence-backed model required to understand the product, its capabilities, architecture, constraints, and reusable boundaries.

## 2. Core separation

```text
Project
  ↓
Project Scout
  ↓
Facts + Observations + Evidence
  ↓
Project Intelligence
  ↓
AI Analyst
  ↓
Interpretation + Comparison + Recommendation
```

Scout should primarily report what exists and what can be evidenced. Analyst should interpret what those facts mean for DPT adoption.

## 3. Intelligence layers

### 3.1 Product Identity

- project identity;
- product purpose;
- product type/domain;
- lifecycle stage;
- current release/version where relevant;
- target users;
- known business/product goals.

### 3.2 Product Intent

Information that cannot reliably be inferred from code alone:

- product goals;
- priorities;
- roadmap intent;
- upcoming capabilities;
- known problems;
- business constraints;
- explicit product decisions.

### 3.3 Technology and Architecture

- languages;
- frameworks;
- major libraries;
- infrastructure;
- frontend/backend boundaries;
- services;
- databases;
- external integrations;
- communication patterns;
- deployment shape;
- major architectural patterns.

The model should capture relationships, not only technology names.

### 3.4 Capability Graph

The product should be represented primarily as capabilities rather than file paths.

Example:

```text
Product
├── Identity
│   ├── Authentication
│   ├── Authorization
│   └── User Profile
├── Gaming
│   ├── Lobby
│   ├── Matchmaking
│   └── Games
└── Monetization
    ├── Subscription
    └── Payment
```

Each capability can reference its implementation boundaries, interfaces, dependencies, maturity, status, and evidence.

### 3.5 Component and Module Map

For reusable or meaningful boundaries, DPT should know:

- component/module identity;
- responsibility;
- status;
- owner/context;
- public interfaces;
- dependencies;
- consumers;
- lifecycle/maturity;
- reuse potential where evidence supports it;
- relevant tests;
- evidence.

This supports the LEGO principle without requiring DPT to restructure the project.

### 3.6 Dependency and Interface Graph

DPT should understand important relationships such as:

```text
Component A
   ↓ depends on
Component B
   ↓ uses
Database
```

and interfaces such as:

- APIs;
- events;
- messages;
- shared state;
- data contracts;
- external service contracts.

### 3.7 Constraints and Risks

Examples:

- required technology;
- infrastructure constraints;
- regulatory/privacy constraints;
- performance targets;
- budget constraints;
- compatibility requirements;
- known technical debt;
- fragile or high-risk boundaries.

### 3.8 Evidence Graph

Important findings should link to evidence.

Conceptually:

```text
Finding
  ↓
Evidence
  ├── source
  ├── location
  ├── observation
  ├── timestamp/version
  └── confidence
```

Example:

```text
Finding:
Project uses Next.js

Evidence:
package.json
next configuration
app/ directory

Confidence:
99%
```

## 4. Facts are not interpretations

Scout should distinguish:

```text
FACT
EVIDENCE
CONFIDENCE
```

from:

```text
INTERPRETATION
RECOMMENDATION
```

For example, Scout may report that a project has an Authentication capability. It should not independently conclude that the DPT Authentication asset is better. That comparison belongs to the Analyst.

## 5. Incremental intelligence

The first discovery may be broad, but subsequent updates should be targeted.

```text
Baseline discovery
      ↓
Project Intelligence
      ↓
Project changes
      ↓
Affected capability/component detection
      ↓
Incremental Scout update
```

The objective is to avoid repeatedly consuming tokens on unchanged parts of a project.

## 6. Change sensitivity

Where useful, components/capabilities may carry change-sensitivity metadata so updates can be scoped intelligently.

A highly connected Payment capability, for example, may require broader re-evaluation than an isolated UI component.

This is a design direction, not yet a frozen scoring algorithm.

## 7. Project Intelligence is not a source-code mirror

DPT should deliberately avoid storing unnecessary repository content. Intelligence should point to authoritative project evidence rather than duplicate the entire codebase.

Private data, secrets, credentials, customer data, and unrelated source content must not be exported merely for intelligence purposes.

## 8. Candidate conceptual record

```text
ProjectIntelligence
├── identity
├── product
├── intent
├── technology
├── architecture
├── capabilities
├── components
├── dependencies
├── interfaces
├── constraints
├── risks
├── evidence
└── metadata
```

This is intentionally conceptual. The machine-readable schema is an open engineering decision.

## 9. Expected consumer

The primary downstream consumer is the DPT AI Analyst, which combines Project Intelligence with DPT Pool intelligence and project intent to produce a DPT Adoption Proposal.
