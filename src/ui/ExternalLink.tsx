import type { ComponentPropsWithoutRef } from "react";

type ExternalLinkProps = Omit<ComponentPropsWithoutRef<"a">, "target" | "rel">;

/** Link that opens in a new tab safely and announces it to screen readers. */
export function ExternalLink({
  children,
  className = "",
  ...rest
}: ExternalLinkProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={`text-accent underline decoration-accent-dim underline-offset-4 hover:decoration-accent ${className}`}
      {...rest}
    >
      {children}
      <span aria-hidden="true"> ↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
