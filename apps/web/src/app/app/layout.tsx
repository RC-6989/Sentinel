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


  return (
    <div className="app-shell flex min-h-screen flex-col lg:flex-row">
      <AppSidebar
        organizations={orgs}
        userName={user.name}
        userEmail={user.email}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="app-main flex-1 px-5 py-6 sm:px-8 lg:px-12 lg:py-10 xl:px-16">{children}</main>
      </div>
    </div>
  );
}
