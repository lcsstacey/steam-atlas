"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function LibraryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      error={error}
      reset={reset}
      title="Library failed to load."
      message="We couldn't render your library this time. The Steam import cache may be stale — try again, or refresh the import from the dashboard."
    />
  );
}
