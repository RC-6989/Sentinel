import { cn } from "@/lib/utils";

export function AuthGatePanel({ className }: { className?: string }) {
  return (
    <aside className={cn("flex h-full flex-col justify-center border border-border bg-surface p-8 sm:p-12", className)} aria-label="Product availability">
      <p className="font-mono text-xs text-muted">SENTINEL / IN DEVELOPMENT</p>
      <h2 className="mt-6 max-w-sm text-3xl font-medium leading-tight tracking-tight">Start with your agents and their access.</h2>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">The local dashboard supports organizations, projects, agent registration, and scoped API keys.</p>
      <dl className="mt-8 max-w-md divide-y divide-border border-y border-border text-sm">
        <div className="flex justify-between gap-4 py-4"><dt>Agent management</dt><dd>Available locally</dd></div>
        <div className="flex justify-between gap-4 py-4"><dt>Policy enforcement</dt><dd className="text-muted">Planned</dd></div>
        <div className="flex justify-between gap-4 py-4"><dt>Human approvals</dt><dd className="text-muted">Planned</dd></div>
        <div className="flex justify-between gap-4 py-4"><dt>Tool-call audit trail</dt><dd className="text-muted">Planned</dd></div>
      </dl>
      <p className="mt-6 max-w-md text-xs leading-relaxed text-muted">Registering an agent does not enable tool-call enforcement. The execution gateway is not available yet.</p>
    </aside>
  );
}
