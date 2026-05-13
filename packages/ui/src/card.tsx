import { type ComponentPropsWithoutRef, type JSX } from "react";
import { cn } from "./cn";

type CardProps = ComponentPropsWithoutRef<"div"> & {
  title?: string;
};

export function Card({
  className,
  title,
  children,
  ...rest
}: CardProps): JSX.Element {
  return (
    <div
      className={cn(
        "group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-neutral-300 hover:bg-neutral-100 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/30",
        className,
      )}
      {...rest}
    >
      {title ? (
        <h2 className="mb-3 text-2xl font-semibold">
          {title}{" "}
          <span className="inline-block transition-transform group-hover:translate-x-1">
            -&gt;
          </span>
        </h2>
      ) : null}
      <div className="m-0 max-w-[30ch] text-sm opacity-60">{children}</div>
    </div>
  );
}
