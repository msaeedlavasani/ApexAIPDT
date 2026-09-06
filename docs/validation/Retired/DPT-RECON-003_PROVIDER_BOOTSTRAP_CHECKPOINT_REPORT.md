# DPT-RECON-003 — Provider Bootstrap Checkpoint Report

**Task**: DPT-RECON-003 (pre-implementation bootstrap checkpoint delta)
**Supersedes**: DPT-RECON-002 closure record — `PERMISSION_ROOT_CAUSE: UNRESOLVED`
**Status**: CLOSED (checkpoint) — RECON-003 implementation NOT started
**Date**: 2026-09-03

> **Historical note**: This document records later/superseding evidence. The
> RECON-002 canonicalization report retains its original
> `PERMISSION_ROOT_CAUSE: UNRESOLVED` closure statement and has not been
> rewritten. It remains historical truth for what was known at RECON-002
> closure; the finding below is what the provider-bootstrap repair
> established afterward.

---

## 1. Purpose

Create a bounded local checkpoint for ONLY the provider-bootstrap repair.
This is not a DPT-RECON-003 implementation. No runtime, CLI, agent-provider
integration, or production change was introduced.

---

## 2. Confirmed Evidence

| Evidence | Result |
|----------|--------|
| EXPLICIT_AUTHORITY_ACCEPTANCE | PASS |
| PROVIDER_PERMISSION_PREFLIGHT | PASS |
| MATERIALIZATION_ACCEPTANCE | PASS |
| ZERO_POPUP_ACCEPTANCE | PASS |
| OWNER_PERMISSION_POPUPS | 0 |

Re-verified in this checkpoint by running
`node providers/opencode/launch-recon-003-diagnostic.mjs` against the current
repair files: SDK-created runtime started, repository-rooted session bound to
the materialized policy, all authorized read-only operations completed in
order, effective runtime policy confirmed via `config.get()`, and zero owner
permission popups observed from the runtime event stream.

Re-verification note: the acceptance is model-driven. One rerun produced a
fail-closed popup when the model deviated from the bounded instructions and
attempted an unauthorized `cat <<'EOF'` heredoc; the launcher correctly
counted the popup and reported FAIL, and no such command is allowed by the
envelope. The passing rerun above is the authoritative acceptance of the
current files.

---

## 3. Root Cause — Resolution Evidence

The prior RECON-002 state `PERMISSION_ROOT_CAUSE: UNRESOLVED` is superseded.

| Evidence | Result |
|----------|--------|
| ROOT_CAUSE_RESOLVED | YES |
| FAILURE_LAYER | EXECUTION_PATH_BYPASS |
| BOOTSTRAP_ENTRYPOINT_REPAIRED | YES |
| DPT_CONTROLLED_RUNTIME_REQUIRED | YES |
| MATERIALIZATION_ACCEPTANCE | PASS |
| OWNER_PERMISSION_POPUPS | 0 |

Confirmed root cause:

1. The ordinary interactive OpenCode execution path bypassed the
   DPT-controlled SDK runtime/session path, so DPT authority evaluation was
   never in the execution chain.
2. The prior RECON-003 launcher was functionally incomplete and aborted
   before usable materialization (block-scoped envelope/materialized state
   referenced after those scopes ended).

---

## 4. Repaired Execution Chain

```
DPT Permission Envelope
    ↓
OpenCode Permission Materializer
    ↓
OpenCode-native policy
    ↓
SDK-created runtime
    ↓
DPT-controlled session
    ↓
authorized repository operations
```

Provider-native repository path matching was corrected without broadening the
DPT authority boundary: path rules now fail closed (`"*": "deny"` baseline),
canonical envelope patterns are retained alongside provider-native relative
forms for auditability, and secret-bearing file shapes remain denied.

---

## 5. Repair Scope

Authorized checkpoint files:

- `providers/opencode/launch-recon-003-diagnostic.mjs`
- `providers/opencode/opencode-adapter.mjs`
- `providers/opencode/permission-materializer.mjs`
- `providers/opencode/sdk-normalizer.mjs`

---

## 6. Checkpoint Verification

| Check | Result |
|-------|--------|
| CHECKPOINT_COMMIT | `65d099341d7e7b4dba27653df92d27b5ee5268e9` |
| Commit intent | `fix(provider): bind DPT authority to OpenCode runtime` |
| WORKTREE_UNRELATED_CHANGES_PRESERVED | YES |
| STATIC_OPENCODE_CONFIG_MODIFIED | NO |
| GLOBAL_PERMISSION_WEAKENING | NO |
| ZERO_POPUP_ACCEPTANCE | PASS |
| Pushed to remote | NO |
| Merged to main | NO |

The checkpoint commit contains exactly the four repair files above.
Unrelated pre-existing worktree changes (the RECON-001 / RECON-002
validation-report moves into `docs/validation/Retired/` and the transcript
file `docs/validation/FreeBuff Resault.md`) were left unstaged and
unmodified. `opencode.json` is byte-identical to HEAD.

---

## 7. CLOSURE

```
TASK_ID:                              DPT-RECON-003 (bootstrap checkpoint delta)
ROOT_CAUSE_RESOLVED:                  YES
FAILURE_LAYER:                        EXECUTION_PATH_BYPASS
BOOTSTRAP_ENTRYPOINT_REPAIRED:        YES
DPT_CONTROLLED_RUNTIME_REQUIRED:      YES
MATERIALIZATION_ACCEPTANCE:           PASS
OWNER_PERMISSION_POPUPS:              0
ZERO_POPUP_ACCEPTANCE:                PASS
WORKTREE_UNRELATED_CHANGES_PRESERVED: YES
STATIC_OPENCODE_CONFIG_MODIFIED:      NO
GLOBAL_PERMISSION_WEAKENING:          NO
CHECKPOINT_COMMIT:                    65d099341d7e7b4dba27653df92d27b5ee5268e9
RECON-002_HISTORICAL_RECORD:          PRESERVED (PERMISSION_ROOT_CAUSE: UNRESOLVED at closure)
PROVIDER_BOOTSTRAP_CHECKPOINT:        CLOSED
RECON-003_IMPLEMENTATION:             NOT STARTED
AUTO_CONTINUE:                        NO
```

---

**Closed by**: OpenCode Agent
**Stop reason**: Provider-bootstrap checkpoint committed locally. Owner must
review the checkpoint result before DPT-RECON-003 implementation begins.
