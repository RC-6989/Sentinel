import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationForUser, listOrganizationsForUser, listProjects } from "@/lib/orgs";
import { listPolicies } from "@/lib/policies";
import { CreatePolicyForm, EditPolicyForm } from "@/components/app/policy-forms";

export default async function PoliciesPage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { org: orgId } = await searchParams;
  const org = orgId ? getOrganizationForUser(user.id, orgId) : listOrganizationsForUser(user.id)[0];
  if (!org) notFound();
  const projects = listProjects(org.id);
  const policies = listPolicies(user.id, org.id);
  const canManage = ["owner", "admin"].includes(org.role);

  return <div className="app-page app-page-narrow app-page-stack">
    <header className="page-header" data-reveal>
      <p className="page-eyebrow">Policy engine / Deterministic rules</p>
      <h1 className="page-title">Policies</h1>
      <p className="page-description">Set deterministic project rules for {org.name}. Tool calls need an active matching allow rule. Deny and approval rules stop outbound execution.</p>
    </header>
    {canManage ? <section className="surface-panel space-y-4 p-6" data-reveal>
      <div><p className="section-label">New ruleset</p><h2 className="mt-2 text-lg font-medium">Create policy</h2></div><CreatePolicyForm organizationId={org.id} projects={projects} />
    </section> : <p className="surface-panel p-5 text-sm text-muted" data-reveal>Only organization owners and admins can manage policies. Members can view them.</p>}
    <p className="rounded-md border border-border bg-surface p-4 text-xs leading-6 text-muted" data-reveal>Rule JSON can match a tool ID, agent ID, environment, risk level, and one argument path. A JSON Pointer such as <code>/destination/host</code> supports equals, one_of, exists, or absent. Approval rules currently hold a call without dispatch; the approval workflow arrives in Phase 7.</p>
    {!policies.length && <p className="surface-panel p-6 text-sm text-muted" data-reveal>No policies yet. All live tool calls are denied until an allow rule is active.</p>}
    {policies.map((policy, index) => <section key={policy.id} className="resource-card space-y-5" data-reveal data-reveal-delay={index * 45}>
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-medium tracking-tight">{policy.name}</h2>
        <p className="mt-1 text-sm text-muted">{policy.project_name} · {policy.environment}</p>
        <p className="mt-2 break-all font-mono text-[10px] text-muted">{policy.id}</p>
      </div><span className={`status-pill ${policy.status === "active" ? "status-pill-active" : "status-pill-muted"}`}>{policy.status}</span></div>
      <details className="border-t border-border pt-4"><summary className="cursor-pointer text-sm">View saved rules</summary>
        <pre className="mt-4 overflow-auto rounded-md border border-[#465146] bg-[#18211c] p-4 text-xs text-[#f4f4ec]">{JSON.stringify(JSON.parse(policy.rules_json), null, 2)}</pre>
      </details>
      {canManage && <details className="border-t border-border pt-4"><summary className="cursor-pointer text-sm">Edit policy</summary>
        <div className="pt-4"><EditPolicyForm key={JSON.stringify(policy)} policy={policy} /></div>
      </details>}
    </section>)}
  </div>;
}
