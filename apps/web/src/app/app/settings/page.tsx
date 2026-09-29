import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationForUser, listOrganizationsForUser, listProjects } from "@/lib/orgs";
import { CreateOrgForm, CreateProjectForm } from "@/components/app/settings-forms";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orgs = listOrganizationsForUser(user.id);
  const { org: orgId } = await searchParams;
  const org = orgId ? getOrganizationForUser(user.id, orgId) : orgs[0];
  if (!org) notFound();
  const projects = listProjects(org.id);

  return (
    <div className="app-page app-page-narrow app-page-stack">
      <header className="page-header" data-reveal>
        <p className="page-eyebrow">Workspace / Configuration</p>
        <h1 className="page-title">Settings</h1>
        <p className="page-description">
          Profile, organization, and project configuration.
        </p>
      </header>

      <section className="surface-panel space-y-5 p-6" data-reveal>
        <div><p className="section-label">Account</p><h2 className="mt-2 text-lg font-medium">Profile</h2></div>
        <dl className="grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="section-label">Name</dt>
            <dd className="mt-2">{user.name}</dd>
          </div>
          <div>
            <dt className="section-label">Email</dt>
            <dd className="mt-2 font-mono text-xs sm:text-sm">{user.email}</dd>
          </div>
        </dl>
      </section>

      <section className="surface-panel space-y-5 p-6" data-reveal>
        <div><p className="section-label">Active workspace</p><h2 className="mt-2 text-lg font-medium">Current organization</h2></div>
        <dl className="grid gap-5 text-sm sm:grid-cols-3">
          <div>
            <dt className="section-label">Name</dt>
            <dd className="mt-2">{org.name}</dd>
          </div>
          <div>
            <dt className="section-label">Slug</dt>
            <dd className="mt-2 font-mono text-xs">{org.slug}</dd>
          </div>
          <div>
            <dt className="section-label">Your role</dt>
            <dd className="mt-2 font-mono text-xs uppercase">{org.role}</dd>
          </div>
        </dl>
      </section>

      <section className="surface-panel space-y-5 p-6" data-reveal>
        <div className="flex items-end justify-between gap-4"><div><p className="section-label">Environments</p><h2 className="mt-2 text-lg font-medium">Projects</h2></div><span className="font-mono text-xs text-muted">{projects.length} total</span></div>
        <ul className="divide-y divide-border border-y border-border text-sm">
          {projects.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between px-1 py-3"
            >
              <span>{p.name}</span>
              <span className="status-pill status-pill-active">
                {p.environment}
              </span>
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <CreateProjectForm organizationId={org.id} />
        </div>
      </section>

      <section className="surface-panel space-y-4 p-6" data-reveal>
        <div><p className="section-label">Workspace</p><h2 className="mt-2 text-lg font-medium">Create another organization</h2></div>
        <p className="text-sm text-muted">
          Switch between your organizations using the sidebar selector.
        </p>
        <CreateOrgForm />
      </section>
    </div>
  );
}
