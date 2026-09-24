"use client";

import { Check, X } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Checkbox, Select } from "@/components/ui/form";
import { AutoGrid, BigNumber, Card, EmptyState } from "@/components/ui/layout";
import { cn } from "@/lib/cn";
import { catNome } from "@/lib/derive";
import { brl } from "@/lib/format";
import { precisaRevisao } from "@/lib/import/pipeline";
import { useApp } from "@/lib/store";
import type { ItemRevisao } from "@/lib/types";
import { ReviewRow } from "./review-row";

/** Etapa 3: revisar categorias, duplicatas e o que entra antes de confirmar. */
export function ReviewStep() {
  const { imp, setImp } = useApp();
  const all = imp.rows;
  const nRevisar = all.filter(precisaRevisao).length;
  const nDup = all.filter((r) => r.duplicataDe).length;
  const nParc = all.filter((r) => r.parcela).length;
  const vis = all.filter((r) =>
    imp.filter === "revisar"
      ? precisaRevisao(r)
      : imp.filter === "dup"
        ? !!r.duplicataDe
        : true,
  );
  const allSel = vis.length > 0 && vis.every((r) => imp.sel.includes(r.k));

  const updRow = (k: string, patch: Partial<ItemRevisao>) =>
    setImp((i) => ({
      rows: i.rows.map((x) => (x.k === k ? { ...x, ...patch } : x)),
    }));
  const toggle = (k: string) =>
    setImp((i) => ({
      sel: i.sel.includes(k) ? i.sel.filter((x) => x !== k) : [...i.sel, k],
    }));

  const stats = [
    { v: all.length, label: "lançamentos encontrados" },
    { v: nRevisar, label: "pedem sua revisão", highlight: true },
    { v: nDup, label: "possíveis duplicatas" },
    {
      v: nParc,
      label: nParc === 1 ? "compra parcelada" : "compras parceladas",
    },
  ];

  return (
    <>
      <AutoGrid min={140} className="mb-5">
        {stats.map((s) => (
          <Card key={s.label} className="px-4 py-3.5">
            <BigNumber
              className={cn("leading-none", s.highlight && "text-accent-700")}
            >
              {s.v}
            </BigNumber>
            <div className="mt-1 text-xs text-neutral-700">{s.label}</div>
          </Card>
        ))}
      </AutoGrid>

      <div className="flex flex-wrap items-center gap-3 border-b border-divider pb-3">
        <Checkbox
          className="min-h-9 gap-2 text-sm"
          checked={allSel}
          onChange={() => setImp({ sel: allSel ? [] : vis.map((r) => r.k) })}
        >
          Selecionar todos
        </Checkbox>
        <Segmented
          name="rf"
          className="ml-auto"
          value={imp.filter}
          onChange={(v) => setImp({ filter: v, sel: [] })}
          options={[
            ["todos", `Todos ${all.length}`],
            ["revisar", `Revisar ${nRevisar}`],
            ["dup", `Duplicatas ${nDup}`],
          ]}
        />
      </div>

      {imp.sel.length > 0 && <SelectionBar />}

      {vis.length === 0 && (
        <EmptyState className="py-6">Nada neste filtro.</EmptyState>
      )}
      {vis.map((r) => (
        <ReviewRow
          key={r.k}
          r={r}
          selected={imp.sel.includes(r.k)}
          onToggle={() => toggle(r.k)}
          onChange={(patch) => updRow(r.k, patch)}
        />
      ))}

      <ReviewFooter />
    </>
  );
}

/** Ações em lote para as linhas selecionadas; gruda no topo ao rolar. */
function SelectionBar() {
  const { data, imp, setImp, flash } = useApp();
  const n = imp.sel.length;

  const aplicarCategoria = (c: string) => {
    if (!c) return;
    const afetados = imp.rows.filter(
      (x) => imp.sel.includes(x.k) && !x.tipo,
    ).length;
    setImp((i) => ({
      rows: i.rows.map((x) =>
        i.sel.includes(x.k) && !x.tipo
          ? { ...x, categoriaId: c, editado: true }
          : x,
      ),
      sel: [],
    }));
    flash(
      `${catNome(data, c)} aplicada a ${afetados} lançamento${afetados > 1 ? "s" : ""}`,
    );
  };

  const ignorar = () =>
    setImp((i) => ({
      rows: i.rows.map((x) =>
        i.sel.includes(x.k) ? { ...x, ignorado: true } : x,
      ),
      sel: [],
    }));

  return (
    <div className="sticky top-[calc(var(--sticky-top,0px)+8px)] z-4 mt-2 flex flex-wrap items-center gap-2.5 rounded-md bg-fg px-3 py-2.5 text-canvas">
      <strong className="mr-auto text-md">
        {n} selecionado{n > 1 ? "s" : ""}
      </strong>
      <Select
        aria-label="Mudar categoria dos selecionados"
        className="w-auto min-w-45 bg-canvas"
        value=""
        onChange={(e) => aplicarCategoria(e.target.value)}
      >
        <option value="">Mudar categoria…</option>
        {data.categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </Select>
      <Button className="border-neutral-500 text-canvas" onClick={ignorar}>
        Não importar
      </Button>
      <IconButton
        label="Limpar seleção"
        className="text-canvas"
        onClick={() => setImp({ sel: [] })}
      >
        <X size={18} />
      </IconButton>
    </div>
  );
}

/** Resumo do que será importado e confirmação; gruda na base da tela. */
function ReviewFooter() {
  const { imp, confirmImport, resetImp } = useApp();
  const incl = imp.rows.filter((r) => !r.ignorado);
  const despesas = incl
    .filter((r) => !r.tipo && r.valor < 0)
    .reduce((a, r) => a - r.valor, 0);
  const semCategoria = incl.filter((r) => !r.tipo && !r.categoriaId).length;
  const um = incl.length === 1;

  return (
    <div className="sticky bottom-16 z-4 mt-2 flex flex-wrap items-center gap-3 border-t border-divider bg-canvas py-3.5 lg:bottom-0">
      <div className="mr-auto">
        <div className="text-md font-semibold">
          {incl.length} lançamento{um ? "" : "s"}{" "}
          {um ? "será importado" : "serão importados"}
        </div>
        <div className="text-xs text-neutral-700">
          Despesas {brl(despesas)} · {imp.rows.length - incl.length} ignorados ·{" "}
          {semCategoria} sem categoria
        </div>
      </div>
      <Button onClick={resetImp}>Descartar</Button>
      <Button
        variant="primary"
        className="min-h-11"
        disabled={incl.length === 0}
        onClick={confirmImport}
      >
        Confirmar importação
        <Check size={16} />
      </Button>
    </div>
  );
}
