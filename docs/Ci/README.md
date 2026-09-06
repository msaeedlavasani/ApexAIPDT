# DPT Foundation CI/CD

## Overview

This CI pipeline enforces repository integrity, canonical governance, schema validity, and runtime determinism for the Apex AI DPT project.

## Pipeline Structure

### Branch CI (runs on every push)
- **repository-integrity**: File presence, encoding, structural validation
- **canonical-governance**: TASKS.md DELTA records, state_revision progression
- **schemas**: JSON validity for all schema files
- **deterministic-runtime**: Node.js syntax validation for provider extensions
- **provider-contracts**: Manifest validation, export checking
- **orchestrator-smoke**: Module import validation, configuration checks

### PR-to-main CI (additional checks)
- **pr-integration**: Re-runs critical checks against integration candidate
- Verifies PR base, commit history, conflict status
- Generates integration report

## Requirements Enforced

1. ✅ CI runs on every push to every branch
2. ✅ CI runs on every PR targeting main
3. ✅ No branch-name allowlist
4. ✅ Main branch protected (merge only after required checks PASS)
5. ✅ No deployment automation (manual gate for production)

## Validation Categories

| Category | Checks | Tools Used |
|----------|--------|------------|
| Repository Integrity | git hygiene, file presence, encodings | shell, find |
| Canonical Governance | DELTA records, state_revision, phase boundaries | grep, python3 |
| Schemas | JSON validity, structure | python3 json module |
| Deterministic Runtime | Module syntax, imports | node --check |
| Provider Contracts | Manifests, exports | grep, yamllint |
| Orchestrator Smoke | Configuration, module loading | node -e |

## Running Locally

```bash
# Validate schemas
python3 -c "import json; json.load(open('docs/schemas/intervention-event.schema.json'))"

# Check provider syntax
node --check providers/goose/dpt-extension.mjs

# Validate TASKS.md structure
grep -c "\[DELTA\]" docs/TASKS.md

# Test module imports
node -e "require('./providers/goose/orchestrator-core.mjs')"
```

## Main Branch Policy

- Direct pushes to main are restricted via branch protection
- All changes must flow through PRs
- Required checks must PASS before merge
- No owner interaction required for automated checks

## Failure Modes

If CI fails:
1. Check the specific job failure in GitHub Actions
2. Review error output for remediation guidance
3. Fix locally and push to feature branch
4. Open new PR or update existing PR
5. Re-run CI until all checks PASS
