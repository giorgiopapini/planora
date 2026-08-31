"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Avatar, Badge, Button, Card, Modal } from "@/components/ui";

type Member = { id: number; name: string; email: string; role: string };

const initialRoles = ["Unknown", "Project Manager", "Engineer", "Designer"];
const initialMembers: Member[] = [
  { id: 1, name: "Alex Morgan", email: "alex@planora.example", role: "Project Manager" },
  { id: 2, name: "Jordan Lee", email: "jordan@planora.example", role: "Engineer" },
  { id: 3, name: "Sam Rivera", email: "sam@planora.example", role: "Engineer" },
  { id: 4, name: "Taylor Kim", email: "taylor@planora.example", role: "Designer" },
];

const inputClass = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none placeholder:text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20";

export function TeamMemberForm() {
  const [members, setMembers] = useState(initialMembers);
  const [roles, setRoles] = useState(initialRoles);
  const [open, setOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [roleDraft, setRoleDraft] = useState("");
  const [newRole, setNewRole] = useState("");
  const [roleError, setRoleError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Member");

  function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setMembers((current) => [...current, { id: Date.now(), name: name.trim(), email: email.trim(), role }]);
    setName("");
    setEmail("");
    setRole(roles.includes("Member") ? "Member" : "Unknown");
    setOpen(false);
  }

  function addRole() {
    const value = newRole.trim();
    if (!value) {
      setRoleError("Field is empty");
      return;
    }
    if (roles.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setRoleError("Role already exists");
      return;
    }
    setRoles((current) => [...current, value]);
    setNewRole("");
    setRoleError("");
  }

  function saveRole(previousRole: string) {
    const value = roleDraft.trim();
    if (!value) {
      setRoleError("Field is empty");
      return;
    }
    if (roles.some((item) => item !== previousRole && item.toLowerCase() === value.toLowerCase())) {
      setRoleError("Role already exists");
      return;
    }
    setRoles((current) => current.map((item) => item === previousRole ? value : item));
    setMembers((current) => current.map((member) => member.role === previousRole ? { ...member, role: value } : member));
    if (role === previousRole) setRole(value);
    setEditingRole(null);
    setRoleDraft("");
    setRoleError("");
  }

  function deleteRole(roleToDelete: string) {
    if (roleToDelete === "Unknown") return;
    setRoles((current) => current.filter((item) => item !== roleToDelete));
    setMembers((current) => current.map((member) => member.role === roleToDelete ? { ...member, role: "Unknown" } : member));
    if (role === roleToDelete) setRole("Unknown");
    if (editingRole === roleToDelete) setEditingRole(null);
    setRoleError("");
  }

  function saveMemberRole(nextRole: string) {
    if (!editingMember) return;
    setMembers((current) => current.map((member) => member.id === editingMember.id ? { ...member, role: nextRole } : member));
    setEditingMember(null);
  }

  function deleteMember() {
    if (!memberToDelete) return;
    setMembers((current) => current.filter((member) => member.id !== memberToDelete.id));
    setMemberToDelete(null);
  }

  return <>
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-6">
        <div><div className="flex items-center gap-2"><h2 className="text-base font-semibold">Team members</h2><Badge variant="count">{members.length} {members.length === 1 ? "member" : "members"}</Badge></div><p className="mt-1 text-sm leading-6 text-secondary">Manage access and responsibilities from one place.</p></div>
        <div className="flex flex-col items-end gap-2"><Button type="button" size="sm" variant="primary" onClick={() => setOpen(true)}>Add Member</Button><Button type="button" size="sm" variant="secondary" onClick={() => { setRolesOpen(true); setRoleError(""); }}>Handle Roles</Button></div>
      </div>
      <div className="grid gap-1 p-6 sm:grid-cols-2">{members.map((member) => <div key={member.id} className="flex min-w-0 items-center gap-3 rounded-lg p-3 transition-colors duration-120 hover:bg-subtle"><Avatar name={member.name} /><div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-2"><div className="min-w-0"><p className="truncate text-sm font-medium">{member.name}</p><p className="mt-0.5 truncate text-xs text-tertiary">{member.email}</p></div><Badge variant="count" className="shrink-0">{member.role}</Badge></div></div><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => setEditingMember(member)} className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-secondary hover:bg-muted hover:text-primary" aria-label={`Edit ${member.name}`} title={`Edit ${member.name}`}>✎</button><Button type="button" variant="danger" className="h-8 w-8 px-0" onClick={() => setMemberToDelete(member)} aria-label={`Delete ${member.name}`} title={`Delete ${member.name}`}>🗑</Button></div></div>)}</div>
    </Card>

    <Modal open={open} title="Add a team member" description="Invite someone to collaborate in your workspace." onClose={() => setOpen(false)}><form className="space-y-5" onSubmit={addMember}><div className="space-y-1.5"><label htmlFor="member-name" className="block text-sm font-medium">Name</label><input id="member-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Jordan Lee" required autoFocus className={inputClass} /></div><div className="space-y-1.5"><label htmlFor="member-email" className="block text-sm font-medium">User email</label><input id="member-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="jordan@example.com" autoComplete="email" required className={inputClass} /></div><div className="space-y-1.5"><label htmlFor="member-role" className="block text-sm font-medium">Workspace role</label><select id="member-role" value={role} onChange={(event) => setRole(event.target.value)} className={inputClass}>{roles.map((item) => <option key={item}>{item}</option>)}</select></div><div className="flex justify-end gap-3 border-t border-border pt-5"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Add member</Button></div></form></Modal>

    <Modal open={rolesOpen} title="Handle roles" description="Create, rename, or remove workspace roles." onClose={() => { setRolesOpen(false); setEditingRole(null); setRoleError(""); }}><div className="space-y-5"><div><label htmlFor="new-role" className="sr-only">New role</label><div className="flex items-center gap-3"><input id="new-role" value={newRole} onChange={(event) => { setNewRole(event.target.value); setRoleError(""); }} placeholder="Add a new role" className={`${inputClass} flex-1`} /><Button type="button" onClick={addRole}>Add</Button></div>{roleError && <p className="mt-2 text-xs text-danger" role="alert">{roleError}</p>}</div><div className="divide-y divide-border rounded-lg border border-border">{roles.map((item) => <div key={item} className="flex min-h-14 items-center gap-3 px-3"><div className="min-w-0 flex-1">{editingRole === item ? <input autoFocus value={roleDraft} onChange={(event) => { setRoleDraft(event.target.value); setRoleError(""); }} className={inputClass} aria-label={`Rename ${item}`} /> : <Badge variant="count">{item}</Badge>}</div><div className="flex items-center gap-1">{item !== "Unknown" && (editingRole === item ? <button type="button" onClick={() => saveRole(item)} className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-secondary hover:bg-muted hover:text-primary" aria-label={`Save ${item}`}>✓</button> : <button type="button" onClick={() => { setEditingRole(item); setRoleDraft(item); setRoleError(""); }} className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-secondary hover:bg-muted hover:text-primary" aria-label={`Edit ${item}`}>✎</button>)}{item !== "Unknown" && <Button type="button" variant="danger" className="h-8 w-8 px-0" onClick={() => deleteRole(item)} aria-label={`Delete ${item}`}>🗑</Button>}</div></div>)}</div></div></Modal>

    <Modal open={Boolean(editingMember)} title={`Edit ${editingMember?.name || "team member"}`} description="Update this team member's workspace role." onClose={() => setEditingMember(null)}>{editingMember && <div className="space-y-5"><div className="space-y-1.5"><label htmlFor="edit-member-role" className="block text-sm font-medium">Workspace role</label><select id="edit-member-role" autoFocus value={editingMember.role} onChange={(event) => saveMemberRole(event.target.value)} className={inputClass}>{roles.map((item) => <option key={item}>{item}</option>)}</select></div><div className="flex justify-end border-t border-border pt-5"><Button type="button" variant="secondary" onClick={() => setEditingMember(null)}>Cancel</Button></div></div>}</Modal>

    <Modal open={Boolean(memberToDelete)} title="Remove team member?" description={`Remove ${memberToDelete?.name || "this member"} from the workspace?`} onClose={() => setMemberToDelete(null)}><div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setMemberToDelete(null)}>Cancel</Button><Button type="button" variant="danger" onClick={deleteMember}>Remove member</Button></div></Modal>
  </>;
}
