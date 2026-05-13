import { type JSX } from "react";
import { cn } from "./cn";

export function Code({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <code
      className={cn(
        "rounded bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-sm font-semibold",
        className,
      )}
    >
      {children}
    </code>
  );
}
