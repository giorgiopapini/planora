import { Badge } from "./Badge";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";

type ProjectHealthProps = {
  status: "In progress" | "On track" | "Planning" | "Archived";
  progress: number;
  completedTasks: number;
  totalTasks: number;
  dueDate: string;
};

export function ProjectHealth({ status, progress, completedTasks, totalTasks, dueDate }: ProjectHealthProps) {
  const statusVariant = status === "Planning" ? "neutral" : status === "Archived" ? "danger" : "success";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project health</CardTitle>
        <Badge variant={statusVariant}>{status}</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between gap-4 text-sm"><span className="text-secondary">Overall completion</span><span className="font-semibold text-primary">{progress}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Project completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-border pt-5"><div><p className="text-xl font-semibold tracking-tight">{completedTasks}/{totalTasks}</p><p className="mt-1 text-xs text-secondary">Tasks completed</p></div><div><p className="text-xl font-semibold tracking-tight">{dueDate}</p><p className="mt-1 text-xs text-secondary">Target date</p></div></div>
      </CardContent>
    </Card>
  );
}
