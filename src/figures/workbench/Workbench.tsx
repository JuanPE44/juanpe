"use client";

import "../iso/iso.css";
import "./workbench.css";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { getSection, SECTION_IDS, SECTIONS, type SectionId } from "@/sections/sections";
import { Plate } from "../iso/react/draw";
import { follow, useInView, useLoop, useReadout, useStillness } from "../iso/react/live";
import { CHAIR, COUNTS, DESK, DESK_HEIGHT, FOCUS, LABEL, MOVES, OBJECTS, ON_FLOOR, ORDER, SCREENS, TRAVEL, VIEW } from "./art.generated";
import { frame, SHEET_ID, STAGE, type Box, type WorkbenchProps } from "./model";

const TOUR_START = 2.4; // s of idleness before the tour begins
const TOUR_STEP = 3.2; // s per object on the tour
const SCREEN_STEP = 4; // s per project on the laptop screen
const CARD_STEP = 0.9; // s per card while browsing the log
const RING_STEP = 1.4; // s per ring burst of the phone
const WAKE_SLACK = 0.02; // s past a step boundary, so the woken frame lands on the new step
const CAMERA = 0.16; // s time constant of the camera follow (settles in about 0.6 s)
/** Soft shadow gradients: [id, colour token, [offset, opacity] stops], eased so the rim has no visible edge. */
const SOFT: [string, string, [number, number][]][] = [
  ["wb-g-halo", "--anatomy-halo", [[0, 1], [0.35, 0.8], [0.7, 0.32], [1, 0]]],
  ["wb-g-contact", "--anatomy-hi", [[0, 1], [0.6, 0.85], [0.85, 0.3], [1, 0]]],
  ["wb-g-wall", "--anatomy-halo", [[0, 1], [0.5, 0.6], [1, 0]]],
  ["wb-g-glow", "--wb-accent", [[0, 1], [0.6, 0.5], [1, 0]]],
];

const SCREEN_UP = [0, -1] as const; // dock icons rise in the screen plane (local units)
const BUZZ = [1, 0] as const; // the phone buzzes sideways in its own plane

/** Which keypad key an event landed on, if any. */
const keyOf = (target: EventTarget | null) => (target instanceof Element ? target.closest<SVGGElement>("[data-key]") : null);

/** What each object opens, for its button's accessible name. */
const DESCRIBE: Record<SectionId, string> = {
  about: "the photo on the wall, who I am",
  projects: "the laptop, projects I have built",
  experience: "the notebook, one tab per job",
  contact: "the phone, how to reach me",
  cv: "the iPad, my résumé as a PDF",
};

/** Name tag geometry in figure units (about 12px at rest on a laptop screen). */
const TAG = { size: 6.4, advance: 4.25, pad: 3.8, height: 10.5, gap: 3 } as const;

/** Shortly after load the laptop pulses and its tag invites a click, until the reader engages (ms). */
const NUDGE = { id: "projects" as SectionId, delay: 1800, length: 5600 };
const NUDGE_TEXT = { wide: "Click to explore", narrow: "Tap to explore" };

/**
 * The heavy static markup, read only while rendering on the server. Next compiles `typeof window`
 * to a constant, so the browser build drops this branch and tree-shakes the strings away; it is
 * not a prop either, so it stays out of the flight payload and ships once, in the HTML.
 * Hydration keeps those server children: React never diffs dangerouslySetInnerHTML content,
 * and the client's empty string never changes, so later renders never touch it.
 */
const ART = typeof window === "undefined" ? { desk: DESK, objects: OBJECTS, chair: CHAIR } : null;
const markup = (html: string | undefined) => ({ __html: html ?? "" });

/**
 * A client-only render (no server HTML, e.g. after a remount) finds the art groups empty: fetch the same
 * markup, emitted by the build script, and fill them. Never an import: a client reference to the generated
 * module would pull its strings back into the bundle.
 */
async function fillArt(svg: SVGSVGElement) {
  const groups = Array.from(svg.querySelectorAll<SVGGElement>("[data-art]"));
  if (groups.every((g) => g.firstChild)) return false;
  const art: { desk: string; chair: string; objects: Record<string, string> } = await (await fetch("/workbench/art.json")).json();
  groups.forEach((g) => {
    const name = g.dataset.art!;
    g.innerHTML = name === "desk" ? art.desk : name === "chair" ? art.chair : (art.objects[name] ?? "");
  });
  return true;
}

