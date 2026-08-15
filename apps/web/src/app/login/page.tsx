import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/app");

  return (
    <main className="flex min-h-screen items-center justify-center bg-sentinel-atmosphere px-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-tight"
        >
          Sentinel
        </Link>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Access your agent security control plane.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
