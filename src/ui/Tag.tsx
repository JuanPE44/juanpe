import type { ReactNode } from "react";

/** Small mono chip for technologies / keywords. */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-sm border border-line-strong px-2 py-0.5 font-mono text-xs text-muted">
      {children}
    </span>
  );
}
