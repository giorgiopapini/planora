"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";

function getGreeting(hour: number, t: (key: string) => string) {
  if (hour >= 5 && hour < 12) return t("Good morning");
  if (hour >= 12 && hour < 17) return t("Good afternoon");
  if (hour >= 17 && hour < 21) return t("Good evening");
  return t("Good night");
}

export function UserGreeting() {
  const { name } = useCurrentUser();
  const { t } = useTranslation();
  const greeting = getGreeting(new Date().getHours(), t);

  return (
    <h1 className="text-3xl font-semibold tracking-tight">
      {greeting}, {name}
    </h1>
  );
}
