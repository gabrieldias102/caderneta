import { TriangleAlert } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
  "min-h-10 w-full rounded-md border border-divider bg-surface px-3 py-2 text-md text-fg caret-accent hover:border-neutral-400 focus-visible:border-accent focus-visible:outline-offset-0";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(control, "select-chevron", className)} {...props} />
  );
}

/** Rótulo + controle. Sem `htmlFor`, o rótulo vira texto (para grupos como <Segmented>). */
export function Field({
  label,
  htmlFor,
  hint,
  hintId,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  hintId?: string;
  className?: string;
  children: ReactNode;
}) {
  const Label = htmlFor ? "label" : "span";
  return (
    <div className={cn("grid min-w-0 gap-1.25", className)}>
      <Label htmlFor={htmlFor} className="text-xs text-neutral-700">
        {label}
      </Label>
      {children}
      {hint && (
        <span id={hintId} className="text-xs text-neutral-700">
          {hint}
        </span>
      )}
    </div>
  );
}

export function Checkbox({
  className,
  children,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { children: ReactNode }) {
  return (
    <label
      className={cn(
        "flex min-h-8 cursor-pointer items-center gap-2.5 text-md",
        className,
      )}
    >
      <input type="checkbox" {...props} />
      {children}
    </label>
  );
}

export function FormError({
  id,
  icon = true,
  children,
}: {
  id?: string;
  icon?: boolean;
  children: ReactNode;
}) {
  return (
    <div id={id} role="alert" className="flex gap-2 text-sm text-accent-700">
      {icon && <TriangleAlert size={16} className="mt-0.5 flex-none" />}
      {children}
    </div>
  );
}
