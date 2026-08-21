# Apex AI DPT — Business & Network Model

**Status:** Concept / V0 — direction only

## Purpose

This document captures the current business-model direction for the DPT Network without prematurely freezing pricing.

The core commercial idea is that DPT becomes more valuable as more projects participate because projects both consume and contribute reusable intelligence.

## Two-way value exchange

```text
DPT → Project

Reusable assets
Pitfalls
Skills
Agents
Updates
Security / quality intelligence

Project → DPT

Components
Modules
Skills
Agents
Pitfalls
Fixes
Patterns
Decisions
Evidence
```

Every subscribed project is potentially both a consumer and a contributor.

## Network effect

The desired economic loop is:

```text
More projects
    ↓
More validated usage
    ↓
More contributions
    ↓
Richer Pools
    ↓
Better DPT intelligence
    ↓
More valuable service
    ↓
More projects
```

The long-term product value is therefore not only AI execution. It is the accumulated reusable intelligence and assets of the network.

## Initial monetization direction

A possible early strategy is to provide a meaningful free/subsidized API allowance while the DPT ecosystem is being populated and validated.

The early phase should optimize for:

- adoption;
- real-world validation;
- high-quality contributions;
- Pool growth;
- product learning;
- proving the network effect.

After the ecosystem reaches sufficient maturity, DPT can introduce paid access.

Potential commercial models include:

- monthly subscription;
- annual subscription;
- usage/credit allocation;
- additional credit purchases;
- organization/private Pool plans;
- enterprise contracts.

Exact pricing is intentionally undecided.

## Credits

The current conceptual model uses DPT Credits as the usage and contribution accounting unit.

Basic principle:

> **Consume reusable value → spend Credits.  Create reusable value → earn Credits.**

For example, a reusable Component might have an illustrative consumption cost of 10 Credits, while an accepted contribution might earn 3 Credits.

These values are placeholders and MUST remain configurable until actual usage and infrastructure data are available.

See `DPT_CREDIT_ECONOMY.md` for the contribution lifecycle.

## Contribution incentives

A project should not receive immediate spendable Credits merely for submitting data.

The lifecycle is:

```text
Contribution
 ↓
CANDIDATE
 ↓
UNDER_REVIEW
 ↓
Validation / Policy Check
 ↓
ACCEPTED or REJECTED
 ↓
Accepted reward becomes spendable
```

The UI may show a pending reward while validation is in progress:

> **Register a valid Pitfall**  
> Reward: **+3 Credits**  
> Status: **CANDIDATE**  
> *As soon as the contribution is approved, 3 Credits will be added to your balance.*

This prevents low-quality contribution farming while making the incentive visible.

## Earned vs Purchased Credits

Credits may eventually have two sources:

```text
DPT Credits
├── Earned Credits
│   └── accepted reusable contributions
│
└── Purchased Credits
    └── subscription / usage allocation
```

The billing model should remain separate from contribution validation so either can evolve independently.

## Credit economy is not reputation

Credits represent usage/contribution value and should not be treated as a trust score.

DPT may later maintain separate dimensions such as:

- contribution quality;
- reliability;
- asset adoption;
- organization reputation;
- network reputation.

## Data governance

A contribution economy MUST NOT imply that project code automatically becomes public DPT knowledge.

Contributions should support explicit classifications such as:

```text
PRIVATE
ORGANIZATION
SHARED
GLOBAL
```

The least-permissive classification should be the default.

Secrets, credentials, customer data, and private business information must never be contributed as reusable intelligence.

Projects must know what is being contributed and under which policy.

## Subscription direction

A future subscription may control combinations of:

- Pool access;
- monthly/annual Credit allocation;
- update access;
- contribution rights;
- private/organization Pools;
- advanced Agents and Skills;
- API/event limits;
- enterprise governance.

The subscription model should not be designed solely around raw HTTP request count because different operations can have materially different value and infrastructure cost.

## Usage units

Credits are currently the preferred conceptual abstraction over raw request counting.

A future implementation may map API operations to configurable Credit costs, for example:

```text
Fetch Component → configurable Credits
Fetch Module    → configurable Credits
Fetch Skill     → configurable Credits
Fetch Agent     → configurable Credits
Analysis        → configurable Credits
```

The actual exchange rates should be determined using real cost and usage data.

## Strategic principle

The business model should reward the behavior that makes DPT stronger:

> **Create reusable value, improve the ecosystem, and receive more efficient access to the ecosystem in return.**

## Explicitly undecided

The following are intentionally NOT finalized by this document:

- free-period duration;
- free-tier limits;
- subscription prices;
- Credit purchase prices;
- exact contribution rewards;
- exact Pool consumption costs;
- enterprise pricing;
- revenue-sharing or other future incentive mechanisms.

These should be decided only after usage, infrastructure, contribution quality, and customer behavior provide sufficient evidence.
