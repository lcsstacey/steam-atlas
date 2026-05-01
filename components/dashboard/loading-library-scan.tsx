"use client";

import { motion } from "framer-motion";
import { Database, Fingerprint, Radar, Search, Sparkles } from "lucide-react";
import { SignalMeter } from "@/components/ui/signal-meter";

export function LoadingLibraryScan() {
  const steps = [
    { label: "Reading Steam profile", icon: Fingerprint },
    { label: "Importing playtime", icon: Database },
    { label: "Scoring taste signals", icon: Radar },
  ];

  return (
    <div className="glass-panel premium-ring relative overflow-hidden p-8">
      <div className="pointer-events-none absolute inset-0 ambient-grid opacity-30" />
      <div className="relative flex items-center gap-4">
        <div className="icon-crystal">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3.6, ease: "linear", repeat: Infinity }}
          >
            <Search className="h-5 w-5" strokeWidth={2.2} />
          </motion.div>
        </div>
        <div>
          <div className="mono-label flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" strokeWidth={2.4} />
            Library scan in motion
          </div>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Finding the signal in the shelf
          </h2>
          <p className="mt-1 text-[14px] text-[var(--muted-strong)]">
            Steam data is becoming playtime, backlog, and taste intelligence.
          </p>
        </div>
      </div>
      <SignalMeter className="relative mt-7" layers tone="amber" value={78} />
      <div className="relative mt-6 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              animate={{ opacity: [0.45, 0.95, 0.45] }}
              className="rounded-[14px] border border-[var(--line)] bg-white/[0.025] p-4"
              key={step.label}
              transition={{ duration: 1.8, delay: index * 0.2, repeat: Infinity }}
            >
              <Icon className="h-4 w-4 text-[var(--brand)]" strokeWidth={2.2} />
              <div className="shimmer-line mt-7 h-1.5 w-2/3 rounded-full bg-white/[0.08]" />
              <p className="mt-3 text-[12px] text-[var(--muted-strong)]">{step.label}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
