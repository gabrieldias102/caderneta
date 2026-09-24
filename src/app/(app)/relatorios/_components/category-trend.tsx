"use client";

import { useState } from "react";
import { ToggleButton } from "@/components/ui/button";
import { ColumnChart } from "@/components/ui/column-chart";
import { Section, SectionHeader } from "@/components/ui/layout";
import { catNome } from "@/lib/derive";
import { MES, brl, brl0, cap, monLabel } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { TotaisMes } from "./types";

/** Gasto de uma categoria nos últimos meses, comparado com a média. */
export function CategoryTrend({ porMes }: { porMes: TotaisMes[] }) {
  const { data } = useApp();
  const atual = porMes[5];

  // Abas: a categoria que mais pressiona o orçamento primeiro, depois as maiores.
  const soma = (k: string) =>
    porMes.reduce((s, m) => s + (m.porCat[k] || 0), 0);
  const uso = (k: string) =>
    data.orcamentos[k] ? (atual.porCat[k] || 0) / data.orcamentos[k] : 0;
  const pressao = Object.keys(atual.porCat)
    .filter((k) => data.orcamentos[k] && k !== "moradia")
    .sort((a, b) => uso(b) - uso(a))[0];
  const todas = [...new Set(porMes.flatMap((m) => Object.keys(m.porCat)))].sort(
    (a, b) => soma(b) - soma(a),
  );
  const cats = [...new Set([...(pressao ? [pressao] : []), ...todas])].slice(
    0,
    6,
  );

  const [rc, setRc] = useState(cats[0]);
  const hist = porMes.map((m) => m.porCat[rc] || 0);
  const media5 = hist.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
  const vsAnt = hist[4] ? Math.round((hist[5] / hist[4] - 1) * 100) : 0;

  return (
    <Section>
      <SectionHeader title="Evolução por categoria" />
      <div className="flex flex-wrap gap-1.5 py-3">
        {cats.map((k) => (
          <ToggleButton key={k} pressed={rc === k} onClick={() => setRc(k)}>
            {catNome(data, k)}
          </ToggleButton>
        ))}
      </div>
      <ColumnChart
        label={`Gastos com ${catNome(data, rc)} nos últimos 6 meses`}
        columns={porMes.map((m, i) => ({
          key: m.m,
          label: monLabel(m.m),
          value: hist[i],
          valueLabel: brl0(hist[i]),
          className: i === 5 ? "bg-accent" : undefined,
        }))}
      />
      <div className="mt-2.5 text-sm">
        {cap(MES[Number(atual.m.slice(5)) - 1])}: {brl(hist[5])} ·{" "}
        {vsAnt >= 0 ? `${vsAnt}% acima` : `${-vsAnt}% abaixo`} de{" "}
        {MES[Number(porMes[4].m.slice(5)) - 1]} · média dos 5 meses anteriores{" "}
        {brl0(media5)}.
      </div>
    </Section>
  );
}
