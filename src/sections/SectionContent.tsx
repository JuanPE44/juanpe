import { contact, experience, profile, projects, stack } from "@/content";
import { About } from "./About";
import { Contact } from "./Contact";
import { Cv } from "./Cv";
import { Experience } from "./Experience";
import { Projects } from "./Projects";
import type { SectionId } from "./sections";

/**
 * Container: binds content data to the presentational section for an id.
 * Used by both the spec sheet and the no-JS fallback.
 */
export function SectionContent({ id }: { id: SectionId }) {
  switch (id) {
    case "about":
      return <About profile={profile} />;
    case "projects":
      return <Projects projects={projects} />;
    case "experience":
      return <Experience entries={experience} />;
    case "contact":
      return <Contact contact={contact} />;
    case "cv":
      return <Cv profile={profile} stack={stack} />;
  }
}
