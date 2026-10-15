"use client";

import { useState, type ReactNode } from "react";
import { getSection, type SectionId } from "@/sections/sections";
import { SectionHeading } from "@/ui/SectionHeading";
import { SidePanel } from "@/ui/SidePanel";
import type { ActiveSection, WorkbenchArt } from "./model";
import { Workbench } from "./Workbench";

const PANEL_TITLE_ID = "section-panel-title";

/**
 * Client container: owns the active section and connects the Workbench
 * figure to the detail panel. Section content is rendered on the server
 * and passed in, so sections stay presentational server components.
 */
export function WorkbenchExplorer({
  panels,
  art,
}: {
  panels: Record<SectionId, ReactNode>;
  art: WorkbenchArt;
}) {
  const [active, setActive] = useState<ActiveSection>(null);
  const meta = active ? getSection(active) : null;

  return (
    <>
      <Workbench active={active} onSelect={setActive} art={art} />
      <SidePanel
        open={active !== null}
        onClose={() => setActive(null)}
        labelledBy={PANEL_TITLE_ID}
      >
        {meta ? (
          <>
            <SectionHeading index={meta.index} title={meta.label} id={PANEL_TITLE_ID} />
            {panels[meta.id]}
          </>
        ) : null}
      </SidePanel>
    </>
  );
}
