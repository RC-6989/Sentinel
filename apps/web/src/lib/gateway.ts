import { authenticateApiKey } from "./agents";
import { getDb, newId } from "./db";
import { writeAudit } from "./orgs";
import { evaluateProjectPolicy, PolicyInputError } from "./policies";
import { ToolInputError, validateToolInput } from "./tool-schema";
import { parseToolTarget } from "./tool-target";

export class GatewayError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

type ExecutableTool = {
  id: string; organization_id: string; project_id: string; status: string;
  risk_level: string; input_schema_json: string; target_url: string | null;
  execution_enabled: number;
};

const MAX_DAILY_CALLS_PER_KEY = 100;
const MAX_DAILY_CALLS_PER_ORG = 1000;
const MAX_DAILY_POLICY_BLOCKS_PER_ORG = 1000;
const MAX_RESPONSE_BYTES = 64 * 1024;

async function boundedJsonResponse(response: Response): Promise<unknown> {
  if (!response.ok) {
    await response.body?.cancel();
    throw new GatewayError(502, "target_failed", "Tool target returned an error.");
  }
  const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
  if (contentType !== "application/json" && !contentType.endsWith("+json")) {
    await response.body?.cancel();
    throw new GatewayError(502, "invalid_target_response", "Tool target must return JSON.");
  }
  if (Number(response.headers.get("content-length")) > MAX_RESPONSE_BYTES) {
    await response.body?.cancel();
    throw new GatewayError(502, "target_response_too_large", "Tool target response exceeded 64 KiB.");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new GatewayError(502, "invalid_target_response", "Tool target returned no body.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new GatewayError(502, "target_response_too_large", "Tool target response exceeded 64 KiB.");
    }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks, length).toString("utf8")); }
  catch { throw new GatewayError(502, "invalid_target_response", "Tool target returned invalid JSON."); }
}

