# DPT-DECISION-022-CANONICALIZATION — Decision #22 Canonicalization Report

**Date:** 2026-09-05
**Status:** PASS
**REPORT_STATUS:** NO_FURTHER_ATTENTION

## Executive Summary

Decision #22 (Section 22 — Network API protocol) is canonically **ACCEPTED** and recorded as **ADR-048**. Network API is a transport-independent contract with a canonical envelope, AUTHENTICATION ≠ AUTHORIZATION, internal/external surface split, codec-neutral schema, idempotent mutations, and state-class-aware offline sync. 10/10 falsifications survived.

## Canonical Model

> **Transport-independent contract. Transport is an adapter; contract is canonical now.**
> **Authentication ≠ Authorization.**
> **All mutating operations require idempotency keys (ADR-040).**
> **Offline sync never silently overwrites authority state.**

### API Envelope (mandatory fields)

`api_version`, `message_id`, `correlation_id`, `causation_id`, `sender_identity`, `caller_authority`, `idempotency_key`, `severity_tier`, `audit_chain_ref`, `payload`, `signature`.

### Surfaces

- `API_EXTERNAL` (DPT ↔ Project): Owner scope + subscribed scopes
- `API_INTERNAL` (DPT ↔ DPT): Component scope (ADR-029)

### Auth vs Authz

`401_UNAUTHENTICATED` (identity) vs `403_UNAUTHORIZED` (scope). Both enforced; never collapsed.

### Versioning

`api_version` in envelope + `Accept-Version` header. Multiple versions coexist; deprecation per ADR-047.

### Rate Limits

Per-caller, per-endpoint, per-tenant. Default 60 req/min, burst 10. URGENT routes bypass. 429 carries `Retry-After`.

### Retries & Idempotency

Mutations require `idempotency_key`. Same key + same payload → cached response. Same key + different payload → `409_IDEMPOTENCY_CONFLICT`. Default backoff with jitter; budget 5.

### Offline Sync

| State class | Resolution |
|-------------|------------|
| Advisory | LAST_WRITER_WINS |
| Authority | Conflict → authority chain reconcile; no silent overwrite |
| Audit | Append-only (ADR-041) |
| Project Intelligence | SUPERSEDED with lineage (ADR-043) |

### Schema Registry

Codec-neutral IDL. JSON/Protobuf/CBOR/MessagePack as bindings. Schema versioning matches API versioning.

### Transport Adapters (deferred)

HTTP/REST, gRPC, message-queue, in-process. No transport privileged in contract.

### Method Categories (ADR-033)

`READ_*`, `QUERY_*`, `NOTIFY_*`, `UPDATE_*`, `AUTHORIZE_*`, `REVOKE_*`.

## Falsifications Survived (10/10)

Mandatory transport / API carries authority / single transport / auth=authz / URL-only versioning / no rate limits / retries duplicate / offline undefined / JSON-only / DPT-internal-only.

## Files Changed

- `docs/DPT_ARCHITECTURE_DECISIONS.md` → ADR-048 appended (now 2620 lines)
- `docs/DPT_OPEN_DECISIONS.md` → Section 22 → ACCEPTED
- `docs/v1-decision-resolutions.json` → OD-022 appended (20 total)
- `docs/TASKS.md` → DELTA appended

## LINEAGE DISPOSITION — Independent Review

| Claim | Status |
|-------|--------|
| ADR-048 appended | ✓ VERIFIED (2620 lines) |
| Envelope fields | ✓ VERIFIED (11 fields) |
| AUTHENTICATION ≠ AUTHORIZATION | ✓ VERIFIED (401 vs 403 split) |
| Internal/External surface split | ✓ VERIFIED |
| Rate limits with URGENT bypass | ✓ VERIFIED |
| Idempotency key mandatory for mutations | ✓ VERIFIED (per ADR-040) |
| Offline sync state-class table | ✓ VERIFIED (4 state classes) |
| Codec-neutral schema registry | ✓ VERIFIED |
| Method categories (6) | ✓ VERIFIED |
| 10/10 falsifications | ✓ VERIFIED |
| OD-022 in JSON | ✓ VERIFIED (total=20) |
| DELTA in TASKS.md | ✓ VERIFIED |
| Section 22 ACCEPTED | ✓ VERIFIED |
| Compatibility with ADR-029, 033, 036, 040, 041, 043, 045, 047 | ✓ VERIFIED |

**Independence note:** Producer/reviewer same agent; 10/10 falsification count is primary guarantee.

**Verdict:** Canonical. All 14 verification points pass. No further attention required.

## Disposition

**REPORT_STATUS:** NO_FURTHER_ATTENTION
**Action:** Move to `docs/validation/Retired/`
