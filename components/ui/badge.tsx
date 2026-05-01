import { cn } from "@/lib/utils";

const variants = {
  default: "border-[var(--line-strong)] bg-white/[0.05] text-[var(--foreground)]",
  teal: "border-[rgba(154,140,255,0.28)] bg-[rgba(154,140,255,0.1)] text-[#cfc8ff]",
  amber: "border-[rgba(93,184,255,0.32)] bg-[rgba(93,184,255,0.1)] text-[#a3d9ff]",
  rose: "border-[rgba(255,138,92,0.32)] bg-[rgba(255,138,92,0.1)] text-[#ffd1b8]",
  lime: "border-[rgba(163,230,53,0.3)] bg-[rgba(163,230,53,0.08)] text-[#e1f4a0]",
};

export function Badge({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5 tracking-tight",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
