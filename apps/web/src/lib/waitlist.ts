import { z } from "zod";
import { getDb, newId } from "./db";

const emailSchema = z.string().trim().email().max(254);

export type WaitlistResult =
  | { ok: true }
  | { ok: false; error: string };

function ensureWaitlistTable() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS waitlist_signups (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

export async function joinWaitlist(rawEmail: string): Promise<WaitlistResult> {
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const email = parsed.data.toLowerCase();

  const webhook = process.env.WAITLIST_WEBHOOK_URL?.trim();

  // Production / Vercel: prefer webhook so signups persist off the ephemeral FS.
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          source: "sentinel-landing",
          submittedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        return { ok: false, error: "Could not join the waitlist. Try again." };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not join the waitlist. Try again." };
    }
  }

  if (process.env.VERCEL) {
    return {
      ok: false,
      error: "The waitlist is temporarily unavailable. Please try again later.",
    };
  }

  // Local / non-Vercel: persist to SQLite.
  try {
    const db = ensureWaitlistTable();
    // Only duplicate email addresses count as an existing successful signup.
    // Other storage errors must reach the error state shown by the form.
    db.prepare(
      "INSERT INTO waitlist_signups (id, email) VALUES (?, ?) ON CONFLICT(email) DO NOTHING",
    ).run(newId("wl"), email);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save your email. Try again." };
  }
}
