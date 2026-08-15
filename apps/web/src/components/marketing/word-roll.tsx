"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const WORDS = ["refunds", "exports", "emails", "API calls", "DB writes"];

/** Rotating capability word — agentic landing pattern without fake metrics. */
export function WordRoll({ className }: { className?: string }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % WORDS.length), 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span
      className={cn(
        "relative inline-flex h-[1.15em] min-w-[7.5ch] overflow-hidden align-bottom",
        className,
      )}
      aria-live="polite"
    >
      <span
        key={WORDS[i]}
        className="absolute inset-0 animate-word-roll bg-gradient-to-r from-accent to-[#7eb6ff] bg-clip-text font-semibold text-transparent"
      >
        {WORDS[i]}
      </span>
    </span>
  );
}
