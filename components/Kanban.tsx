"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Avatar, Badge, Button, Card, Modal, MultiSelect } from "@/components/ui";

type ColumnId = "todo" | "progress" | "review" | "done";
type Priority = "Low" | "Medium" | "High" | "Urgent";
type Task = { id: number; title: string; dueDate: string; assignees: string[]; priority: Priority; tags: string[]; detail: string };
type Column = { id: ColumnId; title: string; description: string; variant?: "success" | "neutral" };
type EditableField = "title" | "detail" | "status" | "dueDate" | "priority" | "assignees" | "tags";

const people = ["Alex Morgan", "Jordan Lee", "Sam Rivera", "Taylor Kim", "Maya Patel"];
const tagOptions = ["Engineering", "Design", "Product", "Content", "Marketing"];
const columns: Column[] = [
  { id: "todo", title: "Todo", description: "Ready to start" },
  { id: "progress", title: "In progress", description: "Currently being worked on", variant: "neutral" },
  { id: "review", title: "In review", description: "Awaiting feedback", variant: "neutral" },
  { id: "done", title: "Completed", description: "Shipped and signed off", variant: "success" },
];

const initialTasks: Record<ColumnId, Task[]> = {
  todo: [
    { id: 1, title: "Map the onboarding flow", dueDate: "2026-03-14", assignees: ["Alex Morgan"], priority: "High", tags: ["Product"], detail: "Define the first-time user experience from sign-up through the first project." },
    { id: 2, title: "Write empty state copy", dueDate: "2026-03-18", assignees: ["Maya Patel"], priority: "Low", tags: ["Content"], detail: "Create concise, helpful copy for empty project and task views." },
  ],
  progress: [{ id: 3, title: "Build settings screen", dueDate: "2026-03-12", assignees: ["Jordan Lee"], priority: "Medium", tags: ["Engineering", "Design"], detail: "Build the account and workspace settings experience." }],
  review: [{ id: 4, title: "Review mobile navigation", dueDate: "2026-03-11", assignees: ["Sam Rivera"], priority: "Medium", tags: ["Design"], detail: "Check navigation behavior and spacing across supported mobile widths." }],
  done: [{ id: 5, title: "Create project workspace", dueDate: "2026-03-08", assignees: ["Taylor Kim"], priority: "Low", tags: ["Engineering"], detail: "Set up the core project workspace structure and permissions." }],
};

const blankForm = { title: "", dueDate: "", assignees: [] as string[], priority: "Medium" as Priority, tags: [tagOptions[0]], detail: "" };
const inputClass = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none placeholder:text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20";

