"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/actions";
import { AvatarGroup, Button, Input, Modal, MultiSelect, Select } from "@/components/ui";

type Member = { id: string; name: string };

export function ProjectForm({ workspaceId, members }: { workspaceId: string; members: Member[] }) {
  const [open, setOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const memberOptions = members.map((member) => ({ value: member.id, label: member.name }));

  function closeForm() {
    setOpen(false);
    setSelectedMembers([]);
    setOwnerId("");
    setError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const values = new FormData(event.currentTarget);
    try {
      await createProject({ workspaceId, name: String(values.get("projectName") || ""), description: String(values.get("projectDescription") || ""), startDate: String(values.get("startDate") || ""), dueDate: String(values.get("dueDate") || ""), ownerId, memberIds: selectedMembers });
      closeForm();
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Project could not be created.");
    }
  }

  return <>
    <Button type="button" variant="primary" onClick={() => setOpen(true)}>New project</Button>
    <Modal open={open} title="Create a new project" description="Set up the project and choose the people who will help move it forward." onClose={closeForm}>
      <form className="space-y-5" onSubmit={submit}>
        <Input id="project-name" name="projectName" label="Project name" placeholder="e.g. Website refresh" required />
        <div className="space-y-1.5"><label htmlFor="project-description" className="block text-sm font-medium text-primary">Project description</label><textarea id="project-description" name="projectDescription" rows={3} placeholder="What is this project about?" className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20" required /></div>
        <div className="grid gap-5 sm:grid-cols-2"><Input id="project-start-date" name="startDate" label="Start date" type="date" required /><Input id="project-due-date" name="dueDate" label="Target date" type="date" required /></div>
        <MultiSelect id="project-team" label="Project team" options={memberOptions} value={selectedMembers} onChange={setSelectedMembers} placeholder="Choose team members" helperText="Select everyone who should be assigned to this project." />
        <Select id="project-owner" label="Project owner" value={ownerId} onChange={(event) => setOwnerId(event.target.value)} required><option value="">Select an owner</option>{members.filter((member) => selectedMembers.includes(member.id) || !selectedMembers.length).map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select>
        {selectedMembers.length > 0 && <div className="flex items-center gap-3 rounded-lg border border-border bg-subtle px-3 py-2"><AvatarGroup people={selectedMembers.map((id) => ({ name: members.find((member) => member.id === id)?.name || "User" }))} /><p className="text-xs text-secondary">{selectedMembers.length} team member{selectedMembers.length === 1 ? "" : "s"} selected</p></div>}
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button><Button type="submit" disabled={!ownerId}>Create project</Button></div>
      </form>
    </Modal>
  </>;
}
