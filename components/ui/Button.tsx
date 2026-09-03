import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "border border-border bg-surface text-primary hover:bg-subtle",
  ghost: "text-secondary hover:bg-muted hover:text-primary",
  danger: "bg-danger text-white hover:bg-red-700",
  success:
    "border border-accent-border bg-accent-soft text-accent-hover hover:border-accent hover:bg-tint-100",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-4 text-sm",
};

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={`cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-120 ease-out disabled:cursor-not-allowed disabled:bg-muted disabled:text-tertiary ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
