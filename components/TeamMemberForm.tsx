"use client";

import { useState } from "react";
import { Button, Input, Modal } from "@/components/ui";

export function TeamMemberForm() {
  const [open, setOpen] = useState(false);
  return <>
    <Button type="button" variant="primary" onClick={() => setOpen(true)}>New team member</Button>
    <Modal open={open} title="Add a team member" description="Invite someone to collaborate in your workspace." onClose={() => setOpen(false)}>
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); setOpen(false); }}>
        <Input id="member-username" name="username" label="Username" placeholder="e.g. jordanlee" required />
        <Input id="member-email" name="email" type="email" label="User email" placeholder="jordan@example.com" autoComplete="email" required />
        <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Add member</Button></div>
      </form>
    </Modal>
  </>;
}
