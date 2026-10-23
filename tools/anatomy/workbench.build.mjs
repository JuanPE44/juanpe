// Builds the isometric Workbench figure (anatomy kit) into
//   src/figures/workbench/art.generated.ts   (path strings for the React figure)
//   public/workbench/art.json                (the same markup, fetched only if the page renders without server HTML)
//   tools/anatomy/out/workbench[-light].html (standalone preview for capture / lines checks)
// Run: node tools/anatomy/workbench.build.mjs [--audit]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";
import * as A from "./kit/audit.mjs";
import * as T from "./kit/tube.mjs";
import { experience } from "../../src/content/experience.ts";
import { profile } from "../../src/content/profile.ts";
import { projects } from "../../src/content/projects.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

// ------------------------------------------------------------------ world
const WIDTH = 640;
const HEIGHT = 480;

const DESK = { x: -190, y: -100, w: 380, d: 200, r: 6 };
const DESK_H = 3.6; // top thickness, top face at z = 0
const LEG_H = 100; // floor to the underside of the top: 72 cm at the scale of the things on the desk
const FLOOR = -DESK_H - LEG_H;
// Sit-stand travel: the top stands 103.6 units = 72 cm above the floor, about 1.44 units per cm of height.
const CM = (DESK_H + LEG_H) / 72;
const HEIGHT_CM = { min: 72, max: 120, start: 120, presets: [72, 108, 118], speed: 4.5 }; // speed in cm/s, as a dual-motor frame
const RISE = (HEIGHT_CM.max - HEIGHT_CM.min) * CM;
const FRAMED = 70; // how far down the legs the frame reaches; the feet run off the bottom of the figure

// Laptop (projects): a thin aluminium base with a recessed keyboard and a trackpad, the lid open on a hinge barrel.
const LS = 0.8; // the laptop is drawn larger than the desk's scale so it reads; this keeps it from dwarfing the chair
const LAP = { x: -56 * LS, y: 82 - 78 * LS, w: 112 * LS, d: 78 * LS, r: 4 }; // front edge kept at y = 82
const LAP_H = 4;
const HINGE = { y: LAP.y + 2.4, r: 1.3, inset: 10 * LS }; // a barrel along x lying on the base, at the back
const LID_TILT = (16 * Math.PI) / 180; // back from vertical
const LID_UP = [0, -Math.sin(LID_TILT), Math.cos(LID_TILT)];
const LID_N = [0, Math.cos(LID_TILT), Math.sin(LID_TILT)]; // the screen's normal, toward the viewer
const LID_H = 74 * LS;
const LID_T = 2.2;
// Lid frame: x along the base from LAP.x, v up the lid from the hinge axis, s along the normal (screen face at 0).
const LID_F = { o: [LAP.x, HINGE.y, LAP_H + HINGE.r], a: LID_N, u: [1, 0, 0], v: LID_UP };
const KEYS = { x: LAP.x + 9 * LS, y: LAP.y + 7 * LS, w: LAP.w - 18 * LS };
const U = KEYS.w / 15;
const KEY_ROWS = [
  Array(15).fill(1),
  [...Array(13).fill(1), 2],
  [1.5, ...Array(12).fill(1), 1.5],
  [1.75, ...Array(11).fill(1), 2.25],
  [2.25, ...Array(10).fill(1), 2.75],
  [1, 1, 1.25, 1.25, 5, 1.25, 1.25, 1, 1, 1],
];
const KEY_D = [0.6, 1, 1, 1, 1, 1]; // row depth in U: a half-height function row
const KEY_H = 0.5;
const TRACKPAD = { x: LAP.x + LAP.w / 2 - 27 * LS, y: LAP.y + 47 * LS, w: 54 * LS, d: 26 * LS, r: 2.4 };

// Notebook (experience): a hardcover notebook at the back of the desk, one divider tab per job on its fore edge (+x).
const NB = { x: 112, y: -88, w: 52, d: 64, r: 3 };
const NB_COVER = 1.1;
const NB_PAGES = 5;
const TAB = { w: 5, d: 9, t: 0.6 };

// Phone (contact) on a MagSafe stand: a rounded base, an arm leaning back, a puck holding the phone.
const PH = { cx: 76, y: 32, w: 26, h: 54, t: 2.8, r: 4.4 }; // y: the bottom of the front face
const PH_TILT = (18 * Math.PI) / 180;
const PH_UP = [0, -Math.sin(PH_TILT), Math.cos(PH_TILT)];
const PH_N = [0, Math.cos(PH_TILT), Math.sin(PH_TILT)];
const STAND_H = 3;
const STAND = { x: PH.cx - 15, y: PH.y - 14, w: 30, d: 19, r: 6 };
// The phone's lowest edge (the back of its bottom) rests on the base.
const PH_F = { o: [PH.cx, PH.y, STAND_H + PH.t * Math.sin(PH_TILT)], a: PH_N, u: [1, 0, 0], v: PH_UP };
const PUCK = { v: 26, r: 10, t: 3.2 };
const ARM = { w: 7, t: 2, top: 32 };

// Mate set (about), at hand right of the phone: a steel thermos taller than the laptop screen, printed with the name,
// and a gourd with yerba and a bombilla in front of it.
const TERMO = { cx: 146, cy: 62, r: 11.5, h: 74 };
const MATE = { cx: 122, cy: 82, r: 9, h: 15 };

// iPad (CV): lying flat on the mat with the CV open as a PDF, an Apple Pencil held by its magnet on the right long edge.
const PAD = { x: -122, y: 22, w: 42, d: 58, r: 3.4 };
const PAD_H = 1.6;
const PENCIL = { x: PAD.x + PAD.w + 1.15, y0: PAD.y + 9, len: 39, r: 1.15 };

// Three potted plants: a snake plant at the front left corner, a cactus at the back left corner and a low
// succulent rosette in a wide shallow pot between them, at the back.
const POTS = [
  { cx: -164, cy: 64, r: 11, h: 15, kind: "snake" },
  { cx: -158, cy: -60, r: 10, h: 13, kind: "cactus" },
  { cx: -112, cy: -40, r: 12.5, h: 9, kind: "succulent" },
];
const SAUCER_H = 2.2;

const ZOOM = 1.14; // past the fit, about the centre: the desk's far corners run off the plate so the objects read larger
const FIT = k.fitProjection(
  [...k.boxCorners(DESK, -FRAMED, 0), onFrame(LID_F, 0, LID_H, 0), onFrame(LID_F, LAP.w, LID_H, 0)],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 52, elevation: 34 },
);
const P = { ...FIT, scale: FIT.scale * ZOOM, origin: [WIDTH / 2 + (FIT.origin[0] - WIDTH / 2) * ZOOM, HEIGHT / 2 + (FIT.origin[1] - HEIGHT / 2) * ZOOM] };

const SCREENS = projects.map((project, i) => {
  const [a, b] = wrap(project.title, 20);
  return [`PROJECTS · ${String(i + 1).padStart(2, "0")}/${String(projects.length).padStart(2, "0")}`, a, b, `${project.year} · ${project.tags[0]}`.toUpperCase().slice(0, 28)];
});

// A point in a tilted frame { o, a, u, v }: x along u, v along v, s along a.
function onFrame(F, x, v, s = 0) {
  return [0, 1, 2].map((i) => F.o[i] + F.u[i] * x + F.v[i] * v + F.a[i] * s);
}

// ------------------------------------------------------------------ helpers
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const depth = (point) => k.depthOf(point, P);
const frontPlane = (y) => k.sideMatrix([0, y], 0, P, "left"); // local (x, -z) on the face at y
// An SVG matrix for any plane through o: local x along ex, local y along ey (world units).
function planeMatrix(o, ex, ey) {
  const p0 = at(o);
  const px = at(G.add3(o, ex));
  const py = at(G.add3(o, ey));
  const v = (x) => x.toFixed(4);
  return `matrix(${v(px[0] - p0[0])} ${v(px[1] - p0[1])} ${v(py[0] - p0[0])} ${v(py[1] - p0[1])} ${p0[0].toFixed(2)} ${p0[1].toFixed(2)})`;
}
// Screen mappers for flat art laid on a surface: local x right, y down, in figure units.
const planeMap = (o, ex, ey) => (x, y) => at(G.add3(o, G.add3(G.mul3(ex, x), G.mul3(ey, y))));
// Wraps around a vertical cylinder: x runs along the arc (positive toward `turn`), y runs down from z0.
const cylinderMap = (cx, cy, r, mid, turn, z0) => (x, y) => {
  const a = mid + (turn * x) / r;
  return at([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z0 - y]);
};
const flat = (x0, z0, x1, z1, r, steps = 6) =>
  k.pathOf(k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z]), true);
const slab = (plan, z, h, steps = 3, bevel = 0) => k.slabOf(plan, z, h, P, steps, bevel);
const cyl = (cx, cy, r, z, h, steps = 24, bevel = 0) => k.cylinder(cx, cy, r, z, h, P, steps, bevel);
// A soft ambient halo, plus a tight contact shadow on the footprint for things standing on the desk top,
// so they sit on it instead of hovering.
// Soft shadows without SVG filters: an ellipse lying in a plane, filled with a radial gradient (defined in
// Workbench.tsx) that fades to nothing at its rim. WebKit re-runs every blur filter on each repaint of the figure;
// a gradient fill costs about what a flat fill does. ex, ey are the semi-axes as world vectors.
// drop: a screen-space nudge down, so the shade shows in front of what casts it (as the kit's halo did).
const soft = (centre, ex, ey, cls, drop = 0) =>
  `<g transform="${drop ? `translate(0 ${drop}) ` : ""}${planeMatrix(centre, ex, ey)}"><circle class="${cls}" r="1"/></g>`;
const footSoft = (plan, z, grow, pad, cls, drop = 0) =>
  soft([plan.x + plan.w / 2, plan.y + plan.d / 2, z], [(plan.w / 2) * grow + pad, 0, 0], [0, (plan.d / 2) * grow + pad, 0], cls, drop);
const isRound = (plan) => plan.r >= Math.min(plan.w, plan.d) / 2 - 0.01;
// A tight contact shade on the footprint, so things on the top sit on it instead of hovering.
const contact = (plan) => footSoft(plan, 0, isRound(plan) ? 1.1 : 1.24, 0.8, "wb-soft-contact", 0.8);
// The ambient halo: wider than the footprint, more so for taller things.
const halo = (plan, z, h) => footSoft(plan, z, 1.2, 4 + h * 0.8, "wb-soft-halo", 3) + (z === 0 ? contact(plan) : "");
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

// A lifting group's attributes, drawn at the start height (same transform the figure applies at runtime).
function liftAt(f) {
  const by = -((HEIGHT_CM.start - HEIGHT_CM.min) * CM) * f;
  const [x, y] = k.axisVector(P, [0, 0, 1]);
  return by === 0 ? `data-lift="${f}"` : `data-lift="${f}" transform="translate(${(x * by).toFixed(2)} ${(y * by).toFixed(2)})"`;
}

let clips = 0;
const clipId = (base) => `wb-${base}-${clips++}`;

