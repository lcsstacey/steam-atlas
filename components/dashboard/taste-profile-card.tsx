import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import type { TasteSignal } from "@/lib/types";

export function TasteProfileCard({ signals }: { signals: TasteSignal[] }) {
  return (
    <Panel className="overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[rgba(93,184,255,0.1)] blur-3xl" />
      <p className="relative mono-label">You seem to like</p>
      <h2 className="relative mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {signals.slice(0, 3).map((signal) => signal.label).join(", ") || "building a backlog"}
      </h2>
      <p className="relative mt-3 text-[14px] leading-6 text-[var(--muted-strong)]">
        This profile is weighted by what you actually gave time to — not just what you bought once
        during a sale.
      </p>
      <div className="relative mt-5 flex flex-wrap gap-1.5">
        {signals.slice(0, 10).map((signal, index) => (
          <Badge key={signal.label} variant={index % 3 === 0 ? "teal" : index % 3 === 1 ? "amber" : "lime"}>
            {signal.label}
          </Badge>
        ))}
      </div>
    </Panel>
  );
}
