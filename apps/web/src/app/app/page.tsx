import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listOrganizationsForUser, listProjects } from "@/lib/orgs";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function OverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orgs = listOrganizationsForUser(user.id);
  const org = orgs[0];
  if (!org) redirect("/signup");

  const projects = listProjects(org.id);

  const kpis = [
    { label: "Protected Agents", value: "0", hint: "Create an agent in Phase 2" },
    { label: "Tool Calls", value: "0", hint: "Gateway lands in Phase 4" },
    { label: "Blocked Actions", value: "0", hint: "Real counts only" },
    { label: "Pending Approvals", value: "0", hint: "Nothing waiting" },
    { label: "Security Incidents", value: "0", hint: "That's good" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          Welcome, {user.name}. Organization{" "}
          <span className="text-foreground">{org.name}</span> is ready.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="border-t border-border pt-3"
          >
            <p className="text-xs text-muted">{kpi.label}</p>
            <p className="mt-1 font-mono text-2xl tabular-nums">{kpi.value}</p>
            <p className="mt-1 text-xs text-muted">{kpi.hint}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-border bg-[#0a0c10] p-5">
        <h2 className="text-sm font-medium">No agents yet</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Connect your first agent to Sentinel and start seeing every tool
          action in one place. Agent management ships in Phase 2 — Settings
          and organization controls are available now.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/app/settings">
            <Button size="sm">Open settings</Button>
          </Link>
          <Link href="/app/agents">
            <Button size="sm" variant="secondary">
              Agents (coming soon)
            </Button>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium">Projects</h2>
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {projects.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="font-mono text-xs text-muted">{p.slug}</p>
              </div>
              <span className="rounded border border-border px-2 py-0.5 font-mono text-[10px] text-muted uppercase">
                {p.environment}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