// ------------------------------------------------------------------ room
// The back wall the desk is pushed against (a skirting board along its foot) and a plank floor, both on the floor
// group (data-lift="1") so they stay put while the top moves. They fade into the plate through a radial mask.
const WALL_Y = DESK.y - 4 * CM; // 4 cm behind the top's back edge
const ROOM = {
  x0: -1400, x1: 1400, // along the wall, far past the frame either way
  depth: 900, // how far the floor runs toward the viewer
  height: 260 * CM,
  skirt: { h: 8 * CM, t: 1.4 },
  plank: { w: 14 * CM, l: 120 * CM },
};
function room() {
  const z = FLOOR;
  const poly = (points) => k.pathOf(points.map(at), true);
  const wall = poly([[ROOM.x0, WALL_Y, z], [ROOM.x1, WALL_Y, z], [ROOM.x1, WALL_Y, z + ROOM.height], [ROOM.x0, WALL_Y, z + ROOM.height]]);
  // Planks run along x; butt joints step a fraction of a plank length from one row to the next.
  const seams = [];
  const joints = [];
  const y0 = WALL_Y + ROOM.skirt.t;
  for (let row = 0, y = y0; y < y0 + ROOM.depth; row++, y += ROOM.plank.w) {
    if (row) seams.push(k.pathOf([at([ROOM.x0, y, z]), at([ROOM.x1, y, z])]));
    const shift = ((row * 0.38) % 1) * ROOM.plank.l;
    for (let x = ROOM.x0 + shift; x < ROOM.x1; x += ROOM.plank.l) joints.push(k.pathOf([at([x, y, z]), at([x, y + ROOM.plank.w, z])]));
  }
  const skirt = { x: ROOM.x0, y: WALL_Y, w: ROOM.x1 - ROOM.x0, d: ROOM.skirt.t, r: 0.2 };
  const [cx, cy] = at([0, 0, z + 40]);
  // The room fades into the plate through gradient paints on its own fills and strokes (no mask: WebKit renders a
  // masked group offscreen on every repaint). All three share one centre and radius.
  const fade = (gid, color) =>
    `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="560">` +
    `<stop offset="0.35" style="stop-color:var(${color})"/><stop offset="1" style="stop-color:var(${color});stop-opacity:0"/></radialGradient>`;
  const defs = fade("wb-room-wall", "--anatomy-shade-2") + fade("wb-room-line", "--anatomy-faint") + fade("wb-room-skirt", "--anatomy-lo");
  return (
    `<g ${liftAt(1)}><defs>${defs}</defs><g class="wb-room">` +
    `<path class="wb-wall" d="${wall}"/>` +
    L(seams.join(""), { tone: "faint", className: "wb-floor-line" }) +
    L(joints.join(""), { tone: "faint", className: "wb-floor-joint" }) +
    S(slab(skirt, z, ROOM.skirt.h, 1), { tone: "lo", className: "wb-skirt" }) +
    `</g>${decorFrames()}</g>`
  );
}

// Picture frames on the wall above the desk: a moulding standing off the wall, mitred at the corners, a white mat and a
// picture in the art window. They hang on the floor group (data-lift="1"), so they stay put while the top moves. The
// "about" frame is the About object; the others are decor in the desk art. Sizes and heights from the floor in cm.
const FRAME = { depth: 2.4, moulding: 4.2 };
// Each picture is a crop of its source (centre and width as fractions of the source), resized for the window.
// treatment "none" only crops (art already drawn in the site's style); "holo" bakes a real photo into the pastel
// tritone under a veil of holographic facets (HOLO_PRINT). Baked at build time, the browser draws a plain image (no SVG
// filter or blend mode, which crawl in WebKit); a sheen sweeps across it while its object is hovered or open.
const FRAMES = {
  about: { cx: 28, bottom: 136, w: 60, h: 42, mat: 6, picture: { source: "tools/anatomy/assets/about-illustration.png", centre: [0.5, 0.552], width: 1, treatment: "none", file: "public/workbench/about.webp" } },
  river: { cx: -54, bottom: 150, w: 40, h: 30, mat: 4.5, picture: { source: "tools/anatomy/assets/wall-river.png", centre: [0.5, 0.5], width: 1, treatment: "none", file: "public/workbench/wall-river.webp" } },
  // The source's bottom right corner is an unfinished photo patch, so the crop stays above and left of it.
  stream: { cx: 22, bottom: 198, w: 38, h: 28, mat: 4.5, picture: { source: "tools/anatomy/assets/wall-stream.jpg", centre: [0.4, 0.37], width: 0.66, treatment: "none", file: "public/workbench/wall-stream.webp" } },
};
const HOLO_PRINT = {
  veil: { cols: 12, rows: 7, seed: 5, light: 0.3, tint: 0.2 }, // soft-light strength, then a flat pastel tint
  tones: ["#3d2d86", "#a58cf0", "#fdfbff"], // shadows, mids, highlights
  lift: 1.15, // gamma on the grey before toning (< 1 opens the shadows, keeps it airy)
};
// px of each baked picture, about 2x its largest on-screen width: the About picture fills ~600 CSS px when it is
// open on a 1080p stage (~800 at 1440p), the decor frames beside it ~370.
const PICTURE_WIDTH = { about: 960, decor: 720 };
const frameWindow = (frame) => {
  const a = FRAME.moulding + frame.mat;
  return { w: frame.w * CM - 2 * a, h: frame.h * CM - 2 * a };
};
async function bakePicture(frame, pixels) {
  const pic = frame.picture;
  const { w, h } = frameWindow(frame);
  const source = await sharp(join(ROOT, pic.source)).metadata();
  const width = Math.round(pic.width * source.width);
  const height = Math.round(width / (w / h));
  const crop = { left: Math.round(pic.centre[0] * source.width - width / 2), top: Math.round(pic.centre[1] * source.height - height / 2), width, height };
  const size = { width: pixels, height: Math.round(pixels / (w / h)) };
  const base = () => sharp(join(ROOT, pic.source)).extract(crop).resize(size);
  mkdirSync(dirname(join(ROOT, pic.file)), { recursive: true });
  if (pic.treatment === "none") {
    await base().webp({ quality: 84 }).toFile(join(ROOT, pic.file));
    return;
  }
  const PHOTO = HOLO_PRINT;
  const { data, info } = await base().grayscale().normalise().raw().toBuffer({ resolveWithObject: true });
  const [lo, mid, hi] = HOLO_PRINT.tones.map((c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)));
  const mix = (p, q, t) => p.map((v, i) => Math.round(v + (q[i] - v) * t));
  const out = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0; i < info.width * info.height; i++) {
    const t = (data[i * info.channels] / 255) ** HOLO_PRINT.lift;
    out.set(t < 0.5 ? mix(lo, mid, t * 2) : mix(mid, hi, (t - 0.5) * 2), i * 3);
  }
  const veil = (opacity) => sharp(Buffer.from(holoVeil(info.width, info.height, opacity))).png().toBuffer();
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } })
    .composite([
      { input: await veil(HOLO_PRINT.veil.light), blend: "soft-light" },
      { input: await veil(HOLO_PRINT.veil.tint), blend: "over" },
    ])
    .webp({ quality: 80 })
    .toFile(join(ROOT, pic.file));
}
// Facet colours for baking, mirroring --holo-0..4, --holo-ink and the --dk shade mix in workbench.css.
const HOLO = { hues: ["#8fd3ff", "#f5a3d0", "#a78bfa", "#a8f0e6", "#ffd2b8"], ink: "#4b3d7a", dark: [0.22, 0.14, 0.07, 0] };
function holoVeil(width, height, opacity) {
  const rgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const ink = rgb(HOLO.ink);
  const fill = (hue, shade) => `rgb(${rgb(HOLO.hues[hue]).map((v, i) => Math.round(v + (ink[i] - v) * HOLO.dark[shade])).join(",")})`;
  const { cols, rows, seed } = HOLO_PRINT.veil;
  const tris = holoTris((u, v) => [u * width, v * height], cols, rows, seed).replace(
    /class="wb-facet" data-hue="(\d)" data-shade="(\d)"/g,
    (_, hue, shade) => `fill="${fill(+hue, +shade)}" stroke="#fff" stroke-opacity="0.6" stroke-width="1"`,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><g opacity="${opacity}">${tris}</g></svg>`;
}
const publicUrl = (path) => path.replace(/^public/, "");
// A glare band clipped to a rect, swept by .wb-sheen in workbench.css while its object is hovered or open.
function sheenOver(x, y, w, h) {
  const clip = clipId("glare");
  const grad = clipId("sheen");
  return (
    `<clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>` +
    `<linearGradient id="${grad}" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0.3" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.7"/><stop offset="0.7" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<g clip-path="url(#${clip})"><rect class="wb-sheen" x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${grad})"/></g>`
  );
}

function wallFrame(frame, { sheen = false } = {}) {
  const w = frame.w * CM;
  const h = frame.h * CM;
  const o = [frame.cx - w / 2, WALL_Y, FLOOR + frame.bottom * CM];
  const F = { o, a: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] };
  const outline = [[0, 0], [w, 0], [w, h], [0, h]];
  // Recorded where it shows at the start height: drawn on the floor group, which liftAt(1) shifts down.
  const shown = o[2] - (HEIGHT_CM.start - HEIGHT_CM.min) * CM;
  // The patch of wall it hangs on, just its own footprint so neighbouring frames' patches never overlap.
  rs({ x: o[0] - 1, y: WALL_Y - 2, w: w + 2, d: 2, r: 0 }, shown - 1, h + 2, "wall", { ground: true });
  rec(A.prism({ ...F, o: [o[0], o[1], shown] }, outline, 0, FRAME.depth, { name: "wall.frame" }));
  const face = planeMatrix(G.add3(o, [0, FRAME.depth, h]), [1, 0, 0], [0, 0, -1]); // local x right, y down from the top left
  const m = FRAME.moulding;
  const a = m + frame.mat;
  const mitres = `M0 0L${m} ${m}M${w} 0L${w - m} ${m}M0 ${h}L${m} ${h - m}M${w} ${h}L${w - m} ${h - m}`;
  return (
    soft([frame.cx + 0.8, WALL_Y, o[2] + h / 2 - 2], [w / 2 + 3, 0, 0], [0, 0, h / 2 + 3], "wb-soft-wall") +
    S(G.prismOf(F, outline, 0, FRAME.depth, P), { tone: "mid", crease: "lo" }) +
    `<g transform="${face}">` +
    `<rect class="wb-frame-mat" x="${m}" y="${m}" width="${w - 2 * m}" height="${h - 2 * m}"/>` +
    `<path class="iso-line" data-tone="lo" fill="none" d="${mitres}"/>` +
    `<rect class="iso-line" data-tone="lo" fill="none" x="${m}" y="${m}" width="${w - 2 * m}" height="${h - 2 * m}"/>` +
    `<g data-part="wall-art"><rect class="wb-frame-art" x="${a}" y="${a}" width="${w - 2 * a}" height="${h - 2 * a}"/>` +
    `<image class="wb-photo" href="${publicUrl(frame.picture.file)}" x="${a}" y="${a}" width="${w - 2 * a}" height="${h - 2 * a}" preserveAspectRatio="xMidYMid slice"/>` +
    (sheen ? sheenOver(a, a, w - 2 * a, h - 2 * a) : "") +
    `<rect class="iso-line" data-tone="faint" fill="none" x="${a}" y="${a}" width="${w - 2 * a}" height="${h - 2 * a}"/></g>` +
    `</g>`
  );
}
// The decor frames, on the room's floor group in the desk art.
function decorFrames() {
  owner = "desk";
  return Object.entries(FRAMES)
    .filter(([id]) => id !== "about")
    .map(([, frame]) => wallFrame(frame))
    .join("");
}


