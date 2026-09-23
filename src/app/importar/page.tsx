"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, ArrowRight, Check, TriangleAlert, Upload, X } from "lucide-react";
import { PageHead, Seg } from "@/components/ui";
import { catNome, contaNome } from "@/lib/derive";
import { MON, addMonths, brl, fmtD, monthOf, sgn } from "@/lib/format";
import { ParseError } from "@/lib/import/parsers";
import { ajustarSinal, montarRevisao, nivelConfianca, precisaRevisao } from "@/lib/import/pipeline";
import { MAX_BYTES, extensaoValida, lerArquivo } from "@/lib/import/read";
import { useApp, type ImpState } from "@/lib/store";
import type { ItemRevisao } from "@/lib/types";

const EXEMPLOS = ["fatura-nubank-set.csv", "extrato-itau-set.ofx", "extrato.csv"];
const STAGES: [string, string][] = [
  ["Lendo o arquivo", "PDF, OFX ou CSV → texto estruturado"],
  ["Encontrando lançamentos", "Datas, valores, parcelas e Pix"],
  ["Sugerindo categorias", "Regras suas primeiro, depois a sugestão automática"],
  ["Checando duplicatas", "Comparando com importações anteriores"],
];

const kb = (n: number) => `${Math.max(1, Math.round(n / 1024))} KB`;

export default function Importar() {
  const { imp } = useApp();
  const stepIdx = { upload: 0, processing: 1, review: 2, done: 3 }[imp.step];
  return (
    <>
      <PageHead kicker="PDF · OFX · CSV" title="Importar extrato" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: "1px solid var(--color-divider)", borderBottom: "1px solid var(--color-divider)", marginBottom: 24 }}>
        {["Enviar", "Processar", "Revisar", "Pronto"].map((l, i) => (
          <div key={l} aria-current={i === stepIdx ? "step" : undefined}
            style={{ padding: "10px 10px 10px 0", display: "grid", gap: 2, borderTop: `3px solid ${i <= stepIdx ? "var(--color-accent)" : "transparent"}`, marginTop: -1 }}>
            <span style={{ fontSize: 11 }} className="muted">0{i + 1}</span>
            <span style={{ fontSize: 13, fontWeight: i === stepIdx ? 800 : 400 }}>{l}</span>
          </div>
        ))}
      </div>
      {imp.step === "upload" && <Enviar />}
      {imp.step === "processing" && <Processando />}
      {imp.step === "review" && <Revisao />}
      {imp.step === "done" && <Pronto />}
    </>
  );
}

