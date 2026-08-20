# Bug Fix Workflow

1. Reproduce or establish the failure from evidence.
2. Classify the failure: product, design, architecture, implementation, data, security, operations, or test.
3. Identify the smallest relevant context.
4. Find the closest existing correct pattern.
5. Determine root cause before editing.
6. Implement the smallest safe correction.
7. Run targeted validation.
8. Run regression validation proportional to risk.
9. If the same failure class is likely to recur, propose a systemic prevention rule or test.
10. Report root cause, correction, validation, and systemic follow-up.

Do not enter a rewrite loop based only on visual or speculative assumptions.
