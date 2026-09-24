"use client";

import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBadge, type IconBadgeTone } from "@/components/ui/icon-badge";
import { Tag, type TagVariant } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import { catNome, contaNome, isPixPendente, kindOf } from "@/lib/derive";
import { brl, sgn } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { Lancamento } from "@/lib/types";

/** Categorias oferecidas como atalho para classificar um Pix para pessoa física. */
const QUICK = ["mercado", "lazer", "presentes", "moradia", "outros"];

/** Linha de lançamento com as convenções visuais do handoff. */
export function TxRow({ t, compact }: { t: Lancamento; compact?: boolean }) {
  const { data, setUI, updTx, flash, askRule } = useApp();
  const k = kindOf(t);
  const pend = isPixPendente(t);
  const neutral = k === "neutral";
  const cat = t.categoriaId ? catNome(data, t.categoriaId) : "Sem categoria";

  const tags: { variant: TagVariant; label: string }[] = [];
  if (t.parcela)
    tags.push({
      variant: "outline",
      label: `Parcela ${t.parcela.atual}/${t.parcela.total}`,
    });
  if (pend) tags.push({ variant: "accent", label: "Pix PF · sem categoria" });
  else if (t.pix) tags.push({ variant: "neutral", label: "Pix" });
  if (t.compartilhado)
    tags.push({ variant: "neutral", label: "Compartilhado" });
  if (neutral) tags.push({ variant: "neutral", label: "Fora das despesas" });

  const meta = neutral
    ? `${t.tipo === "fatura" ? "Pagamento de fatura" : "Transferência própria"} · ${contaNome(data, t.contaId)}`
    : `${cat} · ${contaNome(data, t.contaId)}`;

  const badge = neutral ? (
    <ArrowLeftRight size={16} />
  ) : t.pix ? (
    "PIX"
  ) : k === "income" ? (
    "+"
  ) : t.categoriaId ? (
    cat.slice(0, 2).toUpperCase()
  ) : (
    "?"
  );
  const tone: IconBadgeTone = neutral
    ? "muted"
    : pend
      ? "accent"
      : k === "income"
        ? "inverse"
        : "surface";
  const open = () => setUI((u) => ({ ...u, detail: t.id }));

  const categorizar = (c: string) => {
    updTx(t.id, { categoriaId: c });
    flash(`${t.estabelecimento} → ${catNome(data, c)}`);
    askRule(t.estabelecimento, c, "tx", t.id);
  };

  return (
    <div
      className={cn(
        "border-b border-divider",
        pend && !compact && "bg-accent-100",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open())
        }
        className={cn(
          "grid min-h-14 grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 py-3 hover:bg-surface",
          compact ? "px-1" : "px-2",
        )}
      >
        <IconBadge tone={tone}>{badge}</IconBadge>
        <div className="grid min-w-0 gap-0.75">
          <div
            className={cn(
              "truncate text-lg font-semibold",
              neutral && "text-neutral-600",
            )}
          >
            {t.descricao}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-700">
            <span>{meta}</span>
            {!compact &&
              tags.map((tg) => (
                <Tag key={tg.label} variant={tg.variant} size="sm">
                  {tg.label}
                </Tag>
              ))}
          </div>
        </div>
        <div
          className={cn(
            "text-lg num",
            k === "income" ? "font-extrabold" : "font-semibold",
            neutral && "text-neutral-600",
          )}
        >
          {neutral ? brl(Math.abs(t.valor)) : sgn(t.valor)}
        </div>
      </div>
      {pend && !compact && (
        <div className="grid gap-2 pr-2 pb-3 pl-14">
          <div className="text-xs font-semibold text-accent-800">
            Pix para pessoa física — para que foi?
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK.filter((c) => data.categorias.some((x) => x.id === c)).map(
              (c) => (
                <Button
                  key={c}
                  size="sm"
                  className="bg-canvas"
                  onClick={() => categorizar(c)}
                >
                  {catNome(data, c)}
                </Button>
              ),
            )}
            <Button variant="ghost" size="sm" onClick={open}>
              Outra…
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
