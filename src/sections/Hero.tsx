import type { ReactNode } from "react";
import type { Profile } from "@/content";

const buttonBase =
  "inline-flex items-center rounded-[var(--radius)] px-4 py-2 font-mono text-sm uppercase tracking-widest transition-colors";

/** Hero copy + primary CTAs. `figure` slot hosts the Workbench. */
export function Hero({ profile, figure }: { profile: Profile; figure: ReactNode }) {
  return (
    <section
      aria-labelledby="hero-title"
      className="grid items-center gap-10 py-16 md:grid-cols-[1fr_1.1fr] md:py-24"
    >
      <div>
        <p className="font-mono text-sm tracking-widest text-accent">
          <span aria-hidden="true">&gt; </span>
          {profile.role.toUpperCase()}
        </p>
        <h1 id="hero-title" className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          {profile.name}
        </h1>
        <p className="mt-5 max-w-prose text-lg leading-relaxed text-muted">
          {profile.tagline}
        </p>
        <p className="mt-2 font-mono text-xs tracking-widest text-muted">
          {profile.location}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#projects" className={`${buttonBase} bg-accent text-bg hover:bg-text`}>
            View projects
          </a>
          <a
            href={profile.cvUrl}
            download
            className={`${buttonBase} border border-accent text-accent hover:bg-accent hover:text-bg`}
          >
            Download CV
          </a>
          <a
            href="#contact"
            className={`${buttonBase} border border-line-strong text-text hover:border-accent hover:text-accent`}
          >
            Contact
          </a>
        </div>
      </div>
      {figure}
    </section>
  );
}