// ------------------------------------------------------------------ desk
// A sit-stand desk: a thin top on a steel frame, two three-stage telescoping columns on long feet with levelling pads,
// a cable tray under the back edge and a height keypad at the front right. A felt desk mat lies flush on top.
// The top stays put and the floor drops away: groups marked data-lift="f" move by f × the rise (down the z axis),
// so the outer stages and feet travel the full rise and the middle stages half of it.
function desk() {
  owner = "desk";
  const UNDER = -DESK_H; // the underside of the top
  const COL = { outer: { w: 13, d: 9 }, middle: { w: 11.6, d: 7.8 }, inner: { w: 10.2, d: 6.6 } };
  const OVERLAP = 2; // the least length one stage keeps inside the next at full rise
  const FOOT = { w: 9, h: 4.2, inset: 14 };
  const PAD_R = 2.6;
  const PAD_HH = 1.6;
  const BRACKET = { w: 6, h: 4.4, inset: 16 };
  const frameX = [DESK.x + 16, DESK.x + DESK.w - 16]; // column centres
  const cy = DESK.y + DESK.d / 2;
  const footZ = FLOOR + PAD_HH;
  const colZ = footZ + FOOT.h;
  const colTop = UNDER - BRACKET.h;
  const outerTop = colZ + RISE / 2 + OVERLAP; // the middle stage hides inside the outer one up to here
  const middleTop = outerTop + 10;
  const innerBottom = middleTop - RISE / 2 - OVERLAP;
  const plan = (x, { w, d }, r) => ({ x: x - w / 2, y: cy - d / 2, w, d, r });

  // A clip for the stage that slides out of `host`: everything but the host's sides (its top face stays open).
  const sleeve = (host, z0, z1, lift) => {
    const id = clipId("sleeve");
    const corners = k.roundedPlan(host, 3);
    const hull = convexHull([...corners.map(([x, y]) => at([x, y, z0])), ...corners.map(([x, y]) => at([x, y, z1]))]);
    const d = `M-2000 -2000H4000V4000H-2000Z${k.pathOf(hull, true)}${k.onTop(corners, z1, P, true)}`;
    return { id, def: `<clipPath id="${id}"><path ${liftAt(lift)} clip-rule="evenodd" d="${d}"/></clipPath>` };
  };

  // Floor: halo, pads, feet and the outer stages, all travelling the full rise.
  const base = [footSoft({ x: DESK.x + 20, y: DESK.y + 6, w: DESK.w - 40, d: DESK.d - 12, r: 8 }, FLOOR, 1.15, 6, "wb-soft-halo")];
  const middles = [];
  const inners = [];
  for (const x of frameX) {
    const foot = { x: x - FOOT.w / 2, y: DESK.y + FOOT.inset, w: FOOT.w, d: DESK.d - 2 * FOOT.inset, r: 3.6 };
    for (const y of [foot.y + 6, foot.y + foot.d - 6]) {
      rc(x, y, PAD_R, FLOOR, PAD_HH, "desk.pad", { ground: true });
      base.push(S(cyl(x, y, PAD_R, FLOOR, PAD_HH, 24, 0.3), { tone: "lo" }));
    }
    rs(foot, footZ, FOOT.h, "desk.foot");
    base.push(S(slab(foot, footZ, FOOT.h, 4, 0.8), { tone: "lo", inner: seamOn(foot, footZ + 1.4, 4) }));
    const outer = plan(x, COL.outer, 1.4);
    rs(outer, colZ, outerTop - colZ, "desk.column");
    base.push(S(slab(outer, colZ, outerTop - colZ, 3, 0.4), { tone: "mid", inner: seamOn(outer, colZ + 3, 3) }));
    // Middle stage: drawn down to the foot, clipped by the outer stage's sides; only what stands out of it is recorded.
    const middle = plan(x, COL.middle, 1.2);
    rs(middle, outerTop, middleTop - outerTop, "desk.column.middle");
    const outerClip = sleeve(outer, colZ, outerTop, 1);
    middles.push(`${outerClip.def}<g clip-path="url(#${outerClip.id})"><g ${liftAt(0.5)}>${S(slab(middle, colZ, middleTop - colZ, 3, 0.3), { tone: "mid", inner: seamOn(middle, middleTop - 2.4, 3) })}</g></g>`);
    // Inner stage: fixed to the bracket, clipped by the middle stage's sides.
    const inner = plan(x, COL.inner, 1.1);
    rs(inner, middleTop, colTop - middleTop, "desk.column.inner");
    const middleClip = sleeve(middle, colZ, middleTop, 0.5);
    inners.push(`${middleClip.def}<g clip-path="url(#${middleClip.id})">${S(slab(inner, innerBottom, colTop - innerBottom, 3, 0.3), { tone: "mid" })}</g>`);
  }
  // A soft shadow on the wall behind the top's back edge; it travels with the top, so the desk reads as pushed back.
  const wallShadow = soft([0, WALL_Y, -DESK_H - 3], [DESK.w / 2, 0, 0], [0, 0, 9], "wb-soft-wall");
  const out = [wallShadow, `<g ${liftAt(1)}>${base.join("")}</g>`, ...middles];

  // Cable tray: a steel trough hung under the back edge, behind the frame.
  const tray = { x: frameX[0] + 16, y: DESK.y + 10, w: frameX[1] - frameX[0] - 32, d: 16, r: 1 };
  const trayZ = UNDER - 9;
  const hanger = (x) => ({ x: x - 1, y: tray.y + 6, w: 2, d: 4, r: 0.4 });
  for (const x of [tray.x + 10, tray.x + tray.w - 10]) {
    rs(hanger(x), trayZ + 7, UNDER - trayZ - 7, "desk.tray.hanger");
    out.push(S(slab(hanger(x), trayZ + 7, UNDER - trayZ - 7, 2), { tone: "lo" }));
  }
  rs(tray, trayZ, 7, "desk.tray");
  const slots = [];
  for (let x = tray.x + 8; x < tray.x + tray.w - 6; x += 8) slots.push(x);
  const trayFront = `<g transform="${frontPlane(tray.y + tray.d)}">${L(slots.map((x) => flat(x - 1.6, trayZ + 1.8, x + 1.6, trayZ + 5.2, 0.8, 2)).join(""), { tone: "faint" })}</g>`;
  out.push(S(slab(tray, trayZ, 7, 3, 0.3), { tone: "lo", inner: trayFront }));

  // Inner stages and the side brackets under the top, along y; the cross beam between them.
  const bracketOf = (x) => ({ x: x - BRACKET.w / 2, y: DESK.y + BRACKET.inset, w: BRACKET.w, d: DESK.d - 2 * BRACKET.inset, r: 1 });
  const bracket = (x) => {
    rs(bracketOf(x), colTop, BRACKET.h, "desk.bracket");
    return S(slab(bracketOf(x), colTop, BRACKET.h, 3, 0.3), { tone: "lo" });
  };
  out.push(inners[0], bracket(frameX[0]));
  const beam = { x: frameX[0] + COL.inner.w / 2 + 1, y: cy - 3, w: frameX[1] - frameX[0] - COL.inner.w - 2, d: 6, r: 0.8 };
  rs(beam, UNDER - BRACKET.h, BRACKET.h, "desk.beam");
  out.push(S(slab(beam, UNDER - BRACKET.h, BRACKET.h, 3, 0.3), { tone: "lo" }));
  out.push(inners[1], bracket(frameX[1]));

  // Height keypad, front right: a mounting plate screwed under the top, the body standing out past the front edge.
  const front = DESK.y + DESK.d;
  const KP = { x: DESK.x + DESK.w - 52, w: 34, h: 6, out: 5.6 };
  const mount = { x: KP.x + 2, y: front - 12, w: KP.w - 4, d: 12, r: 1 };
  rs(mount, UNDER - 1.2, 1.2, "desk.keypad.mount");
  out.push(S(slab(mount, UNDER - 1.2, 1.2, 2), { tone: "lo" }));
  // The top: a thin board with a rounded edge.
  rs(DESK, -DESK_H, DESK_H, "desk.top");
  out.push(S(slab(DESK, -DESK_H, DESK_H, 8, 1.2), { tone: "mid", inner: L(k.sideSeam(DESK, -DESK_H / 2, P, 8), { tone: "faint" }) }));
  out.push(keypad(KP, front, UNDER));
  // Felt desk mat, centred: flush with the top, a stitched seam inset from its edge.
  const MAT = { x: -134, y: -6, w: 268, d: 98, r: 5 };
  out.push(`<path class="wb-mat" d="${k.onTop(k.roundedPlan(MAT, 4), 0, P, true)}"/>`);
  out.push(L(k.planOutline(MAT, 0, P, 4), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(MAT, 2.2), 0, P, 4), { tone: "faint" }));
  return out.join("");
}

// Convex hull of screen points (monotone chain), counter-clockwise.
function convexHull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const h = [];
    for (const q of list) {
      while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop();
      h.push(q);
    }
    return h.slice(0, -1);
  };
  return [...half(p), ...half([...p].reverse())];
}

// The keypad body in front of the top's front edge: a display with the height, up and down keys, three memory keys.
// Each key is a button (data-key) with a hit area a little larger than the key itself.
function keypad(KP, front, under) {
  const body = { x: KP.x, y: front, w: KP.w, d: KP.out, r: 1.4 };
  const z0 = under - KP.h;
  rs(body, z0, KP.h, "desk.keypad");
  const x0 = KP.x;
  const zc = z0 + KP.h / 2;
  const keyPath = (x, w) => flat(x, zc - 1.5, x + w, zc + 1.5, 0.8, 3);
  const hit = (x, w) => `<path class="wb-key-hit" d="${flat(x - 0.5, z0 + 0.3, x + w + 0.5, z0 + KP.h - 0.3, 0.8, 2)}"/>`;
  const chevron = (x, up) => `M${x - 0.9} ${-(zc + (up ? -0.4 : 0.4))}L${x} ${-(zc + (up ? 0.5 : -0.5))}L${x + 0.9} ${-(zc + (up ? -0.4 : 0.4))}`;
  const ring = (x) => k.pathOf(Array.from({ length: 14 }, (_, i) => [x + Math.cos((i / 14) * Math.PI * 2) * 1.05, -(zc + Math.sin((i / 14) * Math.PI * 2) * 1.05)]), true);
  const button = (key, label, art) => `<g class="wb-key" data-key="${key}" role="button" tabindex="0" aria-label="${label}">${art}</g>`;
  const arrows = [
    ["up", "Raise the desk", x0 + 12.4, true],
    ["down", "Lower the desk", x0 + 17.2, false],
  ].map(([key, label, x, up]) => button(key, label, hit(x, 4) + L(keyPath(x, 4), { tone: "mid" }) + L(chevron(x + 2, up), { tone: "hi", free: true })));
  const memory = HEIGHT_CM.presets.map((cm, i) => {
    const x = x0 + 23.6 + i * 2.9;
    return button(
      `m${i}`,
      `Desk memory ${i + 1}: ${cm} cm`,
      hit(x - 1.05, 2.1) + L(ring(x), { tone: "lo" }) + `<text class="wb-key-num" x="${x}" y="${-(zc - 0.5)}" font-size="1.4" text-anchor="middle">${i + 1}</text>`,
    );
  });
  const face =
    `<g transform="${frontPlane(front + KP.out)}">` +
    `<path class="wb-glass" d="${flat(x0 + 2, zc - 1.7, x0 + 10.6, zc + 1.7, 0.5, 2)}"/>` +
    `<text class="wb-screen-text wb-height" data-part="height" x="${x0 + 6.3}" y="${-(zc - 0.75)}" font-size="2.2" text-anchor="middle">${HEIGHT_CM.start.toFixed(1)}</text>` +
    arrows.join("") +
    memory.join("") +
    `</g>`;
  return `<g class="wb-keypad">${S(slab(body, z0, KP.h, 3, 0.4), { tone: "lo", crease: "lo", inner: face })}</g>`;
}

// ------------------------------------------------------------------ potted plants (decor, part of the desk art)
function plants() {
  owner = "desk";
  return POTS.map(pottedPlant).join("");
}

// ------------------------------------------------------------------ desk lamp (decor, beside the notebook)
// A swing-arm lamp in the back right corner: a weighted round base, a twin-rod lower arm, an elbow knuckle, a twin-rod
// upper arm reaching forward over the notebook and a cone shade aimed down at it.
// The base grows less than the arms: it has to fit between the notebook's tabs and the desk's back corner.
const LAMP = { cx: 179, cy: -86, scale: 1.4, base: 11 };
function lamp() {
  owner = "desk";
  const { cx, cy } = LAMP;
  // Every size below is drawn at scale 1 and multiplied by LAMP.scale.
  const u = (v) => v * LAMP.scale;
  const R = LAMP.base;
  const out = [halo({ x: cx - R, y: cy - R, w: 2 * R, d: 2 * R, r: R }, 0, 4)];
  const up = [0, 0, 1];
  const BF = G.frameAlong([cx, cy, 0], up);
  const base = [[0, R - 0.6], [0.6, R, 1], [1.8, R - 0.4, 1], [2.6, R - 2.2, 1], [3.2, R - 3.6]];
  rec(A.solid(BF, base, { name: "lamp.base" }));
  out.push(S(G.solidOf(base, BF, P), { tone: "mid", crease: "lo", inner: L(G.arcOf(BF, 0.6, R, P, { least: 0.05 }), { tone: "faint" }) }));
  // A small round switch on the base, toward the viewer.
  out.push(D([[cx + 2.9, cy + 5.1, 2.4]].map(at), { r: 0.8 }));
  const stem = [[3.2, u(2.4)], [u(5.6), u(2.4)]];
  rec(A.solid(BF, stem, { name: "lamp.stem" }));
  out.push(S(G.solidOf(stem, BF, P), { tone: "lo" }));
  const pivot = [cx, cy, u(7.4)];
  const elbow = [cx + u(3), cy - u(5), u(46)];
  const head = [cx - u(18), cy + u(15), u(54)];
  // Hinge axes are horizontal, across the arms' plane; each arm is two rods either side of it.
  const axis = G.unit3(G.cross3(G.sub3(head, pivot), up));
  const knuckle = (c, r, name) => {
    const KF = G.frameAlong(c, axis);
    rec(A.disc(KF, -u(2.2), u(2.2), u(r), { name }));
    return S(G.disc(-u(2.2), u(2.2), u(r), KF, P), { tone: "mid", crease: "lo" });
  };
  const rods = (a, b, name) =>
    [-1.5, 1.5]
      .map((o) => {
        const from = G.add3(a, G.mul3(axis, u(o)));
        const dir = G.sub3(b, a);
        const RF = G.frameAlong(from, G.unit3(dir));
        const len = Math.hypot(...dir);
        const rod = [[u(2.05), u(0.7)], [len - u(2.05), u(0.7)]];
        rec(A.solid(RF, rod, { name }));
        return { d: depth(from), svg: S(G.solidOf(rod, RF, P), { tone: "mid", crease: "lo" }) };
      })
      .sort((p, q) => p.d - q.d)
      .map(({ svg }) => svg)
      .join("");
  out.push(knuckle(pivot, 2, "lamp.pivot"), rods(pivot, elbow, "lamp.lower"), knuckle(elbow, 1.9, "lamp.elbow"), rods(elbow, head, "lamp.upper"));
  // The shade: a cone aimed down at the notebook, hung from the head knuckle.
  const aim = G.unit3(G.sub3([NB.x + NB.w * 0.55, NB.y + NB.d * 0.45, 7], head));
  const HF = G.frameAlong(G.add3(head, G.mul3(aim, u(1.95))), aim);
  const shade = [[0, 1.8], [2, 3, 1], [4.2, 4.4, 1], [11, 9.4], [11.8, 9.6]].map(([z, r, f]) => (f ? [u(z), u(r), f] : [u(z), u(r)]));
  rec(A.solid(HF, shade, { name: "lamp.shade" }));
  out.push(knuckle(head, 1.9, "lamp.head"), S(G.solidOf(shade, HF, P), { tone: "mid", crease: "lo", inner: L(G.arcOf(HF, u(4.2), u(4.4), P, { least: 0.05 }), { tone: "faint" }) }));
  return out.join("");
}

