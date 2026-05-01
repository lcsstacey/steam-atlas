"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Tag, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

type TagRow = {
  id: string;
  label: string;
  color: string | null;
  gameCount: number;
};

async function fetchTags() {
  const response = await fetch("/api/tags");
  if (!response.ok) throw new Error("Failed.");
  return (await response.json()) as { tags: TagRow[] };
}

export function CustomTagsPanel() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["custom-tags"], queryFn: fetchTags });
  const [draft, setDraft] = useState("");
  const create = useMutation({
    mutationFn: async (label: string) => {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (!response.ok) throw new Error("Create failed.");
      return response.json();
    },
    onSuccess: () => {
      setDraft("");
      client.invalidateQueries({ queryKey: ["custom-tags"] });
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tags?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed.");
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["custom-tags"] }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    create.mutate(trimmed);
  }

  const tags = query.data?.tags ?? [];

  return (
    <Panel className="overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[rgba(154,140,255,0.1)] blur-3xl" />

      <Badge variant="teal">
        <Tag className="h-3 w-3" strokeWidth={2.4} />
        Custom collections
      </Badge>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        Your personal taxonomy.
      </h2>
      <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[var(--muted-strong)]">
        Tag games with anything Steam doesn&apos;t — &quot;rainy day&quot;, &quot;with the
        partner&quot;, &quot;controller-friendly&quot;. Apply them from the library page.
      </p>

      <form className="mt-5 flex gap-2" onSubmit={onSubmit}>
        <input
          aria-label="New tag label"
          className="flex-1 rounded-[12px] border border-[var(--line-strong)] bg-black/30 px-3 py-2 text-[13px] text-[var(--foreground)] outline-none focus:border-[rgba(154,140,255,0.5)] placeholder:text-[var(--muted)]"
          maxLength={40}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a tag (e.g. rainy day)"
          value={draft}
        />
        <Button
          disabled={create.isPending || draft.trim().length === 0}
          size="md"
          type="submit"
        >
          {create.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
          ) : (
            <Plus className="h-4 w-4" strokeWidth={2.4} />
          )}
          Add
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <p className="text-[13px] text-[var(--muted)]">No tags yet — start with one above.</p>
        ) : (
          tags.map((tag) => (
            <div
              className="group inline-flex items-center gap-1.5 rounded-full border border-[rgba(154,140,255,0.32)] bg-[rgba(154,140,255,0.1)] py-1 pl-3 pr-1 text-[12px] font-medium text-[#cfc8ff]"
              key={tag.id}
            >
              <span>{tag.label}</span>
              <span className="text-[10px] tabular-nums text-[#9a8cff]">{tag.gameCount}</span>
              <button
                aria-label={`Delete tag ${tag.label}`}
                className="rounded-full p-1 text-[var(--muted)] opacity-50 transition hover:bg-white/[0.06] hover:text-[var(--foreground)] hover:opacity-100"
                disabled={remove.isPending}
                onClick={() => remove.mutate(tag.id)}
                type="button"
              >
                <Trash2 className="h-3 w-3" strokeWidth={2.4} />
              </button>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
