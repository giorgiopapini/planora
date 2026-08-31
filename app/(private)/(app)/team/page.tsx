import { createClient } from "@/lib/supabase/server";
import { TeamMemberForm } from "@/components/TeamMemberForm";
import { requireWorkspace, type WorkspaceSearchParams } from "@/lib/workspace";

type TeamPageProps = { searchParams: WorkspaceSearchParams };

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const selectedWorkspace = await requireWorkspace(searchParams);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  void user;

  return <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-10"><header><p className="mb-2 text-sm text-secondary">{selectedWorkspace} / Team</p><h1 className="text-3xl font-semibold tracking-tight">Team</h1><p className="mt-2 text-sm text-secondary">See who is working across your workspace.</p><div className="mt-5"><TeamMemberForm /></div></header></div>;
}
