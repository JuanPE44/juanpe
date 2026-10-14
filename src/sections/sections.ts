/**
 * SECTION CONTRACT
 * ------------------------------------------------------------------
 * Shared contract between the page, the nav, the detail panel and the
 * (future) isometric Workbench figure. Each workbench object maps to
 * exactly one SectionId.
 */

export type SectionId = "about" | "projects" | "stack" | "experience" | "contact";

export interface SectionMeta {
  id: SectionId;
  /** Human label used in nav, buttons and headings. */
  label: string;
  /** Mono index readout, e.g. "01". */
  index: string;
  /** Workbench object that represents this section in the figure. */
  figureObject: string;
}

export const SECTIONS: readonly SectionMeta[] = [
  { id: "about", label: "About", index: "01", figureObject: "ID nameplate" },
  { id: "projects", label: "Projects", index: "02", figureObject: "CRT monitor" },
  { id: "stack", label: "Stack", index: "03", figureObject: "Parts drawer cabinet" },
  { id: "experience", label: "Experience", index: "04", figureObject: "Logbook / file cabinet" },
  { id: "contact", label: "Contact", index: "05", figureObject: "Radio / telephone" },
] as const;

export const SECTION_IDS: readonly SectionId[] = SECTIONS.map((s) => s.id);

export function getSection(id: SectionId): SectionMeta {
  const meta = SECTIONS.find((s) => s.id === id);
  if (!meta) throw new Error(`Unknown section: ${id}`);
  return meta;
}

export function isSectionId(value: string): value is SectionId {
  return (SECTION_IDS as readonly string[]).includes(value);
}