function pottedPlant({ cx, cy, r, h, kind }) {
  const out = [];
  const sr = r + 2.6;
  out.push(halo({ x: cx - sr, y: cy - sr, w: 2 * sr, d: 2 * sr, r: sr }, 0, 4));
  // Saucer: a shallow dish with a rim line.
  rc(cx, cy, sr, 0, SAUCER_H, "plant.saucer");
  out.push(S(cyl(cx, cy, sr, 0, SAUCER_H, 48, 0.4), { tone: "lo" }));
  out.push(L(k.ring(cx, cy, sr - 1.2, SAUCER_H, P, 40), { tone: "faint" }));
  const z0 = SAUCER_H;
  const F = G.frameAlong([cx, cy, z0], [0, 0, 1]);
  // Pot: a faceted origami planter, each triangle a holographic pastel.
  rec(A.solid(F, [[0, r * 0.74], [h * 0.55, r], [h, r * 1.04]], { name: "plant.pot" }));
  out.push(facetedPot(F, r, h, { snake: 3, cactus: 1, succulent: 4 }[kind]));
  // Soil just inside the lip, with a few grains.
  const top = z0 + h;
  const soilR = r * 1.04 * Math.cos(Math.PI / FACETS) - 1.4;
  rc(cx, cy, soilR, top, 0.3, "plant.soil");
  out.push(S(cyl(cx, cy, soilR, top, 0.3, 40), { tone: "lo", crease: "none" }));
  const grains = [0.4, 1.3, 2.2, 3.4, 4.3, 5.4].map((a, i) => at([cx + Math.cos(a) * soilR * (0.45 + 0.08 * (i % 3)), cy + Math.sin(a) * soilR * (0.45 + 0.08 * (i % 3)), top + 0.3]));
  out.push(D(grains, { size: 0.35 }));
  out.push({ snake: snakePlant, cactus, succulent }[kind](cx, cy, top + 0.3));
  return out.join("");
}

// Holographic low-poly: each triangle one pastel hue (deterministic), tagged with its light band
// so CSS can shade it (.wb-facet in workbench.css).
const FACETS = 9;
const HUES = 5;
const facetSvg = (points2d, hue, shade) => `<path class="wb-facet" data-hue="${hue}" data-shade="${shade}" d="${k.pathOf(points2d, true)}"/>`;

// A faceted turned body: rings of FACETS vertices, each [s, radius, turn] (turn in steps; alternate
// rings offset by half a step), joined by zigzag triangles. Back faces are culled, the rest painted
// back to front. The top ring is capped. Returns the svg and the ring polygons.
function faceted(F, rings, seed = 0) {
  const step = (2 * Math.PI) / FACETS;
  const pts = rings.map(([s, radius, turn]) => Array.from({ length: FACETS }, (_, i) => G.pointOf(F, s, radius, (i + turn) * step)));
  const tris = [];
  for (let k1 = 0; k1 < pts.length - 1; k1++) {
    const [lo, hi] = [pts[k1], pts[k1 + 1]];
    const shift = rings[k1 + 1][2] - rings[k1][2]; // +0.5: hi[i] sits between lo[i] and lo[i+1]
    for (let i = 0; i < FACETS; i++) {
      const j = (i + 1) % FACETS;
      if (shift > 0) tris.push([lo[i], lo[j], hi[i]], [hi[i], lo[j], hi[j]]);
      else tris.push([lo[i], lo[j], hi[j]], [lo[i], hi[j], hi[i]]);
    }
  }
  const V = G.viewOf(P);
  const faces = tris
    .map((t, i) => {
      const c = [0, 1, 2].map((n) => (t[0][n] + t[1][n] + t[2][n]) / 3);
      let normal = G.cross3(G.sub3(t[1], t[0]), G.sub3(t[2], t[0]));
      const out = G.sub3(c, F.o);
      if (normal[0] * out[0] + normal[1] * out[1] < 0) normal = normal.map((x) => -x);
      return { t, c, normal, hue: (i * 7 + seed) % HUES };
    })
    .filter(({ normal }) => G.dot3(G.unit3(normal), V) > 1e-6)
    .sort((p, q) => depth(p.c) - depth(q.c));
  const facets = faces.map(({ t, normal, hue }) => facetSvg(t.map(at), hue, Math.min(3, G.toneOf(normal, P))));
  const cap = `<path class="wb-facet-cap" d="${k.pathOf(pts.at(-1).map(at), true)}"/>`;
  const hull = k.pathOf(G.hullOf(pts.flat().map(at)), true);
  return `<g class="iso-solid wb-holo">${facets.join("")}${cap}<path class="iso-line iso-edge" data-tone="lo" d="${hull}"/></g>`;
}

// Faceted pot: an origami planter, narrow base, waist half a step round, flared mouth.
const facetedPot = (F, r, h, seed) => faceted(F, [[0, r * 0.74, 0], [h * 0.55, r, 0.5], [h, r * 1.04, 0]], seed);

// Low-poly holographic triangles over a jittered cols × rows grid; map(u, v) turns grid fractions
// (0..1) into a 2D point, so the same grid serves a projected top or a sticker's local plane.
function holoTris(map, cols, rows, seed = 0) {
  const jit = (i, j, n) => (((Math.sin((i + 1) * 12.9898 + (j + 1) * 78.233 + n * 37.719 + seed) * 43758.5453) % 1) + 1) % 1 - 0.5;
  const grid = Array.from({ length: rows + 1 }, (_, j) =>
    Array.from({ length: cols + 1 }, (_, i) => {
      const inner = i > 0 && i < cols && j > 0 && j < rows;
      return map((i + (inner ? jit(i, j, 0) * 0.7 : 0)) / cols, (j + (inner ? jit(i, j, 1) * 0.7 : 0)) / rows);
    }),
  );
  const tris = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const [a, b, c, d] = [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]];
      const flip = (i + j + seed) % 2;
      const pair = flip ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
      pair.forEach((t, n) => {
        // Hue drifts along the diagonal like the reference gradient, with a little noise.
        const hue = Math.floor(((i + j) / (cols + rows)) * HUES + (jit(i, j, n + 2) + 0.5) * 2) % HUES;
        tris.push(facetSvg(t, hue, 3 - ((i * 3 + j + n) % 3 === 0 ? 1 : 0)));
      });
    }
  return tris.join("");
}

// A holographic sheet on a flat top, clipped to the plan's rounded outline.
function holoSheet(plan, z, cols, rows, seed = 0) {
  const tris = holoTris((u, v) => at([plan.x + plan.w * u, plan.y + plan.d * v, z]), cols, rows, seed);
  const id = clipId("holo");
  const outline = k.onTop(k.roundedPlan(plan, 4), z, P, true);
  return `<clipPath id="${id}"><path d="${outline}"/></clipPath><g class="wb-holo wb-holo-sheet" clip-path="url(#${id})">${tris}</g>`;
}

// ------------------------------------------------------------------ stickers (holographic, die-cut)
// Generic for now. To use a custom design, edit an entry: `shape` is "star", "circle" or any SVG path
// d drawn in local units centred on 0,0 (x right, y down, about ±size); `label` adds optional text and
// `art` (a key of STICKER_ART) draws a logo on the white die instead of the holo fill.
const STICKERS = [
  { on: "thermos", shape: "circle", size: 6, seed: 3, art: "nodo" },
  { on: "laptop", shape: "circle", size: 4.4, seed: 1 },
];
// Outlines as local point lists, so they can bend with the surface they are stuck on.
const SHAPES2D = {
  star: (s) => Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? s * 0.48 : s;
    return [Math.cos(a) * r, Math.sin(a) * r];
  }),
  circle: (s) => Array.from({ length: 48 }, (_, i) => [Math.cos((i * Math.PI) / 24) * s, Math.sin((i * Math.PI) / 24) * s]),
};
// Maps every absolute "x y" pair of a path (M, L, C commands) through a screen mapper.
const mapPath = (d, map) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => map(+x, +y).map(fx).join(" "));

// Nodo Serrano mark, traced from its PNG (source box 720 x 1160, centred on 365,585) and scaled to fit
// inside a circle of radius s, then laid on the surface through `map`.
const fx = (n) => +n.toFixed(2);
const STICKER_ART = {
  nodo: (s, map) => {
    const q = (s * 1.42) / 1160;
    const pts = (d) => mapPath(d, (x, y) => map((x - 365) * q, (y - 585) * q));
    const shape = (d, fill) => `<path d="${pts(d)}" fill="${fill}"/>`;
    const ink = "#1c3f6b";
    return (
      `<g class="wb-sticker-art" stroke="${ink}" stroke-width="${fx(s * 0.045)}" stroke-linejoin="round">` +
      shape("M10 375 C 150 360 220 5 365 5 C 510 5 580 360 720 375 L 365 555 Z", "#5fcca9") +
      shape("M10 375 L 365 555 L 365 675 L 10 495 Z", "#b286c1") +
      shape("M365 555 L 720 375 L 720 495 L 365 675 Z", "#2884c6") +
      shape("M5 565 L 70 535 L 365 680 L 660 535 L 725 565 L 725 580 L 365 765 L 5 580 Z", ink) +
      shape("M10 580 L 365 765 L 365 1165 Z", "#b286c1") +
      shape("M365 765 L 720 580 L 365 1165 Z", "#2884c6") +
      `<path d="${pts("M340 85 C 290 250 300 400 365 555")}" fill="none"/>` +
      `</g>`
    );
  },
};

