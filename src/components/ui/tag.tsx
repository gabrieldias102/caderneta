import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const tagVariants = cva(
  "inline-flex items-center gap-1 rounded-xl text-2xs leading-[1.4] tracking-wide whitespace-nowrap",
  {
    variants: {
      variant: {
        accent: "bg-accent-100 text-accent-800",
        neutral: "bg-neutral-100 text-neutral-800",
        outline: "border border-accent text-accent-700",
      },
      size: { md: "px-2.5 py-0.75", sm: "px-1.75 py-px" },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export type TagVariant = NonNullable<
  VariantProps<typeof tagVariants>["variant"]
>;

export function Tag({
  className,
  variant,
  size,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof tagVariants>) {
  return (
    <span
      className={cn(tagVariants({ variant, size }), className)}
      {...props}
    />
  );
}
