"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { getDb, hashPassword, newId, verifyPassword } from "@/lib/db";
import { createOrganization, writeAudit } from "@/lib/orgs";

const signupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  organizationName: z.string().trim().min(1).max(80),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export type AuthActionState = {
  error?: string;
  ok?: boolean;
};

export async function signupAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    organizationName: formData.get("organizationName"),
  });

  if (!parsed.success) {
    return { error: "Check your details and try again." };
  }

  const { name, email, password, organizationName } = parsed.data;
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email.toLowerCase());
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const userId = newId("usr");
  db.prepare(
    `INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)`,
  ).run(userId, email.toLowerCase(), hashPassword(password), name);

  createOrganization(userId, organizationName);
  writeAudit({
    actorUserId: userId,
    action: "user.signup",
    resourceType: "user",
    resourceId: userId,
  });

  await createSession(userId);
  redirect("/app");
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const row = getDb()
    .prepare(`SELECT id, password_hash FROM users WHERE email = ?`)
    .get(parsed.data.email.toLowerCase()) as
    | { id: string; password_hash: string }
    | undefined;

  if (!row || !verifyPassword(parsed.data.password, row.password_hash)) {
    return { error: "Invalid email or password." };
  }

  writeAudit({
    actorUserId: row.id,
    action: "user.login",
    resourceType: "user",
    resourceId: row.id,
  });

  await createSession(row.id);
  redirect("/app");
}

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) {
    writeAudit({
      actorUserId: user.id,
      action: "user.logout",
      resourceType: "user",
      resourceId: user.id,
    });
  }
  await destroySession();
  redirect("/");
}
