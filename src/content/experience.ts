/**
 * EXPERIENCE CONTENT — edit me.
 * src/content/ is the ONLY place to edit portfolio content.
 * All data below is placeholder.
 */
import type { ExperienceEntry } from "./types";

export const experience: ExperienceEntry[] = [
  {
    company: "Northwind Labs",
    role: "Senior Frontend Engineer",
    period: "2023 — Present",
    location: "Remote",
    highlights: [
      "Lead the design system used across 4 product squads.",
      "Drove an accessibility program that took core flows to WCAG AA.",
    ],
  },
  {
    company: "Helix Analytics",
    role: "Frontend Engineer",
    period: "2020 — 2023",
    location: "Buenos Aires",
    highlights: [
      "Built real-time dashboards rendering live telemetry at 60fps.",
      "Introduced visual regression testing; cut UI bugs in prod by ~40%.",
    ],
  },
  {
    company: "Pixel & Bolt Studio",
    role: "UI Developer",
    period: "2018 — 2020",
    location: "Buenos Aires",
    highlights: [
      "Shipped marketing sites and e-commerce frontends for 20+ clients.",
    ],
  },
];
