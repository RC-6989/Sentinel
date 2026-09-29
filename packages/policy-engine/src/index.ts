/** Bounded deterministic policy language shared by local and future hosted gateways. */
export type PolicyDecision = "allow" | "deny" | "approval";
export type Environment = "development" | "staging" | "production";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type Scalar = string | number | boolean | null;
export type ArgumentCondition =
  | { path: string; operator: "exists" | "absent" }
  | { path: string; operator: "equals"; value: Scalar }
  | { path: string; operator: "one_of"; values: Scalar[] };
export type PolicyRule = {
  id: string; effect: PolicyDecision; toolId?: string; agentId?: string;
  environment?: Environment; riskLevel?: RiskLevel; argument?: ArgumentCondition;
};
export type PolicyContext = {
  toolId: string; agentId: string; environment: Environment;
  riskLevel: RiskLevel; arguments: Record<string, unknown>;
};
export type PolicyResult = { decision: PolicyDecision; matchedRuleId?: string; reason: string };
export class PolicyInputError extends Error {}

const ruleFields = new Set(["id", "effect", "toolId", "agentId", "environment", "riskLevel", "argument"]);
const conditionFields = new Set(["path", "operator", "value", "values"]);
const environments = new Set(["development", "staging", "production"]);
const risks = new Set(["low", "medium", "high", "critical"]);
const effects = new Set(["allow", "deny", "approval"]);
const identifier = /^[A-Za-z0-9_-]{1,128}$/;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const isScalar = (value: unknown): value is Scalar =>
  value === null || typeof value === "string" || typeof value === "boolean" ||
  (typeof value === "number" && Number.isFinite(value));

function allowedFields(value: Record<string, unknown>, fields: Set<string>) {
  if (Object.keys(value).some(key => !fields.has(key))) throw new PolicyInputError("Policy contains an unsupported field.");
}

function pointerParts(path: string): string[] {
  if (!path.startsWith("/") || path.length > 512) throw new PolicyInputError("Argument path must be a bounded JSON Pointer.");
  const parts = path.slice(1).split("/");
  if (parts.length > 8 || parts.some(part => part.length > 64 || /~(?![01])/.test(part))) {
    throw new PolicyInputError("Argument path must be a bounded JSON Pointer.");
  }
  const decoded = parts.map(part => part.replace(/~1/g, "/").replace(/~0/g, "~"));
  if (decoded.some(part => ["__proto__", "prototype", "constructor"].includes(part))) {
    throw new PolicyInputError("Argument path contains a reserved property.");
  }
  return decoded;
}

function parseCondition(value: unknown): ArgumentCondition {
  if (!isRecord(value)) throw new PolicyInputError("Argument condition must be an object.");
  allowedFields(value, conditionFields);
  if (typeof value.path !== "string") throw new PolicyInputError("Argument condition needs a JSON Pointer path.");
  pointerParts(value.path);
  if (value.operator === "exists" || value.operator === "absent") {
    if ("value" in value || "values" in value) throw new PolicyInputError("Existence conditions do not take a value.");
    return { path: value.path, operator: value.operator };
  }
  if (value.operator === "equals") {
    if (!("value" in value) || !isScalar(value.value) || "values" in value) throw new PolicyInputError("Equals requires one scalar value.");
    return { path: value.path, operator: "equals", value: value.value };
  }
  if (value.operator === "one_of") {
    if (!Array.isArray(value.values) || value.values.length < 1 || value.values.length > 20 ||
      !value.values.every(isScalar) || "value" in value) throw new PolicyInputError("One-of requires 1–20 scalar values.");
    return { path: value.path, operator: "one_of", values: value.values };
  }
  throw new PolicyInputError("Unsupported argument operator.");
}

