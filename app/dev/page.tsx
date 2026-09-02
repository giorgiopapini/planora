"use client";

import { Kanban } from "@/components/Kanban";
import { ProjectWorkspace } from "@/components/ProjectWorkspace";
import { useState } from "react";
import { Avatar, AvatarGroup, Badge, Button, Calendar, Card, CardContent, CardDescription, CardHeader, CardTitle, DateInput, DeleteIconButton, EditIconButton, GanttChart, Input, MultiSelect, Progress, Select, Separator, Textarea, type CalendarEvent, type GanttTask } from "@/components/ui";

const people = [{ name: "Alex Morgan" }, { name: "Jordan Lee" }, { name: "Sam Rivera" }, { name: "Taylor Kim" }, { name: "Maya Patel" }];
const previewProject = { id: "preview", workspaceId: "preview", slug: "preview", name: "Preview project", status: "In progress" as const, progress: 72, detail: "Preview data", description: "A component-library preview using local data only.", ownerId: "preview-owner", owner: "Alex Morgan", startDate: "01/03/2026", startDateIso: "2026-03-01", dueDate: "30/03/2026", dueDateIso: "2026-03-30", workspace: "Preview workspace", tasks: { completed: 3, total: 5 }, taskList: [], milestones: [], team: [{ userId: "preview-owner", name: "Alex Morgan", role: "Project owner" }], activity: [], workflowStatuses: [] };

const previewTasks: GanttTask[] = [
  { id: "research", name: "Discovery and research", start: "2026-09-01", end: "2026-09-05", progress: 100, status: "Completed", color: "dark" },
  { id: "design", name: "Interface design", start: "2026-09-04", end: "2026-09-11", progress: 68, status: "In progress" },
  { id: "build", name: "Build and integration", start: "2026-09-10", end: "2026-09-19", progress: 24, status: "In progress" },
  { id: "launch", name: "Launch", start: "2026-09-22", end: "2026-09-22", status: "Milestone", milestone: true },
];

const previewEvents: CalendarEvent[] = [
  { id: "design-review", date: "2026-09-08", title: "Design review", color: "dark" },
  { id: "team-sync", date: "2026-09-10", title: "Team sync", color: "accent" },
  { id: "release", date: "2026-09-22", title: "Release day", color: "muted" },
];