// One sticker laid on a surface through `map` (planeMap or cylinderMap): white die-cut border, holo fill and
// a sheen that sweeps across while its object is hovered or open (.wb-sheen in workbench.css). `shaded`
// adds the falloff of a curved surface turning away toward local +x.
function sticker(map, { shape, size, seed = 0, label, art }, { shaded = false } = {}) {
  const d = Array.isArray(SHAPES2D[shape]?.(size)) ? k.pathOf(SHAPES2D[shape](size).map(([x, y]) => map(x, y)), true) : mapPath(shape, map);
  const clip = clipId("sticker");
  const grad = clipId("sheen");
  const s = size * 1.1;
  const square = k.pathOf([[-s, -s], [s, -s], [s, s], [-s, s]].map(([x, y]) => map(x, y)), true);
  const tris = holoTris((u, v) => map(-s + 2 * s * u, -s + 2 * s * v), 4, 4, seed);
  const falloff = shaded ? clipId("falloff") : "";
  const text = label
    ? `<g transform="${planeMatrixOf(map)}"><text class="wb-sticker-text" x="0" y="${size * 0.28}" font-size="${size * 0.8}" text-anchor="middle">${esc(label)}</text></g>`
    : "";
  return (
    `<g class="wb-sticker">` +
    `<clipPath id="${clip}"><path d="${d}"/></clipPath>` +
    `<linearGradient id="${grad}" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0.3" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.9"/><stop offset="0.7" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    (shaded ? `<linearGradient id="${falloff}" x1="0" y1="0" x2="1" y2="0"><stop offset="0.35" class="wb-sticker-falloff-0"/><stop offset="1" class="wb-sticker-falloff-1"/></linearGradient>` : "") +
    `<path class="wb-sticker-edge" d="${d}"/><path class="wb-sticker-die" d="${d}"/>` +
    `<g clip-path="url(#${clip})">${art ? STICKER_ART[art](size * 0.92, map) : tris}<path class="wb-sheen" d="${square}" fill="url(#${grad})"/>` +
    (shaded ? `<path class="wb-sticker-falloff" d="${square}" fill="url(#${falloff})"/>` : "") +
    `</g>` +
    text +
    `</g>`
  );
}
// Affine stand-in for a mapper around its centre (for text, which cannot bend).
function planeMatrixOf(map) {
  const [p0, px, py] = [map(0, 0), map(1, 0), map(0, 1)];
  return `matrix(${[px[0] - p0[0], px[1] - p0[1], py[0] - p0[0], py[1] - p0[1], p0[0], p0[1]].map((v) => v.toFixed(4)).join(" ")})`;
}
const stickersOn = (on, place, options) => STICKERS.filter((st) => st.on === on).map((st, i) => sticker(place(st, i), st, options)).join("");

// Snake plant: upright lance-shaped blades fanning out from the soil, painted back to front.
function snakePlant(cx, cy, z) {
  const blades = [
    { a: 0.3, ring: 4.2, w: 2.6, len: 34, tilt: 0.12 },
    { a: 1.55, ring: 4.4, w: 2.4, len: 27, tilt: 0.2 },
    { a: 2.8, ring: 4.2, w: 2.8, len: 31, tilt: 0.16 },
    { a: 4.05, ring: 4.4, w: 2.4, len: 24, tilt: 0.24 },
    { a: 5.2, ring: 4.2, w: 2.6, len: 29, tilt: 0.18 },
    { a: 0, ring: 0, w: 2.2, len: 38, tilt: 0 },
  ].map((b) => {
    const radial = [Math.cos(b.a), Math.sin(b.a), 0];
    const u = [-Math.sin(b.a), Math.cos(b.a), 0];
    const v = G.unit3([radial[0] * b.tilt, radial[1] * b.tilt, 1]);
    const o = [cx + radial[0] * b.ring, cy + radial[1] * b.ring, z];
    const F = G.frameOf(o, G.cross3(u, v), u, v);
    const poly = [[-b.w, 0], [b.w, 0], [b.w * 1.15, b.len * 0.42], [0, b.len], [-b.w * 1.15, b.len * 0.42]];
    return { F, poly, mid: [o[0] + v[0] * b.len * 0.4, o[1] + v[1] * b.len * 0.4, o[2] + v[2] * b.len * 0.4] };
  });
  blades.sort((p, q) => depth(p.mid) - depth(q.mid));
  return blades
    .map(({ F, poly }, i) => {
      rec(A.prism(F, poly, -0.45, 0.45, { name: "plant.blade" }));
      return S(G.prismOf(F, poly, -0.45, 0.45, P), { tone: i % 2 ? "hi" : "mid", crease: "lo" });
    })
    .join("");
}

// Succulent (echeveria): three rings of plump pointed leaves, the outer ones splayed low, the inner ones closing up.
function succulent(cx, cy, z) {
  const rings = [
    { n: 9, ring: 3.2, len: 10, w: 2.7, tilt: 1.15, turn: 0 },
    { n: 7, ring: 2, len: 8, w: 2.4, tilt: 0.75, turn: 0.5 },
    { n: 5, ring: 0.8, len: 6, w: 2, tilt: 0.35, turn: 0.2 },
  ];
  const leaves = rings.flatMap((r, level) =>
    Array.from({ length: r.n }, (_, i) => {
      const a = ((i + r.turn) / r.n) * 2 * Math.PI;
      const radial = [Math.cos(a), Math.sin(a), 0];
      const u = [-Math.sin(a), Math.cos(a), 0];
      const v = [radial[0] * Math.sin(r.tilt), radial[1] * Math.sin(r.tilt), Math.cos(r.tilt)];
      const o = [cx + radial[0] * r.ring, cy + radial[1] * r.ring, z + level * 1.2];
      const F = G.frameOf(o, G.cross3(u, v), u, v);
      const poly = [[-r.w * 0.55, 0], [r.w * 0.55, 0], [r.w, r.len * 0.5], [r.w * 0.6, r.len * 0.82], [0, r.len], [-r.w * 0.6, r.len * 0.82], [-r.w, r.len * 0.5]];
      return { F, poly, level, mid: G.add3(o, v.map((x) => x * r.len * 0.5)) };
    }),
  );
  leaves.sort((p, q) => p.level - q.level || depth(p.mid) - depth(q.mid));
  return leaves
    .map(({ F, poly, level }) => {
      rec(A.prism(F, poly, -0.5, 0.5, { name: "plant.leaf" }));
      return S(G.prismOf(F, poly, -0.5, 0.5, P), { tone: level === 1 ? "hi" : "mid", crease: "lo" });
    })
    .join("");
}

// Cactus: a ribbed turned column with a domed crown and rows of spine dots.
function cactus(cx, cy, z) {
  const F = G.frameAlong([cx, cy, z], [0, 0, 1]);
  const profile = [[0, 5.2], [6, 6, 1], [18, 6, 1], [24, 4.6, 1], [27, 2.2, 1], [27.8, 0.6, 1]];
  rec(A.solid(F, profile, { name: "plant.cactus" }));
  // Ribs follow the profile from the base to the crown, segment by segment, so they end on the outline.
  const ribs = profile.slice(1).flatMap(([s1, r1], i) => G.ribsOf(F, profile[i][0], s1, profile[i][1], 12, P, { r1, fade: [0.1, 0.55] }));
  const spines = [6, 11, 16, 21].map((s) => G.dotsOf(F, s, 6, 12, P, { phase: Math.PI / 12, fade: [0.15, 0.6] }));
  return S(G.solidOf(profile, F, P), { tone: "hi", crease: "lo", inner: k.fadedSvg(ribs, { tone: "lo" }) }) + D(spines.flat(), { size: 0.3, tone: "mid" });
}

// ------------------------------------------------------------------ laptop (projects)
const DOCK_LIFT = 1.6;
const rr = (x0, y0, x1, y1, r, steps = 4) => k.pathOf(k.roundedPlan({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r }, steps), true);

function laptop() {
  owner = "projects";
  const out = [halo(LAP, 0, 4)];
  rs(LAP, 0, LAP_H, "lap.base");
  out.push(S(slab(LAP, 0, LAP_H, 6, 0.8), { tone: "mid", inner: seamOn(LAP, 1.4, 6) }));
  // Lid, standing on the hinge barrel; the display sits flush in its face.
  const lidPoly = k.roundedPlan({ x: 0, y: HINGE.r, w: LAP.w, d: LID_H - HINGE.r, r: 4 }, 4);
  rec(A.prism(LID_F, lidPoly, -LID_T, 0, { name: "lap.lid" }));
  out.push(S(G.prismOf(LID_F, lidPoly, -LID_T, 0, P), { tone: "mid" }));
  out.push(display());
  // Hinge barrel along the back of the base.
  const length = LAP.w - 2 * HINGE.inset;
  const HF = G.frameAlong([LAP.x + HINGE.inset, HINGE.y, LAP_H + HINGE.r], [1, 0, 0]);
  const barrel = [[0, HINGE.r * 0.85], [0.5, HINGE.r], [length - 0.5, HINGE.r], [length, HINGE.r * 0.85]];
  rec(A.solid(HF, barrel, { name: "lap.hinge" }));
  out.push(S(G.solidOf(barrel, HF, P), { tone: "lo" }));
  // Keyboard: a shallow well of flat keys, a half-height function row ending in the Touch ID key.
  const rows = KEY_D.reduce((sum, d) => sum + d, 0) * U;
  out.push(L(k.planOutline({ x: KEYS.x - 1.2, y: KEYS.y - 1.2, w: KEYS.w + 2.4, d: rows + 2.4, r: 1.6 }, LAP_H, P, 4), { tone: "lo" }));
  let y = KEYS.y;
  KEY_ROWS.forEach((row, r) => {
    const d = KEY_D[r] * U;
    let x = KEYS.x;
    for (const width of row) {
      const plan = { x: x + 0.5, y: y + 0.5, w: width * U - 1, d: d - 1, r: 0.8 };
      rs(plan, LAP_H, KEY_H, "lap.key");
      out.push(S(slab(plan, LAP_H, KEY_H, 3, 0.2), { tone: "lo", crease: "none" }));
      x += width * U;
    }
    y += d;
  });
  const touchId = [KEYS.x + 14.5 * U, KEYS.y + 0.3 * U];
  out.push(L(k.ring(touchId[0], touchId[1], 1, LAP_H + KEY_H, P, 18), { tone: "mid" }));
  // Trackpad, flush with the deck.
  out.push(L(k.planOutline(TRACKPAD, LAP_H, P, 4), { tone: "lo" }));
  // Stickers on the left palm rest, beside the trackpad.
  const palm = (TRACKPAD.x + LAP.x) / 2;
  out.push(stickersOn("laptop", (_, i) => planeMap([palm, TRACKPAD.y + TRACKPAD.d / 2 - i * 11, LAP_H], [1, 0, 0], [0, 1, 0])));
  // Thumb scoop on the front edge and the headphone jack on the right side.
  const cx = LAP.x + LAP.w / 2;
  out.push(`<g transform="${frontPlane(LAP.y + LAP.d)}">${L(flat(cx - 9 * LS, LAP_H - 1.4, cx + 9 * LS, LAP_H - 0.3, 0.5, 2), { tone: "faint" })}</g>`);
  const side = LAP.x + LAP.w;
  const jack = Array.from({ length: 14 }, (_, i) => at([side, LAP.y + 62 * LS + Math.cos((i / 14) * Math.PI * 2) * 0.8, 2 + Math.sin((i / 14) * Math.PI * 2) * 0.8]));
  out.push(L(k.pathOf(jack, true), { tone: "lo" }));
  return out.join("");
}

// The display, drawn in the lid's plane: a menu bar, a window with the project, and a dock with one icon per project.
function display() {
  // Local (x, down the lid) in unscaled laptop units: the picture shrinks with the laptop as one piece.
  const M = planeMatrix(onFrame(LID_F, 0, LID_H, 0), [LS, 0, 0], G.mul3(LID_UP, -LS));
  const W = LAP.w / LS;
  const bottom = (LID_H - HINGE.r) / LS - 6;
  const glass = rr(1.6, 1.6, W - 1.6, bottom, 3.2);
  const area = { x0: 4.5, y0: 4.5, x1: W - 4.5, y1: bottom - 3 };
  const screenPath = rr(area.x0, area.y0, area.x1, area.y1, 1.2);
  const mid = W / 2;
  const win = { x0: 15, y0: 11, x1: W - 15, y1: 49.5 };
  const tx = win.x0 + 4;
  const id = clipId("display");
  const marks = [[8, 3], [13, 5], [20, 5], [27, 4], [W - 20, 3], [W - 15, 8]].map(([x, w]) => `M${x} 6.05h${w}`).join("");
  const iconW = 5.6;
  const gap = 2;
  const dockW = projects.length * (iconW + gap) + gap;
  const dock = { x0: mid - dockW / 2, y0: 52.6, x1: mid + dockW / 2, y1: 61.4 };
  const icons = projects
    .map((_, i) => {
      const x = dock.x0 + gap + i * (iconW + gap);
      return (
        `<g data-part="dock-${i}">` +
        `<path class="wb-dock-icon" d="${rr(x, dock.y0 + 1.1, x + iconW, dock.y0 + 1.1 + iconW, 1.4, 3)}"/>` +
        `<g class="wb-dock-led"><circle cx="${(x + iconW / 2).toFixed(2)}" cy="${(dock.y1 - 0.9).toFixed(2)}" r="0.45"/></g>` +
        `</g>`
      );
    })
    .join("");
  const picture = [
    `<path class="wb-glow" d="${rr(area.x0 + 10, area.y0 + 8, area.x1 - 10, area.y1 - 8, 14, 6)}"/>`,
    `<path class="wb-menubar" d="${rr(area.x0, area.y0, area.x1, 7.6, 0.2, 2)}"/>`,
    L(marks, { tone: "faint", free: true }),
    `<path class="wb-window" d="${rr(win.x0, win.y0, win.x1, win.y1, 2)}"/>`,
    L(rr(win.x0, win.y0, win.x1, win.y1, 2), { tone: "faint" }),
    L(`M${win.x0} 15.2H${win.x1}`, { tone: "faint" }),
    [0, 1, 2].map((i) => `<circle class="wb-screen-dot" cx="${win.x0 + 3.2 + i * 3}" cy="13.1" r="0.8"/>`).join(""),
    `<text class="wb-screen-text" data-part="screen-head" x="${tx}" y="21.4" font-size="4.2">${esc(SCREENS[0][0])}</text>`,
    `<text class="wb-screen-text wb-screen-title" data-part="screen-title-0" x="${tx}" y="29" font-size="5.4">${esc(SCREENS[0][1])}</text>`,
    `<text class="wb-screen-text wb-screen-title" data-part="screen-title-1" x="${tx}" y="35.4" font-size="5.4">${esc(SCREENS[0][2])}</text>`,
    `<text class="wb-screen-text" data-part="screen-meta" x="${tx}" y="42.4" font-size="4.2">${esc(SCREENS[0][3])}</text>`,
    `<text class="wb-screen-text" x="${tx}" y="47.6" font-size="3.6">&gt;</text>`,
    `<rect class="wb-cursor" x="${tx + 3.2}" y="44.8" width="2" height="3.4"/>`,
    `<path class="wb-dock" d="${rr(dock.x0, dock.y0, dock.x1, dock.y1, 2.2)}"/>`,
    icons,
  ].join("");
  return [
    `<g transform="${M}">`,
    `<path class="wb-glass" d="${glass}"/>`,
    `<clipPath id="${id}"><path d="${screenPath}"/></clipPath>`,
    `<g clip-path="url(#${id})"><path class="wb-display" d="${screenPath}"/><g data-part="screen-picture">${picture}</g></g>`,
    `<path class="wb-glass" d="${rr(mid - 7, 1.6, mid + 7, 7.4, 1.4, 3)}"/>`,
    `<circle class="wb-cam" cx="${mid}" cy="3.8" r="0.6"/>`,
    L(glass, { tone: "lo" }),
    `</g>`,
  ].join("");
}
// ------------------------------------------------------------------ notebook (experience)
const TAB_OUT = 4;
const TAB_IN = TAB_OUT + 6; // how deep a tab runs into the page block
const TABS = experience.map((_, i, all) => {
  const n = Math.max(1, all.length - 1);
  return { y: NB.y + 9 + ((NB.d - 18 - TAB.d) * i) / n, z: NB_COVER + 0.9 + ((NB_PAGES - 1.8 - TAB.t) * i) / n };
});
function notebook() {
  owner = "experience";
  const out = [halo(NB, 0, 4)];
  const top = 2 * NB_COVER + NB_PAGES;
  // A ribbon bookmark lying on the desk out of the bottom edge.
  const ribbon = { x: NB.x + 18, y: NB.y + NB.d, w: 2.2, d: 7, r: 0.4 };
  rs(ribbon, 0, 0.2, "nb.ribbon");
  out.push(S(slab(ribbon, 0, 0.2, 2), { tone: "lo", crease: "none" }));
  rs(NB, 0, NB_COVER, "nb.cover");
  out.push(S(slab(NB, 0, NB_COVER, 4, 0.3), { tone: "mid" }));
  // Page block, cut at each divider: every tab is a sheet between two slices of pages that runs deep into the block,
  // so it leaves the fore edge from between the pages and stays attached when it slides out.
  const pages = { x: NB.x + 1.6, y: NB.y + 1.4, w: NB.w - 1.6, d: NB.d - 2.8, r: 2.4 };
  const cuts = [NB_COVER, ...TABS.flatMap(({ z }) => [z, z + TAB.t]), NB_COVER + NB_PAGES];
  for (let i = 0; i < cuts.length; i += 2) {
    const [z0, z1] = [cuts[i], cuts[i + 1]];
    rs(pages, z0, z1 - z0, "nb.pages");
    const seam = z1 - z0 > 0.9 ? L(k.sideSeam(pages, (z0 + z1) / 2, P, 4), { tone: "faint" }) : "";
    out.push(S(slab(pages, z0, z1 - z0, 4), { tone: "hi", crease: "lo", inner: seam }));
    const tab = TABS[i / 2];
    if (!tab) continue;
    const { y, z } = tab;
    const plan = { x: NB.x + NB.w - TAB_IN, y, w: TAB.w + TAB_IN, d: TAB.d, r: 0.8 };
    rs(plan, z, TAB.t, `nb.tab#${i / 2}`);
    const mx = NB.x + NB.w + 1.6;
    const mark = k.lineOnTop([mx, y + 2.4], [mx, y + TAB.d - 2.4], z + TAB.t, P);
    out.push(`<g data-part="card-${i / 2}">` + S(slab(plan, z, TAB.t, 3, 0.15), { tone: "hi", crease: "lo" }) + L(mark, { tone: "lo", free: true }) + `</g>`);
  }
  rs(NB, NB_COVER + NB_PAGES, NB_COVER, "nb.cover");
  out.push(S(slab(NB, NB_COVER + NB_PAGES, NB_COVER, 4, 0.3), { tone: "mid" }));
  // Cover: a holographic low-poly sheet, a white label with two rules, an elastic band over the top and down the front edge.
  out.push(holoSheet({ x: NB.x + 0.5, y: NB.y + 0.5, w: NB.w - 1, d: NB.d - 1, r: NB.r - 0.5 }, top, 5, 6, 2));
  const label = { x: NB.x + 9, y: NB.y + 12, w: 24, d: 11, r: 1 };
  out.push(`<path class="wb-facet-cap" d="${k.onTop(k.roundedPlan(label, 3), top, P, true)}"/>`);
  out.push(L(k.planOutline(label, top, P, 3), { tone: "lo" }));
  out.push(L(k.lineOnTop([label.x + 3, label.y + 4], [label.x + 17, label.y + 4], top, P) + k.lineOnTop([label.x + 3, label.y + 7], [label.x + 12, label.y + 7], top, P), { tone: "faint", free: true }));
  const bx = NB.x + NB.w - 9;
  const band = { x: bx, y: NB.y, w: 1.8, d: NB.d, r: 0.3 };
  rs(band, top, 0.3, "nb.band");
  out.push(S(slab(band, top, 0.3, 2), { tone: "lo", crease: "none" }));
  const drop = { x: bx, y: NB.y + NB.d, w: 1.8, d: 0.3, r: 0.1 };
  rs(drop, 0, top + 0.3, "nb.band");
  out.push(S(slab(drop, 0, top + 0.3, 2), { tone: "lo", crease: "none" }));
  return out.join("");
}