/** Parse before storing and again before evaluating; corrupted stored policy fails closed. */
export function parsePolicyRules(raw: string): PolicyRule[] {
  if (new TextEncoder().encode(raw).length > 16 * 1024) throw new PolicyInputError("Policy rules must be at most 16 KiB.");
  let data: unknown;
  try { data = JSON.parse(raw); }
  catch { throw new PolicyInputError("Policy rules must be valid JSON."); }
  if (!Array.isArray(data) || data.length < 1 || data.length > 50) {
    throw new PolicyInputError("Policy rules must contain 1–50 rules.");
  }
  const seen = new Set<string>();
  return data.map((item): PolicyRule => {
    if (!isRecord(item)) throw new PolicyInputError("Each policy rule must be an object.");
    allowedFields(item, ruleFields);
    if (typeof item.id !== "string" || !identifier.test(item.id)) throw new PolicyInputError("Each rule needs a short ASCII ID.");
    if (seen.has(item.id)) throw new PolicyInputError("Rule IDs must be unique within a policy.");
    seen.add(item.id);
    if (typeof item.effect !== "string" || !effects.has(item.effect)) throw new PolicyInputError("Choose allow, deny, or approval.");
    for (const key of ["toolId", "agentId"] as const) {
      if (item[key] !== undefined && (typeof item[key] !== "string" || !identifier.test(item[key]))) {
        throw new PolicyInputError(`${key} must be an ID.`);
      }
    }
    if (item.environment !== undefined && (typeof item.environment !== "string" || !environments.has(item.environment))) {
      throw new PolicyInputError("Choose a valid environment.");
    }
    if (item.riskLevel !== undefined && (typeof item.riskLevel !== "string" || !risks.has(item.riskLevel))) {
      throw new PolicyInputError("Choose a valid risk level.");
    }
    return {
      id: item.id, effect: item.effect as PolicyDecision,
      ...(item.toolId !== undefined ? { toolId: item.toolId as string } : {}),
      ...(item.agentId !== undefined ? { agentId: item.agentId as string } : {}),
      ...(item.environment !== undefined ? { environment: item.environment as Environment } : {}),
      ...(item.riskLevel !== undefined ? { riskLevel: item.riskLevel as RiskLevel } : {}),
      ...(item.argument !== undefined ? { argument: parseCondition(item.argument) } : {}),
    };
  });
}

function argumentMatches(input: Record<string, unknown>, rule: ArgumentCondition): boolean {
  let value: unknown = input;
  let present = true;
  for (const part of pointerParts(rule.path)) {
    if (value === null || typeof value !== "object" || !Object.hasOwn(value, part)) { present = false; break; }
    value = (value as Record<string, unknown>)[part];
  }
  if (rule.operator === "exists") return present;
  if (rule.operator === "absent") return !present;
  if (!present || !isScalar(value)) return false;
  if (rule.operator === "equals") return value === rule.value;
  if (rule.operator === "one_of") return rule.values.some(candidate => candidate === value);
  return false;
}

function matches(context: PolicyContext, rule: PolicyRule): boolean {
  return (!rule.toolId || rule.toolId === context.toolId) &&
    (!rule.agentId || rule.agentId === context.agentId) &&
    (!rule.environment || rule.environment === context.environment) &&
    (!rule.riskLevel || rule.riskLevel === context.riskLevel) &&
    (!rule.argument || argumentMatches(context.arguments, rule.argument));
}

/** Deny overrides approval, which overrides allow. No match is a denial. */
export function evaluatePolicy(context: PolicyContext, rules: PolicyRule[]): PolicyResult {
  let approval: PolicyRule | undefined;
  let allow: PolicyRule | undefined;
  for (const rule of rules) {
    if (!matches(context, rule)) continue;
    if (rule.effect === "deny") return { decision: "deny", matchedRuleId: rule.id, reason: "Denied by policy." };
    if (rule.effect === "approval") approval ??= rule;
    if (rule.effect === "allow") allow ??= rule;
  }
  if (approval) return { decision: "approval", matchedRuleId: approval.id, reason: "Human approval is required." };
  if (allow) return { decision: "allow", matchedRuleId: allow.id, reason: "Allowed by policy." };
  return { decision: "deny", reason: "No allow policy matched." };
}
