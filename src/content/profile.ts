/**
 * PROFILE CONTENT — edit me.
 * src/content/ is the ONLY place to edit portfolio content.
 */
import type { Profile } from "./types";

export const profile: Profile = {
  name: "Juan Peñalba",
  role: "Software Developer",
  tagline:
    "I build web products end to end, from the database to the last frame of an animation.",
  location: "Buenos Aires, AR",
  bio: [
    "Software developer working across the stack with TypeScript: React, Next.js and Astro on the front, Node.js and SQL on the back.",
    "I built and run Exactamente, a platform where university students share academic resources, and I've shipped 3D-heavy marketing sites, component libraries and B2B product interfaces for clients.",
    "Systems Engineering student at UNICEN, with a technical degree in computer programming.",
  ],
  facts: [
    { label: "USERS", value: "200+ daily" },
    { label: "RESOURCES", value: "4,000+" },
    { label: "STATUS", value: "Open to roles" },
  ],
  cvUrl: "/cv.pdf",
};
