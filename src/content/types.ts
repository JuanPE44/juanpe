/**
 * CONTENT TYPES
 * ------------------------------------------------------------------
 * src/content/ is the ONLY place to edit portfolio content.
 * Components never hardcode copy; they read from these typed objects.
 */

export interface Profile {
  name: string;
  role: string;
  /** One-line positioning message shown in the hero. */
  tagline: string;
  location: string;
  /** Short bio paragraphs for the About section. */
  bio: string[];
  /** Small key/value readouts (e.g. years of experience). */
  facts: { label: string; value: string }[];
  /** Public path to the CV file (place it in /public). */
  cvUrl: string;
}

export interface Project {
  slug: string;
  title: string;
  year: string;
  summary: string;
  role: string;
  tags: string[];
  links: { label: string; href: string }[];
}

export interface StackGroup {
  id: string;
  label: string;
  items: string[];
}

export interface ExperienceEntry {
  company: string;
  role: string;
  period: string;
  location: string;
  highlights: string[];
}

export interface ContactChannel {
  label: string;
  value: string;
  href: string;
}

export interface Contact {
  intro: string;
  email: string;
  channels: ContactChannel[];
}
