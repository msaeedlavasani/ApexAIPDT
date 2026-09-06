# DPT-MIG-001.C — Resource Model Reconciliation

## 1. Purpose

Map ApexAIPDT's resource model (hierarchy, conflict domains, sensitivity, governance, ownership, 3 access modes) to Lab's runtime resource claims (3 modes, 2 kinds, lease semantics). Identify missing canonical dimensions and gaps.

## 2. Source References

**ApexAIPDT:** `docs/DPT_EXECUTION_CONTROL_MODEL.md` (Resource model, ResourceClaim, ConflictDomain, SensitivityLevel, governance)

**Lab:**
- `orchestrator/scheduler/resource-claims.mjs` (ResourceClaim: READ/WRITE/EXCLUSIVE, PHYSICAL/LOGICAL)
- `orchestrator/scheduler/lease-manager.mjs` (LeaseManager: lease acquisition, release, conflict detection)

## 3. Resource Hierarchy Mapping

### 3.1 ApexAIPDT Resource Hierarchy

ApexAIPDT defines a hierarchical resource model (simplified — the DPT source includes additional fields such as name/description, parent_id, logical identity, status, and metadata):

```
Resource
├── id: ResourceId
├── kind: "PHYSICAL" | "LOGICAL"
├── conflict_domain: ConflictDomain
├── sensitivity: SensitivityLevel
├── governance: GovernancePolicy
└── owner: OwnerId
```

Resources have:
- **Identity:** Unique ResourceId
- **Kind:** Physical (file, port, device) or Logical (API key, license, namespace)
- **Conflict domain:** Which other resources conflict with this one
- **Sensitivity:** How sensitive is this resource (public, internal, confidential, restricted)
- **Governance:** What rules apply to this resource (retention, audit, compliance)
- **Owner:** Who owns this resource

### 3.2 Lab Resource Hierarchy

Lab defines a simpler resource model (from `normalizeResourceClaim` in `resource-claims.mjs`):

```
ResourceClaim
├── resource: string
├── kind: "PHYSICAL" | "LOGICAL"
└── mode: "READ" | "WRITE" | "EXCLUSIVE"
```

Resources have:
- **Identity:** resource string
- **Kind:** PHYSICAL or LOGICAL
- **Access mode:** READ, WRITE, or EXCLUSIVE

### 3.3 Hierarchy Comparison

| DPT Resource Attribute | Lab ResourceClaim Field | Alignment |
|----------------------|------------------------|-----------|
| id | resource | NAMING DISCREPANCY — DPT uses `resource_id`, Lab uses `resource` |
| kind | kind | ALIGNED |
| access mode | mode | NAMING DISCREPANCY — DPT uses `access`, Lab uses `mode` |
| conflict_domain | (derived from kind + mode) | PARTIAL — Lab derives conflicts from access rules, not explicit domains |
| sensitivity | (missing) | GAP — Lab has no sensitivity concept |
| governance | (missing) | GAP — Lab has no governance concept |
| owner | (missing) | GAP — Lab has no owner concept |
| scope | (missing) | GAP — DPT concept (task/batch scope) not present in Lab |

## 4. Access Mode Mapping

### 4.1 DPT Access Modes → Lab Access Modes

| DPT Access Mode | Lab Access Mode | Description | Alignment |
|----------------|----------------|-------------|-----------|
| `READ` | `READ` | Shared read access | ALIGNED |
| `WRITE` | `WRITE` | Shared write access (read+write) | ALIGNED |
| `EXCLUSIVE` | `EXCLUSIVE` | Exclusive access (no sharing) | ALIGNED |

### 4.2 Access Mode Semantics

Lab's access mode semantics are well-defined in `resource-claims.mjs`:

