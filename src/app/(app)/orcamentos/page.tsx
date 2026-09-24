"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/layout";
import { BarMarker, ProgressBar } from "@/components/ui/progress-bar";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import { catNome, doMes, orcamentos, periodo, totais } from "@/lib/derive";
import { MES, brl, brl0, cap, parseValorBR } from "@/lib/format";
import { useApp } from "@/lib/store";

interface Linha {
  id: string;
  limite: number;
  gasto: number;
  r: number;
}

export default function Orcamentos() {
  const { data, hoje } = useApp();
  const [edit, setEdit] = useState(false);
  const { ym, diasRestantes, pctMes } = periodo(hoje);
  const { porCat } = totais(doMes(data, ym));
  const orc = orcamentos(data, porCat);
  const pctTotal = orc.limite ? (orc.gasto / orc.limite) * 100 : 0;
  // Em edição, mostra todas as categorias de despesa (inclusive sem limite).
  const linhas: Linha[] = edit
    ? data.categorias
        .filter((c) => c.id !== "salario")
        .map((c) => {
          const limite = data.orcamentos[c.id] || 0,
            gasto = porCat[c.id] || 0;
          return { id: c.id, limite, gasto, r: limite ? gasto / limite : 0 };
        })
    : orc.linhas;

  return (
    <>
      <PageHeader
        kicker={`${cap(MES[Number(ym.slice(5)) - 1])} · faltam ${diasRestantes} dias`}
        title="Orçamentos"
      >
        <Button onClick={() => setEdit(!edit)}>
          {edit ? "Concluir" : "Editar limites"}
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-2 rounded-lg bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-3xl leading-[1.1] font-extrabold num">
            {brl(orc.gasto)}{" "}
            <span className="text-xl text-neutral-700">
              de {brl0(orc.limite)}
            </span>
          </span>
          <span className="text-md">{Math.round(pctTotal)}% usado</span>
        </div>
        <ProgressBar value={pctTotal} className="h-3 bg-neutral-300">
          <BarMarker at={pctMes} />
        </ProgressBar>
        <div className="text-xs text-neutral-700">
          A linha marca onde o mês está ({pctMes}%). Gasto à esquerda dela = no
          ritmo.
        </div>
      </div>

      {linhas.map((b) => (
        <LinhaOrcamento key={b.id} linha={b} edit={edit} />
      ))}
      <div className="mt-3 text-xs text-neutral-700">
        O traço fino em cada barra marca o aviso de {data.prefs.thr}% — ajuste
        em Configurações › Alertas.
      </div>
    </>
  );
}

function LinhaOrcamento({ linha: b, edit }: { linha: Linha; edit: boolean }) {
  const { data, set } = useApp();
  const thr = data.prefs.thr;
  const pct = Math.round(b.r * 100);
  const over = b.r >= 1;
  const setLimite = (valor: string) => {
    const v = parseValorBR(valor || "0");
    set((s) => ({
      ...s,
      orcamentos: { ...s.orcamentos, [b.id]: isFinite(v) && v > 0 ? v : 0 },
    }));
  };

  return (
    <div className="grid gap-2 border-b border-divider py-3.5">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="mr-auto text-xl font-semibold">
          {catNome(data, b.id)}
        </span>
        {!edit && b.limite > 0 && pct >= thr && (
          <Tag variant={over ? "outline" : "accent"}>
            {over ? "Estourado" : `${pct}% usado`}
          </Tag>
        )}
        {edit ? (
          <label className="flex items-center gap-1.5 text-sm">
            Limite R$
            <Input
              className="w-27.5 num"
              inputMode="decimal"
              placeholder="sem limite"
              defaultValue={b.limite ? String(b.limite).replace(".", ",") : ""}
              onChange={(e) => setLimite(e.target.value)}
            />
          </label>
        ) : (
          <span className="text-md num">
            <strong>{brl(b.gasto)}</strong>{" "}
            <span className="text-neutral-700">/ {brl0(b.limite)}</span>
          </span>
        )}
      </div>
      {b.limite > 0 && (
        <>
          <ProgressBar
            value={b.r * 100}
            fillClassName={
              over ? "bg-accent-700" : pct >= thr ? "bg-accent" : undefined
            }
          >
            <BarMarker at={thr} className="-inset-y-0.75 w-px bg-fg" />
          </ProgressBar>
          <div className="flex justify-between text-xs text-neutral-700">
            <span className={cn("num", over && "text-accent-700")}>
              {over
                ? `Estourou ${brl(b.gasto - b.limite)}`
                : `Restam ${brl(b.limite - b.gasto)}`}
            </span>
            <span>{pct}%</span>
          </div>
        </>
      )}
    </div>
  );
}
