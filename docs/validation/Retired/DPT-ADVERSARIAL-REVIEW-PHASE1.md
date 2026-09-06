# Adversarial Architecture Review — Phase 1 Report

**Scope:** Foundational architectural primitives (ADR-001 through ADR-043)  
**Date:** 2026-09-06  
**Mode:** Read-only analysis. No canonical mutations.  
**Classification protocol:** KEEP_AS_IS / DEBATABLE / REVISION_CANDIDATE / SUPERSESSION_CANDIDATE

---

## Review Methodology

For each primitive:
1. Reconstruct the problem it was intended to solve
2. Identify its hidden assumptions
3. Construct the strongest competing architecture
4. Search for counterexamples and failure modes
5. Test interactions with other accepted ADRs
6. Identify unnecessary complexity or duplicated primitives
7. Distinguish actual defects from mere alternative preferences

---

## PRIMITIVE 1: Two-Plane Separation (ADR-018)

### Problem Statement
Prevent DPT from becoming an unbounded implementation engine that modifies project code without authorization. The original problem was ADR-001's advisory-only stance, which needed to coexist with legitimate execution needs under explicit authority.

### Hidden Assumptions
- A. A clean boundary between "observing/advising" and "executing/authorizing" is always maintainable in practice
- B. There is exactly one execution-control plane (not multiple)
- C. The planes share enough context (product intent, Project Intelligence, durable decisions) to function as a single platform
- D. The boundary leakages (e.g., analysis influencing execution strategy) are controlled by the authority envelope alone

### Competing Architectures
1. **Single-plane unified model:** One responsibility layer; analysis and execution are different views of the same plane, separated only by authority gating, not by structural planes
2. **Three-plane model:** Add a third "Observation/Gathering" plane separate from both Advisory and Execution-Control, giving Scout independent lifecycle from Analyst
3. **Decentralized-plane model:** No central platform; each project runs its own advisory+execution loop independently, with cross-project intelligence flowing through contribution gates only

### Counterexamples and Failure Modes
- **Failure mode 1:** Advisory recommendations create implicit execution pressure ("you should use this component") that bypasses the execution gate. The planes share product intent—this sharing itself may cause advisory drift toward execution influence.
- **Failure mode 2:** The Orchestrator (part of Execution Control Plane) must sometimes *understand* advisory output to make execution decisions. If understanding is too tight, the advisory becomes de facto execution input; if too loose, it becomes irrelevant to execution.
- **Counterexample:** Greenfield projects (ADR-011, ADR-044) where DPT advises before any implementation—the two-plane model collapses because there is no existing execution context to separate from. The "advisory" IS the execution trigger in greenfield mode.

### Interaction Analysis
- ADR-011 (Greenfield advice before implementation): Creates a tension where advisory precedes any execution plane activity, questioning whether two planes is the right abstraction at the start of a relationship
- ADR-044 (Greenfield advisory flow): Same tension—DPT acts unilaterally on evidence before any execution-control plane involvement
- ADR-030 (Front Agent Lifecycle): Front Agent exists in both planes conceptually; its state machine must reflect dual-plane existence

### Classification: DEBATABLE

**Rationale:** The two-plane separation is structurally defensible but creates real tension at the greenfield boundary. The problem is not that the planes don't serve a purpose—it's that the *boundary condition* (project inception) doesn't fit cleanly. A revision would clarify that the separation is a *gating rule*, not a *structural isolation*, and that greenfield flows operate in a pre-execution advisory phase that transitions into the execution plane only upon explicit owner authorization.

---

## PRIMITIVE 2: Design-Time vs Runtime Ontology (ADR-029)

### Problem Statement
Resolve confusion between AGENT as a reusable definition (versioned, governance-controlled) and AGENT as a runtime instantiation (ephemeral, task-bound). Prior usage collapsed these, producing Gateway-as-Agent and Migration-Proposal-as-Agent violations.

### Hidden Assumptions
- A. The design-time/runtime distinction maps cleanly onto all relevant entities (BRAIN, ROLE, SKILL, WORKFLOW, SERVICE, POLICY, AGENT_DEFINITION)
- B. SERVICE instances can handle all deterministic work without needing an AGENT_DEFINITION counterpart
- C. ROLE fulfillment is fully enumerable (AGENT_INSTANCE, SERVICE_INSTANCE, HUMAN, WORKFLOW)
- D. Model/provider selection at instantiation (not definition time) is sufficient for all governance/compliance scenarios

