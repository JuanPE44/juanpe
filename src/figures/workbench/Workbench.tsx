"use client";

import "../iso/iso.css";
import "./workbench.css";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { getSection, type SectionId } from "@/sections/sections";
import { ring, type Projection } from "../iso/iso-kit";
import { Plate } from "../iso/react/draw";
import { follow, useInView, useLoop, useReadout, useStillness } from "../iso/react/live";
import { COUNTS, DESK, DIAL, LABEL, MOVES, OBJECTS, ORDER, PROJECTION, SCREENS, TRAVEL, VIEW } from "./art.generated";
import type { WorkbenchProps } from "./model";

const P = PROJECTION as Projection;
const TOUR_START = 2.4; // s of idleness before the tour begins
const TOUR_STEP = 3.2; // s per object on the tour
const SCREEN_STEP = 4; // s per project on the CRT
const CARD_STEP = 0.9; // s per card while browsing the log
const DIAL_STEP = 1.5; // s per dialled digit

const readoutOf = (id: SectionId | null, mode: "hot" | "active" | "tour" | "rest") => {
  if (!id) return `${ORDER.length} objects · pick one`;
  const meta = getSection(id);
  const prefix = mode === "active" ? "open" : mode === "tour" ? "tour" : meta.index;
  return `${prefix} · ${meta.label} · ${meta.figureObject.toLowerCase()}`;
};

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

function dialHoles(turn: number) {
  let d = "";
  for (let h = 0; h < DIAL.holes; h++) {
    const a = turn + (h / (DIAL.holes + 2)) * Math.PI * 2 + Math.PI * 0.5;
    d += ring(DIAL.cx + Math.sin(a) * DIAL.ring, DIAL.cy - Math.cos(a) * DIAL.ring, DIAL.holeR, DIAL.z + 0.8, P, 14);
  }
  return d;
}

/**
 * Isometric workbench (anatomy kit). Static art is precomputed by
 * tools/anatomy/workbench.build.mjs into art.generated.ts; this component
 * adds hover/focus/active state and the calm per-object motion.
 */
