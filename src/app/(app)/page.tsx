"use client";

import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { useAlertas } from "@/components/alertas";
import { PageHead, TxRow } from "@/components/ui";
import { catNome, doMes, orcamentos, periodo, totais } from "@/lib/derive";
import { DOW_LONG, MES, brl, parseISO, sgn } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function Dashboard() {
  const { data, hoje } = useApp();
  const router = useRouter();
  const alertas = useAlertas();
  const { ym, diasRestantes } = periodo(hoje);
  const txsMes = doMes(data, ym, hoje);
  const { desp, rec, saldo, porCat } = totais(txsMes);
  const orc = orcamentos(data, porCat);
  const dt = parseISO(hoje);
  const pctGasto = rec > 0 ? (desp / rec) * 100 : desp > 0 ? 100 : 0;
  const cats = Object.entries(porCat).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const recent = data.lancamentos.filter((t) => t.data <= hoje).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);

  return (
    <>
      <PageHead kicker={`${DOW_LONG[dt.getDay()]}, ${dt.getDate()} de ${MES[dt.getMonth()]}`} title={`Olá, ${data.nome}`}>
        <button className="btn btn-primary" onClick={() => router.push("/importar")}><Upload size={16} />Importar extrato</button>
      </PageHead>

      <div className="grid-cards">
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="label-caps">Saldo do mês</div>
          <div className="hero-num">{sgn(saldo)}</div>
          <div style={{ fontSize: 13 }} className="muted">Receitas menos despesas, até hoje. Transferências e faturas pagas ficam de fora.</div>
        </div>
        <div className="card" style={{ background: "var(--color-accent)", color: "var(--color-bg)", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase" }}>Quanto ainda posso gastar</div>
          <div className="hero-num">{brl(orc.livre)}</div>
          <div style={{ fontSize: 13 }}>
            {diasRestantes > 0
              ? <>≈ {brl(orc.livre / diasRestantes)} por dia nos próximos {diasRestantes} dias, somando o que resta dos orçamentos.</>
              : <>Último dia do mês — é o que resta somando os orçamentos.</>}
          </div>
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="label-caps">Receitas × despesas</div>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>Receitas</span><strong className="num">{brl(rec)}</strong></div>
            <div style={{ height: 10, borderRadius: 99, background: rec > 0 ? "var(--color-text)" : "var(--color-neutral-200)" }} />
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>Despesas</span><strong className="num">{brl(desp)}</strong></div>
            <div style={{ height: 10, background: "var(--color-neutral-200)", borderRadius: 99 }}>
              <div style={{ height: "100%", borderRadius: 99, width: `${Math.min(100, pctGasto)}%`, background: "var(--color-accent)" }} />
            </div>
          </div>
          <div style={{ fontSize: 12 }} className="muted">
            {rec > 0 ? `Você gastou ${Math.round(pctGasto)}% do que entrou.` : "Nenhuma receita registrada neste mês ainda."}
          </div>
        </div>
      </div>

      <div className="grid-cards" style={{ ["--min" as string]: "300px", gap: 24, marginTop: 24 }}>
        <section className="section">
          <div className="section-head"><h4>Gastos por categoria</h4><button className="btn btn-ghost" onClick={() => router.push("/orcamentos")}>Orçamentos</button></div>
          {cats.length === 0 && <div className="muted" style={{ padding: "16px 0", fontSize: 14 }}>Sem despesas neste mês ainda.</div>}
          {cats.map(([k, v]) => {
            const l = data.orcamentos[k];
            const hot = l && (v / l) * 100 >= data.prefs.thr;
            return (
              <div key={k} className="row" style={{ display: "grid", gridTemplateColumns: "110px minmax(0,1fr) auto", gap: 12, alignItems: "center", padding: "10px 0" }}>
                <span className="ellipsis" style={{ fontSize: 14 }}>{catNome(data, k)}</span>
                <div className="bar"><div className="fill" style={{ width: `${(v / cats[0][1]) * 100}%`, background: hot ? "var(--color-accent)" : "var(--color-text)" }} /></div>
                <span className="num" style={{ fontSize: 14, fontWeight: 600, minWidth: 90, textAlign: "right" }}>{brl(v)}</span>
              </div>
            );
          })}
        </section>
        <section className="section">
          <div className="section-head"><h4>Alertas recentes</h4><span className="tag tag-accent">{alertas.length}</span></div>
          {alertas.length === 0 && <div className="muted" style={{ padding: "16px 0", fontSize: 14 }}>Tudo tranquilo por aqui.</div>}
          {alertas.map((a) => (
            <div key={a.title} className="row" style={{ display: "grid", gridTemplateColumns: "28px minmax(0,1fr) auto", gap: 12, alignItems: "start", padding: "12px 0" }}>
              <div style={{ width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: "var(--r-icon)", background: a.bg, color: a.fg }}>{a.icon}</div>
              <div><div style={{ fontSize: 14, fontWeight: 600, textWrap: "pretty" }}>{a.title}</div><div style={{ fontSize: 12 }} className="muted">{a.sub}</div></div>
              <button className="btn btn-ghost" onClick={a.go}>{a.cta}</button>
            </div>
          ))}
        </section>
      </div>

      <section className="section" style={{ marginTop: 24 }}>
        <div className="section-head"><h4>Últimos lançamentos</h4><button className="btn btn-ghost" onClick={() => router.push("/lancamentos")}>Ver todos</button></div>
        {recent.length === 0 && (
          <div className="muted" style={{ padding: "16px 0", fontSize: 14 }}>
            Nada lançado ainda. Importe um extrato ou a fatura do cartão para começar.
          </div>
        )}
        {recent.map((t) => <TxRow key={t.id} t={t} compact />)}
      </section>
    </>
  );
}
