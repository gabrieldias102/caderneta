"use client";

import { useState } from "react";
import { PageHead } from "@/components/ui";
import { catNome, doMes, kindOf, parcelasAtivas, periodo, totais } from "@/lib/derive";
import { MES, addMonths, brl, brl0, cap, monLabel } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function Relatorios() {
  const { data, hoje, set, flash } = useApp();
  const { ym, diasRestantes } = periodo(hoje);
  const meses = Array.from({ length: 6 }, (_, i) => addMonths(ym, i - 5));
  const porMes = meses.map((m) => ({ m, ...totais(doMes(data, m, m === ym ? hoje : undefined)) }));
  const atual = porMes[5], anterior = porMes[4];
  const mx = Math.max(1, ...porMes.map((m) => Math.max(m.rec, m.desp)));

  // Abas: a categoria que mais pressiona o orçamento primeiro, depois as maiores.
  const soma = (k: string) => porMes.reduce((s, m) => s + (m.porCat[k] || 0), 0);
  const uso = (k: string) => (data.orcamentos[k] ? (atual.porCat[k] || 0) / data.orcamentos[k] : 0);
  const pressao = Object.keys(atual.porCat).filter((k) => data.orcamentos[k] && k !== "moradia").sort((a, b) => uso(b) - uso(a))[0];
  const catsComHist = [...new Set([...(pressao ? [pressao] : []), ...[...new Set(porMes.flatMap((m) => Object.keys(m.porCat)))].sort((a, b) => soma(b) - soma(a))])].slice(0, 6);
  const [rc, setRc] = useState(catsComHist[0]);
  const hist = porMes.map((m) => m.porCat[rc] || 0);
  const hmx = Math.max(1, ...hist);
  const media5 = hist.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
  const vsAnt = hist[4] ? Math.round((hist[5] / hist[4] - 1) * 100) : 0;

  const byM: Record<string, { name: string; n: number; total: number; cat?: string }> = {};
  doMes(data, ym).filter((t) => kindOf(t) === "expense").forEach((t) => {
    const k = t.estabelecimento || t.descricao;
    byM[k] ??= { name: k, n: 0, total: 0, cat: t.categoriaId };
    byM[k].n++;
    byM[k].total -= t.valor;
  });
  const top = Object.values(byM).sort((a, b) => b.total - a.total).slice(0, 6);

  // Resumo por IA: só agregados saem do navegador.
  const topCat = Object.entries(atual.porCat).sort((a, b) => b[1] - a[1])[0];
  const del = atual.porCat.delivery || 0;
  const delAnt = anterior.porCat.delivery || 0;
  const delN = doMes(data, ym).filter((t) => t.categoriaId === "delivery" && kindOf(t) === "expense").length;
  const parcelasProxMes = parcelasAtivas(data, ym).filter((p) => p.restantes > 0).reduce((a, p) => a + p.porMes, 0);
  const nomeMes = MES[Number(ym.slice(5)) - 1];
  const dia = Number(hoje.slice(8));
  const fallback =
    `Até o dia ${dia}, entraram ${brl0(atual.rec)} e saíram ${brl0(atual.desp)} — ${atual.saldo >= 0 ? `sobraram ${brl0(atual.saldo)}` : `faltaram ${brl0(-atual.saldo)}`}, ` +
    `${atual.saldo >= anterior.saldo ? "um mês melhor" : "um mês mais apertado"} que ${MES[Number(anterior.m.slice(5)) - 1]}. ` +
    (topCat ? `${catNome(data, topCat[0])} segue sendo o maior gasto (${brl0(topCat[1])}). ` : "") +
    (del ? `O ponto de atenção é Delivery: ${brl0(del)} em ${delN} pedidos, ${delAnt ? `${Math.round((del / delAnt - 1) * 100)}% ${del >= delAnt ? "a mais" : "a menos"} que no mês passado` : "sem comparação com o mês passado"}, e ainda faltam ${diasRestantes} dias. ` : "") +
    (parcelasProxMes ? `As compras parceladas já reservam ${brl0(parcelasProxMes)} da próxima fatura.` : "");
  const resumo = data.resumoIA?.mes === ym ? data.resumoIA.texto : fallback;
  const [loading, setLoading] = useState(false);

  const gerar = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resumo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mes: nomeMes, ateDia: dia, diasRestantes,
          receitas: atual.rec, despesas: atual.desp,
          mesAnterior: { receitas: anterior.rec, despesas: anterior.desp },
          categorias: Object.entries(atual.porCat).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => ({ nome: catNome(data, k), valor: v, mesAnterior: anterior.porCat[k] || 0, limite: data.orcamentos[k] || null })),
          parcelasProximaFatura: parcelasProxMes,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.texto) throw new Error(j.erro || "falha");
      set((s) => ({ ...s, resumoIA: { mes: ym, texto: j.texto } }));
      flash("Resumo atualizado");
    } catch (e) {
      flash(e instanceof Error && e.message.includes("ANTHROPIC") ? "Configure ANTHROPIC_API_KEY para gerar com IA" : "Não foi possível gerar agora");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHead kicker={`${cap(monLabel(meses[0]))} – ${nomeMes} ${ym.slice(0, 4)}`} title="Relatórios" />

      <section style={{ background: "var(--color-accent-100)", borderRadius: "var(--radius-lg)", padding: 24, display: "grid", gap: 12, marginBottom: 32 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span className="kicker" style={{ marginRight: "auto" }}>Resumo de {nomeMes} · escrito por IA</span>
          <button className="btn btn-secondary btn-sm" onClick={gerar} disabled={loading}>{loading ? "Escrevendo…" : "Gerar de novo"}</button>
        </div>
        <p style={{ fontSize: 19, lineHeight: 1.5, margin: 0, maxWidth: 760, textWrap: "pretty" }} aria-live="polite">{resumo}</p>
        <div style={{ fontSize: 11 }} className="muted">Gerado a partir dos seus lançamentos. Pode conter imprecisões — os números abaixo são a referência.</div>
      </section>

      <div className="grid-cards" style={{ ["--min" as string]: "320px", gap: 32 }}>
        <section className="section">
          <div className="section-head" style={{ justifyContent: "flex-start" }}>
            <h4 style={{ marginRight: "auto" }}>Mês a mês</h4>
            <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--color-text)" }} />Receitas</span>
            <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--color-accent)" }} />Despesas</span>
          </div>
          <div role="img" aria-label="Receitas e despesas dos últimos 6 meses" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, height: 200, alignItems: "end", paddingTop: 16, borderBottom: "1px solid var(--color-divider)" }}>
            {porMes.map((m) => (
              <div key={m.m} style={{ display: "flex", gap: 3, alignItems: "end", height: "100%" }}>
                <div title={`Receitas ${brl(m.rec)}`} style={{ flex: 1, height: `${(m.rec / mx) * 100}%`, borderRadius: "8px 8px 3px 3px", background: "var(--color-text)" }} />
                <div title={`Despesas ${brl(m.desp)}`} style={{ flex: 1, height: `${(m.desp / mx) * 100}%`, borderRadius: "8px 8px 3px 3px", background: "var(--color-accent)" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, paddingTop: 6 }}>
            {porMes.map((m) => (
              <div key={m.m} style={{ fontSize: 11, minWidth: 0 }}>
                <div style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>{monLabel(m.m)}</div>
                <div className="muted num" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{m.saldo >= 0 ? "+" : "−"}{brl0(Math.abs(m.saldo))}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, marginTop: 8 }} className="muted">Abaixo de cada mês: o que sobrou. {cap(nomeMes)} vai até o dia {dia}.</div>
        </section>

        <section className="section">
          <div className="section-head"><h4>Evolução por categoria</h4></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "12px 0" }}>
            {catsComHist.map((k) => (
              <button key={k} aria-pressed={rc === k} className={`btn btn-sm ${rc === k ? "btn-primary" : "btn-secondary"}`} onClick={() => setRc(k)}>{catNome(data, k)}</button>
            ))}
          </div>
          <div role="img" aria-label={`Gastos com ${catNome(data, rc)} nos últimos 6 meses`} style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, height: 150, alignItems: "end", borderBottom: "1px solid var(--color-divider)" }}>
            {hist.map((v, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", justifyContent: "end", height: "100%", gap: 4, minWidth: 0 }}>
                <span className="num" style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis" }}>{brl0(v)}</span>
                <div style={{ height: `${(v / hmx) * 80}%`, minHeight: v ? 3 : 0, borderRadius: "8px 8px 3px 3px", background: i === 5 ? "var(--color-accent)" : "var(--color-text)" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, paddingTop: 6, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
            {meses.map((m) => <span key={m}>{monLabel(m)}</span>)}
          </div>
          <div style={{ fontSize: 13, marginTop: 10 }}>
            {cap(nomeMes)}: {brl(hist[5])} · {vsAnt >= 0 ? `${vsAnt}% acima` : `${-vsAnt}% abaixo`} de {MES[Number(meses[4].slice(5)) - 1]} · média dos 5 meses anteriores {brl0(media5)}.
          </div>
        </section>
      </div>

      <section className="section" style={{ marginTop: 24 }}>
        <div className="section-head"><h4>Maiores estabelecimentos</h4></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th style={{ width: 32 }}>#</th><th>Estabelecimento</th><th>Compras</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
            <tbody>
              {top.map((t, i) => (
                <tr key={t.name}>
                  <td className="muted">{i + 1}</td>
                  <td><div style={{ fontWeight: 600 }}>{t.name}</div><div style={{ fontSize: 12 }} className="muted">{catNome(data, t.cat)}</div></td>
                  <td>{t.n}</td>
                  <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{brl(t.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
