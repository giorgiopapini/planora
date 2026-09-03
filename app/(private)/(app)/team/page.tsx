import { TeamMemberForm } from "@/components/TeamMemberForm";
import {
  getWorkspaceCapabilities,
  getWorkspaceInvitations,
  getWorkspaceMembers,
  getWorkspaceRoles,
} from "@/lib/data";
import { requireWorkspace, type WorkspaceSearchParams } from "@/lib/workspace";

type TeamPageProps = { searchParams: WorkspaceSearchParams };

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const workspace = await requireWorkspace(searchParams);
  const capabilities = await getWorkspaceCapabilities(workspace.id);
  const [members, roles, invitations] = await Promise.all([
    getWorkspaceMembers(workspace.id),
    getWorkspaceRoles(workspace.id),
    capabilities.canManageMembers
      ? getWorkspaceInvitations(workspace.id)
      : Promise.resolve([]),
  ]);
  const memberData = members.map((member) => {
    const profile = Array.isArray(member.profiles)
      ? member.profiles[0]
      : member.profiles;
    const role = Array.isArray(member.workspace_roles)
      ? member.workspace_roles[0]
      : member.workspace_roles;
    return {
      id: member.user_id,
      name: profile?.full_name || profile?.email || "User",
      email: profile?.email || "",
      roleId: member.role_id,
      role: role?.name || "Unknown",
      permissionKey: role?.permission_key || "normal_user",
      status: member.status,
      isOwner: member.user_id === workspace.ownerId,
    };
  });
  const roleData = roles.map((role) => ({
    id: role.id,
    name: role.name,
    roleKey: role.role_key,
    permissionKey: role.permission_key || "normal_user",
    isSystem: role.is_system,
  }));
  const invitationData = invitations.map((invitation) => {
    const role = Array.isArray(invitation.workspace_roles)
      ? invitation.workspace_roles[0]
      : invitation.workspace_roles;
    return {
      id: invitation.id,
      email: invitation.email,
      roleId: invitation.role_id,
      role: role?.name || "Unknown",
      permissionKey: role?.permission_key || "normal_user",
    };
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-10">
      <header>
        <p className="mb-2 text-sm text-secondary">{workspace.name} / Team</p>
        <h1 className="text-3xl font-semibold tracking-tight">Team</h1>
        <p className="mt-2 text-sm text-secondary">
          See who is working across your workspace.
        </p>
        <div className="mt-5">
          <TeamMemberForm
            workspaceId={workspace.id}
            members={memberData}
            roles={roleData}
            invitations={invitationData}
            permission={capabilities.permission}
            canManageMembers={capabilities.canManageMembers}
            canManageRoles={capabilities.canManageRoles}
          />
        </div>
      </header>
    </div>
  );
}
