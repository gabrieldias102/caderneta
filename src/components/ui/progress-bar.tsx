import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const clamp = (pct: number) => Math.max(0, Math.min(100, pct));

/**
 * Barra de progresso. `className` ajusta a trilha (altura, cor de fundo) e
 * `fillClassName` o preenchimento; marcadores entram como `children`.
 */
export function ProgressBar({
  value,
  className,
  fillClassName,
  children,
}: {
  value: number;
  className?: string;
  fillClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("relative h-2 rounded-full bg-neutral-200", className)}>
      <div
        className={cn("h-full rounded-full bg-fg", fillClassName)}
        style={{ width: `${clamp(value)}%` }}
      />
      {children}
    </div>
  );
}

/** Traço vertical sobre a barra, na posição `at` (0–100). */
export function BarMarker({
  at,
  className,
}: {
  at: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("absolute -inset-y-1 w-0.5 bg-accent", className)}
      style={{ left: `${clamp(at)}%` }}
    />
  );
}
