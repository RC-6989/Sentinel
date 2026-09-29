"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createPolicy, updatePolicy, PolicyInputError } from "@/lib/policies";

export type PolicyFormState = { error?: string; message?: string };

export async function policyAction(_previous: PolicyFormState, form: FormData): Promise<PolicyFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };
  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : "";
  };
  try {
    switch (field("operation")) {
      case "create":
        createPolicy(user.id, field("organizationId"), field("projectId"), field("name"), field("rulesJson"));
        break;
      case "update":
        updatePolicy(user.id, field("organizationId"), field("policyId"),
          field("name"), field("rulesJson"), field("status"));
        break;
      default: return { error: "Unknown operation." };
    }
  } catch (error) {
    if (error instanceof PolicyInputError) return { error: error.message };
    return { error: "Could not save the policy. Please try again." };
  }
  revalidatePath("/app", "layout");
  return { message: "Policy saved." };
}
