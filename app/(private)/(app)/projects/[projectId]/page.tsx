import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectWorkspace } from "@/components/ProjectWorkspace";
import {
  getProject,
  getWorkspaceCapabilities,
  getWorkspaceMembers,
} from "@/lib/data";
import { requireWorkspace, type WorkspaceSearchParams } from "@/lib/workspace";

type ProjectDetailsPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: WorkspaceSearchParams;
};

export default async function ProjectDetailsPage({
  params,
  searchParams,
}: ProjectDetailsPageProps) {
  const { projectId } = await params;
  const workspace = await requireWorkspace(searchParams);
  const capabilities = await getWorkspaceCapabilities(workspace.id);
  const project = await getProject(workspace.id, projectId, capabilities);
  if (!project) notFound();
  const workspaceMembers = (
    capabilities.canManageTasks ? await getWorkspaceMembers(workspace.id) : []
  ).map((member) => {
    const profile = Array.isArray(member.profiles)
      ? member.profiles[0]
      : member.profiles;
    return {
      userId: member.user_id,
      name: profile?.full_name || profile?.email || "User",
    };
  });
  const workspaceQuery = `?workspace=${encodeURIComponent(workspace.id)}`;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-10">
      <nav
        className="flex items-center gap-2 text-sm text-secondary"
        aria-label="Breadcrumb"
      >
        <Link
          href={`/projects${workspaceQuery}`}
          className="transition-colors duration-120 hover:text-primary"
        >
          Projects
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-primary">{project.name}</span>
      </nav>
      <ProjectWorkspace
        project={project}
        selectedWorkspace={workspace.name}
        workspaceMembers={workspaceMembers}
        capabilities={capabilities}
      />
    </div>
  );
}
