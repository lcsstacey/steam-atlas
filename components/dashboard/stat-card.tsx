"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { SignalMeter, type SignalTone, signalToneStyles } from "@/components/ui/signal-meter";
import { cn } from "@/lib/utils";

const accentMap = {
  teal: { tone: "violet", glow: "rgba(154,140,255,0.18)" },
  amber: { tone: "amber", glow: "rgba(93,184,255,0.22)" },
  rose: { tone: "ember", glow: "rgba(255,138,92,0.18)" },
  lime: { tone: "citrine", glow: "rgba(163,230,53,0.16)" },
} as const satisfies Record<string, { tone: SignalTone; glow: string }>;

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = "teal",
  index = 0,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  accent?: keyof typeof accentMap;
  index?: number;
}) {
  const { tone, glow } = accentMap[accent];
  const meterValue = 62 + ((index * 11) % 30);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel lift-on-hover relative overflow-hidden p-5"
      transition={{ delay: index * 0.05, duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl"
        style={{ background: glow }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mono-label">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-[34px]">
            {value}
          </p>
          <p className={cn("mt-1.5 text-[13px] leading-5 text-[var(--muted)]")}>{detail}</p>
        </div>
        <div className="icon-crystal" style={signalToneStyles[tone]}>
          <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
        </div>
      </div>
      <SignalMeter className="relative mt-5" tone={tone} value={meterValue} />
    </motion.div>
  );
}