export function Kanban() {
  const [tasks, setTasks] = useState(initialTasks);
  const [nextId, setNextId] = useState(6);
  const [form, setForm] = useState(blankForm);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ task: Task; column: ColumnId } | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<{ task: Task; column: ColumnId } | null>(null);
  const [editing, setEditing] = useState<EditableField | null>(null);
  const [dragged, setDragged] = useState<{ task: Task; from: ColumnId } | null>(null);

  function moveTask(task: Task, from: ColumnId, to: ColumnId) {
    if (from === to) return;
    setTasks((current) => ({ ...current, [from]: current[from].filter((item) => item.id !== task.id), [to]: [...current[to], task] }));
    setSelectedTask((current) => current?.task.id === task.id ? { ...current, column: to } : current);
  }

  function updateTask(taskId: number, changes: Partial<Task>, from?: ColumnId, to?: ColumnId) {
    if (from && to && from !== to) {
      const task = tasks[from].find((item) => item.id === taskId);
      if (task) moveTask({ ...task, ...changes }, from, to);
      return;
    }
    setTasks((current) => Object.fromEntries(Object.entries(current).map(([column, items]) => [column, (items as Task[]).map((task) => task.id === taskId ? { ...task, ...changes } : task)])) as Record<ColumnId, Task[]>);
    setSelectedTask((current) => current?.task.id === taskId ? { ...current, task: { ...current.task, ...changes } } : current);
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return;
    const task: Task = { id: nextId, title: form.title.trim(), dueDate: form.dueDate, assignees: form.assignees, priority: form.priority, tags: form.tags, detail: form.detail.trim() || "No additional description provided." };
    setTasks((current) => ({ ...current, todo: [...current.todo, task] }));
    setNextId((id) => id + 1);
    setForm({ ...blankForm, assignees: [] });
    setIsAdding(false);
  }

  function deleteTask() {
    if (!taskToDelete) return;
    setTasks((current) => ({ ...current, [taskToDelete.column]: current[taskToDelete.column].filter((task) => task.id !== taskToDelete.task.id) }));
    setTaskToDelete(null);
    setSelectedTask(null);
  }

  return <>
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-6"><div><h3 className="text-base font-semibold">Product launch board</h3><p className="mt-1 text-sm leading-6 text-secondary">Drag tasks between columns or open a task for more details.</p></div><Button size="sm" onClick={() => setIsAdding(true)}>+ Add task</Button></div>
      <div className="grid gap-px bg-border md:grid-cols-2 xl:grid-cols-4">{columns.map((column) => <section key={column.id} className="min-w-0 bg-subtle p-4" onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragged) moveTask(dragged.task, dragged.from, column.id); setDragged(null); }} aria-labelledby={`kanban-${column.id}`}>
        <div className="mb-4"><div className="flex items-center gap-2"><h4 id={`kanban-${column.id}`} className="text-sm font-semibold">{column.title}</h4><Badge variant={column.variant || "count"}>{tasks[column.id].length}</Badge></div><p className="mt-1 text-xs text-tertiary">{column.description}</p></div>
        <div className="min-h-32 space-y-3">{tasks[column.id].map((task) => <TaskCard key={task.id} task={task} from={column.id} onClick={() => { setSelectedTask({ task, column: column.id }); setEditing(null); }} onDragStart={() => setDragged({ task, from: column.id })} onMove={moveTask} />)}{tasks[column.id].length === 0 && <p className="rounded-lg border border-dashed border-border-strong px-3 py-6 text-center text-xs text-tertiary">Drop a task here</p>}</div>
      </section>)}</div>
    </Card>

    <Modal open={isAdding} title="Add a task" description="Add the details your team needs to get started." onClose={() => setIsAdding(false)}><form onSubmit={addTask} className="space-y-5">
      <Field label="What has to be done" htmlFor="new-task-title"><input id="new-task-title" required autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What has to be done" className={inputClass} /></Field>
      <MultiSelect id="new-task-assignees" label="Assignees" options={people.map((person) => ({ value: person, label: person }))} value={form.assignees} onChange={(assignees) => setForm({ ...form, assignees })} helperText="Choose one or more team members." />
      <Field label="Due date" htmlFor="new-task-date"><input id="new-task-date" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} className={inputClass} /></Field>
      <Field label="Priority" htmlFor="new-task-priority"><select id="new-task-priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })} className={inputClass}>{["Low", "Medium", "High", "Urgent"].map((priority) => <option key={priority}>{priority}</option>)}</select></Field>
      <MultiSelect id="new-task-tags" label="Tags" options={tagOptions.map((tag) => ({ value: tag, label: tag }))} value={form.tags} onChange={(tags) => setForm({ ...form, tags })} placeholder="Choose tags" />
      <Field label="Description" htmlFor="new-task-detail"><textarea id="new-task-detail" value={form.detail} onChange={(event) => setForm({ ...form, detail: event.target.value })} placeholder="Add more context (optional)" className="min-h-20 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20" /></Field>
      <div className="flex justify-end gap-3 border-t border-border pt-5"><Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button><Button type="submit">Create task</Button></div>
    </form></Modal>

    <Modal open={Boolean(selectedTask)} title={selectedTask?.task.title || "Task details"} description="Click the pen icon beside any field to edit it." onClose={() => { setSelectedTask(null); setEditing(null); }} headerAction={<Button type="button" variant="danger" className="h-8 w-8 px-0" onClick={() => { if (selectedTask) { setSelectedTask(null); setEditing(null); setTaskToDelete(selectedTask); } }} aria-label="Delete task" title="Delete task">🗑</Button>}>{selectedTask && <TaskDetails task={selectedTask.task} column={selectedTask.column} editing={editing} setEditing={setEditing} updateTask={updateTask} closeDetails={() => { setSelectedTask(null); setEditing(null); }} />}</Modal>
    <Modal open={Boolean(taskToDelete)} title="Delete task?" description="This action cannot be undone." onClose={() => setTaskToDelete(null)}><div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setTaskToDelete(null)}>Cancel</Button><Button variant="danger" onClick={deleteTask}>Delete task</Button></div></Modal>
  </>;
}

