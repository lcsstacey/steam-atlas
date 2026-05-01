"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Steam library data is essentially static between manual refreshes,
            // so staleness can be generous. Bumped from 30s to 60s.
            staleTime: 60_000,
            // Keep cached data alive across tab switches for 10 min.
            gcTime: 600_000,
            refetchOnWindowFocus: false,
            // Most failures here are auth-related (401) — retrying 3 times
            // (the default) is wasted bandwidth.
            retry: 1,
          },
          mutations: {
            // Library refresh, status updates, etc. — never retry. The user
            // sees the failure and clicks again if they want.
            retry: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
