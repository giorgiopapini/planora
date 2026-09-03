import { Avatar } from "./Avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./Card";

type TeamMember = { name: string; role: string };

export function ProjectTeam({ members }: { members: TeamMember[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Project team</CardTitle>
          <CardDescription>
            People responsible for moving this forward.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.map((member) => (
          <div key={member.name} className="flex items-center gap-3">
            <Avatar name={member.name} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary">{member.name}</p>
              <p className="mt-0.5 text-xs text-secondary">{member.role}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
