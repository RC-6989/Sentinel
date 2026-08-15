import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthGatePanel } from "@/components/auth/auth-gate-panel";
import { SignupForm } from "@/components/auth/signup-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/app");

  return (
    <main className="grid min-h-svh bg-sentinel-atmosphere lg:grid-cols-2">
      <div className="relative flex flex-col px-4 py-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-tight"
          >
            Sentinel
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10 sm:py-14">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Create account
          </h1>
          <p className="mt-2 text-sm text-muted">
            Free to start. No credit card required.
          </p>
          <div className="mt-7">
            <SignupForm />
          </div>
        </div>
      </div>

      <div className="hidden min-h-svh p-4 lg:block lg:p-5">
        <AuthGatePanel className="h-full rounded-2xl" />
      </div>

      <div className="border-t border-border p-4 lg:hidden">
        <AuthGatePanel className="min-h-[12rem] rounded-xl" />
      </div>
    </main>
  );
}
