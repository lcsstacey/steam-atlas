import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type SignalTone = "amber" | "violet" | "citrine" | "ember";

export const signalToneStyles: Record<SignalTone, CSSProperties> = {
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
