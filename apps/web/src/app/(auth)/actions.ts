"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { registerAccount } from "@/lib/account-registration";
import { getDb, verifyPassword } from "@/lib/db";
import { writeAudit } from "@/lib/orgs";

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

  let userId: string;
  try {
    const result = registerAccount(parsed.data);
    if (result.kind === "email_exists") {
      return { error: "An account with that email already exists." };
    }
    userId = result.userId;
  } catch {
    return { error: "Account creation is temporarily unavailable. Please try again." };
  }

  try {
    await createSession(userId);
  } catch {
    return { error: "Your account was created, but sign-in is temporarily unavailable. Please try the sign-in page." };
  }
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

  try {
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
  } catch {
    return { error: "Sign-in is temporarily unavailable. Please try again." };
  }
  redirect("/app");
}

export async function logoutAction() {
  const user = await getCurrentUser();
  try {
    if (user) {
      writeAudit({
        actorUserId: user.id,
        action: "user.logout",
        resourceType: "user",
        resourceId: user.id,
      });
    }
  } catch {
    // An unavailable audit store must not keep the browser signed in.
  }
  await destroySession();
  redirect("/");
}
