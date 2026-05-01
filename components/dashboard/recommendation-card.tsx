"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GameCard } from "@/components/dashboard/game-card";
import type { RecommendationDto } from "@/lib/types";

export function RecommendationCard({ recommendation }: { recommendation: RecommendationDto }) {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="absolute right-2.5 top-2.5 z-20">
        <Badge variant="amber">
          <Sparkles className="h-3 w-3" strokeWidth={2.4} />
          {Math.round(recommendation.score * 100)}% match
        </Badge>
      </div>
      <GameCard game={recommendation.game} reason={recommendation.reason} />
    </motion.div>
  );
}
