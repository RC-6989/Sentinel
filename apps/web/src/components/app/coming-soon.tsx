import Link from "next/link";
import { Button } from "@/components/ui/button";

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
    <div className="mx-auto max-w-xl pt-8">
      <p className="font-mono text-[11px] tracking-wide text-muted uppercase">
        {phase} · not available yet
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
      <p className="mt-4 text-sm text-muted">
        This page is intentionally marked unavailable — no fake success UI.
      </p>
      <div className="mt-6">
        <Link href="/app">
          <Button size="sm" variant="secondary">
            Back to overview
          </Button>
        </Link>
      </div>
    </div>
  );
}
