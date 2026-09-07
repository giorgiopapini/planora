"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { deleteWorkspace } from "@/app/actions";
import { DeletionConfirmation } from "@/components/DeletionConfirmation";
import { Card, CardContent } from "@/components/ui";

export function WorkspaceDeletion({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  const router = useRouter();
  const { t } = useTranslation();
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
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Workspace could not be deleted.",
      );
      setDeleting(false);
    }
  }

  function openDeletion() {
    setConfirmation("");
    setError("");
    setOpen(true);
  }

  return (
    <>
      <Card className="border-danger/30">
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-danger">{t("Danger zone")}</p>
            <p className="mt-1 text-xs text-secondary">
              {t("Permanently delete this workspace and everything in it.")}
            </p>
          </div>
          <button
            type="button"
            onClick={openDeletion}
            className="cursor-pointer text-left text-sm font-medium text-danger underline underline-offset-4 hover:text-red-700"
          >
            {t("Delete workspace")}
          </button>
        </CardContent>
      </Card>
      <DeletionConfirmation
        open={open}
        entityName={workspaceName}
        entityLabel="workspace"
        description={t(
          "Deleting {{name}} permanently removes this workspace and everything in it.",
          { name: workspaceName },
        )}
        confirmation={confirmation}
        onConfirmationChange={setConfirmation}
        error={error}
        deleting={deleting}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
