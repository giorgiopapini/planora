import type { ButtonHTMLAttributes, ReactNode } from "react";

export function IconButton({ icon, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: "edit" | "delete"; children?: ReactNode }) {
  const label = props["aria-label"];
  return <button {...props} type={props.type || "button"} className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md ${icon === "delete" ? "text-danger hover:bg-danger-soft" : "text-secondary hover:bg-muted hover:text-primary"} ${props.className || ""}`} aria-label={label} title={props.title || label}>
    {icon === "edit" ? "✎" : "🗑"}
  </button>;
}