// ------------------------------------------------------------------ phone on a MagSafe stand (contact)
function phone() {
  owner = "contact";
  const out = [halo(STAND, 0, 4)];
  rs(STAND, 0, STAND_H, "stand.base");
  out.push(S(slab(STAND, 0, STAND_H, 6, 0.8), { tone: "mid", inner: seamOn(STAND, 1, 6) }));
  // Arm and puck behind the phone, back to front: the arm's lower back edge rests on the base.
  const s0 = -PH.t - PUCK.t;
  const sArm = s0 - ARM.t;
  const vb = (STAND_H - PH_F.o[2] - sArm * Math.sin(PH_TILT)) / Math.cos(PH_TILT);
  const arm = k.roundedPlan({ x: -ARM.w / 2, y: vb, w: ARM.w, d: ARM.top - vb, r: 1.5 }, 3);
  rec(A.prism(PH_F, arm, sArm, s0, { name: "stand.arm" }));
  out.push(S(G.prismOf(PH_F, arm, sArm, s0, P), { tone: "mid" }));
  const PF = G.frameAlong(onFrame(PH_F, 0, PUCK.v, 0), PH_N);
  rec(A.disc(PF, s0, -PH.t, PUCK.r, { name: "stand.puck" }));
  out.push(S(G.disc(s0, -PH.t, PUCK.r, PF, P), { tone: "lo" }));
  // The phone: a steel-framed slab, the power button on its right side, the screen in its face.
  const body = k.roundedPlan({ x: -PH.w / 2, y: 0, w: PH.w, d: PH.h, r: PH.r }, 5);
  const button = [[PH.w / 2, 34], [PH.w / 2 + 0.5, 34], [PH.w / 2 + 0.5, 42], [PH.w / 2, 42]];
  rec(A.prism(PH_F, body, -PH.t, 0, { name: "phone.body" }));
  rec(A.prism(PH_F, button, -2.1, -0.7, { name: "phone.button" }));
  out.push(
    `<g data-part="phone">` +
      S(G.prismOf(PH_F, body, -PH.t, 0, P), { tone: "hi", crease: "lo" }) +
      S(G.prismOf(PH_F, button, -2.1, -0.7, P), { tone: "mid" }) +
      phoneScreen() +
      `</g>`,
  );
  // A lip in front of the phone keeps it from sliding off the base.
  const lip = { x: PH.cx - 8, y: PH.y, w: 16, d: 2.2, r: 0.8 };
  rs(lip, STAND_H, 2.4, "stand.lip");
  out.push(S(slab(lip, STAND_H, 2.4, 3, 0.3), { tone: "mid" }));
  return out.join("");
}

// The phone's screen, two states: a lock screen at rest, an incoming call when contact is in focus.
function phoneScreen() {
  const M = planeMatrix(onFrame(PH_F, -PH.w / 2, PH.h, 0), [1, 0, 0], G.mul3(PH_UP, -1));
  const glass = rr(0.9, 0.9, PH.w - 0.9, PH.h - 0.9, PH.r - 0.9);
  const notch = rr(PH.w / 2 - 5, 0.9, PH.w / 2 + 5, 3.3, 1.2, 3);
  const cx = PH.w / 2;
  const first = profile.name.split(" ")[0].toUpperCase();
  const idle =
    `<g class="wb-phone-idle">` +
    `<text class="wb-phone-time" x="${cx}" y="14" font-size="7" text-anchor="middle">9:41</text>` +
    `<text class="wb-phone-small" x="${cx}" y="17.6" font-size="1.9" text-anchor="middle">MONDAY, JUNE 9</text>` +
    `<circle class="wb-phone-key" cx="5.5" cy="48.5" r="2"/><circle class="wb-phone-key" cx="${PH.w - 5.5}" cy="48.5" r="2"/>` +
    `</g>`;
  const call =
    `<g class="wb-phone-call">` +
    `<text class="wb-phone-small" x="${cx}" y="9.8" font-size="2.3" text-anchor="middle">INCOMING CALL</text>` +
    `<text class="wb-phone-name" x="${cx}" y="16" font-size="4.6" text-anchor="middle">${esc(first)}</text>` +
    `<text class="wb-phone-small" x="${cx}" y="19.8" font-size="2.1" text-anchor="middle">MOBILE</text>` +
    callButtons() +
    `</g>`;
  return `<g transform="${M}"><path class="wb-display wb-phone-glass" d="${glass}"/>${idle}${call}<path class="wb-glass" d="${notch}"/>${L(glass, { tone: "lo" })}</g>`;
}

// Decline (pink, handset turned down) on the left, accept (violet, a ring that pulses while it rings) on the right,
// each with its caption under it, as on a phone's incoming-call screen.
const HANDSET = "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z";
function callButtons() {
  const y = 44.6;
  const button = (x, kind, turn, caption) =>
    `<g transform="translate(${x} ${y})">` +
    (kind === "yes" ? `<circle class="wb-call-ring" r="3.3"/>` : "") +
    `<circle class="wb-call-${kind}" r="3.3"/>` +
    `<path class="wb-call-handset" transform="rotate(${turn}) scale(0.2) translate(-12 -12)" d="${HANDSET}"/>` +
    `<text class="wb-phone-small" y="5.6" font-size="1.45" text-anchor="middle">${caption}</text></g>`;
  return button(6.8, "no", 135, "DECLINE") + button(PH.w - 6.8, "yes", 0, "ACCEPT");
}

