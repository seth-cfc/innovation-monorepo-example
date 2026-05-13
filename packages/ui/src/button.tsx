"use client";

import { ReactNode } from "react";
import { type VariantProps } from "cva";
import { cva } from "./cva.config";

export const buttonVariants = cva({
  base: "inline-flex items-center justify-center rounded-full font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
  variants: {
    intent: {
      primary:
        "bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200",
      secondary:
        "border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800",
    },
    size: {
      sm: "px-3 py-1.5 text-xs",
      md: "px-5 py-2.5 text-sm",
    },
  },
  defaultVariants: {
    intent: "secondary",
    size: "md",
  },
});

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: ReactNode;
  className?: string;
  appName: string;
}

export const Button = ({
  children,
  className,
  appName,
  intent,
  size,
}: ButtonProps) => {
  return (
    <button
      className={buttonVariants({ intent, size, className })}
      onClick={() => alert(`Hello from your ${appName} app!`)}
    >
      {children}
    </button>
  );
};
