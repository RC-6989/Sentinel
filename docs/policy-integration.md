# Policy integration contract for hosted auth and D1

This note coordinates the gateway/policy work with the auth/database rollout. The current policy feature works only in the local Next.js Node/SQLite app. The public dashboard remains gated, and the Cloudflare Worker does not yet run the gateway. Do not point hosted signup or tool calls at an incomplete second datastore.

## Portable decision boundary

- `@sentinel/policy-engine` exports `parsePolicyRules(raw)` and `evaluatePolicy(context, rules)`. It has no database, Node, session, or network dependency. The package is intended for direct reuse in a Worker.
- `PolicyContext` requires `toolId`, `agentId`, project `environment`, tool `riskLevel`, and parsed JSON `arguments`. Its result is `allow`, `deny`, or `approval` with an optional matching rule ID. The storage adapter prefixes rule IDs with the owning policy ID so audit references remain unambiguous.
- Rules are strict, bounded JSON; call `parsePolicyRules` on creation/update **and** when loading an active policy. A malformed stored policy must block dispatch, not be skipped. No policy match is a denial. Deny > approval > allow.
- The local adapter in `apps/web/src/lib/policies.ts` reads `projects.environment`, loads only active policies for the authenticated agent's organization and project, orders them by policy ID, validates each rule set, and calls the pure evaluator. D1 can implement the same interface without importing `getDb()` or Next.js sessions.

## Durable records and authorization

Apply `migrations/0004_tool_execution.sql` before `0005_policies.sql` in the hosted migration sequence. `0005` adds project-scoped `policies` and `tool_calls.policy_rule_id`. Existing tools have execution disabled after `0004`; existing projects have no implicit allow policy after `0005`. Any separate Wrangler migration runner must preserve this order and distinguish its migration ledger from local `schema_migrations`.

Policy writes require an authenticated **owner or admin member of the same organization**. Reads require membership. A policy's project, referenced tool ID, and referenced agent ID must all belong to that organization and project. The browser's `organizationId`, policy ID, and project ID are selectors, never authority. The local service enforces these checks; Worker endpoints need equivalent checks against D1.

Gateway calls require an active, unexpired, unrevoked agent API key and an active agent. Resolve the key to organization/project/agent/key IDs on every request, bind the tool to the same project, then validate the schema and policy before outbound work. A newly hosted gateway must reserve the idempotency key, quota usage, and start audit durably before dispatch, and record the matched policy rule. For a denied or approval decision, write only metadata to audit; do not send to the target or store arguments. Preserve the global kill switch, origin checks, response bounds, and recheck of revocation before returning a result. Worker/D1 transaction semantics differ from synchronous SQLite; verify atomic reservation and audit behavior under concurrent requests before exposing this path.

Bound blocked-decision audit writes as well as dispatches: the local limit is 1,000 policy blocks per organization per UTC day, with further blocked attempts returning `429` without another insert. SQLite audit timestamps use UTC `YYYY-MM-DD HH:MM:SS`; dispatch timestamps use ISO strings. Preserve UTC-day comparison semantics or standardize timestamps during the hosted migration.

An approval result is a hold, not an approved action. Phase 7 must add durable approval requests and a human decision before any high/critical risk execution. The current local gateway keeps those risk levels disabled even if a policy says allow.