| Conflict | READ | WRITE | EXCLUSIVE |
|----------|------|-------|-----------|
| **READ** | ✅ Compatible | ❌ Conflicts | ❌ Conflicts |
| **WRITE** | ❌ Conflicts | ❌ Conflicts | ❌ Conflicts |
| **EXCLUSIVE** | ❌ Conflicts | ❌ Conflicts | ❌ Conflicts |

Lab's `claimsConflict` function returns `a.mode !== ClaimMode.READ || b.mode !== ClaimMode.READ` — meaning only READ+READ is compatible. This conflicts with DPT's semantics:
- READ + READ = compatible (both Lab and DPT)
- READ + WRITE = conflict (Lab) vs. compatible (DPT) — **DISCREPANCY**
- WRITE + WRITE = conflict (both Lab and DPT)
- EXCLUSIVE + anything = conflict (both Lab and DPT)

**Lab's implementation is correct and should be adopted as canonical.**

## 5. Conflict Domain Mapping

### 5.1 DPT Conflict Domains

ApexAIPDT defines explicit conflict domains:

| Conflict Domain | Description | Examples |
|----------------|-------------|---------|
| `file-system` | File system resources | /path/to/file |
| `network` | Network resources | ports, URLs, APIs |
| `process` | Process resources | PIDs, signals |
| `memory` | Memory resources | shared memory, buffers |
| `database` | Database resources | tables, rows, connections |
| `queue` | Queue resources | message queues, job queues |
| `cache` | Cache resources | cache keys, namespaces |

### 5.2 Lab Conflict Domains

Lab does NOT have explicit conflict domains. Instead, Lab derives conflicts from:
1. **Kind:** physical resources conflict at the OS level; logical resources conflict at the application level
2. **Access mode:** READ+READ compatible; WRITE/EXCLUSIVE conflict
3. **Resource:** Same resource string = same resource = conflict if access modes conflict

### 5.3 Gap Analysis

| DPT Conflict Domain | Lab Equivalent | Gap |
|--------------------|---------------|-----|
| `file-system` | physical + resource | Lab uses resource to identify files; conflicts derived from access mode |
| `network` | physical + resource | Lab uses resource to identify ports/URLs; conflicts derived from access mode |
| `process` | (not modeled) | Lab does not track process-level resources |
| `memory` | (not modeled) | Lab does not track memory resources |
| `database` | logical + resource | Lab uses resource for database resources; conflicts derived from access mode |
| `queue` | logical + resource | Lab uses resource for queue resources; conflicts derived from access mode |
| `cache` | logical + resource | Lab uses resource for cache resources; conflicts derived from access mode |

**Lab's approach is simpler but less explicit.** DPT's explicit conflict domains provide more semantic information for conflict resolution. Lab's approach is correct for V1 but may need expansion for complex resource management.

## 6. Sensitivity Mapping

### 6.1 DPT Sensitivity Levels

ApexAIPDT defines sensitivity levels for resources:

| Sensitivity Level | Description | Examples |
|------------------|-------------|---------|
| `public` | No sensitivity restrictions | Public APIs, open data |
| `internal` | Internal use only | Internal APIs, configuration |
| `confidential` | Confidential data | PII, credentials, secrets |
| `restricted` | Highly restricted data | Financial data, health records |

### 6.2 Lab Sensitivity

Lab has NO sensitivity concept. Resources are not classified by sensitivity.

### 6.3 Gap Impact

**Severity: LOW for V1, HIGH for production.**

Lab's lack of sensitivity classification means:
- No automatic enforcement of sensitivity rules
- No audit trail for sensitive resource access
- No compliance with data protection regulations

**Migration recommendation:** Add sensitivity as an optional field to ResourceClaim for V1; make it mandatory for production.

## 7. Governance Mapping

### 7.1 DPT Governance Policies

ApexAIPDT defines governance policies for resources:

| Governance Policy | Description | Examples |
|------------------|-------------|---------|
| `retention` | How long to keep the resource | Log retention, backup retention |
| `audit` | Audit requirements | Access logging, change tracking |
| `compliance` | Regulatory compliance | GDPR, HIPAA, SOC2 |
| `disposal` | How to dispose of the resource | Secure deletion, archival |