function Enviar() {
  const { data, imp, setImp, flash } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const escolher = async (f: File | undefined, exemplo?: string) => {
    setDrag(false);
    if (!f) return;
    if (!extensaoValida(f.name)) return flash("Formato não suportado — use PDF, OFX ou CSV");
    if (f.size > MAX_BYTES) return flash("Arquivo maior que 10 MB");
    setImp({ file: { name: f.name, size: kb(f.size), hint: "Lendo…", obj: f, exemplo }, error: undefined });
    try {
      const r = await lerArquivo(f, data.contas);
      setImp((i) => ({ file: i.file && { ...i.file, hint: r.hint }, dest: r.destino?.id ?? i.dest }));
    } catch (e) {
      setImp((i) => ({ file: i.file && { ...i.file, hint: e instanceof ParseError ? e.message : "Pronto para leitura" } }));
    }
  };

  const exemplo = async (name: string) => {
    const res = await fetch(`/exemplos/${name}`);
    const blob = await res.blob();
    escolher(new File([blob], name, { type: blob.type }), name);
  };

  const start = () => setImp({ step: "processing", progress: 0, rows: [], sel: [], filter: "todos", newRules: 0 });

  return (
    <>
      <div className="grid-cards" style={{ ["--min" as string]: "300px", gap: 32 }}>
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <input ref={fileRef} type="file" accept=".pdf,.ofx,.csv" hidden onChange={(e) => { escolher(e.target.files?.[0]); e.target.value = ""; }} />
          <div role="button" tabIndex={0} aria-label="Escolher arquivo"
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), fileRef.current?.click())}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); escolher(e.dataTransfer.files[0]); }}
            className="dropzone"
            style={{ background: drag ? "var(--color-accent-100)" : "var(--color-bg)", borderColor: drag ? "var(--color-accent)" : undefined }}>
            <Upload size={32} style={{ color: "var(--color-accent)" }} />
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 20 }}>Arraste o arquivo aqui</div>
            <div style={{ fontSize: 14 }} className="muted">ou toque para escolher. Extrato da conta ou fatura do cartão, em PDF, OFX ou CSV. Até 10 MB.</div>
          </div>
          {imp.file && (
            <div style={{ display: "grid", gridTemplateColumns: "40px minmax(0,1fr) auto", gap: 12, alignItems: "center", padding: 12, borderRadius: "var(--radius-md)", background: "var(--color-surface)" }}>
              <div className="ico-sq" style={{ width: 40, height: 40, background: "var(--color-text)", color: "var(--color-bg)" }}>{imp.file.name.split(".").pop()!.toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div className="ellipsis" style={{ fontWeight: 600, fontSize: 14 }}>{imp.file.name}</div>
                <div style={{ fontSize: 12 }} className="muted">{imp.file.size} · {imp.file.hint}</div>
              </div>
              <button className="btn btn-icon" onClick={() => setImp({ file: null })} aria-label="Remover arquivo"><X size={18} /></button>
            </div>
          )}
          {imp.error && <div style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--color-accent-700)" }}><TriangleAlert size={16} style={{ flex: "none", marginTop: 2 }} />{imp.error}</div>}
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12 }} className="muted">Sem arquivo à mão? Teste com um exemplo:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EXEMPLOS.map((n) => <button key={n} className="btn btn-secondary btn-sm" onClick={() => exemplo(n)}>{n}</button>)}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <div style={{ borderBottom: "1px solid var(--color-divider)", paddingBottom: 8 }}><h4 style={{ margin: 0 }}>Para onde vão os lançamentos?</h4></div>
          <div role="radiogroup" aria-label="Destino">
            {data.contas.map((c) => (
              <label key={c.id} className="radio" style={{ gridTemplateColumns: "16px minmax(0,1fr) auto", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--color-divider)", minHeight: 52 }}>
                <input type="radio" name="dest" checked={imp.dest === c.id} onChange={() => setImp({ dest: c.id })} />
                <span className="dot" />
                <span style={{ minWidth: 0 }}><span style={{ display: "block", fontWeight: 600 }}>{c.nome}</span><span style={{ fontSize: 12 }} className="muted">{c.sub}</span></span>
                <span className="tag tag-neutral">{c.tipo === "cartao" ? "Cartão" : "Conta"}</span>
              </label>
            ))}
          </div>
          <button className="btn btn-primary btn-block" style={{ minHeight: 48, fontSize: 15 }} disabled={!(imp.file?.obj && imp.dest)} onClick={start}>
            Ler arquivo e sugerir categorias<ArrowRight size={16} />
          </button>
          <div style={{ fontSize: 12 }} className="muted">O arquivo é lido e descartado. Nada é enviado ao banco e nada é lançado antes da sua revisão.</div>
        </div>
      </div>
      <section className="section" style={{ marginTop: 24 }}>
        <div className="section-head"><h5>Importações anteriores</h5></div>
        {data.importacoes.length === 0 && <div className="muted" style={{ padding: "12px 0", fontSize: 14 }}>Nenhuma ainda.</div>}
        {data.importacoes.slice(0, 8).map((h) => (
          <div key={h.id} className="row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, padding: "10px 0", fontSize: 14 }}>
            <div style={{ minWidth: 0 }}><div className="ellipsis" style={{ fontWeight: 600 }}>{h.arquivo}</div><div style={{ fontSize: 12 }} className="muted">{contaNome(data, h.contaId)}</div></div>
            <div style={{ textAlign: "right", fontSize: 12 }} className="muted"><div>{fmtD(h.data)}</div><div>{h.total} lançamentos</div></div>
          </div>
        ))}
      </section>
    </>
  );
}

