import Link from "next/link";
import { AgentElementsShowcase } from "@/components/marketing/agent-elements-showcase";
import { HeroPipeline } from "@/components/marketing/hero-pipeline";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-sentinel-atmosphere text-foreground">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-tight sm:text-xl"
        >
          Sentinel
        </Link>
        <nav className="flex items-center gap-3">
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
        {/* Hero: brand-first, one composition, full-bleed product visual */}
        <section className="relative pb-4 pt-10 sm:pt-14">
          <div className="relative z-10 mx-auto max-w-6xl px-6">
            <p className="animate-fade-up font-mono text-[11px] tracking-[0.22em] text-muted uppercase">
              AI agent security control plane
            </p>
            <h1 className="animate-fade-up-delay-1 mt-4 max-w-3xl font-display text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl lg:leading-[1.05]">
              Sentinel
            </h1>
            <p className="animate-fade-up-delay-1 mt-4 max-w-xl text-lg font-medium tracking-tight text-foreground/90 sm:text-xl">
              Control what your AI agents can do.
            </p>
            <p className="animate-fade-up-delay-2 mt-4 max-w-lg text-base leading-relaxed text-muted">
              Policies, risk, and human approval between every tool call — before
              refunds, emails, or data leave your stack.
            </p>
            <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap gap-3">
              <Link href="/signup">
                <Button size="lg">Start protecting an agent</Button>
              </Link>
              <Link href="#governance">
                <Button size="lg" variant="secondary">
                  See governance UI
                </Button>
              </Link>
            </div>
          </div>

          <div className="animate-fade-up-delay-2 mt-14 sm:mt-16">
            <HeroPipeline />
          </div>
        </section>

        {/* Problem — asymmetric, not a card grid */}
        <section
          id="how-it-works"
          className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24 sm:py-28"
        >
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Agents act.
                <br />
                <span className="text-muted">You supervise.</span>
              </h2>
            </div>
            <div className="max-w-xl space-y-8">
              <p className="text-base leading-relaxed text-muted">
                Tool-calling agents can refund money, email customers, query
                databases, and hit external APIs. Without a control plane, one
                bad prompt or runaway loop becomes a production incident.
              </p>
              <div className="space-y-6 border-t border-border pt-8">
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
                  <div key={item.title} className="grid gap-1 sm:grid-cols-[9rem_1fr]">
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
          </div>
        </section>

        {/* 21st.dev Agent Elements–inspired governance showcase */}
        <section
          id="governance"
          className="scroll-mt-20 border-y border-border bg-surface/60 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
                Inspired by 21st.dev Agent Elements
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Governance as the interface
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted">
                Diffs, plan accept, tool cards, and clear block states — the 2026
                agent UI patterns. Marketing preview only; your runtime stays
                yours.
              </p>
            </div>
            <div className="mt-12">
              <AgentElementsShowcase />
            </div>
          </div>
        </section>

        {/* Trust strip — dense mono, not fake metrics */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-6 border-y border-border py-8 font-mono text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span>Deterministic policies</span>
            <span className="hidden text-border sm:inline" aria-hidden>
              /
            </span>
            <span>No paid LLM required</span>
            <span className="hidden text-border sm:inline" aria-hidden>
              /
            </span>
            <span>Human approval when it matters</span>
            <span className="hidden text-border sm:inline" aria-hidden>
              /
            </span>
            <span>Full audit trail</span>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-28">
          <div className="relative overflow-hidden rounded-xl border border-border bg-surface px-6 py-12 sm:px-10 sm:py-14">
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(61,139,253,0.12), transparent)",
              }}
              aria-hidden
            />
            <div className="relative max-w-lg">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Built for teams securing real agents
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Phase 1 is live: accounts, organizations, and the dashboard
                shell. Gateway, policies, and the attack simulator land in later
                phases — without fake success states.
              </p>
              <div className="mt-8">
                <Link href="/signup">
                  <Button size="lg">Create your organization</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-sm font-semibold tracking-tight">
            Sentinel
          </span>
          <span className="text-xs text-muted">
            Security control plane for AI agents · v0.1
          </span>
        </div>
      </footer>
    </div>
  );
}
