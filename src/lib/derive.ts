import { daysBetween, daysInMonth, monthOf } from "./format";
import type { Conta, DataState, Lancamento } from "./types";

export type Kind = "neutral" | "income" | "expense";
export const kindOf = (t: Lancamento): Kind => (t.tipo ? "neutral" : t.valor > 0 ? "income" : "expense");
export const isPixPendente = (t: Lancamento) => !!t.pix?.pessoaFisica && !t.categoriaId && !t.tipo;

export const catNome = (s: DataState, id?: string) => s.categorias.find((c) => c.id === id)?.nome ?? "Sem categoria";
export const contaNome = (s: DataState, id: string) => s.contas.find((c) => c.id === id)?.nome ?? "—";

/** Mês de referência = mês de hoje. */
export function periodo(hoje: string) {
  const ym = monthOf(hoje);
  const dias = daysInMonth(ym);
  const dia = Number(hoje.slice(8, 10));
  return { ym, diasRestantes: Math.max(0, dias - dia), pctMes: Math.round((dia / dias) * 100) };
}

export function doMes(s: DataState, ym: string, ateHoje?: string) {
  return s.lancamentos.filter((t) => monthOf(t.data) === ym && (!ateHoje || t.data <= ateHoje));
}

export function totais(txs: Lancamento[]) {
  let desp = 0, rec = 0;
  const porCat: Record<string, number> = {};
  for (const t of txs) {
    const k = kindOf(t);
    if (k === "expense") {
      desp -= t.valor;
      if (t.categoriaId) porCat[t.categoriaId] = (porCat[t.categoriaId] || 0) - t.valor;
    } else if (k === "income") rec += t.valor;
  }
  return { desp, rec, saldo: rec - desp, porCat };
}

export function orcamentos(s: DataState, porCat: Record<string, number>) {
  const entries = Object.entries(s.orcamentos).filter(([, l]) => l > 0);
  const limite = entries.reduce((a, [, v]) => a + v, 0);
  const gasto = entries.reduce((a, [k]) => a + (porCat[k] || 0), 0);
  const livre = entries.reduce((a, [k, l]) => a + Math.max(0, l - (porCat[k] || 0)), 0);
  const linhas = entries
    .map(([k, l]) => ({ id: k, limite: l, gasto: porCat[k] || 0, r: (porCat[k] || 0) / l }))
    .sort((a, b) => b.r - a.r);
  return { limite, gasto, livre, linhas };
}

export function diasAte(conta: Conta, hoje: string) {
  return conta.vencimento ? daysBetween(hoje, conta.vencimento) : Infinity;
}

/** Valor das parcelas futuras de cada compra parcelada (projetadas, ainda não cobradas). */
export function parcelasAtivas(s: DataState, ym: string) {
  // A parcela mais recente de cada compra no mês atual (ou anterior, se ainda não caiu).
  const itens = s.lancamentos.filter((t) => t.parcela && kindOf(t) === "expense" && monthOf(t.data) === ym);
  return itens.map((t) => ({ t, restantes: t.parcela!.total - t.parcela!.atual, porMes: -t.valor }));
}
