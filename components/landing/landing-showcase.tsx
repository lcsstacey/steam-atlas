"use client";

/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import { Activity, CheckCircle2, Clock, Play, Sparkles } from "lucide-react";

const games = [
  {
    name: "Hollow Knight",
    url: "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/header.jpg",
    hours: "2.4h",
    status: "Unplayed",
    score: 94,
    match: "Precise action",
  },
  {
    name: "Hades",
    url: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg",
    hours: "58h",
    status: "Comfort game",
    score: 88,
    match: "High replay",
  },
  {
    name: "Stardew Valley",
    url: "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg",
    hours: "141h",
    status: "All time",
    score: 82,
    match: "Loop mastery",
  },
  {
    name: "Celeste",
    url: "https://cdn.cloudflare.steamstatic.com/steam/apps/504230/header.jpg",
    hours: "0h",
    status: "Backlog gem",
    score: 79,
    match: "Taste overlap",
  },
  {
    name: "Disco Elysium",
    url: "https://cdn.cloudflare.steamstatic.com/steam/apps/632470/header.jpg",
    hours: "12h",
    status: "In progress",
    score: 91,
    match: "Narrative depth",
  },
];

export function LandingShowcase() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">

        {/* Left: game cards */}
        <div className="overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
            <span className="mono-label">/ tonight&apos;s shortlist</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(73%_0.17_72/25%)] bg-[oklch(73%_0.17_72/8%)] px-2.5 py-1 text-[11px] font-medium text-[var(--brand-soft)]">
              Preview
            </span>
          </div>

          {/* Horizontal scroll of game cards */}
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)]">
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--background)] to-transparent" />
            <motion.div
              animate={{ x: [0, -240, 0] }}
              className="flex gap-0"
              transition={{ duration: 20, ease: "easeInOut", repeat: Infinity }}
            >
              {[...games, ...games].map((game, i) => (
                <div
                  key={`${game.name}-${i}`}
                  className="relative w-48 shrink-0 border-r border-[var(--line)] last:border-r-0"
                >
                  <div className="relative h-28 overflow-hidden">
                    <img
                      alt=""
                      className="h-full w-full object-cover"
                      decoding="async"
                      loading="lazy"
                      src={game.url}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-black/30 to-transparent" />
                    <div className="absolute bottom-2.5 left-3 right-3">
                      <span className="mono-label text-[var(--brand)] opacity-75">{game.match}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-semibold leading-tight text-[var(--foreground)]">
                        {game.name}
                      </span>
                      <span className="mt-0.5 shrink-0 text-[11px] font-semibold text-[var(--brand)]">
                        {game.score}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-[var(--muted)]" strokeWidth={2} />
                      <span className="text-[11px] text-[var(--muted)]">{game.hours}</span>
                      <span className="ml-1 text-[11px] text-[var(--muted-strong)]">{game.status}</span>
                    </div>
                    {/* slim signal bar */}
                    <div className="signal-rail mt-3">
                      <div className="signal-fill" style={{ width: `${game.score}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Stat row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Library", value: "612 games" },
              { label: "Never played", value: "188" },
              { label: "Hours logged", value: "4,920" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3"
              >
                <span className="mono-label block">{stat.label}</span>
                <span className="mt-1.5 block text-[18px] font-semibold tracking-tight text-[var(--foreground)]">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: recommendation card */}
        <motion.div
          className="flex flex-col"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <span className="mono-label mb-4">/ next play</span>

          {/* Hero game art */}
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)]">
            <div className="relative h-44 overflow-hidden">
              <img
                alt="Hollow Knight"
                className="h-full w-full object-cover"
                decoding="async"
                loading="lazy"
                src="https://cdn.cloudflare.steamstatic.com/steam/apps/367520/header.jpg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="text-[13px] font-semibold text-[var(--foreground)]">Hollow Knight</span>
              </div>
              <div className="absolute right-3 top-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(73%_0.17_72/90%)] px-2.5 py-1 text-[11px] font-semibold text-[oklch(7.5%_0.008_52)]">
                  <Play className="h-2.5 w-2.5" strokeWidth={2.5} />
                  Tonight
                </span>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--brand-soft)]">
                <Sparkles className="h-3 w-3" strokeWidth={2.2} />
                Personal read
              </div>
              <p className="mt-2 text-[13px] leading-[1.6] text-[var(--muted-strong)]">
                Your library says you stick with precise action games. This one is still in
                the sweet spot between familiar and neglected.
              </p>

              <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-4">
                {[
                  { icon: Activity, label: "Taste match", value: "94 / 100" },
                  { icon: Clock,    label: "Playtime",     value: "2.4h" },
                  { icon: CheckCircle2, label: "Status",   value: "In backlog" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-1.5 text-[var(--muted)]">
                      <Icon className="h-3 w-3" strokeWidth={2} />
                      {label}
                    </span>
                    <span className="font-medium text-[var(--foreground)]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