/** The animated pieces inside the static art, found once by their data-part names. */
interface Parts {
  cards: SVGGElement[];
  dock: SVGGElement[];
  leds: Element[];
  phone: SVGGElement | null;
  lines: (SVGTextElement | null)[];
  lifts: SVGElement[];
  scene: SVGGElement | null;
  height: SVGTextElement | null;
}

function partsOf(svg: SVGSVGElement): Parts {
  const all = (prefix: string) =>
    Array.from(svg.querySelectorAll<SVGGElement>(`[data-part^="${prefix}"]`)).sort(
      (a, b) => Number(a.dataset.part!.split("-").pop()) - Number(b.dataset.part!.split("-").pop()),
    );
  return {
    cards: all("card-"),
    dock: all("dock-"),
    leds: Array.from(svg.querySelectorAll(".wb-dock-led")),
    phone: svg.querySelector<SVGGElement>('[data-part="phone"]'),
    lifts: Array.from(svg.querySelectorAll<SVGElement>("[data-lift]")),
    scene: svg.querySelector<SVGGElement>("[data-scene]"),
    height: svg.querySelector<SVGTextElement>('[data-part="height"]'),
    lines: ["screen-head", "screen-title-0", "screen-title-1", "screen-meta"].map((p) => svg.querySelector<SVGTextElement>(`[data-part="${p}"]`)),
  };
}

const WHOLE: Box = { x: 0, y: 0, w: VIEW.width, h: VIEW.height };

// The floor (and the chair on it) stays put; the top and everything on it ride up and down with the frame.
// The art is drawn at the start height, so the scene's offset is how far the top has moved from there.
const SPAN = DESK_HEIGHT.max - DESK_HEIGHT.min;
const riseOf = (cm: number) => ((cm - DESK_HEIGHT.min) / SPAN) * DESK_HEIGHT.rise;
const topOffset = (cm: number) => riseOf(cm) - riseOf(DESK_HEIGHT.start);

/**
 * The rest view on narrow stages: the whole bench fit to the width is tiny on a phone, so zoom in
 * until it fills the height (capped) and let the reader pan sideways. Returns the view and how far
 * its centre may move left or right (figure units).
 */
function restOf(width: number, height: number): { view: Box; slack: number } {
  const { inset, top, bottom } = STAGE;
  const full = { x: inset, y: top, w: width - 2 * inset, h: height - top - bottom };
  const rest = frame(WHOLE, full, width, height);
  if (width >= STAGE.panBelow) return { view: rest, slack: 0 };
  const zoom = Math.max(1, Math.min(STAGE.panZoom, (full.h / height) * (rest.h / WHOLE.h)));
  const w = rest.w / zoom;
  const h = rest.h / zoom;
  const view = { x: rest.x + (rest.w - w) / 2, y: rest.y + (rest.h - h) / 2, w, h };
  return { view, slack: Math.max(0, (WHOLE.w - w) / 2) };
}

const clampPan = (pan: number, slack: number) => Math.max(-slack, Math.min(slack, pan));

/** Where the camera should look for a stage of width x height px: the whole bench, or one object beside the sheet. */
function shotOf(id: SectionId | null, width: number, height: number, offset: number, pan = 0): Box {
  const { inset, top } = STAGE;
  const full = { x: inset, y: top, w: width - 2 * inset, h: height - top - STAGE.bottom };
  const { view, slack } = restOf(width, height);
  const rest = frame(WHOLE, full, width, height);
  if (!id) return { ...view, x: view.x + clampPan(pan, slack) };
  const wide = width >= STAGE.wide;
  const sheet = Math.min(STAGE.sheetMax, width * STAGE.sheetShare);
  const region = wide
    ? { x: inset, y: top, w: width - sheet - 3 * inset, h: full.h }
    : { x: inset, y: top, w: full.w, h: height * (1 - STAGE.phoneShare) - top - inset / 2 };
  const box = FOCUS[id];
  // Objects on the floor group (the wall frame) stay put while the top moves.
  const by = (ON_FLOOR as readonly SectionId[]).includes(id) ? 0 : offset;
  const moved = { ...box, x: box.x + MOVES.lift[0] * by, y: box.y + MOVES.lift[1] * by };
  return frame(moved, region, width, height, (width / rest.w) * STAGE.maxZoom);
}