// ------------------------------------------------------------------ mate and thermos (decor, part of the desk art)
function mateSet() {
  owner = "desk";
  const V = G.viewOf(P);
  const facing = G.unit3([V[0], V[1], 0]); // the side of a turned body that faces the viewer
  let side = [-facing[1], facing[0], 0];
  if (at(G.add3([0, 0, 0], side))[0] < at([0, 0, 0])[0]) side = G.mul3(side, -1); // screen-right along the surface
  // The two pieces back to front.
  const pieces = [[TERMO, thermos], [MATE, gourd]].sort(([a], [b]) => depth([a.cx, a.cy, 0]) - depth([b.cx, b.cy, 0]));
  return pieces.map(([spec, draw]) => draw(spec, facing, side)).join("");
}

// Thermos: a steel body with a shoulder, a narrow neck and a pour cap; the name printed on the side facing the viewer.
function thermos({ cx, cy, r, h }, facing, side) {
  const out = [halo({ x: cx - r, y: cy - r, w: 2 * r, d: 2 * r, r }, 0, 4)];
  const F = G.frameAlong([cx, cy, 0], [0, 0, 1]);
  // Steel body: a rolled foot, a straight wall, a rounded shoulder closing to a short neck.
  const neck = h - 13;
  const body = [[0, r - 0.8], [0.8, r], [neck - 6, r], [neck - 2.4, r * 0.9, 1], [neck - 0.6, r * 0.74, 1], [neck, r * 0.7]];
  rec(A.solid(F, body, { name: "termo.body" }));
  const seams = G.arcOf(F, 0.8, r, P, { least: 0.05 }) + G.arcOf(F, 5, r, P, { least: 0.05 }) + G.arcOf(F, neck - 6, r, P, { least: 0.05 });
  out.push(S(G.solidOf(body, F, P), { tone: "mid", crease: "lo", inner: L(seams, { tone: "faint" }) }));
  // Neck collar the cup screws onto.
  const collar = [[neck, r * 0.7], [neck + 1.6, r * 0.7]];
  rec(A.solid(F, collar, { name: "termo.collar" }));
  out.push(S(G.solidOf(collar, F, P), { tone: "lo" }));
  // Cup lid: a straight faceted holographic cup, a white domed stopper on top.
  const cup = 0.84 * r;
  const cupTop = h - 2.2;
  rec(A.solid(F, [[neck + 1.6, cup], [cupTop, cup]], { name: "termo.cup" }));
  out.push(faceted(F, [[neck + 1.6, cup, 0], [cupTop, cup, 0.5]], 2));
  const dome = [[cupTop, cup * 0.9], [cupTop + 1.2, cup * 0.8, 1], [h - 0.3, cup * 0.45, 1], [h, cup * 0.3]];
  rec(A.solid(F, dome, { name: "termo.dome" }));
  out.push(S(G.solidOf(dome, F, P), { tone: "hi", crease: "lo" }));
  // The name, wrapped round the body: each letter on its own tangent plane, so it foreshortens with the curve.
  const first = profile.name.split(" ")[0].toUpperCase();
  const ADVANCE = 3.6; // mono advance (0.6em) plus the 0.12em tracking at font-size 5
  const mid = Math.atan2(facing[1], facing[0]);
  const turn = Math.sign(-Math.sin(mid) * side[0] + Math.cos(mid) * side[1]) || 1; // grow the angle toward screen-right
  const letters = [...first].map((ch, i) => {
    const a = mid + (turn * (i - (first.length - 1) / 2) * ADVANCE) / r;
    const o = [cx + Math.cos(a) * r, cy + Math.sin(a) * r, neck * 0.62];
    const t = [-Math.sin(a) * turn, Math.cos(a) * turn, 0];
    return `<g transform="${planeMatrix(o, t, [0, 0, -1])}"><text class="iso-face-text wb-name" x="0" y="1.6" font-size="5" text-anchor="middle">${esc(ch)}</text></g>`;
  });
  out.push(`<g class="wb-name-wrap">${letters.join("")}</g>`);
  // Stickers below the name, a little to the right, wrapped around the body like the letters.
  out.push(stickersOn("thermos", (_, i) => cylinderMap(cx, cy, r, mid + turn * (0.35 - i * 0.7), turn, neck * 0.32), { shaded: true }));
  return out.join("");
}

// Mate: a round gourd closing to its mouth, yerba heaped inside, a steel bombilla leaning out; steam while in focus.
function gourd({ cx, cy, r, h }, facing, side) {
  const out = [halo({ x: cx - r, y: cy - r, w: 2 * r, d: 2 * r, r }, 0, 4)];
  const F = G.frameAlong([cx, cy, 0], [0, 0, 1]);
  const mouth = r * 0.66;
  const body = [[0, r * 0.4], [0.8, r * 0.78, 1], [3.6, r, 1], [7, r * 0.92, 1], [h - 1, mouth + 0.4, 1], [h, mouth]];
  rec(A.solid(F, body, { name: "mate.gourd" }));
  // A geometric faceted mate: the same belly and mouth, cut in holographic triangles.
  out.push(faceted(F, [[0, r * 0.5, 0], [3.6, r * 1.04, 0.5], [8, r * 0.95, 0], [h, (mouth + 0.4) / Math.cos(Math.PI / FACETS), 0.5]], 4));
  // Yerba just under the rim.
  const rim = Array.from({ length: 36 }, (_, i) => [cx + Math.cos((i / 36) * Math.PI * 2) * (mouth - 0.4), cy + Math.sin((i / 36) * Math.PI * 2) * (mouth - 0.4)]);
  out.push(`<path class="wb-yerba" d="${k.onTop(rim, h - 0.3, P, true)}"/>`, L(k.ring(cx, cy, mouth - 0.4, h - 0.3, P, 36), { tone: "lo" }));
  // Bombilla: a thin straw from the yerba, leaning back and to the left, a flattened mouthpiece at the end.
  const base = [cx - facing[0] * 1.2, cy - facing[1] * 1.2, h - 0.3];
  const dir = G.unit3([-facing[0] * 0.3 - side[0] * 0.25, -facing[1] * 0.3 - side[1] * 0.25, 1]);
  const BF = G.frameAlong(base, dir);
  const straw = [[0, 0.5], [14, 0.5], [14.7, 0.7, 1], [16.4, 0.65, 1], [16.9, 0.35]];
  rec(A.solid(BF, straw, { name: "mate.bombilla" }));
  out.push(S(G.solidOf(straw, BF, P), { tone: "hi", crease: "lo" }));
  // Steam, shown while the set is in focus.
  const wisp = (x) => `M${x} 0c-1.4 -2.2 1.4 -3.2 0 -5.4s1.4 -3.2 0 -5.4`;
  out.push(`<g transform="${planeMatrix([cx, cy, h + 1], side, [0, 0, -1])}"><path class="wb-steam" d="${[-1.8, 1.8].map(wisp).join("")}"/></g>`);
  return out.join("");
}

// ------------------------------------------------------------------ office chair (decor, its own layer in front of the objects)
// Pulled out in front of the desk, its back to the viewer. It stands on the floor (data-lift="1"), which stays put
// on screen: the scene around it moves the top, so lowered to sitting height the desk comes down to the chair.
const CHAIR = { cx: -104, cy: 156 };
function chair() {
  owner = "chair";
  const { cx, cy } = CHAIR;
  const SEAT = 80; // wider than true scale, to sit beside the enlarged objects; heights stay true
  const seatTop = FLOOR + 47 * CM;
  const seatZ = seatTop - 9;
  const backZ = seatTop + 8;
  const backTop = FLOOR + 96 * CM;
  const R = 37 * CM; // base radius
  const out = [halo({ x: cx - 0.7 * R, y: cy - 0.7 * R, w: 1.4 * R, d: 1.4 * R, r: 0.7 * R }, FLOOR, 4)];
  // Five-star base: each arm on its caster, back to front.
  const arms = [0, 1, 2, 3, 4]
    .map((i) => {
      const a = Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const u = [Math.cos(a), Math.sin(a), 0];
      const end = [cx + u[0] * (R - 3), cy + u[1] * (R - 3)];
      return { u, end, mid: [cx + u[0] * R * 0.6, cy + u[1] * R * 0.6, FLOOR + 6] };
    })
    .sort((p, q) => depth(p.mid) - depth(q.mid));
  arms.forEach(({ u, end }, i) => {
    rc(end[0], end[1], 3, FLOOR, 6, "chair.caster", { ground: true });
    // Faceted holographic caster.
    out.push(faceted(G.frameAlong([end[0], end[1], FLOOR], [0, 0, 1]), [[0, 2.8, 0], [3, 3.1, 0.5], [6, 2.8, 0]], i));
    const F = G.frameOf([cx, cy, FLOOR + 6], G.cross3(u, [0, 0, 1]), u, [0, 0, 1]);
    const poly = [[6, 0], [R, 0], [R, 2.6], [6, 4.4]];
    rec(A.prism(F, poly, -1.9, 1.9, { name: "chair.arm" }));
    out.push(S(G.prismOf(F, poly, -1.9, 1.9, P), { tone: "mid", crease: "lo" }));
  });
  // Hub, gas column and the tilt mechanism under the seat.
  rc(cx, cy, 6, FLOOR + 6, 6, "chair.hub");
  out.push(S(cyl(cx, cy, 6, FLOOR + 6, 6, 24, 0.6), { tone: "mid" }));
  rc(cx, cy, 3, FLOOR + 12, seatZ - 5 - FLOOR - 12, "chair.column");
  out.push(S(cyl(cx, cy, 3, FLOOR + 12, seatZ - 5 - FLOOR - 12, 20), { tone: "hi", crease: "lo" }));
  const mech = { x: cx - 17, y: cy - 17, w: 34, d: 34, r: 3 };
  rs(mech, seatZ - 5, 5, "chair.mechanism");
  out.push(S(slab(mech, seatZ - 5, 5, 3, 0.4), { tone: "lo" }));
  // Seat cushion, then the spine and the backrest facing away from the desk.
  const seat = { x: cx - SEAT / 2, y: cy - SEAT / 2, w: SEAT, d: SEAT, r: 10 };
  rs(seat, seatZ, 9, "chair.seat");
  out.push(S(slab(seat, seatZ, 9, 6, 2), { tone: "mid", inner: seamOn(seat, seatZ + 3, 6) }));
  const spine = { x: cx - 4, y: cy + SEAT / 2 - 8, w: 8, d: 6, r: 1 };
  rs(spine, seatTop, backZ + 14 - seatTop, "chair.spine");
  out.push(S(slab(spine, seatTop, backZ + 14 - seatTop, 3, 0.4), { tone: "lo" }));
  const BF = G.frameOf([cx - SEAT / 2 + 3, cy + SEAT / 2 - 2, backZ], [0, -1, 0], [1, 0, 0], [0, 0, 1]);
  const back = k.roundedPlan({ x: 0, y: 0, w: SEAT - 6, d: backTop - backZ, r: 12 }, 5);
  rec(A.prism(BF, back, -5, 0, { name: "chair.back" }));
  out.push(S(G.prismOf(BF, back, -5, 0, P), { tone: "mid", crease: "lo" }));
  return out.join("");
}

// ------------------------------------------------------------------ iPad (cv)
function ipad() {
  owner = "cv";
  const out = [halo(PAD, 0, 2)];
  // Aluminium body with rounded edges; the glass sits flush in its top face.
  rs(PAD, 0, PAD_H, "cv.ipad");
  out.push(S(slab(PAD, 0, PAD_H, 6, 0.5), { tone: "mid" }));
  out.push(padScreen());
  // Volume buttons on the right long edge, ahead of the pencil.
  const side = PAD.x + PAD.w;
  out.push(L([[PAD.y + 3, PAD.y + 5.4], [PAD.y + 6.2, PAD.y + 8.6]].map(([a, b]) => k.pathOf([at([side, a, PAD_H * 0.55]), at([side, b, PAD_H * 0.55])])).join(""), { tone: "lo", free: true }));
  return out.join("") + applePencil();
}

