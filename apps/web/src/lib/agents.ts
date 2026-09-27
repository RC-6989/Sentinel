import { randomBytes } from "crypto";
import { getDb, hashToken, newId } from "./db";
import { getOrganizationForUser, writeAudit } from "./orgs";

export class AgentInputError extends Error {}

export type Agent = {
  id: string; organization_id: string; project_id: string; name: string;
  description: string; status: "active" | "paused"; created_at: string;
  project_name: string; environment: string;
};
export type ApiKey = {
  id: string; agent_id: string; name: string; token_prefix: string;
  expires_at: string; revoked_at: string | null; created_at: string;
};

function authorize(userId: string, organizationId: string, write = false) {
  const org = getOrganizationForUser(userId, organizationId);
  if (!org || (write && !["owner", "admin"].includes(org.role))) {
    throw new AgentInputError("You do not have permission to manage this organization.");
  }
}

function nameValue(value: string) {
  const name = value.trim();
  if (!name || name.length > 80) throw new AgentInputError("Name must be 1–80 characters.");
  return name;
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

function agentForOrg(organizationId: string, agentId: string) {
  const row = getDb().prepare("SELECT id, status FROM agents WHERE organization_id = ? AND id = ?")
    .get(organizationId, agentId) as { id: string; status: string } | undefined;
  if (!row) throw new AgentInputError("Agent not found.");
  return row;
}

export function listAgents(userId: string, organizationId: string): Agent[] {
  authorize(userId, organizationId);
  const rows = getDb().prepare(`SELECT a.*, p.name AS project_name, p.environment
    FROM agents a JOIN projects p ON p.id = a.project_id AND p.organization_id = a.organization_id
    WHERE a.organization_id = ? ORDER BY a.created_at DESC, a.id`).all(organizationId) as Agent[];
  return rows.map(row => ({ ...row }));
}

export function listApiKeys(userId: string, organizationId: string): ApiKey[] {
  authorize(userId, organizationId);
  const rows = getDb().prepare(`SELECT id, agent_id, name, token_prefix, expires_at, revoked_at, created_at
    FROM api_keys WHERE organization_id = ? ORDER BY created_at DESC, id`).all(organizationId) as ApiKey[];
  return rows.map(row => ({ ...row }));
}

export function createAgent(userId: string, organizationId: string, projectId: string, name: string, description: string) {
  return transaction(() => {
    authorize(userId, organizationId, true);
    const cleanName = nameValue(name);
    if (description.length > 500) throw new AgentInputError("Description must be at most 500 characters.");
    if (!getDb().prepare("SELECT id FROM projects WHERE organization_id = ? AND id = ?").get(organizationId, projectId)) {
      throw new AgentInputError("Project not found.");
    }
    const id = newId("agt");
    getDb().prepare("INSERT INTO agents (id, organization_id, project_id, name, description) VALUES (?, ?, ?, ?, ?)")
      .run(id, organizationId, projectId, cleanName, description.trim());
    writeAudit({ organizationId, actorUserId: userId, action: "agent.created", resourceType: "agent", resourceId: id });
    return id;
  });
}

export function updateAgent(userId: string, organizationId: string, agentId: string, name: string, description: string, status: string) {
  transaction(() => {
    authorize(userId, organizationId, true);
    agentForOrg(organizationId, agentId);
    const cleanName = nameValue(name);
    if (description.length > 500 || !["active", "paused"].includes(status)) throw new AgentInputError("Invalid agent details.");
    getDb().prepare("UPDATE agents SET name = ?, description = ?, status = ?, updated_at = datetime('now') WHERE organization_id = ? AND id = ?")
      .run(cleanName, description.trim(), status, organizationId, agentId);
    writeAudit({ organizationId, actorUserId: userId, action: "agent.updated", resourceType: "agent", resourceId: agentId, metadata: { status } });
  });
}

export function issueApiKey(userId: string, organizationId: string, agentId: string, name: string, days: number, rotateKeyId?: string) {
  return transaction(() => {
    authorize(userId, organizationId, true);
    const agent = agentForOrg(organizationId, agentId);
    if (agent.status !== "active") throw new AgentInputError("Resume the agent before issuing a key.");
    const cleanName = nameValue(name);
    if (![7, 30, 90].includes(days)) throw new AgentInputError("Choose a 7, 30, or 90 day expiry.");
    const db = getDb();
    if (rotateKeyId) {
      const old = db.prepare("SELECT id FROM api_keys WHERE organization_id = ? AND agent_id = ? AND id = ? AND revoked_at IS NULL")
        .get(organizationId, agentId, rotateKeyId);
      if (!old) throw new AgentInputError("Key not found or already revoked.");
      db.prepare("UPDATE api_keys SET revoked_at = ? WHERE organization_id = ? AND id = ?")
        .run(new Date().toISOString(), organizationId, rotateKeyId);
    }
    const id = newId("key");
    const token = `snt_${randomBytes(32).toString("hex")}`;
    const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
    db.prepare(`INSERT INTO api_keys (id, organization_id, agent_id, name, token_hash, token_prefix, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, organizationId, agentId, cleanName, hashToken(token), token.slice(0, 12), expiresAt);
    writeAudit({ organizationId, actorUserId: userId, action: rotateKeyId ? "api_key.rotated" : "api_key.created", resourceType: "api_key", resourceId: id,
      metadata: { agentId, expiresAt, ...(rotateKeyId ? { replacedKeyId: rotateKeyId } : {}) } });
    return { id, token, expiresAt };
  });
}

export function revokeApiKey(userId: string, organizationId: string, keyId: string) {
  transaction(() => {
    authorize(userId, organizationId, true);
    const key = getDb().prepare("SELECT id, revoked_at FROM api_keys WHERE organization_id = ? AND id = ?")
      .get(organizationId, keyId) as { id: string; revoked_at: string | null } | undefined;
    if (!key) throw new AgentInputError("Key not found.");
    if (key.revoked_at) return;
    getDb().prepare("UPDATE api_keys SET revoked_at = ? WHERE organization_id = ? AND id = ?")
      .run(new Date().toISOString(), organizationId, keyId);
    writeAudit({ organizationId, actorUserId: userId, action: "api_key.revoked", resourceType: "api_key", resourceId: keyId });
  });
}

/** Resolve identity only; tool authorization belongs to the future gateway. */
export function authenticateApiKey(token: string) {
  if (!/^snt_[a-f0-9]{64}$/.test(token)) return null;
  const row = getDb().prepare(`SELECT k.id AS keyId, k.organization_id AS organizationId,
      k.agent_id AS agentId, a.project_id AS projectId
    FROM api_keys k JOIN agents a ON a.id = k.agent_id AND a.organization_id = k.organization_id
    WHERE k.token_hash = ? AND k.revoked_at IS NULL AND k.expires_at > ? AND a.status = 'active'`)
    .get(hashToken(token), new Date().toISOString()) as
      { keyId: string; organizationId: string; agentId: string; projectId: string } | undefined;
  return row ?? null;
}
