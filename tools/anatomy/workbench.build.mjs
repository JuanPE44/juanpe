// Builds the isometric Workbench figure (anatomy kit) into
//   src/figures/workbench/art.generated.ts   (path strings for the React figure)
//   tools/anatomy/out/workbench[-light].html (standalone preview for capture / lines checks)
// Run: node tools/anatomy/workbench.build.mjs [--audit]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";
import * as A from "./kit/audit.mjs";
import { experience } from "../../src/content/experience.ts";
import { profile } from "../../src/content/profile.ts";
import { projects } from "../../src/content/projects.ts";
import { stack } from "../../src/content/stack.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

// ------------------------------------------------------------------ world
const WIDTH = 640;
const HEIGHT = 480;

const DESK = { x: -190, y: -100, w: 380, d: 200, r: 6 };
const DESK_H = 12; // top thickness, top face at z = 0
const LEG_H = 46; // below the top
const FLOOR = -DESK_H - LEG_H;

const CRT = { x: -138, y: -66, w: 104, d: 58, r: 6 }; // front box
const CRT_FRONT = CRT.y + CRT.d;
const CRT_Z0 = 12;
const CRT_TOP = 104;
const HOOD = { x: -126, y: -96, w: 80, d: 30, r: 8 };
const STAND = { x: -112, y: -58, w: 52, d: 46, r: 5 };
const BEZEL = { x0: CRT.x + 10, x1: CRT.x + CRT.w - 10, z0: CRT_Z0 + 20, z1: CRT_TOP - 9, r: 7, depth: 1.6 };
const GLASS = { x0: BEZEL.x0 + 7, x1: BEZEL.x1 - 7, z0: BEZEL.z0 + 6, z1: BEZEL.z1 - 6, r: 9, depth: 4 };

const RACK = { x: -184, y: -40, w: 34, d: 44, r: 2 };
const CART = { w: 5.2, d: 34, h: 30, gap: 2.4 };

const CAB = { x: 34, y: -92, w: 92, d: 56, r: 3 };
const CAB_FRONT = CAB.y + CAB.d;
const CAB_Z0 = 6;
const CAB_TOP = 96;
const DRAWER_OUT = 22;

const BOX = { x: 100, y: 14, w: 64, d: 58, r: 2 }; // card file
const BOX_H = 22;
const WALL = 2.4;

const PHONE = { x: -30, y: 24, w: 64, d: 54, r: 7 };
const DIAL = { cx: 2, cy: 54, r: 14 };

const NAME = { x: -168, y: 66, w: 78, d: 14, r: 2 };
const NAME_PLATE = { x0: NAME.x + 6, x1: NAME.x + NAME.w - 6, y: NAME.y + 8.4, t: 1.6, z0: 4.2, z1: 23 };

const P = k.fitProjection(
  [...k.boxCorners(DESK, FLOOR, 0), ...k.boxCorners(CRT, 0, CRT_TOP), ...k.boxCorners(CAB, 0, CAB_TOP)],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 52 },
);

const SCREENS = projects.map((project, i) => {
  const [a, b] = wrap(project.title);
  return [`PRJ ${String(i + 1).padStart(2, "0")}/${String(projects.length).padStart(2, "0")}`, a, b, `${project.year} · ${project.tags[0]}`.toUpperCase().slice(0, 18)];
});

// ------------------------------------------------------------------ helpers
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const depth = (point) => k.depthOf(point, P);
const byDepth = (points) => [...points].sort((a, b) => depth([a[0], a[1], 0]) - depth([b[0], b[1], 0]));
const frontPlane = (y) => k.sideMatrix([0, y], 0, P, "left"); // local (x, -z) on the face at y
const flat = (x0, z0, x1, z1, r, steps = 6) =>
  k.pathOf(k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z]), true);
const slab = (plan, z, h, steps = 3, bevel = 0) => k.slabOf(plan, z, h, P, steps, bevel);
const cyl = (cx, cy, r, z, h, steps = 24, bevel = 0) => k.cylinder(cx, cy, r, z, h, P, steps, bevel);
const halo = (plan, z, h) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"/>`;
const seamOn = (plan, z, steps = 3) => L(k.sideSeam(plan, z, P, steps), { tone: "faint" });

// The audit recorder: every solid is recorded with its true shape.
const R = A.recorder(P);
const SHAPES = {};
let owner = "desk";
const rec = (shape) => {
  (SHAPES[owner] ??= []).push(shape);
  return R.solid(shape);
};
const rs = (plan, z, h, name, meta = {}) => rec(A.slab(plan, z, h, { name, ...meta }, 3));
const rc = (cx, cy, r, z, h, name, meta = {}) => rec(A.cylinder(cx, cy, r, z, h, { name, ...meta }));

let clips = 0;
const clipId = (base) => `wb-${base}-${clips++}`;

// A recess in a vertical face at y (from the desk computer): inner walls shaded by facing, a back plane.
function recess({ x0, x1, z0, z1, r, depth: deep }, y, back = "", backClass = "wb-well", inside = "") {
  const id = clipId("clip");
  const ringPts = k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, 6);
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const { sinA } = k.cameraOf(P);
  const tops = [];
  const sides = [[], [], [], []];
  ringPts.forEach(([ax, az], index) => {
    const [bx, bz] = ringPts[(index + 1) % ringPts.length];
    const length = Math.hypot(bx - ax, bz - az) || 1;
    let [nx, nz] = [(bz - az) / length, -(bx - ax) / length];
    if (nx * (cx - (ax + bx) / 2) + nz * (cz - (az + bz) / 2) < 0) [nx, nz] = [-nx, -nz];
    if (nx <= 0 && nz <= 0) return;
    const quad = k.pathOf([at([ax, y, az]), at([bx, y, bz]), at([bx, y - deep, bz]), at([ax, y - deep, az])], true);
    if (nz >= nx) tops.push(quad);
    else sides[Math.min(3, Math.max(0, Math.floor(((nx * -sinA + 1) / 2) * 4)))].push(quad);
  });
  const shape = flat(x0, z0, x1, z1, r);
  return [
    `<clipPath id="${id}"><path transform="${frontPlane(y)}" d="${shape}"/></clipPath>`,
    `<g clip-path="url(#${id})">`,
    `<path class="iso-top" d="${tops.join("")}"/>`,
    ...sides.map((d, shade) => (d.length ? `<path class="iso-shade" data-shade="${shade}" d="${d.join("")}"/>` : "")),
    `<g transform="${frontPlane(y - deep)}"><path class="${backClass}" d="${shape}"/>${back}<path class="iso-line" data-tone="faint" d="${shape}"/></g>`,
    inside,
    `</g>`,
    `<g transform="${frontPlane(y)}"><path class="iso-line" data-tone="lo" d="${shape}"/></g>`,
  ].join("");
}

