import type { ReactNode } from "react";
import { profile } from "@/content";
import { WorkbenchFigure } from "@/figures/workbench/WorkbenchFigure";
import { Hero } from "@/sections/Hero";
import { SectionContent } from "@/sections/SectionContent";
import { SectionNav } from "@/sections/SectionNav";
import { SECTIONS, type SectionId } from "@/sections/sections";
import { SectionHeading } from "@/ui/SectionHeading";

// Pre-render each section once on the server for the detail panel.
const panels = Object.fromEntries(
  SECTIONS.map((s) => [s.id, <SectionContent key={s.id} id={s.id} />]),
) as Record<SectionId, ReactNode>;

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-20 focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <SectionNav name={profile.name} />
      <main id="main" className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
        <Hero profile={profile} figure={<WorkbenchFigure panels={panels} />} />

        {/* Classic scrollable fallback: all sections, no JS required. */}
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-title`}
            className="scroll-mt-20 py-14"
          >
            <SectionHeading
              index={section.index}
              title={section.label}
              id={`${section.id}-title`}
            />
            <SectionContent id={section.id} />
          </section>
        ))}
      </main>
      <footer className="relative z-[1] mx-auto max-w-6xl border-t border-line px-4 py-8 font-mono text-xs text-muted sm:px-6">
        © {profile.name}
      </footer>
    </>
  );
}
