"use client";

import { useState } from "react";
import { createWorkspaceRole, deleteWorkspaceRole, dismissWorkspaceInvitation, inviteWorkspaceMember, removeWorkspaceMember, renameWorkspaceRole, updateWorkspaceMemberRole } from "@/app/actions";
import { Avatar, Badge, Button, Card, IconButton, Input, Modal, Select } from "@/components/ui";

type Member = { id: string; name: string; email: string; roleId: string; role: string; status: string; isOwner: boolean };
type PendingInvitation = { id: string; email: string; roleId: string; role: string };
type PermissionKey = "owner_like" | "project_manager" | "normal_user";
type Role = { id: string; name: string; roleKey: string; permissionKey: PermissionKey; isSystem: boolean };
const inputClass = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none placeholder:text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20";

export function TeamMemberForm({ workspaceId, members: initialMembers, roles: initialRoles, invitations: initialInvitations }: { workspaceId: string; members: Member[]; roles: Role[]; invitations: PendingInvitation[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [pendingInvitations, setPendingInvitations] = useState(initialInvitations);
  const [roles, setRoles] = useState(initialRoles);
  const [open, setOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [invitationToDelete, setInvitationToDelete] = useState<PendingInvitation | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState("");
  const [permissionKey, setPermissionKey] = useState<PermissionKey>("normal_user");
  const [roleDraft, setRoleDraft] = useState("");
  const [roleError, setRoleError] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [memberRoleError, setMemberRoleError] = useState("");
  const [removeError, setRemoveError] = useState("");
  const [invitationRemoveError, setInvitationRemoveError] = useState("");
  const [email, setEmail] = useState("");
  const assignableRoles = roles.filter((role) => role.roleKey !== "owner");
  const [roleId, setRoleId] = useState(initialRoles.find((role) => role.roleKey !== "owner" && role.name === "Member")?.id || initialRoles.find((role) => role.roleKey !== "owner" && !role.isSystem)?.id || "");

  function showRoleError(actionError: unknown) { setRoleError(actionError instanceof Error ? actionError.message : "The change could not be saved."); }
  function showInviteError(actionError: unknown) { setInviteError(actionError instanceof Error ? actionError.message : "The change could not be saved."); }
  function showMemberRoleError(actionError: unknown) { setMemberRoleError(actionError instanceof Error ? actionError.message : "The change could not be saved."); }
  function showRemoveError(actionError: unknown) { setRemoveError(actionError instanceof Error ? actionError.message : "The change could not be saved."); }

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const invitation = await inviteWorkspaceMember({ workspaceId, email: email.trim(), roleId });
      setPendingInvitations((current) => [...current, { id: invitation.id, email: invitation.email, roleId: invitation.roleId, role: roles.find((item) => item.id === invitation.roleId)?.name || "Unknown" }]);
      setEmail("");
      setOpen(false);
      setInviteError("");
    } catch (actionError) { showInviteError(actionError); }
  }

  async function addRole() {
    try {
      const role = await createWorkspaceRole({ workspaceId, name: newRole, permissionKey });
      setRoles((current) => [...current, role]);
      setNewRole("");
      setPermissionKey("normal_user");
      setRoleError("");
    } catch (actionError) { showRoleError(actionError); }
  }

  async function saveRole() {
    if (!editingRole) return;
    try {
      await renameWorkspaceRole({ workspaceId, roleId: editingRole.id, name: roleDraft });
      setRoles((current) => current.map((role) => role.id === editingRole.id ? { ...role, name: roleDraft.trim() } : role));
      setEditingRole(null);
      setRoleDraft("");
      setRoleError("");
    } catch (actionError) { showRoleError(actionError); }
  }

  async function deleteRole(role: Role) {
    try {
      await deleteWorkspaceRole({ workspaceId, roleId: role.id });
      const unknownRole = roles.find((item) => item.roleKey === "unknown");
      setMembers((current) => unknownRole ? current.map((member) => member.roleId === role.id ? { ...member, roleId: unknownRole.id, role: unknownRole.name } : member) : current);
      setRoles((current) => current.filter((item) => item.id !== role.id));
      setEditingRole(null);
      setRoleDraft("");
      setRoleError("");
    } catch (actionError) { showRoleError(actionError); }
  }

  function permissionLabel(value: PermissionKey) { return value === "owner_like" ? "Owner-like" : value === "project_manager" ? "Project manager" : "Normal user"; }

  async function saveMemberRole(nextRoleId: string) {
    if (!editingMember || editingMember.isOwner) return;
    try {
      await updateWorkspaceMemberRole({ workspaceId, userId: editingMember.id, roleId: nextRoleId });
      const nextRole = roles.find((role) => role.id === nextRoleId);
      setMembers((current) => current.map((member) => member.id === editingMember.id ? { ...member, roleId: nextRoleId, role: nextRole?.name || member.role } : member));
      setEditingMember(null);
      setMemberRoleError("");
    } catch (actionError) { showMemberRoleError(actionError); }
  }

  async function deleteMember() {
    if (!memberToDelete || memberToDelete.isOwner) return;
    try {
      await removeWorkspaceMember({ workspaceId, userId: memberToDelete.id });
      setMembers((current) => current.filter((member) => member.id !== memberToDelete.id));
      setMemberToDelete(null);
      setRemoveError("");
    } catch (actionError) { showRemoveError(actionError); }
  }

  async function deleteInvitation() {
    if (!invitationToDelete) return;
    try {
      await dismissWorkspaceInvitation({ workspaceId, invitationId: invitationToDelete.id });
      setPendingInvitations((current) => current.filter((invitation) => invitation.id !== invitationToDelete.id));
      setInvitationToDelete(null);
      setInvitationRemoveError("");
    } catch (actionError) {
      setInvitationRemoveError(actionError instanceof Error ? actionError.message : "The invitation could not be dismissed.");
    }
  }

  return <>
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-6"><div><div className="flex items-center gap-2"><h2 className="text-base font-semibold">Team members</h2><Badge variant="count">{members.length + pendingInvitations.length} {members.length + pendingInvitations.length === 1 ? "member" : "members"}</Badge></div><p className="mt-1 text-sm leading-6 text-secondary">Manage access and responsibilities from one place.</p></div><div className="flex flex-col items-end gap-2"><Button type="button" size="sm" variant="primary" onClick={() => { setOpen(true); setInviteError(""); }}>Add Member</Button><Button type="button" size="sm" variant="secondary" onClick={() => { setRolesOpen(true); setRoleError(""); }}>Handle Roles</Button></div></div>
      <div className="grid gap-1 p-6 sm:grid-cols-2">{members.map((member) => <div key={member.id} className="flex min-w-0 items-center gap-3 rounded-lg p-3 transition-colors duration-120 hover:bg-subtle"><Avatar name={member.name} /><div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-2"><div className="min-w-0"><p className="truncate text-sm font-medium">{member.name}</p><p className="mt-0.5 truncate text-xs text-tertiary">{member.email}</p></div><Badge variant="count" className="shrink-0">{member.role}</Badge></div></div>{!member.isOwner && <div className="flex shrink-0 items-center gap-1"><IconButton icon="edit" onClick={() => setEditingMember(member)} aria-label={`Edit ${member.name}`} /><IconButton icon="delete" onClick={() => setMemberToDelete(member)} aria-label={`Delete ${member.name}`} /></div>}</div>)}{pendingInvitations.map((invitation) => (
        <div key={invitation.id} className="flex min-w-0 items-center gap-3 rounded-lg border border-warning-soft bg-warning-soft/40 p-3">
          <Avatar name={invitation.email} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{invitation.email}</p>
            <div className="mt-1 flex items-center gap-2"><Badge variant="warning">Pending</Badge><span className="truncate text-xs text-tertiary">{invitation.role}</span></div>
          </div>
          <IconButton icon="delete" onClick={() => { setInvitationToDelete(invitation); setInvitationRemoveError(""); }} aria-label={`Dismiss invitation for ${invitation.email}`} />
        </div>
      ))}</div>
    </Card>

    <Modal open={open} title="Add a team member" description="Invite someone to collaborate in your workspace." onClose={() => { setOpen(false); setInviteError(""); }}><form className="space-y-5" onSubmit={addMember}><Input id="member-email" label="User email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="jordan@example.com" autoComplete="email" required autoFocus /><Select id="member-role" label="Workspace role" value={roleId} onChange={(event) => setRoleId(event.target.value)}>{assignableRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select><p className="text-xs text-secondary">An invitation will be created for this email. Access begins after the invitation is accepted.</p>{inviteError && <p className="text-sm text-danger" role="alert">{inviteError}</p>}<div className="flex justify-end gap-3 border-t border-border pt-5"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={!roleId}>Send invitation</Button></div></form></Modal>


    <Modal open={rolesOpen} title="Handle roles" description="Create, rename, or remove workspace roles." onClose={() => { setRolesOpen(false); setEditingRole(null); setRoleError(""); }}><div className="space-y-5">{roleError && <p className="text-sm text-danger" role="alert">{roleError}</p>}<div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,auto)_auto]"><Input id="new-role" label="New role" value={newRole} onChange={(event) => { setNewRole(event.target.value); setRoleError(""); }} placeholder="Add a new role" className="flex-1" /><Select id="new-role-permission" label="Permission" value={permissionKey} onChange={(event) => setPermissionKey(event.target.value as PermissionKey)}><option value="owner_like">Owner-like</option><option value="project_manager">Project manager</option><option value="normal_user">Normal user</option></Select><Button type="button" onClick={addRole}>Add</Button></div><div className="divide-y divide-border rounded-lg border border-border">{roles.map((role) => <div key={role.id} className="flex min-h-14 items-center gap-3 px-3"><div className="min-w-0 flex-1">{editingRole?.id === role.id ? <input autoFocus value={roleDraft} onChange={(event) => setRoleDraft(event.target.value)} className={inputClass} aria-label={`Rename ${role.name}`} /> : <div className="flex min-w-0 items-center gap-2"><Badge variant="count">{role.name}</Badge><span className="truncate text-xs text-tertiary">{permissionLabel(role.permissionKey)}</span></div>}</div><div className="flex items-center gap-1">{!role.isSystem && role.roleKey !== "owner" && role.roleKey !== "unknown" && (editingRole?.id === role.id ? <button type="button" onClick={saveRole} className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-secondary hover:bg-muted hover:text-primary" aria-label={`Save ${role.name}`}>✓</button> : <IconButton icon="edit" type="button" onClick={() => { setEditingRole(role); setRoleDraft(role.name); }} aria-label={`Edit ${role.name}`} />)}{!role.isSystem && role.roleKey !== "owner" && role.roleKey !== "unknown" && <IconButton icon="delete" type="button" onClick={() => deleteRole(role)} aria-label={`Delete ${role.name}`} />}</div></div>)}</div></div></Modal>

    <Modal open={Boolean(editingMember)} title={`Edit ${editingMember?.name || "team member"}`} description="Update this team member's workspace role." onClose={() => { setEditingMember(null); setMemberRoleError(""); }}>{editingMember && <div className="space-y-5"><Select id="edit-member-role" label="Workspace role" autoFocus value={editingMember.roleId} onChange={(event) => saveMemberRole(event.target.value)}>{assignableRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select>{memberRoleError && <p className="text-sm text-danger" role="alert">{memberRoleError}</p>}<div className="flex justify-end border-t border-border pt-5"><Button type="button" variant="secondary" onClick={() => setEditingMember(null)}>Cancel</Button></div></div>}</Modal>

    <Modal open={Boolean(memberToDelete)} title="Remove team member?" description={`Remove ${memberToDelete?.name || "this member"} from the workspace?`} onClose={() => { setMemberToDelete(null); setRemoveError(""); }}><div className="space-y-5">{removeError && <p className="text-sm text-danger" role="alert">{removeError}</p>}<div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setMemberToDelete(null)}>Cancel</Button><Button type="button" variant="danger" onClick={deleteMember}>Remove member</Button></div></div></Modal>

    <Modal open={Boolean(invitationToDelete)} title="Dismiss invitation?" description={`Remove the pending invitation for ${invitationToDelete?.email || "this email"}?`} onClose={() => { setInvitationToDelete(null); setInvitationRemoveError(""); }}><div className="space-y-5">{invitationRemoveError && <p className="text-sm text-danger" role="alert">{invitationRemoveError}</p>}<div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setInvitationToDelete(null)}>Cancel</Button><Button type="button" variant="danger" onClick={deleteInvitation}>Dismiss invitation</Button></div></div></Modal>
  </>;
}