// A knob on a vertical face at y: a short turned part along +y.
function faceKnob(x, y, z, r, len, tone = "mid") {
  const F = G.frameAlong([x, y, z], [0, 1, 0]);
  const body = G.solidOf([[0, r], [len * 0.55, r], [len * 0.55, r * 0.82], [len, r * 0.82]], F, P);
  rec(A.solid(F, [[0, r], [len * 0.55, r], [len * 0.55, r * 0.82], [len, r * 0.82]], { name: "crt.knob" }));
  const ribs = G.ribsOf(F, 0, len * 0.55, r, 18, P, { fade: [0.1, 0.55] });
  return S(body, { tone, inner: k.fadedSvg(ribs, { tone: "lo" }) }) + L(G.arcOf(F, len, r * 0.45, P, { least: -1 }), { tone: "hi" });
}

// ------------------------------------------------------------------ desk
function desk() {
  owner = "desk";
  const out = [];
  const LEG = 12;
  const legPlans = byDepth(k.corners(DESK, 16)).map(([x, y]) => ({ x: x - LEG / 2, y: y - LEG / 2, w: LEG, d: LEG, r: 1.5 }));
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(DESK, 8), FLOOR, 6, P)}"/>`);
  // Stretchers run between the legs along x, near the floor; the back one first.
  const stretch = (y) => ({ x: DESK.x + 22, y: y - 3, w: DESK.w - 44, d: 6, r: 1 });
  const legsBack = legPlans.filter((p) => p.y < 0);
  const legsFront = legPlans.filter((p) => p.y >= 0);
  const leg = (p) => {
    const foot = { x: p.x - 1.5, y: p.y - 1.5, w: p.w + 3, d: p.d + 3, r: 2 };
    rs(foot, FLOOR, 4, "stand.foot", { ground: true });
    rs(p, FLOOR + 4, LEG_H - 4, "desk.leg");
    return S(slab(foot, FLOOR, 4, 3), { tone: "lo" }) + S(slab(p, FLOOR + 4, LEG_H - 4, 3, 0.6), { tone: "lo", inner: seamOn(p, FLOOR + 14) });
  };
  for (const p of legsBack) out.push(leg(p));
  const back = stretch(DESK.y + 16);
  rs(back, FLOOR + 14, 7, "desk.stretcher");
  out.push(S(slab(back, FLOOR + 14, 7, 3, 0.5), { tone: "lo" }));
  // Side rails along y join the back and front legs.
  for (const x of [DESK.x + 16, DESK.x + DESK.w - 16]) {
    const rail = { x: x - 3, y: DESK.y + 22, w: 6, d: DESK.d - 44, r: 1 };
    rs(rail, FLOOR + 14, 7, "desk.rail");
    out.push(S(slab(rail, FLOOR + 14, 7, 3, 0.5), { tone: "lo" }));
  }
  const front = stretch(DESK.y + DESK.d - 16);
  rs(front, FLOOR + 14, 7, "desk.stretcher");
  out.push(S(slab(front, FLOOR + 14, 7, 3, 0.5), { tone: "lo" }));
  for (const p of legsFront) out.push(leg(p));
  // Apron under the top, set back from the edge.
  const apron = k.insetPlan(DESK, 22);
  rs(apron, -DESK_H - 10, 10, "desk.apron");
  out.push(S(slab(apron, -DESK_H - 10, 10, 4), { tone: "lo" }));
  // Apron label plate on the front face of the apron.
  const ay = apron.y + apron.d;
  const lp = { x0: -40, x1: 40, z0: -DESK_H - 8, z1: -DESK_H - 2 };
  out.push(`<g transform="${frontPlane(ay)}">${L(flat(lp.x0, lp.z0, lp.x1, lp.z1, 1, 3), { tone: "lo" })}${L(`M${lp.x0 + 5} ${-(lp.z0 + 3)}H${lp.x0 + 44}`, { tone: "faint", free: true })}</g>`);
  out.push(D([at([lp.x0 + 2, ay, lp.z0 + 3]), at([lp.x1 - 2, ay, lp.z0 + 3])], { size: 0.45 }));
  // The top.
  rs(DESK, -DESK_H, DESK_H, "desk.top");
  const top = slab(DESK, -DESK_H, DESK_H, 6, 1.4);
  out.push(S(top, { tone: "mid", inner: L(k.sideSeam(DESK, -4, P, 6), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(DESK, 6), 0, P, 4), { tone: "lo" }));
  // Mat: a thin work mat under the phone and nameplate, with a grid.
  const MAT = { x: -176, y: 8, w: 222, d: 84, r: 3 };
  // An inlaid work mat: flush with the top, so it is drawn on the face, not stacked on it.
  out.push(`<path class="wb-mat" d="${k.onTop(k.roundedPlan(MAT, 3), 0, P, true)}"/>`);
  out.push(L(k.planOutline(MAT, 0, P, 3), { tone: "lo" }));
  const grid = [];
  for (let x = MAT.x + 12; x < MAT.x + MAT.w - 4; x += 12) grid.push(k.lineOnTop([x, MAT.y], [x, MAT.y + MAT.d], 0, P));
  for (let y = MAT.y + 12; y < MAT.y + MAT.d - 4; y += 12) grid.push(k.lineOnTop([MAT.x, y], [MAT.x + MAT.w, y], 0, P));
  out.push(L(grid.join(""), { tone: "faint" }));
  // Ruler strip along the front edge, ticks hanging from its back edge.
  const strip = { x: 60, y: DESK.y + DESK.d - 12, w: 116, d: 7, r: 1 };
  rs(strip, 0, 0.6, "desk.ruler");
  out.push(S(slab(strip, 0, 0.6, 3), { tone: "lo", crease: "none" }));
  const t = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 4, 5, strip.y, 0.6, [2, 3.6], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  // Corner screws.
  const screws = k.corners(DESK, 7);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 14)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  return out.join("");
}

