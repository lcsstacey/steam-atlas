"use client";

import { LockKeyhole, RefreshCw, Settings, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

export function EmptyPrivateProfileState() {
  return (
    <Panel className="premium-ring overflow-hidden p-10 text-center">
      <div className="pointer-events-none absolute inset-0 ambient-grid opacity-25" />
      <div className="pointer-events-none absolute left-1/2 top-8 h-44 w-44 -translate-x-1/2 rounded-full bg-[rgba(93,184,255,0.12)] blur-3xl" />
      <div className="icon-crystal relative mx-auto h-14 w-14">
        <LockKeyhole className="h-5 w-5" strokeWidth={2.2} />
      </div>
      <Badge className="relative mt-5" variant="amber">
        <ShieldCheck className="h-3 w-3" />
        Privacy respected
      </Badge>
      <h2 className="relative mt-4 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        Steam is keeping this library private
      </h2>
      <p className="relative mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-[var(--muted-strong)]">
        Steam Atlas could identify your account, but Steam did not return library data.
        This usually means your game details are private, or the library is empty. Steam settings
        can block owned games and playtime even when the profile itself is visible.
      </p>
      <div className="relative mx-auto mt-6 grid max-w-2xl gap-3 text-left md:grid-cols-2">
        <div className="rounded-[14px] border border-[var(--line)] bg-white/[0.025] p-4">
          <Settings className="h-4 w-4 text-[var(--violet)]" strokeWidth={2.2} />
          <p className="mt-3 text-[14px] font-semibold text-[var(--foreground)]">Check game details</p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--muted-strong)]">
            Steam privacy settings can hide owned games and playtime from API analysis.
          </p>
        </div>
        <div className="rounded-[14px] border border-[var(--line)] bg-white/[0.025] p-4">
          <RefreshCw className="h-4 w-4 text-[var(--citrine)]" strokeWidth={2.2} />
          <p className="mt-3 text-[14px] font-semibold text-[var(--foreground)]">Refresh after changing it</p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--muted-strong)]">
            Once Steam returns games, the dashboard will build your library intelligence.
          </p>
        </div>
      </div>
      <div className="relative mt-6 flex justify-center">
        <Button onClick={() => window.location.reload()} variant="secondary">
          <RefreshCw className="h-4 w-4" strokeWidth={2.2} />
          Try again
        </Button>
      </div>
    </Panel>
  );
}
