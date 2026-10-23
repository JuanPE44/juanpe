# newportafolio

Personal portfolio: a single static page with a dark retro-workstation look.
The hero shows an interactive isometric workbench; each object on the desk
opens a section (projects, about, stack, experience, contact) in a side panel.
Every section is also rendered as plain scrollable HTML, so the page works
without JavaScript.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
static export (`output: "export"`).

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static site in out/
npm run lint
```

`out/` can be served by any static host. Set `SITE_URL` at build time so
Open Graph and canonical URLs are absolute:

```bash
SITE_URL=https://your-domain.com npm run build
```

## Edit content

All text and data live in `src/content/` and nowhere else:

| File | What |
| --- | --- |
| `profile.ts` | name, role, tagline, bio, facts, CV link |
| `projects.ts` | project cards |
| `stack.ts` | skills by group |
| `experience.ts` | roles and dates |
| `contact.ts` | intro, email and channels |

Types are in `src/content/types.ts`. Section order and labels are in
`src/sections/sections.ts`. Colors and fonts are tokens at the top of
`src/app/globals.css`.

## CV

Replace `public/cv.pdf` with your CV (same file name). The "Download CV"
button points to `profile.cvUrl` (`/cv.pdf`).

## Regenerate the figure

The workbench geometry is built from `tools/anatomy/workbench.build.mjs`
into `src/figures/workbench/art.generated.ts` (do not edit that file by hand).

```bash
npm run figure:workbench   # rebuild art.generated.ts + preview pages in tools/anatomy/out/
npm run figure:audit       # rebuild and check painter's order / overlaps
```

The laptop screen text and object counts come from `src/content`, so rerun
`figure:workbench` after changing the number of projects, stack groups or
roles.

## Other assets

- Share image: `public/og.png` (1200x630). Apple icon:
  `public/apple-touch-icon.png`. Favicon: `public/icon.svg`.
- Fonts: IBM Plex Sans/Mono woff2 files in `src/app/fonts/`, loaded with
  `next/font/local` (no network needed at build time).
