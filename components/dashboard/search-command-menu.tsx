"use client";

import { Search } from "lucide-react";

export function SearchCommandMenu({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="glass-panel flex h-12 items-center gap-3 px-4 transition-colors focus-within:border-[rgba(93,184,255,0.35)]">
      <Search className="h-4 w-4 text-[var(--muted)]" strokeWidth={2.2} />
      <input
        className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search library"
        value={value}
      />
      <span className="hidden rounded-[8px] border border-[var(--line)] bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-[var(--muted)] sm:inline">
        ⌘ K
      </span>
    </label>
  );
}
