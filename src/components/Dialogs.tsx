"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Check, X } from "lucide-react";
import { catNome, contaNome, kindOf } from "@/lib/derive";
import { addMonths, brl, fmtDFull, monLabel, monthOf, parseValorBR, sgn } from "@/lib/format";
import { useApp } from "@/lib/store";

function Close({ onClick }: { onClick: () => void }) {
  return <button className="btn btn-icon" onClick={onClick} aria-label="Fechar"><X size={18} /></button>;
}

export function DetailDialog() {
  const { data, ui, setUI, updTx, flash, askRule } = useApp();
  const t = ui.detail ? data.lancamentos.find((x) => x.id === ui.detail) : undefined;
  if (!t) return null;
  const close = () => setUI((u) => ({ ...u, detail: null }));
  const k = kindOf(t);
  const neutral = k === "neutral";
  const rows: [string, string][] = [["Data", fmtDFull(t.data)], ["Conta", contaNome(data, t.contaId)]];
  if (t.estabelecimento && !neutral) rows.push(["Estabelecimento", t.estabelecimento]);
  if (t.parcela) rows.push(["Parcela", `${t.parcela.atual} de ${t.parcela.total} · total ${brl(-t.valor * t.parcela.total)}`]);
  if (t.origem === "arquivo") rows.push(["No extrato", t.descricaoOriginal]);
  const grupo = data.grupo;
  const parceiro = grupo?.parceiro.nome.split(" ")[0];
  const ym = monthOf(t.data);

  return (
    <div className="backdrop" onClick={close}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="det-title" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
          <div style={{ marginRight: "auto", minWidth: 0 }}>
            <div className="kicker">{neutral ? "Movimentação neutra" : t.pix ? "Pix" : k === "income" ? "Receita" : "Despesa"}</div>
            <div className="dialog-title" id="det-title">{t.descricao}</div>
          </div>
          <Close onClick={close} />
        </div>
        <div className="num" style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 36, lineHeight: 1, color: neutral ? "var(--color-neutral-600)" : "var(--color-text)" }}>
          {neutral ? brl(Math.abs(t.valor)) : sgn(t.valor)}
        </div>
        <div style={{ borderTop: "1px solid var(--color-divider)" }}>
          {rows.map(([a, b]) => (
            <div key={a} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--color-divider)", fontSize: 14 }}>
              <span className="muted">{a}</span><span style={{ textAlign: "right", overflowWrap: "anywhere" }}>{b}</span>
            </div>
          ))}
        </div>
        {neutral ? (
          <div style={{ display: "flex", gap: 10, padding: 12, borderRadius: "var(--radius-md)", background: "var(--color-neutral-200)", fontSize: 13 }}>
            <ArrowLeftRight size={16} style={{ flex: "none", marginTop: 2 }} />
            <span>{t.tipo === "fatura"
              ? "Pagar a fatura não é um gasto novo: as compras já foram contadas quando você usou o cartão."
              : "Transferência entre contas suas — o dinheiro não saiu do seu bolso."}</span>
          </div>
        ) : (
          <>
            <div className="field">
              <label htmlFor="det-cat">Categoria</label>
              <select id="det-cat" className="input" value={t.categoriaId ?? ""}
                onChange={(e) => {
                  const c = e.target.value;
                  updTx(t.id, { categoriaId: c || undefined });
                  close();
                  if (c) { flash(`${t.estabelecimento || t.descricao} → ${catNome(data, c)}`); askRule(t.estabelecimento, c, "tx", t.id); }
                }}>
                <option value="">Sem categoria</option>
                {data.categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            {k === "expense" && grupo && (
              <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, cursor: "pointer", minHeight: 32 }}>
                <input type="checkbox" checked={!!t.compartilhado}
                  onChange={() => { updTx(t.id, { compartilhado: !t.compartilhado }); flash(t.compartilhado ? "Removido das compartilhadas" : `Marcado como compartilhado com ${parceiro}`); }} />
                Compartilhado com {parceiro} ({grupo.nome})
              </label>
            )}
          </>
        )}
        {t.parcela && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>Parcelas</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(88px,1fr))", gap: 12 }}>
              {Array.from({ length: t.parcela.total }, (_, i) => {
                const n = i + 1, cur = n === t.parcela!.atual, past = n < t.parcela!.atual;
                const m = monLabel(addMonths(ym, n - t.parcela!.atual));
                return (
                  <div key={n} style={{
                    borderRadius: "var(--radius-sm)", padding: 8,
                    background: cur ? "var(--color-accent)" : past ? "var(--color-neutral-200)" : "var(--color-card)",
                    color: cur ? "var(--color-bg)" : past ? "var(--color-neutral-600)" : "var(--color-text)",
                    border: !cur && !past ? "1px solid var(--color-divider)" : "1px solid transparent",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{n}/{t.parcela!.total}</div>
                    <div style={{ fontSize: 11 }}>{cur ? `${m} · atual` : m}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function QuickAddDialog() {
  const { data, ui, setUI, set, flash, hoje } = useApp();
  const [amt, setAmt] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [acc, setAcc] = useState("dinheiro");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ui.qa) {
      setAmt(""); setDesc(""); setCat(""); setAcc(data.contas.some((c) => c.id === "dinheiro") ? "dinheiro" : data.contas[0]?.id);
      setTimeout(() => ref.current?.focus(), 30);
    }
  }, [ui.qa]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ui.qa) return null;
  const close = () => setUI((u) => ({ ...u, qa: false }));
  const v = parseValorBR(amt || "0");
  const valid = v > 0 && !!cat;
  const save = () => {
    if (!valid) return;
    const d = desc.trim();
    set((s) => ({
      ...s,
      lancamentos: [{ id: `m${Date.now()}`, data: hoje, descricaoOriginal: d, descricao: d || catNome(s, cat), estabelecimento: d, valor: -v, contaId: acc, categoriaId: cat, origem: "manual" }, ...s.lancamentos],
    }));
    close();
    flash(`${brl(v)} em ${catNome(data, cat)} adicionado`);
  };

  return (
    <div className="backdrop" onClick={close}>
      <form className="dialog" role="dialog" aria-modal="true" aria-labelledby="qa-title" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div style={{ display: "flex", alignItems: "start" }}>
          <div style={{ marginRight: "auto" }}><div className="kicker">Adição rápida</div><div className="dialog-title" id="qa-title">Gasto em dinheiro</div></div>
          <Close onClick={close} />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, borderBottom: "1px solid var(--color-divider)", paddingBottom: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 800 }}>R$</span>
          <input ref={ref} inputMode="decimal" placeholder="0,00" aria-label="Valor" value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^\d,.]/g, ""))}
            className="num" style={{ border: 0, background: "transparent", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 40, width: "100%", color: "var(--color-text)", outline: "none", padding: 0 }} />
        </div>
        <div className="field"><label htmlFor="qa-desc">Descrição</label><input id="qa-desc" className="input" placeholder="Ex.: feira, café, estacionamento" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div className="field">
          <span className="label">Categoria</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {data.categorias.filter((c) => c.id !== "salario").map((c) => (
              <button type="button" key={c.id} aria-pressed={cat === c.id} className={`btn btn-sm ${cat === c.id ? "btn-primary" : "btn-secondary"}`} onClick={() => setCat(c.id)}>{c.nome}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="qa-acc">Saiu de</label>
          <select id="qa-acc" className="input" value={acc} onChange={(e) => setAcc(e.target.value)}>
            {data.contas.map((c) => <option key={c.id} value={c.id}>{c.tipo === "cartao" ? `${c.nome} (cartão)` : c.nome}</option>)}
          </select>
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={close}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={!valid}>Salvar<Check size={16} /></button>
        </div>
      </form>
    </div>
  );
}

export function RuleDialog() {
  const { data, ui, setUI, ruleYes } = useApp();
  const r = ui.rule;
  if (!r) return null;
  const cat = catNome(data, r.categoriaId);
  const others = r.others > 0
    ? r.from === "import"
      ? `Também vamos ajustar ${r.others === 1 ? "o outro lançamento" : `os outros ${r.others}`} desta importação.`
      : `Também vamos ajustar ${r.others} lançamento${r.others > 1 ? "s" : ""} anterior${r.others > 1 ? "es" : ""}.`
    : "";
  return (
    <div className="backdrop" style={{ zIndex: 55 }}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="rule-title">
        <div className="kicker">Nova regra?</div>
        <div className="dialog-title" id="rule-title">Aplicar sempre para “{r.estabelecimento}”?</div>
        <div className="dialog-body">
          Daqui pra frente, tudo de <strong>{r.estabelecimento}</strong> entra como <strong>{cat}</strong> — sem sugestão, direto. {others}
        </div>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={() => setUI((u) => ({ ...u, rule: null }))}>Só desta vez</button>
          <button className="btn btn-primary" onClick={ruleYes} autoFocus>Aplicar sempre</button>
        </div>
      </div>
    </div>
  );
}
