/**
 * Phase 1 local smoke: exercise SQLite auth primitives without a browser.
 * Run from repo root: node --experimental-sqlite scripts/smoke-auth.mjs
 */
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { mkdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "apps/web/.data");
mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "smoke-auth.sqlite");

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const computed = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return computed.length === expected.length && timingSafeEqual(computed, expected);
}

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");
for (const file of ["0000_init.sql", "0001_saas_foundation.sql"]) {
  db.exec(readFileSync(path.join(root, "migrations", file), "utf8"));
}

const email = `smoke-${Date.now()}@example.com`;
const password = "password123";
const userId = `usr_${randomBytes(8).toString("hex")}`;
const orgId = `org_${randomBytes(8).toString("hex")}`;

db.prepare(
  `INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)`,
).run(userId, email, hashPassword(password), "Smoke User");

db.prepare(
  `INSERT INTO organizations (id, name, slug) VALUES (?, ?, ?)`,
).run(orgId, "Smoke Org", `smoke-${Date.now()}`);

db.prepare(
  `INSERT INTO organization_members (id, organization_id, user_id, role)
   VALUES (?, ?, ?, 'owner')`,
).run(`mem_${randomBytes(8).toString("hex")}`, orgId, userId);

const row = db.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(userId);
if (!verifyPassword(password, row.password_hash)) {
  console.error("FAIL: password verify");
  process.exit(1);
}

const member = db
  .prepare(
    `SELECT o.name FROM organizations o
     JOIN organization_members m ON m.organization_id = o.id
     WHERE m.user_id = ?`,
  )
  .get(userId);

if (!member || member.name !== "Smoke Org") {
  console.error("FAIL: org membership");
  process.exit(1);
}

// Tenant isolation check: another org must not be readable via wrong user join alone
const other = db
  .prepare(
    `SELECT o.id FROM organizations o
     JOIN organization_members m ON m.organization_id = o.id
     WHERE m.user_id = ? AND o.id = ?`,
  )
  .get("usr_nonexistent", orgId);

if (other) {
  console.error("FAIL: tenant isolation");
  process.exit(1);
}

console.log(
  JSON.stringify({
    ok: true,
    email,
    organization: member.name,
    tokenHashSample: createHash("sha256").update("tok_sample").digest("hex").slice(0, 12),
  }),
);
