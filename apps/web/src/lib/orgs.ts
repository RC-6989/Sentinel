import { getDb, newId, slugify } from "./db";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

export type Project = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  environment: string;
};

export function listOrganizationsForUser(userId: string): Organization[] {
  const rows = getDb()
    .prepare(
      `SELECT o.id, o.name, o.slug, m.role
       FROM organizations o
       JOIN organization_members m ON m.organization_id = o.id
       WHERE m.user_id = ?
       ORDER BY o.created_at ASC`,
    )
    .all(userId) as Organization[];
  return rows;
}

export function getOrganizationForUser(
  userId: string,
  orgId: string,
): Organization | null {
  const row = getDb()
    .prepare(
      `SELECT o.id, o.name, o.slug, m.role
       FROM organizations o
       JOIN organization_members m ON m.organization_id = o.id
       WHERE m.user_id = ? AND o.id = ?`,
    )
    .get(userId, orgId) as Organization | undefined;
  return row ?? null;
}

export function createOrganization(
  userId: string,
  name: string,
): Organization {
  const db = getDb();
  const id = newId("org");
  let slug = slugify(name);
  const clash = db
    .prepare("SELECT id FROM organizations WHERE slug = ?")
    .get(slug);
  if (clash) {
    slug = `${slug}-${id.slice(-6)}`;
  }

  const memberId = newId("mem");
  const projectId = newId("prj");

  db.exec("BEGIN");
  try {
    db.prepare(
      `INSERT INTO organizations (id, name, slug) VALUES (?, ?, ?)`,
    ).run(id, name, slug);
    db.prepare(
      `INSERT INTO organization_members (id, organization_id, user_id, role)
       VALUES (?, ?, ?, 'owner')`,
    ).run(memberId, id, userId);
    db.prepare(
      `INSERT INTO projects (id, organization_id, name, slug, environment)
       VALUES (?, ?, 'Default', 'default', 'development')`,
    ).run(projectId, id);
    db.prepare(
      `INSERT INTO audit_logs (id, organization_id, actor_user_id, action, resource_type, resource_id)
       VALUES (?, ?, ?, 'organization.created', 'organization', ?)`,
    ).run(newId("aud"), id, userId, id);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }

  return { id, name, slug, role: "owner" };
}

export function listProjects(organizationId: string): Project[] {
  return getDb()
    .prepare(
      `SELECT id, organization_id, name, slug, environment
       FROM projects WHERE organization_id = ?
       ORDER BY created_at ASC`,
    )
    .all(organizationId) as Project[];
}

export function createProject(
  organizationId: string,
  userId: string,
  name: string,
  environment: "development" | "staging" | "production" = "development",
): Project {
  const db = getDb();
  const id = newId("prj");
  let slug = slugify(name);
  const clash = db
    .prepare(
      `SELECT id FROM projects WHERE organization_id = ? AND slug = ?`,
    )
    .get(organizationId, slug);
  if (clash) {
    slug = `${slug}-${id.slice(-6)}`;
  }

  db.prepare(
    `INSERT INTO projects (id, organization_id, name, slug, environment)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, organizationId, name, slug, environment);

  db.prepare(
    `INSERT INTO audit_logs (id, organization_id, actor_user_id, action, resource_type, resource_id)
     VALUES (?, ?, ?, 'project.created', 'project', ?)`,
  ).run(newId("aud"), organizationId, userId, id);

  return { id, organization_id: organizationId, name, slug, environment };
}

export function writeAudit(params: {
  organizationId?: string | null;
  actorUserId?: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}) {
  getDb()
    .prepare(
      `INSERT INTO audit_logs
        (id, organization_id, actor_user_id, action, resource_type, resource_id, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      newId("aud"),
      params.organizationId ?? null,
      params.actorUserId ?? null,
      params.action,
      params.resourceType ?? null,
      params.resourceId ?? null,
      params.metadata ? JSON.stringify(params.metadata) : null,
    );
}
