"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

export function Modal({ open, title, description, onClose, children, headerAction }: { open: boolean; title: string; description?: string; onClose: () => void; children: ReactNode; headerAction?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-primary/30 px-4 py-8" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="max-h-[calc(100vh-4rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface shadow-[0_8px_24px_rgb(17_24_39_/8%)]">
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div><h2 id="modal-title" className="text-lg font-semibold">{title}</h2>{description && <p className="mt-1 text-sm text-secondary">{description}</p>}</div>
          {headerAction || <button type="button" onClick={onClose} className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-xl text-secondary hover:bg-muted hover:text-primary" aria-label="Close dialog">×</button>}
        </div>
        <div className="p-6">{children}</div>
      </section>
    </div>
  );
}