// ------------------------------------------------------------------ CRT monitor + cartridge rack (projects)
function crt() {
  owner = "projects";
  const out = [halo(CRT, 0, 10)];
  // Swivel stand.
  rs(STAND, 0, 3, "crt.stand");
  out.push(S(slab(STAND, 0, 3, 5, 0.6), { tone: "lo" }));
  const sx = STAND.x + STAND.w / 2;
  const sy = STAND.y + STAND.d / 2;
  rc(sx, sy, 15, 3, 4, "crt.swivel");
  out.push(S(cyl(sx, sy, 15, 3, 4, 40), { tone: "mid", inner: L(k.sideArc(sx, sy, 15, 5, P, 30), { tone: "faint" }) }));
  rc(sx, sy, 10, 7, CRT_Z0 - 7, "crt.neck");
  out.push(S(cyl(sx, sy, 10, 7, CRT_Z0 - 7, 32), { tone: "lo" }));
  // Rear hood, slightly lower, with vents on top.
  rs(HOOD, CRT_Z0 + 6, CRT_TOP - CRT_Z0 - 14, "crt.hood");
  out.push(S(slab(HOOD, CRT_Z0 + 6, CRT_TOP - CRT_Z0 - 14, 6, 0.8), { tone: "mid" }));
  const hoodTop = CRT_TOP - 8;
  const vents = [];
  for (let x = HOOD.x + 12; x <= HOOD.x + HOOD.w - 14; x += 4.4) vents.push(k.planOutline({ x, y: HOOD.y + 7, w: 1.6, d: 16, r: 0.8 }, hoodTop, P, 3));
  out.push(L(vents.join(""), { tone: "faint" }));
  // Front case.
  rs(CRT, CRT_Z0, CRT_TOP - CRT_Z0, "crt.case");
  const casePaths = slab(CRT, CRT_Z0, CRT_TOP - CRT_Z0, 6, 1.2);
  out.push(S(casePaths, { tone: "mid", inner: L(k.sideSeam(CRT, CRT_Z0 + 6, P, 6), { tone: "faint" }) }));
  // Front-face trim line and the badge strip.
  out.push(`<g transform="${frontPlane(CRT_FRONT)}">${L(flat(CRT.x + 4, CRT_Z0 + 3, CRT.x + CRT.w - 4, CRT_TOP - 4, 5), { tone: "faint" })}</g>`);
  // Side vents on the +x face.
  const side = CRT.x + CRT.w;
  const slots = [];
  for (let y = CRT.y + 10; y <= CRT.y + 30; y += 3.4) slots.push(k.pathOf(k.roundedPlan({ x: y - 0.8, y: CRT_TOP - 40, w: 1.6, d: 26, r: 0.8 }, 3).map(([u, z]) => at([side, u, z])), true));
  out.push(L(slots.join(""), { tone: "faint" }));
  // Screen: bezel recess, glass recess, picture drawn in the glass plane.
  out.push(screen());
  // Controls under the screen: two knobs, a power rocker, an LED.
  const cz = CRT_Z0 + 10;
  out.push(faceKnob(CRT.x + CRT.w - 34, CRT_FRONT, cz, 3.2, 3.6));
  out.push(faceKnob(CRT.x + CRT.w - 23, CRT_FRONT, cz, 3.2, 3.6));
  const rocker = { x: CRT.x + 12, y: CRT_FRONT, w: 9, d: 1.4, r: 0.6 };
  rs(rocker, cz - 2.6, 5.2, "crt.rocker");
  out.push(S(slab(rocker, cz - 2.6, 5.2, 2), { tone: "mid" }));
  out.push(`<g data-part="crt-led">${D([at([CRT.x + 27, CRT_FRONT, cz])], { size: 0.9, tone: "hi" })}</g>`);
  out.push(`<g transform="${frontPlane(CRT_FRONT)}">${L(Array.from({ length: 6 }, (_, i) => flat(CRT.x + 36 + i * 3, cz - 3, CRT.x + 37.4 + i * 3, cz + 3, 0.7, 3)).join(""), { tone: "lo" })}</g>`);
  return out.join("");
}

function screen() {
  const lines = [];
  for (let z = GLASS.z0 + 1.2; z < GLASS.z1; z += 1.6) lines.push(`M${GLASS.x0} ${(-z).toFixed(1)}H${GLASS.x1}`);
  const glow = flat(GLASS.x0 + 6, GLASS.z0 + 6, GLASS.x1 - 6, GLASS.z1 - 6, 18, 10);
  const tx = GLASS.x0 + 6;
  const top = GLASS.z1 - 10;
  const picture = [
    `<path class="wb-glow" d="${glow}"/>`,
    `<path class="wb-scan" d="${lines.join("")}"/>`,
    `<text class="wb-crt-text" data-part="crt-head" x="${tx}" y="${-top}" font-size="4.4">${esc(SCREENS[0][0])}</text>`,
    `<text class="wb-crt-text wb-crt-title" data-part="crt-title-0" x="${tx}" y="${-(top - 9)}" font-size="6">${esc(SCREENS[0][1])}</text>`,
    `<text class="wb-crt-text wb-crt-title" data-part="crt-title-1" x="${tx}" y="${-(top - 16.5)}" font-size="6">${esc(SCREENS[0][2])}</text>`,
    `<text class="wb-crt-text" data-part="crt-meta" x="${tx}" y="${-(top - 25)}" font-size="4.4">${esc(SCREENS[0][3])}</text>`,
    `<text class="wb-crt-text" x="${tx}" y="${-(GLASS.z0 + 6)}" font-size="4.6">&gt;</text>`,
    `<rect class="wb-cursor" x="${tx + 4.2}" y="${-(GLASS.z0 + 9.6)}" width="2.6" height="4.4"/>`,
  ].join("");
  const back = `<g data-part="crt-picture">${picture}</g>`;
  return recess(BEZEL, CRT_FRONT, "", "wb-bezel", recess(GLASS, CRT_FRONT - BEZEL.depth, back, "wb-glass"));
}

