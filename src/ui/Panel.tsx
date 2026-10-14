import type { ComponentPropsWithoutRef, ElementType } from "react";

type PanelProps<T extends ElementType> = {
  as?: T;
  /** Optional mono label rendered as a readout in the top-left corner. */
  label?: string;
} & ComponentPropsWithoutRef<T>;

/** Framed surface: the basic "machine housing" of the UI. */
export function Panel<T extends ElementType = "div">({
  as,
  label,
  className = "",
  children,
  ...rest
}: PanelProps<T>) {
  const Tag = as ?? "div";
  return (
    <Tag
      className={`relative rounded-[var(--radius)] border border-line bg-surface p-5 ${className}`}
      {...rest}
    >
      {label ? (
        <span className="mb-3 block font-mono text-xs uppercase tracking-widest text-muted">
          {label}
        </span>
      ) : null}
      {children}
    </Tag>
  );
}
