import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type WorkspaceSearchParams = Promise<{ workspace?: string }>;
export type Workspace = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
};

export async function requireWorkspace(
  searchParams: WorkspaceSearchParams,
): Promise<Workspace> {
  const { workspace: reference } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/landing");

  const { data: memberships, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(id, name, slug, description, owner_id)")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (error) throw new Error(error.message);

  const workspaces = (memberships ?? [])
    .map((membership) => {
      const workspace = Array.isArray(membership.workspaces)
        ? membership.workspaces[0]
        : membership.workspaces;
      return workspace ? { ...workspace, ownerId: workspace.owner_id } : null;
    })
    .filter(Boolean) as Workspace[];
  const selected = reference
    ? workspaces.find(
        (item) =>
          item.id === reference ||
          item.slug === reference ||
          item.name === reference,
      )
    : workspaces[0];
  if (!selected) redirect("/workspaces");
  return selected;
}