/** Local Node/SQLite gateway with fail-closed project policy evaluation. */
export async function executeToolCall(
  token: string, toolId: string, requestId: string, inputText: string,
  transport: typeof fetch = fetch,
): Promise<{ callId: string; requestId: string; result: unknown }> {
  const identity = authenticateApiKey(token);
  if (!identity) throw new GatewayError(401, "unauthorized", "Invalid or inactive API key.");
  if (process.env.SENTINEL_GLOBAL_KILL_SWITCH === "true") {
    throw new GatewayError(503, "execution_disabled", "Tool execution is temporarily disabled by the server operator.");
  }
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(requestId)) {
    throw new GatewayError(400, "invalid_request_id", "Idempotency-Key must be 1–128 letters, digits, dashes, or underscores.");
  }
  const db = getDb();
  const tool = db.prepare(`SELECT id, organization_id, project_id, status, risk_level,
    input_schema_json, target_url, execution_enabled FROM tools
    WHERE organization_id = ? AND project_id = ? AND id = ?`)
    .get(identity.organizationId, identity.projectId, toolId) as ExecutableTool | undefined;
  if (!tool) throw new GatewayError(404, "tool_not_found", "Tool not found in this agent's project.");
  if (tool.status !== "active" || !tool.execution_enabled || !tool.target_url) {
    throw new GatewayError(409, "tool_unavailable", "Tool execution is disabled or not configured.");
  }
  if (!["low", "medium"].includes(tool.risk_level)) {
    throw new GatewayError(409, "approval_workflow_required", "High-risk tool execution requires the approval workflow.");
  }
  let target: URL;
  try { target = parseToolTarget(tool.target_url); }
  catch { throw new GatewayError(503, "target_not_allowed", "Tool target is not on the server allowlist."); }
  try {
    const validation = validateToolInput(tool.input_schema_json, inputText);
    if (!validation.valid) throw new GatewayError(400, "invalid_input", validation.errors[0] ?? "Input does not match the tool schema.");
  } catch (error) {
    if (error instanceof GatewayError) throw error;
    if (error instanceof ToolInputError) throw new GatewayError(400, "invalid_input", error.message);
    throw error;
  }
  // Send the same parsed object that passed schema validation. Re-encoding
  // removes duplicate JSON keys, which different target parsers could interpret differently.
  const normalizedInput = JSON.stringify(JSON.parse(inputText));
  const parsedInput = JSON.parse(normalizedInput) as Record<string, unknown>;

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const callId = newId("cal");
  let policyBlock: GatewayError | null = null;
  db.exec("BEGIN IMMEDIATE");
  try {
    if (db.prepare("SELECT id FROM tool_calls WHERE organization_id = ? AND agent_id = ? AND request_id = ?")
      .get(identity.organizationId, identity.agentId, requestId)) {
      throw new GatewayError(409, "duplicate_request", "This request ID has already been used by this agent.");
    }
    let decision;
    try {
      decision = evaluateProjectPolicy(identity.organizationId, identity.projectId, {
        toolId, agentId: identity.agentId, riskLevel: tool.risk_level as "low" | "medium", arguments: parsedInput,
      });
    } catch (error) {
      if (error instanceof PolicyInputError) throw new GatewayError(503, "policy_invalid", "Policy configuration is unavailable.");
      throw error;
    }
    if (decision.decision !== "allow") {
      const approval = decision.decision === "approval";
      const blocks = db.prepare(`SELECT COUNT(*) AS count FROM audit_logs WHERE organization_id = ?
        AND action IN ('tool.call_denied', 'tool.call_approval_required') AND created_at >= ?`)
        .get(identity.organizationId, dayStart.toISOString().replace("T", " ").slice(0, 19)) as { count: number };
      if (blocks.count >= MAX_DAILY_POLICY_BLOCKS_PER_ORG) {
        throw new GatewayError(429, "policy_decision_limit", "This organization has reached its daily policy block limit.");
      }
      policyBlock = new GatewayError(approval ? 409 : 403, approval ? "approval_required" : "policy_denied", decision.reason);
      writeAudit({ organizationId: identity.organizationId, action: approval ? "tool.call_approval_required" : "tool.call_denied",
        resourceType: "tool", resourceId: toolId,
        metadata: { agentId: identity.agentId, requestId, policyRuleId: decision.matchedRuleId ?? null } });
    } else {
      const count = db.prepare("SELECT COUNT(*) AS count FROM tool_calls WHERE api_key_id = ? AND created_at >= ?")
        .get(identity.keyId, dayStart.toISOString()) as { count: number };
      if (count.count >= MAX_DAILY_CALLS_PER_KEY) {
        throw new GatewayError(429, "daily_limit", "This API key has reached its 100-call UTC daily limit.");
      }
      const orgCount = db.prepare("SELECT COUNT(*) AS count FROM tool_calls WHERE organization_id = ? AND created_at >= ?")
        .get(identity.organizationId, dayStart.toISOString()) as { count: number };
      if (orgCount.count >= MAX_DAILY_CALLS_PER_ORG) {
        throw new GatewayError(429, "organization_daily_limit", "This organization has reached its 1,000-call UTC daily limit.");
      }
      db.prepare(`INSERT INTO tool_calls (id, organization_id, project_id, agent_id, api_key_id,
        tool_id, request_id, status, created_at, policy_rule_id) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`)
        .run(callId, identity.organizationId, identity.projectId, identity.agentId,
          identity.keyId, toolId, requestId, now.toISOString(), decision.matchedRuleId ?? null);
      writeAudit({ organizationId: identity.organizationId, action: "tool.call_started", resourceType: "tool_call", resourceId: callId,
        metadata: { agentId: identity.agentId, toolId, policyRuleId: decision.matchedRuleId ?? null } });
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  if (policyBlock) throw policyBlock;

  let targetStatus: number | null = null;
  let result: unknown;
  try {
    const response = await transport(target, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "Idempotency-Key": requestId },
      body: normalizedInput,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    targetStatus = response.status;
    result = await boundedJsonResponse(response);
  } catch (error) {
    const failure = error instanceof GatewayError ? error : new GatewayError(502, "target_unreachable", "Tool target request failed.");
    db.prepare("UPDATE tool_calls SET status = 'failed', target_status = ?, failure_code = ?, finished_at = ? WHERE id = ?")
      .run(targetStatus, failure.code, new Date().toISOString(), callId);
    throw failure;
  }
  db.prepare("UPDATE tool_calls SET status = 'succeeded', target_status = ?, finished_at = ? WHERE id = ?")
    .run(targetStatus, new Date().toISOString(), callId);
  // If a key was revoked or an agent paused while the target was processing,
  // do not disclose the result to that caller. The dispatched action cannot be undone.
  if (!authenticateApiKey(token)) throw new GatewayError(401, "unauthorized", "API key became inactive during execution.");
  return { callId, requestId, result };
}
