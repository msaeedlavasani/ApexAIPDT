# Apex AI DPT Schemas

JSON Schema definitions for the Apex AI DPT framework.

## Schemas

| Schema | Description |
|--------|-------------|
| task-record.schema.json | Durable task record schema |
| task-passport.schema.json | Task passport (scope, capabilities, constraints) |
| work-order.schema.json | Work order (execution instruction) |
| delta.schema.json | Atomic state change record |
| result.schema.json | Result/handoff record |
| permission-envelope.schema.json | Scoped authorization wrapper |
| lifecycle.schema.json | Lifecycle states definition |

## Usage

All schemas conform to JSON Schema draft 2020-12. Import them into your tools or validation libraries to enforce structural consistency across DPT operations.
