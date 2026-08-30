import type { HTMLAttributes } from "react";

const colors = ["bg-tint-100 text-accent-hover", "bg-tint-300 text-tint-900", "bg-tint-50 text-tint-700"];
export function Avatar({ name, initials, size = "md", className = "", ...props }: HTMLAttributes<HTMLDivElement> & { name: string; initials?: string; size?: "sm" | "md" | "lg" }) {
  const dimensions = { sm: "h-6 w-6 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-10 w-10 text-sm" }[size];
  const fallback = initials || name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <div role="img" aria-label={name} className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${colors[name.length % colors.length]} ${dimensions} ${className}`} {...props}>{fallback}</div>;
}

export function AvatarGroup({ people, max = 4 }: { people: { name: string; initials?: string }[]; max?: number }) {
  const visible = people.slice(0, max);
  return <div className="flex items-center pl-2">{visible.map((person) => <Avatar key={person.name} {...person} className="-ml-2 border-2 border-surface" />)}{people.length > max && <span className="-ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-muted text-xs font-medium text-secondary">+{people.length - max}</span>}</div>;
}
