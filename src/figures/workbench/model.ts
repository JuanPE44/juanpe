import type { SectionId } from "@/sections/sections";

/** Which section the workbench (and detail panel) currently shows. null = closed. */
export type ActiveSection = SectionId | null;

/**
 * Static SVG markup from art.generated.ts. Passed in from a server component
 * so the ~200 KB of path data stays out of the client JS bundle.
 */
export interface WorkbenchArt {
  desk: string;
  objects: Record<string, string>;
}

export interface WorkbenchProps {
  active: ActiveSection;
  onSelect: (id: SectionId) => void;
  art: WorkbenchArt;
}
