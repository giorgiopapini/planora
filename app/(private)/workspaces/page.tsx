import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getWorkspaces } from "@/lib/data";
import { Card, CardContent } from "@/components/ui";
import { WorkspaceList } from "@/components/WorkspaceList";
import { WorkspaceUserMenu } from "@/components/WorkspaceSelector";

export default async function WorkspacesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/landing");
  const [profile, workspaces] = await Promise.all([
    getCurrentProfile(),
    getWorkspaces(),
  ]);
  const name = profile?.full_name || user.email?.split("@")[0] || "User";

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center">
            <p className="text-4xl font-semibold tracking-tight">
              planora<span className="text-accent">.</span>
            </p>
            <WorkspaceUserMenu name={name} />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Choose a workspace to continue.
            </p>
          </div>
          <div className="mt-8">
            <WorkspaceList workspaces={workspaces} />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
