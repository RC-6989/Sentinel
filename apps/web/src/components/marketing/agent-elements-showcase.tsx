"use client";

import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextShimmer } from "@/components/marketing/text-shimmer";

/**
 * Marketing demos styled after 21st.dev Agent Elements tool cards.
 * Decorative only — not wired to any agent runtime.
 */
export function AgentElementsShowcase() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <ApprovalToolCard />
      <PlanToolCard />
      <BashBlockedCard />
    </div>
  );
}

function ToolChrome({
  tool,
  status,
  children,
  className,
}: {
  tool: string;
  status: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-colors hover:border-[#2a3340]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-raised/80 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
            Tool
          </span>
          <span className="truncate font-mono text-xs text-foreground">{tool}</span>
        </div>
        <div className="shrink-0 font-mono text-[10px]">{status}</div>
      </div>
      <div className="flex flex-1 flex-col p-3">{children}</div>
    </div>
  );
}

function ApprovalToolCard() {
  return (
    <ToolChrome
      tool="issue_refund"
      status={<span className="text-warn">approval</span>}
    >
      <dl className="space-y-2 font-mono text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">amount</dt>
          <dd>$129.00</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">policy</dt>
          <dd>refund-01</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">risk</dt>
          <dd className="text-warn">78 HIGH</dd>
        </div>
      </dl>
      <div className="mt-auto flex gap-2 pt-4">
        <span className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-ok/40 bg-ok/10 py-2 font-mono text-[11px] text-ok">
          <Check className="h-3.5 w-3.5" aria-hidden />
          Approve
        </span>
        <span className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-danger/40 bg-danger/10 py-2 font-mono text-[11px] text-danger">
          <X className="h-3.5 w-3.5" aria-hidden />
          Deny
        </span>
      </div>
    </ToolChrome>
  );
}

function PlanToolCard() {
  const steps = [
    { done: true, label: "Check eligibility" },
    { done: false, label: "Call issue_refund" },
    { done: false, label: "Email customer" },
  ];
  return (
    <ToolChrome
      tool="plan"
      status={<TextShimmer className="text-[10px]">awaiting</TextShimmer>}
    >
      <p className="text-sm font-medium tracking-tight">Ticket #4821</p>
      <p className="mt-1 text-xs text-muted">3 steps before side effects</p>
      <ol className="mt-3 space-y-2">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-start gap-2 font-mono text-xs">
            <span
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px]",
                s.done ? "border-ok/50 text-ok" : "border-border text-muted",
              )}
            >
              {s.done ? "✓" : i + 1}
            </span>
            <span className={s.done ? "text-muted line-through" : ""}>
              {s.label}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-auto flex gap-2 pt-4">
        <span className="inline-flex flex-1 items-center justify-center rounded-md bg-accent py-2 font-mono text-[11px] text-white">
          Accept
        </span>
        <span className="inline-flex flex-1 items-center justify-center rounded-md border border-border py-2 font-mono text-[11px] text-muted">
          Redirect
        </span>
      </div>
    </ToolChrome>
  );
}

function BashBlockedCard() {
  return (
    <ToolChrome
      tool="external_request"
      status={<span className="text-danger">blocked</span>}
    >
      <div className="rounded-md border border-border bg-[#07090c] p-3 font-mono text-[11px] leading-relaxed">
        <div className="text-muted">$ curl … /export</div>
        <div className="mt-1 text-foreground">customer_db.csv</div>
        <div className="mt-3 border-t border-border pt-2 text-danger">
          ✕ exfil-deny-01 · risk 91
        </div>
      </div>
      <p className="mt-auto pt-3 text-xs text-muted">
        Never streamed. Logged for audit.
      </p>
    </ToolChrome>
  );
}
