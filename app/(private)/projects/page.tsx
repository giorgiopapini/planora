import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/ProjectForm";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress } from "@/components/ui";

const projects = [{ name: "Website refresh", status: "In progress", progress: 72, detail: "12 tasks remaining" }, { name: "Mobile app launch", status: "On track", progress: 48, detail: "8 tasks remaining" }, { name: "Q3 marketing plan", status: "Planning", progress: 20, detail: "14 tasks remaining" }];

export default async function ProjectsPage() {
  const supabase = await createClient();  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  void userId;

  return <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-10"><header><p className="mb-2 text-sm text-secondary">Workspace / Projects</p><h1 className="text-3xl font-semibold tracking-tight">Projects</h1><p className="mt-2 text-sm text-secondary">Keep every initiative moving forward.</p><div className="mt-5"><ProjectForm /></div></header><div className="grid gap-6 lg:grid-cols-3">{projects.map((project) => <Card key={project.name}><CardHeader><div><CardTitle>{project.name}</CardTitle><CardDescription>{project.detail}</CardDescription></div><Badge variant={project.status === "Planning" ? "neutral" : "success"}>{project.status}</Badge></CardHeader><CardContent><Progress value={project.progress} label={`${project.name} completion`} /></CardContent></Card>)}</div></div>;
}
