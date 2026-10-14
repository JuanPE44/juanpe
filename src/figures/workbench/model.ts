import type { SectionId } from "@/sections/sections";

/** Which section the workbench (and detail panel) currently shows. null = closed. */
export type ActiveSection = SectionId | null;

export interface WorkbenchProps {
  active: ActiveSection;
  onSelect: (id: SectionId) => void;
}
