"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon-badge";
import { useApp } from "@/lib/store";

/** Etapa 4: resumo do que foi importado. */
export function DoneStep() {
  const { imp, resetImp } = useApp();
  const r = imp.result!;
  const rows: [string, number][] = [
    ["Duplicatas e itens ignorados", r.ign],
    ["Compras parceladas projetadas nas próximas faturas", r.inst],
    ["Regras novas criadas", r.rules],
    ["Ficaram sem categoria", r.pend],
  ];
  return (
    <div className="grid max-w-[620px] gap-5">
      <IconBadge tone="accent" size="2xl">
        <Check size={30} strokeWidth={3} />
      </IconBadge>
      <h2>
        {r.n} lançamento{r.n === 1 ? "" : "s"} importado{r.n === 1 ? "" : "s"}{" "}
        em {r.dest}
      </h2>
      <div className="border-t border-divider">
        {rows.map(([l, v]) => (
          <div
            key={l}
            className="flex justify-between gap-3 border-b border-divider py-3 text-md"
          >
            <span>{l}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Link
          href="/lancamentos"
          onClick={resetImp}
          className={buttonVariants({ variant: "primary" })}
        >
          Ver lançamentos
          <ArrowRight size={16} />
        </Link>
        <Button onClick={resetImp}>Importar outro arquivo</Button>
      </div>
    </div>
  );
}
