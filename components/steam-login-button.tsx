import { LogIn } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SteamLoginButton({
  className,
  label = "Sign in with Steam",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <a className={cn(buttonClassName("primary", "lg"), className)} href="/api/auth/steam/start">
      <LogIn className="h-5 w-5" />
      {label}
    </a>
  );
}