// Cartridge rack: one cartridge per project, the shown one lifts.
const CARTS = projects.map((_, i) => ({ x: RACK.x + 4 + i * (CART.w + CART.gap), y: RACK.y + (RACK.d - CART.d) / 2, w: CART.w, d: CART.d, r: 0.8 }));
const CART_LIFT = 12;
function rack() {
  owner = "projects";
  const out = [halo(RACK, 0, 6)];
  rs(RACK, 0, 5, "crt.rack");
  out.push(S(slab(RACK, 0, 5, 3, 0.6), { tone: "lo" }));
  // Side cheeks.
  const cheek = (x) => ({ x, y: RACK.y + 2, w: 1.6, d: RACK.d - 4, r: 0.5 });
  const left = cheek(RACK.x + 1);
  const right = cheek(RACK.x + RACK.w - 2.6);
  rs(left, 5, 12, "crt.rack.cheek");
  out.push(S(slab(left, 5, 12, 2), { tone: "mid" }));
  CARTS.forEach((plan, i) => {
    rs(plan, 5, CART.h, `crt.cart#${i}`);
    const label = { y0: plan.y + 5, y1: plan.y + plan.d - 5, z0: 5 + 9, z1: 5 + CART.h - 4 };
    const face = plan.x + plan.w;
    const labelPath = k.pathOf(k.roundedPlan({ x: label.y0, y: label.z0, w: label.y1 - label.y0, d: label.z1 - label.z0, r: 1 }, 3).map(([u, z]) => at([face, u, z])), true);
    const rule = (z, len) => k.pathOf([at([face, label.y1 - 3, z]), at([face, label.y1 - 3 - len, z])]);
    const grip = [];
    for (let z = 5 + 2.5; z < 5 + 8; z += 1.8) grip.push(k.sideSeam(plan, z, P, 2));
    out.push(
      `<g data-part="cart-${i}">` +
        S(slab(plan, 5, CART.h, 2, 0.4), { tone: "mid", inner: L(grip.join(""), { tone: "faint" }) }) +
        L(labelPath, { tone: "lo" }) +
        L(rule(label.z1 - 4, 16) + rule(label.z1 - 7, 10), { tone: "lo", free: true }) +
        `<g class="wb-cart-led">${D([at([face, label.y0 + 3, label.z1 - 4])], { size: 0.8, tone: "hi" })}</g>` +
        `</g>`,
    );
  });
  rs(right, 5, 12, "crt.rack.cheek");
  out.push(S(slab(right, 5, 12, 2), { tone: "mid" }));
  out.push(D([at([RACK.x + 2, RACK.y + RACK.d - 2, 5]), at([RACK.x + RACK.w - 2, RACK.y + RACK.d - 2, 5])], { size: 0.45 }));
  return out.join("");
}

// ------------------------------------------------------------------ drawer cabinet (stack)
const DRAWERS = (() => {
  const n = stack.length;
  const z0 = CAB_Z0 + 6;
  const z1 = CAB_TOP - 6;
  const h = (z1 - z0) / n;
  return stack.map((group, i) => ({ id: group.id, z0: z1 - (i + 1) * h + 1.2, z1: z1 - i * h - 1.2, x0: CAB.x + 6, x1: CAB.x + CAB.w - 6 }));
})();
function cabinet() {
  owner = "stack";
  const out = [halo(CAB, 0, 8)];
  const plinth = k.insetPlan(CAB, 3);
  rs(plinth, 0, CAB_Z0, "cab.plinth");
  out.push(S(slab(plinth, 0, CAB_Z0, 3), { tone: "lo" }));
  rs(CAB, CAB_Z0, CAB_TOP - CAB_Z0, "cab.body");
  out.push(S(slab(CAB, CAB_Z0, CAB_TOP - CAB_Z0, 3, 1), { tone: "mid", inner: L(k.sideSeam(CAB, CAB_TOP - 3, P, 3), { tone: "faint" }) }));
  // Side panel: screw dots and a stamped rib on the +x face.
  const sx = CAB.x + CAB.w;
  out.push(L(k.pathOf(k.roundedPlan({ x: CAB.y + 8, y: CAB_Z0 + 10, w: CAB.d - 16, d: CAB_TOP - CAB_Z0 - 22, r: 3 }, 4).map(([u, z]) => at([sx, u, z])), true), { tone: "faint" }));
  out.push(D([[CAB.y + 4, CAB_Z0 + 5], [CAB.y + CAB.d - 4, CAB_Z0 + 5], [CAB.y + 4, CAB_TOP - 5], [CAB.y + CAB.d - 4, CAB_TOP - 5]].map(([y, z]) => at([sx, y, z])), { size: 0.45 }));
  // Top handle bar on two posts.
  const hy = CAB.y + CAB.d / 2;
  const post = (x) => ({ x: x - 2, y: hy - 2, w: 4, d: 4, r: 1 });
  rs(post(CAB.x + 26), CAB_TOP, 6, "cab.post");
  rs(post(CAB.x + CAB.w - 26), CAB_TOP, 6, "cab.post");
  out.push(S(slab(post(CAB.x + 26), CAB_TOP, 6, 2), { tone: "mid" }));
  out.push(S(slab(post(CAB.x + CAB.w - 26), CAB_TOP, 6, 2), { tone: "mid" }));
  const bar = { x: CAB.x + 22, y: hy - 2.5, w: CAB.w - 44, d: 5, r: 2.4 };
  rs(bar, CAB_TOP + 6, 3, "cab.handle");
  out.push(S(slab(bar, CAB_TOP + 6, 3, 4, 0.4), { tone: "mid" }));
  // Drawers, bottom first so an upper drawer pulled out paints over the lower ones.
  const order = DRAWERS.map((d, i) => i).reverse();
  for (const i of order) out.push(drawer(DRAWERS[i], i));
  return out.join("");
}

