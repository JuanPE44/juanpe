import type { Project } from "@/content";
import { ExternalLink } from "@/ui/ExternalLink";
import { Panel } from "@/ui/Panel";
import { Tag } from "@/ui/Tag";

export function Projects({ projects }: { projects: Project[] }) {
  return (
    <ul className="grid gap-4">
      {projects.map((project) => (
        <li key={project.slug}>
          <Panel as="article" label={`${project.year} · ${project.role}`}>
            <h3 className="text-lg font-semibold">{project.title}</h3>
            <p className="mt-2 leading-relaxed text-muted">{project.summary}</p>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Technologies">
              {project.tags.map((tag) => (
                <li key={tag}>
                  <Tag>{tag}</Tag>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-4 font-mono text-sm">
              {project.links.map((link) => (
                <ExternalLink key={link.href} href={link.href}>
                  {link.label}
                </ExternalLink>
              ))}
            </div>
          </Panel>
        </li>
      ))}
    </ul>
  );
}
