"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckSquare,
  LayoutDashboard,
  Menu,
  Settings,
  Shield,
  Wrench,
  X,
  ScrollText,
} from "lucide-react";
import type { Organization } from "@/lib/orgs";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/agents", label: "Agents", icon: Bot },
  { href: "/app/tools", label: "Tools", icon: Wrench },
  { href: "/app/policies", label: "Policies", icon: ScrollText },
  { href: "/app/approvals", label: "Approvals", icon: CheckSquare, soon: true },
  { href: "/app/activity", label: "Activity", icon: Activity, soon: true },
  { href: "/app/security", label: "Security", icon: Shield, soon: true },
  { href: "/app/incidents", label: "Incidents", icon: AlertTriangle, soon: true },
  { href: "/app/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar({
  organizations,
  userName,
  userEmail,
}: {
  organizations: Organization[];
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const org = organizations.find(o => o.id === params.get("org")) ?? organizations[0];
  const [open, setOpen] = useState(false);

  const nav = (
    <>
      <div className="border-b border-border px-5 py-6">
        <Link href="/" className="auth-wordmark">
          Sentinel
        </Link>
        <div className="mt-7">
          <label className="section-label" htmlFor="organization-switcher">Organization</label>
          <select id="organization-switcher" value={org.id} onChange={event => router.push(`${pathname}?org=${event.target.value}`)} className="mt-2 h-10 w-full rounded-md border border-border bg-white px-2.5 text-sm">
            {organizations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <p className="mt-1.5 truncate font-mono text-[10px] text-muted">{org.slug}</p>
        </div>
        <div className="status-pill status-pill-active mt-4">
          development
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Primary">
        <p className="section-label px-2.5 pb-2 pt-3">Workspace</p>
        {NAV.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={`${item.href}?org=${org.id}`}
              onClick={() => setOpen(false)}
              className={cn(
                "group flex min-h-10 items-center gap-2.5 rounded-md border px-2.5 py-2 text-sm transition-all duration-150",
                active
                  ? "border-[#cbd2c8] bg-[#e8ebe4] text-foreground"
                  : "border-transparent text-muted hover:border-border hover:bg-[#eff1eb] hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-[#315a43]" : "text-[#778078] group-hover:text-[#3f624d]")} aria-hidden />
              <span className="flex-1">{item.label}</span>
              {"soon" in item && item.soon ? (
                <span className="font-mono text-[9px] tracking-wide text-[#7b867e] uppercase">soon</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <p className="truncate text-sm font-medium">{userName}</p>
        <p className="mt-0.5 truncate font-mono text-[10px] text-muted">{userEmail}</p>
        <form action={logoutAction} className="mt-3">
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start px-2">
            Sign out
          </Button>
        </form>
      </div>
    </>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-[#f7f7f2] px-4 py-3 lg:hidden">
        <span className="auth-wordmark">
          Sentinel
        </span>
        <button
          type="button"
          className="button-magnetic rounded-md border border-border bg-surface p-2 text-muted"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-64 flex-col border-r border-border bg-[#f7f7f2]">
            {nav}
          </aside>
        </div>
      ) : null}

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-[#eff1eb] lg:flex" data-reveal>
        {nav}
      </aside>
    </>
  );
}
