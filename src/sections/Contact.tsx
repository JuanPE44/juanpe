import type { Contact as ContactData } from "@/content";
import { ExternalLink } from "@/ui/ExternalLink";

export function Contact({ contact }: { contact: ContactData }) {
  return (
    <div className="space-y-6">
      <p className="leading-relaxed text-muted">{contact.intro}</p>
      <a
        href={`mailto:${contact.email}`}
        className="inline-block rounded-[var(--radius)] border border-accent px-4 py-2 font-mono text-accent hover:bg-accent hover:text-bg"
      >
        {contact.email}
      </a>
      <dl className="grid gap-3 @md:grid-cols-2">
        {contact.channels.map((channel) => (
          <div key={channel.href}>
            <dt className="font-mono text-xs tracking-widest text-muted">
              {channel.label.toUpperCase()}
            </dt>
            <dd className="mt-1">
              <ExternalLink href={channel.href}>{channel.value}</ExternalLink>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
