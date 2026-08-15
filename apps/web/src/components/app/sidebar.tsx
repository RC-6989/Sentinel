"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { useState } from "react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/agents", label: "Agents", icon: Bot, soon: true },
  { href: "/app/tools", label: "Tools", icon: Wrench, soon: true },
  { href: "/app/policies", label: "Policies", icon: ScrollText, soon: true },
  { href: "/app/approvals", label: "Approvals", icon: CheckSquare, soon: true },
  { href: "/app/activity", label: "Activity", icon: Activity, soon: true },
  { href: "/app/security", label: "Security", icon: Shield, soon: true },
  { href: "/app/incidents", label: "Incidents", icon: AlertTriangle, soon: true },
  { href: "/app/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar({
  orgName,
  orgSlug,
  userName,
  userEmail,
}: {
  orgName: string;
  orgSlug: string;
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <>
      <div className="border-b border-border px-4 py-4">
        <Link href="/" className="font-display text-sm font-bold tracking-tight">
          Sentinel
        </Link>
        <div className="mt-3">
          <p className="truncate text-sm font-medium">{orgName}</p>
          <p className="truncate font-mono text-[11px] text-muted">{orgSlug}</p>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 font-mono text-[10px] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
          development
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-2" aria-label="Primary">
        {NAV.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-white/5 text-foreground"
                  : "text-muted hover:bg-white/[0.03] hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1">{item.label}</span>
              {"soon" in item && item.soon ? (
                <span className="font-mono text-[10px] text-muted">soon</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <p className="truncate text-sm">{userName}</p>
        <p className="truncate text-xs text-muted">{userEmail}</p>
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
      <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
        <span className="font-display text-sm font-bold tracking-tight">
          Sentinel
        </span>
        <button
          type="button"
          className="rounded-md border border-border p-2 text-muted"
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
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-64 flex-col border-r border-border bg-[#0a0c10]">
            {nav}
          </aside>
        </div>
      ) : null}

      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-[#0a0c10] lg:flex">
        {nav}
      </aside>
    </>
  );
}