function Processando() {
  const { data, imp, setImp, resetImp } = useApp();
  const result = useRef<{ rows?: ItemRevisao[]; error?: string }>({});
  const destino = data.contas.find((c) => c.id === imp.dest)!;

  // Leitura real do arquivo, em paralelo com a animação.
  useEffect(() => {
    let vivo = true;
    result.current = {};
    (async () => {
      try {
        const lido = await lerArquivo(imp.file!.obj!, data.contas, destino);
        const rows = ajustarSinal(lido.rows, destino);
        if (!rows.length) throw new ParseError("Nenhum lançamento encontrado no arquivo");
        if (vivo) result.current.rows = montarRevisao(rows, { contaId: destino.id, regras: data.regras, lancamentos: data.lancamentos, contas: data.contas });
      } catch (e) {
        if (vivo) result.current.error = e instanceof ParseError ? e.message : "Não foi possível ler este arquivo.";
      }
    })();
    return () => { vivo = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = setInterval(() => {
      setImp((i: ImpState) => {
        if (i.step !== "processing") return {};
        const r = result.current;
        if (r.error) return { step: "upload", progress: 0, error: r.error };
        const p = Math.min(r.rows ? 100 : 96, i.progress + 3);
        if (p >= 100 && r.rows) return { step: "review", progress: 100, rows: r.rows };
        return { progress: p };
      });
    }, 90);
    return () => clearInterval(id);
  }, [setImp]);

  const stNow = Math.min(3, Math.floor(imp.progress / 25));
  return (
    <div style={{ maxWidth: 560, display: "grid", gap: 20 }}>
      <div style={{ fontSize: 14 }} className="muted">{imp.file?.name} → {destino?.nome}</div>
      <div className="num" style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 72, lineHeight: 1, letterSpacing: "-.04em" }} aria-live="polite">
        {imp.progress}<span style={{ color: "var(--color-accent)" }}>%</span>
      </div>
      <div className="bar" style={{ height: 6 }}><div className="fill" style={{ width: `${imp.progress}%`, background: "var(--color-accent)", transition: "width .12s linear" }} /></div>
      <div style={{ borderTop: "1px solid var(--color-divider)" }}>
        {STAGES.map(([l, sub], i) => {
          const done = i < stNow || imp.progress >= 100, act = i === stNow && !done;
          return (
            <div key={l} className="row" style={{ display: "grid", gridTemplateColumns: "24px minmax(0,1fr)", gap: 12, alignItems: "center", padding: "12px 0", color: done || act ? "var(--color-text)" : "var(--color-neutral-600)" }}>
              <div style={{ width: 20, height: 20, display: "grid", placeItems: "center", borderRadius: 7, color: "var(--color-bg)",
                background: done ? "var(--color-text)" : act ? "var(--color-accent)" : "var(--color-neutral-300)", animation: act ? "cd-blink 1s infinite" : undefined }}>
                {done && <Check size={14} strokeWidth={3} />}
              </div>
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>{l}</div><div style={{ fontSize: 12 }} className="muted">{sub}</div></div>
            </div>
          );
        })}
      </div>
      <div><button className="btn btn-secondary" onClick={resetImp}>Cancelar</button></div>
    </div>
  );
}

const CONF_LABEL = { voce: "Você definiu", regra: "Regra automática", alta: "Confiança alta", media: "Confiança média", baixa: "Confiança baixa", nenhuma: "Sem sugestão" };
const CONF_FILL = { voce: 3, regra: 3, alta: 3, media: 2, baixa: 1, nenhuma: 0 };