function drawer({ x0, x1, z0, z1 }, i) {
  const FY = CAB_FRONT;
  const deep = CAB.d - 8;
  const id = clipId("drawer");
  // Static clip: the opening swept out to full travel.
  const corners = [
    [x0, FY, z0], [x1, FY, z0], [x1, FY, z1], [x0, FY, z1],
    [x0, FY + DRAWER_OUT + 2, z0], [x1, FY + DRAWER_OUT + 2, z0], [x1, FY + DRAWER_OUT + 2, z1 + 2], [x0, FY + DRAWER_OUT + 2, z1 + 2],
  ].map(at);
  const hull = k.pathOf(hullOf(corners), true);
  // Opening well (dark) drawn first, static.
  const well = `<g transform="${frontPlane(FY)}"><path class="wb-well" d="${flat(x0, z0, x1, z1, 1, 2)}"/></g>`;
  // The drawer box, built closed; its front sits 1.2 proud of the cabinet face.
  const box = [];
  const floor = { x: x0 + 1, y: FY - deep, w: x1 - x0 - 2, d: deep, r: 0.6 };
  const wallH = z1 - z0 - 3;
  box.push(S(slab(floor, z0 + 0.6, 1, 2), { tone: "lo", crease: "none" }));
  // Parts engraved in the tray: one pocket per item in this group.
  const items = stack[i].items.length;
  const pockets = [];
  const pw = (floor.w - 4) / items;
  for (let p = 0; p < items; p++) pockets.push(k.planOutline({ x: floor.x + 2 + p * pw + 0.6, y: FY - 16, w: pw - 1.2, d: 13, r: 1 }, z0 + 1.6, P, 2));
  box.push(L(pockets.join(""), { tone: "faint" }));
  const parts = [];
  for (let p = 0; p < items; p++) parts.push(at([floor.x + 2 + p * pw + pw / 2, FY - 9.5, z0 + 1.6]));
  box.push(D(parts, { size: 1.1, tone: "mid" }));
  const sideL = { x: x0 + 1, y: FY - deep, w: 1.2, d: deep, r: 0.3 };
  const sideR = { x: x1 - 2.2, y: FY - deep, w: 1.2, d: deep, r: 0.3 };
  box.unshift(S(slab(sideL, z0 + 0.6, wallH, 2), { tone: "lo" }));
  box.push(S(slab(sideR, z0 + 0.6, wallH, 2), { tone: "lo" }));
  const front = { x: x0 - 0.8, y: FY - 0.4, w: x1 - x0 + 1.6, d: 2, r: 0.8 };
  rs(front, z0 - 0.6, z1 - z0 + 1.2, `cab.drawer#${i}`);
  const frontSvg = S(slab(front, z0 - 0.6, z1 - z0 + 1.2, 2, 0.5), { tone: "mid" });
  // Label holder and pull on the drawer face.
  const fy = front.y + front.d;
  const mx = (x0 + x1) / 2;
  const zc = (z0 + z1) / 2;
  const holder = flat(mx - 13, zc + 0.6, mx + 13, z1 - 2.6, 0.8, 2);
  const card = flat(mx - 11, zc + 1.6, mx + 11, z1 - 3.6, 0.5, 2);
  const faceMarks = `<g transform="${frontPlane(fy)}">${L(holder, { tone: "lo" })}<path class="wb-label" d="${card}"/>${L(card, { tone: "faint" })}${L(`M${mx - 8} ${-(z1 - 6.4)}H${mx + 2 + (i % 2) * 4}`, { tone: "lo", free: true })}</g>`;
  const pull = { x: mx - 9, y: fy, w: 18, d: 2.6, r: 1.2 };
  const pz = zc - 4.4;
  const pullSvg = S(slab({ x: mx - 8, y: fy, w: 2, d: 1.6, r: 0.4 }, pz, 2.4, 2), { tone: "mid" }) + S(slab({ x: mx + 6, y: fy, w: 2, d: 1.6, r: 0.4 }, pz, 2.4, 2), { tone: "mid" }) + S(slab({ ...pull, y: fy + 1.6, d: 1.6 }, pz - 0.2, 2.8, 2, 0.3), { tone: "hi" });
  const rivets = D([at([x0 + 2.4, fy, zc]), at([x1 - 2.4, fy, zc])], { size: 0.45 });
  return `${well}<g clip-path="url(#${id})"><clipPath id="${id}"><path d="${hull}"/></clipPath><g data-part="drawer-${i}">${box.join("")}${frontSvg}${faceMarks}${pullSvg}${rivets}</g></g>`;
}

function hullOf(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

// ------------------------------------------------------------------ card file (experience)
const CARD_LIFT = 12;
const CARDS = experience.map((_, i, all) => {
  const span = BOX.d - 2 * WALL - 14;
  const y = BOX.y + WALL + 8 + (span * i) / Math.max(1, all.length - 1);
  return { y, tab: i };
});
function cardFile() {
  owner = "experience";
  const out = [halo(BOX, 0, 6)];
  const inner = { x0: BOX.x + WALL, x1: BOX.x + BOX.w - WALL };
  const floor = BOX;
  rs(floor, 0, 2, "log.floor");
  out.push(S(slab(floor, 0, 2, 3), { tone: "lo" }));
  const backWall = { x: BOX.x, y: BOX.y, w: BOX.w, d: WALL, r: 0.8 };
  const leftWall = { x: BOX.x, y: BOX.y + WALL, w: WALL, d: BOX.d - 2 * WALL, r: 0.6 };
  const rightWall = { x: BOX.x + BOX.w - WALL, y: BOX.y + WALL, w: WALL, d: BOX.d - 2 * WALL, r: 0.6 };
  const frontWall = { x: BOX.x, y: BOX.y + BOX.d - WALL, w: BOX.w, d: WALL, r: 0.8 };
  // Lid, open and leaning back against the back wall's hinge: drawn as a thin slab standing behind.
  const lid = { x: BOX.x, y: BOX.y - 3, w: BOX.w, d: 3, r: 1 };
  rs(lid, 0, BOX_H + 10, "log.lid");
  out.push(S(slab(lid, 0, BOX_H + 10, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(lid, BOX_H + 10, P, 3), { tone: "faint" }) }));
  out.push(`<g transform="${frontPlane(lid.y + lid.d)}">${L(flat(BOX.x + 8, BOX_H + 1, BOX.x + BOX.w - 8, BOX_H + 7, 1, 2), { tone: "faint" })}</g>`);
  for (const wall of [backWall, leftWall]) {
    rs(wall, 2, BOX_H - 2, "log.wall");
    out.push(S(slab(wall, 2, BOX_H - 2, 2, 0.4), { tone: "mid" }));
  }
  // Cards, back to front; each is a tabbed index card standing across x.
  const cw = inner.x1 - inner.x0 - 3;
  const tabW = cw / experience.length;
  CARDS.forEach(({ y, tab }, i) => {
    const card = { x: inner.x0 + 1.5, y, w: cw, d: 0.8, r: 0.2 };
    const ch = BOX_H - 4;
    const tabPlan = { x: card.x + tab * tabW + 2, y, w: tabW - 4, d: 0.8, r: 0.2 };
    rs(card, 2, ch + 1, `log.card#${i}`);
    const face = y + 0.8;
    const rules = [];
    for (let r = 0; r < 3; r++) rules.push(`M${card.x + 4} ${-(3 + ch - 6 - r * 3.2)}H${card.x + 4 + [30, 22, 26][r]}`);
    out.push(
      `<g data-part="card-${i}">` +
        S(slab(card, 3, ch, 1), { tone: "hi", crease: "lo" }) +
        S(slab(tabPlan, 3 + ch, 5, 1), { tone: "hi", crease: "lo" }) +
        `<g transform="${frontPlane(face)}">${L(rules.join(""), { tone: "faint", free: true })}${L(`M${tabPlan.x + 2} ${-(3 + ch + 2.6)}H${tabPlan.x + tabPlan.w - 4}`, { tone: "lo", free: true })}</g>` +
        `</g>`,
    );
  });
  for (const wall of [rightWall, frontWall]) {
    rs(wall, 2, BOX_H - 2, "log.wall");
    out.push(S(slab(wall, 2, BOX_H - 2, 2, 0.4), { tone: "mid" }));
  }
  // Front: brass label frame and a finger pull.
  const fy = frontWall.y + frontWall.d;
  const mx = BOX.x + BOX.w / 2;
  out.push(`<g transform="${frontPlane(fy)}">${L(flat(mx - 12, 9, mx + 12, 17, 0.8, 2), { tone: "lo" })}${L(`M${mx - 8} -14.2H${mx + 4}`, { tone: "lo", free: true })}</g>`);
  out.push(D([at([mx - 14.4, fy, 13]), at([mx + 14.4, fy, 13])], { size: 0.45 }));
  const pull = { x: mx - 6, y: fy, w: 12, d: 1.6, r: 0.8 };
  rs(pull, 4, 2.6, "log.pull");
  out.push(S(slab(pull, 4, 2.6, 2, 0.3), { tone: "hi" }));
  return out.join("");
}

