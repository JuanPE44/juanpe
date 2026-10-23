import type { Profile, StackGroup } from "@/content";
import { Stack } from "./Stack";

/** CV summary: who, where, the key facts, the stack, and the PDF download. */
export function Cv({ profile, stack }: { profile: Profile; stack: StackGroup[] }) {
  return (
    <div className="space-y-6">
      <p className="leading-relaxed text-muted">
        {profile.name} · {profile.role}. {profile.bio[0]}
      </p>
      <a
        href={profile.cvUrl}
        download
        className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-accent px-4 py-2 font-mono text-sm uppercase tracking-widest text-bg transition-colors hover:bg-text"
      >
        Download CV <span className="normal-case tracking-normal">(PDF)</span>
      </a>
      <dl className="divide-y divide-line border-y border-line font-mono text-sm">
        {[{ label: "BASE", value: profile.location }, ...profile.facts].map((fact) => (
          <div key={fact.label} className="flex justify-between gap-4 py-2">
            <dt className="tracking-widest text-muted">{fact.label}</dt>
            <dd className="text-right text-text">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-3">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted">Stack</h3>
        <Stack groups={stack} />
      </div>
    </div>
  );
}
