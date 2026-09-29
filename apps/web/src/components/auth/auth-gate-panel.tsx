import { cn } from "@/lib/utils";

export function AuthGatePanel({ className }: { className?: string }) {
  return (
    <aside className={cn("auth-panel flex h-full flex-col justify-center border border-border p-8 sm:p-12 xl:p-16", className)} aria-label="Product availability" data-tilt>
      <p className="page-eyebrow">Sentinel / control plane</p>
      <h2 className="mt-6 max-w-md font-display text-4xl font-semibold leading-[1.06] tracking-[-0.045em]">A hard boundary before agents act.</h2>
      <p className="mt-6 max-w-lg text-sm leading-7 text-muted">Register agents, scope credentials, define tool contracts, and evaluate deterministic policies from one focused operator workspace.</p>
      <dl className="mt-10 max-w-lg divide-y divide-border border-y border-border text-sm">
        <div className="auth-data-row flex justify-between gap-4 py-4"><dt>Agent management</dt><dd>Available locally</dd></div>
        <div className="auth-data-row flex justify-between gap-4 py-4"><dt>Limited execution gateway</dt><dd>Available locally</dd></div>
        <div className="auth-data-row flex justify-between gap-4 py-4"><dt>Policy checks</dt><dd>Available locally</dd></div>
        <div className="auth-data-row flex justify-between gap-4 py-4"><dt>Human approvals</dt><dd className="text-muted">Planned</dd></div>
        <div className="auth-data-row flex justify-between gap-4 py-4"><dt>Decision history</dt><dd className="text-muted">Planned</dd></div>
      </dl>
      <p className="mt-7 max-w-lg font-mono text-[10px] leading-5 tracking-[0.04em] text-muted uppercase">Local execution requires an opted-in tool, an operator-allowed target, and a matching allow policy.</p>
    </aside>
  );
}
