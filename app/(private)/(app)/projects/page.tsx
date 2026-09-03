import Link from "next/link";
import { ProjectForm } from "@/components/ProjectForm";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
} from "@/components/ui";
import {
  getProjects,
  getWorkspaceCapabilities,
  getWorkspaceMembers,
} from "@/lib/data";
import { requireWorkspace, type WorkspaceSearchParams } from "@/lib/workspace";

type ProjectsPageProps = { searchParams: WorkspaceSearchParams };

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const workspace = await requireWorkspace(searchParams);
  const capabilities = await getWorkspaceCapabilities(workspace.id);
  const [projects, members] = await Promise.all([
    getProjects(workspace.id, capabilities),
    capabilities.canManageProjects
      ? getWorkspaceMembers(workspace.id)
      : Promise.resolve([]),
  ]);
  const memberOptions = members.map((member) => {
    const profile = Array.isArray(member.profiles)
      ? member.profiles[0]
      : member.profiles;
    return {
      id: member.user_id,
      name: profile?.full_name || profile?.email || "User",
    };
  });
  const workspaceQuery = `?workspace=${encodeURIComponent(workspace.id)}`;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-10">
      <header>
        <p className="mb-2 text-sm text-secondary">
          {workspace.name} / Projects
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-2 text-sm text-secondary">
          Keep every initiative moving forward.
        </p>
        {capabilities.canManageProjects && (
          <div className="mt-5">
            <ProjectForm workspaceId={workspace.id} members={memberOptions} />
          </div>
        )}
      </header>
      <div className="grid gap-6 lg:grid-cols-3">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.slug}${workspaceQuery}`}
            className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Card className="h-full transition-colors duration-120 group-hover:border-border-strong">
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle className="truncate transition-colors duration-120 group-hover:text-accent-hover">
                    {project.name}
                  </CardTitle>
                  <p className="mt-1 text-sm leading-6 text-secondary">
                    {project.detail}
                  </p>
                </div>
                <Badge
                  variant={
                    project.status === "Planning"
                      ? "neutral"
                      : project.status === "Archived"
                        ? "danger"
                        : "success"
                  }
                >
                  {project.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <Progress
                  value={project.progress}
                  label={`${project.name} completion`}
                />
                <div className="mt-4 flex items-center justify-between text-xs text-secondary">
                  <span>
                    {project.tasks.completed} of {project.tasks.total} tasks
                  </span>
                  <span className="font-medium transition-colors duration-120 group-hover:text-accent">
                    View details →
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {projects.length === 0 && (
          <div className="rounded-xl border border-dashed border-border-strong px-6 py-12 text-center lg:col-span-3">
            <p className="text-sm font-medium text-primary">
              No projects in this workspace yet.
            </p>
            <p className="mt-1 text-sm text-secondary">
              Create a project to give your team a shared place to work.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
