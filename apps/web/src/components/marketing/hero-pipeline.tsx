"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TextShimmer } from "@/components/marketing/text-shimmer";

type Stage =
  | "tool_call"
  | "policy"
  | "risk"
  | "decision"
  | "approved"
  | "blocked";

const SCENES: Array<{
  stage: Stage;
  agent: string;
  tool: string;
  detail: string;
  policy: string;
  risk: string;
  decision: string;
}> = [
  {
    stage: "tool_call",
    agent: "SupportBot",
    tool: "issue_refund",
    detail: "$129.00",
    policy: "Evaluating…",
    risk: "—",
    decision: "PENDING",
  },
  {
    stage: "policy",
    agent: "SupportBot",
    tool: "issue_refund",
    detail: "$129.00",
    policy: "Refunds ≥ $50 require approval",
    risk: "Calculating…",
    decision: "PENDING",
  },
  {
    stage: "risk",
    agent: "SupportBot",
    tool: "issue_refund",
    detail: "$129.00",
    policy: "refund-policy-01",
    risk: "78 / HIGH",
    decision: "APPROVAL REQUIRED",
  },
  {
    stage: "decision",
    agent: "SupportBot",
    tool: "issue_refund",
    detail: "$129.00",
    policy: "refund-policy-01",
    risk: "78 / HIGH",
    decision: "WAITING ON HUMAN",
  },
  {
    stage: "approved",
    agent: "SupportBot",
    tool: "issue_refund",
    detail: "$129.00",
    policy: "refund-policy-01",
    risk: "78 / HIGH",
    decision: "APPROVED → EXECUTED",
  },
  {
    stage: "blocked",
    agent: "ResearchBot",
    tool: "external_request",
    detail: "customer_db.csv",
    policy: "exfil-deny-01",
    risk: "91 / CRITICAL",
    decision: "BLOCKED",
  },
];

export function HeroPipeline({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const scene = SCENES[index]!;

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SCENES.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className={cn(
        "relative flex min-h-[22rem] flex-col overflow-hidden rounded-xl border border-border bg-surface sm:min-h-[24rem]",
        className,
      )}
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-[38%] w-px overflow-hidden"
        aria-hidden
      >
        <div className="h-16 w-full bg-gradient-to-b from-transparent via-accent/50 to-transparent animate-scan" />
      </div>

      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulse-line" />
          <span className="font-mono text-[11px] tracking-wide text-muted uppercase">
            Pipeline
          </span>
        </div>
        <span className="font-mono text-[11px] text-muted">
          {scene.stage === "tool_call" || scene.stage === "policy" ? (
            <TextShimmer>intercepting</TextShimmer>
          ) : (
            "preview"
          )}
        </span>
      </div>

      <div className="grid md:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-2.5 border-b border-border p-3.5 sm:p-4 md:border-r md:border-b-0 md:p-4">
          <FlowStep label="AGENT" value={scene.agent} active />
          <Connector />
          <FlowStep
            label="TOOL CALL"
            value={`${scene.tool}  ${scene.detail}`}
            active
          />
          <Connector />
          <FlowStep
            label="SENTINEL"
            value="policy · risk · security"
            active
            highlight
          />
          <Connector />
          <div className="grid grid-cols-3 gap-2">
            <Mini
              label="POLICY"
              active={[
                "policy",
                "risk",
                "decision",
                "approved",
                "blocked",
              ].includes(scene.stage)}
            />
            <Mini
              label="RISK"
              active={["risk", "decision", "approved", "blocked"].includes(
                scene.stage,
              )}
            />
            <Mini
              label="SECURITY"
              active={["decision", "approved", "blocked"].includes(scene.stage)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 p-3.5 font-mono text-xs sm:p-4 md:p-4">
          <Row k="Policy" v={scene.policy} />
          <Row
            k="Risk"
            v={scene.risk}
            tone={
              scene.risk.includes("HIGH") || scene.risk.includes("CRITICAL")
                ? "warn"
                : "muted"
            }
          />
          <Row
            k="Decision"
            v={scene.decision}
            tone={
              scene.stage === "blocked"
                ? "danger"
                : scene.stage === "approved"
                  ? "ok"
                  : scene.decision.includes("APPROVAL") ||
                      scene.decision.includes("WAITING")
                    ? "warn"
                    : "muted"
            }
          />
          <div
            className={cn(
              "rounded-md border px-3 py-2 text-[11px] transition-colors duration-500",
              scene.stage === "blocked" && "border-danger/40 text-danger",
              scene.stage === "approved" && "border-ok/40 text-ok",
              (scene.stage === "decision" || scene.stage === "risk") &&
                "border-warn/40 text-warn",
              !["blocked", "approved", "decision", "risk"].includes(
                scene.stage,
              ) && "border-border text-muted",
            )}
          >
            {scene.stage === "approved" && "✓ Approved — tool executed"}
            {scene.stage === "blocked" && "✕ Unauthorized action blocked"}
            {(scene.stage === "decision" || scene.stage === "risk") &&
              "Human approval required"}
            {(scene.stage === "tool_call" || scene.stage === "policy") && (
              <TextShimmer>Intercepting tool call…</TextShimmer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowStep({
  label,
  value,
  active,
  highlight,
}: {
  label: string;
  value: string;
  active?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 transition-colors duration-300",
        active ? "border-border bg-surface-raised" : "border-transparent opacity-50",
        highlight && "border-accent/40 bg-accent-soft",
      )}
    >
      <div className="font-mono text-[10px] tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-xs text-foreground">{value}</div>
    </div>
  );
}

function Mini({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={cn(
        "rounded border px-2 py-2 text-center font-mono text-[10px] tracking-wide transition-colors duration-300",
        active
          ? "border-accent/50 bg-accent-soft text-foreground"
          : "border-border text-muted",
      )}
    >
      {label}
    </div>
  );
}

function Connector() {
  return (
    <div className="mx-4 h-2.5 w-px bg-border animate-pulse-line" aria-hidden />
  );
}

function Row({
  k,
  v,
  tone = "muted",
}: {
  k: string;
  v: string;
  tone?: "muted" | "warn" | "danger" | "ok";
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted">{k}</span>
      <span
        className={cn(
          "text-right transition-colors duration-300",
          tone === "muted" && "text-foreground",
          tone === "warn" && "text-warn",
          tone === "danger" && "text-danger",
          tone === "ok" && "text-ok",
        )}
      >
        {v}
      </span>
    </div>
  );
}
