# DPT-CI-001: Foundation Continuous Integration

**Task ID:** DPT-CI-001  
**Status:** IMPLEMENTING  
**Dependencies:** None  
**Phase:** Phase 6 (V2 Learning System Infrastructure)  
**Date:** 2026-09-06

---

## OBJECTIVE

Establish continuous integration foundation for Apex AI DPT repository. CI validates repository integrity, canonical governance, schema validity, deterministic runtime, provider contracts, and orchestrator functionality on every push and PR.

---

## REQUIREMENTS

### Trigger Conditions
1. ✅ CI MUST run on every push to every branch
2. ✅ CI MUST run on every PR targeting main
3. ✅ No branch-name allowlist

### Validation Categories
1. ✅ Repository integrity (file presence, encoding, structure)
2. ✅ Canonical governance (TASKS.md DELTA records, state progression)
3. ✅ Schemas (JSON validity for all schema files)
4. ✅ Deterministic runtime (Node.js syntax validation)
5. ✅ Provider contracts (manifests, exports)
6. ✅ Orchestrator/autonomy smoke tests

### Branch Protection
1. ✅ Protect main: no ordinary direct-push development path
2. ✅ Merge only after required checks PASS
3. ✅ PR integration CI re-runs required checks against integration candidate

### Operational Constraints
1. ✅ No deployment automation (manual gate for production)
2. ✅ No external model/provider availability required for required merge checks
3. ✅ No owner interaction unless genuine Human Gate reached

---

## ARCHITECTURAL DECISION

**Selected: GitHub Actions with local validation scripts**

**Rationale:**
1. Native GitHub integration (no external dependencies)
2. Free tier sufficient for repository validation
3. YAML-based configuration (version-controllable)
4. Modular job structure (independent validation categories)
5. Can be extended with custom validators

**Trade-offs Considered:**
- Jenkins: Requires external infrastructure
- CircleCI: External dependency, rate limits
- Custom webhook: Complex infrastructure requirements
- Local-only: Cannot enforce branch protection

---

## IMPLEMENTATION PLAN

### Phase 1: Core Pipeline (Current)
- [x] Create `.github/workflows/dpt-ci.yml`
- [x] Define job structure for all validation categories
- [x] Implement repository integrity checks
- [x] Implement canonical governance checks
- [x] Implement schema validation
- [x] Implement deterministic runtime checks
- [x] Implement provider contract validation
- [x] Implement orchestrator smoke tests

### Phase 2: Branch Protection
- [ ] Configure branch protection rules for main
- [ ] Set required status checks
- [ ] Enable PR review requirements

### Phase 3: Validation
- [ ] Run CI on checkpoint/phases-4-5-durability
- [ ] Repair any failures autonomously
- [ ] Open PR to main
- [ ] Run PR integration CI
- [ ] Merge if all checks PASS
- [ ] Perform post-merge readback

---

## OPEN DECISIONS

| # | Question | Options | Status |
|---|----------|---------|--------|
| OD-CI-001-A | Should schema validation include semantic checks beyond JSON syntax? | Syntax only / Syntax + semantic / Both with separate jobs | DEFERRED |
| OD-CI-001-B | Should CI include performance benchmarks? | Yes / No / Optional job | DEFERRED |
| OD-CI-001-C | Should failed CI block force pushes? | Block / Warn only / No enforcement | DEFERRED |

---

## SUCCESS CRITERIA

- [ ] CI passes on all branches
- [ ] CI passes on all PRs to main
- [ ] Main branch protected (requires PR, not direct push)
- [ ] All required checks must PASS before merge
- [ ] No deployment automation (manual gate enforced)
- [ ] No external model/provider required for merge checks

---

## ARTIFACTS

| Artifact | Path | Status |
|----------|------|--------|
| CI Workflow | `.github/workflows/dpt-ci.yml` | CREATED |
| CI Documentation | `docs/Ci/README.md` | CREATED |
| ADR Document | `docs/adr/ADR-CI-001.md` | PENDING |

---

## NEXT STEPS

1. ✅ Commit CI workflow and documentation
2. ⏳ Push to checkpoint/phases-4-5-durability
3. ⏳ Run CI and observe results
4. ⏳ Repair any failures autonomously
5. ⏳ Open PR: checkpoint/phases-4-5-durability → main
6. ⏳ Run PR integration CI
7. ⏳ Merge only if all required checks PASS
8. ⏳ Perform post-merge main readback

---

**Status:** Phase 1 implementation complete. Ready for CI execution.
