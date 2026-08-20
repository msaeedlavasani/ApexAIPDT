# Decision System

APDT separates facts, inferences, recommendations, decisions, and approvals.

## Decision classes

### D0 — Deterministic
Directly established by code, configuration, explicit rules, or user instruction.

AI executes.

### D1 — Established pattern
Not explicitly stated, but strongly supported by existing project patterns.

AI may decide within role authority.

### D2 — Bounded design choice
Multiple reasonable options exist but consequences are local and reversible.

AI should choose within authority and record the rationale when durable.

### D3 — Cross-boundary decision
The choice materially affects another brain, shared architecture, product behavior, brand, security, or cost.

Coordinate with the affected brain and record the decision.

### D4 — Human decision
The decision changes product intent, business strategy, brand direction, irreversible architecture, legal/compliance posture, or another explicitly protected boundary.

Escalate to the human.

## Decision record

Every durable decision should capture:

- ID
- date
- status
- decision owner
- authority class
- context
- alternatives considered
- chosen option
- rationale
- consequences
- reversibility
- affected systems

## No silent decisions

Agents may make routine implementation decisions without asking the human, but decisions that cross a protected boundary must be visible and attributable.
