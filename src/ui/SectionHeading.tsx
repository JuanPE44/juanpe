type SectionHeadingProps = {
  /** Mono index readout, e.g. "02". */
  index: string;
  title: string;
  id?: string;
  /** Heading level; panels reuse sections, so the level can change. */
  level?: 2 | 3;
};

export function SectionHeading({
  index,
  title,
  id,
  level = 2,
}: SectionHeadingProps) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div className="mb-6 flex items-baseline gap-3 border-b border-line pb-3">
      <span aria-hidden="true" className="font-mono text-sm text-accent">
        {index}
      </span>
      <Heading id={id} className="text-2xl font-semibold tracking-tight">
        {title}
      </Heading>
    </div>
  );
}
