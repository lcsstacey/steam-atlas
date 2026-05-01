"use client";

import { BarChart3, Compass, Library, LogOut, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { UserProfileHeader } from "@/components/dashboard/user-profile-header";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/library", label: "Library", icon: Library },
  { href: "/recommendations", label: "Recommendations", icon: Sparkles },
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
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="glass-panel sticky top-4 hidden h-[calc(100vh-2rem)] flex-col p-4 lg:flex">
          <a className="flex items-center gap-3 px-1.5" href="/dashboard">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-[#b6dfff] to-[#2a87d4] text-[#06121f] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_14px_-4px_rgba(93,184,255,0.5)]">
              <Compass className="h-4.5 w-4.5" strokeWidth={2.4} />
            </span>
            <span className="leading-tight">
              <span className="block text-[13px] font-semibold tracking-tight text-[var(--foreground)]">Steam Compass</span>
              <span className="block text-[11px] text-[var(--muted)]">Library intelligence</span>
            </span>
          </a>

          <nav className="mt-7 flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <a
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-[rgba(93,184,255,0.1)] text-[var(--foreground)] shadow-[inset_0_0_0_1px_rgba(93,184,255,0.22)]"
                      : "text-[var(--muted-strong)] hover:bg-white/[0.05] hover:text-[var(--foreground)]",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      active ? "text-[var(--brand)]" : "text-[var(--muted)] group-hover:text-[var(--foreground)]",
                    )}
                    strokeWidth={2.2}
                  />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <button
            className="flex items-center gap-2.5 rounded-[10px] border border-transparent px-3 py-2 text-[13px] font-medium text-[var(--muted)] transition hover:bg-white/[0.05] hover:text-[var(--foreground)]"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" strokeWidth={2.2} />
            Sign out
          </button>
        </aside>

        <main className="min-w-0 space-y-6" id="main-content">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <a className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]" href="/dashboard">
              <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-br from-[#b6dfff] to-[#2a87d4] text-[#06121f]">
                <Compass className="h-4 w-4" strokeWidth={2.4} />
              </span>
              Steam Compass
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
                      "grid h-9 w-9 place-items-center rounded-[10px] border transition-colors",
                      active
                        ? "border-[rgba(93,184,255,0.32)] bg-[rgba(93,184,255,0.1)] text-[var(--foreground)]"
                        : "border-[var(--line)] bg-white/[0.03] text-[var(--muted-strong)] hover:bg-white/[0.06]",
                    )}
                    href={item.href}
                    key={item.href}
                    title={item.label}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </a>
                );
              })}
              <button
                aria-label="Sign out"
                className="grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--line)] bg-white/[0.03] text-[var(--muted-strong)] transition-colors hover:bg-white/[0.06]"
                onClick={logout}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" strokeWidth={2.2} />
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
