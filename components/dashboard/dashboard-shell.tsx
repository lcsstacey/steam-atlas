"use client";

import { BarChart3, Library, LogOut, Map as MapIcon, Radar, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { UserProfileHeader } from "@/components/dashboard/user-profile-header";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",       label: "Overview",        icon: BarChart3 },
  { href: "/library",         label: "Library",         icon: Library   },
  { href: "/recommendations", label: "Recommendations", icon: Sparkles  },
  { href: "/insights",        label: "Insights",        icon: Radar     },
];

export function DashboardShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", redirect: "manual" });
    window.location.assign("/");
  }

  return (
    <div className="relative min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[210px_minmax(0,1fr)]">

        {/* Sidebar */}
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] flex-col rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-3.5 lg:flex">

          {/* Wordmark */}
          <a className="flex items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-2.5" href="/dashboard">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--brand)] text-[oklch(7.5%_0.008_52)] shadow-[0_3px_10px_-3px_oklch(73%_0.17_72/45%)]">
              <MapIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
            </span>
            <span className="leading-tight">
              <span className="block text-[13px] font-semibold tracking-tight text-[var(--foreground)]">Steam Atlas</span>
              <span className="block text-[10px] text-[var(--muted)]">Library intelligence</span>
            </span>
          </a>

          {/* Nav */}
          <nav className="mt-5 flex-1 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <a
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-[oklch(73%_0.17_72/12%)] text-[var(--foreground)] ring-1 ring-inset ring-[oklch(73%_0.17_72/20%)]"
                      : "text-[var(--muted-strong)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active
                        ? "text-[var(--brand)]"
                        : "text-[var(--muted)] group-hover:text-[var(--foreground)]",
                    )}
                    strokeWidth={2}
                  />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Sign out */}
          <button
            className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-transparent px-3 py-2 text-[12px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
            onClick={logout}
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
            Sign out
          </button>
        </aside>

        {/* Main content */}
        <main className="min-w-0 space-y-5" id="main-content">
          {/* Mobile nav */}
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <a className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]" href="/dashboard">
              <span className="grid h-7 w-7 place-items-center rounded-[var(--radius-sm)] bg-[var(--brand)] text-[oklch(7.5%_0.008_52)]">
                <MapIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
              </span>
              Steam Atlas
            </a>
            <div className="flex gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <a
                    aria-current={active ? "page" : undefined}
                    aria-label={item.label}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-[var(--radius-md)] border transition-colors",
                      active
                        ? "border-[oklch(73%_0.17_72/28%)] bg-[oklch(73%_0.17_72/12%)] text-[var(--foreground)]"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted-strong)] hover:bg-[var(--surface-strong)]",
                    )}
                    href={item.href}
                    key={item.href}
                    title={item.label}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </a>
                );
              })}
              <button
                aria-label="Sign out"
                className="grid h-8 w-8 place-items-center rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] text-[var(--muted-strong)] transition-colors hover:bg-[var(--surface-strong)]"
                onClick={logout}
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>

          <UserProfileHeader user={user} />
          {children}
        </main>
      </div>
    </div>
  );
}
