/**
 * STACK CONTENT — edit me.
 * src/content/ is the ONLY place to edit portfolio content.
 * All data below is placeholder.
 */
import type { StackGroup } from "./types";

export const stack: StackGroup[] = [
  {
    id: "core",
    label: "Core",
    items: ["TypeScript", "React", "Next.js", "HTML", "CSS"],
  },
  {
    id: "ui",
    label: "UI & Motion",
    items: ["Tailwind CSS", "CSS Modules", "Framer Motion", "SVG", "Canvas"],
  },
  {
    id: "quality",
    label: "Quality",
    items: ["Vitest", "Testing Library", "Playwright", "Storybook", "axe"],
  },
  {
    id: "tooling",
    label: "Tooling",
    items: ["Vite", "Turborepo", "GitHub Actions", "Figma"],
  },
];
