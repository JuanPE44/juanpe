import type { ExperienceEntry } from "@/content";

export function Experience({ entries }: { entries: ExperienceEntry[] }) {
  return (
    <ol className="space-y-6 border-l border-line pl-6">
      {entries.map((entry, i) => (
        <li key={`${entry.company}-${entry.period}`} className="relative" data-pick={i}>
          <span
            aria-hidden="true"
            className="absolute -left-[29px] top-2 h-2 w-2 rounded-full bg-accent"
          />
          <p className="font-mono text-xs tracking-widest text-muted">
            {entry.period} · {entry.location}
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            {entry.role} <span className="text-muted">@ {entry.company}</span>
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted marker:text-accent-dim">
            {entry.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