### Competing Architectures
1. **Unified entity model:** Single entity type with lifecycle-aware behavior; no design-time/runtime split. The entity IS what it is at any point; context determines interpretation.
2. **Definition-only model:** Only definitions exist at design time; runtime is purely projection. Runtime entities are ephemeral views with no identity outside their parent.
3. **Role-centric model:** Collapse AGENT_DEFINITION and SKILL into ROLE-specific capabilities; ROLE becomes the primary contract unit; AGENT_DEFINITION is just a ROLE fulfillment type.

### Counterexamples and Failure Modes
- **Failure mode 1:** The determinism routing rule ("if POLICY determines unique valid action → SERVICE; if judgment required → AGENT_INSTANCE") creates a fuzzy boundary. When does a policy become "deterministic enough"? The rule is principled but operationally ambiguous at scale.
- **Failure mode 2:** ORCHESTRATOR decomposition (SERVICE + COORDINATION_REASONING_ROLE) means the same physical process can be both SERVICE and ROLE depending on context. This is correct per the model but creates operational confusion about ownership, lifecycle, and monitoring.
- **Failure mode 3:** INDEPENDENCE_CONTRACT dimensions (REASONING_ISOLATION, EVIDENCE_INDEPENDENCE, etc.) are specified per-workflow, but the workflow definition (WORKFLOW) is design-time while independence is enforced at runtime. The contract cross-cutting is architecturally sound but adds meta-schema complexity.

### Interaction Analysis
- ADR-033 (Five-layer authority stack): LAYER 4 evaluation uses determinism routing—direct dependency on ADR-029's SERVICE vs AGENT_INSTANCE distinction
- ADR-035 (Verifier Independence): Independent verifier must satisfy INDEPENDENCE_CONTRACT; verifier type selection uses ADR-029's ontology
- ADR-030 (Front Agent Lifecycle): Front Agent is an AGENT_INSTANCE; its states depend on its role fulfillment being stable
- ADR-049 (Pool Architecture): Pool stores DESIGN-TIME definitions only; INSTANCE state lives elsewhere

### Classification: KEEP_AS_IS (with minor clarification note)

**Rationale:** The design-time/runtime distinction solved a genuine and serious confusion problem (5/7 scoring model failure, Gateway-as-Agent miscategorization). The competing models either lose versioning clarity (unified model), lose identity (definition-only), or over-constrain the ontology (role-centric). The ambiguities identified are *operational* not *architectural*—they can be resolved by documentation without changing the model. The determinism routing ambiguity is a known follow-up item (see "Preserved as Follow-up" in ADR-029).

---

## PRIMITIVE 3: Five-Layer Authority Stack (ADR-033)

### Problem Statement
Ensure authority can be persistent (for governance and audit) without granting persistent runtime permissions (which would violate revocability and bounded execution). Prior systems conflated durable policy with active authorization.

### Hidden Assumptions
- A. Five distinct layers provide sufficient expressiveness; fewer layers lose necessary separation
- B. Each layer has a single clear owner (governance, owner, DPT, evaluator, provider)
- C. Materialization from LAYER 4 to LAYER 5 is always re-derived, never cached across attempts
- D. The intersection-of-windows semantics for effective-time authorization is operationally tractable

### Competing Architectures
1. **Three-layer model:** Policy → Delegation → Permission. Collapse ADR-033's five layers into three, merging LAYER 3 (envelope) into LAYER 2 and LAYER 4 into LAYER 5.
2. **Event-sourced authority:** Store authority as append-only events (delegations, grants, revocations); effective permission computed on-demand from event stream, no persistent layers.
3. **Capability-token model:** Replace layered authority with opaque capability tokens; token validity checked at execution; no layer decomposition visible.

### Counterexamples and Failure Modes
- **Failure mode 1:** Layer 4 (RUNTIME_EFFECTIVE_AUTHORITY) is "computed, not stored" yet must be auditable. How is an audit of a computation possible? The answer is the evaluation record (signed), but this introduces a new persistence concern that blurs the line between "computed" and "stored."
- **Failure mode 2:** Effective-time window = intersection of all layer windows. In multi-policy scenarios (project A delegates to project B, which delegates to project C), computing the intersection across 3+ chains becomes complex and error-prone.
- **Failure mode 3:** LAYER 2 revocation invalidates ALL LAYER 3 envelopes derived from it. This is correct but creates a blast radius: revoking one delegation can cascade through all dependent work orders and attempts. The cascade is intentional (fail-closed) but operationally disruptive.
- **Counterexample:** The determinism routing rule means the authority evaluator is a SERVICE (deterministic). If the evaluator is truly deterministic, why does LAYER 4 need to exist separately from LAYER 3? Why not compute LAYER 4 directly from LAYER 3 + time + WORK_ORDER? The extra layer adds indirection without adding expressiveness.

