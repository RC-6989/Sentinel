# Deterministic policies (Phase 5)

The local Node/SQLite gateway evaluates active policies for the agent's project before dispatch. **No matching allow rule means deny.** A disabled policy has no effect. An allow rule does not bypass API-key authentication, tool opt-in, schema validation, target allowlisting, or quotas. High and critical risk tools remain unavailable until the approval workflow can handle them safely.

Organization owners and admins can create, edit, or disable project policies on **Policies**. Members can read them. This phase uses a JSON editor; the visual builder is a later phase. Rules are limited to 50 per policy, 20 policies per project, and 16 KiB of JSON per policy. Policy and rule IDs are recorded with allowed calls, but input values are not saved.

Each policy contains a JSON array of rules. A rule requires an ASCII `id` and an `effect` of `allow`, `deny`, or `approval`. Optional `toolId`, `agentId`, `environment`, `riskLevel`, and `argument` fields must all match. Omitting a field means the rule applies to any value for that field within its project. `environment` is read from the project record; `riskLevel` is the organization's tool classification. Tool and agent IDs, when supplied, must belong to the same project as the policy.

```json
[
  { "id": "allow-lookup", "effect": "allow", "toolId": "tol_REPLACE_WITH_REAL_ID", "environment": "development" },
  { "id": "deny-private-host", "effect": "deny", "argument": { "path": "/destination/host", "operator": "one_of", "values": ["localhost", "internal.example"] } }
]
```

Argument paths are bounded JSON Pointers into the validated request object. `equals` takes one scalar `value`; `one_of` takes 1–20 scalar `values`; `exists` and `absent` take no value. A scalar is a string, finite number, boolean, or null. Missing properties differ from a present null. No regex, script, external lookup, or LLM participates in a decision. The evaluator rejects unknown fields and unsupported operators.

All matching rules are considered. **Deny overrides approval; approval overrides allow.** Approval currently returns `409 approval_required`, writes an audit record, and does not dispatch or create an approval request. An explicit or default denial returns `403 policy_denied`. A malformed active stored policy returns `503 policy_invalid` and blocks dispatch. Blocked decisions are audited without request contents; successful dispatch reservations include the matching `policyId:ruleId` in `tool_calls.policy_rule_id`.

To bound audit storage, the local gateway records at most 1,000 policy denials/approval holds per organization per UTC day. Further blocked attempts return `429 policy_decision_limit` without an audit insert. A blocked request ID is not reserved, so it can be retried after a rule changes; dispatched IDs remain reserved even after a target failure.

The pure evaluator is in `packages/policy-engine/src/index.ts`. The local membership, project lookup, and policy storage adapter is `apps/web/src/lib/policies.ts`. See [policy/auth/database integration](policy-integration.md) before adapting this path to the hosted Worker.
