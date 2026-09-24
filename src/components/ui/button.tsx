import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent font-extrabold whitespace-nowrap no-underline transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:block [&_svg]:flex-none",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-canvas hover:bg-accent-600 active:bg-accent-700",
        secondary: "border-divider text-fg hover:bg-fg/7 active:bg-fg/14",
        ghost: "text-accent-700 hover:bg-accent/10",
        plain: "text-fg hover:bg-fg/7",
      },
      size: {
        // O leading vem depois do text-*: o tailwind-merge descarta um leading anterior ao tamanho.
        md: "min-h-9 px-3.5 py-2 text-md leading-[1.2]",
        sm: "min-h-8 px-2.5 py-1.25 text-sm leading-[1.2]",
        lg: "min-h-12 px-3.5 py-2 text-lg leading-[1.2]",
        icon: "size-9 p-0 leading-[1.2]",
      },
      block: { true: "w-full" },
    },
    compoundVariants: [
      { variant: "ghost", size: ["md", "sm"], className: "px-1.5" },
    ],
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export type ButtonVariants = VariantProps<typeof buttonStyles>;

/** Classes de botão já resolvidas — use também em <Link> para links com cara de botão. */
export const buttonVariants = (props?: ButtonVariants) =>
  cn(buttonStyles(props));

export function Button({
  className,
  variant,
  size,
  block,
  type = "button",
  ...props
}: ComponentProps<"button"> & ButtonVariants) {
  return (
    <button
      type={type}
      className={cn(buttonStyles({ variant, size, block }), className)}
      {...props}
    />
  );
}

/** Botão só com ícone; o `label` vira o nome acessível. */
export function IconButton({
  label,
  className,
  ...props
}: Omit<ComponentProps<"button">, "aria-label"> & { label: string }) {
  return (
    <Button
      variant="plain"
      size="icon"
      aria-label={label}
      className={className}
      {...props}
    />
  );
}

/** Botão de alternância (chips de categoria, abas de gráfico). */
export function ToggleButton({
  pressed,
  className,
  ...props
}: ComponentProps<"button"> & { pressed: boolean }) {
  return (
    <Button
      size="sm"
      variant={pressed ? "primary" : "secondary"}
      aria-pressed={pressed}
      className={className}
      {...props}
    />
  );
}
