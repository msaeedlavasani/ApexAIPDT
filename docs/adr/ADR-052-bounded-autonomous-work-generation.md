# ADR-052 — Bounded Autonomous Work Generation with Fixed Roadmap Policy

**Status:** ACCEPTED — 2026-09-07  
**Decision set:** Capability state, candidate work, evidence thresholds, independence, roadmap ceiling, deduplication, outcome updates, external evidence, and durable control-plane state.  
**Scope:** Internal bounded vertical slice only. No autonomous phase creation, architecture decision creation, public/constitutional contract mutation, packaging selection, or external write operation.

## Decision

DPT may generate and admit a bounded Task after `EXHAUSTED_GRAPH` only when a durable, material capability gap is observed, necessity survives falsification, an independent reviewer approves the proposal, and the candidate remains within the fixed roadmap policy and existing authority ceiling. `EXHAUSTED_GRAPH + NO_MATERIAL_EVIDENCED_GAP → NO_WORK_CREATED` is a valid terminal result.

The candidate lifecycle is distinct from Task lifecycle:

```text
OBSERVED → PROPOSED → FALSIFICATION_PENDING → FALSIFIED | REVIEW_PENDING
→ REJECTED | ADMITTED → EXECUTING → MEASURED → CLOSED | SUPERSEDED
```

Only `ADMITTED` candidates create Tasks. Candidate and Task identifiers are distinct and idempotent.

## Capability state and evidence

A capability record contains `capability_id`, maturity, evidence class, provenance, observed boundary, freshness, supersedes/superseded_by lineage, regression state, and independent verifier. Maturity levels are `UNKNOWN → OBSERVED → IMPLEMENTED → RUNTIME_PROVEN → OPERATIONALLY_PROVEN`; maturity cannot advance without the corresponding evidence.

Evidence classes are boundary-derived and mutually explicit:

- `INTERNAL_RUNTIME`: execution within the DPT/runtime boundary; no external project boundary crossed.
- `EXTERNAL_READ`: authenticated or public observation/read across a real external-project boundary.
- `EXTERNAL_WRITE`: an observed successful mutation across that boundary, with durable response and readback evidence.
- `EXTERNAL_CLOSED_LOOP`: external write followed by verified external readback and outcome processing.
- `OPERATIONAL`: repeated real deployment operation over time, including reliability/usage evidence.

Test names, URLs, labels, claims, and self-reported metadata are not evidence. Evidence must include observed boundary events, immutable artifact references, actor/executor identity, verifier, timestamp, and outcome. Evidence is fresh only within its declared validity window. New evidence supersedes old evidence by lineage; it does not erase it. Contradictory evidence creates `REGRESSED`/`UNCERTAIN`, never silent promotion.

## Work creation thresholds

- **Bounded Task:** one material reproducible failure, regression, unmet canonical requirement, or repeated gap; bounded scope, acceptance criteria, and independent review required.
- **Phase candidate:** evidence from multiple independent observations or one high-severity systemic failure, demonstrated cross-task impact, alternatives analysis, and Human Gate unless fixed policy uniquely permits it. Not enabled by this slice.
- **Architecture proposal:** systemic impact, at least two viable alternatives, compatibility/security/operational analysis, independent architecture review, and Human Gate when the choice is not unique. Not enabled by this slice.
- **Public/constitutional contract change:** explicit Owner/Human Gate always; autonomous mutation prohibited.

## Independence

The durable record MUST persist detector, proposer, falsifier, reviewer, admission controller, executor, and verifier identities. Detector ≠ proposer ≠ falsifier ≠ reviewer; reviewer ≠ executor; verifier ≠ executor; admission controller does not approve its own proposal. Shared identity or inherited evidence across these prohibited pairs fails closed. Independent review requires reasoning isolation and evidence independence.

## Roadmap mutation and policy ceiling

Autonomous mutations are limited to append-only candidate records, evidence references, rejection decisions, and one bounded Task admission inside the pre-approved roadmap and authority ceiling. Independently reviewed mutations may admit a bounded Task and its dependencies. Human-Gate mutations include phase creation, architecture/public contract changes, scope/trust-boundary expansion, policy-ceiling changes, irreversible external effects, and unresolved alternatives. Constitutional changes, Human Gate removal, retroactive history changes, silent scope expansion, and evidence-class inflation are prohibited.

## Deduplication, recovery, and outcome updates

Candidate identity is an idempotency key derived from gap identity, objective, scope, and evidence-set digest. Recovery rehydrates candidate state and admission records before generating another candidate. Equivalent active, admitted, closed, or rejected candidates suppress duplicates. An implementation result may close a Task but cannot promote capability evidence. Capability updates require independent post-outcome verification and boundary evidence; implementation success is only `IMPLEMENTED` unless stronger boundary evidence exists.

Candidate, falsification, review, admission, execution, measurement, capability update, and rejection records are durable and append-only. Crashes resume from the last valid state and never duplicate admission or execution.

## Slice boundary

The first slice supports exactly one bounded Task candidate and no autonomous phase or architecture generation. Positive proof: one real evidenced gap yields exactly one justified Task and executes through the existing autonomous admission loop. Negative proof: a plausible speculative/redundant proposal is rejected, creates no Task, and returns to `EXHAUSTED_GRAPH`.
