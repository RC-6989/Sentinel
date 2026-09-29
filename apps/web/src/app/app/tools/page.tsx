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

  return <div className="app-page app-page-narrow app-page-stack">
    <header className="page-header" data-reveal>
      <p className="page-eyebrow">Registry / Execution contracts</p>
      <h1 className="page-title">Tools</h1>
      <p className="page-description">Register tools in {org.name}, classify their risk, and validate example input. Live execution requires an allowed target, explicit opt-in, and a matching project allow policy.</p>
    </header>
    {canManage ? <section className="surface-panel space-y-4 p-6" data-reveal>
      <div><p className="section-label">New contract</p><h2 className="mt-2 text-lg font-medium">Register tool</h2></div><CreateToolForm organizationId={org.id} projects={projects} />
    </section> : <p className="surface-panel p-5 text-sm text-muted" data-reveal>Only organization owners and admins can manage tools. Members can view definitions and validate input.</p>}
    {!tools.length && <p className="surface-panel p-6 text-sm text-muted" data-reveal>No tools registered yet.</p>}
    {tools.map((tool, index) => <section key={tool.id} className="resource-card space-y-5" data-reveal data-reveal-delay={index * 45}>
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-medium tracking-tight">{tool.name}</h2>
        <p className="mt-1 text-sm text-muted">{tool.project_name} · {tool.environment}</p>
        <p className="mt-2 break-all font-mono text-[10px] text-muted">{tool.id}</p>
        {tool.target_url && <p className="break-all font-mono text-xs text-muted">Target: {tool.target_url}</p>}
        {tool.description && <p className="mt-2 text-sm">{tool.description}</p>}
      </div><div className="flex flex-wrap gap-2"><span className={`status-pill ${tool.status === "active" ? "status-pill-active" : "status-pill-muted"}`}>{tool.status}</span><span className={`status-pill ${["high", "critical"].includes(tool.risk_level) ? "status-pill-warning" : "status-pill-muted"}`}>{tool.risk_level} risk</span><span className={`status-pill ${tool.execution_enabled ? "status-pill-active" : "status-pill-muted"}`}>{tool.execution_enabled ? "execution on" : "execution off"}</span></div></div>
      <details className="border-t border-border pt-4"><summary className="cursor-pointer text-sm">View saved schema</summary>
        <pre className="mt-4 overflow-auto rounded-md border border-[#465146] bg-[#18211c] p-4 text-xs text-[#f4f4ec]">{JSON.stringify(JSON.parse(tool.input_schema_json), null, 2)}</pre>
      </details>
      {canManage && <details className="border-t border-border pt-4"><summary className="cursor-pointer text-sm">Edit tool</summary><div className="pt-4"><EditToolForm key={JSON.stringify(tool)} tool={tool} /></div></details>}
      <details className="border-t border-border pt-4"><summary className="cursor-pointer text-sm">Test input</summary><div className="pt-4"><TestToolInputForm key={tool.input_schema_json} tool={tool} /></div></details>
    </section>)}
  </div>;
}
