import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthGatePanel } from "@/components/auth/auth-gate-panel";
import { SignupForm } from "@/components/auth/signup-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/app");

  return (
    <main className="grid min-h-screen bg-sentinel-atmosphere lg:grid-cols-2">
      <div className="relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-14 xl:px-20">
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-tight"
          >
            Sentinel
          </Link>
          <Link
            href="/login"
            className="font-mono text-[11px] tracking-wide text-muted transition-colors hover:text-foreground"
          >
            Sign in →
          </Link>
        </div>

        <div className="mx-auto w-full max-w-md pt-8">
          <p className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
            Provision org
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Create account
          </h1>
          <p className="mt-2 text-sm text-muted">
            Free to start. No credit card. No paid AI required.
          </p>

          <div className="mt-8 rounded-xl border border-border bg-surface/80 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-3">
              <span className="font-mono text-[10px] tracking-wide text-muted uppercase">
                New organization
              </span>
              <span className="font-mono text-[10px] text-muted">v0.1</span>
            </div>
            <SignupForm />
          </div>
        </div>
      </div>

      <div className="relative hidden p-6 lg:block lg:p-8">
        <AuthGatePanel className="h-full min-h-[calc(100vh-4rem)] rounded-2xl" />
      </div>

      <div className="border-t border-border px-6 py-5 lg:hidden">
        <div className="overflow-hidden rounded-xl">
          <AuthGatePanel className="min-h-[240px]" />
        </div>
      </div>
    </main>
  );
}
