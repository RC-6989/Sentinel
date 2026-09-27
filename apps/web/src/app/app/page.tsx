import Link from "next/link";
import { listAgents } from "@/lib/agents";
import { listTools } from "@/lib/tools";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationForUser, listOrganizationsForUser, listProjects } from "@/lib/orgs";
import { buttonStyles } from "@/components/ui/button";
import { redirect, notFound } from "next/navigation";

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orgs = listOrganizationsForUser(user.id);
  const { org: orgId } = await searchParams;
  const org = orgId ? getOrganizationForUser(user.id, orgId) : orgs[0];
  if (!org) notFound();

  const projects = listProjects(org.id);

  const agents = listAgents(user.id, org.id);
  const tools = listTools(user.id, org.id);

  const kpis = [
    { label: "Registered Agents", value: String(agents.length), hint: `${agents.filter(a => a.status === "active").length} active` },
    { label: "Registered Tools", value: String(tools.length), hint: `${tools.filter(t => t.status === "active").length} active` },
    { label: "Tool Calls", value: "—", hint: "Gateway not available yet" },
    { label: "Blocked Actions", value: "—", hint: "Policy enforcement not available" },
    { label: "Pending Approvals", value: "—", hint: "Approval workflow not available" },
    { label: "Security Incidents", value: "—", hint: "Incident detection not available" },
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        <h2 className="text-sm font-medium">{agents.length ? "Manage your agents" : "Register your first agent"}</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Register agents, manage their API keys, and define tools with input
          schemas. Gateway execution will be available in Phase 4.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/app/settings?org=${org.id}`} className={buttonStyles({ size: "sm" })}>Open settings</Link>
          <Link href={`/app/agents?org=${org.id}`} className={buttonStyles({ size: "sm", variant: "secondary" })}>Manage agents</Link>
          <Link href={`/app/tools?org=${org.id}`} className={buttonStyles({ size: "sm", variant: "secondary" })}>Manage tools</Link>
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
