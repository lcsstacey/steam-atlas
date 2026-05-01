import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(minutes: number) {
  if (!minutes) return "0h";
  const hours = minutes / 60;
  if (hours < 1) return `${Math.round(minutes)}m`;
  if (hours < 10) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours).toLocaleString()}h`;
}

export function compactNumber(value: number) {
  return Intl.NumberFormat("en", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function daysSince(date?: Date | string | null) {
  if (!date) return Number.POSITIVE_INFINITY;
  const value = typeof date === "string" ? new Date(date) : date;
  return Math.max(0, Math.floor((Date.now() - value.getTime()) / 86_400_000));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
