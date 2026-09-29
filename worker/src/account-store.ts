/** D1 account persistence for the future hosted API. This module is not routed publicly yet. */

type NewAccount = {
  name: string;
  email: string;
  passwordHash: string;
  organizationName: string;
};

export type StoredUser = { id: string; email: string; name: string };
export type PasswordCredential = StoredUser & { password_hash: string };

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "org";
}

function tokenHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return tokenHex(new Uint8Array(digest));
}

export async function createD1Account(db: D1Database, input: NewAccount): Promise<
  { kind: "created"; user: StoredUser; organizationId: string } | { kind: "email_exists" }
> {
  const userId = newId("usr");
  const organizationId = newId("org");
  const email = input.email.trim().toLowerCase();
  const slug = `${slugify(input.organizationName)}-${organizationId.slice(-8)}`;
  try {
    // D1 batch is a transaction: a failed membership, project, or audit write
    // rolls back the user as well.
    await db.batch([
      db.prepare("INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)")
        .bind(userId, email, input.passwordHash, input.name),
      db.prepare("INSERT INTO organizations (id, name, slug) VALUES (?, ?, ?)")
        .bind(organizationId, input.organizationName, slug),
      db.prepare("INSERT INTO organization_members (id, organization_id, user_id, role) VALUES (?, ?, ?, 'owner')")
        .bind(newId("mem"), organizationId, userId),
      db.prepare("INSERT INTO projects (id, organization_id, name, slug, environment) VALUES (?, ?, 'Default', 'default', 'development')")
        .bind(newId("prj"), organizationId),
      db.prepare("INSERT INTO audit_logs (id, organization_id, actor_user_id, action, resource_type, resource_id) VALUES (?, ?, ?, 'organization.created', 'organization', ?)")
        .bind(newId("aud"), organizationId, userId, organizationId),
      db.prepare("INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id) VALUES (?, ?, 'user.signup', 'user', ?)")
        .bind(newId("aud"), userId, userId),
    ]);
    return { kind: "created", user: { id: userId, email, name: input.name }, organizationId };
  } catch (error) {
    // A preflight SELECT alone is racy. After the transactional INSERT fails,
    // check the unique email index to return a stable duplicate result.
    const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) return { kind: "email_exists" };
    throw error;
  }
}

/** Use only inside the authenticated Worker; never return the hash to a browser. */
export async function findD1Credential(db: D1Database, email: string): Promise<PasswordCredential | null> {
  return db.prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?")
    .bind(email.trim().toLowerCase()).first<PasswordCredential>();
}

export async function createD1Session(db: D1Database, userId: string): Promise<{ token: string; expiresAt: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = tokenHex(bytes);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  await db.prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)")
    .bind(newId("ses"), userId, await hashSessionToken(token), expiresAt).run();
  return { token, expiresAt };
}

export async function getD1SessionUser(db: D1Database, token: string): Promise<StoredUser | null> {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  return db.prepare(`SELECT u.id, u.email, u.name FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?`)
    .bind(await hashSessionToken(token), new Date().toISOString()).first<StoredUser>();
}

export async function deleteD1Session(db: D1Database, token: string): Promise<void> {
  if (!/^[0-9a-f]{64}$/.test(token)) return;
  await db.prepare("DELETE FROM sessions WHERE token_hash = ?")
    .bind(await hashSessionToken(token)).run();
}
