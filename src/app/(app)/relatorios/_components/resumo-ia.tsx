"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/ui/layout";
import { catNome, doMes, kindOf, parcelasAtivas, periodo } from "@/lib/derive";
import { MES, brl0 } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { TotaisMes } from "./types";

/** Resumo do mês em texto corrido. Só agregados saem do navegador. */
export function ResumoIA({
  atual,
  anterior,
}: {
  atual: TotaisMes;
  anterior: TotaisMes;
}) {
  const { data, hoje, set, flash, ocultos } = useApp();
  const [loading, setLoading] = useState(false);
  const { ym, diasRestantes } = periodo(hoje);
  const nomeMes = MES[Number(ym.slice(5)) - 1];
  const dia = Number(hoje.slice(8));
  const parcelasProxMes = parcelasAtivas(data, ym)
    .filter((p) => p.restantes > 0)
    .reduce((a, p) => a + p.porMes, 0);

  // Texto montado localmente, usado enquanto não há resumo da IA para o mês.
  const topCat = Object.entries(atual.porCat).sort((a, b) => b[1] - a[1])[0];
  const del = atual.porCat.delivery || 0;
  const delAnt = anterior.porCat.delivery || 0;
  const delN = doMes(data, ym).filter(
    (t) => t.categoriaId === "delivery" && kindOf(t) === "expense",
  ).length;
  const fallback =
    `Até o dia ${dia}, entraram ${brl0(atual.rec)} e saíram ${brl0(atual.desp)} — ${atual.saldo >= 0 ? `sobraram ${brl0(atual.saldo)}` : `faltaram ${brl0(-atual.saldo)}`}, ` +
    `${atual.saldo >= anterior.saldo ? "um mês melhor" : "um mês mais apertado"} que ${MES[Number(anterior.m.slice(5)) - 1]}. ` +
    (topCat
      ? `${catNome(data, topCat[0])} segue sendo o maior gasto (${brl0(topCat[1])}). `
      : "") +
    (del
      ? `O ponto de atenção é Delivery: ${brl0(del)} em ${delN} pedidos, ${delAnt ? `${Math.round((del / delAnt - 1) * 100)}% ${del >= delAnt ? "a mais" : "a menos"} que no mês passado` : "sem comparação com o mês passado"}, e ainda faltam ${diasRestantes} dias. `
      : "") +
    (parcelasProxMes
      ? `As compras parceladas já reservam ${brl0(parcelasProxMes)} da próxima fatura.`
      : "");
  const resumo = data.resumoIA?.mes === ym ? data.resumoIA.texto : fallback;

  const gerar = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resumo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mes: nomeMes,
          ateDia: dia,
          diasRestantes,
          receitas: atual.rec,
          despesas: atual.desp,
          mesAnterior: { receitas: anterior.rec, despesas: anterior.desp },
          categorias: Object.entries(atual.porCat)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([k, v]) => ({
              nome: catNome(data, k),
              valor: v,
              mesAnterior: anterior.porCat[k] || 0,
              limite: data.orcamentos[k] || null,
            })),
          parcelasProximaFatura: parcelasProxMes,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.texto) throw new Error(j.erro || "falha");
      set((s) => ({ ...s, resumoIA: { mes: ym, texto: j.texto } }));
      flash("Resumo atualizado");
    } catch (e) {
      flash(
        e instanceof Error && e.message.includes("ANTHROPIC")
          ? "Configure ANTHROPIC_API_KEY para gerar com IA"
          : "Não foi possível gerar agora",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-8 grid gap-3 rounded-lg bg-accent-100 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Kicker as="span" className="mr-auto">
          Resumo de {nomeMes} · escrito por IA
        </Kicker>
        <Button size="sm" onClick={gerar} disabled={loading}>
          {loading ? "Escrevendo…" : "Gerar de novo"}
        </Button>
      </div>
      <p
        className="max-w-190 text-[19px] leading-normal text-pretty"
        aria-live="polite"
      >
        {ocultos
          ? "Valores ocultos — toque no olho no topo para ver o resumo."
          : resumo}
      </p>
      <div className="text-2xs text-neutral-700">
        Gerado a partir dos seus lançamentos. Pode conter imprecisões — os
        números abaixo são a referência.
      </div>
    </section>
  );
}
