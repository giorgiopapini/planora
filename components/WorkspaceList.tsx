"use client";

import { useState } from "react";
import { Button, Input, Modal } from "@/components/ui";

const initialWorkspaces = ["Product Development", "Marketing", "Operations"];

export function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");

  function createWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const workspace = name.trim();
    if (!workspace) return;
    setWorkspaces((current) => [...current, workspace]);
    setName("");
    setIsOpen(false);
  }

  return <>
    <div className="space-y-3" aria-label="Your workspaces">
      {workspaces.map((workspace) => <a key={workspace} href={`/overview?workspace=${encodeURIComponent(workspace)}`} className="flex min-h-14 items-center justify-between rounded-lg border border-border bg-surface px-4 text-sm font-medium transition-colors duration-120 ease-out hover:border-accent-border hover:bg-accent-soft focus-visible:border-accent"><span>{workspace}</span><span className="text-lg text-secondary" aria-hidden="true">→</span></a>)}
    </div>
    <p className="mt-6 text-center text-sm text-secondary"><button type="button" onClick={() => setIsOpen(true)} className="cursor-pointer font-medium text-accent hover:text-accent-hover">Create a new workspace</button></p>
    <Modal open={isOpen} title="Create a new workspace" description="Give your new workspace a name to get started." onClose={() => { setIsOpen(false); setName(""); }}><form className="space-y-5" onSubmit={createWorkspace}><Input id="workspace-name" label="Workspace name" placeholder="e.g. Product Development" value={name} onChange={(event) => setName(event.target.value)} autoFocus required /><div className="flex justify-end gap-3 border-t border-border pt-5"><Button type="button" variant="ghost" onClick={() => { setIsOpen(false); setName(""); }}>Cancel</Button><Button type="submit">Create workspace</Button></div></form></Modal>
  </>;
}