export function Workbench({ active, onSelect }: WorkbenchProps) {
  const { anchor, say } = useReadout<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hot, setHot] = useState<SectionId | null>(null);
  const inView = useInView(anchor);
  const still = useStillness();

  // Mutable animation state, never re-rendered.
  const sim = useRef({
    clock: 0,
    idle: 0,
    drawers: new Array<number>(COUNTS.stack).fill(0),
    cards: new Array<number>(COUNTS.experience).fill(0),
    carts: new Array<number>(COUNTS.projects).fill(0),
    turn: 0,
    shown: -1,
    since: { stack: 0, experience: 0, contact: 0 },
    engaged: { stack: false, experience: false, contact: false },
  });
  const latest = useRef({ hot, active });
  useEffect(() => {
    latest.current = { hot, active };
  }, [hot, active]);

  const parts = useRef<{
    drawers: SVGGElement[];
    cards: SVGGElement[];
    carts: SVGGElement[];
    leds: Element[];
    holes: SVGPathElement | null;
    lines: (SVGTextElement | null)[];
  } | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const all = (prefix: string) =>
      Array.from(svg.querySelectorAll<SVGGElement>(`[data-part^="${prefix}"]`)).sort(
        (a, b) => Number(a.dataset.part!.split("-").pop()) - Number(b.dataset.part!.split("-").pop()),
      );
    parts.current = {
      drawers: all("drawer-"),
      cards: all("card-"),
      carts: all("cart-"),
      leds: Array.from(svg.querySelectorAll(".wb-cart-led")),
      holes: svg.querySelector<SVGPathElement>('[data-part="dial-holes"]'),
      lines: ["crt-head", "crt-title-0", "crt-title-1", "crt-meta"].map((p) => svg.querySelector<SVGTextElement>(`[data-part="${p}"]`)),
    };
  }, []);

  const kick = useLoop((dt, calm) => {
    const s = sim.current;
    const el = parts.current;
    if (!el) return false;
    const { hot: h, active: a } = latest.current;
    s.clock += dt;
    s.idle = h || a ? 0 : s.idle + dt;
    const touring = !calm && s.idle > TOUR_START;
    const tour = touring ? ORDER[Math.floor((s.idle - TOUR_START) / TOUR_STEP) % ORDER.length] : null;
    const focus = h ?? a ?? tour;
    say(readoutOf(focus as SectionId | null, h ? "hot" : a ? "active" : tour ? "tour" : "rest"));

    const engage = (id: "stack" | "experience" | "contact") => {
      const on = focus === id;
      if (on && !s.engaged[id]) s.since[id] = s.clock;
      s.engaged[id] = on;
      return on ? s.clock - s.since[id] : -1;
    };

    // CRT: cycles projects while the page is alive; the shown cartridge stands up.
    const projectsOn = focus === "projects";
    const shown = calm ? 0 : Math.floor(s.clock / SCREEN_STEP) % SCREENS.length;
    if (shown !== s.shown) {
      s.shown = shown;
      SCREENS[shown].forEach((text, i) => {
        const line = el.lines[i];
        if (line && line.textContent !== text) line.textContent = text;
      });
      el.leds.forEach((led, i) => led.toggleAttribute("data-on", i === shown));
    }
    let moving = false;
    el.carts.forEach((g, i) => {
      const target = i === shown ? TRAVEL.cart * (projectsOn ? 1 : 0.4) : 0;
      if (drive(s.carts, i, target, dt, 0.28, calm, g, MOVES.lift)) moving = true;
    });

    // Cabinet: drawers slide out in a wave from the top.
    const stackAge = engage("stack");
    el.drawers.forEach((g, i) => {
      const order = el.drawers.length - 1 - i; // drawer-0 is the top one
      const target = stackAge >= 0 && (calm || stackAge > order * 0.09) ? TRAVEL.drawer * (0.55 + 0.45 * (order === 0 ? 1 : 0)) : 0;
      if (drive(s.drawers, i, target, dt, 0.22, calm, g, MOVES.drawer)) moving = true;
    });

    // Card file: browse the cards one by one.
    const logAge = engage("experience");
    const lifted = logAge >= 0 ? (calm ? 0 : Math.floor(logAge / CARD_STEP) % el.cards.length) : -1;
    el.cards.forEach((g, i) => {
      const target = logAge < 0 ? 0 : i === lifted ? TRAVEL.card : TRAVEL.card * 0.18;
      if (drive(s.cards, i, target, dt, 0.2, calm, g, MOVES.lift)) moving = true;
    });

    // Telephone: dial a digit, let the wheel run back to the stop.
    const dialAge = engage("contact");
    let turnTarget = 0;
    if (dialAge >= 0 && !calm) {
      const step = Math.floor(dialAge / DIAL_STEP);
      const phase = dialAge - step * DIAL_STEP;
      const digit = (step * 3 + 2) % DIAL.holes;
      turnTarget = phase < 0.55 ? ((digit + 1) / (DIAL.holes + 2)) * Math.PI * 2 : 0;
    }
    const nextTurn = follow(s.turn, turnTarget, dt, turnTarget ? 0.16 : 0.32, calm);
    if (nextTurn !== s.turn) {
      s.turn = nextTurn;
      el.holes?.setAttribute("d", dialHoles(-s.turn));
      moving = true;
    }

    // Under reduced motion stop once settled; otherwise the CRT and the tour keep cycling.
    return moving || !calm;
  }, inView);

  useEffect(() => {
    kick();
  }, [hot, active, still, kick]);

  const press = useCallback(
    (id: SectionId) => (event: KeyboardEvent<SVGGElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect(id);
      }
    },
    [onSelect],
  );

  const focusId = hot ?? active;

  return (
    <div className="iso wb-theme wb-plate">
      <Plate
        fig="Fig 01"
        title="Workbench"
        hint="Hover or tab · Enter opens"
        readout={readoutOf(focusId, hot ? "hot" : active ? "active" : "rest")}
        caption="Five parts on one bench. Each object opens a section: the CRT runs the projects, the drawers hold the stack, the card file logs experience, the phone dials contact and the nameplate says who."
      >
        <div ref={anchor} className="wb iso-stage">
          <svg
            ref={svgRef}
            className="iso-svg"
            viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
            role="group"
            aria-label={LABEL}
          >
            <g dangerouslySetInnerHTML={{ __html: DESK }} />
            {ORDER.map((id) => {
              const meta = getSection(id);
              return (
                <g
                  key={id}
                  className="wb-obj"
                  data-obj={id}
                  data-hot={hot === id ? "" : undefined}
                  data-active={active === id ? "" : undefined}
                  role="button"
                  tabIndex={0}
                  aria-label={`${meta.label}: ${meta.figureObject}`}
                  aria-haspopup="dialog"
                  aria-pressed={active === id}
                  onClick={() => onSelect(id)}
                  onKeyDown={press(id)}
                  onPointerEnter={() => setHot(id)}
                  onPointerLeave={() => setHot((current) => (current === id ? null : current))}
                  onFocus={() => setHot(id)}
                  onBlur={() => setHot((current) => (current === id ? null : current))}
                  dangerouslySetInnerHTML={{ __html: OBJECTS[id] }}
                />
              );
            })}
          </svg>
        </div>
      </Plate>
    </div>
  );
}
