"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const EVENTS = [
  { t: "14:02:11", agent: "SupportBot", action: "issue_refund", result: "APPROVAL", tone: "warn" as const },
  { t: "14:02:09", agent: "ResearchBot", action: "external_request", result: "BLOCKED", tone: "danger" as const },
  { t: "14:01:58", agent: "OpsAgent", action: "query_db", result: "ALLOWED", tone: "ok" as const },
  { t: "14:01:44", agent: "SupportBot", action: "send_email", result: "ALLOWED", tone: "ok" as const },
  { t: "14:01:31", agent: "BillingBot", action: "issue_refund", result: "DENIED", tone: "danger" as const },
  { t: "14:01:12", agent: "ResearchBot", action: "web_fetch", result: "ALLOWED", tone: "ok" as const },
  { t: "14:00:57", agent: "SupportBot", action: "create_ticket", result: "ALLOWED", tone: "ok" as const },
  { t: "14:00:41", agent: "DeployBot", action: "shell_exec", result: "APPROVAL", tone: "warn" as const },
];

export function LiveEventTicker({ className }: { className?: string }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => setOffset((n) => (n + 1) % EVENTS.length), 1800);
    return () => window.clearInterval(id);
  }, []);

  const visible = [...EVENTS, ...EVENTS].slice(offset, offset + 4);

  return (
    <div
      className={cn(
        "overflow-hidden border-y border-border bg-surface/80 backdrop-blur-sm",
        className,
      )}
      aria-label="Sample security event stream"
    >
      <div className="mx-auto flex max-w-7xl items-stretch">
        <div className="flex shrink-0 items-center gap-2 border-r border-border px-4 py-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulse-line" />
          <span className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
            Live feed
          </span>
        </div>
        <div className="flex min-w-0 flex-1 gap-0 overflow-hidden">
          {visible.map((e, idx) => (
            <div
              key={`${e.t}-${e.action}-${idx}`}
              className="flex min-w-0 flex-1 items-center gap-3 border-r border-border px-4 py-2.5 font-mono text-[11px] last:border-r-0"
            >
              <span className="shrink-0 text-muted">{e.t}</span>
              <span className="truncate text-foreground/80">{e.agent}</span>
              <span className="hidden truncate text-muted sm:inline">{e.action}</span>
              <span
                className={cn(
                  "ml-auto shrink-0 tracking-wide",
                  e.tone === "ok" && "text-ok",
                  e.tone === "warn" && "text-warn",
                  e.tone === "danger" && "text-danger",
                )}
              >
                {e.result}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
