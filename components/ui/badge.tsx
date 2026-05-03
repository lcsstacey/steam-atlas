import { cn } from "@/lib/utils";

const variants = {
  default: "border-[var(--line-strong)] bg-[var(--surface-soft)] text-[var(--foreground)]",
  amber:   "border-[oklch(73%_0.17_72/28%)] bg-[oklch(73%_0.17_72/10%)] text-[oklch(86%_0.1_76)]",
  teal:    "border-[oklch(68%_0.13_280/28%)] bg-[oklch(68%_0.13_280/10%)] text-[oklch(82%_0.08_280)]",
  rose:    "border-[oklch(70%_0.145_38/28%)] bg-[oklch(70%_0.145_38/10%)] text-[oklch(84%_0.08_38)]",
  lime:    "border-[oklch(84%_0.185_127/28%)] bg-[oklch(84%_0.185_127/8%)] text-[oklch(88%_0.12_127)]",
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
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase leading-5 tracking-[0.04em]",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
