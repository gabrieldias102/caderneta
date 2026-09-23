"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftRight, Plus, Search, Upload } from "lucide-react";
import { PageHead, Seg, TxRow } from "@/components/ui";
import { kindOf, periodo } from "@/lib/derive";
import { DOW, MES, MON, addDays, addMonths, brl, cap, monthOf, parseISO } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { Lancamento } from "@/lib/types";

export default function Lancamentos() {
  const { data, hoje, lancFilters: f, setLancFilters, setUI } = useApp();
  const router = useRouter();
  const { ym } = periodo(hoje);
  const ant = addMonths(ym, -1);
  const setF = (patch: Partial<typeof f>) => setLancFilters((x) => ({ ...x, ...patch }));

  let list = data.lancamentos.slice();
  if (f.per === "mes") list = list.filter((t) => monthOf(t.data) === ym);
  else if (f.per === "7d") list = list.filter((t) => t.data > addDays(hoje, -7) && t.data <= hoje);
  else list = list.filter((t) => monthOf(t.data) === ant);
  if (f.acc !== "all") list = list.filter((t) => t.contaId === f.acc);
  if (f.cat === "none") list = list.filter((t) => !t.categoriaId && !t.tipo);
  else if (f.cat !== "all") list = list.filter((t) => t.categoriaId === f.cat);
  const q = f.q.trim().toLowerCase();
  if (q) {
    list = list.filter((t) =>
      `${t.descricao} ${t.estabelecimento} ${t.descricaoOriginal} ${Math.abs(t.valor).toFixed(2).replace(".", ",")} ${brl(Math.abs(t.valor))}`
        .toLowerCase().includes(q));
  }
  list.sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id));

  const groups: { d: string; items: Lancamento[]; sum: number }[] = [];
  for (const t of list) {
    let g = groups[groups.length - 1];
    if (!g || g.d !== t.data) { g = { d: t.data, items: [], sum: 0 }; groups.push(g); }
    g.items.push(t);
    if (kindOf(t) === "expense") g.sum -= t.valor;
  }
  const ontem = addDays(hoje, -1);
  const dayLbl = (d: string) => {
    const dt = parseISO(d);
    const n = `${dt.getDate()} ${MON[dt.getMonth()]}`;
    return d === hoje ? `Hoje · ${n}` : d === ontem ? `Ontem · ${n}` : `${DOW[dt.getDay()]} · ${n}`;
  };
  const desp = list.filter((t) => kindOf(t) === "expense").reduce((a, t) => a - t.valor, 0);
  const rec = list.filter((t) => kindOf(t) === "income").reduce((a, t) => a + t.valor, 0);
  const openQA = () => setUI((u) => ({ ...u, qa: true }));

  return (
    <>
      <PageHead kicker={`${list.length} lançamento${list.length === 1 ? "" : "s"}`} title="Lançamentos">
        <button className="btn btn-primary only-wide" onClick={openQA}><Plus size={18} />Gasto em dinheiro</button>
      </PageHead>

      <div style={{ display: "grid", gap: 10, paddingBottom: 16, borderBottom: "1px solid var(--color-divider)" }}>
        <div style={{ position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: 12, top: 11, color: "var(--color-neutral-600)" }} />
          <input className="input" type="search" aria-label="Buscar" style={{ paddingLeft: 40, minHeight: 40 }}
            placeholder="Buscar por estabelecimento, pessoa ou valor" value={f.q} onChange={(e) => setF({ q: e.target.value })} />
        </div>
        <div className="grid-cards" style={{ ["--min" as string]: "150px", gap: 10 }}>
          <div className="field">
            <label htmlFor="f-acc">Conta ou cartão</label>
            <select id="f-acc" className="input" value={f.acc} onChange={(e) => setF({ acc: e.target.value })}>
              <option value="all">Todas</option>
              {data.contas.map((c) => <option key={c.id} value={c.id}>{c.tipo === "cartao" ? `${c.nome} (cartão)` : c.nome}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-cat">Categoria</label>
            <select id="f-cat" className="input" value={f.cat} onChange={(e) => setF({ cat: e.target.value })}>
              <option value="all">Todas</option>
              <option value="none">Sem categoria</option>
              {data.categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="field span-narrow">
            <span className="label">Período</span>
            <Seg name="per" stretch value={f.per} onChange={(v) => setF({ per: v })}
              options={[["mes", cap(MES[Number(ym.slice(5)) - 1])], ["7d", "7 dias"], ["ant", cap(MES[Number(ant.slice(5)) - 1])]]} />
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 13 }} className="muted">
          <span>Despesas <strong className="num" style={{ color: "var(--color-text)" }}>{brl(desp)}</strong></span>
          <span>Receitas <strong className="num" style={{ color: "var(--color-text)" }}>{brl(rec)}</strong></span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ArrowLeftRight size={16} />Transferências e faturas não somam</span>
        </div>
      </div>

      {list.length === 0 && (
        <div style={{ padding: "40px 0", display: "grid", gap: 10, maxWidth: 420 }}>
          <h4 style={{ margin: 0 }}>Nada por aqui</h4>
          <div style={{ fontSize: 14 }} className="muted">Nenhum lançamento com esses filtros. Se for um mês ainda não importado, envie o extrato ou a fatura.</div>
          <div><button className="btn btn-secondary" onClick={() => router.push("/importar")}><Upload size={16} />Importar arquivo</button></div>
        </div>
      )}

      {groups.map((g) => (
        <div key={g.d}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "18px 0 6px", borderBottom: "1px solid var(--color-divider)", position: "sticky", top: "var(--sticky-top, 0px)", background: "var(--color-bg)", zIndex: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>{dayLbl(g.d)}</span>
            <span className="num muted" style={{ fontSize: 12 }}>{g.sum ? `− ${brl(g.sum)}` : ""}</span>
          </div>
          {g.items.map((t) => <TxRow key={t.id} t={t} />)}
        </div>
      ))}

      <button className="btn btn-primary fab" onClick={openQA}><Plus size={18} />Gasto em dinheiro</button>
    </>
  );
}
