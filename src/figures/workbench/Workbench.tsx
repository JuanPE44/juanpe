"use client";

import { SECTIONS } from "@/sections/sections";
import type { WorkbenchProps } from "./model";

/**
 * PLACEHOLDER — will be replaced by the isometric interactive Workbench SVG.
 * Keep the props contract (WorkbenchProps) when replacing it.
 */
export function Workbench({ active, onSelect }: WorkbenchProps) {
  return (
    <figure className="rounded-[var(--radius)] border border-line-strong bg-surface p-6 shadow-[0_0_40px_var(--accent-glow)]">
      <div className="flex aspect-[4/3] items-center justify-center rounded-sm border border-dashed border-line font-mono text-sm text-muted">
        Workbench figure — coming soon
      </div>
      <figcaption className="sr-only">
        Interactive workbench. Choose an object to open a section.
      </figcaption>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Workbench sections">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            data-active={active === section.id || undefined}
            aria-haspopup="dialog"
            title={section.figureObject}
            className="rounded-sm border border-line-strong px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-accent hover:text-accent data-active:border-accent data-active:text-accent"
          >
            {section.label}
          </button>
        ))}
      </div>
    </figure>
  );
}
