"use client";

import { type ComponentPropsWithoutRef } from "react";
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

type ButtonProps = ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants>;

export const Button = ({
  className,
  intent,
  size,
  type = "button",
  ...rest
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={buttonVariants({ intent, size, className })}
      {...rest}
    />
  );
};