// ------------------------------------------------------------------ telephone (contact)
const HOLES = 10;
const HOLE_R = 2.1;
const HOLE_RING = DIAL.r - 4.2;
const DIAL_Z = 23;
function phone() {
  owner = "contact";
  const out = [halo(PHONE, 0, 8)];
  const base = PHONE;
  rs(base, 0, 7, "phone.base");
  out.push(S(slab(base, 0, 7, 8, 0.8), { tone: "mid", inner: L(k.sideSeam(base, 2.4, P, 8), { tone: "faint" }) }));
  const body = k.insetPlan(base, 4);
  rs(body, 7, 10, "phone.body");
  out.push(S(slab(body, 7, 10, 8, 0.8), { tone: "mid" }));
  const crown = { x: body.x + 4, y: body.y + 3, w: body.w - 8, d: body.d - 6, r: 6 };
  rs(crown, 17, 4, "phone.crown");
  out.push(S(slab(crown, 17, 4, 8, 0.6), { tone: "mid" }));
  // Cradle forks at the back, then the handset across them.
  const fy = crown.y + 9;
  const forks = [crown.x + 7, crown.x + crown.w - 11].map((x) => ({ x, y: fy - 3, w: 4, d: 6, r: 1 }));
  for (const f of forks) {
    rs(f, 21, 6, "phone.fork");
    out.push(S(slab(f, 21, 6, 2, 0.3), { tone: "lo" }));
  }
  // Dial: plate, numbered ring (ticks), finger wheel (rebuilt live), stop, centre cap.
  rc(DIAL.cx, DIAL.cy, DIAL.r + 2, 21, 1.2, "phone.dial.plate");
  out.push(S(cyl(DIAL.cx, DIAL.cy, DIAL.r + 2, 21, 1.2, 48), { tone: "lo" }));
  const ticks = k.radialTicks(DIAL.cx, DIAL.cy, DIAL.r + 1.6, 40, 4, 22.2, [0.8, 1.6], P);
  out.push(L(ticks.minor, { tone: "faint" }), L(ticks.major, { tone: "lo" }));
  rc(DIAL.cx, DIAL.cy, DIAL.r, 22.2, 1.6, "phone.dial.wheel");
  out.push(`<g data-part="dial-wheel">${S(cyl(DIAL.cx, DIAL.cy, DIAL.r, 22.2, 1.6, 48, 0.4), { tone: "hi", crease: "lo" })}</g>`);
  out.push(`<path class="iso-line" data-tone="mid" data-part="dial-holes" d="${dialHoles(0)}"/>`);
  rc(DIAL.cx, DIAL.cy, 4.6, DIAL_Z + 0.8, 1.2, "phone.dial.cap");
  out.push(S(cyl(DIAL.cx, DIAL.cy, 4.6, DIAL_Z + 0.8, 1.2, 28, 0.3), { tone: "mid" }));
  out.push(L(k.ring(DIAL.cx, DIAL.cy, 2.6, DIAL_Z + 2, P, 20), { tone: "faint" }));
  // Finger stop at about 4 o'clock seen from above.
  const sa = (Math.PI * 2 * 0.36);
  const stopAt = [DIAL.cx + Math.sin(sa) * (DIAL.r + 0.8), DIAL.cy - Math.cos(sa) * (DIAL.r + 0.8)];
  const stop = { x: stopAt[0] - 1, y: stopAt[1] - 1, w: 2, d: 2, r: 0.6 };
  rs(stop, 22.2, 3.4, "phone.stop");
  out.push(S(slab(stop, 22.2, 3.4, 2), { tone: "hi" }));
  // Handset across the forks: two cups with a grip on top.
  const cupY = fy;
  const cups = [forks[0].x + 2, forks[1].x + 2];
  const grip = { x: cups[0] - 3, y: cupY - 4, w: cups[1] - cups[0] + 6, d: 8, r: 4 };
  out.push(`<g data-part="handset">`);
  for (const cx of cups) {
    rc(cx, cupY, 7.4, 27, 6, "phone.cup");
    out.push(S(cyl(cx, cupY, 7.4, 27, 6, 40, 0.5), { tone: "mid", inner: L(k.sideArc(cx, cupY, 7.4, 29, P, 30), { tone: "faint" }) }));
    out.push(L(k.ring(cx, cupY, 4.6, 33, P, 24), { tone: "faint" }));
  }
  rs(grip, 33, 4.4, "phone.grip");
  out.push(S(slab(grip, 33, 4.4, 8, 0.6), { tone: "mid" }));
  out.push(`</g>`);
  // Coiled cord: out of the base's left side, coils along y on the mat, back up into the handset end.
  const jack = { x: base.x - 1.4, y: base.y + base.d - 14, w: 1.6, d: 6, r: 0.6 };
  rs(jack, 2, 3.6, "phone.jack");
  out.push(S(slab(jack, 2, 3.6, 2), { tone: "lo" }));
  const coilY0 = base.y + base.d - 11;
  const cx0 = base.x - 6;
  const cord = (pts) => `<path class="iso-line wb-cord" data-tone="mid" d="${k.pathOf(pts.map(at))}"/>`;
  out.push(cord([[base.x - 1.4, coilY0, 3.8], [cx0 + 2.6, coilY0 + 0.6, 3.4], [cx0, coilY0 - 1.4, 3.2]]));
  const coilFrom = coilY0 - 3;
  const coilTo = base.y + 6;
  const spring = k.coil(coilTo, coilFrom, [cx0, 3.2], 2.6, 12, "y", P);
  out.unshift(L(spring.back, { tone: "lo" }));
  out.push(L(spring.front, { tone: "mid" }));
  return { back: out.shift(), body: out.join(""), cordTop: cord([[cx0, coilTo, 3.2], [cx0 + 0.4, coilTo - 4, 6], [cups[0] - 6.4, cupY - 1, 24], [cups[0] - 6.2, cupY, 28.6]]) };
}