export default function DevPage() {
  const [selectedPeople, setSelectedPeople] = useState([people[0].name]);
  const [selectedTags, setSelectedTags] = useState(["Engineering"]);
  const peopleOptions = people.map(({ name }) => ({ value: name, label: name }));
  const tagOptions = ["Engineering", "Design", "Product", "Content", "Marketing"].map((tag) => ({ value: tag, label: tag }));

  return <main className="min-h-screen bg-page px-4 py-10 text-primary sm:px-6 lg:px-10"><div className="mx-auto max-w-6xl space-y-10"><header className="border-b border-border pb-8"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-accent">Planora UI</p><h1 className="text-3xl font-semibold tracking-tight">Component library</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">A living reference for the reusable primitives used throughout the project-management workspace.</p></header>

<section className="space-y-4"><SectionTitle title="Buttons" /><Card><CardContent className="flex flex-wrap items-center gap-3 pt-6"><Button>New project</Button><EditIconButton aria-label="Edit item" /><DeleteIconButton aria-label="Delete item" /><Button variant="secondary">View details</Button><Button variant="success">✓ Completed</Button><Button variant="ghost">Cancel</Button><Button variant="danger">Delete project</Button><Button size="sm">Small action</Button><Button size="lg">Large action</Button><Button disabled>Disabled</Button></CardContent></Card></section>
<section className="space-y-4"><SectionTitle title="Badges and status" /><Card><CardContent className="flex flex-wrap items-center gap-3 pt-6"><Badge>24</Badge><Badge variant="success">Completed</Badge><Badge variant="neutral">In progress</Badge><Badge variant="warning">At risk</Badge><Badge variant="danger">Overdue</Badge></CardContent></Card></section>
<section className="grid gap-6 lg:grid-cols-2"><div className="space-y-4"><SectionTitle title="Form controls" /><Card><CardContent className="space-y-5 pt-6"><Input id="project-name" label="Project name" placeholder="e.g. Website refresh" helperText="Choose a memorable name for your workspace." /><Input id="project-error" label="Owner email" defaultValue="not-an-email" error="Enter a valid email address." /><Textarea id="component-description" label="Description" placeholder="Add a description" helperText="Shared textarea component." /><DateInput id="component-date" label="Due date" defaultValue="2026-09-17" helperText="Shared date input component." /><Select id="project-status" label="Status" defaultValue="progress"><option value="progress">In progress</option><option value="todo">Todo</option><option value="done">Completed</option></Select><MultiSelect id="component-assignees" label="Assignees" options={peopleOptions} value={selectedPeople} onChange={setSelectedPeople} helperText="Choose one or more team members." /><MultiSelect id="component-tags" label="Tags" options={tagOptions} value={selectedTags} onChange={setSelectedTags} placeholder="Choose tags" /></CardContent></Card></div><div className="space-y-4"><SectionTitle title="Avatars and progress" /><Card><CardContent className="space-y-6 pt-6"><div className="flex items-center gap-4"><Avatar name="Alex Morgan" size="lg" /><Avatar name="Jordan Lee" /><Avatar name="Sam Rivera" size="sm" /><AvatarGroup people={people} /></div><Separator /><Progress value={72} label="Team workload" /><Progress value={38} label="Project completion" /></CardContent></Card></div></section>
<section className="space-y-4"><SectionTitle title="Dashboard card patterns" /><div className="grid gap-6 md:grid-cols-3"><StatCard label="Completed" value="14" detail="+12% this month" /><StatCard label="Created" value="8" detail="Across 4 projects" /><StatCard label="Due soon" value="3" detail="Next 7 days" danger /></div></section>
<section className="space-y-4"><SectionTitle title="Kanban board" /><Kanban tasks={[]} statuses={["Todo", "In progress", "In review", "Completed"]} onStatusChange={() => undefined} /></section>
<section className="space-y-4"><SectionTitle title="Project details and editing" /><ProjectWorkspace project={previewProject} selectedWorkspace="Preview workspace" /></section>
<section className="space-y-4"><SectionTitle title="Calendar" /><Calendar value="2026-09-08" events={previewEvents} /></section>
<section className="space-y-4"><SectionTitle title="Gantt chart" /><GanttChart tasks={previewTasks} startDate="2026-09-01" endDate="2026-09-26" /></section>
<section className="space-y-4"><SectionTitle title="Data visualization patterns" /><Card><CardHeader><div><CardTitle>Status overview</CardTitle><CardDescription>Current work across all projects</CardDescription></div><Badge variant="success">Updated just now</Badge></CardHeader><CardContent><div className="flex h-4 overflow-hidden rounded-full" aria-label="Status overview: 35% completed, 45% in progress, 20% todo"><div className="w-[35%] bg-tint-900" /><div className="w-[45%] bg-tint-500" /><div className="w-[20%] bg-tint-100" /></div><div className="mt-4 flex flex-wrap gap-4 text-xs text-secondary"><span>Completed 35%</span><span>In progress 45%</span><span>Todo 20%</span></div></CardContent></Card></section>
<section className="space-y-4"><SectionTitle title="List and table patterns" /><Card><CardHeader><div><CardTitle>Recent activity</CardTitle><CardDescription>Latest updates from your team</CardDescription></div><Button variant="secondary" size="sm">See all</Button></CardHeader><CardContent className="space-y-1">{people.slice(0, 4).map((person, index) => <div key={person.name} className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-subtle"><Avatar name={person.name} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-primary">{person.name} <span className="font-normal text-secondary">moved a task to {index % 2 ? "In progress" : "Completed"}</span></p><p className="mt-0.5 text-xs text-tertiary">{index + 1} hour{index ? "s" : ""} ago</p></div><Badge variant={index % 2 ? "neutral" : "success"}>{index % 2 ? "In progress" : "Done"}</Badge></div>)}</CardContent></Card></section>
</div></main>;
}
function SectionTitle({ title }: { title: string }) { return <h2 className="text-sm font-semibold text-secondary">{title}</h2>; }
function StatCard({ label, value, detail, danger = false }: { label: string; value: string; detail: string; danger?: boolean }) { return <Card><CardContent className="pt-6"><div className={`mb-5 flex h-10 w-10 items-center justify-center rounded-lg ${danger ? "bg-danger-soft text-danger" : "bg-tint-100 text-accent"}`} aria-hidden="true">{danger ? "!" : "✓"}</div><p className="text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-sm text-secondary">{label}</p><p className="mt-4 text-xs text-tertiary">{detail}</p></CardContent></Card>; }
