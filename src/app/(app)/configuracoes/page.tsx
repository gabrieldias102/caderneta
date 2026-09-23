"use client";

import { useState } from "react";
import { Plus, Trash } from "lucide-react";
import { PageHead, Seg, Switch } from "@/components/ui";
import { catNome, doMes, periodo } from "@/lib/derive";
import { MES, brl0 } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { Prefs } from "@/lib/types";

type Tab = "cat" | "rules" | "alerts" | "tema";

export default function Configuracoes() {
  const { data, hoje, set, setPrefs, flash, resetDemo } = useApp();
  const [tab, setTab] = useState<Tab>("cat");
  const [nova, setNova] = useState("");
  const { ym } = periodo(hoje);
  const txsMes = doMes(data, ym);
  const p = data.prefs;

  const addCat = () => {
    const nome = nova.trim();
    if (!nome) return;
    if (data.categorias.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) return flash(`Categoria ${nome} já existe`);
    set((s) => ({ ...s, categorias: [...s.categorias, { id: `c${Date.now()}`, nome }] }));
    setNova("");
    flash(`Categoria ${nome} criada`);
  };

  const prefRows: [keyof Prefs, string, string][] = [
    ["fatura", "Fatura perto do vencimento", "Avisa 10 dias antes de cada cartão vencer"],
    ["pix", "Pix para pessoa física sem categoria", "Lembra de categorizar transferências para pessoas"],
    ["dup", "Duplicatas na importação", "Destaca lançamentos que já vieram em outro arquivo"],
    ["weekly", "Resumo semanal por IA", "Toda segunda, em linguagem simples"],
  ];

  return (
    <>
      <PageHead title="Configurações" />
      <Seg name="cfg" stretch value={tab} onChange={setTab} style={{ marginBottom: 20, maxWidth: 560 }}
        options={[["cat", "Categorias"], ["rules", `Regras (${data.regras.length})`], ["alerts", "Alertas"], ["tema", "Aparência"]]} />

      {tab === "cat" && (
        <div style={{ maxWidth: 640 }}>
          <form style={{ display: "flex", gap: 8, marginBottom: 12 }} onSubmit={(e) => { e.preventDefault(); addCat(); }}>
            <input className="input" aria-label="Nova categoria" placeholder="Nova categoria" value={nova} onChange={(e) => setNova(e.target.value)} />
            <button className="btn btn-primary" disabled={!nova.trim()}><Plus size={18} />Adicionar</button>
          </form>
          <div style={{ borderTop: "1px solid var(--color-divider)" }}>
            {data.categorias.map((c) => {
              const n = txsMes.filter((t) => t.categoriaId === c.id).length;
              const lim = data.orcamentos[c.id];
              return (
                <div key={c.id} className="row" style={{ display: "grid", gridTemplateColumns: "36px minmax(0,1fr) auto", gap: 12, alignItems: "center", padding: "10px 0" }}>
                  <div className="ico-sq" style={{ background: "var(--color-surface)" }}>{c.nome.slice(0, 2).toUpperCase()}</div>
                  <div><div style={{ fontWeight: 600, fontSize: 14 }}>{c.nome}</div><div style={{ fontSize: 12 }} className="muted">{n} lançamento{n === 1 ? "" : "s"} em {MES[Number(ym.slice(5)) - 1]}</div></div>
                  <span className="num" style={{ fontSize: 13 }}>{lim ? `Limite ${brl0(lim)}` : "Sem limite"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "rules" && (
        <div style={{ maxWidth: 720 }}>
          <div style={{ fontSize: 14, marginBottom: 12 }} className="muted">Regras são criadas quando você corrige uma categoria e escolhe “aplicar sempre”. Elas rodam antes da sugestão automática.</div>
          <div style={{ borderTop: "1px solid var(--color-divider)" }}>
            {data.regras.length === 0 && <div className="muted" style={{ padding: "12px 0", fontSize: 14 }}>Nenhuma regra ainda.</div>}
            {data.regras.slice().reverse().map((r) => (
              <div key={r.id} className="row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "center", padding: "12px 0" }}>
                <div>
                  <div style={{ fontSize: 14 }}>Quando o estabelecimento for <strong>{r.estabelecimento}</strong> → <strong>{catNome(data, r.categoriaId)}</strong></div>
                  <div style={{ fontSize: 12 }} className="muted">{r.origem}</div>
                </div>
                <button className="btn btn-icon" aria-label={`Excluir regra ${r.estabelecimento}`}
                  onClick={() => { set((s) => ({ ...s, regras: s.regras.filter((x) => x.id !== r.id) })); flash("Regra excluída"); }}>
                  <Trash size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "alerts" && (
        <div style={{ maxWidth: 640, borderTop: "1px solid var(--color-divider)" }}>
          <div className="row" style={{ padding: "14px 0", display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ marginRight: "auto" }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Avisar ao atingir parte do orçamento</div>
                <div style={{ fontSize: 12 }} className="muted">Ex.: “você já usou {p.thr}% do orçamento de Delivery”</div>
              </div>
              <Switch label="Avisar ao atingir parte do orçamento" checked={p.budget} onChange={() => setPrefs({ budget: !p.budget })} />
            </div>
            <Seg name="thr" value={p.thr} onChange={(v) => setPrefs({ thr: v })} options={[70, 80, 90, 100].map((v) => [v, `${v}%`] as [number, string])} />
          </div>
          {prefRows.map(([k, label, sub]) => (
            <div key={k} className="row" style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 0" }}>
              <div style={{ marginRight: "auto" }}><div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div><div style={{ fontSize: 12 }} className="muted">{sub}</div></div>
              <Switch label={label} checked={!!p[k]} onChange={() => setPrefs({ [k]: !p[k] } as Partial<Prefs>)} />
            </div>
          ))}
        </div>
      )}

      {tab === "tema" && (
        <div style={{ maxWidth: 640, borderTop: "1px solid var(--color-divider)" }}>
          <div className="row" style={{ padding: "14px 0", display: "grid", gap: 10 }}>
            <div><div style={{ fontWeight: 600, fontSize: 14 }}>Tema</div><div style={{ fontSize: 12 }} className="muted">Claro, escuro ou igual ao do aparelho</div></div>
            <Seg name="tema" value={p.tema} onChange={(v) => setPrefs({ tema: v })} options={[["sistema", "Sistema"], ["claro", "Claro"], ["escuro", "Escuro"]]} />
          </div>
          <div className="row" style={{ padding: "14px 0", display: "grid", gap: 10 }}>
            <div><div style={{ fontWeight: 600, fontSize: 14 }}>Confiança na importação</div><div style={{ fontSize: 12 }} className="muted">Como mostrar a certeza da categoria sugerida</div></div>
            <Seg name="conf" value={p.confStyle} onChange={(v) => setPrefs({ confStyle: v })} options={[["medidor", "Medidor"], ["porcentagem", "Porcentagem"]]} />
          </div>
          <div className="row" style={{ padding: "14px 0", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ marginRight: "auto" }}><div style={{ fontWeight: 600, fontSize: 14 }}>Dados de exemplo</div><div style={{ fontSize: 12 }} className="muted">Tudo fica salvo só neste navegador. Restaurar apaga suas alterações.</div></div>
            <button className="btn btn-secondary" onClick={() => { if (confirm("Restaurar os dados de exemplo? Suas alterações serão perdidas.")) { resetDemo(); flash("Dados de exemplo restaurados"); } }}>Restaurar</button>
          </div>
        </div>
      )}
    </>
  );
}