// The screen, drawn in the top plane (local x along +x, local y toward the viewer): the CV open as a PDF page.
function padScreen() {
  const { w, d } = PAD;
  const M = planeMatrix([PAD.x, PAD.y, PAD_H], [1, 0, 0], [0, 1, 0]);
  const glass = rr(0.7, 0.7, w - 0.7, d - 0.7, PAD.r - 0.7);
  const area = rr(2.4, 2.4, w - 2.4, d - 2.4, 1.6);
  const id = clipId("pad");
  const pg = { x0: 5, y0: 6.2, x1: w - 5, y1: d - 9.6 };
  const page = rr(pg.x0, pg.y0, pg.x1, pg.y1, 0.4, 2);
  const rule = (y, x, len) => `M${x} ${y}h${len}`;
  const hx = pg.x0 + 9.5;
  const head = [rule(pg.y0 + 3.4, hx, 15), rule(pg.y0 + 5.6, hx, 10), rule(pg.y0 + 7.4, hx, 12)];
  const dividers = [pg.y0 + 10.6, pg.y0 + 24].map((y) => `M${pg.x0} ${y}H${pg.x1}`).join("");
  const body = [];
  const bullets = [];
  const titles = [];
  [[pg.y0 + 13, [18, 21, 15, 19]], [pg.y0 + 26.4, [20, 14, 22]]].forEach(([y0, lens]) => {
    titles.push(rule(y0, pg.x0 + 1.6, 8));
    lens.forEach((len, i) => {
      const y = y0 + 2.6 + i * 2;
      bullets.push(`<circle class="wb-pdf-dot" cx="${pg.x0 + 2}" cy="${y}" r="0.32"/>`);
      body.push(rule(y, pg.x0 + 3.2, Math.min(len, pg.x1 - pg.x0 - 4.8)));
    });
  });
  // Toolbar under the page: a page counter and a download button.
  const by = d - 7.4;
  const btn = rr(w / 2 - 6, by - 1.5, w / 2 + 6, by + 1.5, 1.5, 3);
  const picture = [
    `<path class="wb-glow" d="${rr(4, 4, w - 4, d - 4, 8, 6)}"/>`,
    L(`M4.4 4.4h4M${w - 9} 4.4h4.6`, { tone: "faint", free: true }),
    `<path class="wb-page" d="${page}"/>`,
    L(page, { tone: "lo" }),
    `<g class="wb-pdf">`,
    `<circle class="wb-pdf-photo" cx="${pg.x0 + 4.4}" cy="${pg.y0 + 5}" r="2.8"/>`,
    `<text class="wb-pdf-title" x="${hx}" y="${pg.y0 + 4.6}" font-size="4.4">CV</text>`,
    L(head.slice(1).join(""), { tone: "lo", free: true }),
    L(dividers, { tone: "lo" }),
    L(titles.join(""), { tone: "mid", free: true }),
    L(body.join(""), { tone: "lo", free: true }),
    bullets.join(""),
    `</g>`,
    `<path class="wb-pdf-btn" d="${btn}"/>`,
    `<path class="wb-pdf-arrow" d="M${w / 2 - 3.4} ${by - 1}v1.8M${w / 2 - 4.2} ${by}l0.8 0.8l0.8 -0.8M${w / 2 - 1.4} ${by}h4.8"/>`,
    `<text class="wb-screen-text" x="5" y="${by + 0.6}" font-size="1.6">1/2</text>`,
    L(`M${w / 2 - 5} ${d - 3.6}h10`, { tone: "mid", free: true }),
  ].join("");
  return [
    `<g transform="${M}">`,
    `<path class="wb-glass" d="${glass}"/>`,
    `<clipPath id="${id}"><path d="${area}"/></clipPath>`,
    `<g clip-path="url(#${id})"><path class="wb-display" d="${area}"/>${picture}</g>`,
    `<circle class="wb-cam" cx="${w / 2}" cy="1.55" r="0.42"/>`,
    L(glass, { tone: "lo" }),
    `</g>`,
  ].join("");
}

// Apple Pencil lying along y against the iPad's right edge: a conical tip, a long white barrel, a flat-cut end.
function applePencil() {
  const { x, y0, len, r } = PENCIL;
  const F = G.frameAlong([x, y0, r], [0, 1, 0]);
  const profile = [[0, 0.2], [1, 0.5], [5.2, r], [len - 0.6, r], [len, r * 0.82]];
  rec(A.solid(F, profile, { name: "cv.pencil" }));
  const seams = [5.2, len - 9].map((s) => G.arcOf(F, s, r, P, { least: 0.05 })).join("");
  return (
    halo({ x: x - r, y: y0, w: 2 * r, d: len, r }, 0, 1) +
    S(G.solidOf(profile, F, P), { tone: "hi", crease: "lo", inner: L(seams, { tone: "faint" }) }) +
    L(G.arcOf(F, len, r * 0.5, P, { least: -1 }), { tone: "lo" })
  );
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
const OBJECTS = {
  projects: laptop(),
  experience: notebook(),
  contact: phone(),
  about: `<g ${liftAt(1)}>${(owner = "about", wallFrame(FRAMES.about, { sheen: true }))}</g>`,
  cv: ipad(),
};
// Painter's order of whole objects, far to near (by footprint centre).
const centres = {
  projects: [LAP.x + LAP.w / 2, LAP.y + LAP.d / 2, 0],
  experience: [NB.x + NB.w / 2, NB.y + NB.d / 2, 0],
  contact: [STAND.x + STAND.w / 2, STAND.y + STAND.d / 2, 0],
  about: [FRAMES.about.cx, WALL_Y, 0],
  cv: [PAD.x + PAD.w / 2, PAD.y + PAD.d / 2, 0],
};
const ORDER = Object.keys(OBJECTS).sort((a, b) => depth(centres[a]) - depth(centres[b]));
const DESK_ART = room() + desk() + plants() + lamp() + mateSet();
const CHAIR_FLOOR = chair(); // drawn on the sitting-height floor, as recorded for the audit
const CHAIR_ART = `<g ${liftAt(1)}>${CHAIR_FLOOR}</g>`;

// Motion vectors in screen units per world unit.
const MOVES = {
  lift: k.axisVector(P, [0, 0, 1]),
  out: k.axisVector(P, [1, 0, 0]),
};

// Camera targets: the projected bounding box of each object at full travel, padded, in viewBox units.
const extents = {
  projects: [k.boxCorners(LAP, 0, LAP_H), [0, LAP.w].flatMap((x) => [onFrame(LID_F, x, LID_H, 0), onFrame(LID_F, x, LID_H, -LID_T)])],
  experience: [k.boxCorners({ ...NB, w: NB.w + TAB.w + TAB_OUT, d: NB.d + 7 }, 0, 2 * NB_COVER + NB_PAGES)],
  contact: [k.boxCorners(STAND, 0, STAND_H), [-1, 1].map((side) => onFrame(PH_F, (side * PH.w) / 2, PH.h, 0))],
  // The frame hangs at the start height's floor; the camera keeps it there (ON_FLOOR in the generated module).
  about: [k.boxCorners({ x: FRAMES.about.cx - (FRAMES.about.w * CM) / 2, y: WALL_Y, w: FRAMES.about.w * CM, d: FRAME.depth }, FLOOR + (FRAMES.about.bottom - (HEIGHT_CM.start - HEIGHT_CM.min)) * CM, FLOOR + (FRAMES.about.bottom + FRAMES.about.h - (HEIGHT_CM.start - HEIGHT_CM.min)) * CM)],
  cv: [k.boxCorners({ ...PAD, w: PAD.w + 2 * PENCIL.r + 0.4 }, 0, 4)],
};
const FOCUS = Object.fromEntries(
  Object.entries(extents).map(([id, boxes]) => {
    const points = boxes.flat().map(at);
    const pad = 10;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const x = Math.min(...xs) - pad;
    const y = Math.min(...ys) - pad;
    const round = (v) => Math.round(v * 10) / 10;
    return [id, { x: round(x), y: round(y), w: round(Math.max(...xs) + pad - x), h: round(Math.max(...ys) + pad - y) }];
  }),
);

const LABEL = `A desk seen from above at an angle: an open laptop whose screen shows a project and a dock of ${projects.length} project icons, a hardcover notebook with ${experience.length} divider tabs, one per job, a phone on a MagSafe stand, an iPad lying flat with the CV open on its screen and a pencil attached to its edge, a mate gourd with a bombilla in front of a tall thermos printed with the owner's name, a framed photo of the owner on the wall, a desk lamp, three potted plants, a snake plant, a cactus and a succulent, and an office chair pulled out in front. Each object opens one section of the portfolio.`;

// ------------------------------------------------------------------ audit
// Items in the real paint order (desk, then whole objects back to front); the audit checks that order.
["desk", ...ORDER, "chair"].forEach((id, index) => {
  R.put({ name: id, at: [0, 0, 0], key: index, svg: id === "desk" ? DESK_ART : id === "chair" ? CHAIR_FLOOR : OBJECTS[id], shapes: SHAPES[id] ?? [] });
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
export const MOVES = ${JSON.stringify(MOVES)} as { lift: [number, number]; out: [number, number] };
export const TRAVEL = ${JSON.stringify({ dock: DOCK_LIFT, card: TAB_OUT })} as const;
export const DESK_HEIGHT = ${JSON.stringify({ ...HEIGHT_CM, rise: RISE })} as const;
export const COUNTS = ${JSON.stringify({ projects: projects.length, experience: experience.length })} as const;
export const SCREENS = ${JSON.stringify(SCREENS)} as const;
export const LABEL = ${JSON.stringify(LABEL)};
export const ORDER = ${JSON.stringify(ORDER)} as const;
export const ON_FLOOR = ["about"] as const;
export const FOCUS = ${JSON.stringify(FOCUS)} as Record<(typeof ORDER)[number], { x: number; y: number; w: number; h: number }>;
export const DESK = ${JSON.stringify(DESK_ART)};
export const OBJECTS: Record<string, string> = ${JSON.stringify(OBJECTS)};
export const CHAIR = ${JSON.stringify(CHAIR_ART)};
`;
writeFileSync(join(ROOT, "src/figures/workbench/art.generated.ts"), generated);
writeFileSync(join(ROOT, "public/workbench/art.json"), JSON.stringify({ desk: DESK_ART, objects: OBJECTS, chair: CHAIR_ART }));
await Promise.all(Object.entries(FRAMES).map(([name, frame]) => bakePicture(frame, name === "about" ? PICTURE_WIDTH.about : PICTURE_WIDTH.decor)));

// Standalone preview: same art and CSS, a tiny script that mimics hover so captures can show states.
const css = readFileSync(join(ROOT, "src/figures/workbench/workbench.css"), "utf8");
const objectsSvg = ORDER.map((id) => `<g class="wb-obj" data-obj="${id}" role="button" tabindex="0" aria-label="${id}">${OBJECTS[id]}</g>`).join("");
const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: LABEL, body: [`<g data-scene="">${DESK_ART}${objectsSvg}<g class="wb-chair">${CHAIR_ART}</g></g>`] });
const previewScript = `
const q = new URLSearchParams(location.search);
const hot = q.get("hot"), active = q.get("active"), open = q.get("open");
const M = ${JSON.stringify(MOVES)};
const T = ${JSON.stringify({ dock: DOCK_LIFT, card: TAB_OUT })};
document.querySelectorAll(".wb-obj").forEach((g) => {
  if (g.dataset.obj === hot) g.setAttribute("data-hot", "");
  if (g.dataset.obj === active) g.setAttribute("data-active", "");
});
const rise = Number(q.get("rise") ?? ${(HEIGHT_CM.start - HEIGHT_CM.min) / (HEIGHT_CM.max - HEIGHT_CM.min)}); // 0 sitting … 1 full height
document.querySelectorAll("[data-lift]").forEach((g) => {
  const by = -${RISE} * rise * Number(g.dataset.lift);
  g.setAttribute("transform", "translate(" + M.lift[0] * by + " " + M.lift[1] * by + ")");
});
const top = ${RISE} * (rise - ${(HEIGHT_CM.start - HEIGHT_CM.min) / (HEIGHT_CM.max - HEIGHT_CM.min)}); // the floor stays, the top moves
document.querySelector("[data-scene]")?.setAttribute("transform", "translate(" + M.lift[0] * top + " " + M.lift[1] * top + ")");
const hText = document.querySelector('[data-part="height"]');
if (hText) hText.textContent = (${HEIGHT_CM.min} + ${HEIGHT_CM.max - HEIGHT_CM.min} * rise).toFixed(1);
if (open) {
  document.querySelectorAll('[data-part^="card-"]').forEach((g, i) => { const s = T.card * (i === 1 ? 1 : 0.18); g.setAttribute("transform", "translate(" + M.out[0] * s + " " + M.out[1] * s + ")"); });
  document.querySelectorAll('[data-part^="dock-"]').forEach((g, i) => { if (i === 0) { g.setAttribute("transform", "translate(0 " + -T.dock + ")"); g.querySelector(".wb-dock-led")?.setAttribute("data-on", ""); } });
  document.querySelector('[data-part="phone"]')?.setAttribute("data-ringing", "");
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
