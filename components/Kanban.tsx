"use client";

import { useState } from "react";
import type { DragEvent } from "react";
import { Avatar, Badge, Card } from "@/components/ui";
import type { ProjectTask } from "@/lib/projects";

type KanbanProps = {
  tasks: ProjectTask[];
  statuses: string[];
  onStatusChange: (taskId: string, status: string) => void | Promise<void>;
  onTaskClick?: (task: ProjectTask) => void;
};

export function Kanban({ tasks, statuses, onStatusChange, onTaskClick }: KanbanProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const columns = statuses.length ? statuses : ["Todo", "In progress", "In review", "Completed"];

  function handleDrop(event: DragEvent<HTMLElement>, status: string) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/task-id") || draggedTaskId;
    setDraggedTaskId(null);
    if (!taskId) return;
    const task = tasks.find((item) => item.id === taskId);
    if (task && task.status !== status) void onStatusChange(taskId, status);
  }

  return <Card className="overflow-hidden">
    <div className="border-b border-border p-6"><h3 className="text-base font-semibold text-primary">Task board</h3><p className="mt-1 text-sm leading-6 text-secondary">Drag tasks between columns to update their status.</p></div>
    <div className="grid gap-px bg-border md:grid-cols-2 xl:grid-cols-4">
      {columns.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);
        return <section key={status} className="min-w-0 bg-subtle p-4" onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, status)} aria-labelledby={`kanban-${status}`}>
          <div className="mb-4"><div className="flex items-center gap-2"><h4 id={`kanban-${status}`} className="text-sm font-semibold text-primary">{status}</h4><Badge variant={status.toLowerCase() === "completed" ? "success" : "count"}>{columnTasks.length}</Badge></div><p className="mt-1 text-xs text-tertiary">{columnDescription(status)}</p></div>
          <div className="min-h-32 space-y-3">{columnTasks.map((task) => <TaskCard key={task.id} task={task} onClick={onTaskClick ? () => onTaskClick(task) : undefined} onDragStart={() => setDraggedTaskId(task.id)} />)}{columnTasks.length === 0 && <p className="rounded-lg border border-dashed border-border-strong px-3 py-6 text-center text-xs text-tertiary">Drop a task here</p>}</div>
        </section>;
      })}
    </div>
  </Card>;
}

function TaskCard({ task, onClick, onDragStart }: { task: ProjectTask; onClick?: () => void; onDragStart: () => void }) {
  const content = <><div className="flex items-start justify-between gap-3"><h5 className="text-sm font-medium leading-5 text-primary">{task.title}</h5><span className={`shrink-0 text-[11px] font-medium ${task.priority === "Urgent" || task.priority === "High" ? "text-danger" : task.priority === "Medium" ? "text-warning" : "text-secondary"}`}>{task.priority}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-secondary">{task.detail}</p><div className="mt-4 flex items-center justify-between gap-2"><div className="flex -space-x-1" aria-label={`Assigned to ${task.assignees.join(", ") || "no one"}`}>{task.assignees.map((person) => <Avatar key={person} name={person} size="sm" className="border-2 border-surface" />)}</div><span className="truncate text-right text-[11px] text-tertiary">{formatDate(task.dueDateIso)}</span></div><div className="mt-3 flex flex-wrap gap-1.5">{task.tags.map((tag) => <Badge key={tag} variant="neutral">{tag}</Badge>)}</div></>;
  return <article draggable onDragStart={(event) => { event.dataTransfer.setData("text/task-id", task.id); onDragStart(); }} onClick={onClick} className={`group rounded-lg border border-border bg-surface p-4 transition-colors duration-120 hover:border-border-strong ${onClick ? "cursor-pointer" : ""}`} tabIndex={onClick ? 0 : undefined} onKeyDown={(event) => { if (onClick && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onClick(); } }} aria-label={`${task.title}, ${task.priority} priority`}>{content}</article>;
}

function columnDescription(status: string) { const normalized = status.toLowerCase(); if (normalized === "completed" || normalized === "done") return "Shipped and signed off"; if (normalized.includes("review")) return "Awaiting feedback"; if (normalized.includes("progress")) return "Currently being worked on"; return "Ready to start"; }
function formatDate(date: string | null) { if (!date) return "No due date"; const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!match) return "No due date"; const [, year, month, day] = match; return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${year}-${month}-${day}T00:00:00Z`)); }
