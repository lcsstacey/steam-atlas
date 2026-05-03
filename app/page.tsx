import {
  ArrowRight,
  BarChart3,
  Dices,
  Flame,
  Library,
  LockKeyhole,
  Map as MapIcon,
  Radar,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { LandingShowcase } from "@/components/landing/landing-showcase";
import { SpatialBackgroundClient } from "@/components/landing/spatial-background-client";
import { SteamLoginButton } from "@/components/steam-login-button";
import { buttonClassName } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const featureItems: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Library Analytics",
    description:
      "Playtime, recency, backlog depth, and collection health. Not a vanity dashboard — a working picture of your library.",
    icon: BarChart3,
  },
  {
    title: "Backlog Finder",
    description:
      "Surfaces games you own that deserve a real first session, not another shelf year. Sorted by taste overlap.",
    icon: Library,
  },
  {
    title: "Taste Profile",
    description:
      "Weighted signals from the games you actually return to — not the ones you bought on sale and never launched.",
    icon: Radar,
  },
  {
    title: "Random Picker",
    description:
      "Controlled randomness for nights when choosing is the boss fight. Filters by status and playtime.",
    icon: Dices,
  },
  {
    title: "Hidden Gems",
    description:
      "Low-playtime games that resemble your favorites by genre, tag, and pacing. Owned but overlooked.",
    icon: Sparkles,
  },
  {
    title: "Game Carousels",
    description:
      "Fast visual rows for top played, retry picks, and comfort games. One glance, full picture.",
    icon: Flame,
  },
];

const statPills = [
  { label: "Games imported", value: "full library" },
  { label: "Recommendations", value: "explained" },
  { label: "Session data", value: "server-side only" },
  { label: "Password required", value: "never" },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  return (
    <main className="relative overflow-hidden" id="main-content">
      <SpatialBackgroundClient />

      {/* ── Nav ── */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link className="flex items-center gap-2.5" href="/">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--brand)] text-[oklch(7.5%_0.008_52)] shadow-[0_4px_12px_-4px_oklch(73%_0.17_72/50%)]">
            <MapIcon className="h-4 w-4" strokeWidth={2.6} />
          </span>
          <span className="text-[14px] font-semibold tracking-tight text-[var(--foreground)]">
            Steam Atlas
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden text-[12px] text-[var(--muted)] sm:block">Library intelligence</span>
          {user ? (
            <a className={cn(buttonClassName("primary", "sm"))} href="/dashboard">
              Dashboard
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.3} />
            </a>
          ) : (
            <SteamLoginButton className="hidden sm:inline-flex" />
          )}
        </div>
      </header>

      {params.auth_error ? (
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
          <div className="rounded-[var(--radius-md)] border border-[oklch(70%_0.145_38/30%)] bg-[oklch(70%_0.145_38/8%)] p-4 text-[13px] text-[oklch(82%_0.07_38)]">
            {params.auth_error}
          </div>
        </div>
      ) : null}

      {/* ── Hero ── */}
      <section className="relative z-10 px-5 pb-16 pt-16 sm:px-8 sm:pt-24 lg:pt-32">
        <div className="mx-auto max-w-7xl">

          <p className="mono-label mb-6 text-[var(--brand)] opacity-70">
            / Steam library intelligence
          </p>

          <h1 className="max-w-5xl text-[clamp(2.75rem,7vw,6rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-[var(--foreground)]">
            Your backlog
            <br />
            has a&nbsp;
            <span className="text-[var(--brand)]">shape.</span>
          </h1>

          <div className="mt-8 max-w-2xl">
            <p className="text-[clamp(1rem,1.8vw,1.2rem)] leading-[1.6] text-[var(--muted-strong)]">
              Steam Atlas reads how you actually play — playtime, recency, genre overlap,
              and forgotten shelf games — then surfaces a recommendation that explains itself.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {user ? (
              <a className={cn(buttonClassName("primary", "lg"))} href="/dashboard">
                Open dashboard
                <ArrowRight className="h-5 w-5" strokeWidth={2.2} />
              </a>
            ) : (
              <SteamLoginButton />
            )}
            <a
              className={cn(
                buttonClassName("secondary", "lg"),
                "border border-[var(--line-strong)] bg-transparent text-[var(--muted-strong)] hover:border-[oklch(73%_0.17_72/35%)] hover:bg-[var(--brand-dim)] hover:text-[var(--foreground)]",
              )}
              href="#features"
            >
              How it works
            </a>
          </div>

          <div className="mt-7 flex items-start gap-2 text-[12px] leading-5 text-[var(--muted)]">
            <LockKeyhole className="mt-0.5 h-3 w-3 shrink-0 text-[var(--citrine)]" strokeWidth={2.2} />
            <span>
              Steam login returns only a SteamID64. No password, no tokens stored, API key stays server-side.
            </span>
          </div>
        </div>
      </section>

      {/* ── Stat pills ── */}
      <div className="relative z-10 border-y border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-7xl items-center gap-0 overflow-x-auto px-5 sm:px-8">
          {statPills.map((pill, i) => (
            <div
              key={pill.label}
              className={cn(
                "flex shrink-0 items-center gap-3 py-3.5 pr-8",
                i > 0 && "border-l border-[var(--line)] pl-8",
              )}
            >
              <span className="mono-label shrink-0">{pill.label}</span>
              <span className="text-[13px] font-semibold text-[var(--brand)]">{pill.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Full-width showcase ── */}
      <div className="relative z-10 border-b border-[var(--line)]">
        <LandingShowcase />
      </div>

      {/* ── Feature catalog ── */}
      <section className="relative z-10 px-5 py-20 sm:px-8 lg:py-28" id="features">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex flex-col gap-3 border-b border-[var(--line)] pb-10 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-semibold tracking-tight text-[var(--foreground)]">
              Everything in the atlas.
            </h2>
            <p className="max-w-[40ch] text-[14px] leading-6 text-[var(--muted)] sm:text-right">
              Six views into your library. Each explains its own output.
            </p>
          </div>

          <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
            {featureItems.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative bg-[var(--background)] p-8 transition-colors hover:bg-[var(--surface)]"
                >
                  <div className="mb-6 flex items-start justify-between">
                    <span className="mono-label text-[var(--brand)] opacity-50">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon
                      className="h-[18px] w-[18px] text-[var(--muted)] transition-colors duration-200 group-hover:text-[var(--brand)]"
                      strokeWidth={1.8}
                    />
                  </div>
                  <h3 className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.7] text-[var(--muted-strong)]">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-14 flex flex-col items-center gap-4 text-center">
            <p className="text-[15px] text-[var(--muted-strong)]">
              Import takes under a minute. Your library, decoded.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {user ? (
                <a className={cn(buttonClassName("primary", "lg"))} href="/dashboard">
                  Open your atlas
                  <ArrowRight className="h-5 w-5" strokeWidth={2.2} />
                </a>
              ) : (
                <SteamLoginButton />
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-[var(--line)] px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <span className="text-[12px] text-[var(--muted)]">Steam Atlas</span>
          <span className="text-[12px] text-[var(--muted)]">
            Not affiliated with Valve Corporation.
          </span>
        </div>
      </footer>
    </main>
  );
}