### 7.2 Lab Governance

Lab has NO governance concept. Resources have no retention, audit, compliance, or disposal policies.

### 7.3 Gap Impact

**Severity: LOW for V1, HIGH for production.**

Lab's lack of governance means:
- No automatic retention enforcement
- No audit trail for resource operations
- No compliance with regulatory requirements

**Migration recommendation:** Add governance as optional metadata for V1; make it mandatory for production.

## 8. Ownership Mapping

### 8.1 DPT Ownership

ApexAIPDT defines ownership for resources:

| Ownership Attribute | Description |
|-------------------|-------------|
| `owner` | Who owns the resource |
| `authority` | What authority the owner has |
| `accountability` | Who is accountable for the resource |

### 8.2 Lab Ownership

Lab has NO ownership concept. Resources have no owner, authority, or accountability.

### 8.3 Gap Impact

**Severity: LOW for V1, MEDIUM for production.**

Lab's lack of ownership means:
- No clear responsibility for resource management
- No authority delegation for resource operations
- No accountability for resource issues

**Migration recommendation:** Add owner as optional field for V1; make it mandatory for production.

## 9. Lease Semantics Mapping

### 9.1 DPT Lease Concepts

ApexAIPDT defines lease-like concepts for resource access (from `DPT_EXECUTION_CONTROL_MODEL.md`):

| DPT Concept | Description | Status |
|------------|-------------|--------|
| `lease` | Time-bound access to a resource | In DPT source |
| `lease_duration` | How long the lease lasts | Inferred by reconciler — not in DPT source |
| `lease_renewal` | How to renew a lease | Inferred by reconciler — not in DPT source |
| `lease_violation` | What happens when a lease expires | Inferred by reconciler — not in DPT source |

### 9.2 Lab Lease Manager

Lab implements a lease manager (`lease-manager.mjs`) with:

| Lab Lease Concept | Description |
|------------------|-------------|
| `initialize` | Initialize the lease manager |
| `load` | Load existing lease state |
| `acquire` | Get a lease on a resource |
| `release` | Release a lease |
| `activeLeases` | Get all active leases (closest equivalent for querying acquired leases) |
| `conflicts` | Detect conflicting leases |
| `snapshot` | Take a snapshot of lease state |

### 9.3 Lease Comparison

| DPT Concept | Lab Implementation | Alignment |
|------------|-------------------|-----------|
| lease | acquire() | ALIGNED |
| lease_duration | (not implemented) | GAP — Lab leases have no expiration |
| lease_renewal | (not implemented) | GAP — Lab leases cannot be renewed |
| lease_violation | (not implemented) | GAP — Lab has no lease violation handling |
| release | release() | ALIGNED |
| query acquired leases | activeLeases() | PARTIAL — Lab provides active lease listing, not boolean check |

### 9.4 Lease Gap Impact

**Severity: MEDIUM.**

Lab's leases are simple acquire/release without:
- Time-bound expiration
- Automatic renewal
- Violation handling

**Migration recommendation:** Add lease duration and expiration for V1; add renewal and violation handling for production.

## 10. Gaps Summary

| Gap | DPT Concept Missing in Lab | Severity | Migration Impact |
|-----|---------------------------|----------|-----------------|
| No sensitivity classification | SensitivityLevel for resources | LOW (V1) / HIGH (prod) | Add optional field for V1 |
| No governance policies | Retention, audit, compliance, disposal | LOW (V1) / HIGH (prod) | Add optional metadata for V1 |
| No ownership model | Owner, authority, accountability | LOW (V1) / MEDIUM (prod) | Add optional owner for V1 |
| No explicit conflict domains | ConflictDomain enum | LOW | Lab derives conflicts from access rules; acceptable for V1 |
| No lease duration/expiry | Time-bound leases | MEDIUM | Add lease duration for V1 |
| No lease renewal | Lease extension | MEDIUM | Add renewal for production |
| No lease violation handling | Expired lease consequences | MEDIUM | Add violation handling for production |
| No process/memory resources | Process and memory conflict domains | LOW | Lab can add these as resource IDs; acceptable for V1 |
| Field naming discrepancy | resource_id→resource, access→mode | LOW | Document mapping; adopt Lab naming |

