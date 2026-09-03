import { Badge } from "./Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./Card";

type TimelineItem = {
  title: string;
  date: string;
  status: "Completed" | "In progress" | "Upcoming";
};

export function ProjectTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Milestones</CardTitle>
          <CardDescription>
            Key moments on the path to delivery.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-5" aria-label="Project milestones">
          {items.map((item, index) => {
            const completed = item.status === "Completed";
            return (
              <li key={item.title} className="relative flex gap-4">
                {index < items.length - 1 && (
                  <span
                    className="absolute left-[7px] top-5 h-[calc(100%+4px)] w-px bg-border"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`relative mt-1 h-4 w-4 shrink-0 rounded-full border-2 bg-surface ${completed ? "border-accent bg-accent" : item.status === "In progress" ? "border-accent" : "border-border-strong"}`}
                  aria-hidden="true"
                >
                  {completed && (
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
                      ✓
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium text-primary">
                      {item.title}
                    </p>
                    <Badge
                      variant={
                        completed
                          ? "success"
                          : item.status === "In progress"
                            ? "neutral"
                            : "count"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-secondary">{item.date}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
