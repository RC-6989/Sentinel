import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-11 px-5 text-sm",
        variant === "primary" && "bg-accent text-white hover:bg-[#2f7ae5]",
        variant === "secondary" &&
          "border border-border bg-[#0d1117] text-foreground hover:border-[#30363d]",
        variant === "ghost" && "text-muted hover:bg-white/5 hover:text-foreground",
        variant === "danger" && "bg-[#da3633] text-white hover:bg-[#b62324]",
        className,
      )}
      {...props}
    />
  );
}
