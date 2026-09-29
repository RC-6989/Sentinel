import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthGatePanel } from "@/components/auth/auth-gate-panel";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/app");

  return (
    <main className="auth-shell grid lg:grid-cols-[minmax(0,0.92fr)_minmax(32rem,1.08fr)]">
      <div className="relative flex min-h-svh flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-20">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="auth-wordmark"
          >
            Sentinel
          </Link>
          <Link
            href="/signup"
            className="auth-meta-link"
          >
            Create account
          </Link>
        </div>

        <div className="auth-form-wrap mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-16" data-reveal>
          <p className="page-eyebrow mb-4">Operator access</p>
          <h1 className="auth-title">
            Sign in
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
            Access your organization&apos;s agent security control plane.
          </p>
          <div className="mt-9">
            <LoginForm />
          </div>
        </div>
        <p className="pb-2 font-mono text-[10px] tracking-[0.08em] text-muted uppercase">Protected workspace · Local development</p>
      </div>

      <div className="hidden min-h-svh p-4 lg:block lg:p-5" data-reveal data-reveal-delay="100">
        <AuthGatePanel className="h-full rounded-xl" />
      </div>

      <div className="border-t border-border p-4 lg:hidden">
        <AuthGatePanel className="min-h-[13rem] rounded-xl" />
      </div>
    </main>
  );
}
