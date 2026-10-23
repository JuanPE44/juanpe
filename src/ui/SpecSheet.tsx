"use client";

import type { FocusEvent, PointerEvent, ReactNode, Ref } from "react";

type SpecSheetProps = {
  id: string;
  open: boolean;
  /** id of the element that labels the sheet (the visible section heading). */
  labelledBy: string;
  /** Mono readout in the sheet's top bar, e.g. "02 · Laptop". */
  label: string;
  onClose: () => void;
  /** Called with the index of a `[data-pick]` item the pointer or focus lands on. */
  onPick?: (index: number) => void;
  ref?: Ref<HTMLElement>;
  children: ReactNode;
};

/**
 * Non-modal spec sheet laid over the workbench stage, styled like the
 * figure's plate. Closed, it stays in the DOM (server-rendered content for
 * crawlers) but is inert. The container scrolls internally; the page never
 * does. Focus and Escape are owned by the caller, which knows which object
 * opened the sheet.
 */
export function SpecSheet({ id, open, labelledBy, label, onClose, onPick, ref, children }: SpecSheetProps) {
  const picked = (event: PointerEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
    const item = (event.target as Element).closest<HTMLElement>("[data-pick]");
    if (item && onPick) onPick(Number(item.dataset.pick));
  };

  return (
    <section
      ref={ref}
      id={id}
      role="dialog"
      aria-modal="false"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      inert={!open}
      data-open={open ? "" : undefined}
      className="wb-sheet"
      onPointerOver={picked}
      onFocus={picked}
    >
      <div className="wb-sheet-bar">
        <span className="wb-sheet-label">{label}</span>
        <button type="button" onClick={onClose} className="wb-sheet-close">
          Close <span aria-hidden="true">[esc]</span>
        </button>
      </div>
      <div className="wb-sheet-body @container">{children}</div>
    </section>
  );
}
