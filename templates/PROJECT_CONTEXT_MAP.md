# Project AI Context Map

This is the routing index for AI agents. It defines what to read, in what order, for each task class.

## Mandatory first read

1. this file
2. project constitution
3. project agent instructions, if present

## Source-of-truth priority

1. verified repository/configuration
2. package manifests
3. project constitution/rules
4. domain source-of-truth documents
5. registries
6. closest analogue
7. tests/observed behavior
8. comments
9. assumptions

## Task routing

| Task | Required context | Primary analogue/search |
|---|---|---|
| Product | product brain + constitution | related product artifact |
| UI | design system + component registry | closest UI implementation |
| New page | design + component registry | closest page |
| New game/domain | design + architecture + asset registry | closest game/domain |
| Backend | architecture + API contracts | closest backend module |
| Bug fix | affected rules + implementation + tests | failing behavior |
| Analytics | product metrics + data brain | closest event/funnel |
| Security | security + architecture | affected boundary |
| Release | QA + operations | previous release |

## Discovery rule

Do not read the entire repository by default. Expand context only when evidence requires it.

## Closest analogue rule

Before creating a new feature, find the closest existing implementation and reuse its patterns unless there is a documented reason not to.

## Unknown files

Do not inspect unfamiliar files solely because they exist. First establish their package, imports, dependents, and relevance.
