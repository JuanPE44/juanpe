import type { Profile } from "@/content";

export function About({ profile }: { profile: Profile }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-sm tracking-widest text-accent">
          <span aria-hidden="true">&gt; </span>
          {profile.role.toUpperCase()}
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{profile.name}</p>
        <p className="mt-3 text-lg leading-relaxed">{profile.tagline}</p>
        <p className="mt-2 font-mono text-xs tracking-widest text-muted">{profile.location}</p>
      </div>
      <div className="space-y-4 text-muted">
        {profile.bio.map((paragraph) => (
          <p key={paragraph} className="leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
      <dl className="grid grid-cols-1 gap-3 @md:grid-cols-3">
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
