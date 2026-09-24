"use client";

import { Section, SectionHeader } from "@/components/ui/layout";
import { Table, Td, Th } from "@/components/ui/table";
import { catNome, doMes, kindOf, periodo } from "@/lib/derive";
import { brl } from "@/lib/format";
import { useApp } from "@/lib/store";

/** Estabelecimentos onde mais se gastou no mês. */
export function TopMerchants() {
  const { data, hoje } = useApp();
  const { ym } = periodo(hoje);

  const byM: Record<
    string,
    { name: string; n: number; total: number; cat?: string }
  > = {};
  doMes(data, ym)
    .filter((t) => kindOf(t) === "expense")
    .forEach((t) => {
      const k = t.estabelecimento || t.descricao;
      byM[k] ??= { name: k, n: 0, total: 0, cat: t.categoriaId };
      byM[k].n++;
      byM[k].total -= t.valor;
    });
  const top = Object.values(byM)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return (
    <Section className="mt-6">
      <SectionHeader title="Maiores estabelecimentos" />
      <Table>
        <thead>
          <tr>
            <Th className="w-8">#</Th>
            <Th>Estabelecimento</Th>
            <Th>Compras</Th>
            <Th className="text-right">Total</Th>
          </tr>
        </thead>
        <tbody>
          {top.map((t, i) => (
            <tr key={t.name}>
              <Td className="text-neutral-700">{i + 1}</Td>
              <Td>
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-neutral-700">
                  {catNome(data, t.cat)}
                </div>
              </Td>
              <Td>{t.n}</Td>
              <Td className="text-right font-semibold num">{brl(t.total)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Section>
  );
}
