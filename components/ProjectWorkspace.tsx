"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createTask, deleteProject, deleteTask, updateProject, updateTask as updateTaskAction } from "@/app/actions";
import { DeletionConfirmation } from "@/components/DeletionConfirmation";
import { Avatar, AvatarGroup, Badge, Button, Card, IconButton, CardContent, CardDescription, CardHeader, CardTitle, Input, Modal, MultiSelect, ProjectHealth, Select } from "@/components/ui";
import type { Project, ProjectStatus, ProjectTask, TaskPriority, TaskStatus } from "@/lib/projects";

type ProjectWorkspaceProps = { project: Project; selectedWorkspace: string; workspaceMembers?: { userId: string; name: string }[] };
type NewTaskForm = { title: string; detail: string; dueDate: string; priority: TaskPriority; assigneeId: string };

const priorities: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];
const projectStatuses: ProjectStatus[] = ["Planning", "In progress", "On track", "Archived"];
const blankTask: NewTaskForm = { title: "", detail: "", dueDate: "", priority: "Medium", assigneeId: "" };
const inputClass = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none placeholder:text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20";
const noDueDate = "No due date";

export function ProjectWorkspace({ project: initialProject, selectedWorkspace, workspaceMembers = initialProject.team.map((member) => ({ userId: member.userId, name: member.name })) }: ProjectWorkspaceProps) {
  const [project, setProject] = useState(initialProject);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TaskStatus>("All");
  const [priorityFilter, setPriorityFilter] = useState<"All" | TaskPriority>("All");
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [projectConfirmation, setProjectConfirmation] = useState("");
  const [isDeletingProjectRequest, setIsDeletingProjectRequest] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [taskForm, setTaskForm] = useState(blankTask);
  const [error, setError] = useState("");

  const taskStatuses = useMemo(() => project.workflowStatuses.map((status) => status.name).length ? project.workflowStatuses.map((status) => status.name) : Array.from(new Map(project.taskList.map((task) => [task.status, task.status])).values()), [project.taskList, project.workflowStatuses]);
  const filteredTasks = useMemo(() => project.taskList.filter((task) => {
    const matchesSearch = `${task.title} ${task.detail} ${task.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (statusFilter === "All" || task.status === statusFilter) && (priorityFilter === "All" || task.priority === priorityFilter);
  }), [project.taskList, priorityFilter, search, statusFilter]);

  async function saveProject(changes: { name: string; description: string; status: ProjectStatus; ownerId: string; startDate: string; dueDate: string; memberIds: string[] }) {
    try {
      await updateProject({ projectId: project.id, ...changes });
      const owner = workspaceMembers.find((member) => member.userId === changes.ownerId);
      setProject((current) => ({ ...current, name: changes.name, description: changes.description, status: changes.status, ownerId: changes.ownerId, owner: owner?.name || current.owner, startDate: formatInputDate(changes.startDate), startDateIso: changes.startDate, dueDate: formatInputDate(changes.dueDate), dueDateIso: changes.dueDate, team: changes.memberIds.map((userId) => { const member = workspaceMembers.find((item) => item.userId === userId); return member ? { ...member, role: userId === changes.ownerId ? "Project owner" : "Project team" } : { userId, name: "User", role: "Project team" }; }) }));
      setIsEditingProject(false);
      setError("");
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Project could not be updated."); }
  }

  async function removeProject() {
    if (projectConfirmation !== project.name) return;
    setIsDeletingProjectRequest(true);
    setError("");
    try {
      await deleteProject({ projectId: project.id, projectName: projectConfirmation });
      router.push(`/projects?workspace=${encodeURIComponent(project.workspaceId)}`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Project could not be deleted.");
      setIsDeletingProjectRequest(false);
    }
  }

  function openProjectDeletion() {
    setIsEditingProject(false);
    setProjectConfirmation("");
    setError("");
    setIsDeletingProject(true);
  }

  async function changeTask(taskId: string, changes: Partial<ProjectTask>) {
    const task = project.taskList.find((item) => item.id === taskId);
    if (!task) return;
    try {
      await updateTaskAction({ taskId, title: changes.title, description: changes.detail, dueDate: changes.dueDate === undefined ? undefined : changes.dueDate === "No due date" ? null : toInputDate(changes.dueDate), priority: changes.priority, statusName: changes.status, assigneeIds: changes.assigneeIds });
      setProject((current) => {
        const taskList = current.taskList.map((item) => item.id === taskId ? { ...item, ...changes, ...(changes.dueDate !== undefined ? { dueDate: changes.dueDate === noDueDate ? noDueDate : formatInputDate(toInputDate(changes.dueDate)), dueDateIso: changes.dueDate === noDueDate ? null : toInputDate(changes.dueDate) } : {}) } : item);
        const completed = taskList.filter((item) => item.status.toLowerCase() === "completed").length;
        return {
          ...current,
          taskList,
          tasks: { ...current.tasks, completed, total: taskList.length },
          progress: taskList.length ? Math.round((completed / taskList.length) * 100) : 0,
        };
      });
      setError("");
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Task could not be updated."); }
  }

  function openTaskEditor(task: ProjectTask) {
    setEditingTask(task);
    setTaskForm({ title: task.title, detail: task.detail === "No description provided." ? "" : task.detail, dueDate: task.dueDateIso || "", priority: task.priority, assigneeId: task.assigneeIds[0] || "" });
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTask || !taskForm.title.trim()) return;
    await changeTask(editingTask.id, { title: taskForm.title, detail: taskForm.detail, dueDate: taskForm.dueDate || noDueDate, priority: taskForm.priority, assigneeIds: taskForm.assigneeId ? [taskForm.assigneeId] : [] });
    setEditingTask(null);
  }

  async function removeTask(taskId: string) {
    try {
      await deleteTask(taskId);
      setProject((current) => {
        const taskList = current.taskList.filter((task) => task.id !== taskId);
        const completed = taskList.filter((task) => task.status.toLowerCase() === "completed").length;
        return { ...current, taskList, tasks: { ...current.tasks, completed, total: taskList.length }, progress: taskList.length ? Math.round((completed / taskList.length) * 100) : 0 };
      });
      setError("");
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Task could not be deleted."); }
  }

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskForm.title.trim()) return;
    try {
      const taskId = await createTask({ projectId: project.id, title: taskForm.title, description: taskForm.detail, dueDate: taskForm.dueDate || null, priority: taskForm.priority, assigneeId: taskForm.assigneeId || undefined });
      const todoStatus = project.workflowStatuses.find((status) => status.name.toLowerCase() === "todo");
      const assignee = workspaceMembers.find((member) => member.userId === taskForm.assigneeId);
      setProject((current) => ({ ...current, taskList: [{ id: taskId, title: taskForm.title.trim(), detail: taskForm.detail.trim() || "No description provided.", status: todoStatus?.name || "Todo", statusId: todoStatus?.id || "", dueDate: taskForm.dueDate ? formatInputDate(taskForm.dueDate) : noDueDate, dueDateIso: taskForm.dueDate || null, assignees: assignee ? [assignee.name] : [], assigneeIds: assignee ? [assignee.userId] : [], priority: taskForm.priority, tags: [], tagIds: [] }, ...current.taskList,], tasks: { ...current.tasks, total: current.tasks.total + 1 } }));
      setTaskForm(blankTask);
      setIsAddingTask(false);
      setError("");
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Task could not be created."); }
  }

  return <div className="space-y-8">
    <header className="flex flex-col justify-between gap-6 border-b border-border pb-8 lg:flex-row lg:items-end"><div className="min-w-0"><div className="mb-3 flex flex-wrap items-center gap-2"><Badge variant={project.status === "Planning" ? "neutral" : project.status === "Archived" ? "danger" : "success"}>{project.status}</Badge><span className="text-xs text-tertiary">{selectedWorkspace}</span></div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{project.name}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-secondary">{project.description}</p></div><div className="flex shrink-0 flex-wrap gap-3"><Button variant="secondary" onClick={() => setIsEditingProject(true)}>Edit project</Button><Button onClick={() => setIsAddingTask(true)}>+ Add task</Button></div></header>
    {error && <p className="rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">{error}</p>}
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]" aria-label="Project overview"><Card><CardHeader><div><CardTitle>Overview</CardTitle><CardDescription>A quick read on the project scope and ownership.</CardDescription></div><AvatarGroup people={project.team} /></CardHeader><CardContent><div className="grid gap-6 sm:grid-cols-3"><InfoItem label="Project owner" value={project.owner} /><InfoItem label="Start date" value={project.startDate} /><InfoItem label="Target date" value={project.dueDate} /></div><div className="mt-6 border-t border-border pt-6"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Description</p><p className="text-sm leading-6 text-secondary">{project.description}</p></div></CardContent></Card><ProjectHealth status={project.status} progress={project.progress} completedTasks={project.tasks.completed} totalTasks={project.tasks.total} dueDate={project.dueDate} /></section>
    <Card><CardHeader className="flex-wrap"><div><CardTitle>Project tasks</CardTitle><CardDescription>Track the work, ownership, and delivery status in one place.</CardDescription></div><Badge variant="count">{project.taskList.length} tasks</Badge></CardHeader><CardContent><div className="grid gap-3 border-b border-border pb-5 md:grid-cols-[minmax(0,1fr)_180px_160px]"><label className="relative block"><span className="sr-only">Search tasks</span><span className="pointer-events-none absolute left-3 top-2.5 text-secondary" aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" className={`${inputClass} pl-9`} /></label><label className="sr-only" htmlFor="task-status-filter">Filter by status</label><select id="task-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | TaskStatus)} className={inputClass}><option value="All">All statuses</option>{taskStatuses.map((status) => <option key={status}>{status}</option>)}</select><label className="sr-only" htmlFor="task-priority-filter">Filter by priority</label><select id="task-priority-filter" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as "All" | TaskPriority)} className={inputClass}><option value="All">All priorities</option>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></div><div className="mt-2 divide-y divide-border">{filteredTasks.map((task) => <TaskRow key={task.id} task={task} statuses={taskStatuses} onStatusChange={(status) => changeTask(task.id, { status })} onEdit={() => openTaskEditor(task)} onDelete={() => void removeTask(task.id)} />)}{filteredTasks.length === 0 && <div className="rounded-lg border border-dashed border-border-strong px-4 py-10 text-center"><p className="text-sm font-medium text-primary">No tasks match these filters.</p><p className="mt-1 text-xs text-secondary">Try a different search or clear one of the filters.</p></div>}</div></CardContent></Card>
    <Modal open={editingTask !== null} title="Edit task" description="Update the task details and assignment." onClose={() => setEditingTask(null)}><form className="space-y-5" onSubmit={saveTask}><Input id="edit-task-title" label="Task name" value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} required /><div className="space-y-1.5"><label htmlFor="edit-task-detail" className="block text-sm font-medium text-primary">Description</label><textarea id="edit-task-detail" rows={3} value={taskForm.detail} onChange={(event) => setTaskForm({ ...taskForm, detail: event.target.value })} className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" /></div><div className="grid gap-5 sm:grid-cols-2"><Input id="edit-task-due-date" label="Due date" type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })} /><Select id="edit-task-priority" label="Priority" value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value as TaskPriority })}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</Select></div><Select id="edit-task-assignee" label="Assignee" value={taskForm.assigneeId} onChange={(event) => setTaskForm({ ...taskForm, assigneeId: event.target.value })}><option value="">Unassigned</option>{workspaceMembers.map((member) => <option key={member.userId} value={member.userId}>{member.name}</option>)}</Select><div className="flex justify-end gap-3 border-t border-border pt-5"><Button type="button" variant="ghost" onClick={() => setEditingTask(null)}>Cancel</Button><Button type="submit">Save changes</Button></div></form></Modal>
    <Modal open={isEditingProject} title="Edit project" description="Keep the project information clear and current for your team." onClose={() => setIsEditingProject(false)}><ProjectEditForm project={project} onSave={saveProject} onCancel={() => setIsEditingProject(false)} onDelete={openProjectDeletion} workspaceMembers={workspaceMembers} /></Modal>
    <DeletionConfirmation open={isDeletingProject} entityName={project.name} entityLabel="project" description={<>Deleting <strong>{project.name}</strong> permanently removes this project, every task, team membership, milestone, and all other related data.</>} confirmation={projectConfirmation} onConfirmationChange={setProjectConfirmation} error={error} deleting={isDeletingProjectRequest} onClose={() => setIsDeletingProject(false)} onConfirm={removeProject} />
    <Modal open={isAddingTask} title="Add a task" description="Give the team enough context to move this work forward." onClose={() => setIsAddingTask(false)}><form className="space-y-5" onSubmit={addTask}><Input id="new-project-task-title" label="Task name" value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} placeholder="e.g. Review launch checklist" required /><div className="space-y-1.5"><label htmlFor="new-project-task-detail" className="block text-sm font-medium text-primary">Description</label><textarea id="new-project-task-detail" value={taskForm.detail} onChange={(event) => setTaskForm({ ...taskForm, detail: event.target.value })} rows={3} placeholder="Add context, links, or a definition of done." className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none placeholder:text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20" /></div><div className="grid gap-5 sm:grid-cols-2"><Input id="new-project-task-due-date" name="dueDate" label="Due date" type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })} /><Select id="new-project-task-priority" label="Priority" value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value as TaskPriority })}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</Select></div><Select id="new-project-task-assignee" label="Assignee" value={taskForm.assigneeId} onChange={(event) => setTaskForm({ ...taskForm, assigneeId: event.target.value })}><option value="">Unassigned</option>{project.team.map((member) => <option key={member.userId} value={member.userId}>{member.name}</option>)}</Select><div className="flex justify-end gap-3 border-t border-border pt-5"><Button type="button" variant="ghost" onClick={() => setIsAddingTask(false)}>Cancel</Button><Button type="submit">Create task</Button></div></form></Modal>
  </div>;
}

function ProjectEditForm({ project, onSave, onCancel, onDelete, workspaceMembers }: { project: Project; onSave: (changes: { name: string; description: string; status: ProjectStatus; ownerId: string; startDate: string; dueDate: string; memberIds: string[] }) => Promise<void>; onCancel: () => void; onDelete: () => void; workspaceMembers: { userId: string; name: string }[] }) {
  const [form, setForm] = useState({ name: project.name, description: project.description, status: project.status, ownerId: project.ownerId, startDate: project.startDateIso, dueDate: project.dueDateIso, memberIds: project.team.map((member) => member.userId) });
  const selectedTeam = form.memberIds.map((userId) => ({ name: workspaceMembers.find((member) => member.userId === userId)?.name || "User" }));
  const memberOptions = workspaceMembers.map((member) => ({ value: member.userId, label: member.name }));
  return <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); if (!form.name.trim() || !form.memberIds.length) return; void onSave({ ...form, name: form.name.trim(), description: form.description.trim(), ownerId: form.memberIds.includes(form.ownerId) ? form.ownerId : form.memberIds[0] }); }}><Input id="edit-project-name" label="Project name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /><div className="space-y-1.5"><label htmlFor="edit-project-description" className="block text-sm font-medium text-primary">Description</label><textarea id="edit-project-description" rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" required /></div><MultiSelect id="edit-project-team" label="Project team" options={memberOptions} value={form.memberIds} onChange={(memberIds) => setForm({ ...form, memberIds, ownerId: memberIds.includes(form.ownerId) ? form.ownerId : memberIds[0] || "" })} placeholder="Choose team members" />{selectedTeam.length > 0 && <div className="flex items-center gap-3 rounded-lg border border-border bg-subtle px-3 py-2"><AvatarGroup people={selectedTeam} /><p className="text-xs text-secondary">{selectedTeam.length} team member{selectedTeam.length === 1 ? "" : "s"} selected</p></div>}<div className="grid gap-5 sm:grid-cols-2"><Select id="edit-project-status" label="Status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProjectStatus })}>{projectStatuses.map((status) => <option key={status}>{status}</option>)}</Select><Select id="edit-project-owner" label="Owner" value={form.ownerId} onChange={(event) => setForm({ ...form, ownerId: event.target.value })} disabled={!form.memberIds.length}><option value="">Select an owner</option>{workspaceMembers.filter((member) => form.memberIds.includes(member.userId)).map((member) => <option key={member.userId} value={member.userId}>{member.name}</option>)}</Select></div><div className="grid gap-5 sm:grid-cols-2"><Input id="edit-project-start-date" label="Start date" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} required /><Input id="edit-project-due-date" label="Target date" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} required /></div><div className="border-t border-border pt-5"><button type="button" onClick={onDelete} className="cursor-pointer text-sm font-medium text-danger underline underline-offset-4 hover:text-red-700">Delete project</button><div className="mt-5 flex justify-end gap-3"><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={!form.memberIds.length}>Save changes</Button></div></div></form>;
}

function TaskRow({ task, statuses, onStatusChange, onEdit, onDelete }: { task: ProjectTask; statuses: string[]; onStatusChange: (status: string) => void; onEdit: () => void; onDelete: () => void }) {
  const priorityVariant = task.priority === "Urgent" ? "danger" : task.priority === "High" ? "warning" : "neutral";
  const formattedDueDate = formatTaskDate(task.dueDateIso);
  return <article className="flex flex-col gap-4 rounded-lg px-3 py-4 transition-colors duration-120 hover:bg-subtle sm:flex-row sm:items-center"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm ${task.status.toLowerCase() === "completed" ? "border-accent bg-accent text-white" : "border-border-strong bg-surface text-transparent"}`} aria-hidden="true">✓</div><div className="min-w-0 flex-1"><p className={`text-sm font-medium ${task.status.toLowerCase() === "completed" ? "text-secondary line-through" : "text-primary"}`}>{task.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-secondary">{task.detail}</p><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-tertiary"><span>{formattedDueDate}</span><span aria-hidden="true">·</span><span>{task.assignees.length ? task.assignees.join(", ") : "Unassigned"}</span>{task.tags.length > 0 && <><span aria-hidden="true">·</span><span>{task.tags.join(", ")}</span></>}</div></div><div className="flex items-center gap-2 sm:shrink-0"><Badge variant={priorityVariant}>{task.priority}</Badge><label className="sr-only" htmlFor={`project-task-status-${task.id}`}>Status for {task.title}</label><select id={`project-task-status-${task.id}`} value={task.status} onChange={(event) => onStatusChange(event.target.value)} className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-secondary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20">{statuses.map((status) => <option key={status}>{status}</option>)}</select>{task.assignees[0] && <Avatar name={task.assignees[0]} size="sm" />}<IconButton icon="edit" onClick={onEdit} aria-label={`Edit ${task.title}`} /><IconButton icon="delete" onClick={onDelete} aria-label={`Delete ${task.title}`} /></div></article>;
}

function formatTaskDate(rawDate: string | null) {
  if (!rawDate) return noDueDate;
  const match = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return noDueDate;
  const [, year, month, day] = match;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${year}-${month}-${day}T00:00:00Z`));
}

function InfoItem({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">{label}</p><p className="mt-2 text-sm font-medium text-primary">{value}</p></div>; }
function toInputDate(date: string) { const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (match) return date; const parsed = new Date(date); if (Number.isNaN(parsed.getTime())) return ""; return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}-${String(parsed.getUTCDate()).padStart(2, "0")}`; }
function formatInputDate(date: string) { if (!date) return noDueDate; const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!match) return noDueDate; const [, year, month, day] = match; return `${day}/${month}/${year}`; }
