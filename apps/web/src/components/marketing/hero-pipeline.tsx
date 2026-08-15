"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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

export function HeroPipeline() {
  const [index, setIndex] = useState(0);
  const scene = SCENES[index]!;

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SCENES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-[#0a0c10] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
      aria-live="polite"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-mono text-[11px] tracking-wide text-muted uppercase">
          Sentinel pipeline
        </span>
        <span className="font-mono text-[11px] text-muted">live preview</span>
      </div>

      <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3 border-b border-border p-4 md:border-r md:border-b-0">
          <FlowStep label="AGENT" value={scene.agent} active />
          <Connector />
          <FlowStep label="TOOL CALL" value={`${scene.tool}  ${scene.detail}`} active />
          <Connector />
          <FlowStep label="SENTINEL" value="policy · risk · security" active highlight />
          <Connector />
          <div className="grid grid-cols-3 gap-2">
            <Mini label="POLICY" active={["policy", "risk", "decision", "approved", "blocked"].includes(scene.stage)} />
            <Mini label="RISK" active={["risk", "decision", "approved", "blocked"].includes(scene.stage)} />
            <Mini label="SECURITY" active={["decision", "approved", "blocked"].includes(scene.stage)} />
          </div>
        </div>

        <div className="space-y-3 p-4 font-mono text-xs">
          <Row k="Policy" v={scene.policy} />
          <Row k="Risk" v={scene.risk} tone={scene.risk.includes("HIGH") || scene.risk.includes("CRITICAL") ? "warn" : "muted"} />
          <Row
            k="Decision"
            v={scene.decision}
            tone={
              scene.stage === "blocked"
                ? "danger"
                : scene.stage === "approved"
                  ? "ok"
                  : scene.decision.includes("APPROVAL") || scene.decision.includes("WAITING")
                    ? "warn"
                    : "muted"
            }
          />
          <div
            className={cn(
              "mt-4 rounded-md border px-3 py-2 text-[11px]",
              scene.stage === "blocked" && "border-[#f85149]/40 text-[#f85149]",
              scene.stage === "approved" && "border-[#3dd68c]/40 text-[#3dd68c]",
              (scene.stage === "decision" || scene.stage === "risk") &&
                "border-[#d29922]/40 text-[#e3b341]",
              !["blocked", "approved", "decision", "risk"].includes(scene.stage) &&
                "border-border text-muted",
            )}
          >
            {scene.stage === "approved" && "✓ Approved — tool executed"}
            {scene.stage === "blocked" && "✕ Unauthorized action blocked"}
            {(scene.stage === "decision" || scene.stage === "risk") &&
              "Human approval required"}
            {(scene.stage === "tool_call" || scene.stage === "policy") &&
              "Intercepting tool call…"}
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
        "rounded-md border px-3 py-2 transition-colors",
        active ? "border-border bg-[#0d1117]" : "border-transparent opacity-50",
        highlight && "border-accent/40",
      )}
    >
      <div className="font-mono text-[10px] tracking-wider text-muted">{label}</div>
      <div className="mt-0.5 font-mono text-xs text-foreground">{value}</div>
    </div>
  );
}

function Mini({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={cn(
        "rounded border px-2 py-2 text-center font-mono text-[10px] tracking-wide",
        active ? "border-accent/50 text-foreground" : "border-border text-muted",
      )}
    >
      {label}
    </div>
  );
}

function Connector() {
  return <div className="mx-4 h-3 w-px bg-border" aria-hidden />;
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
          "text-right",
          tone === "muted" && "text-foreground",
          tone === "warn" && "text-[#e3b341]",
          tone === "danger" && "text-[#f85149]",
          tone === "ok" && "text-[#3dd68c]",
        )}
      >
        {v}
      </span>
    </div>
  );
}
