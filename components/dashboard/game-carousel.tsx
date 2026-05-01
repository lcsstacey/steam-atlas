"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/dashboard/game-card";
import type { LibraryGame } from "@/lib/types";

export function GameCarousel({
  title,
  description,
  games,
}: {
  title: string;
  description?: string;
  games: LibraryGame[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    ref.current?.scrollBy({
      left: direction === "left" ? -360 : 360,
      behavior: "smooth",
    });
  }

  if (games.length === 0) return null;

  return (
    <section className="relative space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h2>
            <span className="mono-label rounded-full border border-[var(--line)] bg-white/[0.04] px-2 py-0.5">
              {games.length} picks
            </span>
          </div>
          {description ? (
            <p className="mt-1 max-w-2xl text-[13px] text-[var(--muted)]">{description}</p>
          ) : null}
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button aria-label="Scroll left" onClick={() => scroll("left")} size="icon" variant="secondary">
            <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
          </Button>
          <Button aria-label="Scroll right" onClick={() => scroll("right")} size="icon" variant="secondary">
            <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
          </Button>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 top-16 z-10 hidden w-12 bg-gradient-to-r from-[#07101a] to-transparent lg:block" />
      <div className="pointer-events-none absolute bottom-0 right-0 top-16 z-10 hidden w-12 bg-gradient-to-l from-[#07101a] to-transparent lg:block" />
      <motion.div
        className="hide-scrollbar flex snap-x gap-4 overflow-x-auto pb-3 pt-2"
        ref={ref}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.04 } },
        }}
      >
        {games.map((game) => (
          <motion.div
            className="w-60 shrink-0 snap-start"
            key={game.id}
            variants={{
              hidden: { opacity: 0, x: 24 },
              visible: { opacity: 1, x: 0 },
            }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <GameCard compact game={game} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
