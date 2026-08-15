import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { mkdirSync } from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "fs";

const globalForDb = globalThis as unknown as {
  __sentinelDb?: DatabaseSync;
};

function dataDir() {
  const dir = process.env.SENTINEL_DATA_DIR
    ? path.resolve(process.env.SENTINEL_DATA_DIR)
    : path.join(process.cwd(), ".data");
  mkdirSync(dir, { recursive: true });
  return dir;
}

function migrationsDir() {
  // apps/web -> repo root migrations/
  return path.join(process.cwd(), "..", "..", "migrations");
}

function applyMigrations(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const files = ["0000_init.sql", "0001_saas_foundation.sql"];
  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    const existing = db
      .prepare("SELECT version FROM schema_migrations WHERE version = ?")
      .get(version) as { version: string } | undefined;
    if (existing) continue;

    const sql = readFileSync(path.join(migrationsDir(), file), "utf8");
    db.exec(sql);
    db.prepare(
      "INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)",
    ).run(version);
  }
}

export function getDb(): DatabaseSync {
  if (globalForDb.__sentinelDb) {
    return globalForDb.__sentinelDb;
  }

  const dbPath = path.join(dataDir(), "sentinel.sqlite");
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");
  applyMigrations(db);
  globalForDb.__sentinelDb = db;
  return db;
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const computed = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (computed.length !== expected.length) return false;
  return timingSafeEqual(computed, expected);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "org";
}
