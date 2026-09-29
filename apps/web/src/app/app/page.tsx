import Link from "next/link";
import { listAgents } from "@/lib/agents";
import { countToolCalls, listTools } from "@/lib/tools";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationForUser, listOrganizationsForUser, listProjects } from "@/lib/orgs";
import { countBlockedCalls } from "@/lib/policies";
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
  const toolCallCount = countToolCalls(user.id, org.id);
  const blockedCount = countBlockedCalls(user.id, org.id);

  const kpis = [
    { label: "Registered Agents", value: String(agents.length), hint: `${agents.filter(a => a.status === "active").length} active` },
    { label: "Registered Tools", value: String(tools.length), hint: `${tools.filter(t => t.status === "active").length} active` },
    { label: "Tool Calls", value: String(toolCallCount), hint: "Gateway dispatch attempts" },
    { label: "Blocked Actions", value: String(blockedCount), hint: "Policy denials and approval holds" },
    { label: "Pending Approvals", value: "—", hint: "Approval workflow not available" },
    { label: "Security Incidents", value: "—", hint: "Incident detection not available" },
  ];

  return (
    <div className="app-page app-page-stack">
      <header className="page-header" data-reveal>
        <p className="page-eyebrow">Control plane / Overview</p>
        <h1 className="page-title">Overview</h1>
        <p className="page-description">
          Welcome, {user.name}. Organization{" "}
          <span className="text-foreground">{org.name}</span> is ready.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Workspace metrics">
        {kpis.map((kpi, index) => (
          <div
            key={kpi.label}
            className="surface-panel surface-panel-interactive min-h-36 p-5"
            data-reveal
            data-reveal-delay={index * 45}
          >
            <p className="section-label">{kpi.label}</p>
            <p className="mt-5 font-mono text-3xl tracking-[-0.04em] tabular-nums">{kpi.value}</p>
            <p className="mt-2 text-xs leading-5 text-muted">{kpi.hint}</p>
          </div>
        ))}
      </section>

      <section className="surface-panel grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-end" data-reveal data-tilt>
        <div>
        <p className="section-label">Next action</p>
        <h2 className="mt-3 text-xl font-medium tracking-tight">{agents.length ? "Manage your agent boundary" : "Register your first agent"}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
          Register agents, manage their API keys, and define tools with input
          schemas. Opted-in low or medium risk tools can run through the local gateway when a project policy allows them.
        </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/app/settings?org=${org.id}`} className={buttonStyles({ size: "sm" })}>Open settings</Link>
          <Link href={`/app/agents?org=${org.id}`} className={buttonStyles({ size: "sm", variant: "secondary" })}>Manage agents</Link>
          <Link href={`/app/tools?org=${org.id}`} className={buttonStyles({ size: "sm", variant: "secondary" })}>Manage tools</Link>
          <Link href={`/app/policies?org=${org.id}`} className={buttonStyles({ size: "sm", variant: "secondary" })}>Manage policies</Link>
        </div>
      </section>

      <section data-reveal>
        <div className="flex items-end justify-between gap-4">
          <div><p className="section-label">Environment</p><h2 className="mt-2 text-lg font-medium">Projects</h2></div>
          <span className="font-mono text-xs text-muted">{projects.length} total</span>
        </div>
        <ul className="surface-panel mt-4 divide-y divide-border px-5">
          {projects.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-4 py-4 text-sm"
            >
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="font-mono text-xs text-muted">{p.slug}</p>
              </div>
              <span className="status-pill status-pill-active">
                {p.environment}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
