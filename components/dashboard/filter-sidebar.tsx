"use client";

import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type LibraryFilter =
  | "all"
  | "never"
  | "under-1"
  | "1-5"
  | "5-20"
  | "20-plus"
  | "recent"
  | "forgotten"
  | "high"
  | "low"
  | "random";

const filters: Array<{ id: LibraryFilter; label: string }> = [
  { id: "all", label: "All games" },
  { id: "never", label: "Never played" },
  { id: "under-1", label: "Under 1 hour" },
  { id: "1-5", label: "1—5 hours" },
  { id: "5-20", label: "5—20 hours" },
  { id: "20-plus", label: "20+ hours" },
  { id: "recent", label: "Recently played" },
  { id: "forgotten", label: "Forgotten favorites" },
  { id: "high", label: "High playtime" },
  { id: "low", label: "Low playtime" },
  { id: "random", label: "Random candidates" },
];

export function FilterSidebar({
  active,
  onChange,
  counts,
}: {
  active: LibraryFilter;
  onChange: (filter: LibraryFilter) => void;
  counts: Partial<Record<LibraryFilter, number>>;
}) {
  return (
    <aside className="glass-panel p-4">
      <div className="mb-4 flex items-center gap-2 px-1.5 text-[13px] font-semibold text-[var(--foreground)]">
        <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--brand)]" strokeWidth={2.4} />
        Filters
      </div>
      <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
        {filters.map((filter) => {
          const isActive = active === filter.id;
          return (
            <button
              className={cn(
                "flex items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-left text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-[rgba(93,184,255,0.1)] text-[var(--foreground)] shadow-[inset_0_0_0_1px_rgba(93,184,255,0.28)]"
                  : "text-[var(--muted-strong)] hover:bg-white/[0.05] hover:text-[var(--foreground)]",
              )}
              key={filter.id}
              onClick={() => onChange(filter.id)}
            >
              <span>{filter.label}</span>
              {typeof counts[filter.id] === "number" ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                    isActive
                      ? "bg-[rgba(93,184,255,0.2)] text-[#a3d9ff]"
                      : "bg-white/[0.05] text-[var(--muted)]",
                  )}
                >
                  {counts[filter.id]}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
