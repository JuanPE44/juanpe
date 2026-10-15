import type { ReactNode } from "react";
import type { SectionId } from "@/sections/sections";
import { DESK, OBJECTS } from "./art.generated";
import { WorkbenchExplorer } from "./WorkbenchExplorer";

/**
 * Server entry for the figure: reads the heavy static SVG markup on the
 * server and hands it to the client explorer as props, so it ships in the
 * prerendered HTML instead of the client JS bundle.
 */
export function WorkbenchFigure({ panels }: { panels: Record<SectionId, ReactNode> }) {
  return <WorkbenchExplorer panels={panels} art={{ desk: DESK, objects: OBJECTS }} />;
}
