import Link from "next/link";
import { AgentElementsShowcase } from "@/components/marketing/agent-elements-showcase";
import { HeroPipeline } from "@/components/marketing/hero-pipeline";
import { LiveEventTicker } from "@/components/marketing/live-event-ticker";
import { WordRoll } from "@/components/marketing/word-roll";
import { Button } from "@/components/ui/button";

const CAPABILITIES = [
  "policy.evaluate",
  "risk.score",
  "approval.pause",
  "action.block",
  "audit.append",
  "baseline.detect",
  "tool.intercept",
  "human.override",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-sentinel-atmosphere text-foreground">
      <div className="border-b border-border bg-surface/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-1.5 font-mono text-[10px] tracking-wide text-muted sm:px-6">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            Phase 1 live · accounts & org shell
          </span>
          <span className="hidden sm:inline">No paid LLM required</span>
        </div>
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-tight sm:text-xl"
        >
          Sentinel
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="#governance"
            className="hidden text-sm text-muted transition-colors hover:text-foreground sm:inline"
          >
            Governance
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link href="/signup">
            <Button size="sm">Start protecting</Button>
          </Link>
        </nav>
      </header>

      <main>
        {/* Dense first viewport: brand + copy | dominant pipeline */}
        <section className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 pb-6 pt-6 sm:px-6 lg:min-h-[calc(100svh-7.5rem)] lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:pb-8 lg:pt-4">
          <div className="relative z-10">
            <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Agent security control plane
            </p>
            <h1 className="animate-fade-up-delay-1 mt-5 font-display text-[3.25rem] font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-[4.25rem]">
              Sentinel
            </h1>
            <p className="animate-fade-up-delay-1 mt-4 max-w-md text-lg font-medium tracking-tight text-foreground/90 sm:text-xl">
              Control what agents do with{" "}
              <WordRoll />
              <span className="text-muted"> — before they do it.</span>
            </p>
            <p className="animate-fade-up-delay-2 mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-[15px]">
              Deterministic policies, risk scores, and human approval between
              every tool call. Your runtime stays yours.
            </p>
            <div className="animate-fade-up-delay-2 mt-6 flex flex-wrap gap-2.5">
              <Link href="/signup">
                <Button size="lg">Start protecting an agent</Button>
              </Link>
              <Link href="#governance">
                <Button size="lg" variant="secondary">
                  See governance UI
                </Button>
              </Link>
            </div>
            <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap gap-2">
              {["Policies", "Approvals", "Blocks", "Audit"].map((t) => (
                <span
                  key={t}
                  className="rounded border border-border bg-surface px-2.5 py-1 font-mono text-[10px] tracking-wide text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="animate-fade-up-delay-2 relative lg:self-stretch">
            <div
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] opacity-70"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(61,139,253,0.18), transparent 65%)",
              }}
              aria-hidden
            />
            <HeroPipeline className="lg:h-full" />
          </div>
        </section>

        <LiveEventTicker />

        {/* Capability marquee — fills width, no empty gutters */}
        <section className="overflow-hidden border-b border-border py-3">
          <div className="flex animate-marquee gap-8 whitespace-nowrap font-mono text-[11px] text-muted">
            {[...CAPABILITIES, ...CAPABILITIES].map((c, i) => (
              <span key={`${c}-${i}`} className="inline-flex items-center gap-8">
                <span className="text-foreground/70">{c}</span>
                <span className="text-border" aria-hidden>
                  ·
                </span>
              </span>
            ))}
          </div>
        </section>

        {/* Problem — compact asymmetric */}
        <section
          id="how-it-works"
          className="mx-auto max-w-7xl scroll-mt-20 px-5 py-14 sm:px-6 sm:py-16"
        >
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-[2.5rem] sm:leading-tight">
                Agents act.
                <br />
                <span className="text-muted">You supervise.</span>
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
                Without a control plane, one bad prompt or runaway loop becomes
                a production incident.
              </p>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {[
                {
                  title: "Policy enforcement",
                  body: "Allow, deny, or require approval from tool, amount, environment — evaluated deterministically.",
                },
                {
                  title: "Human-in-the-loop",
                  body: "Pause high-risk actions until someone reviews arguments, risk factors, and matched policy.",
                },
                {
                  title: "Audit & anomalies",
                  body: "Every decision is logged. Baselines surface when an agent suddenly acts unlike itself.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="grid gap-2 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6"
                >
                  <h3 className="text-sm font-medium text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Governance — dense 3-up tool cards */}
        <section
          id="governance"
          className="scroll-mt-20 border-y border-border bg-surface/50 py-14 sm:py-16"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <p className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
                  21st.dev Agent Elements patterns
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-[2.5rem]">
                  Governance as the interface
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted">
                Approvals, plans, and hard blocks — preview only. Not wired to
                your agent runtime.
              </p>
            </div>
            <div className="mt-8">
              <AgentElementsShowcase />
            </div>
          </div>
        </section>

        {/* SDK snippet + CTA — fills width */}
        <section className="mx-auto grid max-w-7xl gap-6 px-5 py-14 sm:px-6 sm:py-16 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-border bg-[#05070a]">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="font-mono text-[10px] tracking-wide text-muted uppercase">
                integrate.ts
              </span>
              <span className="font-mono text-[10px] text-muted">sdk</span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-foreground/85 sm:text-[13px]">
              <code>{`import { sentinel } from "@sentinel/sdk";

await sentinel.protect(toolCall, {
  agent: "SupportBot",
  policy: "refund-policy-01",
});
// → allow | deny | approval_required`}</code>
            </pre>
          </div>

          <div className="relative flex flex-col justify-center overflow-hidden rounded-xl border border-border bg-surface px-6 py-8 sm:px-8">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse 70% 80% at 100% 0%, rgba(61,139,253,0.14), transparent)",
              }}
              aria-hidden
            />
            <h2 className="relative font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Secure the next tool call
            </h2>
            <p className="relative mt-3 max-w-md text-sm leading-relaxed text-muted">
              Create an org now. Gateway and live policies ship in later phases —
              no fake success states.
            </p>
            <div className="relative mt-6 flex flex-wrap gap-2.5">
              <Link href="/signup">
                <Button size="lg">Create your organization</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-sm font-semibold tracking-tight">
            Sentinel
          </span>
          <span className="font-mono text-[11px] text-muted">
            Security control plane for AI agents · v0.1
          </span>
        </div>
      </footer>
    </div>
  );
}
