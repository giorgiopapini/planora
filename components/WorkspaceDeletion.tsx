"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteWorkspace } from "@/app/actions";
import { Button, Card, CardContent, Input, Modal } from "@/components/ui";

export function WorkspaceDeletion({ workspaceId, workspaceName }: { workspaceId: string; workspaceName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const confirmed = confirmation === workspaceName;

  async function handleDelete() {
    if (!confirmed) return;
    setDeleting(true);
    setError("");
    try {
      await deleteWorkspace({ workspaceId, workspaceName: confirmation });
      router.push("/workspaces");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Workspace could not be deleted.");
      setDeleting(false);
    }
  }

  return <>
    <Card className="border-danger/30"><CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-danger">Danger zone</p><p className="mt-1 text-xs text-secondary">Permanently delete this workspace and everything in it.</p></div><button type="button" onClick={() => { setConfirmation(""); setError(""); setOpen(true); }} className="cursor-pointer text-left text-sm font-medium text-danger underline underline-offset-4 hover:text-red-700">Delete workspace</button></CardContent></Card>
    <Modal open={open} title="Delete workspace?" description="This action cannot be undone." onClose={() => !deleting && setOpen(false)}><div className="space-y-5"><div className="rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm leading-6 text-danger">Deleting <strong>{workspaceName}</strong> permanently removes this workspace, every project and task, team memberships, invitations, workflow statuses, activity, and all other related data.</div><Input id="workspace-delete-confirmation" label={`Type “${workspaceName}” to confirm`} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={deleting} autoComplete="off" />{error && <p className="text-sm text-danger" role="alert">{error}</p>}<div className="flex justify-end gap-3 border-t border-border pt-5"><Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={deleting}>Cancel</Button><Button type="button" variant="danger" onClick={handleDelete} disabled={!confirmed || deleting}>{deleting ? "Deleting…" : "Delete workspace"}</Button></div></div></Modal>
  </>;
}
