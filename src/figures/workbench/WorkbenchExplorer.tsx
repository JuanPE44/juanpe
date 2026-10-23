"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { getSection, isSectionId, SECTIONS, type SectionId } from "@/sections/sections";
import { SectionHeading } from "@/ui/SectionHeading";
import { SpecSheet } from "@/ui/SpecSheet";
import { COUNTS } from "./art.generated";
import { SHEET_ID, type ActiveSection } from "./model";
import { Workbench } from "./Workbench";

/** Fired after our own pushState/replaceState, which the browser does not announce. */
const HASH_EVENT = "wb-hash";

const titleOf = (id: SectionId) => `${SHEET_ID}-title-${id}`;

/** Items the ←/→ keys step through, per section. */
const PICKS: Partial<Record<SectionId, number>> = {
  projects: COUNTS.projects,
  experience: COUNTS.experience,
};

function subscribe(changed: () => void) {
  window.addEventListener("hashchange", changed);
  window.addEventListener("popstate", changed);
  window.addEventListener(HASH_EVENT, changed);
  return () => {
    window.removeEventListener("hashchange", changed);
    window.removeEventListener("popstate", changed);
    window.removeEventListener(HASH_EVENT, changed);
  };
}

function readHash(): ActiveSection {
  const id = decodeURIComponent(window.location.hash.slice(1));
  return isSectionId(id) ? id : null;
}

/** Opens a section: a new history entry from rest, a replaced one when switching objects. */
function openSection(id: SectionId) {
  const current = readHash();
  if (current === id) return;
  const url = `${window.location.pathname}${window.location.search}#${id}`;
  if (current === null) window.history.pushState({ wbOpened: true }, "", url);
  else window.history.replaceState({ wbOpened: window.history.state?.wbOpened === true }, "", url);
  window.dispatchEvent(new Event(HASH_EVENT));
}

/** Back to rest: pops our own entry when there is one, so Back never reopens what was just closed. */
function closeSection() {
  if (readHash() === null) return;
  if (window.history.state?.wbOpened) {
    window.history.back();
    return;
  }
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  window.dispatchEvent(new Event(HASH_EVENT));
}

/**
 * Client container: the URL hash is the active section (shareable, back and
 * forward work, a direct load opens zoomed in). Connects the Workbench camera
 * to the spec sheet and owns keyboard and focus. Section content is rendered
 * on the server and passed in, so sections stay presentational server components.
 */
export function WorkbenchExplorer({ panels }: { panels: Record<SectionId, ReactNode> }) {
  const active = useSyncExternalStore(subscribe, readHash, () => null);

  // The last opened section stays in the sheet while it fades out.
  const [shown, setShown] = useState<SectionId | null>(active);
  if (active && active !== shown) setShown(active);

  // Picked item inside the active section; resets when the section changes.
  const [picked, setPicked] = useState<{ id: ActiveSection; index: number }>({ id: null, index: 0 });
  const pick = picked.id === active ? picked.index : 0;
  const choose = useCallback(
    (index: number) => setPicked((current) => (current.id === active && current.index === index ? current : { id: active, index })),
    [active],
  );

  const sheetRef = useRef<HTMLElement>(null);
  const intent = useRef(false);
  const select = useCallback((id: SectionId) => {
    intent.current = true;
    openSection(id);
  }, []);
  const close = useCallback(() => {
    intent.current = true;
    closeSection();
  }, []);

  // Focus follows the camera: into the sheet when opened by the reader,
  // back onto the object when the sheet closes (it turns inert and would drop focus).
  const previous = useRef<ActiveSection>(null);
  useEffect(() => {
    const was = previous.current;
    previous.current = active;
    if (was === active) return;
    const sheet = sheetRef.current;
    if (active && intent.current) {
      sheet?.focus({ preventScroll: true });
      sheet?.querySelector(".wb-sheet-body")?.scrollTo({ top: 0 });
    } else if (!active && was) {
      const focus = document.activeElement;
      if (!focus || focus === document.body || sheet?.contains(focus)) {
        document.querySelector<HTMLButtonElement>(`.wb-nav [data-nav="${was}"]`)?.focus({ preventScroll: true });
      }
    }
    intent.current = false;
  }, [active]);

  // Mark the picked item in the sheet and keep it in view.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !active) return;
    const panel = sheet.querySelector(`[data-panel="${active}"]`);
    panel?.querySelectorAll<HTMLElement>("[data-pick]").forEach((item) => {
      const on = PICKS[active] !== undefined && Number(item.dataset.pick) === pick;
      item.toggleAttribute("data-picked", on);
      if (on && sheet.contains(document.activeElement) && !item.contains(document.activeElement)) item.scrollIntoView({ block: "nearest" });
    });
  }, [active, pick]);

  // Keys: Esc returns to rest, 1–5 jump to an object, ←/→ browse the picked item.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if ((event.target as Element | null)?.closest?.("input, textarea, select, [contenteditable]")) return;
      // Enter toggles: it opens at rest (Workbench) and puts the object back down here,
      // unless it lands on a control inside the sheet that Enter should press instead.
      const onControl = (event.target as Element | null)?.closest?.("a, button, summary, [role='button']");
      if ((event.key === "Escape" || (event.key === "Enter" && !event.repeat && !onControl)) && active) {
        event.preventDefault();
        close();
        return;
      }
      const n = Number(event.key);
      if (Number.isInteger(n) && n >= 1 && n <= SECTIONS.length) {
        event.preventDefault();
        select(SECTIONS[n - 1].id);
        return;
      }
      const count = active ? PICKS[active] : undefined;
      if (count && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
        event.preventDefault();
        choose((pick + (event.key === "ArrowRight" ? 1 : count - 1)) % count);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, pick, select, close, choose]);

  const meta = shown ? getSection(shown) : null;

  return (
    <Workbench active={active} pick={pick} onSelect={select} onClose={close}>
      <SpecSheet
        ref={sheetRef}
        id={SHEET_ID}
        open={active !== null}
        labelledBy={shown ? titleOf(shown) : titleOf(SECTIONS[0].id)}
        label={meta ? `${meta.index} · ${meta.figureObject}${PICKS[meta.id] ? " · ← → browse" : ""}` : ""}
        onClose={close}
        onPick={PICKS[active ?? "about"] ? choose : undefined}
      >
        {SECTIONS.map((section) => (
          <div key={section.id} data-panel={section.id} hidden={section.id !== shown}>
            <SectionHeading index={section.index} title={section.label} id={titleOf(section.id)} />
            {panels[section.id]}
          </div>
        ))}
      </SpecSheet>
    </Workbench>
  );
}
