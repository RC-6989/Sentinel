import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { listOrganizationsForUser } from "@/lib/orgs";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orgs = listOrganizationsForUser(user.id);
  if (orgs.length === 0) redirect("/signup");

  const org = orgs[0]!;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground lg:flex-row">
      <AppSidebar
        orgName={org.name}
        orgSlug={org.slug}
        userName={user.name}
        userEmail={user.email}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
