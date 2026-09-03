"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

export type GanttTask = {
  id: string;
  name: string;
  start: Date | string;
  end: Date | string;
  progress?: number;
  status?: string;
  color?: "accent" | "dark" | "light";
  milestone?: boolean;
  dependencies?: string[];
};

export type GanttChartProps = {
  tasks: GanttTask[];
  startDate?: Date | string;
  endDate?: Date | string;
  onTaskClick?: (task: GanttTask) => void;
  renderTaskLabel?: (task: GanttTask) => ReactNode;
  className?: string;
};

const DAY_MS = 86_400_000;
const DAY_WIDTH = 44;
const ROW_HEIGHT = 56;
const LABEL_WIDTH = 220;

export function GanttChart({
  tasks,
  startDate,
  endDate,
  onTaskClick,
  renderTaskLabel,
  className = "",
}: GanttChartProps) {
  const normalizedTasks = useMemo(
    () =>
      tasks.map((task) => ({
        ...task,
        start: toDate(task.start),
        end: toDate(task.end),
      })),
    [tasks],
  );
  const bounds = useMemo(
    () => getBounds(normalizedTasks, startDate, endDate),
    [normalizedTasks, startDate, endDate],
  );
  const [offset, setOffset] = useState(0);
  const chartStart = addDays(bounds.start, offset);
  const chartEnd = addDays(bounds.end, offset);
  const visibleDays = getDays(chartStart, chartEnd);
  const width = visibleDays.length * DAY_WIDTH;
  const totalDays = Math.max(1, daysBetween(chartStart, chartEnd) + 1);

  const move = (amount: number) => setOffset((current) => current + amount);
  const today = startOfDay(new Date());
  const todayPosition = daysBetween(chartStart, today) * DAY_WIDTH;

  return (
    <section
      className={`overflow-hidden rounded-xl border border-border bg-surface ${className}`}
      aria-label="Project timeline"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-primary">Timeline</h2>
          <p className="mt-1 text-xs text-secondary">
            {formatRange(chartStart, chartEnd)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-secondary hover:bg-muted hover:text-primary"
            onClick={() => move(-7)}
            aria-label="Previous timeline period"
          >
            ‹
          </button>
          <button
            type="button"
            className="h-8 rounded-md border border-border px-3 text-xs font-medium text-primary hover:bg-subtle"
            onClick={() => setOffset(0)}
          >
            Today
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-secondary hover:bg-muted hover:text-primary"
            onClick={() => move(7)}
            aria-label="Next timeline period"
          >
            ›
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]" style={{ width: LABEL_WIDTH + width }}>
          <div
            className="grid border-b border-border bg-subtle"
            style={{ gridTemplateColumns: `${LABEL_WIDTH}px ${width}px` }}
          >
            <div className="flex items-center border-r border-border px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary">
              Task
            </div>
            <div
              className="relative grid"
              style={{
                gridTemplateColumns: `repeat(${visibleDays.length}, ${DAY_WIDTH}px)`,
              }}
            >
              {visibleDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`border-r border-border px-1 py-2 text-center ${isToday(day) ? "bg-accent-soft text-accent-hover" : "text-secondary"}`}
                >
                  <span className="block text-[10px] uppercase">
                    {new Intl.DateTimeFormat(undefined, { weekday: "short" })
                      .format(day)
                      .slice(0, 2)}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold">
                    {day.getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {visibleDays.map((day) => (
              <div
                key={`line-${day.toISOString()}`}
                className="pointer-events-none absolute bottom-0 top-0 border-r border-border/70"
                style={{
                  left: LABEL_WIDTH + daysBetween(chartStart, day) * DAY_WIDTH,
                }}
                aria-hidden="true"
              />
            ))}
            {todayPosition >= 0 && todayPosition <= width && (
              <div
                className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-accent"
                style={{ left: LABEL_WIDTH + todayPosition }}
                aria-label="Today"
              />
            )}
            {normalizedTasks.map((task) => {
              const start = Math.max(0, daysBetween(chartStart, task.start));
              const duration = Math.max(
                1,
                daysBetween(task.start, task.end) + 1,
              );
              const left = start * DAY_WIDTH + 6;
              const barWidth = Math.max(
                task.milestone ? 18 : DAY_WIDTH - 12,
                duration * DAY_WIDTH - 12,
              );
              const visible = start < totalDays && start + duration > 0;
              return (
                <div
                  key={task.id}
                  className="relative grid border-b border-border"
                  style={{
                    gridTemplateColumns: `${LABEL_WIDTH}px ${width}px`,
                    minHeight: ROW_HEIGHT,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onTaskClick?.(task)}
                    className="min-w-0 border-r border-border px-4 text-left hover:bg-subtle disabled:cursor-default"
                    disabled={!onTaskClick}
                  >
                    <span className="block truncate text-sm font-medium text-primary">
                      {renderTaskLabel ? renderTaskLabel(task) : task.name}
                    </span>
                    {task.status && (
                      <span className="mt-0.5 block truncate text-xs text-secondary">
                        {task.status}
                      </span>
                    )}
                  </button>
                  <div className="relative">
                    {visible && (
                      <TaskBar
                        task={task}
                        left={left}
                        width={barWidth}
                        onClick={
                          onTaskClick ? () => onTaskClick(task) : undefined
                        }
                      />
                    )}
                  </div>
                </div>
              );
            })}
            {normalizedTasks.length === 0 && (
              <div
                className="border-b border-border px-4 py-8 text-center text-sm text-secondary"
                style={{ marginLeft: LABEL_WIDTH }}
              >
                No tasks in this timeline.
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 border-t border-border px-4 py-3 text-xs text-secondary sm:px-6">
        <span className="inline-flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-accent" />
          In progress
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-tint-900" />
          Completed
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-tint-100 ring-1 ring-accent-border" />
          Upcoming
        </span>
        <span className="ml-auto">
          {tasks.length} task{tasks.length === 1 ? "" : "s"}
        </span>
      </div>
    </section>
  );
}

function TaskBar({
  task,
  left,
  width,
  onClick,
}: {
  task: GanttTask;
  left: number;
  width: number;
  onClick?: () => void;
}) {
  const progress = Math.min(100, Math.max(0, task.progress ?? 0));
  const colors =
    task.color === "dark"
      ? "bg-tint-900"
      : task.color === "light"
        ? "bg-tint-100 text-tint-900 ring-1 ring-inset ring-accent-border"
        : "bg-accent";
  const style = { left, width } as CSSProperties;
  if (task.milestone)
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className="absolute top-1/2 z-20 h-4 w-4 -translate-y-1/2 rotate-45 rounded-[3px] bg-accent ring-4 ring-accent-soft disabled:cursor-default"
        style={style}
        title={`${task.name}, milestone`}
        aria-label={`${task.name}, milestone`}
      />
    );
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`absolute top-1/2 z-10 h-7 -translate-y-1/2 overflow-hidden rounded-md text-left text-xs font-medium text-white ${colors} ${onClick ? "cursor-pointer hover:brightness-95" : "cursor-default"}`}
      style={style}
      title={`${task.name}${task.progress === undefined ? "" : `, ${progress}% complete`}`}
      aria-label={`${task.name}${task.progress === undefined ? "" : `, ${progress}% complete`}`}
    >
      <div
        className="absolute inset-y-0 left-0 bg-black/10"
        style={{ width: `${progress}%` }}
      />
      <span className="relative block truncate px-2 py-1">{task.name}</span>
    </button>
  );
}

function toDate(value: Date | string) {
  const date =
    value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
  return startOfDay(date);
}
function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}
function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}
function daysBetween(start: Date, end: Date) {
  return Math.round(
    (startOfDay(end).getTime() - startOfDay(start).getTime()) / DAY_MS,
  );
}
function getDays(start: Date, end: Date) {
  return Array.from(
    { length: Math.max(1, daysBetween(start, end) + 1) },
    (_, index) => addDays(start, index),
  );
}
function getBounds(
  tasks: Array<GanttTask & { start: Date; end: Date }>,
  start?: Date | string,
  end?: Date | string,
) {
  const taskStart = tasks.length
    ? new Date(Math.min(...tasks.map((task) => task.start.getTime())))
    : new Date();
  const taskEnd = tasks.length
    ? new Date(Math.max(...tasks.map((task) => task.end.getTime())))
    : addDays(taskStart, 13);
  const first = start ? toDate(start) : addDays(startOfDay(taskStart), -2);
  const last = end ? toDate(end) : addDays(startOfDay(taskEnd), 2);
  return { start: first, end: last };
}
function isToday(date: Date) {
  return date.toDateString() === new Date().toDateString();
}
function formatRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}
