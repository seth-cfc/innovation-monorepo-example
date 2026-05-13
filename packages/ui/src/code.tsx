import { type JSX } from "react";

export function Code({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <code
      className={
        className ??
        "rounded bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-sm font-semibold"
      }
    >
      {children}
    </code>
  );
}
