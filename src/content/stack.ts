/**
 * STACK CONTENT — edit me.
 * src/content/ is the ONLY place to edit portfolio content.
 */
import type { StackGroup } from "./types";

export const stack: StackGroup[] = [
  {
    id: "languages",
    label: "Languages",
    items: ["TypeScript", "JavaScript", "HTML / CSS", "Go"],
  },
  {
    id: "frontend",
    label: "Frontend",
    items: ["React", "Next.js", "Astro", "Tailwind CSS"],
  },
  {
    id: "backend",
    label: "Backend",
    items: ["Node.js", "NestJS", "Express", "Drizzle ORM", "SQL"],
  },
  {
    id: "motion",
    label: "3D & Tools",
    items: ["Three.js", "GSAP", "Spline", "Git", "Figma", "Vite"],
  },
  {
    id: "web3",
    label: "Web3",
    items: ["Solidity", "Ethereum"],
  },
];
