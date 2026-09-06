# Branch Retirement Hygiene Rule

## Permanent Post-Merge Branch Lifecycle Policy

### Invariant

**MERGED_BATCH_BRANCHES MUST NOT REMAIN ACTIVE WITHOUT A CANONICAL REASON.**

After every batch is successfully merged to main and post-merge readback passes, the originating batch branch must be retired (deleted locally and remotely) within the same operational session.

---

## Pre-Retirement Verification Checklist

Before deleting a branch, verify ALL of the following:

| Check | Condition | Rationale |
|-------|-----------|-----------|
| PR Merged | `gh pr view <num> --json state` = MERGED | Source of truth for merge completion |
| main Contains Batch Commits | `git log origin/main --oneline | grep <commit>` | Verify downstream integration |
| Local main == origin/main | `git rev-parse HEAD` == `git rev-parse origin/main` | Prevent stale local state |
| Worktree Clean | `git status --porcelain` = empty | No uncommitted changes at risk |
| No Active Binding | Task/Work Order not bound to this branch | Prevent orphaned workflow state |

---

## Branch Classification Taxonomy

| Classification | Definition | Action |
|---------------|------------|--------|
| **ACTIVE** | Currently being used for work/recovery | PRESERVE until workflow completes |
| **MERGED_RETIRABLE** | All work incorporated into main via merge or squash; no active dependency | DELETE local + remote |
| **UNMERGED** | Contains commits not yet in main | PRESERVE; do not delete |
| **RECOVERY_REQUIRED** | Needed for retry, reroute, or recovery flows | PRESERVE until flow resolves |
| **PROTECTED_HISTORY** | Referenced by canonical task records, ADRs, or durability checkpoints | PRESERVE indefinitely |

---

## Retention Rules

### NEVER Delete

- `main` — canonical integration branch
- Active batch branches per BATCH_BRANCH_LIFECYCLE_INVARIANT.md
- Branches with `UNMERGED` status
- Branches with active `RECOVERY_REQUIRED` binding
- Branches classified as `PROTECTED_HISTORY`

### Always Delete (after verification)

- `MERGED_RETIRABLE` branches — both local and remote refs
- Includes squashed-merge branches (no ancestor relationship to main)
- Includes fast-forward-merge branches (merged via PR)

---

## Audit Procedure

### Step 1: Enumerate Non-Main Branches

```bash
git branch -a --format="%(refname:short)" | grep -v '^main$' | grep -v '^remotes/origin/main$'
```

### Step 2: Classify Each Branch

For each non-main branch:

```bash
# Check if all commits are in main
git merge-base --is-ancestor <branch> main && echo "MERGED" || echo "NOT_MERGED_IN_MAIN"

# Check if referenced by canonical records
grep -r "<branch-name>" docs/TASKS.md docs/adr/ 2>/dev/null && echo "CANONICAL_REF" || echo "NO_CANONICAL_REF"

# Check PR merge status
gh pr view --json state --jq '.state' 2>/dev/null
```

### Step 3: Apply Classification Matrix

| Merged in main? | Canonical ref? | Classification |
|-----------------|----------------|----------------|
| Yes | No | MERGED_RETIRABLE |
| Yes | Yes | PROTECTED_HISTORY |
| No | Any | UNMERGED |

### Step 4: Execute Retirement

```bash
# For each MERGED_RETIRABLE branch:
git branch -d <branch>       # local delete (safe—only deletes merged branches)
git push origin --delete <branch>   # remote delete
```

---

## Commitment

1. This rule applies to ALL batch branches across ALL phases.
2. No exception without explicit Owner approval documented in a DELTA.
3. Branch hygiene audits are part of POST-MERGE READBACK.
4. Violations (retained MERGED_RETIRABLE branches) must be remediated immediately.

---

## Historical Note

Checkpoint branches (`checkpoint/*`) may be retained as `PROTECTED_HISTORY` when:
- They are referenced in `docs/TASKS.md` as durable audit artifacts
- They contain historical commits that are not fully represented in main history

All other checkpoint branches that are merged and unreferenced are eligible for retirement.
