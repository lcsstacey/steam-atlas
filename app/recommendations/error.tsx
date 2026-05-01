"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function RecommendationsError({
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
      title="Recommendations couldn't load."
      message="The recommender hit an error while scoring your library. Try again — if it keeps failing, a fresh library refresh usually clears it."
    />
  );
}
