"use client";

import { ChartAxis, columnShape } from "@/components/ui/column-chart";
import { Section, SectionHeader } from "@/components/ui/layout";
import { cn } from "@/lib/cn";
import { MES, brl, brl0, cap, monLabel } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { TotaisMes } from "./types";

function Legend({
  className,
  children,
}: {
  className: string;
  children: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className={cn("size-2.5 rounded-[3px]", className)} />
      {children}
    </span>
  );
}

/** Receitas e despesas lado a lado, com o saldo de cada mês embaixo. */
export function MonthlyChart({ porMes }: { porMes: TotaisMes[] }) {
  const { hoje } = useApp();
  const mx = Math.max(1, ...porMes.map((m) => Math.max(m.rec, m.desp)));
  return (
    <Section>
      <SectionHeader title="Mês a mês">
        <Legend className="bg-fg">Receitas</Legend>
        <Legend className="bg-accent">Despesas</Legend>
      </SectionHeader>
      <div
        role="img"
        aria-label="Receitas e despesas dos últimos 6 meses"
        className="grid h-50 auto-cols-fr grid-flow-col items-end gap-2 border-b border-divider pt-4"
      >
        {porMes.map((m) => (
          <div key={m.m} className="flex h-full items-end gap-0.75">
            <div
              title={`Receitas ${brl(m.rec)}`}
              className={cn(columnShape, "flex-1 bg-fg")}
              style={{ height: `${(m.rec / mx) * 100}%` }}
            />
            <div
              title={`Despesas ${brl(m.desp)}`}
              className={cn(columnShape, "flex-1 bg-accent")}
              style={{ height: `${(m.desp / mx) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <ChartAxis>
        {porMes.map((m) => (
          <div key={m.m} className="min-w-0">
            <div>{monLabel(m.m)}</div>
            <div className="truncate font-normal tracking-normal num text-neutral-700 normal-case">
              {m.saldo >= 0 ? "+" : "−"}
              {brl0(Math.abs(m.saldo))}
            </div>
          </div>
        ))}
      </ChartAxis>
      <div className="mt-2 text-xs text-neutral-700">
        Abaixo de cada mês: o que sobrou.{" "}
        {cap(MES[Number(hoje.slice(5, 7)) - 1])} vai até o dia{" "}
        {Number(hoje.slice(8))}.
      </div>
    </Section>
  );
}
