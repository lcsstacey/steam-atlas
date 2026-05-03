import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type SignalTone = "amber" | "violet" | "citrine" | "ember";

export const signalToneStyles: Record<SignalTone, CSSProperties> = {
  amber: {
    "--signal-a": "var(--brand)",
    "--signal-b": "var(--ember)",
    "--signal-c": "var(--brand-soft)",
  } as CSSProperties,
  violet: {
    "--signal-a": "var(--violet)",
    "--signal-b": "oklch(78% 0.1 280)",
    "--signal-c": "oklch(84% 0.07 280)",
  } as CSSProperties,
  citrine: {
    "--signal-a": "var(--citrine)",
    "--signal-b": "var(--brand)",
    "--signal-c": "oklch(90% 0.12 127)",
  } as CSSProperties,
  ember: {
    "--signal-a": "var(--ember)",
    "--signal-b": "var(--brand)",
    "--signal-c": "oklch(86% 0.08 38)",
  } as CSSProperties,
};

export function SignalMeter({
  value,
  tone = "amber",
  className,
  layers = false,
}: {
  value: number;
  tone?: SignalTone;
  className?: string;
  layers?: boolean;
}) {
  const clamped = Math.max(6, Math.min(100, value));

  if (layers) {
    return (
      <div aria-hidden="true" className={cn("signal-stack", className)} style={signalToneStyles[tone]}>
        {[clamped, Math.max(14, clamped - 24)].map((width, index) => (
          <div className="signal-rail" key={`${width}-${index}`}>
            <div className="signal-fill" style={{ width: `${width}%` }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={cn("signal-rail", className)} style={signalToneStyles[tone]}>
      <div className="signal-fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}