### Interaction Analysis
- ADR-034 (Lease Model): Leases are projected FROM LAYER 4; this coupling is correct but creates a dependency chain
- ADR-036 (Retry/Cancellation/Revocation): Revocation at LAYER 2 cascades; retry at LAYER 5 depends on LAYER 4 re-materialization
- ADR-041 (Audit Chain): LAYER 3–LAYER 4 transitions produce audit records; the audit structure depends on layer boundaries
- ADR-048 (Network API): API calls carry `caller_authority` (LAYER 3 reference); evaluation happens at the gateway

### Classification: REVISION_CANDIDATE

**Rationale:** The five-layer model is architecturally defensible but contains an unnecessary layer of indirection. LAYER 4 (RUNTIME_EFFECTIVE_AUTHORITY) and LAYER 5 (MATERIALIZED_PERMISSIONS) serve very similar purposes—both are per-attempt computations. The distinction is:
- LAYER 4: computed by authority evaluator (SERVICE)
- LAYER 5: computed by provider runtime (for execution)

This could be consolidated into a single "materialized authority" layer with two computation sites (evaluator vs. provider). The consolidation reduces cognitive load without losing security properties. The blast radius of LAYER 2 revocation is a feature, not a bug—but the cascade mechanism should be documented as an explicit operational protocol.

---

## PRIMITIVE 4: Trust Boundary via Front Agent + Gateway (ADR-006, ADR-007, ADR-008, ADR-031)

### Problem Statement
Control all external communication through a bounded trust boundary. Prevent direct project-to-DPT communication that bypasses authorization, auditing, and policy enforcement.

### Hidden Assumptions
- A. Every external project MUST communicate through exactly one Front Agent instance
- B. The Gateway is a single DPT-side boundary (not distributed)
- C. The Front Agent is project-specific (one per project) and cannot be shared
- D. Direct external access is categorically invalid (no exceptions)

### Competing Architectures
1. **Multi-Front-Agent per project:** Allow a project to run multiple coordinated Front Agents (e.g., one for advisory, one for execution control). Current model forces a single instance.
2. **Distributed Gateway:** Multiple Gateway instances across regions/clusters with consistent boundary semantics. Current model implies a single boundary.
3. **Peer-to-peer with proof:** Allow direct project-to-project communication with cryptographic proof of DPT-approval (bypassing Gateway). This changes the trust model fundamentally.

### Counterexamples and Failure Modes
- **Failure mode 1:** ADR-006 states "each connected project has a Project-specific Front Agent instance." But what about multi-tenant deployments where one DPT instance serves hundreds of projects? The Front Agent as a persistent project representation becomes expensive at scale (hundreds of long-lived processes).
- **Failure mode 2:** ADR-007 says "Direct access... must be rejected at the boundary." But the Gateway itself IS the boundary—and if the Gateway is a SERVICE (per ADR-031), it needs to authenticate incoming connections. Authentication requires a prior trust relationship. This creates a bootstrapping problem: how does a new project establish its first trusted connection without already having a Front Agent?
- **Failure mode 3:** ADR-008 decomposes Gateway into "Gateway Agent" (now renamed to just "Gateway SERVICE" per ADR-031 canonicalization). The original name "Gateway Agent" implied agency/judgment; the rename fixes this. But the underlying question remains: does the Gateway perform any judgment, or is it purely a routing/proxy function?
- **Counterexample:** ADR-009 (Project Intelligence) and ADR-049 (Pool) both involve shared data that external projects might want to query directly. The routing-through-Front-Agent rule prevents direct pool queries, which may be unnecessarily restrictive for read-only discovery operations.

### Interaction Analysis
- ADR-029 (Ontology): Front Agent is an AGENT_INSTANCE; Gateway is a SERVICE_INSTANCE
- ADR-030 (Lifecycle): Front Agent lifecycle is complex (9 states); Gateway lifecycle is simpler
- ADR-045 (Notification): Proactive notifications originate from DPT side, go through Gateway, arrive at Front Agent
- ADR-048 (API Contract): External API surface goes through Gateway; internal does not

### Classification: DEBATABLE

