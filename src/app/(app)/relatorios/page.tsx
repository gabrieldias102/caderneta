"use client";

import { AutoGrid, PageHeader } from "@/components/ui/layout";
import { doMes, periodo, totais } from "@/lib/derive";
import { MES, addMonths, cap, monLabel } from "@/lib/format";
import { useApp } from "@/lib/store";
import { CategoryTrend } from "./_components/category-trend";
import { MonthlyChart } from "./_components/monthly-chart";
import { ResumoIA } from "./_components/resumo-ia";
import { TopMerchants } from "./_components/top-merchants";

export default function Relatorios() {
  const { data, hoje } = useApp();
  const { ym } = periodo(hoje);
  const meses = Array.from({ length: 6 }, (_, i) => addMonths(ym, i - 5));
  const porMes = meses.map((m) => ({
    m,
    ...totais(doMes(data, m, m === ym ? hoje : undefined)),
  }));

  return (
    <>
      <PageHeader
        kicker={`${cap(monLabel(meses[0]))} – ${MES[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`}
        title="Relatórios"
      />
      <ResumoIA atual={porMes[5]} anterior={porMes[4]} />
      <AutoGrid min={320} className="gap-8">
        <MonthlyChart porMes={porMes} />
        <CategoryTrend porMes={porMes} />
      </AutoGrid>
      <TopMerchants />
    </>
  );
}
