import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationForUser, listOrganizationsForUser, listProjects } from "@/lib/orgs";
import { listAgents, listApiKeys } from "@/lib/agents";
import { CreateAgentForm, EditAgentForm, IssueKeyForm, RevokeKeyForm } from "@/components/app/agent-forms";

export default async function AgentsPage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { org: orgId } = await searchParams;
  const org = orgId ? getOrganizationForUser(user.id, orgId) : listOrganizationsForUser(user.id)[0];
  if (!org) notFound();
  const projects = listProjects(org.id);
  const agents = listAgents(user.id, org.id);
  const keys = listApiKeys(user.id, org.id);
  const canManage = ["owner", "admin"].includes(org.role);

  return <div className="app-page app-page-narrow app-page-stack">
    <header className="page-header" data-reveal>
      <p className="page-eyebrow">Identity / Registered agents</p>
      <h1 className="page-title">Agents</h1>
      <p className="page-description">Register agents in {org.name} and manage their credentials. Keys can call enabled tools in the same project through the local gateway.</p>
    </header>
    {canManage ? <section className="surface-panel space-y-4 p-6" data-reveal>
      <div><p className="section-label">New identity</p><h2 className="mt-2 text-lg font-medium">Create agent</h2></div><CreateAgentForm organizationId={org.id} projects={projects} />
    </section> : <p className="surface-panel p-5 text-sm text-muted" data-reveal>Only organization owners and admins can manage agents and keys.</p>}
    {!agents.length && <p className="surface-panel p-6 text-sm text-muted" data-reveal>No agents registered yet.</p>}
    {agents.map((agent, index) => <section key={agent.id} className="resource-card space-y-5" data-reveal data-reveal-delay={index * 45}>
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-medium tracking-tight">{agent.name}</h2>
        <p className="mt-1 text-sm text-muted">{agent.project_name} · {agent.environment}</p>
        <p className="mt-2 break-all font-mono text-[10px] text-muted">{agent.id}</p>
        {agent.description && <p className="mt-2 text-sm">{agent.description}</p>}
      </div><span className={`status-pill ${agent.status === "active" ? "status-pill-active" : "status-pill-warning"}`}>{agent.status}</span></div>
      {canManage && <details className="border-t border-border pt-4"><summary className="cursor-pointer text-sm">Edit agent</summary><div className="pt-4"><EditAgentForm agent={agent} /></div></details>}
      <div className="border-t border-border pt-4"><p className="section-label">Credentials</p><h3 className="mt-2 text-sm font-medium">API keys</h3></div>
      <p className="text-xs text-muted">Each key identifies only this agent and its project. Store keys securely; never include them in browser code.</p>
      {keys.filter(key => key.agent_id === agent.id).map(key => <div key={key.id} className="space-y-3 rounded-md border border-border bg-white p-4">
        <p className="text-sm">{key.name} · <code>{key.token_prefix}…</code></p>
        <p className="text-xs text-muted">{key.revoked_at ? "Revoked" : Date.parse(key.expires_at) <= Date.now() ? "Expired" : "Active"} · Expires {key.expires_at.slice(0, 10)} (UTC)</p>
        {canManage && !key.revoked_at && <>
          <RevokeKeyForm organizationId={org.id} keyId={key.id} />
        </>}
      </div>)}
      {canManage && agent.status === "active" && <details className="border-t border-border pt-4"><summary className="cursor-pointer text-sm">Generate or rotate API key</summary><div className="pt-4"><IssueKeyForm agent={agent} keys={keys.filter(key => key.agent_id === agent.id)} /></div></details>}
    </section>)}
  </div>;
}
