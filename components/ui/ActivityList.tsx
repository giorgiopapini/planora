import { Avatar } from "./Avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./Card";

type Activity = { person: string; action: string; target: string; time: string };

export function ActivityList({ activities }: { activities: Activity[] }) {
  return <Card><CardHeader><div><CardTitle>Recent activity</CardTitle><CardDescription>Latest updates from the project team.</CardDescription></div></CardHeader><CardContent className="space-y-1">{activities.map((activity) => <div key={`${activity.person}-${activity.target}`} className="flex items-center gap-3 rounded-lg p-3 transition-colors duration-120 hover:bg-subtle"><Avatar name={activity.person} size="sm" /><div className="min-w-0 flex-1"><p className="text-sm text-primary"><span className="font-medium">{activity.person}</span> <span className="text-secondary">{activity.action} {activity.target}</span></p><p className="mt-0.5 text-xs text-tertiary">{activity.time}</p></div></div>)}</CardContent></Card>;
}
