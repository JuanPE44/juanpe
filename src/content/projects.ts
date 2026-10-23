/**
 * PROJECTS CONTENT — edit me.
 * src/content/ is the ONLY place to edit portfolio content.
 */
import type { Project } from "./types";

export const projects: Project[] = [
  {
    slug: "exactamente",
    title: "Exactamente",
    year: "Active",
    summary:
      "Collaborative platform for university students to search, share and manage academic resources. 200+ daily users and 4,000+ resources, now scaling to multiple universities.",
    role: "Solo project",
    tags: ["React", "Astro", "Tailwind CSS", "Node.js", "Hono", "Drizzle ORM", "PostgreSQL"],
    links: [{ label: "Live", href: "https://www.exactamente.com.ar" }],
  },
  {
    slug: "poky",
    title: "Poky",
    year: "2025",
    summary:
      "Open knowledge protocol storing modular content on IPFS/Filecoin with on-chain metadata. I co-designed the idea and built the reference frontend: a Next.js app that reads modules and tracks straight from the protocol, no backend.",
    role: "ETHGlobal Buenos Aires",
    tags: ["Next.js", "Solidity", "IPFS", "Wagmi", "The Graph", "Filecoin"],
    links: [
      { label: "Showcase", href: "https://ethglobal.com/showcase/poky-xiko4" },
      { label: "Code", href: "https://github.com/JuanPE44/Poky" },
    ],
  },
  {
    slug: "chabit",
    title: "Chabit Website & UI Library",
    year: "2025",
    summary:
      "Production website with 3D scenes and GSAP motion, plus an internal component library for React and React Native shared across every company app.",
    role: "Software Developer",
    tags: ["Astro", "React", "React Native", "Three.js", "GSAP", "Storybook"],
    links: [{ label: "Live", href: "https://chabit.io/" }],
  },
  {
    slug: "primarket",
    title: "Primarket Platform",
    year: "2025",
    summary:
      "Argentina's first digital network for B2B raw-materials trade. Responsive interfaces, reusable components and theme work for the initial product.",
    role: "Frontend Developer",
    tags: ["Next.js", "Material UI", "TypeScript"],
    links: [],
  },
];