**Rationale:** The trust boundary principle is sound and necessary. However, the *instantiation model* (one Front Agent per project, single Gateway) creates scalability and bootstrapping issues. A revision would:
1. Allow virtual Front Agents (lightweight logical representatives) for projects with minimal interaction
2. Support distributed Gateway topologies with consistency protocols
3. Clarify the bootstrapping path for new projects (pre-Front Agent trust establishment)
4. Permit read-only Pool queries without full Front Agent instantiation

The core principle survives; the operational model needs expansion.

---

## PRIMITIVE 5: Determinism Routing (ADR-029, Section on Determinism)

### Problem Statement
Decide when work should be done by a deterministic SERVICE versus a reasoning-capable AGENT_INSTANCE. Prevent unnecessary agentization of deterministic tasks (cost, unpredictability, audit complexity).

### Hidden Assumptions
- A. "Deterministic" means "policy determines a unique valid action"
- B. The boundary between deterministic and judgment-required is knowable at decision time
- C. SERVICE instances are cheaper/faster/more auditable than AGENT_INSTANCEs
- D. A ROLE can change fulfillment type over time (cognitive → service) without semantic loss

### Competing Architectures
1. **Agent-default model:** All non-trivial work uses AGENT_INSTANCE; SERVICE is reserved for pure I/O and data transformation. Simplicity at cost of overhead.
2. **Policy-first model:** Work is always classified by the POLICY that governs it; the policy declares whether its scope is deterministic or judgmental. No separate routing rule needed.
3. **Mixed-model with fallback:** Default to SERVICE; fall back to AGENT_INSTANCE on ambiguity. Ambiguity detection is the key addition.

### Counterexamples and Failure Modes
- **Failure mode 1:** The determinism routing rule is invoked at LAYER 4 evaluation time (per ADR-033). But LAYER 4 is "computed, not stored"—so the routing decision is transient. If two evaluations of the same WORK_ORDER at different times produce different classifications (because policy evolved), the system has inconsistent behavior for identical inputs.
- **Failure mode 2:** "Policy determines a unique valid action" is a strong condition. In practice, most policies have edge cases, conflicts, or gaps that require judgment. Over time, the deterministic branch may become so narrow that almost all work routes through AGENT_INSTANCE, making the distinction pointless.
- **Failure mode 3:** ADR-029 Section 7 states "A cognitive ROLE initially fulfilled by an AGENT_INSTANCE may later be fulfilled by a SERVICE_INSTANCE if its decision procedure becomes deterministic." This implies learning/adaptation at the ROLE level, not just at the instance level. But ROLES are design-time contracts—they shouldn't change mid-execution based on runtime experience. The rule is philosophically interesting but architecturally risky.

### Interaction Analysis
- ADR-033 (Authority Stack): LAYER 4 evaluation depends on determinism classification
- ADR-035 (Verifier Independence): Verification type selection depends on whether the producing entity was a SERVICE or AGENT_INSTANCE
- ADR-039 (Routing Taxonomy): Routing dimensions include AUTHORITY as the first dimension; determinism is a separate concern
- ADR-027 (Durable State): Durable state must capture the determinism classification for audit

### Classification: DEBATABLE

**Rationale:** The routing principle is correct—deterministic work should not use agents. But the *boundary condition* ("policy determines a unique valid action") is fragile. A revision would:
1. Define a concrete determinism test (e.g., "no branch points in policy graph that require value judgments")
2. Require determinism classification to be durable (stored, not recomputed) for audit purposes
3. Prohibit mid-lifecycle ROLE fulfillment type changes (design-time declaration is final)
4. Add an "ambiguity fallback" mechanism for edge cases

---

## PRIMITIVE 6: Audit-as-Evidence, Not-Authority (ADR-041)

### Problem Statement
Ensure the audit trail provides tamper-evident history without becoming a source of execution authority. An audit that also authorizes creates circular dependency and trust fragility.

### Hidden Assumptions
- A. Three ordering dimensions (CAUSAL > INGESTION > OBSERVED) are sufficient
- B. Hash-linked per-scope chains are adequate for cross-scope consistency
- C. Audit records can be structurally prevented from carrying authority fields
- D. Tamper evidence is detectable even after the fact (asymmetric detection)

### Competing Architectures
1. **Unified ledger:** Single append-only ledger for both audit and authority. Simpler but merges evidence and power.
2. **Separate ledgers with commitment:** Audit ledger and authority ledger are independent; each commits to the other's hash. No ordering claim; consistency verified post-hoc.
3. **Zero-knowledge audit:** Audit records prove compliance without revealing content. Maximum privacy, maximum complexity.

