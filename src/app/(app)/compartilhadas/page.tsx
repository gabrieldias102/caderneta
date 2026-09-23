"use client";

import { useState } from "react";
import { Link as LinkIcon } from "lucide-react";
import { PageHead, Seg } from "@/components/ui";
import { kindOf, periodo } from "@/lib/derive";
import { brl, fmtD, monthOf } from "@/lib/format";
import { useApp } from "@/lib/store";

const RE_CONVITE = /^\S+@\S+\.\S+$|^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/;

export default function Compartilhadas() {
  const { data, hoje, set, flash } = useApp();
  const [convite, setConvite] = useState("");
  const g = data.grupo;
  const { ym } = periodo(hoje);
  const ana = g.parceiro.nome.split(" ")[0];

  // Só entra o que foi gasto depois do último acerto.
  const depois = (d: string) => monthOf(d) === ym && (!g.acertadoEm || d > g.acertadoEm);
  const meus = data.lancamentos.filter((t) => t.compartilhado && kindOf(t) === "expense" && depois(t.data));
  const deles = g.gastosParceiro.filter((t) => depois(t.data));
  const eu = g.split / 100;
  const mePaid = meus.reduce((a, t) => a - t.valor, 0);
  const anaPaid = deles.reduce((a, t) => a + t.valor, 0);
  const tot = mePaid + anaPaid;
  /** Positivo = a outra pessoa me deve. */
  const deve = mePaid - tot * eu;
  const acertado = Math.abs(deve) < 0.01;

  const itens = [
    ...meus.map((t) => ({ id: t.id, d: t.data, desc: t.descricao, who: "VC", mine: true, amt: -t.valor, split: `${ana}: ${brl(-t.valor * (1 - eu))}` })),
    ...deles.map((t) => ({ id: t.id, d: t.data, desc: t.descricao, who: g.parceiro.iniciais, mine: false, amt: t.valor, split: `Você: ${brl(t.valor * eu)}` })),
  ].sort((a, b) => b.d.localeCompare(a.d));

  const settledToday = g.acertadoEm === hoje && acertado;
  const headline = acertado ? "Tudo acertado" : deve > 0 ? `${ana} te deve ${brl(deve)}` : `Você deve ${brl(-deve)} para ${ana}`;
  const sub = settledToday
    ? `Acerto registrado hoje, ${fmtD(hoje)}. Novos gastos compartilhados começam uma nova conta.`
    : `Considerando ${itens.length} gasto${itens.length === 1 ? "" : "s"} do mês, divididos ${g.split}/${100 - g.split}.`;

  const setG = (patch: Partial<typeof g>) => set((s) => ({ ...s, grupo: { ...s.grupo, ...patch } }));

  return (
    <>
      <PageHead kicker={`${g.nome} · ${2 + g.convites.length} pessoas`} title="Contas compartilhadas" />

      <div className="grid-cards" style={{ ["--min" as string]: "280px", marginBottom: 32 }}>
        <div className="card" style={{ padding: 22, display: "grid", gap: 10, alignContent: "start",
          background: acertado ? "var(--color-surface)" : "var(--color-accent)", color: acertado ? "var(--color-text)" : "var(--color-bg)" }}>
          <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase" }}>Quem deve quanto</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 30, lineHeight: 1.1, textWrap: "pretty" }}>{headline}</div>
          <div style={{ fontSize: 13 }}>{sub}</div>
          {!acertado && (
            <div>
              <button className="btn" style={{ background: "var(--color-bg)", color: "var(--color-text)" }}
                onClick={() => { setG({ acertadoEm: hoje }); flash("Acerto registrado"); }}>Registrar acerto via Pix</button>
            </div>
          )}
        </div>
        <div className="card" style={{ padding: 22, display: "grid", gap: 12, alignContent: "start" }}>
          <div className="label-caps">Divisão (você / {ana})</div>
          <Seg name="split" stretch value={g.split} onChange={(v) => setG({ split: v })} options={[[50, "50 / 50"], [60, "60 / 40"], [70, "70 / 30"]]} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
            <div><div className="muted">Você pagou</div><div className="num" style={{ fontWeight: 800, fontSize: 18 }}>{brl(mePaid)}</div><div className="muted">sua parte {brl(tot * eu)}</div></div>
            <div><div className="muted">{ana} pagou</div><div className="num" style={{ fontWeight: 800, fontSize: 18 }}>{brl(anaPaid)}</div><div className="muted">parte dela {brl(tot * (1 - eu))}</div></div>
          </div>
        </div>
      </div>

      <div className="grid-cards" style={{ ["--min" as string]: "300px", gap: 32 }}>
        <section className="section">
          <div className="section-head"><h4>Lançamentos compartilhados</h4><span className="num" style={{ fontSize: 13 }}>{brl(tot)}</span></div>
          {itens.length === 0 && <div className="muted" style={{ padding: "12px 0", fontSize: 14 }}>Nenhum gasto compartilhado desde o último acerto.</div>}
          {itens.map((t) => (
            <div key={t.id} className="row" style={{ display: "grid", gridTemplateColumns: "32px minmax(0,1fr) auto", gap: 12, alignItems: "center", padding: "12px 0" }}>
              <div className="ico-sq" style={{ width: 32, height: 32, fontSize: 12, background: t.mine ? "var(--color-text)" : "var(--color-surface)", color: t.mine ? "var(--color-bg)" : "var(--color-text)" }}>{t.who}</div>
              <div style={{ minWidth: 0 }}><div className="ellipsis" style={{ fontWeight: 600, fontSize: 14 }}>{t.desc}</div><div style={{ fontSize: 12 }} className="muted">{fmtD(t.d)} · {t.mine ? "você pagou" : `${ana} pagou`}</div></div>
              <div className="num" style={{ textAlign: "right" }}><div style={{ fontWeight: 600, fontSize: 14 }}>{brl(t.amt)}</div><div style={{ fontSize: 12 }} className="muted">{t.split}</div></div>
            </div>
          ))}
          <div style={{ fontSize: 12, marginTop: 10 }} className="muted">Para incluir um gasto, abra-o em Lançamentos e marque “Compartilhado”.</div>
        </section>

        <section className="section">
          <div className="section-head"><h4>Pessoas</h4></div>
          {[
            { ini: "VC", name: `Você (${data.nome})`, sub: "rafa@email.com", status: "Admin", cls: "tag tag-neutral", mine: true },
            { ini: g.parceiro.iniciais, name: g.parceiro.nome, sub: `Entrou em ${g.parceiro.entrouEm}`, status: "Ativa", cls: "tag tag-neutral", mine: false },
            ...g.convites.map((e) => ({ ini: e.slice(0, 2).toUpperCase(), name: e, sub: "Convite enviado", status: "Pendente", cls: "tag tag-outline", mine: false, pend: true })),
          ].map((p) => (
            <div key={p.name} className="row" style={{ display: "grid", gridTemplateColumns: "32px minmax(0,1fr) auto", gap: 12, alignItems: "center", padding: "12px 0" }}>
              <div className="ico-sq" style={{ width: 32, height: 32, fontSize: 12, background: p.mine ? "var(--color-text)" : "pend" in p ? "var(--color-bg)" : "var(--color-surface)", color: p.mine ? "var(--color-bg)" : "pend" in p ? "var(--color-neutral-600)" : "var(--color-text)" }}>{p.ini}</div>
              <div style={{ minWidth: 0 }}><div className="ellipsis" style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div><div style={{ fontSize: 12 }} className="muted">{p.sub}</div></div>
              <span className={p.cls}>{p.status}</span>
            </div>
          ))}
          <form style={{ display: "grid", gap: 8, marginTop: 16 }}
            onSubmit={(e) => { e.preventDefault(); if (!RE_CONVITE.test(convite.trim())) return; setG({ convites: [...g.convites, convite.trim()] }); setConvite(""); flash("Convite enviado"); }}>
            <div className="field">
              <label htmlFor="convite">Convidar por e-mail ou celular</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input id="convite" className="input" placeholder="nome@email.com" value={convite} onChange={(e) => setConvite(e.target.value)} />
                <button className="btn btn-primary" disabled={!RE_CONVITE.test(convite.trim())}>Convidar</button>
              </div>
            </div>
            <button type="button" className="btn btn-ghost" style={{ justifySelf: "start" }}
              onClick={() => { navigator.clipboard?.writeText(`${location.origin}/c/${g.nome.toLowerCase().normalize("NFD").replace(/[^\w\s]/g, "").replace(/\s+/g, "-")}`).catch(() => {}); flash("Link de convite copiado"); }}>
              <LinkIcon size={16} />Copiar link de convite
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
