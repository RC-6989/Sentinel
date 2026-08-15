"use client";

import { useActionState } from "react";
import {
  waitlistAction,
  type WaitlistActionState,
} from "@/app/(marketing)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const initial: WaitlistActionState = {};

export function WaitlistForm({
  className,
  size = "md",
}: {
  className?: string;
  size?: "md" | "lg";
}) {
  const [state, action, pending] = useActionState(waitlistAction, initial);

  if (state.ok) {
    return (
      <p
        className={cn(
          "rounded-md border border-ok/40 bg-ok/10 px-3 py-2.5 text-sm text-ok",
          className,
        )}
        role="status"
      >
        You are on the list. We will email you when access opens.
      </p>
    );
  }

  return (
    <form action={action} className={cn("w-full", className)}>
      <div
        className={cn(
          "flex w-full flex-col gap-2 sm:flex-row sm:items-stretch",
          size === "lg" && "sm:max-w-md",
        )}
      >
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          aria-label="Email"
          className={cn(size === "lg" && "h-11")}
        />
        <Button
          type="submit"
          size={size === "lg" ? "lg" : "md"}
          disabled={pending}
          className="shrink-0 sm:px-5"
        >
          {pending ? "Joining…" : "Join the waitlist"}
        </Button>
      </div>
      {state.error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