### Counterexamples and Failure Modes
- **Failure mode 1:** Cross-scope pointers verify consistency but do NOT enforce it. A malicious actor who controls one scope's ingestor can write inconsistent entries; the cross-scope pointer will detect the inconsistency only when verified, not prevent it at write time.
- **Failure mode 2:** CAUSAL_ORDER is the primary ordering dimension, but causal relationships require explicit tracking. If two events from different scopes causally interact (e.g., approval in scope A triggers action in scope B), the causal link must be explicitly recorded. Missing explicit links create causal gaps.
- **Failure mode 3:** "OBSERVED_TIMESTAMP is advisory only"—but downstream systems (especially non-DPT consumers of audit data) may treat timestamps as authoritative. There is no architectural mechanism to prevent this misuse outside the DPT boundary.
- **Counterexample:** The audit invariant "NO authority fields" is enforced by schema. But what about implicit authority? If an audit record says "WORK_ORDER WO-123 approved by OWNER" and a downstream system reads that and acts on it, the audit record is functioning as de facto authority even though it isn't formally authority. Schema-level enforcement is necessary but not sufficient.

### Interaction Analysis
- ADR-033 (Authority Stack): LAYER 4 evaluation produces audit records; the authority/audit separation is clean in design
- ADR-037 (Graph Mutation): Graph mutations produce GRAPH_MUTATION_RECORD (audit); mutations are authority-bearing but the records themselves are not
- ADR-040 (Idempotency): Idempotency keys are recorded in audit; dedup decisions are auditable
- ADR-045 (Notification): Notifications are logged in audit; the log is evidence, not authorization

### Classification: KEEP_AS_IS (with monitoring recommendation)

**Rationale:** The three-ordering-dimension model is robust and the authority/audit separation is correctly enforced. The failure modes identified are real but represent operational risks, not architectural flaws. The cross-scope consistency gap is mitigated by the fact that DPT controls all ingestors within its boundary. The implicit-authority risk is mitigated by schema enforcement and the explicit "audit ≠ authority" contract. Recommendation: add a monitoring rule that flags any downstream consumer treating audit records as authoritative.

---

## PRIMITIVE 7: Append-Only Graph Mutation (ADR-037)

### Problem Statement
Ensure task graph changes are irreversible, auditable, and non-disruptive to in-flight work. Mutations should never retroactively change the rules under which running work operates.

### Hidden Assumptions
- A. Append-only mutation is the only safe approach for a distributed system
- B. Running tasks should never be interrupted by mutations (they complete against old rules)
- C. Cycle detection via preflight is sufficient to prevent DAG corruption
- D. The single mutation gate (Orchestrator) can serialize all mutations without becoming a bottleneck

### Competing Architectures
1. **Copy-on-write graph:** Mutations create new graph versions; running work continues on old version; new work uses new version. Cleaner separation but higher storage cost.
2. **In-place mutation with version pins:** Mutations apply in place; running tasks pin to their admission version; future tasks see new version. Simpler implementation but more complex pin management.
3. **Immutable graph with delta overlays:** Original graph never changes; all mutations are deltas applied on read. Maximum auditability, maximum read complexity.

### Counterexamples and Failure Modes
- **Failure mode 1:** "T RUNNING; T removed → T continues; result is historical record." This means removal is a no-op for running work. But what if the removal was caused by a SECURITY REVOCATION (the task is now unauthorized)? Continuing the task violates the revocation intent. The mutation rule prioritizes continuity over security.
- **Failure mode 2:** Concurrent mutations are serialized through a single gate. Under high mutation rate, the gate becomes a bottleneck. The loser is "rejected and must re-apply"—but re-application may fail if the graph has changed again. This creates a livelock risk.
- **Failure mode 3:** Cycle detection is preflight-mandatory. But preflight is itself a mutation operation (it observes the graph). If two preflights run concurrently on the same graph, they may both pass (graph unchanged during check) and then both apply, creating a cycle. The serialized application prevents this, but the preflight itself is not serialized.

### Interaction Analysis
- ADR-034 (Lease Model): Leases protect resources; mutations may affect leased resources. Lease-state-vs-graph-state consistency must be maintained.
- ADR-036 (Retry/Cancel/Revocation): Revocation of a task's authority doesn't remove it from the graph (per mutation rules); it invalidates the authority envelope. The task completes without authority.
- ADR-027 (Durable State): Task graph is part of durable state; mutations update the graph revision

