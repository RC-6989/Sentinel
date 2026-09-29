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

  return <div className="mx-auto max-w-3xl space-y-8">
    <div><h1 className="text-2xl font-semibold">Policies</h1>
      <p className="mt-2 text-sm text-muted">Set deterministic project rules for {org.name}. Tool calls need an active matching allow rule. Deny and approval rules stop outbound execution.</p>
    </div>
    {canManage ? <section className="space-y-3 rounded-lg border border-border p-5">
      <h2 className="font-medium">Create policy</h2><CreatePolicyForm organizationId={org.id} projects={projects} />
    </section> : <p className="text-sm text-muted">Only organization owners and admins can manage policies. Members can view them.</p>}
    <p className="text-xs text-muted">Rule JSON can match a tool ID, agent ID, environment, risk level, and one argument path. A JSON Pointer such as <code>/destination/host</code> supports equals, one_of, exists, or absent. Approval rules currently hold a call without dispatch; the approval workflow arrives in Phase 7.</p>
    {!policies.length && <p className="text-sm text-muted">No policies yet. All live tool calls are denied until an allow rule is active.</p>}
    {policies.map(policy => <section key={policy.id} className="space-y-4 rounded-lg border border-border p-5">
      <div><h2 className="font-medium">{policy.name} <span className="text-xs text-muted">{policy.status}</span></h2>
        <p className="text-sm text-muted">{policy.project_name} · {policy.environment}</p>
        <p className="break-all font-mono text-xs text-muted">{policy.id}</p>
      </div>
      <details><summary className="cursor-pointer text-sm">View saved rules</summary>
        <pre className="mt-3 overflow-auto rounded bg-[#0d1117] p-3 text-xs">{JSON.stringify(JSON.parse(policy.rules_json), null, 2)}</pre>
      </details>
      {canManage && <details><summary className="cursor-pointer text-sm">Edit policy</summary>
        <div className="pt-3"><EditPolicyForm key={JSON.stringify(policy)} policy={policy} /></div>
      </details>}
    </section>)}
  </div>;
}
