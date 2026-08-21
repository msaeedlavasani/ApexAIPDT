# Apex AI DPT — Capability Engine

## Principle

A DPT project must have the capabilities required to accomplish its objectives. Capabilities are not assumed to exist; they are discovered, assembled, acquired, extended, or created.

## Capability-first project initialization

```text
Project requirements
  ↓
Capability map
  ↓
Existing skills/agents/assets
  ↓
Missing capabilities
  ↓
Reuse / Extend / Compose / Create
  ↓
Validate
  ↓
Assemble project team
```

## Continuous capability acquisition

Capability discovery does not end at project initialization.

If a new requirement appears during the project and the current team lacks the required capability, DPT must pause the affected work long enough to determine the best path:

1. reuse an existing capability;
2. extend an existing skill;
3. attach a new skill to an appropriate agent;
4. compose multiple existing capabilities;
5. create and validate a new skill;
6. create a new agent only when an existing agent cannot reasonably own the capability.

Then the project resumes with the newly validated capability.

## Skill vs Agent

A **Skill** is a reusable capability/knowledge package.

An **Agent** is an executable role with responsibilities, authority, context access, and a set of skills.

The same skill may be used by multiple agents. An agent should not be created merely because a new skill is needed.

## Capability Pool relationship

Validated skills and agents can be contributed to and retrieved from DPT Pools, subject to policy.

```text
Project A
  ↓
new capability
  ↓
validate
  ↓
DPT Pool
  ↓
Project B / C / D
```

## Anti-pattern

Never compensate for a missing capability by silently improvising an unvalidated process when the missing capability is material to the task.

The system should make capability gaps explicit and resolve them systematically.
