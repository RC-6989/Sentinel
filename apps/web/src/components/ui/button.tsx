import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonStyleProps = {
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function buttonStyles({ className, variant = "primary", size = "md" }: ButtonStyleProps = {}) {
  return cn(
    "button-magnetic inline-flex items-center justify-center gap-2 rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50",
    size === "sm" && "min-h-8 px-3 py-1.5 text-xs",
    size === "md" && "min-h-10 px-4 py-2 text-sm",
    size === "lg" && "min-h-11 px-5 py-2 text-sm",
    variant === "primary" && "bg-accent text-white hover:bg-[#112d1e]",
    variant === "secondary" && "border border-border bg-surface-raised text-foreground hover:border-[#9fa99f]",
    variant === "ghost" && "text-muted hover:bg-surface hover:text-foreground",
    variant === "danger" && "bg-danger text-white hover:bg-[#7f201d]",
    className,
  );
}

export function Button({ className, variant, size, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleProps) {
  return <button className={buttonStyles({ className, variant, size })} {...props} />;
}
