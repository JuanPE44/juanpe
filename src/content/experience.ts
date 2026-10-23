/**
 * EXPERIENCE CONTENT — edit me.
 * src/content/ is the ONLY place to edit portfolio content.
 */
import type { ExperienceEntry } from "./types";

export const experience: ExperienceEntry[] = [
  {
    company: "Chabit",
    role: "Software Developer",
    period: "Sept 2025 — Present",
    location: "Hybrid",
    highlights: [
      "Led the website build with Astro and React on a scalable, performance-first architecture.",
      "Shipped 3D scenes and advanced animations with Three.js, Spline and GSAP, with lazy loading and asset budgets.",
      "Built an internal React / React Native component library, documented in Storybook and published via GitHub Packages.",
      "Worked directly with the client's founders on product and UX/UI decisions.",
    ],
  },
  {
    company: "Primarket",
    role: "Frontend Developer",
    period: "Apr 2025 — Sept 2025",
    location: "Remote",
    highlights: [
      "Built interfaces for a B2B raw-materials marketplace with Next.js and Material UI in a Scrum team.",
      "Created and refactored reusable components from design specs and team feedback.",
      "Kept views scalable, fast, responsive and accessible.",
    ],
  },
  {
    company: "Mamparas Esmeralda",
    role: "Freelance Frontend Developer",
    period: "Apr 2024 — Jun 2024",
    location: "Remote",
    highlights: [
      "Planned, designed and built the company website with Astro.",
      "Optimized SEO and performance; added product and promotions sections.",
    ],
  },
  {
    company: "Professional Internship",
    role: "Full-stack Developer",
    period: "Mar 2023 — Dec 2023",
    location: "Tandil",
    highlights: [
      "Worked on team projects during the final year of my programming technical degree.",
    ],
  },
];
