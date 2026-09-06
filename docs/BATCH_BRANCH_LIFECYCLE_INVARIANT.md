# Batch Branch Lifecycle Invariant

**Document:** `docs/BATCH_BRANCH_LIFECYCLE_INVARIANT.md`  
**Status:** Active Framework Rule  
**Related:** `docs/DPT_TASK_SYSTEM.md`, `docs/governance/HUMAN_GATE_BOUNDARY.md`

---

## 1. Permanent Execution Rule

Every admitted execution batch MUST use its own branch. No exceptions.

This invariant ensures isolation, traceability, and clean rollback semantics for all DPT-managed work.

---

## 2. Lifecycle

```
SYNCED MAIN
    ↓
CREATE BATCH BRANCH
    ↓
EXECUTE BATCH
    ↓
VALIDATE BATCH
    ↓
PUSH BRANCH
    ↓
REMOTE READBACK
    ↓
OPEN PR TO MAIN
    ↓
PR CI / INTEGRATION VALIDATION
    ↓
MERGE
    ↓
SYNC LOCAL MAIN FROM ORIGIN
    ↓
POST-MERGE READBACK
```

---

## 3. Required Invariants

### 3.1 No Direct Main Pushes
No batch executes directly on main. All changes flow through branches and PRs.

### 3.2 Local Changes ≠ Complete
No batch is considered complete while canonical changes exist only locally. Completion requires remote verification.

### 3.3 Remote Verification Before PR
Batch branch must be pushed and remote-verified before PR admission. A PR without a verified remote branch is invalid.

### 3.4 Merge Only After CI Pass
Merge to main occurs only after required CI checks and integration validation PASS.

### 3.5 Post-Merge Sync
After merge:
- `local main SHA == origin/main SHA`
- Working tree must be clean before admitting the next batch.

### 3.6 Isolated Failures
Failed/rejected batches remain isolated on their batch branch. No pollution of main or sibling branches.

### 3.7 One Branch Per Batch
Do not create one branch per task when multiple tasks belong to the same admitted batch. A batch = one branch = one PR.

---

## 4. Canonical Completion Condition

```
BATCH_COMPLETE =
  TASKS_TERMINAL
  ∧ VALIDATION_PASS
  ∧ REMOTE_BRANCH_SYNCED
  ∧ PR_INTEGRATION_PASS
  ∧ MERGED_TO_MAIN
  ∧ LOCAL_MAIN == ORIGIN_MAIN
  ∧ WORKTREE_CLEAN
```

All conditions must be true. If any condition fails, the batch is NOT complete.

---

## 5. Branch Naming Convention

```
feat/<task-id-slug>           # Single task batch
feat/batch-<batch-id>-<desc>  # Multi-task batch
fix/<issue-slug>              # Fix batch
chore/<description>           # Maintenance batch
```

Examples:
- `feat/foundation-038-token-efficiency`
- `feat/batch-039-041-failure-patterns`
- `fix/ci-status-update`

---

## 6. Pre-Flight Checklist

Before starting any batch:

- [ ] Current branch is `main`
- [ ] `git status` is clean (no uncommitted changes)
- [ ] `git log origin/main --not main` shows no divergence
- [ ] Working directory matches `origin/main` SHA

If any check fails, resolve before proceeding.

---

## 7. Post-Merge Checklist

After PR merge completes:

- [ ] `git fetch origin`
- [ ] `git reset --hard origin/main`
- [ ] `git status` shows clean working tree
- [ ] `git log --oneline -1` matches merged PR commit
- [ ] Delete batch branch (local and remote) if no longer needed

---

## 8. Failure Recovery

If a batch fails:

1. Do NOT merge the PR.
2. Document failure in batch branch commits.
3. Either:
   - Continue on the same branch (fix and re-push), OR
   - Close PR, create new branch for retry
4. Never force-push to main from a failed batch.

---

## 9. Enforcement

This rule is a framework invariant. It applies to:
- All human operators
- All autonomous agents
- All CI/CD pipelines
- All future batch executions

Violations are tracked as `DPT-LIFECYCLE-NNN` tasks until remediated.

---

*Established: 2026-09-06 by DPT-LIVERUN-002 batch lifecycle correction.*
