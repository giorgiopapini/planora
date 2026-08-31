"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Avatar, AvatarGroup, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Modal, MultiSelect, ProjectHealth, Select } from "@/components/ui";
import type { Project, ProjectStatus, ProjectTask, TaskPriority, TaskStatus } from "@/lib/projects";

type ProjectWorkspaceProps = { project: Project; selectedWorkspace: string };

type NewTaskForm = { title: string; detail: string; dueDate: string; priority: TaskPriority; assignee: string };

const taskStatuses: TaskStatus[] = ["Todo", "In progress", "In review", "Completed"];
const priorities: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];
const projectStatuses: ProjectStatus[] = ["Planning", "In progress", "On track"];
const teamMembers = ["Alex Morgan", "Jordan Lee", "Sam Rivera", "Taylor Kim", "Maya Patel"];
const teamMemberOptions = teamMembers.map((name) => ({ value: name, label: name }));
const blankTask: NewTaskForm = { title: "", detail: "", dueDate: "", priority: "Medium", assignee: "" };
const inputClass = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none placeholder:text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20";

export function ProjectWorkspace({ project: initialProject, selectedWorkspace }: ProjectWorkspaceProps) {
  const [project, setProject] = useState(() => ({ ...initialProject, team: [...initialProject.team], taskList: [...initialProject.taskList] }));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TaskStatus>("All");
  const [priorityFilter, setPriorityFilter] = useState<"All" | TaskPriority>("All");
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskForm, setTaskForm] = useState(blankTask);

  const filteredTasks = useMemo(() => project.taskList.filter((task) => {
    const matchesSearch = `${task.title} ${task.detail} ${task.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  }), [project.taskList, priorityFilter, search, statusFilter]);

  function updateProject(changes: Partial<Pick<Project, "name" | "description" | "status" | "owner" | "startDate" | "dueDate">> & { team?: Project["team"] }) {
    setProject((current) => ({ ...current, ...changes }));
    setIsEditingProject(false);
  }

  function updateTask(taskId: string, changes: Partial<ProjectTask>) {
    setProject((current) => ({ ...current, taskList: current.taskList.map((task) => task.id === taskId ? { ...task, ...changes } : task) }));
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskForm.title.trim()) return;
    const newTask: ProjectTask = {
      id: `${project.slug}-${Date.now()}`,
      title: taskForm.title.trim(),
      detail: taskForm.detail.trim() || "No additional description provided.",
      status: "Todo",
      dueDate: taskForm.dueDate ? formatInputDate(taskForm.dueDate) : "No due date",
      assignees: taskForm.assignee ? [taskForm.assignee] : [],
      priority: taskForm.priority,
      tags: [],
    };
    setProject((current) => ({ ...current, taskList: [newTask, ...current.taskList] }));
    setTaskForm(blankTask);
    setIsAddingTask(false);
  }

  return <div className="space-y-8">
    <header className="flex flex-col justify-between gap-6 border-b border-border pb-8 lg:flex-row lg:items-end">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2"><Badge variant={project.status === "Planning" ? "neutral" : "success"}>{project.status}</Badge><span className="text-xs text-tertiary">{selectedWorkspace}</span></div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{project.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary">{project.description}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-3"><Button variant="secondary" onClick={() => setIsEditingProject(true)}>Edit project</Button><Button onClick={() => setIsAddingTask(true)}>+ Add task</Button></div>
    </header>

    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]" aria-label="Project overview">
      <Card>
        <CardHeader><div><CardTitle>Overview</CardTitle><CardDescription>A quick read on the project scope and ownership.</CardDescription></div><AvatarGroup people={project.team} /></CardHeader>
        <CardContent><div className="grid gap-6 sm:grid-cols-3"><InfoItem label="Project owner" value={project.owner} /><InfoItem label="Start date" value={project.startDate} /><InfoItem label="Target date" value={project.dueDate} /></div><div className="mt-6 border-t border-border pt-6"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Description</p><p className="text-sm leading-6 text-secondary">{project.description}</p></div></CardContent>
      </Card>
      <ProjectHealth status={project.status} progress={project.progress} completedTasks={project.tasks.completed} totalTasks={project.tasks.total} dueDate={project.dueDate} />
    </section>

    <Card>
      <CardHeader className="flex-wrap"><div><CardTitle>Project tasks</CardTitle><CardDescription>Track the work, ownership, and delivery status in one place.</CardDescription></div><Badge variant="count">{project.taskList.length} tasks</Badge></CardHeader>
      <CardContent>
        <div className="grid gap-3 border-b border-border pb-5 md:grid-cols-[minmax(0,1fr)_180px_160px]"><label className="relative block"><span className="sr-only">Search tasks</span><span className="pointer-events-none absolute left-3 top-2.5 text-secondary" aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" className={`${inputClass} pl-9`} /></label><label className="sr-only" htmlFor="task-status-filter">Filter by status</label><select id="task-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | TaskStatus)} className={inputClass}><option value="All">All statuses</option>{taskStatuses.map((status) => <option key={status}>{status}</option>)}</select><label className="sr-only" htmlFor="task-priority-filter">Filter by priority</label><select id="task-priority-filter" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as "All" | TaskPriority)} className={inputClass}><option value="All">All priorities</option>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></div>
        <div className="mt-2 divide-y divide-border">{filteredTasks.map((task) => <TaskRow key={task.id} task={task} onStatusChange={(status) => updateTask(task.id, { status })} />)}{filteredTasks.length === 0 && <div className="rounded-lg border border-dashed border-border-strong px-4 py-10 text-center"><p className="text-sm font-medium text-primary">No tasks match these filters.</p><p className="mt-1 text-xs text-secondary">Try a different search or clear one of the filters.</p></div>}</div>
      </CardContent>
    </Card>

    <Modal open={isEditingProject} title="Edit project" description="Keep the project information clear and current for your team." onClose={() => setIsEditingProject(false)}><ProjectEditForm project={project} onSave={updateProject} onCancel={() => setIsEditingProject(false)} /></Modal>
    <Modal open={isAddingTask} title="Add a task" description="Give the team enough context to move this work forward." onClose={() => setIsAddingTask(false)}><form className="space-y-5" onSubmit={addTask}><Input id="new-project-task-title" label="Task name" value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} placeholder="e.g. Review launch checklist" required /><div className="space-y-1.5"><label htmlFor="new-project-task-detail" className="block text-sm font-medium text-primary">Description</label><textarea id="new-project-task-detail" value={taskForm.detail} onChange={(event) => setTaskForm({ ...taskForm, detail: event.target.value })} rows={3} placeholder="Add context, links, or a definition of done." className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none placeholder:text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20" /></div><div className="grid gap-5 sm:grid-cols-2"><Input id="new-project-task-due-date" label="Due date" type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })} /><Select id="new-project-task-priority" label="Priority" value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value as TaskPriority })}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</Select></div><Select id="new-project-task-assignee" label="Assignee" value={taskForm.assignee} onChange={(event) => setTaskForm({ ...taskForm, assignee: event.target.value })}><option value="">Unassigned</option>{project.team.map((member) => <option key={member.name}>{member.name}</option>)}</Select><div className="flex justify-end gap-3 border-t border-border pt-5"><Button type="button" variant="ghost" onClick={() => setIsAddingTask(false)}>Cancel</Button><Button type="submit">Create task</Button></div></form></Modal>
  </div>;
}

function ProjectEditForm({ project, onSave, onCancel }: { project: Project; onSave: (changes: Partial<Pick<Project, "name" | "description" | "status" | "owner" | "startDate" | "dueDate">> & { team?: Project["team"] }) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: project.name, description: project.description, status: project.status, owner: project.owner, startDate: toInputDate(project.startDate), dueDate: toInputDate(project.dueDate), team: project.team.map((member) => member.name) });
  const selectedTeam = form.team.map((name) => ({ name, role: project.team.find((member) => member.name === name)?.role || "Project team" }));

  function updateTeam(team: string[]) {
    setForm((current) => ({ ...current, team, owner: team.includes(current.owner) ? current.owner : team[0] || "" }));
  }

  return <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); if (!form.name.trim() || !form.team.length) return; onSave({ name: form.name.trim(), description: form.description.trim(), status: form.status, owner: form.owner || form.team[0], startDate: formatDisplayDate(form.startDate), dueDate: formatDisplayDate(form.dueDate), team: selectedTeam }); }}><Input id="edit-project-name" label="Project name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /><div className="space-y-1.5"><label htmlFor="edit-project-description" className="block text-sm font-medium text-primary">Description</label><textarea id="edit-project-description" rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" required /></div><MultiSelect id="edit-project-team" label="Project team" options={teamMemberOptions} value={form.team} onChange={updateTeam} placeholder="Choose team members" helperText="Select everyone assigned to this project." />{selectedTeam.length > 0 && <div className="flex items-center gap-3 rounded-lg border border-border bg-subtle px-3 py-2"><AvatarGroup people={selectedTeam} /><p className="text-xs text-secondary">{selectedTeam.length} team member{selectedTeam.length === 1 ? "" : "s"} selected</p></div>}<div className="grid gap-5 sm:grid-cols-2"><Select id="edit-project-status" label="Status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProjectStatus })}>{projectStatuses.map((status) => <option key={status}>{status}</option>)}</Select><Select id="edit-project-owner" label="Owner" value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} disabled={!form.team.length}><option value="">Select an owner</option>{form.team.map((member) => <option key={member}>{member}</option>)}</Select></div><div className="grid gap-5 sm:grid-cols-2"><Input id="edit-project-start-date" label="Start date" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} required /><Input id="edit-project-due-date" label="Target date" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} required /></div><div className="flex justify-end gap-3 border-t border-border pt-5"><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={!form.team.length}>Save changes</Button></div></form>;
}

function TaskRow({ task, onStatusChange }: { task: ProjectTask; onStatusChange: (status: TaskStatus) => void }) {
  const priorityVariant = task.priority === "Urgent" ? "danger" : task.priority === "High" ? "warning" : "neutral";
  return <article className="flex flex-col gap-4 rounded-lg px-3 py-4 transition-colors duration-120 hover:bg-subtle sm:flex-row sm:items-center"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm ${task.status === "Completed" ? "border-accent bg-accent text-white" : "border-border-strong bg-surface text-transparent"}`} aria-hidden="true">✓</div><div className="min-w-0 flex-1"><p className={`text-sm font-medium ${task.status === "Completed" ? "text-secondary line-through" : "text-primary"}`}>{task.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-secondary">{task.detail}</p><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-tertiary"><span>{task.dueDate}</span><span aria-hidden="true">·</span><span>{task.assignees.length ? task.assignees.join(", ") : "Unassigned"}</span>{task.tags.length > 0 && <><span aria-hidden="true">·</span><span>{task.tags.join(", ")}</span></>}</div></div><div className="flex items-center gap-2 sm:shrink-0"><Badge variant={priorityVariant}>{task.priority}</Badge><label className="sr-only" htmlFor={`project-task-status-${task.id}`}>Status for {task.title}</label><select id={`project-task-status-${task.id}`} value={task.status} onChange={(event) => onStatusChange(event.target.value as TaskStatus)} className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20">{taskStatuses.map((status) => <option key={status}>{status}</option>)}</select>{task.assignees[0] && <Avatar name={task.assignees[0]} size="sm" />}</div></article>;
}

function InfoItem({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">{label}</p><p className="mt-2 text-sm font-medium text-primary">{value}</p></div>; }
function formatInputDate(date: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${date}T00:00:00`)); }
function toInputDate(date: string) { const parsed = new Date(date); if (Number.isNaN(parsed.getTime())) return ""; return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`; }
function formatDisplayDate(date: string) { return date ? formatInputDate(date) : "No date"; }
