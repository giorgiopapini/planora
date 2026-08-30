import { createClient } from "@/lib/supabase/server";
import { TeamMemberForm } from "@/components/TeamMemberForm";
import { Avatar, Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

const members = [{ name: "Alex Morgan", role: "Product lead", status: "Available" }, { name: "Jordan Lee", role: "Designer", status: "In progress" }, { name: "Sam Rivera", role: "Engineer", status: "Available" }, { name: "Taylor Kim", role: "Marketing", status: "Away" }];

export default async function TeamPage() {
  const supabase = await createClient();  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  void userId;

  return <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-10"><header><p className="mb-2 text-sm text-secondary">Workspace / Team</p><h1 className="text-3xl font-semibold tracking-tight">Team</h1><p className="mt-2 text-sm text-secondary">See who is working across your workspace.</p><div className="mt-5"><TeamMemberForm /></div></header><Card><CardHeader><CardTitle>Team members</CardTitle></CardHeader><CardContent className="grid gap-1 sm:grid-cols-2">{members.map((member) => <div key={member.name} className="flex items-center gap-3 rounded-lg p-3 hover:bg-subtle"><Avatar name={member.name} /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{member.name}</p><p className="text-xs text-secondary">{member.role}</p></div><Badge variant={member.status === "Away" ? "warning" : member.status === "In progress" ? "neutral" : "success"}>{member.status}</Badge></div>)}</CardContent></Card></div>;
}
