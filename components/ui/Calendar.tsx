"use client";

import { useEffect, useMemo, useState } from "react";
import type { PointerEvent, ReactNode } from "react";

export type CalendarEvent = {
  id: string;
  date: Date | string;
  endDate?: Date | string;
  title: string;
  color?: "accent" | "dark" | "muted";
};

export type CalendarProps = {
  value?: Date | string;
  events?: CalendarEvent[];
  onChange?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventResize?: (event: CalendarEvent, startDate: string, endDate: string) => void | Promise<void>;
  renderEvent?: (event: CalendarEvent) => ReactNode;
  weekStartsOn?: 0 | 1;
  className?: string;
};

type ResizeState = { id: string; edge: "start" | "end"; start: Date; end: Date; pointerId: number; moved: boolean };

type EventSegment = { event: CalendarEvent; start: Date; end: Date; startIndex: number; endIndex: number; lane: number };

export function Calendar({ value, events = [], onChange, onEventClick, onEventResize, renderEvent, weekStartsOn = 1, className = "" }: CalendarProps) {
  const selected = value ? toDate(value) : undefined;
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [resize, setResize] = useState<ResizeState | null>(null);
  const days = useMemo(() => getCalendarDays(month, weekStartsOn), [month, weekStartsOn]);
  const weeks = useMemo(() => Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7)), [days]);
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(month);
  const weekdays = getWeekdays(weekStartsOn);
  const effectiveEvents = useMemo(() => events.map((event) => {
    if (resize?.id !== event.id) return event;
    return { ...event, date: dateKey(resize.start), endDate: dateKey(resize.end) };
  }), [events, resize]);

  useEffect(() => {
    if (!resize) return;
    const finishResize = () => {
      const event = events.find((item) => item.id === resize.id);
      setResize(null);
      if (event && onEventResize && resize.moved) void onEventResize(event, dateKey(resize.start), dateKey(resize.end));
    };
    document.addEventListener("mouseup", finishResize);
    return () => document.removeEventListener("mouseup", finishResize);
  }, [events, onEventResize, resize]);

  function beginResize(event: PointerEvent<HTMLSpanElement>, calendarEvent: CalendarEvent, edge: "start" | "end") {
    if (!onEventResize || !calendarEvent.endDate) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setResize({ id: calendarEvent.id, edge, start: toDate(calendarEvent.date), end: toDate(calendarEvent.endDate), pointerId: event.pointerId, moved: false });
  }

  function updateResize(day: Date) {
    if (!resize) return;
    const next = toDate(day);
    setResize((current) => {
      if (!current) return current;
      if (current.edge === "start") return next <= current.end ? { ...current, start: next, moved: dateKey(next) !== dateKey(current.start) } : current;
      return next >= current.start ? { ...current, end: next, moved: dateKey(next) !== dateKey(current.end) } : current;
    });
  }

  return (
    <section className={`rounded-xl border border-border bg-surface ${className}`} aria-label="Calendar">
      <header className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6"><div><h2 className="text-base font-semibold text-primary">{monthLabel}</h2><p className="mt-1 text-xs text-secondary">Select a day to view its schedule.</p></div><div className="flex items-center gap-1"><button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-secondary hover:bg-muted hover:text-primary" onClick={() => setMonth((current) => shiftMonth(current, -1))} aria-label="Previous month">‹</button><button type="button" className="h-8 rounded-md border border-border px-3 text-xs font-medium text-primary hover:bg-subtle" onClick={() => setMonth(startOfMonth(new Date()))}>Today</button><button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-secondary hover:bg-muted hover:text-primary" onClick={() => setMonth((current) => shiftMonth(current, 1))} aria-label="Next month">›</button></div></header>
      <div className="grid grid-cols-7 border-b border-border bg-subtle" role="row">{weekdays.map((day) => <div key={day} className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary" role="columnheader">{day}</div>)}</div>
      <div className="grid" role="grid" aria-label={monthLabel}>
        {weeks.map((week) => <CalendarWeek key={dateKey(week[0])} week={week} month={month} selected={selected} events={effectiveEvents} onChange={onChange} onEventClick={onEventClick} onEventResize={onEventResize} renderEvent={renderEvent} resize={resize} onResizeDay={updateResize} onResizeStart={beginResize} />)}
      </div>
      <footer className="flex flex-wrap gap-4 px-4 py-3 text-xs text-secondary sm:px-6"><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-accent" />Selected</span><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-accent-soft ring-1 ring-accent-border" />Event</span>{onEventResize && <span className="text-tertiary">Drag either edge of a task to resize it</span>}</footer>
    </section>
  );
}

function CalendarWeek({ week, month, selected, events, onChange, onEventClick, onEventResize, renderEvent, resize, onResizeDay, onResizeStart }: { week: Date[]; month: Date; selected?: Date; events: CalendarEvent[]; onChange?: (date: Date) => void; onEventClick?: (event: CalendarEvent) => void; onEventResize?: CalendarProps["onEventResize"]; renderEvent?: (event: CalendarEvent) => ReactNode; resize: ResizeState | null; onResizeDay: (day: Date) => void; onResizeStart: (event: PointerEvent<HTMLSpanElement>, calendarEvent: CalendarEvent, edge: "start" | "end") => void }) {
  const segments = getSegments(week, events);
  return <div className="relative grid min-h-28 grid-cols-7 border-b border-border" onPointerUp={(event) => { if (resize) event.preventDefault(); }}>
    {week.map((day) => { const key = dateKey(day); const outside = day.getMonth() !== month.getMonth(); const selectedDay = selected ? key === dateKey(selected) : false; const today = key === dateKey(new Date()); const dayEvents = events.filter((event) => inRange(day, event)); return <div key={key} onPointerEnter={() => onResizeDay(day)} className={`min-h-28 border-r border-border p-1.5 last:border-r-0 sm:p-2 ${outside ? "bg-subtle/60" : "bg-surface"}`} role="gridcell"><button type="button" onClick={() => { onChange?.(day); }} className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${selectedDay ? "bg-accent text-white" : today ? "border border-accent text-accent-hover" : outside ? "text-tertiary" : "text-primary hover:bg-muted"}`} aria-label={`${new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(day)}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : ""}`} aria-pressed={selectedDay}>{day.getDate()}</button></div>; })}
    {segments.map((segment) => { const starts = dateKey(segment.start) === dateKey(toDate(segment.event.date)); const ends = dateKey(segment.end) === dateKey(toDate(segment.event.endDate || segment.event.date)); const color = segment.event.color === "dark" ? "bg-tint-900 text-white" : segment.event.color === "muted" ? "bg-muted text-secondary" : "bg-accent-soft text-accent-hover"; return <button type="button" key={`${segment.event.id}-${dateKey(segment.start)}`} onClick={() => onEventClick?.(segment.event)} disabled={!onEventClick && !onEventResize} className={`absolute z-10 h-6 truncate rounded px-1.5 text-left text-[11px] font-medium ${color} ${onEventClick ? "cursor-pointer hover:opacity-80" : "cursor-default"}`} style={{ left: `${(segment.startIndex * 100) / 7}%`, width: `${((segment.endIndex - segment.startIndex + 1) * 100) / 7}%`, top: `${38 + segment.lane * 25}px` }} title={`${segment.event.title}${segment.event.endDate ? `, ${formatDate(segment.event.date)} – ${formatDate(segment.event.endDate)}` : ""}`}><ResizeHandle visible={starts && Boolean(onEventResize)} side="start" onPointerDown={(event) => onResizeStart(event, segment.event, "start")} /><span className="block truncate px-1">{starts ? (renderEvent ? renderEvent(segment.event) : segment.event.title) : ""}</span><ResizeHandle visible={ends && Boolean(onEventResize)} side="end" onPointerDown={(event) => onResizeStart(event, segment.event, "end")} /></button>; })}
  </div>;
}

function ResizeHandle({ visible, side, onPointerDown }: { visible: boolean; side: "start" | "end"; onPointerDown: (event: PointerEvent<HTMLSpanElement>) => void }) { return visible ? <span onPointerDown={onPointerDown} className={`absolute inset-y-0 z-20 w-2 cursor-ew-resize ${side === "start" ? "left-0" : "right-0"}`} aria-label={`Resize task ${side}`} /> : null; }
function getSegments(week: Date[], events: CalendarEvent[]) {
  const segments: EventSegment[] = [];
  const lanes: Date[][] = [];

  for (const event of events) {
    const eventStart = toDate(event.date);
    const eventEnd = toDate(event.endDate || event.date);
    const start = eventStart > week[0] ? eventStart : week[0];
    const end = eventEnd < week[6] ? eventEnd : week[6];
    if (start > end) continue;

    const occupied = lanes.findIndex((lane) => !lane.some((date) => date >= start && date <= end));
    const lane = occupied === -1 ? lanes.length : occupied;
    if (!lanes[lane]) lanes[lane] = [];
    for (let date = start; date <= end; date = addDays(date, 1)) lanes[lane].push(date);

    segments.push({ event, start, end, startIndex: daysBetween(week[0], start), endIndex: daysBetween(week[0], end), lane });
  }

  return segments;
}
function inRange(day: Date, event: CalendarEvent) { const start = toDate(event.date); const end = toDate(event.endDate || event.date); return day >= start && day <= end; }
function formatDate(value: Date | string) { return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(toDate(value)); }
function toDate(value: Date | string) { const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`); date.setHours(0, 0, 0, 0); return date; }
function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function shiftMonth(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function daysBetween(start: Date, end: Date) { return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / 86_400_000); }
function startOfDay(date: Date) { const result = new Date(date); result.setHours(0, 0, 0, 0); return result; }
function addDays(date: Date, amount: number) { const result = new Date(date); result.setDate(result.getDate() + amount); return result; }
function getWeekdays(start: 0 | 1) { const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; return [...days.slice(start), ...days.slice(0, start)]; }
function getCalendarDays(month: Date, weekStartsOn: 0 | 1) { const first = startOfMonth(month); const offset = (first.getDay() - weekStartsOn + 7) % 7; const start = new Date(first); start.setDate(first.getDate() - offset); return Array.from({ length: 42 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return day; }); }
