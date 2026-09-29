import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationForUser, listOrganizationsForUser, listProjects } from "@/lib/orgs";
import { listTools } from "@/lib/tools";
import { CreateToolForm, EditToolForm, TestToolInputForm } from "@/components/app/tool-forms";

export default async function ToolsPage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { org: orgId } = await searchParams;
  const org = orgId ? getOrganizationForUser(user.id, orgId) : listOrganizationsForUser(user.id)[0];
  if (!org) notFound();
  const projects = listProjects(org.id);
  const tools = listTools(user.id, org.id);
  const canManage = ["owner", "admin"].includes(org.role);

  return <div className="mx-auto max-w-3xl space-y-8">
    <div><h1 className="text-2xl font-semibold">Tools</h1>
      <p className="mt-2 text-sm text-muted">Register tools in {org.name}, classify their risk, and validate example input. Live execution requires an allowed target, explicit opt-in, and a matching project allow policy.</p>
    </div>
    {canManage ? <section className="space-y-3 rounded-lg border border-border p-5">
      <h2 className="font-medium">Register tool</h2><CreateToolForm organizationId={org.id} projects={projects} />
    </section> : <p className="text-sm text-muted">Only organization owners and admins can manage tools. Members can view definitions and validate input.</p>}
    {!tools.length && <p className="text-sm text-muted">No tools registered yet.</p>}
    {tools.map(tool => <section key={tool.id} className="space-y-4 rounded-lg border border-border p-5">
      <div><h2 className="font-medium">{tool.name} <span className="text-xs text-muted">{tool.status} · {tool.risk_level} risk · {tool.execution_enabled ? "execution enabled" : "execution off"}</span></h2>
        <p className="text-sm text-muted">{tool.project_name} · {tool.environment}</p>
        <p className="break-all font-mono text-xs text-muted">{tool.id}</p>
        {tool.target_url && <p className="break-all font-mono text-xs text-muted">Target: {tool.target_url}</p>}
        {tool.description && <p className="mt-2 text-sm">{tool.description}</p>}
      </div>
      <details><summary className="cursor-pointer text-sm">View saved schema</summary>
        <pre className="mt-3 overflow-auto rounded bg-[#0d1117] p-3 text-xs">{JSON.stringify(JSON.parse(tool.input_schema_json), null, 2)}</pre>
      </details>
      {canManage && <details><summary className="cursor-pointer text-sm">Edit tool</summary><div className="pt-3"><EditToolForm key={JSON.stringify(tool)} tool={tool} /></div></details>}
      <details><summary className="cursor-pointer text-sm">Test input</summary><div className="pt-3"><TestToolInputForm key={tool.input_schema_json} tool={tool} /></div></details>
    </section>)}
  </div>;
}
