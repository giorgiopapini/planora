import { redirect } from "next/navigation";

export type WorkspaceSearchParams = Promise<{ workspace?: string }>;

export async function requireWorkspace(searchParams: WorkspaceSearchParams) {
  const { workspace } = await searchParams;
  if (!workspace?.trim()) redirect("/workspaces");
  return workspace;
}
