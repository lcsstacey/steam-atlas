"use client";

import { Calendar } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

const PALETTE = ["#5db8ff", "#a3e635", "#ff8a5c", "#9a8cff", "#dbe7f2"];

const tooltipStyle = {
  background: "rgba(13, 24, 40, 0.95)",
  border: "1px solid rgba(180, 210, 240, 0.14)",
  borderRadius: 10,
  color: "#e6eef7",
  fontSize: 12,
  padding: "8px 10px",
  boxShadow: "0 12px 28px -10px rgba(0,0,0,0.6)",
} as const;

export function PhaseTimelinePanel({
  data,
}: {
  data: { topGenres: string[]; series: Array<Record<string, string | number>> };
}) {
  const hasData = data.series.length > 1 && data.topGenres.length > 0;

  return (
    <Panel className="overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[rgba(93,184,255,0.1)] blur-3xl" />

      <Badge variant="amber">
        <Calendar className="h-3 w-3" strokeWidth={2.4} />
        Phase timeline
      </Badge>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        Your gaming phases by quarter.
      </h2>
      <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[var(--muted-strong)]">
        Stacked counts of last-played games by their genre, bucketed by quarter. Useful for
        remembering &quot;oh right, that was my roguelike summer.&quot;
      </p>

      {hasData ? (
        <div className="mt-5 h-72">
          <ResponsiveContainer>
            <AreaChart data={data.series} margin={{ top: 10, right: 12, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="rgba(180, 210, 240, 0.06)" vertical={false} />
              <XAxis
                dataKey="quarter"
                stroke="#7a8a9c"
                tick={{ fontSize: 11, fill: "#aab8c8" }}
              />
              <YAxis stroke="#7a8a9c" tick={{ fontSize: 11, fill: "#aab8c8" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                iconType="circle"
                wrapperStyle={{
                  fontSize: 12,
                  color: "#aab8c8",
                  paddingTop: 4,
                }}
              />
              {data.topGenres.map((genre, index) => (
                <Area
                  dataKey={genre}
                  fill={PALETTE[index % PALETTE.length]}
                  fillOpacity={0.32}
                  key={genre}
                  stackId="1"
                  stroke={PALETTE[index % PALETTE.length]}
                  strokeWidth={1.5}
                  type="monotone"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-6 rounded-[14px] border border-dashed border-[var(--line-strong)] bg-white/[0.02] p-6 text-center text-[13px] text-[var(--muted)]">
          Need at least two quarters of last-played activity and some genre metadata before phases
          show up.
        </p>
      )}
    </Panel>
  );
}
