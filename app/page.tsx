import type { CSSProperties } from "react";
import {
  ArrowRight,
  BarChart3,
  Dices,
  Eye,
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
import { SteamLoginButton } from "@/components/steam-login-button";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

type Tone = "amber" | "violet" | "citrine" | "ember";

const toneVars: Record<Tone, CSSProperties> = {
  amber: {
    "--signal-a": "#5db8ff",
    "--signal-b": "#ff8a5c",
    "--signal-c": "#dbe7f2",
  } as CSSProperties,
  violet: {
    "--signal-a": "#9a8cff",
    "--signal-b": "#c0b6ff",
    "--signal-c": "#e2dcff",
  } as CSSProperties,
  citrine: {
    "--signal-a": "#a3e635",
    "--signal-b": "#5db8ff",
    "--signal-c": "#f0f6c4",
  } as CSSProperties,
  ember: {
    "--signal-a": "#ff8a5c",
    "--signal-b": "#5db8ff",
    "--signal-c": "#ffd1b8",
  } as CSSProperties,
};

const featureCards: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  signal: number;
  tone: Tone;
}> = [
  {
    title: "Library Analytics",
    description: "Playtime, recency, backlog depth, and collection health — at a glance.",
    icon: BarChart3,
    signal: 88,
    tone: "amber",
  },
  {
    title: "Backlog Finder",
    description: "Surface games you own that deserve a real first session, not another shelf year.",
    icon: Library,
    signal: 72,
    tone: "violet",
  },
  {
    title: "Taste Profile",
    description: "Weighted signals from the games you actually play — not the ones you bought on sale.",
    icon: Radar,
    signal: 94,
    tone: "citrine",
  },
  {
    title: "Random Game Picker",
    description: "Controlled randomness for nights when choosing is the boss fight.",
    icon: Dices,
    signal: 64,
    tone: "ember",
  },
  {
    title: "Hidden Gems",
    description: "Low-playtime games that resemble your favorites by genre, tag, and pacing.",
    icon: Sparkles,
    signal: 81,
    tone: "amber",
  },
  {
    title: "Game Carousels",
    description: "Fast, visual rows for top played, retry picks, and comfort games.",
    icon: Flame,
    signal: 76,
    tone: "violet",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8" id="main-content">
      <div className="mx-auto max-w-7xl">
        <nav className="flex items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href="/">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-[#b6dfff] to-[#2a87d4] text-[#06121f] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_14px_-4px_rgba(93,184,255,0.5)]">
              <MapIcon className="h-4.5 w-4.5" strokeWidth={2.4} />
            </span>
            <span className="leading-tight">
              <span className="block text-[14px] font-semibold tracking-tight text-[var(--foreground)]">Steam Atlas</span>
              <span className="hidden text-[11px] text-[var(--muted)] sm:block">Library intelligence</span>
            </span>
          </Link>
          {user ? (
            <a className={cn(buttonClassName("secondary", "md"))} href="/dashboard">
              Open dashboard
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </a>
          ) : (
            <SteamLoginButton className="hidden sm:inline-flex" />
          )}
        </nav>

        {params.auth_error ? (
          <div className="mt-6 rounded-[12px] border border-[rgba(255,138,92,0.32)] bg-[rgba(255,138,92,0.08)] p-4 text-sm text-[#ffd1b8]">
            {params.auth_error}
          </div>
        ) : null}

        <section className="grid min-h-[calc(100vh-5rem)] items-center gap-12 py-14 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <Badge variant="amber">
              <Eye className="h-3 w-3" />
              Steam OpenID · server-side API
            </Badge>
            <h1 className="mt-6 max-w-3xl text-[44px] font-semibold leading-[1.04] tracking-tight text-[var(--foreground)] sm:text-[56px] lg:text-[64px]">
              Your Steam backlog,
              <br />
              <span className="bg-gradient-to-r from-[#b6dfff] via-[#5db8ff] to-[#ff8a5c] bg-clip-text text-transparent">
                turned into a decision engine.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-7 text-[var(--muted-strong)]">
              Steam Atlas reads the shape of your library and turns it into a calm command center —
              taste signals, backlog gems, retry picks, comfort games, and a next-play recommendation
              that actually explains itself.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {user ? (
                <a className={cn(buttonClassName("primary", "lg"))} href="/dashboard">
                  Open dashboard
                  <ArrowRight className="h-5 w-5" strokeWidth={2.2} />
                </a>
              ) : (
                <SteamLoginButton />
              )}
              <a className={cn(buttonClassName("secondary", "lg"))} href="#features">
                See features
              </a>
            </div>
            <div className="mt-7 flex items-start gap-2.5 text-[13px] leading-6 text-[var(--muted)]">
              <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--citrine)]" strokeWidth={2.2} />
              <span>
                Steam login only identifies your account and returns a SteamID64. This app never asks
                for your Steam password, and the API key stays on the backend.
              </span>
            </div>
          </div>

          <LandingShowcase />
        </section>

        <section className="pb-20" id="features">
          <div className="mb-8 max-w-2xl">
            <span className="mono-label">/ features</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
              Built for oversized libraries.
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-[var(--muted-strong)]">
              Steam Atlas focuses on games you already own, caches imports, and explains every
              recommendation as a read on your actual habits — not a generic score.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article
                  className="glass-panel lift-on-hover group relative overflow-hidden p-6 hover:border-[rgba(93,184,255,0.28)]"
                  key={feature.title}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="icon-crystal" style={toneVars[feature.tone]}>
                      <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                    </div>
                    <div className="text-right">
                      <span className="mono-label">0{index + 1}</span>
                      <div className="micro-bars mt-2.5 w-12" style={toneVars[feature.tone]}>
                        {[42, 76, 55, 92, 63].map((height, barIndex) => (
                          <span
                            key={`${feature.title}-${barIndex}`}
                            style={{ height: `${Math.max(18, (height + index * 7) % 100)}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold tracking-tight text-[var(--foreground)]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-6 text-[var(--muted-strong)]">{feature.description}</p>
                  <div className="signal-rail mt-6" style={toneVars[feature.tone]}>
                    <div className="signal-fill" style={{ width: `${feature.signal}%` }} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
