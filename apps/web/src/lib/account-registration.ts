import { getDb, hashPassword, newId } from "./db";
import { createOrganization, writeAudit } from "./orgs";

export type RegistrationResult =
  | { kind: "created"; userId: string }
  | { kind: "email_exists" };

/** Create the user and their first workspace as one durable unit. */
export function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}): RegistrationResult {
  const db = getDb();
  const userId = newId("usr");
  const email = input.email.trim().toLowerCase();
  const passwordHash = hashPassword(input.password);

  db.exec("BEGIN IMMEDIATE");
  try {
    const inserted = db.prepare(
      "INSERT OR IGNORE INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)",
    ).run(userId, email, passwordHash, input.name) as { changes: number };
    if (inserted.changes === 0) {
      db.exec("ROLLBACK");
      return { kind: "email_exists" };
    }

    createOrganization(userId, input.organizationName);
    writeAudit({
      actorUserId: userId,
      action: "user.signup",
      resourceType: "user",
      resourceId: userId,
    });
    db.exec("COMMIT");
    return { kind: "created", userId };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
