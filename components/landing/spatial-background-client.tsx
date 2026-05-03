"use client";

import dynamic from "next/dynamic";

const SpatialBackground = dynamic(
  () => import("@/components/spatial-background").then((m) => ({ default: m.SpatialBackground })),
  { ssr: false },
);

export function SpatialBackgroundClient() {
  return <SpatialBackground />;
}
