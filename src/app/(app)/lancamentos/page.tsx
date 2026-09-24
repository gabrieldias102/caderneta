"use client";

import Link from "next/link";
import { ArrowLeftRight, PenLine, Plus, Search, Upload } from "lucide-react";
import { TxRow } from "@/components/lancamentos/tx-row";
import { Button, buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Field, Input, Select } from "@/components/ui/form";
import { AutoGrid, PageHeader } from "@/components/ui/layout";
import { kindOf, periodo } from "@/lib/derive";
import {
  DOW,
  MES,
  MON,
  addDays,
  addMonths,
  brl,
  cap,
  monthOf,
  parseISO,
} from "@/lib/format";
import { useApp, type Store } from "@/lib/store";
import type { ISODate, Lancamento } from "@/lib/types";

type Filtros = Store["lancFilters"];

export default function Lancamentos() {
  const { data, hoje, lancFilters: f, setLancFilters, setUI } = useApp();
  const { ym } = periodo(hoje);
  const ant = addMonths(ym, -1);
  const setF = (patch: Partial<Filtros>) =>
    setLancFilters((x) => ({ ...x, ...patch }));

  const list = filtrar(data.lancamentos, f, hoje);
  const groups = porDia(list);
  const desp = list
    .filter((t) => kindOf(t) === "expense")
    .reduce((a, t) => a - t.valor, 0);
  const rec = list
    .filter((t) => kindOf(t) === "income")
    .reduce((a, t) => a + t.valor, 0);
  const openQA = (qa: "dinheiro" | "manual") => setUI((u) => ({ ...u, qa }));

  return (
    <>
      <PageHeader
        kicker={`${list.length} lançamento${list.length === 1 ? "" : "s"}`}
        title="Lançamentos"
      >
        <div className="hidden gap-2 lg:flex">
          <Button onClick={() => openQA("manual")}>
            <PenLine size={18} />
            Novo lançamento
          </Button>
          <Button variant="primary" onClick={() => openQA("dinheiro")}>
            <Plus size={18} />
            Gasto em dinheiro
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-2.5 border-b border-divider pb-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute top-2.75 left-3 text-neutral-600"
          />
          <Input
            type="search"
            aria-label="Buscar"
            className="pl-10"
            placeholder="Buscar por estabelecimento, pessoa ou valor"
            value={f.q}
            onChange={(e) => setF({ q: e.target.value })}
          />
        </div>
        <AutoGrid min={150} className="gap-2.5">
          <Field label="Conta ou cartão" htmlFor="f-acc">
            <Select
              id="f-acc"
              value={f.acc}
              onChange={(e) => setF({ acc: e.target.value })}
            >
              <option value="all">Todas</option>
              {data.contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tipo === "cartao" ? `${c.nome} (cartão)` : c.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Categoria" htmlFor="f-cat">
            <Select
              id="f-cat"
              value={f.cat}
              onChange={(e) => setF({ cat: e.target.value })}
            >
              <option value="all">Todas</option>
              <option value="none">Sem categoria</option>
              {data.categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Período" className="max-lg:col-span-full">
            <Segmented
              name="per"
              stretch
              value={f.per}
              onChange={(v) => setF({ per: v })}
              options={[
                ["mes", cap(MES[Number(ym.slice(5)) - 1])],
                ["7d", "7 dias"],
                ["ant", cap(MES[Number(ant.slice(5)) - 1])],
              ]}
            />
          </Field>
        </AutoGrid>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-neutral-700">
          <span>
            Despesas <strong className="num text-fg">{brl(desp)}</strong>
          </span>
          <span>
            Receitas <strong className="num text-fg">{brl(rec)}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ArrowLeftRight size={16} />
            Transferências e faturas não somam
          </span>
        </div>
      </div>

      {list.length === 0 && (
        <div className="grid max-w-105 gap-2.5 py-10">
          <h4>Nada por aqui</h4>
          <div className="text-md text-neutral-700">
            Nenhum lançamento com esses filtros. Se for um mês ainda não
            importado, envie o extrato ou a fatura.
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/importar" className={buttonVariants()}>
              <Upload size={16} />
              Importar arquivo
            </Link>
            <Button onClick={() => openQA("manual")}>
              <PenLine size={16} />
              Adicionar manualmente
            </Button>
          </div>
        </div>
      )}

      {groups.map((g) => (
        <div key={g.d}>
          <div className="sticky top-(--sticky-top) z-2 flex items-baseline justify-between border-b border-divider bg-canvas pt-4.5 pb-1.5">
            <span className="text-xs font-semibold tracking-caps uppercase">
              {rotuloDia(g.d, hoje)}
            </span>
            <span className="text-xs num text-neutral-700">
              {g.sum ? `− ${brl(g.sum)}` : ""}
            </span>
          </div>
          {g.items.map((t) => (
            <TxRow key={t.id} t={t} />
          ))}
        </div>
      ))}

      <div className="sticky bottom-19 z-5 mt-4 flex justify-end gap-2 lg:hidden">
        <Button
          onClick={() => openQA("manual")}
          className="h-13 px-4.5 text-lg shadow-md"
        >
          <PenLine size={18} />
          Lançamento
        </Button>
        <Button
          variant="primary"
          onClick={() => openQA("dinheiro")}
          className="h-13 px-4.5 text-lg shadow-md"
        >
          <Plus size={18} />
          Dinheiro
        </Button>
      </div>
    </>
  );
}

/** Aplica período, conta, categoria e busca; mais recentes primeiro. */
function filtrar(
  lancamentos: Lancamento[],
  f: Filtros,
  hoje: ISODate,
): Lancamento[] {
  const ym = monthOf(hoje);
  const q = f.q.trim().toLowerCase();
  return lancamentos
    .filter((t) =>
      f.per === "mes"
        ? monthOf(t.data) === ym
        : f.per === "7d"
          ? t.data > addDays(hoje, -7) && t.data <= hoje
          : monthOf(t.data) === addMonths(ym, -1),
    )
    .filter((t) => f.acc === "all" || t.contaId === f.acc)
    .filter(
      (t) =>
        f.cat === "all" ||
        (f.cat === "none"
          ? !t.categoriaId && !t.tipo
          : t.categoriaId === f.cat),
    )
    .filter(
      (t) =>
        !q ||
        `${t.descricao} ${t.estabelecimento} ${t.descricaoOriginal} ${Math.abs(t.valor).toFixed(2).replace(".", ",")} ${brl(Math.abs(t.valor))}`
          .toLowerCase()
          .includes(q),
    )
    .sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id));
}

/** Agrupa uma lista já ordenada por dia, somando as despesas de cada um. */
function porDia(list: Lancamento[]) {
  const groups: { d: ISODate; items: Lancamento[]; sum: number }[] = [];
  for (const t of list) {
    let g = groups[groups.length - 1];
    if (!g || g.d !== t.data) {
      g = { d: t.data, items: [], sum: 0 };
      groups.push(g);
    }
    g.items.push(t);
    if (kindOf(t) === "expense") g.sum -= t.valor;
  }
  return groups;
}

function rotuloDia(d: ISODate, hoje: ISODate) {
  const dt = parseISO(d);
  const n = `${dt.getDate()} ${MON[dt.getMonth()]}`;
  return d === hoje
    ? `Hoje · ${n}`
    : d === addDays(hoje, -1)
      ? `Ontem · ${n}`
      : `${DOW[dt.getDay()]} · ${n}`;
}
