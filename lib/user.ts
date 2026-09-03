export function getUserFullName(
  user: {
    user_metadata?: Record<string, unknown>;
    email?: string | null;
  } | null,
) {
  if (!user) return "User";

  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();

  return user.email?.split("@")[0] || "User";
}

export function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "U";
}