### Classification: REVISION_CANDIDATE

**Rationale:** The append-only principle is sound. But the "running task continues on removed/unauthorized graph entry" rule conflicts with security revocation semantics. A revision would add an exception: when a mutation is triggered by REVOCATION (authority invalidation), the running task is subject to the revocation propagation rules (ADR-036), overriding the general "continue on old rules" rule. The concurrency/livelock issue is real but rare; documenting the re-application backoff policy is sufficient.

---

## PRIMITIVE 8: Verifier Independence (ADR-035)

### Problem Statement
Ensure verification of work products is genuinely independent, not self-serving. Self-verification produces false confidence; independent verification produces trustworthy closure.

### Hidden Assumptions
- A. Two mandatory dimensions (REASONING_ISOLATION + EVIDENCE_INDEPENDENCE) are sufficient minimum
- B. Risk-class derivation from existing canonical classifications is feasible and unambiguous
- C. Higher-independence verdict always wins in conflicts (safety-first principle)
- D. The producer-self-review prohibition is enforceable at the workflow-definition level

### Competing Architectures
1. **Dual-verifier model:** Every irreversible task requires TWO independent reviewers; disagreement escalates. Increases assurance but doubles verification cost.
2. **Adaptive independence:** Independence requirements scale with task criticality; low-risk tasks get lightweight automated checks; high-risk tasks get full multi-dimensional contracts.
3. **Probabilistic verification:** Verify a random subset of tasks; remaining tasks rely on statistical confidence. Efficient but risky for safety-critical work.

### Counterexamples and Failure Modes
- **Failure mode 1:** "Reviewer must not inherit producer's reasoning or hidden mutable context." In practice, LLM-based reviewers may be prompted with the same context as the producer (by necessity of understanding the work). Reasoning isolation is harder to enforce than the contract states.
- **Failure mode 2:** Risk-class derivation from "existing canonical task/risk/governance classification" is circular when no such classification exists. New task types have no prior classification to derive from. The system must bootstrap from somewhere.
- **Failure mode 3:** "Higher-independence verdict wins" in conflicts. But what defines "higher independence"? If Reviewer A satisfies 4/6 dimensions and Reviewer B satisfies 3/6, A wins. But what if B's missing dimension is the one most relevant to the specific risk? Dimension-counting may miss qualitative relevance.
- **Counterexample:** The verification record includes "INDEPENDENCE_CONTRACT satisfaction proof." But who verifies the proof? If the Orchestrator verifies it, the Orchestrator becomes the ultimate independence authority—which contradicts the principle of distributed independence.

### Interaction Analysis
- ADR-029 (Ontology): Verifier type selection uses AGENT_INSTANCE vs SERVICE_INSTANCE distinction
- ADR-033 (Authority): Verification is an authority gate; independent verification is a specific authority pattern
- ADR-036 (Retry/Cancellation/Revocation): Failed verification may trigger retry or cancellation
- ADR-038 (Merge Ownership): Integration verification requires independence from both producer and authorizer

### Classification: KEEP_AS_IS (with enforcement gap noted)

**Rationale:** The model is architecturally sound. The enforcement gaps (LLM context leakage, risk-class bootstrapping, dimension-counting limitation) are operational challenges, not design flaws. The model correctly identifies what independence means; implementation must address how to achieve it. Recommendation: add an operational supplement that specifies how LLM reviewers achieve reasoning isolation (separate prompt context, no shared mutable state) and how risk-class bootstrapping works for novel task types.

---

## PRIMITIVE 9: Authority Persistence ≠ Runtime Permission (ADR-033 Core Invariant)

### Problem Statement
Prevent the conflation of durable policy (what *should* be allowed) with runtime permission (what *is* allowed right now). Durable authority that grants persistent runtime access creates security holes (revocation lag, stale permissions).

### Hidden Assumptions
- A. The five-layer stack correctly separates persistence from runtime
- B. "Materialize-before-execute" is always enforceable
- C. LAYER 5 (MATERIALIZED_PERMISSIONS) can be re-derived per attempt without performance degradation
- D. Cross-layer revocation propagation is timely and complete

### Competing Architectures
1. **Just-in-time authority:** No persistent layers at all; every request is evaluated fresh against LAYER 1 policy + LAYER 2 delegations. Maximum freshness, maximum latency.
2. **Cache-with-ttl authority:** Materialize permissions with a short TTL; re-validate on expiry. Practical compromise.
3. **Event-sourced authority:** Store delegation events; replay to current state on demand. No layers, just events.

