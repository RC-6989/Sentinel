import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonStyleProps = {
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function buttonStyles({ className, variant = "primary", size = "md" }: ButtonStyleProps = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50",
    size === "sm" && "min-h-8 px-3 py-1.5 text-xs",
    size === "md" && "min-h-10 px-4 py-2 text-sm",
    size === "lg" && "min-h-11 px-5 py-2 text-sm",
    variant === "primary" && "bg-accent text-white hover:bg-[#205bb0]",
    variant === "secondary" && "border border-border bg-surface-raised text-foreground hover:border-[#30363d]",
    variant === "ghost" && "text-muted hover:bg-white/5 hover:text-foreground",
    variant === "danger" && "bg-[#da3633] text-white hover:bg-[#b62324]",
    className,
  );
}

export function Button({ className, variant, size, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleProps) {
  return <button className={buttonStyles({ className, variant, size })} {...props} />;
}