function Revisao() {
  const { data, imp, setImp, flash, askRule, confirmImport, resetImp } = useApp();
  const pct = data.prefs.confStyle === "porcentagem";
  const all = imp.rows;
  const vis = all.filter((r) => (imp.filter === "revisar" ? precisaRevisao(r) : imp.filter === "dup" ? !!r.duplicataDe : true));
  const incl = all.filter((r) => !r.ignorado);
  const allSel = vis.length > 0 && vis.every((r) => imp.sel.includes(r.k));
  const updRow = (k: string, patch: Partial<ItemRevisao>) => setImp((i) => ({ rows: i.rows.map((x) => (x.k === k ? { ...x, ...patch } : x)) }));
  const stats = [
    { v: all.length, label: "lançamentos encontrados" },
    { v: all.filter(precisaRevisao).length, label: "pedem sua revisão", fg: "var(--color-accent-700)" },
    { v: all.filter((r) => r.duplicataDe).length, label: "possíveis duplicatas" },
    { v: all.filter((r) => r.parcela).length, label: all.filter((r) => r.parcela).length === 1 ? "compra parcelada" : "compras parceladas" },
  ];

  return (
    <>
      <div className="grid-cards" style={{ ["--min" as string]: "140px", marginBottom: 20 }}>
        {stats.map((s) => (
          <div key={s.label} className="card" style={{ padding: "14px 16px" }}>
            <div className="big-num" style={{ lineHeight: 1, color: s.fg }}>{s.v}</div>
            <div style={{ fontSize: 12, marginTop: 4 }} className="muted">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", paddingBottom: 12, borderBottom: "1px solid var(--color-divider)" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", minHeight: 36 }}>
          <input type="checkbox" checked={allSel} onChange={() => setImp((i) => ({ sel: allSel ? [] : vis.map((r) => r.k) }))} />Selecionar todos
        </label>
        <Seg name="rf" style={{ marginLeft: "auto" }} value={imp.filter} onChange={(v) => setImp({ filter: v, sel: [] })}
          options={[["todos", `Todos ${all.length}`], ["revisar", `Revisar ${all.filter(precisaRevisao).length}`], ["dup", `Duplicatas ${all.filter((r) => r.duplicataDe).length}`]]} />
      </div>

      {imp.sel.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-text)", color: "var(--color-bg)", position: "sticky", top: "calc(var(--sticky-top, 0px) + 8px)", zIndex: 4, marginTop: 8 }}>
          <strong style={{ fontSize: 14, marginRight: "auto" }}>{imp.sel.length} selecionado{imp.sel.length > 1 ? "s" : ""}</strong>
          <select className="input" aria-label="Mudar categoria dos selecionados" style={{ width: "auto", minWidth: 180, background: "var(--color-bg)" }} value=""
            onChange={(e) => {
              const c = e.target.value;
              if (!c) return;
              const n = imp.rows.filter((x) => imp.sel.includes(x.k) && !x.tipo).length;
              setImp((i) => ({ rows: i.rows.map((x) => (i.sel.includes(x.k) && !x.tipo ? { ...x, categoriaId: c, editado: true } : x)), sel: [] }));
              flash(`${catNome(data, c)} aplicada a ${n} lançamento${n > 1 ? "s" : ""}`);
            }}>
            <option value="">Mudar categoria…</option>
            {data.categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <button className="btn btn-secondary" style={{ color: "var(--color-bg)", borderColor: "var(--color-neutral-500)" }}
            onClick={() => setImp((i) => ({ rows: i.rows.map((x) => (i.sel.includes(x.k) ? { ...x, ignorado: true } : x)), sel: [] }))}>Não importar</button>
          <button className="btn btn-icon" style={{ color: "var(--color-bg)" }} onClick={() => setImp({ sel: [] })} aria-label="Limpar seleção"><X size={18} /></button>
        </div>
      )}

      {vis.length === 0 && <div className="muted" style={{ padding: "24px 0", fontSize: 14 }}>Nada neste filtro.</div>}
      {vis.map((r) => {
        const neutral = !!r.tipo;
        const lvl = nivelConfianca(r);
        const needs = precisaRevisao(r);
        const pixPend = !!r.pix?.pessoaFisica && !r.editado && !r.porRegra;
        const weak = lvl === "baixa" || lvl === "nenhuma";
        const filled = lvl === "n" ? 0 : CONF_FILL[lvl];
        const tags: { cls: string; label: string }[] = [];
        if (r.pix?.pessoaFisica) tags.push({ cls: "tag tag-accent", label: "Pix para pessoa física" });
        else if (r.pix) tags.push({ cls: "tag tag-neutral", label: "Pix" });
        if (r.parcela) {
          const fut = r.parcela.total - r.parcela.atual;
          tags.push({ cls: "tag tag-outline", label: `Parcela ${r.parcela.atual}/${r.parcela.total}` });
          if (fut > 0) tags.push({ cls: "tag tag-neutral", label: `+${fut} parcela${fut > 1 ? "s" : ""} projetada${fut > 1 ? "s" : ""} até ${MON[Number(addMonths(monthOf(r.data), fut).slice(5)) - 1]}` });
        }
        const fg = neutral ? "var(--color-neutral-600)" : "var(--color-text)";
        return (
          <div key={r.k} className="row" style={{ display: "grid", gridTemplateColumns: "24px minmax(0,1fr)", gap: 12, padding: "14px 8px",
            background: pixPend ? "var(--color-accent-100)" : r.duplicataDe ? "var(--color-neutral-100)" : undefined, opacity: r.ignorado ? 0.55 : 1 }}>
            <input type="checkbox" aria-label={`Selecionar ${r.estabelecimento}`} checked={imp.sel.includes(r.k)} style={{ marginTop: 3 }}
              onChange={() => setImp((i) => ({ sel: i.sel.includes(r.k) ? i.sel.filter((x) => x !== r.k) : [...i.sel, r.k] }))} />
            <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "baseline" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: fg }}>{r.estabelecimento || r.descricaoOriginal}</div>
                  <div className="ellipsis muted" style={{ fontSize: 11, fontFamily: "ui-monospace, Menlo, Consolas, monospace" }}>{fmtD(r.data)} · {r.descricaoOriginal}</div>
                </div>
                <div className="num" style={{ fontSize: 15, fontWeight: r.valor > 0 && !neutral ? 800 : 600, color: fg }}>{neutral ? brl(Math.abs(r.valor)) : sgn(r.valor)}</div>
              </div>
              {r.duplicataDe && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", padding: "8px 10px", borderRadius: "var(--radius-md)", background: "var(--color-card)", border: "1px solid var(--color-divider)", fontSize: 13 }}>
                  <TriangleAlert size={16} style={{ color: "var(--color-accent)" }} />
                  <span style={{ marginRight: "auto" }}>Possível duplicata — já lançado em {r.duplicataDe} por uma importação anterior</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => updRow(r.k, { ignorado: !r.ignorado })}>{r.ignorado ? "Importar mesmo assim" : "Não importar"}</button>
                </div>
              )}
              {neutral ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }} className="muted">
                  <ArrowLeftRight size={16} />
                  {r.tipo === "fatura" ? "Pagamento da fatura — não conta como despesa" : "Transferência entre suas contas — não conta como despesa"}
                </div>
              ) : (
                <div className="grid-cards" style={{ ["--min" as string]: "180px", gap: 10, alignItems: "center" }}>
                  <select className="input" aria-label={`Categoria de ${r.estabelecimento}`} value={r.categoriaId} style={{ borderColor: needs ? "var(--color-accent)" : "var(--color-divider)" }}
                    onChange={(e) => { const c = e.target.value; updRow(r.k, { categoriaId: c, editado: true }); if (c) askRule(r.estabelecimento, c, "import", r.k); }}>
                    <option value="">Escolher categoria…</option>
                    {data.categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    {!pct && (
                      <div style={{ display: "flex", gap: 2 }} aria-hidden>
                        {[1, 2, 3].map((i) => <div key={i} style={{ width: 14, height: 8, borderRadius: 2, background: i <= filled ? (weak ? "var(--color-accent)" : "var(--color-text)") : "var(--color-neutral-300)" }} />)}
                      </div>
                    )}
                    <span style={{ fontWeight: 600, color: weak ? "var(--color-accent-700)" : "var(--color-text)" }}>
                      {pct && ["alta", "media", "baixa"].includes(lvl) ? `${Math.round(r.confianca * 100)}% de confiança` : CONF_LABEL[lvl as keyof typeof CONF_LABEL]}
                    </span>
                    {!pct && ["alta", "media", "baixa"].includes(lvl) && <span className="muted">{Math.round(r.confianca * 100)}%</span>}
                  </div>
                </div>
              )}
              {tags.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{tags.map((t) => <span key={t.label} className={t.cls}>{t.label}</span>)}</div>}
            </div>
          </div>
        );
      })}

      <div className="sticky-foot" style={{ position: "sticky", bottom: 64, background: "var(--color-bg)", borderTop: "1px solid var(--color-divider)", padding: "14px 0", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 8, zIndex: 4 }}>
        <div style={{ marginRight: "auto" }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{incl.length} lançamento{incl.length === 1 ? "" : "s"} {incl.length === 1 ? "será importado" : "serão importados"}</div>
          <div style={{ fontSize: 12 }} className="muted">
            Despesas {brl(incl.filter((r) => !r.tipo && r.valor < 0).reduce((a, r) => a - r.valor, 0))} · {all.length - incl.length} ignorados · {incl.filter((r) => !r.tipo && !r.categoriaId).length} sem categoria
          </div>
        </div>
        <button className="btn btn-secondary" onClick={resetImp}>Descartar</button>
        <button className="btn btn-primary" style={{ minHeight: 44 }} disabled={incl.length === 0} onClick={confirmImport}>Confirmar importação<Check size={16} /></button>
      </div>
    </>
  );
}