function TaskDetails({ task, column, editing, setEditing, updateTask, closeDetails }: { task: Task; column: ColumnId; editing: EditableField | null; setEditing: (field: EditableField | null) => void; updateTask: (id: number, changes: Partial<Task>, from?: ColumnId, to?: ColumnId) => void; closeDetails: () => void }) {
  const editButton = (field: EditableField, label: string) => <button type="button" onClick={() => setEditing(editing === field ? null : field)} className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-secondary hover:bg-muted hover:text-primary" aria-label={`Edit ${label}`}>✎</button>;
  return <div className="space-y-5"><div><EditableText label="Title" value={task.title} editing={editing === "title"} onEdit={editButton("title", "title")} onSave={(value) => { updateTask(task.id, { title: value || task.title }); setEditing(null); }} /><EditableText label="Description" value={task.detail} editing={editing === "detail"} multiline onEdit={editButton("detail", "description")} onSave={(value) => { updateTask(task.id, { detail: value || "No additional description provided." }); setEditing(null); }} /><div className="grid gap-4 sm:grid-cols-2"><EditableSelect label="Status" value={column} editing={editing === "status"} onEdit={editButton("status", "status")} options={columns.map(({ id, title }) => ({ value: id, label: title }))} onChange={(value) => { updateTask(task.id, {}, column, value as ColumnId); setEditing(null); }} /><EditableInput label="Due date" value={task.dueDate} editing={editing === "dueDate"} onEdit={editButton("dueDate", "due date")} type="date" onSave={(value) => { updateTask(task.id, { dueDate: value }); setEditing(null); }} /><EditableSelect label="Priority" value={task.priority} editing={editing === "priority"} onEdit={editButton("priority", "priority")} options={["Low", "Medium", "High", "Urgent"].map((value) => ({ value, label: value }))} onChange={(value) => { updateTask(task.id, { priority: value as Priority }); setEditing(null); }} /></div><EditableMultiSelect label="Assignees" values={task.assignees} editing={editing === "assignees"} onEdit={editButton("assignees", "assignees")} options={people} onSave={(values) => { updateTask(task.id, { assignees: values }); setEditing(null); }} /><EditableMultiSelect label="Tags" values={task.tags} editing={editing === "tags"} onEdit={editButton("tags", "tags")} options={tagOptions} onSave={(values) => { updateTask(task.id, { tags: values }); setEditing(null); }} /></div><div className="flex justify-end border-t border-border pt-5"><Button type="button" variant="secondary" onClick={closeDetails}>Close</Button></div></div>;
}

