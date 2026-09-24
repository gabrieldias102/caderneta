import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Quadrado arredondado com ícone ou sigla (categoria, pessoa, arquivo). */
const iconBadgeVariants = cva(
  "grid flex-none place-items-center rounded-icon font-extrabold tracking-wider",
  {
    variants: {
      tone: {
        surface: "bg-surface text-fg",
        inverse: "bg-fg text-canvas",
        accent: "bg-accent text-canvas",
        accentSoft: "bg-accent-100 text-accent-700",
        muted: "bg-neutral-200 text-neutral-600",
        faint: "bg-canvas text-neutral-600",
      },
      size: {
        sm: "size-7",
        md: "size-8 text-xs",
        lg: "size-9 text-2xs",
        xl: "size-10 text-2xs",
        "2xl": "size-14",
      },
    },
    defaultVariants: { tone: "surface", size: "lg" },
  },
);

export type IconBadgeTone = NonNullable<
  VariantProps<typeof iconBadgeVariants>["tone"]
>;

export function IconBadge({
  className,
  tone,
  size,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof iconBadgeVariants>) {
  return (
    <div
      className={cn(iconBadgeVariants({ tone, size }), className)}
      {...props}
    />
  );
}

/** Losango provisório — substituir pelo ícone oficial do Pix (manual de marca do BCB). */
export function PixIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path d="M12 2 22 12 12 22 2 12z" />
    </svg>
  );
}
