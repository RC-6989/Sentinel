import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluatePolicy, parsePolicyRules, PolicyInputError, type PolicyContext } from "../index";

const context: PolicyContext = {
  toolId: "tol_lookup", agentId: "agt_assistant", environment: "development",
  riskLevel: "low", arguments: { query: "public", destination: { host: "example.test" }, empty: null },
};
const parse = (rules: unknown) => parsePolicyRules(JSON.stringify(rules));

test("no matching allow fails closed; deny and approval override allow in any order", () => {
  assert.equal(evaluatePolicy(context, []).decision, "deny");
  const allow = { id: "base", effect: "allow" };
  const approval = { id: "review", effect: "approval", toolId: context.toolId };
  const deny = { id: "stop", effect: "deny", agentId: context.agentId };
  assert.deepEqual(evaluatePolicy(context, parse([allow, approval])), {
    decision: "approval", matchedRuleId: "review", reason: "Human approval is required.",
  });
  assert.equal(evaluatePolicy(context, parse([allow, approval, deny])).decision, "deny");
  assert.equal(evaluatePolicy(context, parse([deny, approval, allow])).matchedRuleId, "stop");
  assert.equal(evaluatePolicy(context, parse([allow])).decision, "allow");
});

test("project context and nested scalar arguments match exactly", () => {
  const rules = parse([
    { id: "other-env", effect: "allow", environment: "production" },
    { id: "other-agent", effect: "allow", agentId: "agt_other" },
    { id: "other-risk", effect: "allow", riskLevel: "medium" },
    { id: "host", effect: "allow", toolId: context.toolId,
      argument: { path: "/destination/host", operator: "equals", value: "example.test" } },
  ]);
  assert.equal(evaluatePolicy(context, rules).matchedRuleId, "host");
  assert.equal(evaluatePolicy({ ...context, arguments: { destination: { host: "private.test" } } }, rules).decision, "deny");
  assert.equal(evaluatePolicy({ ...context, toolId: "tol_other" }, rules).decision, "deny");
});

test("existence, absence and one-of distinguish missing from null", () => {
  assert.equal(evaluatePolicy(context, parse([{ id: "x", effect: "allow", argument: { path: "/empty", operator: "exists" } }])).decision, "allow");
  assert.equal(evaluatePolicy(context, parse([{ id: "x", effect: "allow", argument: { path: "/missing", operator: "absent" } }])).decision, "allow");
  assert.equal(evaluatePolicy(context, parse([{ id: "x", effect: "allow", argument: { path: "/empty", operator: "equals", value: null } }])).decision, "allow");
  assert.equal(evaluatePolicy(context, parse([{ id: "x", effect: "allow", argument: { path: "/query", operator: "one_of", values: ["public", "safe"] } }])).decision, "allow");
  assert.equal(evaluatePolicy(context, parse([{ id: "x", effect: "allow", argument: { path: "/missing", operator: "equals", value: null } }])).decision, "deny");
});

test("parser rejects malformed, ambiguous and unbounded rules", () => {
  for (const bad of [
    "not-json", "[]", JSON.stringify(Array(51).fill({ id: "x", effect: "allow" })),
    JSON.stringify([{ id: "x", effect: "allow" }, { id: "x", effect: "deny" }]),
    JSON.stringify([{ id: "x", effect: "allow", unknown: true }]),
    JSON.stringify([{ id: "x", effect: "permit" }]),
    JSON.stringify([{ id: "x", effect: "allow", environment: "unknown" }]),
    JSON.stringify([{ id: "x", effect: "allow", argument: { path: "/__proto__/x", operator: "exists" } }]),
    JSON.stringify([{ id: "x", effect: "allow", argument: { path: "/x~2y", operator: "exists" } }]),
    JSON.stringify([{ id: "x", effect: "allow", argument: { path: "/x", operator: "equals" } }]),
    JSON.stringify([{ id: "x", effect: "allow", argument: { path: "/x", operator: "one_of", values: [] } }]),
    " ".repeat(16385),
  ]) assert.throws(() => parsePolicyRules(bad), PolicyInputError);
});