function dialHoles(turn) {
  const rings = [];
  for (let h = 0; h < HOLES; h++) {
    const a = turn + (h / (HOLES + 2)) * Math.PI * 2 + Math.PI * 0.5;
    const x = DIAL.cx + Math.sin(a) * HOLE_RING;
    const y = DIAL.cy - Math.cos(a) * HOLE_RING;
    rings.push(k.ring(x, y, HOLE_R, DIAL_Z + 0.8, P, 14));
  }
  return rings.join("");
}

// ------------------------------------------------------------------ nameplate (about)
function nameplate() {
  owner = "about";
  const out = [halo(NAME, 0, 4)];
  rs(NAME, 0, 4.2, "name.base");
  out.push(S(slab(NAME, 0, 4.2, 4, 0.6), { tone: "lo", inner: L(k.sideSeam(NAME, 1.4, P, 4), { tone: "faint" }) }));
  // Slot lips either side of the plate.
  const lip = (y) => ({ x: NAME.x + 4, y, w: NAME.w - 8, d: 1.4, r: 0.5 });
  const backLip = lip(NAME_PLATE.y - 1.6);
  const frontLip = lip(NAME_PLATE.y + NAME_PLATE.t + 0.2);
  rs(backLip, 4.2, 2.2, "name.lip");
  out.push(S(slab(backLip, 4.2, 2.2, 2), { tone: "mid" }));
  const plate = { x: NAME_PLATE.x0, y: NAME_PLATE.y, w: NAME_PLATE.x1 - NAME_PLATE.x0, d: NAME_PLATE.t, r: 0.6 };
  rs(plate, NAME_PLATE.z0, NAME_PLATE.z1 - NAME_PLATE.z0, "name.plate");
  const face = plate.y + plate.d;
  const mx = (NAME_PLATE.x0 + NAME_PLATE.x1) / 2;
  const name = profile.name.toUpperCase();
  const textZ = NAME_PLATE.z0 + 9.4;
  out.push(
    `<g data-part="plate">` +
      S(slab(plate, NAME_PLATE.z0, NAME_PLATE.z1 - NAME_PLATE.z0, 2, 0.4), { tone: "hi", crease: "lo", className: "wb-plate" }) +
      `<g transform="${frontPlane(face)}">` +
      `<path class="wb-plate-glow" d="${flat(NAME_PLATE.x0 + 2, NAME_PLATE.z0 + 2.6, NAME_PLATE.x1 - 2, NAME_PLATE.z1 - 2, 1.2, 2)}"/>` +
      L(flat(NAME_PLATE.x0 + 2, NAME_PLATE.z0 + 2.6, NAME_PLATE.x1 - 2, NAME_PLATE.z1 - 2, 1.2, 2), { tone: "lo" }) +
      `<text class="iso-face-text wb-name" x="${mx}" y="${-textZ}" font-size="5" text-anchor="middle">${esc(name)}</text>` +
      `<text class="iso-face-text wb-role" x="${mx}" y="${-(NAME_PLATE.z0 + 4.9)}" font-size="2.3" text-anchor="middle">${esc(profile.role.toUpperCase())}</text>` +
      `</g>` +
      D([at([NAME_PLATE.x0 + 4.4, face, NAME_PLATE.z1 - 4.4]), at([NAME_PLATE.x1 - 4.4, face, NAME_PLATE.z1 - 4.4])], { size: 0.5 }) +
      `</g>`,
  );
  rs(frontLip, 4.2, 2.2, "name.lip");
  out.push(S(slab(frontLip, 4.2, 2.2, 2), { tone: "mid" }));
  // Status LED on the base, lit with the plate.
  out.push(`<g class="wb-name-led">${D([at([NAME.x + NAME.w - 5, NAME.y + NAME.d - 3, 4.2])], { size: 0.9, tone: "hi" })}</g>`);
  out.push(L(k.ring(NAME.x + NAME.w - 5, NAME.y + NAME.d - 3, 1.8, 4.2, P, 14), { tone: "lo" }));
  return out.join("");
}

