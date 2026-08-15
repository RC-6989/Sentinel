"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const WORDS = ["refunds", "exports", "emails", "API calls", "DB writes"];

export function WordRoll({ className }: { className?: string }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(
      () => setI((n) => (n + 1) % WORDS.length),
      2800,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <span
      key={WORDS[i]}
      className={cn("animate-word-roll text-accent", className)}
      aria-live="polite"
    >
      {WORDS[i]}
    </span>
  );
}