const viewBoxOf = ({ x, y, w, h }: Box) => `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`;

type ReadoutMode = "hot" | "active" | "tour" | "rest";

/** The corner readout in three parts: a prefix, the section name (emphasised) and the object. */
const readoutOf = (id: SectionId | null, mode: ReadoutMode): [string, string, string] => {
  if (!id) return [`${ORDER.length} objects`, "", "pick one"];
  const meta = getSection(id);
  const prefix = mode === "active" ? `open ${meta.index}` : mode === "tour" ? `tour ${meta.index}` : meta.index;
  return [prefix, meta.label, meta.figureObject.toLowerCase()];
};

/**
 * Empty slots React never fills, so the animation loop can write them without React
 * reconciling over it (the tour changes the readout between renders).
 */
const READOUT_SLOTS = (
  <>
    <span className="wb-ro-prefix" />
    <b className="wb-ro-label" />
    <span className="wb-ro-object" />
  </>
);

function paintReadout(anchor: Element | null, [prefix, label, object]: [string, string, string]) {
  const slot = anchor?.closest(".iso-plate")?.querySelector("[data-readout]");
  if (!slot) return;
  const set = (selector: string, text: string) => {
    const node = slot.querySelector(selector);
    if (node && node.textContent !== text) node.textContent = text;
  };
  set(".wb-ro-prefix", prefix);
  set(".wb-ro-label", label);
  set(".wb-ro-object", object);
}

const shift = ([x, y]: readonly [number, number] | number[], by: number) =>
  by === 0 ? "" : `translate(${(x * by).toFixed(2)} ${(y * by).toFixed(2)})`;

/** Eases one value toward its target and writes the transform only when it changed. */
function drive(values: number[], i: number, target: number, dt: number, seconds: number, calm: boolean, g: Element, axis: readonly [number, number]) {
  const next = follow(values[i], target, dt, seconds, calm);
  if (next === values[i]) return false;
  values[i] = next;
  g.setAttribute("transform", shift(axis, next));
  return true;
}

/**
 * Isometric workbench (anatomy kit). Static art is precomputed by
 * tools/anatomy/workbench.build.mjs into art.generated.ts; the heavy SVG
 * markup is rendered on the server only (see ART). This component
 * adds hover/focus/active state and the calm per-object motion.
 */
const navButton = (id: SectionId) => document.querySelector<HTMLButtonElement>(`.wb-nav [data-nav="${id}"]`);

/** A name-tag pill centred above its anchor. */
function Pill({ text, className }: { text: string; className?: string }) {
  const width = text.length * TAG.advance + 2 * TAG.pad;
  return (
    <g className={className}>
      <rect x={-width / 2} y={-TAG.height} width={width} height={TAG.height} rx={TAG.height / 2} />
      <text x={0} y={-TAG.height / 2} dy="0.35em" fontSize={TAG.size} textAnchor="middle">
        {text}
      </text>
    </g>
  );
}

