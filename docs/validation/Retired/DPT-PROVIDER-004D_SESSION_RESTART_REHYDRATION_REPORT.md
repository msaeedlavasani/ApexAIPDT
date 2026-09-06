# DPT-PROVIDER-004.D — Session / Restart / Rehydration Report

**Task ID:** DPT-PROVIDER-004.D
**Title:** Session / Restart / Rehydration Proof
**Status:** CLOSED
**Mode:** BUILD
**Autonomous:** YES
**Started:** 2026-09-03

---

## 1. Task Metadata

| Field | Value |
|-------|-------|
| Task ID | DPT-PROVIDER-004.D |
| Parent Task | DPT-PROVIDER-004.C (CLOSED) |
| Purpose | Prove SDK-controlled adapter survives session/runtime/adapter interruption |
| Execution Policy | AUTONOMOUS |
| Human Gate Required | NO |
| OpenCode Version | 1.18.25 |

---

## 2. Implementation

### 2.1 Files Created

| File | Purpose |
|------|---------|
| `providers/opencode/rehydration-record.mjs` | Durable Rehydration Record schema + persistence |
| `providers/opencode/context-receipt.mjs` | Context receipt for stale-state detection |
| `providers/opencode/test-rehydration.mjs` | 9-proof test harness |

### 2.2 Architecture

```
DPT Durable State (DPT-owned)
    ↓
Rehydration Record (persisted to disk)
    ↓
Context Receipt (baseline comparison)
    ↓
Permission Envelope → Materializer → OpenCode Config
    ↓
SDK createOpencode({ config })
    ↓
Fresh OpenCode Runtime
    ↓
Continue Work Order
```

---

## 3. Durable Rehydration Record

### 3.1 Schema

```json
{
  "record_version": "0.1.0",
  "task_id": "<task_id>",
  "task_passport_revision": "1",
  "work_order_id": "<wo_id>",
  "work_order_revision": "1",
  "attempt_id": 1,
  "role": "DEVELOPER",
  "permission_envelope_id": "env-<wo_id>-<ts>",
  "permission_envelope_revision": "0.1.0",
  "resource_claims": {},
  "workspace": "<project_root>",
  "baseline_sha": "<sha256>",
  "context_receipt": { ... },
  "provider_adapter": "dpt-opencode-provider-adapter",
  "provider_model_selection": "nara/deepseek-v4-flash",
  "provider_session_id": "<session_id>",
  "execution_phase": "STEP_1_COMPLETE",
  "last_completed_step": "step1",
  "pending_step": "step2",
  "timestamps": { "created_at": "...", "updated_at": "..." },
  "recovery_generation": 1
}
```

### 3.2 Key Design Decisions

- `provider_session_id` is **recoverable provider state**, NOT DPT task identity
- `task_id` + `work_order_id` are the durable task identity
- `recovery_generation` tracks restart count
- `context_receipt` enables stale-state detection

---

## 4. Context Receipt

### 4.1 Schema

```json
{
  "receipt_version": "0.1.0",
  "task_passport_revision": "1",
  "governance_revision": "1",
  "baseline_sha": "<sha256>",
  "documents_loaded": ["doc1.md", "doc2.md"],
  "document_digests": {},
  "provider_model": "nara/deepseek-v4-flash",
  "loaded_at": "<ISO timestamp>"
}
```

### 4.2 Stale Detection

Compares:
- `task_passport_revision` — must match
- `governance_revision` — must match
- `baseline_sha` — must match
- `documents_loaded` — must match
- `provider_model` — must match

On any mismatch: **fail closed** — do not continue with stale authority.

---

## 5. Proof Results

### 5.1 Proof 1: Normal Session Rehydration

| Phase | Result |
|-------|--------|
| Step 1: Create session, execute read prompt | PASS — `STEP_1_COMPLETE` |
| Persist rehydration record to disk | PASS |
| Terminate SDK/OpenCode runtime | PASS |
| Fresh runtime, load persisted record | PASS — record valid |
| Step 2: Rehydrate, execute continuation | PASS — `REHYDRATION_PASS` |
| **Overall** | **PASS** |

### 5.2 Proof 2: Authority Rehydration

| Check | Result |
|-------|--------|
| Re-generated bash rules match original | PASS |
| Re-generated read rules match original | PASS |
| Re-generated edit rules match original | PASS |
| No Allow Once / Allow Always state used | PASS |
| **Overall** | **PASS** |

### 5.3 Proof 3: Parent Rehydration

| Check | Result |
|-------|--------|
| Repository read restored | PASS |
| Task-scoped write restored | PASS |
| Task-scoped external directory restored | PASS |
| Task permission correctly set | PASS (`ask`) |
| **Overall** | **PASS** |

### 5.4 Proof 4: Subagent Rehydration

| Check | Result |
|-------|--------|
| Subagent has own read permissions | PASS |
| Subagent has own external directory | PASS |
| Subagent has separate task permission | PASS (`ask`, not inherited) |
| **Overall** | **PASS** |

### 5.5 Proof 5: Session Loss

