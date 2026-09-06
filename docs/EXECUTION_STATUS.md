# DPT Execution Status

**This is a persistent, machine-readable execution status view.**

The live status is maintained in `.dpt/status.json` and rendered by `scripts/dpt-status.sh`.

## Quick View

Run `bash scripts/dpt-status.sh` to see the current execution state.

### What This Shows

| Field | Source | Description |
|-------|--------|-------------|
| Current Task | TASKS.md + .dpt/status.json | Task currently being executed |
| Current Step | .dpt/status.json | Which step within the task |
| Completed Steps | .dpt/status.json | Steps finished in current task |
| Queued Next Steps | TASKS.md | Next READY tasks in DAG order |
| Blocked Items | TASKS.md | Tasks blocked by unresolved blockers |
| Attempt Count | .dpt/status.json | How many times the current task has been retried |
| Last Result | .dpt/status.json | Last meaningful outcome |
| Overall Progress | Computed from TASKS.md | % complete based on CLOSED vs total |
| CI Status | GitHub API | Latest CI run conclusion and SHA |

### How It Updates

- **Automatic**: Run `./scripts/dpt-status.sh --json` to regenerate from canonical state
- **On every CI push**: The CI workflow writes status to `.dpt/status.json` after completion
- **During execution**: Agents update `.dpt/status.json` as they transition between steps

### File Structure

```
.dpt/
  status.json          ← Persistent runtime state (source of truth for live view)
docs/
  TASKS.md             ← Canonical task ledger (source of truth for task definitions)
scripts/
  dpt-status.sh        ← Renderer: reads both sources, outputs human + JSON views
.github/workflows/
  dpt-ci.yml           ← CI pipeline; writes status.json after each run
```

## Current State

<!-- AUTO_STATUS_BEGIN -->
*Run `bash scripts/dpt-status.sh` for live status.*
<!-- AUTO_STATUS_END -->

## Integration with CI

The CI pipeline (`DPT-CI-001`) updates `.dpt/status.json` automatically on every push.
After CI completes, the status file reflects:
- Latest CI conclusion
- Latest commit SHA
- Current task position from TASKS.md

## Manual Update

To manually refresh status without triggering CI:

```bash
./scripts/dpt-status.sh --json > .dpt/status.json
./scripts/dpt-status.sh
```

To mark a task as running during execution:

```bash
# Update .dpt/status.json directly or use a helper
cat > .dpt/status.json << 'EOF'
{
  "version": 1,
  "last_updated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "execution": {
    "current_task": "DPT-FOUNDATION-XXX",
    "current_step": "implementation",
    "completed_steps": ["plan", "design"],
    "attempts": 1,
    "last_result": null,
    "last_result_time": null
  },
  ...
}
EOF
```
