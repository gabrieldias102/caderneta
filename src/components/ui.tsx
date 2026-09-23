"use client";

import { ArrowLeftRight } from "lucide-react";
import type { ReactNode } from "react";
import { catNome, contaNome, isPixPendente, kindOf } from "@/lib/derive";
import { brl, sgn } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { Lancamento } from "@/lib/types";

export const ICON = { size: 18, strokeWidth: 2 } as const;

/** Losango provisório — substituir pelo ícone oficial do Pix (manual de marca do BCB). */
export function PixIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M12 2 22 12 12 22 2 12z" />
    </svg>
  );
}

export function PageHead({ kicker, title, children }: { kicker?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        {kicker && <div className="kicker">{kicker}</div>}
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function Seg<T extends string | number>({ name, options, value, onChange, stretch, style }: {
  name: string; options: [T, string][]; value: T; onChange: (v: T) => void; stretch?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div className="seg" role="radiogroup" style={{ display: stretch ? "flex" : undefined, ...style }}>
      {options.map(([v, label]) => (
        <label key={String(v)} className="seg-opt" style={stretch ? { flex: 1 } : undefined}>
          <input type="radio" name={name} checked={value === v} onChange={() => onChange(v)} />
          {label}
        </label>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <span className="switch">
      <input type="checkbox" role="switch" aria-label={label} checked={checked} onChange={onChange} />
      <span />
    </span>
  );
}

export function Bar({ pct, fill, height = 8, children }: { pct: number; fill: string; height?: number; children?: ReactNode }) {
  return (
    <div className="bar" style={{ height }}>
      <div className="fill" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: fill }} />
      {children}
    </div>
  );
}

const QUICK = ["mercado", "lazer", "presentes", "moradia", "outros"];

/** Linha de lançamento com as convenções visuais do handoff. */
export function TxRow({ t, compact }: { t: Lancamento; compact?: boolean }) {
  const { data, setUI, updTx, flash, askRule } = useApp();
  const k = kindOf(t);
  const pend = isPixPendente(t);
  const neutral = k === "neutral";
  const cat = t.categoriaId ? catNome(data, t.categoriaId) : "Sem categoria";

  const tags: { cls: string; label: string }[] = [];
  if (t.parcela) tags.push({ cls: "tag tag-outline", label: `Parcela ${t.parcela.atual}/${t.parcela.total}` });
  if (pend) tags.push({ cls: "tag tag-accent", label: "Pix PF · sem categoria" });
  else if (t.pix) tags.push({ cls: "tag tag-neutral", label: "Pix" });
  if (t.compartilhado) tags.push({ cls: "tag tag-neutral", label: "Compartilhado" });
  if (neutral) tags.push({ cls: "tag tag-neutral", label: "Fora das despesas" });

  const meta = neutral
    ? `${t.tipo === "fatura" ? "Pagamento de fatura" : "Transferência própria"} · ${contaNome(data, t.contaId)}`
    : `${cat} · ${contaNome(data, t.contaId)}`;

  const badge = neutral ? <ArrowLeftRight size={16} /> : t.pix ? "PIX" : k === "income" ? "+" : t.categoriaId ? cat.slice(0, 2).toUpperCase() : "?";
  const iconBg = neutral ? "var(--color-neutral-200)" : pend ? "var(--color-accent)" : k === "income" ? "var(--color-text)" : "var(--color-surface)";
  const iconFg = neutral ? "var(--color-neutral-600)" : pend || k === "income" ? "var(--color-bg)" : "var(--color-text)";
  const fg = neutral ? "var(--color-neutral-600)" : "var(--color-text)";
  const open = () => setUI((u) => ({ ...u, detail: t.id }));

  return (
    <div className="row" style={{ background: pend && !compact ? "var(--color-accent-100)" : undefined }}>
      <div
        role="button" tabIndex={0} onClick={open} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open())}
        className="clickable"
        style={{ display: "grid", gridTemplateColumns: "36px minmax(0,1fr) auto", gap: 12, alignItems: "center", padding: compact ? "12px 4px" : "12px 8px", minHeight: 56 }}
      >
        <div className="ico-sq" style={{ background: iconBg, color: iconFg }}>{badge}</div>
        <div style={{ minWidth: 0, display: "grid", gap: 3 }}>
          <div className="ellipsis" style={{ fontSize: 15, fontWeight: 600, color: fg }}>{t.descricao}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", fontSize: 12, color: "var(--color-neutral-700)" }}>
            <span>{meta}</span>
            {!compact && tags.map((tg) => <span key={tg.label} className={`${tg.cls} tag-sm`}>{tg.label}</span>)}
          </div>
        </div>
        <div className="num" style={{ fontSize: 15, fontWeight: k === "income" ? 800 : 600, color: fg }}>
          {neutral ? brl(Math.abs(t.valor)) : sgn(t.valor)}
        </div>
      </div>
      {pend && !compact && (
        <div style={{ padding: "0 8px 12px 56px", display: "grid", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-accent-800)" }}>Pix para pessoa física — para que foi?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {QUICK.filter((c) => data.categorias.some((x) => x.id === c)).map((c) => (
              <button key={c} className="btn btn-secondary btn-sm" style={{ background: "var(--color-bg)" }}
                onClick={() => { updTx(t.id, { categoriaId: c }); flash(`${t.estabelecimento} → ${catNome(data, c)}`); askRule(t.estabelecimento, c, "tx", t.id); }}>
                {catNome(data, c)}
              </button>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={open}>Outra…</button>
          </div>
        </div>
      )}
    </div>
  );
}
