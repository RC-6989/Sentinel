import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 21st.dev Agent Elements–style streaming shimmer for “working” states. */
export function TextShimmer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("text-shimmer", className)}>{children}</span>;
}
