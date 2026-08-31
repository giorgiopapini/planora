"use client";

import { useState } from "react";
import { AvatarGroup, Button, Input, Modal, MultiSelect } from "@/components/ui";

const teamMembers = ["Alex Morgan", "Jordan Lee", "Sam Rivera", "Taylor Kim", "Maya Patel"];
const memberOptions = teamMembers.map((member) => ({ value: member, label: member }));

export function ProjectForm() {
  const [open, setOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  function closeForm() {
    setOpen(false);
    setSelectedMembers([]);
  }

  return <>
    <Button type="button" variant="primary" onClick={() => setOpen(true)}>New project</Button>
    <Modal open={open} title="Create a new project" description="Set up the project and choose the people who will help move it forward." onClose={closeForm}>
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); closeForm(); }}>
        <Input id="project-name" name="projectName" label="Project name" placeholder="e.g. Website refresh" required />
        <div className="space-y-1.5"><label htmlFor="project-description" className="block text-sm font-medium text-primary">Project description</label><textarea id="project-description" name="projectDescription" rows={3} placeholder="What is this project about?" className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20" required /></div>
        <MultiSelect id="project-team" label="Project team" options={memberOptions} value={selectedMembers} onChange={setSelectedMembers} placeholder="Choose team members" helperText="Select everyone who should be assigned to this project." />
        {selectedMembers.length > 0 && <div className="flex items-center gap-3 rounded-lg border border-border bg-subtle px-3 py-2"><AvatarGroup people={selectedMembers.map((name) => ({ name }))} /><p className="text-xs text-secondary">{selectedMembers.length} team member{selectedMembers.length === 1 ? "" : "s"} selected</p></div>}
        <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button><Button type="submit">Create project</Button></div>
      </form>
    </Modal>
  </>;
}
