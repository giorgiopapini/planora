import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserFullName } from "@/lib/user";
import { Card, CardContent } from "@/components/ui";
import { WorkspaceUserMenu } from "@/components/WorkspaceSelector";

const workspaces = ["Product Development", "Marketing", "Operations"];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/landing");

  const name = getUserFullName(user);

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center">
            <p className="text-3xl font-semibold tracking-tight">planora<span className="text-accent">.</span></p>
            <WorkspaceUserMenu name={name} />
            <h1 className="mt-8 text-2xl font-semibold tracking-tight">Welcome back!</h1>
            <p className="mt-2 text-sm leading-6 text-secondary">Choose a workspace to continue.</p>
          </div>
          <div className="mt-8 space-y-3" aria-label="Your workspaces">
            {workspaces.map((workspace) => (
              <a
                key={workspace}
                href={`/overview?workspace=${encodeURIComponent(workspace)}`}
                className="flex min-h-14 items-center justify-between rounded-lg border border-border bg-surface px-4 text-sm font-medium transition-colors duration-120 ease-out hover:border-accent-border hover:bg-accent-soft focus-visible:border-accent"
              >
                <span>{workspace}</span>
                <span className="text-lg text-secondary" aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
