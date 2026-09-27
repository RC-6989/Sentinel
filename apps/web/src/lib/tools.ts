import { getDb, newId } from "./db";
import { getOrganizationForUser, writeAudit } from "./orgs";
import { normalizeToolSchema, ToolInputError, validateToolInput } from "./tool-schema";

export { ToolInputError } from "./tool-schema";
export type Tool = {
  id: string; organization_id: string; project_id: string; name: string;
  description: string; risk_level: "low" | "medium" | "high" | "critical";
  status: "active" | "disabled"; input_schema_json: string;
  created_at: string; updated_at: string; project_name: string; environment: string;
};
export type ToolDetails = { name: string; description: string; riskLevel: string; inputSchema: string };

function authorize(userId: string, organizationId: string, write = false) {
  const org = getOrganizationForUser(userId, organizationId);
  if (!org || (write && !["owner", "admin"].includes(org.role))) {
    throw new ToolInputError("You do not have permission to manage this organization.");
  }
}

function transaction<T>(work: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function toolForOrg(organizationId: string, toolId: string) {
  const tool = getDb().prepare("SELECT * FROM tools WHERE organization_id = ? AND id = ?")
    .get(organizationId, toolId) as Tool | undefined;
  if (!tool) throw new ToolInputError("Tool not found.");
  return tool;
}

function details(organizationId: string, projectId: string, input: ToolDetails, toolId = "") {
  const name = input.name.trim();
  if (!name || name.length > 80) throw new ToolInputError("Name must be 1–80 characters.");
  if (input.description.length > 500) throw new ToolInputError("Description must be at most 500 characters.");
  if (!["low", "medium", "high", "critical"].includes(input.riskLevel)) throw new ToolInputError("Choose a valid risk level.");
  if (getDb().prepare("SELECT id FROM tools WHERE organization_id = ? AND project_id = ? AND name = ? AND id != ?")
    .get(organizationId, projectId, name, toolId)) throw new ToolInputError("A tool with this name already exists in this project.");
  return { name, schema: normalizeToolSchema(input.inputSchema) };
}

export function listTools(userId: string, organizationId: string): Tool[] {
  authorize(userId, organizationId);
  const rows = getDb().prepare(`SELECT t.*, p.name AS project_name, p.environment
    FROM tools t JOIN projects p ON p.id = t.project_id AND p.organization_id = t.organization_id
    WHERE t.organization_id = ? ORDER BY t.created_at DESC, t.id`).all(organizationId) as Tool[];
  return rows.map(row => ({ ...row }));
}

export function createTool(userId: string, organizationId: string, projectId: string, input: ToolDetails) {
  return transaction(() => {
    authorize(userId, organizationId, true);
    if (!getDb().prepare("SELECT id FROM projects WHERE organization_id = ? AND id = ?").get(organizationId, projectId)) {
      throw new ToolInputError("Project not found.");
    }
    const clean = details(organizationId, projectId, input);
    const id = newId("tol");
    getDb().prepare(`INSERT INTO tools (id, organization_id, project_id, name, description, risk_level, input_schema_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(id, organizationId, projectId, clean.name, input.description.trim(), input.riskLevel, clean.schema);
    writeAudit({ organizationId, actorUserId: userId, action: "tool.created", resourceType: "tool", resourceId: id });
    return id;
  });
}

export function updateTool(userId: string, organizationId: string, toolId: string, input: ToolDetails, status: string) {
  transaction(() => {
    authorize(userId, organizationId, true);
    const tool = toolForOrg(organizationId, toolId);
    if (!["active", "disabled"].includes(status)) throw new ToolInputError("Choose a valid tool status.");
    const clean = details(organizationId, tool.project_id, input, toolId);
    getDb().prepare(`UPDATE tools SET name = ?, description = ?, risk_level = ?, input_schema_json = ?,
      status = ?, updated_at = datetime('now') WHERE organization_id = ? AND id = ?`)
      .run(clean.name, input.description.trim(), input.riskLevel, clean.schema, status, organizationId, toolId);
    writeAudit({ organizationId, actorUserId: userId, action: "tool.updated", resourceType: "tool", resourceId: toolId });
  });
}

export function testToolInput(userId: string, organizationId: string, toolId: string, input: string) {
  authorize(userId, organizationId);
  const tool = toolForOrg(organizationId, toolId);
  // Testing a disabled definition is useful when preparing it for re-enablement.
  // This checks only the schema: it neither executes a tool nor authorizes a call.
  return validateToolInput(tool.input_schema_json, input);
}
