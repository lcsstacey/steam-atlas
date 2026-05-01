"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function InsightsError({
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
      title="Insights couldn't load."
      message="One of the data services hit an error. Try again — Steam endpoints are occasionally flaky and most failures retry on their own."
    />
  );
}
