"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

export type CalendarEvent = {
  id: string;
  date: Date | string;
  title: string;
  color?: "accent" | "dark" | "muted";
};

export type CalendarProps = {
  value?: Date | string;
  events?: CalendarEvent[];
  onChange?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  renderEvent?: (event: CalendarEvent) => ReactNode;
  weekStartsOn?: 0 | 1;
  className?: string;
};

export function Calendar({ value, events = [], onChange, onEventClick, renderEvent, weekStartsOn = 1, className = "" }: CalendarProps) {
  const selected = value ? toDate(value) : undefined;
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const days = useMemo(() => getCalendarDays(month, weekStartsOn), [month, weekStartsOn]);
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => { const key = dateKey(toDate(event.date)); map.set(key, [...(map.get(key) ?? []), event]); });
    return map;
  }, [events]);
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(month);
  const weekdays = getWeekdays(weekStartsOn);

  return (
    <section className={`rounded-xl border border-border bg-surface ${className}`} aria-label="Calendar">
      <header className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
        <div><h2 className="text-base font-semibold text-primary">{monthLabel}</h2><p className="mt-1 text-xs text-secondary">Select a day to view its schedule.</p></div>
        <div className="flex items-center gap-1"><button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-secondary hover:bg-muted hover:text-primary" onClick={() => setMonth((current) => shiftMonth(current, -1))} aria-label="Previous month">‹</button><button type="button" className="h-8 rounded-md border border-border px-3 text-xs font-medium text-primary hover:bg-subtle" onClick={() => setMonth(startOfMonth(new Date()))}>Today</button><button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-secondary hover:bg-muted hover:text-primary" onClick={() => setMonth((current) => shiftMonth(current, 1))} aria-label="Next month">›</button></div>
      </header>
      <div className="grid grid-cols-7 border-b border-border bg-subtle" role="row">{weekdays.map((day) => <div key={day} className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary" role="columnheader">{day}</div>)}</div>
      <div className="grid grid-cols-7" role="grid" aria-label={monthLabel}>
        {days.map((day) => {
          const key = dateKey(day); const dayEvents = eventsByDate.get(key) ?? []; const outside = day.getMonth() !== month.getMonth(); const selectedDay = selected ? key === dateKey(selected) : false; const today = key === dateKey(new Date());
          return <div key={key} className={`min-h-24 border-b border-r border-border p-1.5 last:border-r-0 sm:min-h-28 sm:p-2 ${outside ? "bg-subtle/60" : "bg-surface"}`} role="gridcell"><button type="button" onClick={() => { onChange?.(day); setMonth(startOfMonth(day)); }} className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${selectedDay ? "bg-accent text-white" : today ? "border border-accent text-accent-hover" : outside ? "text-tertiary" : "text-primary hover:bg-muted"}`} aria-label={`${new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(day)}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : ""}`} aria-pressed={selectedDay}>{day.getDate()}</button><div className="mt-1 space-y-1">{dayEvents.slice(0, 3).map((event) => <button type="button" key={event.id} onClick={() => onEventClick?.(event)} disabled={!onEventClick} className={`block w-full truncate rounded px-1.5 py-1 text-left text-[11px] font-medium ${event.color === "dark" ? "bg-tint-900 text-white" : event.color === "muted" ? "bg-muted text-secondary" : "bg-accent-soft text-accent-hover"} ${onEventClick ? "cursor-pointer hover:opacity-80" : "cursor-default"}`} title={event.title}>{renderEvent ? renderEvent(event) : event.title}</button>)}{dayEvents.length > 3 && <span className="block px-1.5 text-[11px] text-secondary">+{dayEvents.length - 3} more</span>}</div></div>;
        })}
      </div>
      <footer className="flex flex-wrap gap-4 px-4 py-3 text-xs text-secondary sm:px-6"><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-accent" />Selected</span><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-accent-soft ring-1 ring-accent-border" />Event</span></footer>
    </section>
  );
}

function toDate(value: Date | string) { const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`); date.setHours(0, 0, 0, 0); return date; }
function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function shiftMonth(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function getWeekdays(start: 0 | 1) { const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; return [...days.slice(start), ...days.slice(0, start)]; }
function getCalendarDays(month: Date, weekStartsOn: 0 | 1) { const first = startOfMonth(month); const offset = (first.getDay() - weekStartsOn + 7) % 7; const start = new Date(first); start.setDate(first.getDate() - offset); return Array.from({ length: 42 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return day; }); }
