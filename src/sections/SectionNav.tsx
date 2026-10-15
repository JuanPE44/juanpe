import { SECTIONS } from "./sections";

/** Top bar with anchor links to every section. Works without JS. */
export function SectionNav({ name }: { name: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-1 sm:px-6"
      >
        <a href="#main" className="shrink-0 whitespace-nowrap py-2 font-mono text-sm tracking-widest text-accent">
          {name.toUpperCase()}
        </a>
        {/* Phones: links scroll sideways, the right edge fades to hint at more. */}
        <ul className="flex min-w-0 gap-4 overflow-x-auto font-mono text-xs uppercase tracking-widest text-muted [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none] sm:[mask-image:none]">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="inline-block whitespace-nowrap py-2 hover:text-accent">
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
