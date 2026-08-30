"use client";

import { useState } from "react";
import { Button, Input, Modal } from "@/components/ui";

const teamMembers = ["Alex Morgan", "Jordan Lee", "Sam Rivera", "Taylor Kim"];

export function ProjectForm() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const filteredMembers = teamMembers.filter((member) => member.toLowerCase().includes(search.toLowerCase()));

  return <>
    <Button type="button" variant="primary" onClick={() => setOpen(true)}>New project</Button>
    <Modal open={open} title="Create a new project" description="Set up the project and choose its first team member." onClose={() => setOpen(false)}>
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); setOpen(false); }}>
        <Input id="project-name" name="projectName" label="Project name" placeholder="e.g. Website refresh" required />
        <div className="space-y-1.5"><label htmlFor="project-description" className="block text-sm font-medium">Project description</label><textarea id="project-description" name="projectDescription" rows={3} placeholder="What is this project about?" className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20" required /></div>
        <div className="space-y-1.5"><label htmlFor="member-search" className="block text-sm font-medium">Project team member</label><input id="member-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search team members" className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm placeholder:text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20" />{filteredMembers.length > 0 ? <div className="mt-2 overflow-hidden rounded-lg border border-border">{filteredMembers.map((member) => <button key={member} type="button" onClick={() => setSelected(member)} className={`block w-full px-3 py-2 text-left text-sm hover:bg-subtle ${selected === member ? "bg-accent-soft font-medium text-accent-hover" : "text-primary"}`}>{member}{selected === member && <span className="float-right">✓</span>}</button>)}</div> : <p className="mt-2 text-xs text-secondary">No team members found.</p>}</div>
        <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Create project</Button></div>
      </form>
    </Modal>
  </>;
}
