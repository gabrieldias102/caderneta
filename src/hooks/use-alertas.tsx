"use client";

import { CreditCard, Target } from "lucide-react";
import type { ReactNode } from "react";
import { PixIcon, type IconBadgeTone } from "@/components/ui/icon-badge";
import {
  catNome,
  diasAte,
  doMes,
  isPixPendente,
  orcamentos,
  periodo,
  totais,
} from "@/lib/derive";
import { brl, fmtD } from "@/lib/format";
import { useApp } from "@/lib/store";

export interface Alerta {
  title: string;
  sub: string;
  icon: ReactNode;
  tone: IconBadgeTone;
  cta: string;
  href: string;
  /** Roda antes de navegar (ex.: aplicar filtros). */
  onSelect?: () => void;
}

/** Alertas ativos do mês: orçamentos, Pix sem categoria e faturas perto do vencimento. */
export function useAlertas(): Alerta[] {
  const { data, hoje, setLancFilters } = useApp();
  const { ym, diasRestantes } = periodo(hoje);
  const { porCat } = totais(doMes(data, ym));
  const out: Alerta[] = [];
  const thr = data.prefs.thr;

  if (data.prefs.budget) {
    orcamentos(data, porCat)
      .linhas.filter((l) => l.r * 100 >= thr)
      .forEach((l) =>
        out.push({
          title:
            l.r >= 1
              ? `Orçamento de ${catNome(data, l.id)} estourado`
              : `Você já usou ${Math.round(l.r * 100)}% do orçamento de ${catNome(data, l.id)}`,
          sub: `${brl(l.gasto)} de ${brl(l.limite)} · faltam ${diasRestantes} dias`,
          icon: <Target size={16} />,
          tone: "accentSoft",
          cta: "Ver",
          href: "/orcamentos",
        }),
      );
  }

  const pend = data.lancamentos.filter(isPixPendente);
  if (data.prefs.pix && pend.length) {
    out.push({
      title: `${pend.length} Pix para pessoa física sem categoria`,
      sub: "Categorize com um toque na lista",
      icon: <PixIcon />,
      tone: "accent",
      cta: "Resolver",
      href: "/lancamentos",
      onSelect: () =>
        setLancFilters({ q: "", acc: "all", cat: "none", per: "mes" }),
    });
  }

  if (data.prefs.fatura) {
    data.contas
      .filter((c) => c.tipo === "cartao")
      .forEach((c) => {
        const d = diasAte(c, hoje);
        if (d >= 0 && d <= 10)
          out.push({
            title: `Fatura ${c.nome.split(" ")[0]} vence ${d === 0 ? "hoje" : d === 1 ? "amanhã" : `em ${d} dias`}`,
            sub: `${brl(c.faturaAtual ?? 0)} · vencimento ${fmtD(c.vencimento!)}`,
            icon: <CreditCard size={16} />,
            tone: "surface",
            cta: "Ver",
            href: "/contas",
          });
      });
  }
  return out;
}
