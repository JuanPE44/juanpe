/**
 * PROJECTS CONTENT — edit me.
 * src/content/ is the ONLY place to edit portfolio content.
 * All data below is placeholder.
 */
import type { Project } from "./types";

export const projects: Project[] = [
  {
    slug: "atlas-ds",
    title: "Atlas Design System",
    year: "2025",
    summary:
      "Token-driven component library powering 4 product teams. Cut UI inconsistencies and halved time-to-ship for new screens.",
    role: "Lead frontend engineer",
    tags: ["React", "TypeScript", "Design tokens", "Storybook"],
    links: [
      { label: "Case study", href: "https://example.com/atlas" },
      { label: "Code", href: "https://github.com/example/atlas" },
    ],
  },
  {
    slug: "signal-dashboard",
    title: "Signal Ops Dashboard",
    year: "2024",
    summary:
      "Real-time monitoring UI rendering thousands of live data points at 60fps with virtualized tables and canvas charts.",
    role: "Frontend engineer",
    tags: ["Next.js", "Canvas", "WebSockets", "Performance"],
    links: [{ label: "Demo", href: "https://example.com/signal" }],
  },
  {
    slug: "kiosk-checkout",
    title: "Kiosk Checkout Flow",
    year: "2023",
    summary:
      "Touch-first checkout for retail kiosks. WCAG AA, offline-tolerant, and tuned for one-handed use.",
    role: "UI engineer",
    tags: ["React", "Accessibility", "PWA"],
    links: [{ label: "Case study", href: "https://example.com/kiosk" }],
  },
];
