"use client";

/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import { Activity, Play, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SignalMeter, type SignalTone, signalToneStyles } from "@/components/ui/signal-meter";

const mockGames = [
  {
    name: "Hollow Knight",
    url: "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/header.jpg",
    hours: "2.4h",
    score: 94,
    tone: "amber",
  },
  {
    name: "Hades",
    url: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg",
    hours: "58h",
    score: 88,
    tone: "ember",
  },
  {
    name: "Stardew Valley",
    url: "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg",
    hours: "141h",
    score: 82,
    tone: "citrine",
  },
  {
    name: "Celeste",
    url: "https://cdn.cloudflare.steamstatic.com/steam/apps/504230/header.jpg",
    hours: "0h",
    score: 79,
    tone: "violet",
  },
];

export function LandingShowcase() {
  return (
    <motion.section
      className="glass-panel premium-ring relative overflow-hidden p-5"
      initial={{ opacity: 0, y: 24, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="relative rounded-[14px] border border-[var(--line)] bg-[#06101a]/85 p-5">
        <div className="pointer-events-none absolute inset-0 ambient-grid opacity-30" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[rgba(93,184,255,0.12)] blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <span className="mono-label">library signal</span>
            <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-[var(--foreground)]">
              Tonight&apos;s shortlist
            </h2>
          </div>
          <Badge variant="amber">Preview</Badge>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["Games", "612", "from Steam API"],
            ["Never played", "188", "backlog pressure"],
            ["Total hours", "4,920", "taste signal"],
          ].map(([label, value, detail], index) => (
            <motion.div
              className="rounded-[12px] border border-[var(--line)] bg-white/[0.03] p-3.5"
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + index * 0.06 }}
            >
              <p className="mono-label">{label}</p>
              <p className="mt-2 text-[22px] font-semibold tracking-tight text-[var(--foreground)]">{value}</p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">{detail}</p>
              <SignalMeter
                className="mt-3"
                tone={index === 0 ? "amber" : index === 1 ? "violet" : "citrine"}
                value={index === 0 ? 82 : index === 1 ? 58 : 94}
              />
            </motion.div>
          ))}
        </div>

        <div className="relative mt-5 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#06101a] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#06101a] to-transparent" />
          <motion.div
            animate={{ x: [0, -200, 0] }}
            className="flex w-max gap-3"
            transition={{ duration: 16, ease: "easeInOut", repeat: Infinity }}
          >
            {[...mockGames, ...mockGames].map((game, index) => (
              <div
                className="w-48 overflow-hidden rounded-[12px] border border-[var(--line)] bg-white/[0.03]"
                key={`${game.name}-${index}`}
              >
                <div className="relative h-24 overflow-hidden">
                  <img alt="" className="h-full w-full object-cover" src={game.url} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <Badge className="absolute bottom-2 left-2" variant={game.hours === "0h" ? "amber" : "teal"}>
                    {game.hours}
                  </Badge>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold text-[var(--foreground)]">{game.name}</span>
                    <span className="mono-label" style={{ color: "var(--brand)" }}>{game.score}</span>
                  </div>
                  <SignalMeter className="mt-3" tone={game.tone as SignalTone} value={game.score} />
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="relative mt-5 rounded-[14px] border border-[rgba(93,184,255,0.28)] bg-[rgba(93,184,255,0.07)] p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#a3d9ff]">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
            Personal read
          </div>
          <p className="mt-2 text-[14px] leading-6 text-[var(--muted-strong)]">
            Try Hollow Knight tonight. Your library says you stick with precise action games, and
            this one is still in the sweet spot between familiar and neglected.
          </p>
          <div className="mt-3 flex items-center gap-3 text-[12px] text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-[var(--citrine)]" strokeWidth={2.4} />
              Taste 94
            </span>
            <span className="text-[var(--line-strong)]">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Play className="h-3 w-3 text-[var(--brand)]" strokeWidth={2.4} />
              Low commitment
            </span>
          </div>
          <div className="micro-bars absolute right-4 top-4 w-14" style={signalToneStyles.amber}>
            {[35, 78, 52, 92, 46, 68].map((height, index) => (
              <span key={`${height}-${index}`} style={{ height: `${height}%` }} />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
