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
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Profile, organization, and project configuration.
        </p>
      </div>

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="text-sm font-medium">Profile</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Name</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="font-mono text-xs sm:text-sm">{user.email}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="text-sm font-medium">Current organization</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Name</dt>
            <dd>{org.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Slug</dt>
            <dd className="font-mono text-xs">{org.slug}</dd>
          </div>
          <div>
            <dt className="text-muted">Your role</dt>
            <dd className="font-mono text-xs uppercase">{org.role}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="text-sm font-medium">Projects ({projects.length})</h2>
        <ul className="space-y-2 text-sm">
          {projects.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <span>{p.name}</span>
              <span className="font-mono text-[10px] text-muted uppercase">
                {p.environment}
              </span>
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <CreateProjectForm organizationId={org.id} />
        </div>
      </section>

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="text-sm font-medium">Create another organization</h2>
        <p className="text-sm text-muted">
          Switch between your organizations using the sidebar selector.
        </p>
        <CreateOrgForm />
      </section>
    </div>
  );
}
