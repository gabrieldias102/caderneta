"use client";

import { PageHead } from "@/components/ui";
import { catNome, doMes, orcamentos, periodo, totais } from "@/lib/derive";
import { MES, brl, brl0, cap, parseValorBR } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useState } from "react";

export default function Orcamentos() {
  const { data, hoje, set } = useApp();
  const [edit, setEdit] = useState(false);
  const { ym, diasRestantes, pctMes } = periodo(hoje);
  const { porCat } = totais(doMes(data, ym));
  const orc = orcamentos(data, porCat);
  const thr = data.prefs.thr;
  const pctTotal = orc.limite ? (orc.gasto / orc.limite) * 100 : 0;
  // Em edição, mostra todas as categorias de despesa (inclusive sem limite).
  const linhas = edit
    ? data.categorias.filter((c) => c.id !== "salario").map((c) => ({ id: c.id, limite: data.orcamentos[c.id] || 0, gasto: porCat[c.id] || 0, r: data.orcamentos[c.id] ? (porCat[c.id] || 0) / data.orcamentos[c.id] : 0 }))
    : orc.linhas;

  return (
    <>
      <PageHead kicker={`${cap(MES[Number(ym.slice(5)) - 1])} · faltam ${diasRestantes} dias`} title="Orçamentos">
        <button className="btn btn-secondary" onClick={() => setEdit(!edit)}>{edit ? "Concluir" : "Editar limites"}</button>
      </PageHead>

      <div style={{ display: "grid", gap: 8, padding: 20, borderRadius: "var(--radius-lg)", background: "var(--color-surface)", marginBottom: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
          <span className="big-num">{brl(orc.gasto)} <span style={{ fontSize: 16, color: "var(--color-neutral-700)" }}>de {brl0(orc.limite)}</span></span>
          <span style={{ fontSize: 14 }}>{Math.round(pctTotal)}% usado</span>
        </div>
        <div className="bar" style={{ height: 12, background: "var(--color-neutral-300)" }}>
          <div className="fill" style={{ width: `${Math.min(100, pctTotal)}%`, background: "var(--color-text)" }} />
          <div aria-hidden style={{ position: "absolute", left: `${pctMes}%`, top: -4, bottom: -4, width: 2, background: "var(--color-accent)" }} />
        </div>
        <div style={{ fontSize: 12 }} className="muted">A linha marca onde o mês está ({pctMes}%). Gasto à esquerda dela = no ritmo.</div>
      </div>

      {linhas.map((b) => {
        const pct = Math.round(b.r * 100);
        const over = b.r >= 1;
        const fill = over ? "var(--color-accent-700)" : pct >= thr ? "var(--color-accent)" : "var(--color-text)";
        return (
          <div key={b.id} className="row" style={{ display: "grid", gap: 8, padding: "14px 0" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "baseline" }}>
              <span style={{ fontSize: 16, fontWeight: 600, marginRight: "auto" }}>{catNome(data, b.id)}</span>
              {!edit && b.limite > 0 && pct >= thr && <span className={over ? "tag tag-outline" : "tag tag-accent"}>{over ? "Estourado" : `${pct}% usado`}</span>}
              {edit ? (
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  Limite R$
                  <input className="input num" style={{ width: 110 }} inputMode="decimal" defaultValue={b.limite ? String(b.limite).replace(".", ",") : ""} placeholder="sem limite"
                    onChange={(e) => { const v = parseValorBR(e.target.value || "0"); set((s) => ({ ...s, orcamentos: { ...s.orcamentos, [b.id]: isFinite(v) && v > 0 ? v : 0 } })); }} />
                </label>
              ) : (
                <span className="num" style={{ fontSize: 14 }}><strong>{brl(b.gasto)}</strong> <span className="muted">/ {brl0(b.limite)}</span></span>
              )}
            </div>
            {b.limite > 0 && (
              <>
                <div className="bar">
                  <div className="fill" style={{ width: `${Math.min(100, b.r * 100)}%`, background: fill }} />
                  <div aria-hidden style={{ position: "absolute", left: `${thr}%`, top: -3, bottom: -3, width: 1, background: "var(--color-text)" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }} className="muted">
                  <span className="num" style={{ color: over ? "var(--color-accent-700)" : undefined }}>{over ? `Estourou ${brl(b.gasto - b.limite)}` : `Restam ${brl(b.limite - b.gasto)}`}</span>
                  <span>{pct}%</span>
                </div>
              </>
            )}
          </div>
        );
      })}
      <div style={{ fontSize: 12, marginTop: 12 }} className="muted">O traço fino em cada barra marca o aviso de {thr}% — ajuste em Configurações › Alertas.</div>
    </>
  );
}
