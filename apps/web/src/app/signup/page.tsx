import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/app");

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="font-mono text-xs tracking-[0.18em] text-muted uppercase"
        >
          Sentinel
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted">
          Free to start. No credit card. No paid AI required.
        </p>
        <div className="mt-8">
          <SignupForm />
        </div>
      </div>
    </main>
  );
}
