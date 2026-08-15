"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TextShimmer } from "@/components/marketing/text-shimmer";

const LINES = [
  { kind: "ok" as const, text: "policy engine online" },
  { kind: "event" as const, text: "SupportBot  issue_refund  → APPROVAL" },
  { kind: "event" as const, text: "ResearchBot external_request → BLOCKED" },
  { kind: "event" as const, text: "OpsAgent    query_db         → ALLOWED" },
  { kind: "dim" as const, text: "policies run before tools execute" },
];

/** Decorative auth-side terminal — not connected to the agent runtime. */
export function AuthGatePanel({ className }: { className?: string }) {
  const [visible, setVisible] = useState(1);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(LINES.length);
      setBlink(false);
      return;
    }
    const id = window.setInterval(() => {
      setVisible((n) => (n < LINES.length ? n + 1 : n));
    }, 420);
    const blinkId = window.setInterval(() => setBlink((b) => !b), 530);
    return () => {
      window.clearInterval(id);
      window.clearInterval(blinkId);
    };
  }, []);

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden border border-border bg-[#05070a]",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 20% 0%, rgba(61,139,253,0.2), transparent 55%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "auto, 28px 28px, 28px 28px",
        }}
        aria-hidden
      />

      <div className="relative flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-ok" />
          <span className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            Live decisions
          </span>
        </div>
      </div>

      <div className="relative flex-1 space-y-1.5 overflow-hidden p-4 font-mono text-[12px] leading-relaxed sm:text-[13px]">
        {LINES.slice(0, visible).map((line, i) => (
          <div
            key={`${line.text}-${i}`}
            className={cn(
              "animate-fade-up",
              line.kind === "ok" && "text-ok",
              line.kind === "dim" && "text-muted",
              line.kind === "event" && "text-foreground/85",
            )}
          >
            <span className="mr-2 text-muted select-none">›</span>
            {line.text}
          </div>
        ))}
        {visible >= LINES.length ? (
          <div className="flex items-center gap-2 pt-1 text-muted">
            <span className="select-none">›</span>
            <TextShimmer>awaiting sign-in</TextShimmer>
            <span
              className={cn(
                "inline-block h-3.5 w-1.5 bg-accent",
                blink ? "opacity-100" : "opacity-0",
              )}
              aria-hidden
            />
          </div>
        ) : null}
      </div>

      <div className="relative grid grid-cols-3 gap-px border-t border-border bg-border">
        {[
          { k: "policies", v: "on" },
          { k: "approvals", v: "on" },
          { k: "audit", v: "on" },
        ].map((cell) => (
          <div key={cell.k} className="bg-[#07090c] px-3 py-2.5">
            <div className="font-mono text-[9px] tracking-wider text-muted uppercase">
              {cell.k}
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-ok">{cell.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