function Pronto() {
  const { imp, resetImp } = useApp();
  const router = useRouter();
  const r = imp.result!;
  const rows: [string, number][] = [
    ["Duplicatas e itens ignorados", r.ign],
    ["Compras parceladas projetadas nas próximas faturas", r.inst],
    ["Regras novas criadas", r.rules],
    ["Ficaram sem categoria", r.pend],
  ];
  return (
    <div style={{ maxWidth: 620, display: "grid", gap: 20 }}>
      <div style={{ width: 56, height: 56, display: "grid", placeItems: "center", borderRadius: "var(--r-icon)", background: "var(--color-accent)", color: "var(--color-bg)" }}><Check size={30} strokeWidth={3} /></div>
      <h2 style={{ margin: 0 }}>{r.n} lançamento{r.n === 1 ? "" : "s"} importado{r.n === 1 ? "" : "s"} em {r.dest}</h2>
      <div style={{ borderTop: "1px solid var(--color-divider)" }}>
        {rows.map(([l, v]) => <div key={l} className="row" style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", fontSize: 14 }}><span>{l}</span><strong>{v}</strong></div>)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button className="btn btn-primary" onClick={() => { resetImp(); router.push("/lancamentos"); }}>Ver lançamentos<ArrowRight size={16} /></button>
        <button className="btn btn-secondary" onClick={resetImp}>Importar outro arquivo</button>
      </div>
    </div>
  );
}
