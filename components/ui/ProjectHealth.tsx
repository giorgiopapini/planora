"use client";

import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { Badge } from "./Badge";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";

type ProjectHealthProps = {
  status: "In progress" | "On track" | "Planning" | "Archived";
  progress: number;
  completedTasks: number;
  totalTasks: number;
  dueDate: string;
};

export function ProjectHealth({
  status,
  progress,
  completedTasks,
  totalTasks,
  dueDate,
}: ProjectHealthProps) {
  const { t, locale } = useTranslation();
  const formattedDueDate = useMemo(
    () => formatDateForLocale(dueDate, locale),
    [dueDate, locale],
  );

  const statusVariant =
    status === "Planning"
      ? "neutral"
      : status === "Archived"
        ? "danger"
        : "success";
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Project health")}</CardTitle>
        <Badge variant={statusVariant}>{t(status)}</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="text-secondary">{t("Overall completion")}</span>
            <span className="font-semibold text-primary">{progress}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={t("Project completion")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-border pt-5">
          <div>
            <p className="text-xl font-semibold tracking-tight">
              {completedTasks}/{totalTasks}
            </p>
            <p className="mt-1 text-xs text-secondary">
              {t("Tasks completed")}
            </p>
          </div>
          <div>
            <p className="text-xl font-semibold tracking-tight">
              {formattedDueDate}
            </p>
            <p className="mt-1 text-xs text-secondary">{t("Target date")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDateForLocale(value: string, locale: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return value;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}
