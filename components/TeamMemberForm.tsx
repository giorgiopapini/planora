"use client";

import { useState } from "react";
import { archiveWorkspaceRole, createWorkspaceRole, inviteWorkspaceMember, removeWorkspaceMember, renameWorkspaceRole, updateWorkspaceMemberRole } from "@/app/actions";
import { Avatar, Badge, Button, Card, DeleteIconButton, EditIconButton, IconButton, Input, Modal, Select } from "@/components/ui";

type Member = { id: string; name: string; email: string; roleId: string; role: string; status: string };
type Role = { id: string; name: string; isSystem: boolean };
const inputClass = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none placeholder:text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20";

export function TeamMemberForm({ workspaceId, members: initialMembers, roles: initialRoles }: { workspaceId: string; members: Member[]; roles: Role[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [roles, setRoles] = useState(initialRoles);
  const [open, setOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState("");
  const [roleDraft, setRoleDraft] = useState("");
  const [error, setError] = useState("");
  const [invitationLink, setInvitationLink] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(initialRoles.find((role) => role.name === "Member")?.id || initialRoles.find((role) => !role.isSystem)?.id || "");

  function showError(actionError: unknown) { setError(actionError instanceof Error ? actionError.message : "The change could not be saved."); }

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const link = await inviteWorkspaceMember({ workspaceId, email: email.trim(), roleId });
      setInvitationLink(link);
      setEmail("");
      setOpen(false);
      setError("");
    } catch (actionError) { showError(actionError); }
  }

  async function addRole() {
    try {
      await createWorkspaceRole({ workspaceId, name: newRole });
      const role = { id: `new-${Date.now()}`, name: newRole.trim(), isSystem: false };
      setRoles((current) => [...current, role]);
      setNewRole("");
      setError("");
    } catch (actionError) { showError(actionError); }
  }

  async function saveRole() {
    if (!editingRole) return;
    try {
      await renameWorkspaceRole({ workspaceId, roleId: editingRole.id, name: roleDraft });
      setRoles((current) => current.map((role) => role.id === editingRole.id ? { ...role, name: roleDraft.trim() } : role));
      setEditingRole(null);
      setRoleDraft("");
      setError("");
    } catch (actionError) { showError(actionError); }
  }

  async function deleteRole(role: Role) {
    try {
      await archiveWorkspaceRole({ workspaceId, roleId: role.id });
      setRoles((current) => current.filter((item) => item.id !== role.id));
      setError("");
    } catch (actionError) { showError(actionError); }
  }

  async function saveMemberRole(nextRoleId: string) {
    if (!editingMember) return;
    try {
      await updateWorkspaceMemberRole({ workspaceId, userId: editingMember.id, roleId: nextRoleId });
      const nextRole = roles.find((role) => role.id === nextRoleId);
      setMembers((current) => current.map((member) => member.id === editingMember.id ? { ...member, roleId: nextRoleId, role: nextRole?.name || member.role } : member));
      setEditingMember(null);
    } catch (actionError) { showError(actionError); }
  }

  async function deleteMember() {
    if (!memberToDelete) return;
    try {
      await removeWorkspaceMember({ workspaceId, userId: memberToDelete.id });
      setMembers((current) => current.filter((member) => member.id !== memberToDelete.id));
      setMemberToDelete(null);
    } catch (actionError) { showError(actionError); }
  }

  return <>
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-6"><div><div className="flex items-center gap-2"><h2 className="text-base font-semibold">Team members</h2><Badge variant="count">{members.length} {members.length === 1 ? "member" : "members"}</Badge></div><p className="mt-1 text-sm leading-6 text-secondary">Manage access and responsibilities from one place.</p></div><div className="flex flex-col items-end gap-2"><Button type="button" size="sm" variant="primary" onClick={() => setOpen(true)}>Add Member</Button><Button type="button" size="sm" variant="secondary" onClick={() => { setRolesOpen(true); setError(""); }}>Handle Roles</Button></div></div>
      {error && <p className="border-b border-border px-6 py-3 text-sm text-danger" role="alert">{error}</p>}
      <div className="grid gap-1 p-6 sm:grid-cols-2">{members.map((member) => <div key={member.id} className="flex min-w-0 items-center gap-3 rounded-lg p-3 transition-colors duration-120 hover:bg-subtle"><Avatar name={member.name} /><div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-2"><div className="min-w-0"><p className="truncate text-sm font-medium">{member.name}</p><p className="mt-0.5 truncate text-xs text-tertiary">{member.email}</p></div><Badge variant="count" className="shrink-0">{member.role}</Badge></div></div><div className="flex shrink-0 items-center gap-1"><IconButton icon="edit" onClick={() => setEditingMember(member)} aria-label={`Edit ${member.name}`} /><IconButton icon="delete" onClick={() => setMemberToDelete(member)} aria-label={`Delete ${member.name}`} /></div></div>)}</div>
    </Card>

    <Modal open={open} title="Add a team member" description="Invite someone to collaborate in your workspace." onClose={() => setOpen(false)}><form className="space-y-5" onSubmit={addMember}><Input id="member-email" label="User email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="jordan@example.com" autoComplete="email" required autoFocus /><Select id="member-role" label="Workspace role" value={roleId} onChange={(event) => setRoleId(event.target.value)}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select><p className="text-xs text-secondary">An invitation will be created for this email. Access begins after the invitation is accepted.</p><div className="flex justify-end gap-3 border-t border-border pt-5"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={!roleId}>Send invitation</Button></div></form></Modal>

    {invitationLink && <div className="rounded-lg border border-accent-border bg-accent-soft p-4 text-sm"><p className="font-medium text-accent-hover">Invitation created</p><p className="mt-1 break-all text-xs text-secondary">Share this link with the invitee: {invitationLink}</p><button type="button" className="mt-3 font-medium text-accent hover:text-accent-hover" onClick={() => setInvitationLink("")}>Dismiss</button></div>}

    <Modal open={rolesOpen} title="Handle roles" description="Create, rename, or remove workspace roles." onClose={() => { setRolesOpen(false); setEditingRole(null); }}><div className="space-y-5"><div className="flex items-end gap-3"><Input id="new-role" label="New role" value={newRole} onChange={(event) => { setNewRole(event.target.value); setError(""); }} placeholder="Add a new role" className="flex-1" /><Button type="button" onClick={addRole}>Add</Button></div><div className="divide-y divide-border rounded-lg border border-border">{roles.map((role) => <div key={role.id} className="flex min-h-14 items-center gap-3 px-3"><div className="min-w-0 flex-1">{editingRole?.id === role.id ? <input autoFocus value={roleDraft} onChange={(event) => setRoleDraft(event.target.value)} className={inputClass} aria-label={`Rename ${role.name}`} /> : <Badge variant="count">{role.name}</Badge>}</div><div className="flex items-center gap-1">{!role.isSystem && (editingRole?.id === role.id ? <button type="button" onClick={saveRole} className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-secondary hover:bg-muted hover:text-primary" aria-label={`Save ${role.name}`}>✓</button> : <EditIconButton type="button" onClick={() => { setEditingRole(role); setRoleDraft(role.name); }} aria-label={`Edit ${role.name}`} />)}{!role.isSystem && <DeleteIconButton type="button" onClick={() => deleteRole(role)} aria-label={`Delete ${role.name}`} />}</div></div>)}</div></div></Modal>

    <Modal open={Boolean(editingMember)} title={`Edit ${editingMember?.name || "team member"}`} description="Update this team member's workspace role." onClose={() => setEditingMember(null)}>{editingMember && <div className="space-y-5"><Select id="edit-member-role" label="Workspace role" autoFocus value={editingMember.roleId} onChange={(event) => saveMemberRole(event.target.value)}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select><div className="flex justify-end border-t border-border pt-5"><Button type="button" variant="secondary" onClick={() => setEditingMember(null)}>Cancel</Button></div></div>}</Modal>

    <Modal open={Boolean(memberToDelete)} title="Remove team member?" description={`Remove ${memberToDelete?.name || "this member"} from the workspace?`} onClose={() => setMemberToDelete(null)}><div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setMemberToDelete(null)}>Cancel</Button><Button type="button" variant="danger" onClick={deleteMember}>Remove member</Button></div></Modal>
  </>;
}
