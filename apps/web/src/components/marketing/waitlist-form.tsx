"use client";

import { useActionState, useId } from "react";
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
  const emailId = useId();
  const errorId = `${emailId}-error`;

  if (state.ok) {
    return (
      <p
        className={cn(
          "rounded-md border border-ok/40 bg-ok/10 px-3 py-2.5 text-sm text-ok",
          className,
        )}
        role="status"
      >
        You’re on the waitlist. Your email has been saved for early-access updates.
      </p>
    );
  }

  return (
    <form action={action} className={cn("w-full", className)} aria-busy={pending}>
      <label htmlFor={emailId} className="mb-2 block text-sm font-medium">Email address</label>
      <div
        className={cn(
          "flex w-full flex-col gap-2 sm:flex-row sm:items-stretch",
          size === "lg" && "sm:max-w-md",
        )}
      >
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          maxLength={254}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errorId : undefined}
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
        <p id={errorId} className="mt-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
