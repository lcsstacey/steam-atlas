"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

/**
 * Shared error UI for App Router error.tsx boundaries. Pass through the
 * error and reset() that Next.js gives you.
 */
export function RouteErrorState({
  error,
  reset,
  title = "Something went sideways.",
  message = "Hit an unexpected error. Try again in a moment — if it keeps happening, a refresh of your library import usually clears it.",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  message?: string;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <Panel className="mx-auto max-w-2xl overflow-hidden p-8 text-center">
        <div className="icon-crystal mx-auto h-14 w-14">
          <AlertTriangle className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-6 text-[var(--muted-strong)]">{message}</p>
        {error.digest ? <p className="mono-label mt-4">ref · {error.digest}</p> : null}
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => reset()} variant="primary">
            <RefreshCw className="h-4 w-4" strokeWidth={2.2} />
            Try again
          </Button>
          <Link
            className="premium-control inline-flex h-10 items-center gap-2 rounded-[12px] border border-[var(--line-strong)] bg-white/[0.04] px-4 text-sm font-medium text-[var(--foreground)] transition hover:bg-white/[0.07]"
            href="/"
          >
            Back to home
          </Link>
        </div>
      </Panel>
    </div>
  );
}
