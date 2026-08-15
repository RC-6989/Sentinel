export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(61,139,253,0.18), transparent), linear-gradient(to bottom, transparent, #07080a)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
          Sentinel
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Control what your AI agents can do.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
          Security control plane for AI agents — policies, risk, human approval,
          and audit. Phase 0 foundation is online; product surfaces land in later
          phases.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="/api/health"
            className="inline-flex items-center gap-2 rounded border border-border bg-[#0d1117] px-4 py-2 font-mono text-sm text-foreground transition-colors hover:border-accent"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-ok" aria-hidden />
            GET /api/health
          </a>
          <span className="font-mono text-sm text-muted">
            Docs: not published yet (Phase 25)
          </span>
        </div>
        <p className="mt-16 font-mono text-xs text-muted">
          v0.1.0 · monorepo scaffold · no paid AI required
        </p>
      </div>
    </main>
  );
}
