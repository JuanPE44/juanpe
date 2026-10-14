import { contact, experience, profile, projects, stack } from "@/content";
import { About } from "./About";
import { Contact } from "./Contact";
import { Experience } from "./Experience";
import { Projects } from "./Projects";
import { Stack } from "./Stack";
import type { SectionId } from "./sections";

/**
 * Container: binds content data to the presentational section for an id.
 * Used by both the scrollable page and the detail panel.
 */
export function SectionContent({ id }: { id: SectionId }) {
  switch (id) {
    case "about":
      return <About profile={profile} />;
    case "projects":
      return <Projects projects={projects} />;
    case "stack":
      return <Stack groups={stack} />;
    case "experience":
      return <Experience entries={experience} />;
    case "contact":
      return <Contact contact={contact} />;
  }
}
