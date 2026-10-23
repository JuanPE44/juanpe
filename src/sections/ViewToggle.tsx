"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PortfolioPage } from "./PortfolioPage";

/**
 * Top-left switch from the interactive bench to a normal scrollable portfolio.
 * The overlay is a sibling of the stage so the page lock (html:has(.wb-main))
 * does not have to change: the overlay scrolls inside itself.
 */
export function ViewToggle() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="pf-toggle"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="portfolio-page"
        onClick={() => setOpen(true)}
      >
        Read as a page
      </button>
      <div id="portfolio-page">
        <PortfolioPage open={open} onClose={close} />
      </div>
    </>
  );
}
