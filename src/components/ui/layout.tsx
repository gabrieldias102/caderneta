import type {
  ComponentProps,
  CSSProperties,
  ElementType,
  ReactNode,
} from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-lg bg-card p-5", className)} {...props} />;
}

export function Section({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn("min-w-0 rounded-lg bg-card px-4.5 py-4", className)}
      {...props}
    />
  );
}

/** Título de seção com uma linha divisória; `children` fica à direita. */
export function SectionHeader({
  title,
  as: Heading = "h4",
  className,
  children,
}: {
  title: ReactNode;
  as?: "h4" | "h5";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline gap-x-3 gap-y-2 border-b border-divider pb-2",
        className,
      )}
    >
      <Heading className="mr-auto">{title}</Heading>
      {children}
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  children,
}: {
  kicker?: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3">
      <div className="mr-auto">
        {kicker && <Kicker>{kicker}</Kicker>}
        <h1 className="mt-1">{title}</h1>
      </div>
      {children}
    </div>
  );
}

/** Grade que encaixa quantas colunas couberem, cada uma com pelo menos `min` px. */
export function AutoGrid({
  min = 250,
  className,
  style,
  ...props
}: ComponentProps<"div"> & { min?: number }) {
  return (
    <div
      className={cn("grid-auto-fit gap-3", className)}
      style={{ "--min": `${min}px`, ...style } as CSSProperties}
      {...props}
    />
  );
}

/** Linha de lista: [leading] título/descrição [trailing], separada por divisória. */
export function ListItem({
  leading,
  title,
  description,
  trailing,
  truncate = true,
  className,
  children,
}: {
  leading?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  /** Corta o título com reticências (padrão) ou deixa quebrar linha. */
  truncate?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-divider py-3",
        className,
      )}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-md font-semibold",
            truncate ? "truncate" : "text-pretty",
          )}
        >
          {title}
        </div>
        {description && (
          <div className="text-xs text-neutral-700">{description}</div>
        )}
        {children}
      </div>
      {trailing}
    </div>
  );
}

export function EmptyState({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("py-4 text-md text-neutral-700", className)}
      {...props}
    />
  );
}

/* ── Tipografia ──────────────────────────────────────────────────────── */

const caps = "text-2xs uppercase tracking-widest";

/** Rótulo em caixa alta na cor de destaque, acima de títulos. */
export function Kicker({
  className,
  as: Tag = "div",
  ...props
}: ComponentProps<"div"> & { as?: ElementType }) {
  return <Tag className={cn(caps, "text-accent-700", className)} {...props} />;
}

/** Rótulo em caixa alta discreto, para cabeçalhos de cartão. */
export function Overline({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(caps, "text-neutral-700", className)} {...props} />;
}

export function HeroNumber({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-5xl leading-none font-extrabold tracking-[-.03em] num",
        className,
      )}
      {...props}
    />
  );
}

export function BigNumber({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("text-3xl leading-[1.1] font-extrabold num", className)}
      {...props}
    />
  );
}
