import type { HTMLAttributes } from "react";

type BadgeVariant = "count" | "success" | "neutral" | "danger" | "warning";
const variants: Record<BadgeVariant, string> = {
  count: "bg-muted text-primary",
  success: "border border-accent-border bg-accent-soft text-accent-hover",
  neutral: "border border-border bg-surface text-secondary",
  danger: "bg-danger-soft text-danger",
  warning: "bg-warning-soft text-warning",
};

export function Badge({ variant = "count", className = "", ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-medium ${variants[variant]} ${className}`} {...props} />;
}