export function Workbench({ active, pick, onSelect, onClose, children }: WorkbenchProps) {
  const { anchor } = useReadout<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hot, setHot] = useState<SectionId | null>(null);
  const [focused, setFocused] = useState<SectionId | null>(null);
  const [nudge, setNudge] = useState(false);
  const engaged = useRef(false);
  const engage = () => {
    engaged.current = true;
    setNudge(false);
  };
  // A second press on the open object puts it back down.
  const toggle = (id: SectionId) => {
    engage();
    if (active === id) onClose();
    else onSelect(id);
  };
  const inView = useInView(anchor);
  const still = useStillness();

  // Mutable animation state, never re-rendered.
  const sim = useRef({
    origin: null as number | null, // s, performance clock at the first frame
    clock: 0, // s since the first frame (wall time, so it keeps counting while the loop sleeps)
    idleFrom: null as number | null, // clock when the bench was last left alone
    idle: 0,
    cards: new Array<number>(COUNTS.experience).fill(0),
    dock: new Array<number>(COUNTS.projects).fill(0),
    buzz: 0,
    shown: -1,
    since: { experience: 0, contact: 0 },
    engaged: { experience: false, contact: false },
    camera: null as Box | null,
    height: DESK_HEIGHT.start as number, // cm; the art is drawn at this height
    drive: 0, // -1 lowering, 1 raising while a key is held
    recall: null as number | null, // cm a memory key is heading to
    pan: 0, // figure units the narrow rest view is panned sideways
    drag: null as { x: number; pan: number; moved: boolean } | null,
    fresh: false, // the art was just (re)inserted and needs its lift transforms
    tour: null as SectionId | null, // object the idle tour is pointing at
  });
  const latest = useRef({ hot, active, pick });
  useEffect(() => {
    latest.current = { hot, active, pick };
  }, [hot, active, pick]);
  const size = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const show = setTimeout(() => {
      if (!engaged.current && !latest.current.active) setNudge(true);
    }, NUDGE.delay);
    const hide = setTimeout(() => setNudge(false), NUDGE.delay + NUDGE.length);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);
  const nudging = nudge && !active && !hot && !focused;

  // At rest: ←/→ step through the objects in section order (focusing their nav button), Enter opens the hovered one.
  useEffect(() => {
    if (active) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if ((event.target as Element | null)?.closest?.("input, textarea, select, [contenteditable]")) return;
      const current = latest.current.hot;
      const onNav = (event.target as Element | null)?.closest?.(".wb-nav");
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const count = SECTION_IDS.length;
        const at = current ? SECTION_IDS.indexOf(current) : -1;
        const step = event.key === "ArrowRight" ? 1 : -1;
        const next = at < 0 ? (step > 0 ? 0 : count - 1) : (at + step + count) % count;
        navButton(SECTION_IDS[next])?.focus({ preventScroll: true });
      } else if (event.key === "Enter" && !event.repeat && current && !onNav) {
        // A focused nav button opens through its own click.
        event.preventDefault();
        engaged.current = true;
        onSelect(current);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, onSelect]);

  const parts = useRef<Parts | null>(null);
  useEffect(() => {
    if (svgRef.current) parts.current = partsOf(svgRef.current);
  }, []);

  const kick = useLoop((dt, calm) => {
    const s = sim.current;
    const el = parts.current;
    if (!el) return false;
    const { hot: h, active: a, pick: p } = latest.current;
    const now = performance.now() / 1000;
    s.origin ??= now;
    s.clock = now - s.origin;
    if (h || a || s.idleFrom === null) s.idleFrom = s.clock;
    s.idle = s.clock - s.idleFrom;
    const touring = !calm && s.idle > TOUR_START;
    const tour = touring ? SECTION_IDS[Math.floor((s.idle - TOUR_START) / TOUR_STEP) % SECTION_IDS.length] : null;
    const focus = h ?? a ?? tour;
    paintReadout(anchor.current, readoutOf(focus as SectionId | null, h ? "hot" : a ? "active" : tour ? "tour" : "rest"));
    // CSS keys its idle animations (the laptop cursor, the steam) off what the bench is showing.
    const stage = anchor.current;
    if (stage && stage.getAttribute("data-shot") !== focus) {
      if (focus) stage.setAttribute("data-shot", focus);
      else stage.removeAttribute("data-shot");
    }
    // The tour points at its object with a soft hover (outline and tag, no lift).
    if (tour !== s.tour) {
      s.tour = tour;
      svgRef.current?.querySelectorAll("[data-tour]").forEach((node) => node.removeAttribute("data-tour"));
      if (tour) svgRef.current?.querySelectorAll(`[data-obj="${tour}"], [data-tag="${tour}"]`).forEach((node) => node.setAttribute("data-tour", ""));
    }

    // Between moves the loop sleeps until the next scheduled step: the tour, the screen, a card, a ring.
    let wake = Infinity;
    const wakeAfter = (age: number, step: number) => {
      wake = Math.min(wake, step - (age % step) + WAKE_SLACK);
    };
    if (!calm && !h && !a) {
      if (s.idle <= TOUR_START) wake = Math.min(wake, TOUR_START - s.idle + WAKE_SLACK);
      else wakeAfter(s.idle - TOUR_START, TOUR_STEP);
    }

    const engage = (id: "experience" | "contact") => {
      const on = focus === id;
      if (on && !s.engaged[id]) s.since[id] = s.clock;
      s.engaged[id] = on;
      return on ? s.clock - s.since[id] : -1;
    };

    let moving = false;

    // Camera: eases the viewBox toward the active object (or the whole bench); jumps on first sight.
    const { width, height } = size.current;
    if (width && height) {
      const target = shotOf(a, width, height, topOffset(s.height), s.pan);
      const from = s.camera;
      // A finger dragging the bench moves it 1:1; everything else eases.
      const next = from && !s.drag?.moved
        ? { x: follow(from.x, target.x, dt, CAMERA, calm), y: follow(from.y, target.y, dt, CAMERA, calm), w: follow(from.w, target.w, dt, CAMERA, calm), h: follow(from.h, target.h, dt, CAMERA, calm) }
        : target;
      if (!from || next.x !== from.x || next.y !== from.y || next.w !== from.w || next.h !== from.h) {
        s.camera = next;
        svgRef.current?.setAttribute("viewBox", viewBoxOf(next));
        moving = true;
      }
    }

    // Laptop: cycles projects while the page is alive; the shown dock icon rises and lights.
    // Zoomed into the projects, it shows the one picked in the sheet.
    const projectsOn = focus === "projects";
    const shown = a === "projects" ? p % SCREENS.length : calm ? 0 : Math.floor(s.clock / SCREEN_STEP) % SCREENS.length;
    if (!calm && a !== "projects") wakeAfter(s.clock, SCREEN_STEP);
    if (shown !== s.shown) {
      s.shown = shown;
      SCREENS[shown].forEach((text, i) => {
        const line = el.lines[i];
        if (line && line.textContent !== text) line.textContent = text;
      });
      el.leds.forEach((led, i) => led.toggleAttribute("data-on", i === shown));
    }
    el.dock.forEach((g, i) => {
      const target = i === shown ? TRAVEL.dock * (projectsOn ? 1 : 0.5) : 0;
      if (drive(s.dock, i, target, dt, 0.28, calm, g, SCREEN_UP)) moving = true;
    });

    // Notebook: browse the divider tabs one by one; the picked one slides out.
    const logAge = engage("experience");
    const lifted = a === "experience" ? p % el.cards.length : logAge >= 0 ? (calm ? 0 : Math.floor(logAge / CARD_STEP) % el.cards.length) : -1;
    if (!calm && logAge >= 0 && a !== "experience") wakeAfter(logAge, CARD_STEP);
    el.cards.forEach((g, i) => {
      const target = logAge < 0 ? 0 : i === lifted ? TRAVEL.card : TRAVEL.card * 0.18;
      if (drive(s.cards, i, target, dt, 0.2, calm, g, MOVES.out)) moving = true;
    });

    // Phone: an incoming call while contact is in focus, buzzing in short bursts.
    const ringAge = engage("contact");
    el.phone?.toggleAttribute("data-ringing", ringAge >= 0);
    const bursting = ringAge >= 0 && !calm && ringAge % RING_STEP < 0.5;
    const buzz = bursting ? Math.sin(s.clock * 80) * 0.5 : 0;
    if (buzz !== s.buzz && el.phone) {
      s.buzz = buzz;
      el.phone.setAttribute("transform", shift(BUZZ, buzz));
      moving = true;
    }
    if (bursting) moving = true;
    else if (ringAge >= 0 && !calm) wakeAfter(ringAge, RING_STEP);

    // Desk: a held key drives the frame at its motor speed; a memory key travels to its height and eases in.
    let cm = s.height;
    if (s.drive) cm += s.drive * DESK_HEIGHT.speed * dt;
    else if (s.recall !== null) {
      const gap = s.recall - cm;
      const step = calm ? Math.abs(gap) : Math.min(Math.abs(gap), DESK_HEIGHT.speed * dt * Math.min(1, 0.25 + Math.abs(gap) / 3));
      cm += Math.sign(gap) * step;
      if (Math.abs(s.recall - cm) < 0.05) {
        cm = s.recall;
        s.recall = null;
      }
    }
    cm = Math.min(DESK_HEIGHT.max, Math.max(DESK_HEIGHT.min, cm));
    if (cm !== s.height || s.fresh || !el.height?.textContent) {
      s.height = cm;
      s.fresh = false;
      const rise = riseOf(cm);
      el.lifts.forEach((g) => g.setAttribute("transform", shift(MOVES.lift, -rise * Number(g.dataset.lift))));
      el.scene?.setAttribute("transform", shift(MOVES.lift, topOffset(cm)));
      if (el.height) el.height.textContent = cm.toFixed(1);
      moving = true;
    }
    if (s.drive || s.recall !== null) moving = true;

    // Every frame while something eases; otherwise sleep until the next step (never, under reduced motion).
    return moving || wake;
  }, inView);

  useEffect(() => {
    kick();
  }, [hot, active, pick, still, kick]);

  // Without server HTML (a client-only render) the art arrives late: wire it up and repaint once it lands.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let live = true;
    fillArt(svg).then((filled) => {
      if (!filled || !live) return;
      parts.current = partsOf(svg);
      sim.current.shown = -1;
      sim.current.fresh = true;
      kick();
    }).catch(() => {});
    return () => {
      live = false;
    };
  }, [kick]);

  // The stage's pixel size drives the camera; re-frame whenever it changes.
  useEffect(() => {
    const node = anchor.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      size.current = { width: entry.contentRect.width, height: entry.contentRect.height };
      kick();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [anchor, kick]);

  // Keypad: up/down move while held (pointer or key), memory keys recall a preset height.
  const pressKey = useCallback(
    (key: SVGGElement) => {
      const s = sim.current;
      const name = key.dataset.key!;
      key.setAttribute("data-pressed", "");
      if (name === "up" || name === "down") {
        s.drive = name === "up" ? 1 : -1;
        s.recall = null;
      } else {
        s.drive = 0;
        s.recall = DESK_HEIGHT.presets[Number(name.slice(1))];
      }
      kick();
    },
    [kick],
  );
  const releaseKeys = useCallback(() => {
    sim.current.drive = 0;
    svgRef.current?.querySelectorAll("[data-pressed]").forEach((key) => key.removeAttribute("data-pressed"));
  }, []);
  useEffect(() => {
    window.addEventListener("pointerup", releaseKeys);
    window.addEventListener("pointercancel", releaseKeys);
    window.addEventListener("blur", releaseKeys);
    return () => {
      window.removeEventListener("pointerup", releaseKeys);
      window.removeEventListener("pointercancel", releaseKeys);
      window.removeEventListener("blur", releaseKeys);
    };
  }, [releaseKeys]);
  const keyDown = (event: PointerEvent<HTMLDivElement>) => {
    const key = keyOf(event.target);
    if (!key || event.button !== 0) {
      startPan(event);
      return;
    }
    event.preventDefault();
    pressKey(key);
  };

  // Narrow stages at rest: drag sideways to pan the bench. Past a few px it is a drag, not a tap.
  const startPan = (event: PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    const { width, height } = size.current;
    if (active || !restOf(width, height).slack) return;
    s.drag = { x: event.clientX, pan: s.pan, moved: false };
  };
  const movePan = (event: PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    const drag = s.drag;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 6) return;
    if (!drag.moved) event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.moved = true;
    const { width, height } = size.current;
    const { view, slack } = restOf(width, height);
    s.pan = clampPan(drag.pan - dx * (view.w / width), slack);
    kick();
  };
  const endPan = () => {
    const drag = sim.current.drag;
    sim.current.drag = null;
    dragged.current = drag?.moved ?? false;
  };
  // A drag that ends over an object must not open it.
  const dragged = useRef(false);
  const swallowDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (!dragged.current) return;
    dragged.current = false;
    event.stopPropagation();
    event.preventDefault();
  };
  const keyboardDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = keyOf(event.target);
    if (!key || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    if (!event.repeat) pressKey(key);
  };
  const keyboardUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (keyOf(event.target) && (event.key === "Enter" || event.key === " ")) releaseKeys();
  };

  // A click on the bench but off every object returns to rest.
  const away = (event: MouseEvent<HTMLDivElement>) => {
    if (active && !(event.target as Element).closest(".wb-obj, [data-key]")) onClose();
  };

  return (
    <div className="iso wb-theme wb-plate" data-zoomed={active ? "" : undefined}>
      <Plate
        stage
        title="Workbench"
        hint={
          active ? (
            `Enter or Esc returns · 1–${SECTIONS.length} jump`
          ) : (
            <>
              <span className="wb-hint-wide">Hover or ←/→ · Enter opens</span>
              <span className="wb-hint-narrow">Drag · tap an object</span>
            </>
          )
        }
        readout={READOUT_SLOTS}
      >
        <nav className="wb-nav" aria-label="Sections">
          {SECTIONS.map((meta) => (
            <button
              key={meta.id}
              type="button"
              data-nav={meta.id}
              aria-label={`${meta.index} ${meta.label}: ${DESCRIBE[meta.id]}`}
              aria-expanded={active === meta.id}
              aria-controls={SHEET_ID}
              onClick={() => toggle(meta.id)}
              onFocus={() => {
                engage();
                setHot(meta.id);
                setFocused(meta.id);
              }}
              onBlur={() => {
                setHot((current) => (current === meta.id ? null : current));
                setFocused((current) => (current === meta.id ? null : current));
              }}
            />
          ))}
        </nav>
        <div ref={anchor} className="wb wb-stage" onClick={away} onClickCapture={swallowDrag} onPointerDown={(event) => {
            engage();
            keyDown(event);
          }} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} onKeyDown={keyboardDown} onKeyUp={keyboardUp}>
          <svg
            ref={svgRef}
            className="iso-svg"
            viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
            preserveAspectRatio="xMidYMid meet"
            role="group"
            aria-label={LABEL}
          >
            {/* Soft shadows are gradient fills, never filters: WebKit paints SVG on the CPU and re-runs every
                blur filter on each repaint, which made the figure crawl in Safari. Each fades to nothing at its rim. */}
            <defs>
              {SOFT.map(([id, color, stops]) => (
                <radialGradient key={id} id={id}>
                  {stops.map(([offset, opacity]) => (
                    <stop key={offset} offset={offset} style={{ stopColor: `var(${color})`, stopOpacity: opacity }} />
                  ))}
                </radialGradient>
              ))}
            </defs>
            <g data-scene="">
              <g data-art="desk" dangerouslySetInnerHTML={markup(ART?.desk)} suppressHydrationWarning />
              {/* Painted back to front; keyboard and screen readers use the buttons below, in section order. */}
              {ORDER.map((id) => (
                <g
                  key={id}
                  className="wb-obj"
                  data-obj={id}
                  data-hot={hot === id ? "" : undefined}
                  data-focus={focused === id ? "" : undefined}
                  data-active={active === id ? "" : undefined}
                  data-nudge={nudging && id === NUDGE.id ? "" : undefined}
                  style={{ "--i": SECTION_IDS.indexOf(id) } as CSSProperties}
                  aria-hidden="true"
                  onClick={() => toggle(id)}
                  onPointerEnter={() => {
                    if (nudge) engage();
                    setHot(id);
                  }}
                  onPointerLeave={() => setHot((current) => (current === id ? null : current))}
                  data-art={id}
                  dangerouslySetInnerHTML={markup(ART?.objects[id])}
                  suppressHydrationWarning
                />
              ))}
              <g className="wb-chair" aria-hidden="true" data-art="chair" dangerouslySetInnerHTML={markup(ART?.chair)} suppressHydrationWarning />
              {/* Name tags over each object, shown on hover and keyboard focus. */}
              <g aria-hidden="true">
                {ORDER.map((id) => {
                  const { x, y, w } = FOCUS[id];
                  const nudged = nudging && id === NUDGE.id;
                  return (
                    <g key={id} className="wb-tag" data-tag={id} data-hot={hot === id || nudged ? "" : undefined} transform={`translate(${(x + w / 2).toFixed(1)} ${(y - TAG.gap).toFixed(1)})`}>
                      {nudged ? (
                        <>
                          <Pill text={NUDGE_TEXT.wide} className="wb-tag-wide" />
                          <Pill text={NUDGE_TEXT.narrow} className="wb-tag-narrow" />
                        </>
                      ) : (
                        <Pill text={getSection(id).label} />
                      )}
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>
        </div>
        {children}
      </Plate>
    </div>
  );
}
