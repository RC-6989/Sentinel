import { cn } from "@/lib/utils";

export function AuthGatePanel({ className }: { className?: string }) {
  return (
    <aside className={cn("flex h-full flex-col justify-center border border-border bg-surface p-8 sm:p-12", className)} aria-label="Product availability">
      <p className="font-mono text-xs text-muted">SENTINEL / IN DEVELOPMENT</p>
      <h2 className="mt-6 max-w-sm text-3xl font-medium leading-tight tracking-tight">Start with your agents and their access.</h2>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">The local dashboard supports organizations, projects, agents, scoped API keys, tool setup, and limited tool execution.</p>
      <dl className="mt-8 max-w-md divide-y divide-border border-y border-border text-sm">
        <div className="flex justify-between gap-4 py-4"><dt>Agent management</dt><dd>Available locally</dd></div>
        <div className="flex justify-between gap-4 py-4"><dt>Limited execution gateway</dt><dd>Available locally</dd></div>
        <div className="flex justify-between gap-4 py-4"><dt>Policy checks</dt><dd>Available locally</dd></div>
        <div className="flex justify-between gap-4 py-4"><dt>Human approvals</dt><dd className="text-muted">Planned</dd></div>
        <div className="flex justify-between gap-4 py-4"><dt>Searchable decision history</dt><dd className="text-muted">Planned</dd></div>
      </dl>
      <p className="mt-6 max-w-md text-xs leading-relaxed text-muted">Local execution requires an opted-in tool, an operator-allowed target, and an allow policy. Approval requirements block execution; human review is not available yet.</p>
    </aside>
  );
}
