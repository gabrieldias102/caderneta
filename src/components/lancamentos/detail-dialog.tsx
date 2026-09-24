"use client";

import { ArrowLeftRight } from "lucide-react";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Checkbox, Field, Select } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { catNome, contaNome, kindOf } from "@/lib/derive";
import { addMonths, brl, fmtDFull, monLabel, monthOf, sgn } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { ISODate, Parcela } from "@/lib/types";

/** Detalhe de um lançamento: dados, categoria, compartilhamento e parcelas. */
export function DetailDialog() {
  const { data, ui, setUI, updTx, flash, askRule } = useApp();
  const t = ui.detail
    ? data.lancamentos.find((x) => x.id === ui.detail)
    : undefined;
  if (!t) return null;
  const close = () => setUI((u) => ({ ...u, detail: null }));
  const k = kindOf(t);
  const neutral = k === "neutral";
  const grupo = data.grupo;
  const parceiro = grupo?.parceiro.nome.split(" ")[0];

  const rows: [string, string][] = [
    ["Data", fmtDFull(t.data)],
    ["Conta", contaNome(data, t.contaId)],
  ];
  if (t.estabelecimento && !neutral)
    rows.push(["Estabelecimento", t.estabelecimento]);
  if (t.parcela)
    rows.push([
      "Parcela",
      `${t.parcela.atual} de ${t.parcela.total} · total ${brl(-t.valor * t.parcela.total)}`,
    ]);
  if (t.origem === "arquivo") rows.push(["No extrato", t.descricaoOriginal]);

  const mudarCategoria = (c: string) => {
    updTx(t.id, { categoriaId: c || undefined });
    close();
    if (c) {
      flash(`${t.estabelecimento || t.descricao} → ${catNome(data, c)}`);
      askRule(t.estabelecimento, c, "tx", t.id);
    }
  };

  const alternarCompartilhado = () => {
    updTx(t.id, { compartilhado: !t.compartilhado });
    flash(
      t.compartilhado
        ? "Removido das compartilhadas"
        : `Marcado como compartilhado com ${parceiro}`,
    );
  };

  return (
    <Dialog labelledBy="det-title" onClose={close}>
      <DialogHeader
        kicker={
          neutral
            ? "Movimentação neutra"
            : t.pix
              ? "Pix"
              : k === "income"
                ? "Receita"
                : "Despesa"
        }
        title={t.descricao}
        titleId="det-title"
        onClose={close}
      />
      <div
        className={cn(
          "text-[36px] leading-none font-extrabold num",
          neutral && "text-neutral-600",
        )}
      >
        {neutral ? brl(Math.abs(t.valor)) : sgn(t.valor)}
      </div>
      <div className="border-t border-divider">
        {rows.map(([a, b]) => (
          <div
            key={a}
            className="flex justify-between gap-3 border-b border-divider py-2 text-md"
          >
            <span className="text-neutral-700">{a}</span>
            <span className="text-right wrap-anywhere">{b}</span>
          </div>
        ))}
      </div>
      {neutral ? (
        <div className="flex gap-2.5 rounded-md bg-neutral-200 p-3 text-sm">
          <ArrowLeftRight size={16} className="mt-0.5 flex-none" />
          <span>
            {t.tipo === "fatura"
              ? "Pagar a fatura não é um gasto novo: as compras já foram contadas quando você usou o cartão."
              : "Transferência entre contas suas — o dinheiro não saiu do seu bolso."}
          </span>
        </div>
      ) : (
        <>
          <Field label="Categoria" htmlFor="det-cat">
            <Select
              id="det-cat"
              value={t.categoriaId ?? ""}
              onChange={(e) => mudarCategoria(e.target.value)}
            >
              <option value="">Sem categoria</option>
              {data.categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </Field>
          {k === "expense" && grupo && (
            <Checkbox
              checked={!!t.compartilhado}
              onChange={alternarCompartilhado}
            >
              Compartilhado com {parceiro} ({grupo.nome})
            </Checkbox>
          )}
        </>
      )}
      {t.parcela && <Parcelas data={t.data} parcela={t.parcela} />}
    </Dialog>
  );
}

/** Linha do tempo das parcelas, com a atual em destaque. */
function Parcelas({
  data,
  parcela: { atual, total },
}: {
  data: ISODate;
  parcela: Parcela;
}) {
  const ym = monthOf(data);
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold tracking-label uppercase">
        Parcelas
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-3">
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1,
            cur = n === atual,
            past = n < atual;
          const m = monLabel(addMonths(ym, n - atual));
          return (
            <div
              key={n}
              className={cn(
                "rounded-sm border p-2 text-2xs",
                cur
                  ? "border-transparent bg-accent text-canvas"
                  : past
                    ? "border-transparent bg-neutral-200 text-neutral-600"
                    : "border-divider bg-card",
              )}
            >
              <div className="font-semibold">
                {n}/{total}
              </div>
              <div>{cur ? `${m} · atual` : m}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
