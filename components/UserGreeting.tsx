"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";

function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

export function UserGreeting() {
  const { name } = useCurrentUser();
  const greeting = getGreeting(new Date().getHours());

  return <h1 className="text-3xl font-semibold tracking-tight">{greeting}, {name}</h1>;
}
