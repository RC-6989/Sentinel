/**
 * Deterministic policy engine stub.
 * Phase 5 will implement full evaluation with extensive unit tests.
 */

export type PolicyDecision = "allow" | "deny" | "approval";

export interface PolicyContext {
  toolName: string;
  environment: "development" | "staging" | "production";
  arguments: Record<string, unknown>;
  riskScore?: number;
}

export interface PolicyResult {
  decision: PolicyDecision;
  matchedRuleId?: string;
  reason: string;
}

/**
 * Placeholder evaluator — always allows until Phase 5.
 * Callers must not treat this as production security.
 */
export function evaluatePolicy(_context: PolicyContext): PolicyResult {
  return {
    decision: "allow",
    reason: "Policy engine not yet implemented (Phase 5). Default allow for scaffolding only.",
  };
}
