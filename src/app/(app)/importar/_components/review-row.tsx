"use client";

import { ArrowLeftRight, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { AutoGrid } from "@/components/ui/layout";
import { Tag, type TagVariant } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import { MON, addMonths, brl, fmtD, monthOf, sgn } from "@/lib/format";
import { nivelConfianca, precisaRevisao } from "@/lib/import/pipeline";
import { useApp } from "@/lib/store";
import type { ItemRevisao } from "@/lib/types";

/** Uma linha da revisão: seleção, valores, aviso de duplicata, categoria e confiança. */
export function ReviewRow({
  r,
  selected,
  onToggle,
  onChange,
}: {
  r: ItemRevisao;
  selected: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<ItemRevisao>) => void;
}) {
  const { data, askRule } = useApp();
  const neutral = !!r.tipo;
  const pixPend = !!r.pix?.pessoaFisica && !r.editado && !r.porRegra;

  return (
    <div
      className={cn(
        "grid grid-cols-[24px_minmax(0,1fr)] gap-3 border-b border-divider px-2 py-3.5",
        pixPend ? "bg-accent-100" : r.duplicataDe && "bg-neutral-100",
        r.ignorado && "opacity-55",
      )}
    >
      <input
        type="checkbox"
        aria-label={`Selecionar ${r.estabelecimento}`}
        checked={selected}
        className="mt-0.75"
        onChange={onToggle}
      />
      <div className="grid min-w-0 gap-2.5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
          <div className="min-w-0">
            <div
              className={cn(
                "text-lg font-semibold",
                neutral && "text-neutral-600",
              )}
            >
              {r.estabelecimento || r.descricaoOriginal}
            </div>
            <div className="truncate font-mono text-2xs text-neutral-700">
              {fmtD(r.data)} · {r.descricaoOriginal}
            </div>
          </div>
          <div
            className={cn(
              "text-lg num",
              r.valor > 0 && !neutral ? "font-extrabold" : "font-semibold",
              neutral && "text-neutral-600",
            )}
          >
            {neutral ? brl(Math.abs(r.valor)) : sgn(r.valor)}
          </div>
        </div>

        {r.duplicataDe && (
          <div className="flex flex-wrap items-center gap-2.5 rounded-md border border-divider bg-card px-2.5 py-2 text-sm">
            <TriangleAlert size={16} className="text-accent" />
            <span className="mr-auto">
              Possível duplicata — já lançado em {r.duplicataDe} por uma
              importação anterior
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ ignorado: !r.ignorado })}
            >
              {r.ignorado ? "Importar mesmo assim" : "Não importar"}
            </Button>
          </div>
        )}

        {neutral ? (
          <div className="flex items-center gap-2 text-sm text-neutral-700">
            <ArrowLeftRight size={16} />
            {r.tipo === "fatura"
              ? "Pagamento da fatura — não conta como despesa"
              : "Transferência entre suas contas — não conta como despesa"}
          </div>
        ) : (
          <AutoGrid min={180} className="items-center gap-2.5">
            <Select
              aria-label={`Categoria de ${r.estabelecimento}`}
              value={r.categoriaId}
              className={cn(precisaRevisao(r) && "border-accent")}
              onChange={(e) => {
                const c = e.target.value;
                onChange({ categoriaId: c, editado: true });
                if (c) askRule(r.estabelecimento, c, "import", r.k);
              }}
            >
              <option value="">Escolher categoria…</option>
              {data.categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
            <Confidence r={r} />
          </AutoGrid>
        )}

        <ReviewTags r={r} />
      </div>
    </div>
  );
}

const CONF_LABEL = {
  voce: "Você definiu",
  regra: "Regra automática",
  alta: "Confiança alta",
  media: "Confiança média",
  baixa: "Confiança baixa",
  nenhuma: "Sem sugestão",
};
const CONF_FILL = {
  voce: 3,
  regra: 3,
  alta: 3,
  media: 2,
  baixa: 1,
  nenhuma: 0,
};
const SUGERIDA = ["alta", "media", "baixa"];

/** Certeza da categoria sugerida, como medidor de 3 barras ou porcentagem (Configurações › Conta). */
function Confidence({ r }: { r: ItemRevisao }) {
  const { data } = useApp();
  const pct = data.prefs.confStyle === "porcentagem";
  const lvl = nivelConfianca(r);
  const weak = lvl === "baixa" || lvl === "nenhuma";
  const filled = lvl === "n" ? 0 : CONF_FILL[lvl];
  const sugerida = SUGERIDA.includes(lvl);
  return (
    <div className="flex items-center gap-2 text-xs">
      {!pct && (
        <div className="flex gap-0.5" aria-hidden>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-3.5 rounded-xs",
                i > filled ? "bg-neutral-300" : weak ? "bg-accent" : "bg-fg",
              )}
            />
          ))}
        </div>
      )}
      <span className={cn("font-semibold", weak && "text-accent-700")}>
        {pct && sugerida
          ? `${Math.round(r.confianca * 100)}% de confiança`
          : CONF_LABEL[lvl as keyof typeof CONF_LABEL]}
      </span>
      {!pct && sugerida && (
        <span className="text-neutral-700">
          {Math.round(r.confianca * 100)}%
        </span>
      )}
    </div>
  );
}

function ReviewTags({ r }: { r: ItemRevisao }) {
  const tags: { variant: TagVariant; label: string }[] = [];
  if (r.pix?.pessoaFisica)
    tags.push({ variant: "accent", label: "Pix para pessoa física" });
  else if (r.pix) tags.push({ variant: "neutral", label: "Pix" });
  if (r.parcela) {
    const fut = r.parcela.total - r.parcela.atual;
    tags.push({
      variant: "outline",
      label: `Parcela ${r.parcela.atual}/${r.parcela.total}`,
    });
    if (fut > 0) {
      const ate = MON[Number(addMonths(monthOf(r.data), fut).slice(5)) - 1];
      tags.push({
        variant: "neutral",
        label: `+${fut} parcela${fut > 1 ? "s" : ""} projetada${fut > 1 ? "s" : ""} até ${ate}`,
      });
    }
  }
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <Tag key={t.label} variant={t.variant}>
          {t.label}
        </Tag>
      ))}
    </div>
  );
}