function EditableText({ label, value, editing, onEdit, onSave, multiline = false }: { label: string; value: string; editing: boolean; onEdit: React.ReactNode; onSave: (value: string) => void; multiline?: boolean }) { const [draft, setDraft] = useState(value); return <div><div className="mb-1 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">{label}</p>{onEdit}</div>{editing ? <div className="space-y-2">{multiline ? <textarea autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-20 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent" /> : <input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} className={inputClass} />}<Button size="sm" onClick={() => onSave(draft)}>Save</Button></div> : <p className="text-sm leading-6 text-primary">{value}</p>}</div>; }
function EditableInput({ label, value, editing, onEdit, type, onSave }: { label: string; value: string; editing: boolean; onEdit: React.ReactNode; type: string; onSave: (value: string) => void }) { const [draft, setDraft] = useState(value); return <div><div className="mb-1 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">{label}</p>{onEdit}</div>{editing ? <div className="space-y-2"><input autoFocus type={type} value={draft} onChange={(event) => setDraft(event.target.value)} className={inputClass} /><Button size="sm" onClick={() => onSave(draft)}>Save</Button></div> : <p className="text-sm font-medium text-primary">{formatDate(value)}</p>}</div>; }
function EditableSelect({ label, value, editing, onEdit, options, onChange }: { label: string; value: string; editing: boolean; onEdit: React.ReactNode; options: { value: string; label: string }[]; onChange: (value: string) => void }) { return <div><div className="mb-1 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">{label}</p>{onEdit}</div>{editing ? <select autoFocus value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <p className="text-sm font-medium text-primary">{options.find((option) => option.value === value)?.label || value}</p>}</div>; }
function EditableMultiSelect({ label, values, editing, onEdit, options, onSave }: { label: string; values: string[]; editing: boolean; onEdit: React.ReactNode; options: string[]; onSave: (values: string[]) => void }) { const [draft, setDraft] = useState(values); return <div><div className="mb-1 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">{label}</p>{onEdit}</div>{editing ? <div className="space-y-2"><MultiSelect autoFocus id={`edit-${label.toLowerCase()}`} options={options.map((option) => ({ value: option, label: option }))} value={draft} onChange={setDraft} placeholder={`Choose ${label.toLowerCase()}`} /><Button size="sm" onClick={() => onSave(draft)}>Save</Button></div> : <div className="flex flex-wrap gap-2">{values.length ? values.map((value) => label === "Assignees" ? <span key={value} className="flex items-center gap-2 rounded-full bg-muted py-1 pl-1 pr-3 text-xs text-secondary"><Avatar name={value} size="sm" />{value}</span> : <Badge key={value} variant="neutral">{value}</Badge>) : <p className="text-sm text-secondary">None</p>}</div>}</div>; }
function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) { return <div className="space-y-1.5"><label htmlFor={htmlFor} className="block text-sm font-medium text-primary">{label}</label>{children}</div>; }
function formatDate(date: string) { if (!date) return "No due date"; return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${date}T00:00:00`)); }
function TaskCard({ task, from, onClick, onDragStart, onMove }: { task: Task; from: ColumnId; onClick: () => void; onDragStart: () => void; onMove: (task: Task, from: ColumnId, to: ColumnId) => void }) { return <article draggable onDragStart={onDragStart} onClick={(event) => { if ((event.target as HTMLElement).closest("select")) return; onClick(); }} className="group cursor-pointer rounded-lg border border-border bg-surface p-4 transition-colors duration-120 hover:border-border-strong focus-within:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onClick(); } }} aria-label={`${task.title}, ${task.priority} priority`}><div className="flex items-start justify-between gap-3"><h5 className="text-sm font-medium leading-5 text-primary">{task.title}</h5><span className={`shrink-0 text-[11px] font-medium ${task.priority === "Urgent" || task.priority === "High" ? "text-danger" : task.priority === "Medium" ? "text-warning" : "text-secondary"}`}>{task.priority}</span></div><p className="mt-2 text-xs text-secondary">{task.tags.join(" · ") || "No tags"} · {formatDate(task.dueDate)}</p><div className="mt-4 flex items-center justify-between gap-2"><div className="flex -space-x-1" aria-label={`Assigned to ${task.assignees.join(", ")}`}>{task.assignees.map((person) => <Avatar key={person} name={person} size="sm" className="border-2 border-surface" />)}</div><label className="sr-only" htmlFor={`move-${task.id}`}>Move {task.title}</label><select id={`move-${task.id}`} value={from} onChange={(event) => onMove(task, from, event.target.value as ColumnId)} onClick={(event) => event.stopPropagation()} className="h-8 max-w-[116px] rounded-md border border-border bg-surface px-2 text-xs text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"><option value="todo">Todo</option><option value="progress">In progress</option><option value="review">In review</option><option value="done">Completed</option></select></div></article>; }
