"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel } from "@/components/ui/panel";
import type { TasteSignal } from "@/lib/types";

const colors = ["#5db8ff", "#ff8a5c", "#a3e635", "#9a8cff", "#dbe7f2"];

const tooltipStyle = {
  background: "rgba(13, 24, 40, 0.95)",
  border: "1px solid rgba(180, 210, 240, 0.14)",
  borderRadius: 10,
  color: "#e6eef7",
  fontSize: 12,
  padding: "8px 10px",
  boxShadow: "0 12px 28px -10px rgba(0,0,0,0.6)",
} as const;

export function PlaytimeBarChart({
  data,
}: {
  data: Array<{ name: string; hours: number; minutes: number }>;
}) {
  return (
    <Panel className="p-6">
      <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">Top playtime</h2>
      <div className="mt-5 h-72">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 4, right: 12 }}>
            <XAxis dataKey="hours" stroke="#6e6557" type="number" fontSize={11} />
            <YAxis dataKey="name" hide type="category" width={120} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [`${value}h`, "Playtime"]}
            />
            <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell fill={colors[index % colors.length]} key={index} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export function BacklogBreakdownChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <Panel className="p-6">
      <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">Backlog breakdown</h2>
      <div className="mt-5 h-72">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={60} outerRadius={96} paddingAngle={3} stroke="none">
              {data.map((_, index) => (
                <Cell fill={colors[index % colors.length]} key={index} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-[var(--muted-strong)]">
        {data.map((item, index) => (
          <div className="flex items-center gap-2" key={item.name}>
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: colors[index % colors.length] }}
            />
            {item.name}
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function GenreRadarChart({ signals }: { signals: TasteSignal[] }) {
  const data = signals.slice(0, 6).map((signal) => ({
    label: signal.label,
    score: Number(signal.score.toFixed(2)),
  }));

  return (
    <Panel className="p-6">
      <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">Taste profile</h2>
      <div className="mt-5 h-72">
        {data.length > 2 ? (
          <ResponsiveContainer>
            <RadarChart data={data}>
              <PolarGrid stroke="rgba(180, 210, 240, 0.1)" />
              <PolarAngleAxis dataKey="label" stroke="#8a8275" tick={{ fontSize: 11, fill: "#b5ac9b" }} />
              <Radar
                dataKey="score"
                fill="#5db8ff"
                fillOpacity={0.22}
                stroke="#a3e635"
                strokeWidth={1.5}
              />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center rounded-[14px] border border-dashed border-[var(--line-strong)] bg-white/[0.02] text-center text-[13px] text-[var(--muted)]">
            Genre metadata will appear here once richer metadata is available.
          </div>
        )}
      </div>
    </Panel>
  );
}
