import { evaluatePolicy, parsePolicyRules, PolicyInputError } from "@sentinel/policy-engine";
import type { PolicyContext, PolicyResult, PolicyRule } from "@sentinel/policy-engine";
import { getDb, newId } from "./db";
import { getOrganizationForUser, writeAudit } from "./orgs";

export { PolicyInputError } from "@sentinel/policy-engine";

export type Policy = {
  id: string; organization_id: string; project_id: string; name: string;
  status: "active" | "disabled"; rules_json: string;
  created_at: string; updated_at: string; project_name: string; environment: string;
};

function authorize(userId: string, organizationId: string, write = false) {
  const org = getOrganizationForUser(userId, organizationId);
  if (!org || (write && !["owner", "admin"].includes(org.role))) {
    throw new PolicyInputError("You do not have permission to manage this organization.");
  }
}

function transaction<T>(work: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try { const value = work(); db.exec("COMMIT"); return value; }
  catch (error) { db.exec("ROLLBACK"); throw error; }
}

function details(organizationId: string, projectId: string, nameInput: string, rulesInput: string, status: string, excludeId = "") {
  const name = nameInput.trim();
  if (!name || name.length > 80) throw new PolicyInputError("Name must be 1–80 characters.");
  if (!["active", "disabled"].includes(status)) throw new PolicyInputError("Choose a valid policy status.");
  const db = getDb();
  if (!db.prepare("SELECT id FROM projects WHERE organization_id = ? AND id = ?").get(organizationId, projectId)) {
    throw new PolicyInputError("Project not found.");
  }
  if (db.prepare("SELECT id FROM policies WHERE organization_id = ? AND project_id = ? AND name = ? AND id != ?")
    .get(organizationId, projectId, name, excludeId)) throw new PolicyInputError("A policy with this name already exists in this project.");
  const rules = parsePolicyRules(rulesInput);
  for (const rule of rules) {
    if (rule.toolId && !db.prepare("SELECT id FROM tools WHERE organization_id = ? AND project_id = ? AND id = ?")
      .get(organizationId, projectId, rule.toolId)) throw new PolicyInputError("A rule references a tool outside this project.");
    if (rule.agentId && !db.prepare("SELECT id FROM agents WHERE organization_id = ? AND project_id = ? AND id = ?")
      .get(organizationId, projectId, rule.agentId)) throw new PolicyInputError("A rule references an agent outside this project.");
  }
  return { name, rulesJson: JSON.stringify(rules), status };
}

export function listPolicies(userId: string, organizationId: string): Policy[] {
  authorize(userId, organizationId);
  const rows = getDb().prepare(`SELECT l.*, p.name AS project_name, p.environment
    FROM policies l JOIN projects p ON p.organization_id = l.organization_id AND p.id = l.project_id
    WHERE l.organization_id = ? ORDER BY l.created_at DESC, l.id`).all(organizationId) as Policy[];
  return rows.map(row => ({ ...row }));
}

export function countBlockedCalls(userId: string, organizationId: string): number {
  authorize(userId, organizationId);
  const row = getDb().prepare(`SELECT COUNT(*) AS count FROM audit_logs
    WHERE organization_id = ? AND action IN ('tool.call_denied', 'tool.call_approval_required')`)
    .get(organizationId) as { count: number };
  return row.count;
}

export function createPolicy(userId: string, organizationId: string, projectId: string,
  name: string, rulesJson: string, status = "active") {
  return transaction(() => {
    authorize(userId, organizationId, true);
    const clean = details(organizationId, projectId, name, rulesJson, status);
    const db = getDb();
    const count = db.prepare("SELECT COUNT(*) AS count FROM policies WHERE organization_id = ? AND project_id = ?")
      .get(organizationId, projectId) as { count: number };
    if (count.count >= 20) throw new PolicyInputError("This project has reached its 20-policy limit.");
    const id = newId("pol");
    db.prepare("INSERT INTO policies (id, organization_id, project_id, name, status, rules_json) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, organizationId, projectId, clean.name, clean.status, clean.rulesJson);
    writeAudit({ organizationId, actorUserId: userId, action: "policy.created", resourceType: "policy", resourceId: id });
    return id;
  });
}

export function updatePolicy(userId: string, organizationId: string, policyId: string,
  name: string, rulesJson: string, status: string) {
  transaction(() => {
    authorize(userId, organizationId, true);
    const db = getDb();
    const row = db.prepare("SELECT project_id FROM policies WHERE organization_id = ? AND id = ?")
      .get(organizationId, policyId) as { project_id: string } | undefined;
    if (!row) throw new PolicyInputError("Policy not found.");
    const clean = details(organizationId, row.project_id, name, rulesJson, status, policyId);
    db.prepare(`UPDATE policies SET name = ?, status = ?, rules_json = ?, updated_at = datetime('now')
      WHERE organization_id = ? AND id = ?`).run(clean.name, clean.status, clean.rulesJson, organizationId, policyId);
    writeAudit({ organizationId, actorUserId: userId, action: "policy.updated", resourceType: "policy", resourceId: policyId,
      metadata: { status } });
  });
}

/** Local storage adapter. The hosted Worker can supply the same context and rules to the pure evaluator. */
export function evaluateProjectPolicy(organizationId: string, projectId: string,
  context: Omit<PolicyContext, "environment">): PolicyResult {
  const db = getDb();
  const project = db.prepare("SELECT environment FROM projects WHERE organization_id = ? AND id = ?")
    .get(organizationId, projectId) as { environment: PolicyContext["environment"] } | undefined;
  if (!project) throw new PolicyInputError("Project not found.");
  const policies = db.prepare(`SELECT id, rules_json FROM policies
    WHERE organization_id = ? AND project_id = ? AND status = 'active' ORDER BY id`)
    .all(organizationId, projectId) as { id: string; rules_json: string }[];
  if (policies.length > 20) throw new PolicyInputError("Too many active policies.");
  const rules: PolicyRule[] = policies.flatMap(policy => parsePolicyRules(policy.rules_json)
    .map(rule => ({ ...rule, id: `${policy.id}:${rule.id}` })));
  return evaluatePolicy({ ...context, environment: project.environment }, rules);
}
