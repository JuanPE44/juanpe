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
 * focus trap and inert background come from the platform; Escape is
 * routed through `dismiss` so React state never drifts from the element.
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

  // Single, idempotent exit path. Chrome does not always dispatch `close`
  // after an Escape-triggered close (seen on the second open/Escape cycle),
  // so state is synced from `cancel` and explicit closes too, never from
  // `close` alone.
  function dismiss() {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    onClose();
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    target?.focus();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        // Escape: take over the close so state and focus always follow.
        event.preventDefault();
        dismiss();
      }}
      onClose={dismiss}
      onClick={(event) => {
        // Clicks on the backdrop target the <dialog> element itself.
        if (event.target === event.currentTarget) dismiss();
      }}
      className="side-panel m-0 mt-auto max-h-[85dvh] w-full max-w-none overflow-y-auto border-t border-line-strong bg-surface p-0 text-text backdrop:bg-black/70 md:mt-0 md:ml-auto md:h-dvh md:max-h-none md:w-[32rem] md:border-t-0 md:border-l"
    >
      <div className="p-6">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={dismiss}
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
