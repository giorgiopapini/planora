"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/app/actions";
import { Button, Input, Modal } from "@/components/ui";

type Workspace = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export function WorkspaceList({
  workspaces: initialWorkspaces,
}: {
  workspaces: Workspace[];
}) {
  const workspaces = initialWorkspaces;
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const workspace = name.trim();
    if (!workspace) return;
    setError("");
    try {
      await createWorkspace(workspace);
      setName("");
      setIsOpen(false);
      router.refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Workspace could not be created.",
      );
    }
  }

  return (
    <>
      <div className="space-y-3" aria-label="Your workspaces">
        {workspaces.map((workspace) => (
          <a
            key={workspace.id}
            href={`/overview?workspace=${encodeURIComponent(workspace.id)}`}
            className="flex min-h-14 items-center justify-between rounded-lg border border-border bg-surface px-4 text-sm font-medium transition-colors duration-120 ease-out hover:border-accent-border hover:bg-accent-soft focus-visible:border-accent"
          >
            <span>{workspace.name}</span>
            <span className="text-lg text-secondary" aria-hidden="true">
              →
            </span>
          </a>
        ))}
        {workspaces.length === 0 && (
          <p className="rounded-lg border border-dashed border-border-strong px-4 py-6 text-center text-sm text-secondary">
            You do not belong to a workspace yet.
          </p>
        )}
      </div>
      <p className="mt-6 text-center text-sm text-secondary">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="cursor-pointer font-medium text-accent hover:text-accent-hover"
        >
          Create a new workspace
        </button>
      </p>
      <Modal
        open={isOpen}
        title="Create a new workspace"
        description="Give your new workspace a name to get started."
        onClose={() => {
          setIsOpen(false);
          setName("");
          setError("");
        }}
      >
        <form className="space-y-5" onSubmit={submit}>
          <Input
            id="workspace-name"
            label="Workspace name"
            placeholder="e.g. Product Development"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            required
          />
          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsOpen(false);
                setName("");
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Create workspace</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
