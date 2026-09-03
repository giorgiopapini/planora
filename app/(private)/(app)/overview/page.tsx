import Link from "next/link";
import { UserGreeting } from "@/components/UserGreeting";
import { WorkspaceDeletion } from "@/components/WorkspaceDeletion";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
} from "@/components/ui";
import { getCurrentProfile, getOverview } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { requireWorkspace, type WorkspaceSearchParams } from "@/lib/workspace";

type OverviewProps = { searchParams: WorkspaceSearchParams };

export default async function Overview({ searchParams }: OverviewProps) {
  const workspace = await requireWorkspace(searchParams);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getCurrentProfile();
  const overview = await getOverview(
    workspace.id,
    profile?.id || user?.id || "",
  );
  const total =
    overview.status.completed +
    overview.status.inProgress +
    overview.status.todo;
  const completedPercent = total
    ? Math.round((overview.status.completed / total) * 100)
    : 0;
  const inProgressPercent = total
    ? Math.round((overview.status.inProgress / total) * 100)
    : 0;
  const todoPercent = Math.max(0, 100 - completedPercent - inProgressPercent);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-10">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm text-secondary">
            {workspace.name} / Overview
          </p>
          <UserGreeting />
          <p className="mt-2 text-sm text-secondary">
            Here&apos;s what&apos;s happening across your projects.
          </p>
        </div>
        <Link href={`/projects?workspace=${encodeURIComponent(workspace.id)}`}>
          <Button variant="secondary">View projects</Button>
        </Link>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Completed"
          value={overview.metrics.completed}
          detail="Tasks in completed statuses"
        />
        <Metric
          label="Projects"
          value={overview.metrics.created}
          detail="Active projects in workspace"
        />
        <Metric
          label="In progress"
          value={overview.metrics.inProgress}
          detail="Tasks in active statuses"
        />
        <Metric
          label="Due soon"
          value={overview.metrics.dueSoon}
          detail="Due in the next 7 days"
          danger={overview.metrics.dueSoon > 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Status overview</CardTitle>
              <CardDescription>
                Current work across all projects
              </CardDescription>
            </div>
            <Badge variant="success">Live data</Badge>
          </CardHeader>
          <CardContent>
            <div
              className="flex h-4 overflow-hidden rounded-full"
              aria-label={`Status overview: ${completedPercent}% completed, ${inProgressPercent}% in progress, ${todoPercent}% todo`}
            >
              <div
                className="bg-tint-900"
                style={{ width: `${completedPercent}%` }}
              />
              <div
                className="bg-tint-500"
                style={{ width: `${inProgressPercent}%` }}
              />
              <div
                className="bg-tint-100"
                style={{ width: `${todoPercent}%` }}
              />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-xs text-secondary">
              <span>
                Completed{" "}
                <b className="block text-base text-primary">
                  {completedPercent}%
                </b>
              </span>
              <span>
                In progress{" "}
                <b className="block text-base text-primary">
                  {inProgressPercent}%
                </b>
              </span>
              <span>
                Todo{" "}
                <b className="block text-base text-primary">{todoPercent}%</b>
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Team workload</CardTitle>
              <CardDescription>
                Estimated task time against configured capacity
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {overview.workload.map((item) => (
              <Workload key={item.name} name={item.name} value={item.value} />
            ))}
            {overview.workload.length === 0 && (
              <p className="text-sm text-secondary">
                No active team members yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest updates from your team</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-1 sm:grid-cols-2">
          {overview.activity.map((item, index) => (
            <div
              key={`${item.person}-${item.target}-${index}`}
              className="flex items-center gap-3 rounded-lg p-3 hover:bg-subtle"
            >
              <Avatar name={item.person} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.person}</p>
                <p className="text-xs text-secondary">
                  {item.action} {item.target} · {item.time}
                </p>
              </div>
            </div>
          ))}
          {overview.activity.length === 0 && (
            <p className="text-sm text-secondary">
              No activity has been recorded yet.
            </p>
          )}
        </CardContent>
      </Card>

      <WorkspaceDeletion
        workspaceId={workspace.id}
        workspaceName={workspace.name}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  danger = false,
}: {
  label: string;
  value: number;
  detail: string;
  danger?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div
          className={`mb-5 flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${danger ? "bg-danger-soft text-danger" : "bg-tint-100 text-accent"}`}
          aria-hidden="true"
        >
          {danger ? "!" : "✓"}
        </div>
        <p className="text-2xl font-semibold">
          {value.toLocaleString("en-US")}
        </p>
        <p className="mt-1 text-sm text-secondary">{label}</p>
        <p className="mt-4 text-xs text-tertiary">{detail}</p>
      </CardContent>
    </Card>
  );
}
function Workload({ name, value }: { name: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-secondary">{value}%</span>
      </div>
      <Progress value={value} label={`${name} workload`} />
    </div>
  );
}
