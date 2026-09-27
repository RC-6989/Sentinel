# Tool registry and input validation (Phase 3)

After [local setup](agents.md#local-setup), open `/app/tools`. Choose an organization, select a project, and register a tool with a name, description, risk level, and input JSON Schema. A tool belongs permanently to that organization and project; register a separate definition for another environment.

Owners and admins can register/edit tools and change their active/disabled status. Members can read definitions and test sample input. Names are unique within a project (SQLite's ASCII case-insensitive comparison). Mutations and audit records commit together. The database also enforces organization/project relationships.

Expand **Test input** to check a JSON object against the saved schema. The result reports validation success or the first schema violation. The tester uses the current saved definition and does not store sample input. It also works for disabled tools so their definitions can be checked before re-enabling them.

Registration and validation do not execute a tool, grant an agent access, or enforce policy. Risk levels are user-supplied classifications, not computed assessments. The execution gateway is Phase 4; policy enforcement follows in Phase 5. Endpoint configuration and tool credentials are not collected yet.

## Supported schemas

Sentinel accepts a bounded subset of JSON Schema draft-07, validated with [Ajv strict mode](https://ajv.js.org/strict-mode.html). The root must be an object schema (`"type": "object"`). Example:

```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string", "minLength": 1, "maxLength": 200 },
    "limit": { "type": "integer", "minimum": 1, "maximum": 10 }
  },
  "required": ["query"],
  "additionalProperties": false
}
```

Supported keywords:

- `type`, `properties`, `required`, `additionalProperties`
- `items` (one schema for all array elements), `minItems`, `maxItems`
- `enum`, `const`, `minLength`, `maxLength`
- `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`
- `minProperties`, `maxProperties`, `title`, `description`
- Optional root `$schema`: `http://json-schema.org/draft-07/schema#`

Nested boolean schemas are accepted. Unknown keywords, invalid keyword values, and strict-mode ambiguities are rejected when saving. Use `additionalProperties: false` to reject unknown input fields; omitted means they are permitted under JSON Schema semantics. Inputs are never coerced, stripped, or populated with defaults.

References, regex patterns, formats, combinators/conditionals, tuple schemas, `uniqueItems`, defaults, and custom keywords are unsupported. A property named `__proto__` is rejected because Ajv would ignore its definition. These limits reduce the risks of compiling and evaluating tenant-provided schemas; see [Ajv's security considerations](https://ajv.js.org/security.html).

Schema text is limited to 16 KiB (UTF-8), eight nested schema levels beneath the root, and 128 schema nodes. Sample input is limited to 64 KiB. Both JSON documents have a maximum structural depth of 20 and 4,096 values, and numbers must be finite. Compiled validators use a bounded 32-entry cache. These are per-request limits; application rate limiting remains later work.

## Verification

Run `pnpm lint`, `pnpm test`, `pnpm typecheck`, and `pnpm build`. Tool tests cover tenant and role isolation, persistence, uniqueness, schema/input limits, unsupported keywords, immediate schema updates, database constraints, audit rollback, and sample-data handling.

Smoke test: register a tool, validate matching input, reject missing/extra/wrong-type fields, edit its schema and risk, disable/re-enable it, reload, and switch organizations to confirm isolation. Definitions are stored in the local SQLite database; migrations apply automatically on startup.
