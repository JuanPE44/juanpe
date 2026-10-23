"use client";

import { useEffect, useId, useRef } from "react";
import { profile } from "@/content";
import { SectionContent } from "@/sections/SectionContent";
import { SECTIONS } from "@/sections/sections";
import { SectionHeading } from "@/ui/SectionHeading";

type PortfolioPageProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Full-screen, scrollable reading of every section. The workbench stays the
 * default; this is the path for someone who wants the whole portfolio without
 * opening each object. Focus is trapped while open; Escape and the bar close it.
 */
export function PortfolioPage({ open, onClose }: PortfolioPageProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = [
        ...dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      hidden={!open}
      className="pf-page"
    >
      <header className="pf-bar">
        <p id={titleId} className="pf-bar-title">
          <span className="font-mono text-accent">{profile.name}</span>
          <span className="text-muted"> — {profile.role}</span>
        </p>
        <button ref={closeRef} type="button" onClick={onClose} className="pf-close">
          Back to workbench <span aria-hidden="true">[esc]</span>
        </button>
      </header>
      <nav className="pf-nav" aria-label="Portfolio sections">
        {SECTIONS.map((section) => (
          <a key={section.id} href={`#page-${section.id}`}>
            <span className="font-mono text-accent">{section.index}</span> {section.label}
          </a>
        ))}
      </nav>
      <div className="pf-scroll">
        <div className="pf-body">
          {SECTIONS.map((section) => (
            <section key={section.id} id={`page-${section.id}`} aria-labelledby={`page-${section.id}-title`} className="@container py-12">
              <SectionHeading index={section.index} title={section.label} id={`page-${section.id}-title`} />
              <SectionContent id={section.id} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
