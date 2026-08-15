"use server";

import { joinWaitlist } from "@/lib/waitlist";

export type WaitlistActionState = {
  ok?: boolean;
  error?: string;
};

export async function waitlistAction(
  _prev: WaitlistActionState,
  formData: FormData,
): Promise<WaitlistActionState> {
  const email = String(formData.get("email") ?? "");
  const result = await joinWaitlist(email);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}