function esc(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
// Screen text per project: [head, title line 1, title line 2, meta]. Lines fit the glass at 12 chars.
function wrap(text, width = 12) {
  const lines = [""];
  for (const word of text.toUpperCase().split(/\s+/)) {
    const last = lines[lines.length - 1];
    if (!last) lines[lines.length - 1] = word.slice(0, width);
    else if ((last + " " + word).length <= width) lines[lines.length - 1] = last + " " + word;
    else lines.push(word.slice(0, width));
  }
  return [lines[0] ?? "", lines.slice(1).join(" ").slice(0, width)];
}

// ------------------------------------------------------------------ assemble
const PHONE_ART = phone();
const OBJECTS = {
  projects: crt() + rack(),
  stack: cabinet(),
  experience: cardFile(),
  contact: PHONE_ART.body + PHONE_ART.cordTop,
  about: nameplate(),
};
// Painter's order of whole objects, far to near (by footprint centre).
const centres = {
  projects: [CRT.x + CRT.w / 2, CRT.y + CRT.d / 2, 0],
  stack: [CAB.x + CAB.w / 2, CAB.y + CAB.d / 2, 0],
  experience: [BOX.x + BOX.w / 2, BOX.y + BOX.d / 2, 0],
  contact: [PHONE.x + PHONE.w / 2, PHONE.y + PHONE.d / 2, 0],
  about: [NAME.x + NAME.w / 2, NAME.y + NAME.d / 2, 0],
};
const ORDER = Object.keys(OBJECTS).sort((a, b) => depth(centres[a]) - depth(centres[b]));
const DESK_ART = desk() + PHONE_ART.back;

// Motion vectors in screen units per world unit.
const MOVES = {
  drawer: k.axisVector(P, [0, 1, 0]),
  lift: k.axisVector(P, [0, 0, 1]),
};

const LABEL = `A retro 1980s workstation desk seen from above at an angle: a CRT monitor with a rack of ${projects.length} program cartridges, a ${stack.length}-drawer parts cabinet, an index-card file of ${experience.length} cards, a rotary desk telephone and a backlit nameplate. Each object opens one section of the portfolio.`;

// ------------------------------------------------------------------ audit
// Items in the real paint order (desk, then whole objects back to front); the audit checks that order.
["desk", ...ORDER].forEach((id, index) => {
  R.put({ name: id, at: [0, 0, 0], key: index, svg: id === "desk" ? DESK_ART : OBJECTS[id], shapes: SHAPES[id] ?? [] });
});
{
  const items = R.items;
  const overlaps = A.overlapsOf(items, P, { states: [0] });
  R.settled = { items, overlaps, solved: { keys: items.map((item) => item.key), rules: 0, dropped: [], cycles: [] }, states: [0] };
}
A.auditOrExit(R, P, { cover: ["desk"] });

// ------------------------------------------------------------------ outputs
const generated = `// GENERATED by tools/anatomy/workbench.build.mjs — do not edit by hand.
// Re-run: node tools/anatomy/workbench.build.mjs
export const VIEW = ${JSON.stringify({ width: WIDTH, height: HEIGHT })} as const;
export const PROJECTION = ${JSON.stringify(P)};
export const MOVES = ${JSON.stringify(MOVES)} as { drawer: [number, number]; lift: [number, number] };
export const TRAVEL = ${JSON.stringify({ drawer: DRAWER_OUT, cart: CART_LIFT, card: CARD_LIFT })} as const;
export const DIAL = ${JSON.stringify({ ...DIAL, holes: HOLES, holeR: HOLE_R, ring: HOLE_RING, z: DIAL_Z })} as const;
export const COUNTS = ${JSON.stringify({ projects: projects.length, stack: stack.length, experience: experience.length })} as const;
export const SCREENS = ${JSON.stringify(SCREENS)} as const;
export const LABEL = ${JSON.stringify(LABEL)};
export const ORDER = ${JSON.stringify(ORDER)} as const;
export const DESK = ${JSON.stringify(DESK_ART)};
export const OBJECTS: Record<string, string> = ${JSON.stringify(OBJECTS)};
`;
writeFileSync(join(ROOT, "src/figures/workbench/art.generated.ts"), generated);

// Standalone preview: same art and CSS, a tiny script that mimics hover so captures can show states.
const css = readFileSync(join(ROOT, "src/figures/workbench/workbench.css"), "utf8");
const objectsSvg = ORDER.map((id) => `<g class="wb-obj" data-obj="${id}" role="button" tabindex="0" aria-label="${id}">${OBJECTS[id]}</g>`).join("");
const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: LABEL, body: [DESK_ART, objectsSvg] });
const previewScript = `
const q = new URLSearchParams(location.search);
const hot = q.get("hot"), active = q.get("active"), open = q.get("open");
const M = ${JSON.stringify(MOVES)};
const T = ${JSON.stringify({ drawer: DRAWER_OUT, cart: CART_LIFT, card: CARD_LIFT })};
document.querySelectorAll(".wb-obj").forEach((g) => {
  if (g.dataset.obj === hot) g.setAttribute("data-hot", "");
  if (g.dataset.obj === active) g.setAttribute("data-active", "");
});
if (open) {
  document.querySelectorAll('[data-part^="drawer-"]').forEach((g, i) => { const s = T.drawer * (0.4 + 0.6 * (i === 1)); g.setAttribute("transform", "translate(" + M.drawer[0] * s + " " + M.drawer[1] * s + ")"); });
  document.querySelectorAll('[data-part^="card-"]').forEach((g, i) => { const s = T.card * (i === 1 ? 1 : 0.35); g.setAttribute("transform", "translate(" + M.lift[0] * s + " " + M.lift[1] * s + ")"); });
  document.querySelectorAll('[data-part^="cart-"]').forEach((g, i) => { if (i === 0) g.setAttribute("transform", "translate(" + M.lift[0] * T.cart + " " + M.lift[1] * T.cart + ")"); });
}
`;
mkdirSync(join(HERE, "out"), { recursive: true });
for (const theme of ["dark", "light"]) {
  const body =
    `<style>${css}</style><div class="iso wb-theme wb-plate" data-theme="${theme}">` +
    k.plateHtml({
      fig: "Fig 01",
      title: "Workbench",
      hint: "Pick an object",
      readout: "02 · Projects",
      keys: [],
      caption: "",
      body: `<div class="wb iso-stage">${svg}</div>`,
    }) +
    `</div>`;
  const name = theme === "light" ? "workbench-light.html" : "workbench.html";
  writeFileSync(join(HERE, "out", name), k.pageHtml({ title: "Workbench", theme, body, script: previewScript }));
}
console.log(`wrote art.generated.ts (${(generated.length / 1024).toFixed(0)} KB), preview pages; order ${ORDER.join(" → ")}`);
