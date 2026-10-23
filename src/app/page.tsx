import type { ReactNode } from "react";
import { profile } from "@/content";
import { WorkbenchFigure } from "@/figures/workbench/WorkbenchFigure";
import { SectionContent } from "@/sections/SectionContent";
import { SECTIONS, type SectionId } from "@/sections/sections";
import { ViewToggle } from "@/sections/ViewToggle";
import { SectionHeading } from "@/ui/SectionHeading";

// Pre-render each section once on the server for the spec sheet.
const panels = Object.fromEntries(
  SECTIONS.map((s) => [s.id, <SectionContent key={s.id} id={s.id} />]),
) as Record<SectionId, ReactNode>;

// Without JS the bench cannot zoom: let the page scroll to the stacked sections.
const NO_SCRIPT_CSS =
  "html,body{height:auto!important;overflow:auto!important}.wb-main{position:relative!important;height:100dvh}";

export default function Home() {
  return (
    <>
      <main id="main" className="wb-main fixed inset-0 z-[1] overflow-hidden">
        <h1 className="sr-only">
          {profile.name} — {profile.role}
        </h1>
        <ViewToggle />
        <WorkbenchFigure panels={panels} />
      </main>
      <noscript>
        <style>{NO_SCRIPT_CSS}</style>
        <div className="relative z-[1] mx-auto max-w-3xl px-4 sm:px-6">
          {SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              className="@container py-14"
            >
              <SectionHeading index={section.index} title={section.label} id={`${section.id}-title`} />
              <SectionContent id={section.id} />
            </section>
          ))}
        </div>
      </noscript>
    </>
  );
}
