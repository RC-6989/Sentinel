"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  createOrganization,
  createProject,
  getOrganizationForUser,
} from "@/lib/orgs";

export type FormState = { error?: string };

export async function createOrgAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const name = z.string().trim().min(1).max(80).safeParse(formData.get("name"));
  if (!name.success) return { error: "Organization name is required." };

  const org = createOrganization(user.id, name.data);
  redirect(`/app?org=${org.id}`);
}

export async function createProjectAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const schema = z.object({
    organizationId: z.string().min(1),
    name: z.string().trim().min(1).max(80),
    environment: z.enum(["development", "staging", "production"]),
  });

  const parsed = schema.safeParse({
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    environment: formData.get("environment") || "development",
  });
  if (!parsed.success) return { error: "Invalid project details." };

  const org = getOrganizationForUser(user.id, parsed.data.organizationId);
  if (!org) return { error: "Organization not found." };

  createProject(
    org.id,
    user.id,
    parsed.data.name,
    parsed.data.environment,
  );
  redirect(`/app/settings?org=${org.id}`);
}
