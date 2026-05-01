"use client";

/* eslint-disable @next/next/no-img-element */
import { RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/types";

export function UserProfileHeader({ user }: { user: SessionUser }) {
  const queryClient = useQueryClient();
  const refresh = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/library/refresh", { method: "POST" });
      if (!response.ok) throw new Error("Refresh failed");
      return response.json();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["library"] }),
        queryClient.invalidateQueries({ queryKey: ["recommendations"] }),
      ]);
    },
  });

  async function deleteData() {
    const confirmed = window.confirm("Delete your Steam Compass data from this app?");
    if (!confirmed) return;

    const response = await fetch("/api/account/delete", { method: "DELETE" });
    if (response.ok) {
      window.location.assign("/");
    }
  }

  return (
    <header className="glass-panel relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[rgba(93,184,255,0.1)] blur-3xl" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-[14px] border border-[var(--line-strong)] bg-[#0a1421] shadow-[inset_0_1px_0_rgba(180,210,240,0.08)]">
            {user.avatarUrl ? (
              <img
                alt={`${user.displayName} avatar`}
                className="h-full w-full object-cover"
                decoding="async"
                src={user.avatarUrl}
              />
            ) : (
              <div className="grid h-full place-items-center text-lg font-semibold text-[var(--muted)]">
                {user.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">{user.displayName}</h1>
              <Badge variant="teal">
                <ShieldCheck className="h-3 w-3" />
                Steam OpenID
              </Badge>
            </div>
            <p className="mt-1 truncate text-[13px] text-[var(--muted)]">
              <span className="mono-label normal-case tracking-normal" style={{ fontSize: "12px", letterSpacing: "0.02em" }}>
                {user.steamId}
              </span>
              {user.lastLibraryImportAt
                ? ` · Last scan ${new Date(user.lastLibraryImportAt).toLocaleString()}`
                : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={refresh.isPending}
            onClick={() => refresh.mutate()}
            variant="secondary"
          >
            <RefreshCw className={refresh.isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} strokeWidth={2.2} />
            Refresh library
          </Button>
          <Button onClick={deleteData} variant="danger">
            <Trash2 className="h-4 w-4" strokeWidth={2.2} />
            Delete data
          </Button>
        </div>
      </div>
    </header>
  );
}
