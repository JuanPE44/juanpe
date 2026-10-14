import type { Profile } from "@/content";

export function About({ profile }: { profile: Profile }) {
  return (
    <div className="space-y-6">
      <div className="space-y-4 text-muted">
        {profile.bio.map((paragraph) => (
          <p key={paragraph} className="leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {profile.facts.map((fact) => (
          <div
            key={fact.label}
            className="rounded-[var(--radius)] border border-line bg-surface-raised px-4 py-3"
          >
            <dt className="font-mono text-xs tracking-widest text-muted">
              {fact.label}
            </dt>
            <dd className="mt-1 font-mono text-accent">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
