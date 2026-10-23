import type { ReactNode } from "react";
import type { SectionId } from "@/sections/sections";

/** Which section the workbench is zoomed into (and the spec sheet shows). null = rest. */
export type ActiveSection = SectionId | null;

export interface WorkbenchProps {
  active: ActiveSection;
  /** Item picked inside the active section (project, log card). */
  pick: number;
  onSelect: (id: SectionId) => void;
  onClose: () => void;
  /** The spec sheet, laid over the stage. */
  children?: ReactNode;
}

/** id of the spec sheet the objects control. */
export const SHEET_ID = "wb-sheet";

/** A viewBox rectangle in figure units. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Stage layout shared by the camera (JS) and the sheet (CSS container query on
 * the plate): from WIDE px up the sheet sits on the right, below it fills the
 * bottom SHEET_SHARE of the plate.
 */
export const STAGE = {
  wide: 720,
  inset: 16,
  sheetMax: 480,
  sheetShare: 0.42,
  phoneShare: 0.56,
  top: 44,
  bottom: 40,
  /** Largest zoom relative to the rest view. */
  maxZoom: 5,
  /** Below this stage width the rest view zooms in (up to panZoom) and pans sideways by drag; height stays put. */
  panBelow: 720,
  panZoom: 2.1,
} as const;

/** Fits `focus` into the `region` (stage px) and returns a viewBox with the stage's own aspect. */
export function frame(focus: Box, region: Box, width: number, height: number, limit = Infinity): Box {
  const scale = Math.min(region.w / focus.w, region.h / focus.h, limit);
  const w = width / scale;
  const h = height / scale;
  return {
    x: focus.x + focus.w / 2 - (region.x + region.w / 2) / scale,
    y: focus.y + focus.h / 2 - (region.y + region.h / 2) / scale,
    w,
    h,
  };
}
