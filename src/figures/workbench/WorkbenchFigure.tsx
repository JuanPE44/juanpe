import type { ReactNode } from "react";
import type { SectionId } from "@/sections/sections";
import { WorkbenchExplorer } from "./WorkbenchExplorer";

/**
 * Server entry for the figure. The heavy static SVG markup is not a prop:
 * the client Workbench renders it during the server pass only, so it ships
 * once in the prerendered HTML and never in the flight payload or JS bundle.
 */
export function WorkbenchFigure({ panels }: { panels: Record<SectionId, ReactNode> }) {
  return <WorkbenchExplorer panels={panels} />;
}
