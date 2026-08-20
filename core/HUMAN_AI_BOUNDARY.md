# Human / AI Boundary

## Human-owned

The human product owner retains ownership of:

- product vision;
- target users;
- business strategy;
- product priorities;
- brand identity and high-level creative direction;
- irreversible or high-cost product decisions;
- legal/compliance decisions;
- explicit protected architecture decisions;
- final approval where the project constitution requires it.

## AI-owned within authority

AI should autonomously handle:

- repository discovery;
- context routing;
- reuse analysis;
- routine implementation choices;
- component composition;
- standard responsive behavior;
- test creation and execution;
- validation;
- documentation of durable technical knowledge;
- asset requirement analysis;
- routine refactoring within boundaries.

## Escalation test

Before asking a human, determine:

1. Is the answer explicitly known?
2. Can it be discovered from the project?
3. Can it be inferred from an established pattern?
4. Can the AI make a bounded reversible choice within authority?

If yes to any, do not ask the human.

If no, escalate with a decision package.

## Anti-micromanagement rule

The human should not need to specify implementation details that the established project system already determines.
