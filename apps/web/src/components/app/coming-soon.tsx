import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

export function ComingSoon({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="app-page app-page-narrow">
      <header className="page-header" data-reveal>
        <p className="page-eyebrow">{phase} / Planned capability</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
      </header>
      <section className="surface-panel mt-8 p-6 sm:p-8" data-reveal data-reveal-delay="80">
        <span className="status-pill status-pill-muted">Not available yet</span>
        <h2 className="mt-6 text-lg font-medium">This surface is on the roadmap.</h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
          You can continue configuring agents, API keys, tools, and policies from the live areas of the workspace.
        </p>
        <div className="mt-7">
          <Link href="/app" className={buttonStyles({ size: "sm", variant: "secondary" })}>
            Back to overview
          </Link>
        </div>
      </section>
    </div>
  );
}
