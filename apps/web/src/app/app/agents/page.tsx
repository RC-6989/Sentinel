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

  return <div className="mx-auto max-w-3xl space-y-8">
    <div><h1 className="text-2xl font-semibold">Agents</h1>
      <p className="mt-2 text-sm text-muted">Register agents in {org.name} and manage their credentials. Tool execution is not available yet.</p>
    </div>
    {canManage ? <section className="space-y-3 rounded-lg border border-border p-5">
      <h2 className="font-medium">Create agent</h2><CreateAgentForm organizationId={org.id} projects={projects} />
    </section> : <p className="text-sm text-muted">Only organization owners and admins can manage agents and keys.</p>}
    {!agents.length && <p className="text-sm text-muted">No agents registered yet.</p>}
    {agents.map(agent => <section key={agent.id} className="space-y-4 rounded-lg border border-border p-5">
      <div><h2 className="font-medium">{agent.name} <span className="text-xs text-muted">{agent.status}</span></h2>
        <p className="text-sm text-muted">{agent.project_name} · {agent.environment}</p>
        <p className="break-all font-mono text-xs text-muted">{agent.id}</p>
        {agent.description && <p className="mt-2 text-sm">{agent.description}</p>}
      </div>
      {canManage && <details><summary className="cursor-pointer text-sm">Edit agent</summary><div className="pt-3"><EditAgentForm agent={agent} /></div></details>}
      <h3 className="text-sm font-medium">API keys</h3>
      <p className="text-xs text-muted">Each key identifies only this agent and its project. Store keys securely; never include them in browser code.</p>
      {keys.filter(key => key.agent_id === agent.id).map(key => <div key={key.id} className="space-y-3 border-t border-border pt-3">
        <p className="text-sm">{key.name} · <code>{key.token_prefix}…</code></p>
        <p className="text-xs text-muted">{key.revoked_at ? "Revoked" : Date.parse(key.expires_at) <= Date.now() ? "Expired" : "Active"} · Expires {key.expires_at.slice(0, 10)} (UTC)</p>
        {canManage && !key.revoked_at && <>
          <RevokeKeyForm organizationId={org.id} keyId={key.id} />
        </>}
      </div>)}
      {canManage && agent.status === "active" && <details><summary className="cursor-pointer text-sm">Generate or rotate API key</summary><div className="pt-3"><IssueKeyForm agent={agent} keys={keys.filter(key => key.agent_id === agent.id)} /></div></details>}
    </section>)}
  </div>;
}
