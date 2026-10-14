"use client";

import { useEffect, useRef, type ReactNode } from "react";

type SidePanelProps = {
  open: boolean;
  onClose: () => void;
  /** id of the element that labels the dialog (usually its heading). */
  labelledBy: string;
  children: ReactNode;
};

/**
 * Modal detail panel built on native <dialog>:
 * focus trap, Escape and inert background come from the platform.
 * Bottom sheet on mobile, right-side panel from md up.
 */
export function SidePanel({ open, onClose, labelledBy, children }: SidePanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleClose() {
    onClose();
    returnFocusRef.current?.focus();
    returnFocusRef.current = null;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      onClose={handleClose}
      onClick={(event) => {
        // Clicks on the backdrop target the <dialog> element itself.
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      className="side-panel m-0 mt-auto max-h-[85dvh] w-full max-w-none overflow-y-auto border-t border-line-strong bg-surface p-0 text-text backdrop:bg-black/70 md:mt-0 md:ml-auto md:h-dvh md:max-h-none md:w-[32rem] md:border-t-0 md:border-l"
    >
      <div className="p-6">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-sm border border-line-strong px-3 py-1 font-mono text-xs uppercase tracking-widest text-muted hover:border-accent hover:text-accent"
          >
            Close <span aria-hidden="true">[esc]</span>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
