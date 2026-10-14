import { SECTIONS } from "./sections";

/** Top bar with anchor links to every section. Works without JS. */
export function SectionNav({ name }: { name: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
      >
        <a href="#main" className="font-mono text-sm tracking-widest text-accent">
          {name.toUpperCase()}
        </a>
        <ul className="flex gap-4 overflow-x-auto font-mono text-xs uppercase tracking-widest text-muted">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="hover:text-accent">
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
