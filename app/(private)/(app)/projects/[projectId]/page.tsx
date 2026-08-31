import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectWorkspace } from "@/components/ProjectWorkspace";
import { getProjectBySlug } from "@/lib/projects";
import { requireWorkspace, type WorkspaceSearchParams } from "@/lib/workspace";

type ProjectDetailsPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: WorkspaceSearchParams;
};

export default async function ProjectDetailsPage({ params, searchParams }: ProjectDetailsPageProps) {
  const { projectId } = await params;
  const selectedWorkspace = await requireWorkspace(searchParams);
  const project = getProjectBySlug(projectId);

  if (!project) notFound();

  const workspaceQuery = `?workspace=${encodeURIComponent(selectedWorkspace)}`;

  return <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-10">
    <nav className="flex items-center gap-2 text-sm text-secondary" aria-label="Breadcrumb">
      <Link href={`/projects${workspaceQuery}`} className="transition-colors duration-120 hover:text-primary">Projects</Link>
      <span aria-hidden="true">/</span>
      <span className="truncate text-primary">{project.name}</span>
    </nav>
    <ProjectWorkspace project={project} selectedWorkspace={selectedWorkspace} />
  </div>;
}
