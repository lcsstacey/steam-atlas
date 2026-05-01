"use client";

/* eslint-disable @next/next/no-img-element */
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Download, EyeOff, Play, Shuffle, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignalMeter, type SignalTone } from "@/components/ui/signal-meter";
import type { LibraryGame } from "@/lib/types";
import { cn, formatMinutes } from "@/lib/utils";

type ManualStatus =
  | "INSTALLED"
  | "WANT_TO_INSTALL"
  | "PLAY_NEXT"
  | "FINISHED"
  | "DROPPED"
  | "NOT_INTERESTED";

const statusLabels: Record<ManualStatus, string> = {
  INSTALLED: "Installed",
  WANT_TO_INSTALL: "Want to install",
  PLAY_NEXT: "Play next",
  FINISHED: "Finished",
  DROPPED: "Dropped",
  NOT_INTERESTED: "Hidden",
};

export function GameCard({
  game,
  reason,
  compact = false,
  onStatusChange,
}: {
  game: LibraryGame;
  reason?: string;
  compact?: boolean;
  onStatusChange?: (gameId: string, status: ManualStatus | null) => void;
}) {
  const [pending, setPending] = useState<ManualStatus | null>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 200, damping: 28 });
  const smoothY = useSpring(pointerY, { stiffness: 200, damping: 28 });
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-3.5, 3.5]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [3.5, -3.5]);
  const playtimeScore = Math.min(100, Math.max(8, (game.playtimeMinutes / 3000) * 100));
  const statusTone = getStatusTone(game);
  const signalTone = getSignalTone(game);

  async function setStatus(status: ManualStatus | null) {
    setPending(status);
    const response = await fetch(`/api/user-games/${game.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPending(null);

    if (response.ok) {
      onStatusChange?.(game.id, status);
    }
  }

  return (
    <motion.article
      className="group relative overflow-hidden rounded-[16px] border border-[var(--line)] bg-[#0a1421] shadow-[0_12px_36px_-18px_rgba(0,0,0,0.7)] transition-colors hover:border-[rgba(93,184,255,0.32)]"
      onMouseLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
        pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
      }}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
    >
      <div className="pointer-events-none absolute inset-0 z-10 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(93,184,255,0.6)] to-transparent" />
      </div>

      <div className={cn("relative overflow-hidden bg-[#07101a]", compact ? "h-28" : "h-40")}>
        {game.headerUrl ? (
          <img
            alt={`${game.name} cover art`}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]"
            loading="lazy"
            decoding="async"
            src={game.headerUrl}
          />
        ) : (
          <div
            aria-label={`No cover art for ${game.name}`}
            className="grid h-full place-items-center bg-gradient-to-br from-[#0d1828] to-[#07101a] text-[12px] text-[var(--muted)]"
            role="img"
          >
            No art
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        <div className="absolute left-2.5 top-2.5">
          <Badge variant={statusTone}>
            <Sparkles className="h-3 w-3" strokeWidth={2.4} />
            {getPlayState(game)}
          </Badge>
        </div>

        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <Badge variant={game.playtimeMinutes === 0 ? "amber" : "teal"}>
            {formatMinutes(game.playtimeMinutes)}
          </Badge>
          {game.manualStatus ? (
            <Badge className="max-w-32 truncate">{statusLabels[game.manualStatus]}</Badge>
          ) : null}
        </div>
      </div>

      <div className="relative p-4">
        <SignalMeter className="mb-3" tone={signalTone} value={playtimeScore} />
        <h3 className="line-clamp-2 min-h-[40px] text-[14px] font-semibold leading-5 tracking-tight text-[var(--foreground)]">
          {game.name}
        </h3>
        {reason ? (
          <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-[var(--muted-strong)]">{reason}</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[...game.genres, ...game.tags, ...game.categories].slice(0, 2).map((label) => (
              <span
                className="rounded-full border border-[var(--line)] bg-white/[0.04] px-2 py-0.5 text-[11px] text-[var(--muted)]"
                key={label}
              >
                {label}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3.5 flex items-center gap-1.5">
          <Button
            aria-label="Mark play next"
            disabled={pending === "PLAY_NEXT"}
            onClick={() => setStatus("PLAY_NEXT")}
            size="icon"
            title="Play next"
            variant="secondary"
          >
            <Play className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Button>
          <Button
            aria-label="Mark installed"
            disabled={pending === "INSTALLED"}
            onClick={() => setStatus("INSTALLED")}
            size="icon"
            title="Mark installed"
            variant="secondary"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Button>
          <Button
            aria-label="Hide game"
            disabled={pending === "NOT_INTERESTED"}
            onClick={() => setStatus("NOT_INTERESTED")}
            size="icon"
            title="Hide"
            variant="secondary"
          >
            <EyeOff className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Button>
          <Button
            aria-label="Surprise me similar"
            onClick={() => window.location.assign(`/recommendations?similar=${game.appId}`)}
            size="icon"
            title="Surprise me similar"
            variant="ghost"
          >
            <Shuffle className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

function getSignalTone(game: LibraryGame): SignalTone {
  if (game.manualStatus === "PLAY_NEXT" || game.playtimeTwoWeeksMinutes > 0) return "citrine";
  if (game.manualStatus === "NOT_INTERESTED" || game.manualStatus === "DROPPED") return "ember";
  if (game.playtimeMinutes === 0 || game.playtimeMinutes < 60) return "amber";
  return "violet";
}

function getStatusTone(game: LibraryGame): "teal" | "amber" | "rose" | "lime" {
  if (game.manualStatus === "PLAY_NEXT" || game.playtimeTwoWeeksMinutes > 0) return "lime";
  if (game.manualStatus === "NOT_INTERESTED" || game.manualStatus === "DROPPED") return "rose";
  if (game.playtimeMinutes === 0 || game.playtimeMinutes < 60) return "amber";
  return "teal";
}

function getPlayState(game: LibraryGame) {
  if (game.manualStatus === "PLAY_NEXT") return "Queued";
  if (game.playtimeTwoWeeksMinutes > 0) return "Active";
  if (game.playtimeMinutes === 0) return "Unopened";
  if (game.playtimeMinutes < 60) return "First look";
  if (game.playtimeMinutes >= 1200) return "Favorite";
  return "Played";
}