### Counterexamples and Failure Modes
- **Failure mode 1:** "NO EXECUTION BEFORE GOVERNANCE REHYDRATION." This means every runtime session must rehydrate LAYER 1 from canonical sources before executing anything. In a multi-cluster deployment, this rehydration must be consistent across clusters. Stale LAYER 1 in one cluster could authorize work that violates policy in another.
- **Failure mode 2:** LAYER 5 is "re-derived per ATTEMPT." But "attempt" is defined per ADR-027 as one execution of a WORK_ORDER. If a WORK_ORDER has sub-steps (sequential tool calls within one attempt), is LAYER 5 re-derived between sub-steps? The model implies yes (each sub-step is a new materialization), but this may be overly expensive.
- **Failure mode 3:** Cross-layer revocation: LAYER 2 revocation invalidates ALL LAYER 3 envelopes derived from it. This is the correct fail-closed behavior. But the invalidation is logically instantaneous—there is no propagation delay. In a distributed system, physical propagation always has delay. The model assumes synchronous invalidation; reality may not support this.

### Interaction Analysis
- ADR-030 (Front Agent Lifecycle): Rehydration is a key lifecycle transition; Front Agent must rehydrate before processing
- ADR-034 (Lease Model): Leases are derived from LAYER 4; if LAYER 4 is stale, leases may be invalid
- ADR-036 (Retry/Cancellation/Revocation): Revocation semantics depend entirely on this invariant
- ADR-048 (Network API): API calls carry authority references; evaluation validates against current LAYER 1+2

### Classification: KEEP_AS_IS

**Rationale:** This is the most robust primitive in the architecture. The five-layer stack correctly separates concerns, and the core invariant ("authority persistence must never imply persistent runtime permission") is unequivocally correct. The failure modes identified are implementation concerns (multi-cluster consistency, per-sub-step re-derivation cost, distributed revocation propagation) that do not invalidate the architectural model. The model is correct; the implementation must be careful.

---

## PRIMITIVE 10: Project Intelligence as Evidence-Backed Model (ADR-009, ADR-010)

### Problem Statement
Avoid repeated full-repository reading by maintaining a structured, evidence-backed intelligence package per project. Full repository reading is expensive, stale-prone, and redundant.

### Hidden Assumments
- A. Project Intelligence is sufficiently accurate to replace raw repository reading
- B. Intelligence updates are triggered reliably (no silent staleness)
- C. Intelligence scope (facts, evidence, capabilities, architecture, components, dependencies, interfaces, constraints, intent) covers all DPT needs
- D. Scout can build and maintain Project Intelligence without excessive overhead

### Competing Architectures
1. **Lazy recomputation:** Don't maintain persistent intelligence; re-read relevant parts on demand. Simpler but potentially slow for large repos.
2. **Incremental diff-based intelligence:** Maintain intelligence as diffs from prior version; apply changes incrementally. Better freshness, more complex merging.
3. **Query-on-source:** Skip intelligence entirely; route all queries to the source repository with caching. Simplest, worst performance.

### Counterexamples and Failure Modes
- **Failure mode 1:** Intelligence is evidence-backed—but evidence decays. A component marked as "present" today may be removed tomorrow. Without explicit staleness detection, stale intelligence silently misleads.
- **Failure mode 2:** ADR-009 says "Scout should create and incrementally update a Project Intelligence package." But Scout is a design-time ROLE (per ADR-029). Does Scout run continuously, or only on trigger? Continuous Scout = resource cost; trigger-based Scout = potential staleness between triggers.
- **Failure mode 3:** ADR-046 (Update Triggers) addresses intelligence refresh, but the trigger conditions (polling vs. push) are "preserved as follow-up." Without explicit refresh semantics, intelligence may drift.
- **Counterexample:** For small repositories, the cost of full re-reading may be acceptable, making the intelligence maintenance overhead unnecessary. The model doesn't account for repository size as a factor.

### Interaction Analysis
- ADR-003 (Scout/Analyst separation): Scout produces intelligence; Analyst consumes it
- ADR-044 (Greenfield flow): Greenfield projects have no prior intelligence; Scout builds from scratch
- ADR-046 (Update triggers): Explicitly addresses intelligence freshness
- ADR-049 (Pool): Intelligence may reference pool assets; pool updates should propagate to intelligence

### Classification: DEBATABLE

