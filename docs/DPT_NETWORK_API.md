# Apex AI DPT — Network API Contract (Conceptual)

## Purpose

The DPT Network API is the two-way boundary between Apex AI DPT and subscribed projects.

It is intentionally Pool-agnostic and implementation-neutral. REST, GraphQL, event streams, webhooks, or another transport may be selected later, but the semantic contract should remain stable.

## Fundamental relationship

```text
Project
  ↕
Project Front Agent
  ↕
DPT Trust Boundary
  ↕
Gateway Agent
  ↕
DPT Intelligence + Pools
```

The API supports both directions:

- DPT provides recommendations, reusable assets, knowledge, capabilities, warnings, and updates to projects.
- Projects provide validated reusable assets, Pitfalls, improvements, evidence, and other approved intelligence back to DPT.

The API is an intelligence/advisory boundary. It is not a mechanism for DPT to write or inject code into consuming projects.

## Core operations

### Discover / Search

Projects can search for reusable assets or intelligence.

Conceptual examples:

```text
SEARCH components: authentication
SEARCH modules: notifications
SEARCH pitfalls: Next.js + MUI hydration
SEARCH skills: board-game asset integration
SEARCH decisions: rendering strategy
```

### Fetch

Retrieve a selected asset, knowledge record, version, contract, recommendation, or related artifact.

### Analyze / Recommend

A project may submit relevant Project Intelligence or an advisory request and receive an analysis or DPT Adoption Proposal.

### Contribute

Submit a candidate reusable component, module, skill, agent, Pitfall, pattern, decision, or evidence package for validation and possible Pool acceptance.

### Subscribe

Register project interest in an asset, capability, or Pool so DPT can deliver relevant updates/events.

### Receive / Push

DPT can proactively notify or deliver information to subscribed projects, including:

- security Pitfalls;
- relevant new Pitfalls;
- component/module updates;
- adoption opportunities;
- compatibility information;
- migration guidance for the project team;
- new compatible skills/agents;
- deprecation notices.

## Event model

The production API should support asynchronous events in addition to request/response operations.

Example event types:

```text
asset.published
asset.updated
asset.deprecated
pitfall.published
pitfall.updated
capability.available
project.contribution.received
project.contribution.accepted
recommendation.available
adoption.proposal.available
security.alert
```

Events should be idempotent and versioned.

## Project Front Agent

Each connected project has a project-specific DPT Front Agent instance. External project agents communicate with DPT through that instance rather than directly with DPT internal services or Pools.

The Front Agent is responsible for the project-side DPT interaction boundary and project-specific context. It does not implement DPT recommendations in the project codebase.

## Gateway Agent

The Gateway Agent is the DPT-side network boundary between Project Front Agent instances and the DPT ecosystem.

It routes approved protocol messages and events to the appropriate DPT capabilities, intelligence services, and Pools, and returns responses through the originating Front Agent.

Direct external access to DPT internal services or Pool storage is not a supported communication path.

## Security and tenancy

The API must enforce project/organization boundaries. Projects must never receive assets or knowledge outside their subscription and authorization scope.

Sensitive project information must not be uploaded merely because a project is DPT-connected. Contributions require explicit policy and classification.

Recommended contribution classifications:

```text
PRIVATE
ORGANIZATION
SHARED
GLOBAL
```

The default should be the least permissive classification.

Secrets, credentials, customer data, and private business information MUST NOT be contributed as reusable knowledge.

The eventual platform must enforce the trust boundary technically; a prompt-only Agent instruction is insufficient as a security control.

## Versioning

The API contract itself must be versioned. Assets, recommendations, Project Intelligence packages, and knowledge records must also carry versions and compatibility metadata.

## Offline behavior

A project must remain capable of local development if the DPT network is temporarily unavailable.

Contributions/events that can safely be delayed should enter a durable local queue and synchronize when connectivity returns.

## Implementation status

This is a conceptual contract, not a frozen protocol specification. The next engineering phase should turn this document into explicit schemas, authentication/identity model, event envelopes, Front Agent/Gateway contract, SDK/connector contract, and reference implementation.