| Check | Result |
|-------|--------|
| Lost session ID recorded | PASS |
| DPT task identity preserved | PASS |
| New session ID different from lost | PASS |
| Task survives session loss | PASS |
| **Overall** | **PASS** |

### 5.6 Proof 6: Adapter Restart

| Check | Result |
|-------|--------|
| Recovery record created from persisted state | PASS |
| Recovery generation incremented | PASS |
| Recovery reason recorded | PASS |
| **Overall** | **PASS** |

### 5.7 Proof 7: OpenCode Runtime Restart

| Check | Result |
|-------|--------|
| New runtime created (new session IDs) | PASS |
| Permissions still correct after restart | PASS |
| **Overall** | **PASS** |

### 5.8 Proof 8: Stale State Detection

| Check | Result |
|-------|--------|
| Stale passport revision detected | PASS — fail closed |
| Stale baseline SHA detected | PASS — fail closed |
| **Overall** | **PASS** |

### 5.9 Proof 9: Cross-Work-Order Isolation

| Check | Result |
|-------|--------|
| WO B does NOT have WO A's task workspace | PASS |
| WO A does NOT have WO B's role denials | PASS |
| **Overall** | **PASS** |

---

## 6. Acceptance Criteria

| Criterion | Value |
|-----------|-------|
| DURABLE_REHYDRATION_RECORD_IMPLEMENTED | YES |
| CONTEXT_RECEIPT_IMPLEMENTED | YES |
| NORMAL_SESSION_REHYDRATION | PASS |
| REHYDRATED_PERMISSION_EQUIVALENCE | PASS |
| PARENT_REHYDRATION | PASS |
| SUBAGENT_REHYDRATION | PASS |
| SESSION_LOSS_RECOVERY | PASS |
| ADAPTER_RESTART_RECOVERY | PASS |
| OPENCODE_RUNTIME_RESTART_RECOVERY | PASS |
| STALE_STATE_DETECTION | PASS |
| CROSS_WORK_ORDER_PERMISSION_LEAK | NO |
| PROCESS_LEAK_AFTER_RECOVERY | NO |
| MANUAL_PERMISSION_GRANTS_USED_IN_FINAL_ACCEPTANCE | NO |
| PROVIDER_PERMISSION_FRICTION | NO |
| DPT_HUMAN_GATE_TRIGGERED | NO |
| PRIMARY_CONTROL_SURFACE | SDK |
| WORK_CODEX_REQUIRED | NO |
| OPENAI_REQUIRED | NO |

---

## 7. Independent Review

| # | Check | Verdict |
|---|-------|---------|
| 1 | Durable state is DPT-owned | PASS |
| 2 | Provider session ID is not task identity | PASS |
| 3 | Restart does not lose Work Order identity | PASS |
| 4 | Permission authority regenerated, not inherited from UI/session memory | PASS |
| 5 | Parent rehydration works | PASS |
| 6 | Subagent permissions separately materialized | PASS |
| 7 | Stale authority/context fails closed | PASS |
| 8 | Cross-Work-Order isolation survives restart | PASS |
| 9 | No process leak remains | PASS |
| 10 | SDK remains primary | PASS |
| 11 | No broad permission introduced | PASS |
| 12 | No Work/Codex/OpenAI dependency introduced | PASS |
| 13 | No commit/push/merge/deploy occurred | PASS |

**Overall Verdict: PASS**

---

## 8. Final Response

```
TASK_ID:
DPT-PROVIDER-004.D

DURABLE_REHYDRATION_RECORD_IMPLEMENTED:
YES

CONTEXT_RECEIPT_IMPLEMENTED:
YES

NORMAL_SESSION_REHYDRATION:
PASS

REHYDRATED_PERMISSION_EQUIVALENCE:
PASS

PARENT_REHYDRATION:
PASS

SUBAGENT_REHYDRATION:
PASS

SESSION_LOSS_RECOVERY:
PASS

ADAPTER_RESTART_RECOVERY:
PASS

OPENCODE_RUNTIME_RESTART_RECOVERY:
PASS

STALE_STATE_DETECTION:
PASS

CROSS_WORK_ORDER_PERMISSION_LEAK:
NO

PROCESS_LEAK_AFTER_RECOVERY:
NO

MANUAL_PERMISSION_GRANTS_USED_IN_FINAL_ACCEPTANCE:
NO

PROVIDER_PERMISSION_FRICTION:
NO

DPT_HUMAN_GATE_TRIGGERED:
NO

PRIMARY_CONTROL_SURFACE:
SDK

WORK_CODEX_REQUIRED:
NO

OPENAI_REQUIRED:
NO

INDEPENDENT_REVIEW:
PASS

REPORT_PERSISTED:
YES

REPORT_READ_BACK_VERIFIED:
YES

TASK_STATUS:
CLOSED

NEXT_TASK:
DPT-PROVIDER-004.E

HUMAN_GATE_REQUIRED:
NO
```

---

*DPT-PROVIDER-004D_SESSION_RESTART_REHYDRATION_REPORT.md — 2026-09-03*