**Rationale:** The intelligence model is necessary for scale but incomplete on staleness and trigger semantics. A revision would:
1. Require explicit staleness metadata on each intelligence field (last-verified timestamp)
2. Define mandatory refresh triggers (time-based, change-based, demand-based)
3. Add a "confidence score" per intelligence field indicating reliability
4. Make Scout's execution model explicit (continuous vs. trigger-based, with trade-off analysis)

---

## Summary Table

| Primitive | Classification | Key Finding |
|-----------|---------------|-------------|
| 1. Two-Plane Separation | DEBATABLE | Greenfield boundary condition not fully addressed |
| 2. Design-Time/Runtime Ontology | KEEP_AS_IS | Ambiguities are operational, not architectural |
| 3. Five-Layer Authority Stack | REVISION_CANDIDATE | LAYER 4/5 indirection unnecessary; consolidate |
| 4. Trust Boundary (FA + Gateway) | DEBATABLE | Scalability and bootstrapping gaps |
| 5. Determinism Routing | DEBATABLE | Boundary condition fragile; need concrete test |
| 6. Audit-as-Evidence | KEEP_AS_IS | Operationally sound; add monitoring rule |
| 7. Append-Only Graph Mutation | REVISION_CANDIDATE | Security revocation exception needed |
| 8. Verifier Independence | KEEP_AS_IS | Enforcement gaps; add operational supplement |
| 9. Authority Persistence ≠ Runtime Permission | KEEP_AS_IS | Most robust primitive; implementation care needed |
| 10. Project Intelligence | DEBATABLE | Staleness and trigger semantics incomplete |

---

## Findings Requiring Architecture Discussion (Pre-Revision)

### FINDING-001: Authority Layer Consolidation (REVISION_CANDIDATE)

LAYER 4 (RUNTIME_EFFECTIVE_AUTHORITY) and LAYER 5 (MATERIALIZED_PERMISSIONS) serve functionally equivalent purposes—both are per-attempt computations derived from higher layers. Consolidating to four layers (Policy → Delegation → Envelope → Materialized) reduces complexity without losing security.

**Evidence:** ADR-033's own table shows LAYER 4 and LAYER 5 both have "NO" persistence and per-attempt lifetime. The only difference is computation site (evaluator vs. provider), which is an implementation detail, not an architectural one.

**Risk:** Any consolidation must preserve the "specific overrides general" and "revocation cascade" semantics.

---

### FINDING-002: Graph Mutation Security Exception (REVISION_CANDIDATE)

The current rule "running tasks continue on removed entries" conflicts with security revocation. When a task is revoked (not just removed from graph), the running execution should honor the revocation.

**Evidence:** ADR-036 defines REVOCATION as "authority invalidated." If authority is invalid, continuing execution violates the authority model.

**Risk:** Adding this exception requires distinguishing "removal" (administrative) from "revocation" (security) in the mutation record.

---

### FINDING-003: Intelligence Staleness Semantics (DEBATABLE)

Project Intelligence lacks explicit staleness metadata and mandatory refresh triggers. Stale intelligence silently corrupts downstream analysis.

**Evidence:** ADR-009 describes the model but defers refresh mechanics to follow-up. ADR-046 addresses some triggers but not staleness detection.

**Risk:** No immediate failure mode (intelligence is advisory), but long-term quality degradation is likely without remediation.

---

### FINDING-004: Determinism Routing Concrete Test (DEBATABLE)

"The policy determines a unique valid action" is philosophically correct but operationally ambiguous. A concrete, implementable test is needed.

**Evidence:** ADR-029 preserves "Role-fulfillment routing implementation" as a follow-up, acknowledging the gap.

**Risk:** Without a concrete test, production systems will implement ad-hoc heuristics, leading to inconsistent classification.

---

### FINDING-005: Trust Boundary Bootstrapping (DEBATABLE)

New projects cannot establish their first trusted connection without already having a Front Agent. The model lacks a cold-start path.

**Evidence:** ADR-007 prohibits direct external access; ADR-006 requires a Front Agent; neither addresses how the first Front Agent is provisioned.

**Risk:** Operational deadlock for new project onboarding.

---

## Next Steps (Post-Review Discussion)

These findings are presented for architecture discussion. No canonical mutations have been made. When the review team confirms which findings merit revision:

1. Create dedicated revision ADRs for REVISION_CANDIDATE findings
2. Open follow-up decisions for DEBATABLE findings requiring further evidence
3. Record operational supplements for KEEP_AS_IS findings with noted gaps
4. Schedule implementation planning for accepted revisions

**Phase 1 complete. Awaiting architecture discussion.**
