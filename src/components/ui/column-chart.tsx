import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface Column {
  key: string;
  /** Rótulo do eixo (mês). */
  label: ReactNode;
  value: number;
  /** Valor formatado exibido acima da coluna. */
  valueLabel: string;
  className?: string;
}

/** Coluna com cantos de cima arredondados — o formato de todos os gráficos. */
export const columnShape = "rounded-t-[8px] rounded-b-[3px]";

/** Linha de rótulos sob um gráfico de colunas. */
export function ChartAxis({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid auto-cols-fr grid-flow-col gap-2 pt-1.5 text-2xs font-semibold tracking-label uppercase",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Gráfico de colunas simples, com o valor em cima de cada coluna.
 * A maior coluna ocupa `scale` da altura, deixando espaço para o rótulo.
 */
export function ColumnChart({
  label,
  columns,
  scale = 0.8,
  className,
  columnClassName,
}: {
  label: string;
  columns: Column[];
  scale?: number;
  className?: string;
  columnClassName?: string;
}) {
  const max = Math.max(1, ...columns.map((c) => c.value));
  return (
    <>
      <div
        role="img"
        aria-label={label}
        className={cn(
          "grid h-37.5 auto-cols-fr grid-flow-col items-end gap-2 border-b border-divider",
          className,
        )}
      >
        {columns.map((c) => (
          <div
            key={c.key}
            className="flex h-full min-w-0 flex-col justify-end gap-1"
          >
            <span className="truncate text-2xs num">{c.valueLabel}</span>
            {c.value > 0 && (
              <div
                className={cn(
                  columnShape,
                  "min-h-0.75 bg-fg",
                  columnClassName,
                  c.className,
                )}
                style={{ height: `${(c.value / max) * scale * 100}%` }}
              />
            )}
          </div>
        ))}
      </div>
      <ChartAxis>
        {columns.map((c) => (
          <span key={c.key}>{c.label}</span>
        ))}
      </ChartAxis>
    </>
  );
}
