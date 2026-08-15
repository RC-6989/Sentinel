import Link from "next/link";
import { HeroPipeline } from "@/components/marketing/hero-pipeline";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 45% at 50% -10%, rgba(61,139,253,0.16), transparent)",
        }}
        aria-hidden
      />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-mono text-sm tracking-[0.18em] uppercase">
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
            <Button size="sm">Start protecting an agent</Button>
          </Link>
        </nav>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-24 pt-10">
        <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Control what your AI agents can do.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted">
              Sentinel sits between your AI agents and the tools they use —
              enforcing policies, blocking risky actions, detecting suspicious
              behavior, and putting humans in control when it matters.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup">
                <Button size="lg">Start protecting an agent</Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="secondary">
                  How it works
                </Button>
              </Link>
            </div>
            <p className="mt-6 font-mono text-xs text-muted">
              Deterministic policies · No paid LLM required · Human approval
            </p>
          </div>
          <HeroPipeline />
        </section>

        <section id="how-it-works" className="mt-28 scroll-mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">
            The problem
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            Tool-calling agents can refund money, email customers, query
            databases, and call external APIs. Without a control plane, one bad
            prompt or runaway loop becomes a production incident.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Policy enforcement",
                body: "Allow, deny, or require approval based on tool, amount, environment, and more — evaluated deterministically.",
              },
              {
                title: "Human-in-the-loop",
                body: "Pause high-risk actions until a person reviews arguments, risk factors, and matched policy.",
              },
              {
                title: "Audit & anomalies",
                body: "Every decision is logged. Behavioral baselines surface when an agent suddenly acts unlike itself.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="border-t border-border pt-4"
              >
                <h3 className="text-sm font-medium">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 border-t border-border pt-12">
          <h2 className="text-2xl font-semibold tracking-tight">
            Built for developers securing real agents
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            Phase 1 is live: accounts, organizations, and the dashboard shell.
            Gateway, policies, and the attack simulator land in later phases —
            without fake success states.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button>Create your organization</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-xs tracking-wide text-muted uppercase">
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
