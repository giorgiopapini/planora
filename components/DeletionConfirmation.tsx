"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Button, Input, Modal } from "@/components/ui";

type DeletionConfirmationProps = {
  open: boolean;
  entityName: string;
  entityLabel: string;
  description: ReactNode;
  confirmation?: string;
  onConfirmationChange?: (confirmation: string) => void;
  error?: string;
  deleting?: boolean;
  onClose: () => void;
  onConfirm: (confirmation: string) => void | Promise<void>;
};

export function DeletionConfirmation({
  open,
  entityName,
  entityLabel,
  description,
  confirmation: controlledConfirmation,
  onConfirmationChange,
  error,
  deleting = false,
  onClose,
  onConfirm,
}: DeletionConfirmationProps) {
  const [localConfirmation, setLocalConfirmation] = useState("");
  const confirmation = controlledConfirmation ?? localConfirmation;
  const confirmed = confirmation === entityName;
  const setConfirmation = (value: string) => {
    if (controlledConfirmation === undefined) setLocalConfirmation(value);
    onConfirmationChange?.(value);
  };

  return (
    <Modal
      open={open}
      title={`Delete ${entityLabel}?`}
      description="This action cannot be undone."
      onClose={() => !deleting && onClose()}
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm leading-6 text-danger">
          {description}
        </div>
        <Input
          id={`${entityLabel}-delete-confirmation`}
          label={`Type “${entityName}” to confirm`}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          disabled={deleting}
          autoComplete="off"
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
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => void onConfirm(confirmation)}
            disabled={!confirmed || deleting}
          >
            {deleting ? "Deleting…" : `Delete ${entityLabel}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
