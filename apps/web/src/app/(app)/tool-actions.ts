"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createTool, updateTool, testToolInput, ToolInputError } from "@/lib/tools";
import type { InputValidation } from "@/lib/tool-schema";

export type ToolFormState = { error?: string; message?: string; validation?: InputValidation };

export async function toolAction(_previous: ToolFormState, form: FormData): Promise<ToolFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };
  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : "";
  };
  const orgId = field("organizationId");
  const input = { name: field("name"), description: field("description"), riskLevel: field("riskLevel"), inputSchema: field("inputSchema") };
  try {
    switch (field("operation")) {
      case "create":
        createTool(user.id, orgId, field("projectId"), input);
        break;
      case "update":
        updateTool(user.id, orgId, field("toolId"), input, field("status"));
        break;
      case "test":
        return { validation: testToolInput(user.id, orgId, field("toolId"), field("input")) };
      default:
        return { error: "Unknown operation." };
    }
  } catch (error) {
    if (error instanceof ToolInputError) return { error: error.message };
    return { error: "Could not save changes. Please try again." };
  }
  revalidatePath("/app", "layout");
  return { message: "Tool saved." };
}
