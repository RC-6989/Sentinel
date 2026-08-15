import Link from "next/link";
import { AgentElementsShowcase } from "@/components/marketing/agent-elements-showcase";
import { HeroPipeline } from "@/components/marketing/hero-pipeline";
import { LiveEventTicker } from "@/components/marketing/live-event-ticker";
import { WordRoll } from "@/components/marketing/word-roll";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-sentinel-atmosphere text-foreground">
      <header className="border-b border-border/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-tight"
          >
            Sentinel
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="#how-it-works"
              className="hidden text-sm text-muted transition-colors hover:text-foreground sm:inline"
            >
              How it works
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10 lg:pt-12">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,20.5rem)_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <div className="flex flex-col pt-0 lg:pt-1">
              <h1 className="animate-fade-up font-display text-[2.75rem] font-bold leading-[0.95] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                Sentinel
              </h1>
              <p className="animate-fade-up-delay-1 mt-4 text-base font-medium tracking-tight text-foreground sm:text-lg">
                Control agent <WordRoll /> before they run.
              </p>
              <p className="animate-fade-up-delay-2 mt-3 text-sm leading-relaxed text-muted">
                Enforce policies, score risk, and require human approval on every
                tool call.
              </p>
              <div className="animate-fade-up-delay-2 mt-6 flex flex-wrap gap-2.5">
                <Link href="/signup">
                  <Button size="lg">Get started</Button>
                </Link>
                <Link href="#how-it-works">
                  <Button size="lg" variant="secondary">
                    How it works
                  </Button>
                </Link>
              </div>
            </div>

            <div className="animate-fade-up-delay-2 min-w-0">
              <HeroPipeline />
            </div>
          </div>
        </section>

        <div className="mt-8 sm:mt-10">
          <LiveEventTicker />
        </div>

        <section
          id="how-it-works"
          className="mx-auto w-full max-w-6xl scroll-mt-16 px-4 py-12 sm:px-6 sm:py-14"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-12">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Why Sentinel
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Agents can refund money, email customers, and call APIs. Sentinel
                sits in front of those tools.
              </p>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {[
                {
                  title: "Policies",
                  body: "Allow, deny, or require approval by tool, amount, and environment.",
                },
                {
                  title: "Approvals",
                  body: "Pause high-risk actions until a person reviews the call.",
                },
                {
                  title: "Audit",
                  body: "Log every decision and flag when an agent behaves unusually.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="grid gap-1 py-3.5 sm:grid-cols-[7rem_1fr] sm:items-baseline sm:gap-6"
                >
                  <h3 className="text-sm font-medium">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="governance"
          className="border-y border-border bg-surface/40 py-12 sm:py-14"
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="max-w-xl">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                What operators see
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Approvals, plans, and hard blocks when an agent tries something
                risky.
              </p>
            </div>
            <div className="mt-6 sm:mt-8">
              <AgentElementsShowcase />
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-2 lg:gap-5">
          <div className="overflow-hidden rounded-xl border border-border bg-[#05070a]">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="font-mono text-[10px] tracking-wide text-muted uppercase">
                integrate.ts
              </span>
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

          <div className="flex flex-col justify-center rounded-xl border border-border bg-surface px-5 py-7 sm:px-7">
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              Protect your first agent
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Create an organization and open the dashboard.
            </p>
            <div className="mt-5">
              <Link href="/signup">
                <Button size="lg">Create organization</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-5 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-sm font-semibold tracking-tight">
            Sentinel
          </span>
          <span className="text-xs text-muted">AI agent security · v0.1</span>
        </div>
      </footer>
    </div>
  );
}
