import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "premium-control inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "primary-control",
        secondary:
          "border border-[var(--line-strong)] bg-white/[0.04] text-[var(--foreground)] hover:bg-white/[0.07] hover:border-[rgba(93,184,255,0.32)]",
        ghost:
          "border border-transparent text-[var(--muted-strong)] hover:bg-white/[0.05] hover:text-[var(--foreground)]",
        outline:
          "border border-[var(--line-strong)] text-[var(--foreground)] hover:border-[rgba(93,184,255,0.4)] hover:bg-[rgba(93,184,255,0.06)]",
        danger:
          "border border-[rgba(255,138,92,0.32)] bg-[rgba(255,138,92,0.1)] text-[#ffd1b8] hover:bg-[rgba(255,138,92,0.16)]",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-[10px]",
        md: "h-10 px-4 text-sm rounded-[12px]",
        lg: "h-12 px-5 text-[15px] rounded-[14px]",
        icon: "h-10 w-10 rounded-[12px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  ),
);
Button.displayName = "Button";

export function buttonClassName(variant?: ButtonProps["variant"], size?: ButtonProps["size"]) {
  return buttonVariants({ variant, size });
}
