"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { AgentInputError, createAgent, updateAgent, issueApiKey, revokeApiKey } from "@/lib/agents";

export type AgentFormState = { error?: string; message?: string; token?: string };

export async function agentAction(_previous: AgentFormState, form: FormData): Promise<AgentFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };
  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : "";
  };
  const orgId = field("organizationId");
  let token: string | undefined;
  try {
    switch (field("operation")) {
      case "create":
        createAgent(user.id, orgId, field("projectId"), field("name"), field("description"));
        break;
      case "update":
        updateAgent(user.id, orgId, field("agentId"), field("name"), field("description"), field("status"));
        break;
      case "issue":
        token = issueApiKey(user.id, orgId, field("agentId"), field("name"), Number(field("days")), field("rotateKeyId") || undefined).token;
        break;
      case "revoke":
        revokeApiKey(user.id, orgId, field("keyId"));
        break;
      default:
        return { error: "Unknown operation." };
    }
  } catch (error) {
    if (error instanceof AgentInputError) return { error: error.message };
    return { error: "Could not save changes. Please try again." };
  }
  revalidatePath("/app", "layout");
  return { message: "Changes saved.", ...(token ? { token } : {}) };
}