## 11. Overlaps

| Overlap | DPT Concept | Lab Implementation | Alignment |
|---------|-----------|-------------------|-----------|
| Resource identity | ResourceId | resource | NAMING DISCREPANCY — DPT uses `resource_id`, Lab uses `resource` |
| Resource kind | PHYSICAL/LOGICAL | PHYSICAL/LOGICAL | ALIGNED |
| Access modes | READ/WRITE/EXCLUSIVE | READ/WRITE/EXCLUSIVE | ALIGNED (names differ: DPT `access` vs Lab `mode`) |
| Conflict detection | ConflictDomain + access rules | kind + mode + resource | ALIGNED (Lab derives from simpler rules) |
| Lease acquisition | Lease | acquire() | ALIGNED |
| Lease release | Lease release | release() | ALIGNED |

## 12. Incompatibilities

| Incompatibility | DPT Semantics | Lab Semantics | Resolution |
|----------------|--------------|---------------|-----------|
| Field naming | `resource_id`, `access` | `resource`, `mode` | Adopt Lab naming for canonical schema; document mapping |
| Access mode conflict semantics | READ+WRITE compatible | READ+WRITE conflicts | Document discrepancy; adopt Lab semantics for V1 |
| Explicit vs. derived conflicts | Explicit ConflictDomain enum | Derived from kind + mode + resource | Lab's approach is simpler; acceptable for V1 |
| Sensitivity as first-class | SensitivityLevel is mandatory | No sensitivity concept | Add optional field for V1 |
| Governance as first-class | GovernancePolicy is mandatory | No governance concept | Add optional metadata for V1 |
| Ownership as first-class | Owner is mandatory | No ownership concept | Add optional owner for V1 |
| Time-bound leases | Leases have duration and expiry | Leases are simple acquire/release | Add duration for V1 |
| Lease renewal | Leases can be renewed | No renewal concept | Add renewal for production |
| Lease violation | Expired leases have consequences | No violation handling | Add violation handling for production |

## 13. Recommended Canonical Interpretation

1. **Adopt Lab's ResourceClaim schema as the canonical resource claim model.** It correctly captures resource identity (`resource`), kind, and access mode (`mode`). Note field naming: DPT `resource_id` maps to Lab `resource`, DPT `access` maps to Lab `mode`.

2. **Adopt Lab's conflict detection rules (kind + mode + resource).** They are simpler than DPT's explicit conflict domains but correct for V1.

3. **Adopt Lab's LeaseManager as the canonical lease implementation.** Add lease duration and expiration for V1.

4. **Add SensitivityLevel as optional metadata to ResourceClaim for V1.** Make it mandatory for production.

5. **Add GovernancePolicy as optional metadata to ResourceClaim for V1.** Make it mandatory for production.

6. **Add Owner as optional metadata to ResourceClaim for V1.** Make it mandatory for production.

7. **Add ConflictDomain as optional metadata to ResourceClaim for V1.** This provides semantic information for complex conflict resolution.

8. **Add lease duration, renewal, and violation handling for V1.** This is important for robust resource management.

9. **Do NOT replace Lab's simpler conflict detection with DPT's explicit conflict domains for V1.** Lab's approach is correct and sufficient for the current scope.

10. **Do NOT add process/memory resources for V1.** Lab can add these as resource IDs if needed; the current scope does not require explicit process/memory tracking.

---

*DPT-MIG-001.C — Generated 2026-09-02 — ApexAIPDT reconciliation*
