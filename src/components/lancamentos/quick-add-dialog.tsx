"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button, ToggleButton } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Dialog, DialogActions, DialogHeader } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { AutoGrid } from "@/components/ui/layout";
import { catNome } from "@/lib/derive";
import { brl, maskValorBR, parseValorBR } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { Conta, DataState } from "@/lib/types";

type Forma = "credito" | "debito";

/** Contas que aparecem em cada forma: cartões no crédito, contas bancárias no débito. */
const contasDa = (s: DataState, forma: Forma): Conta[] =>
  s.contas.filter((c) =>
    forma === "credito"
      ? c.tipo === "cartao"
      : c.tipo === "conta" && c.id !== "dinheiro",
  );

/**
 * Adição manual. "dinheiro": gasto rápido na carteira, com data de hoje.
 * "manual": lançamento no crédito ou débito, com data e entrada/saída.
 */
export function QuickAddDialog() {
  const { data, ui, setUI, set, flash, hoje } = useApp();
  const [amt, setAmt] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [acc, setAcc] = useState("dinheiro");
  const [forma, setForma] = useState<Forma>("credito");
  const [entrada, setEntrada] = useState(false);
  const [dia, setDia] = useState(hoje);
  const ref = useRef<HTMLInputElement>(null);
  const mode = ui.qa;

  useEffect(() => {
    if (!mode) return;
    setAmt("");
    setDesc("");
    setCat("");
    setEntrada(false);
    setDia(hoje);
    if (mode === "dinheiro") {
      setAcc(
        data.contas.some((c) => c.id === "dinheiro")
          ? "dinheiro"
          : data.contas[0]?.id,
      );
    } else {
      const f = contasDa(data, "credito").length ? "credito" : "debito";
      setForma(f);
      setAcc(contasDa(data, f)[0]?.id ?? "");
    }
    setTimeout(() => ref.current?.focus(), 30);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mode) return null;
  const manual = mode === "manual";
  const close = () => setUI((u) => ({ ...u, qa: false }));
  const contas = manual ? contasDa(data, forma) : data.contas;
  const categorias = data.categorias.filter(
    (c) => entrada || c.id !== "salario",
  );
  const v = parseValorBR(amt || "0");
  const valid = v > 0 && !!cat && !!acc && !!dia;

  const trocarForma = (f: Forma) => {
    setForma(f);
    setAcc(contasDa(data, f)[0]?.id ?? "");
  };
  const trocarSentido = (e: boolean) => {
    setEntrada(e);
    if (!e && cat === "salario") setCat("");
  };

  const save = () => {
    if (!valid) return;
    const d = desc.trim();
    set((s) => ({
      ...s,
      lancamentos: [
        {
          id: `m${Date.now()}`,
          data: dia,
          descricaoOriginal: d,
          descricao: d || catNome(s, cat),
          estabelecimento: d,
          valor: entrada ? v : -v,
          contaId: acc,
          categoriaId: cat,
          origem: "manual",
        },
        ...s.lancamentos,
      ],
    }));
    close();
    flash(`${brl(v)} em ${catNome(data, cat)} adicionado`);
  };

  return (
    <Dialog labelledBy="qa-title" onClose={close} onSubmit={save}>
      <DialogHeader
        kicker={manual ? "Adição manual" : "Adição rápida"}
        title={manual ? "Novo lançamento" : "Gasto em dinheiro"}
        titleId="qa-title"
        onClose={close}
      />
      {manual && (
        <AutoGrid min={150} className="gap-2.5">
          <Segmented
            name="qa-forma"
            stretch
            value={forma}
            onChange={trocarForma}
            options={[
              ["credito", "Crédito"],
              ["debito", "Débito"],
            ]}
          />
          <Segmented
            name="qa-sentido"
            stretch
            value={entrada ? "entrada" : "saida"}
            onChange={(x) => trocarSentido(x === "entrada")}
            options={[
              ["saida", "Saída"],
              ["entrada", "Entrada"],
            ]}
          />
        </AutoGrid>
      )}
      <div className="flex items-baseline gap-2 border-b border-divider pb-1">
        <span className="text-[22px] font-extrabold">R$</span>
        <input
          ref={ref}
          inputMode="numeric"
          placeholder="0,00"
          aria-label="Valor"
          value={amt}
          onChange={(e) => setAmt(maskValorBR(e.target.value))}
          className="w-full border-0 bg-transparent p-0 text-[40px] leading-[normal] font-extrabold num text-fg outline-none focus-visible:outline-none"
        />
      </div>
      <Field label="Descrição" htmlFor="qa-desc">
        <Input
          id="qa-desc"
          placeholder={
            manual
              ? "Ex.: mercado, farmácia, assinatura"
              : "Ex.: feira, café, estacionamento"
          }
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </Field>
      <Field label="Categoria">
        <div className="flex flex-wrap gap-1.5">
          {categorias.map((c) => (
            <ToggleButton
              key={c.id}
              pressed={cat === c.id}
              onClick={() => setCat(c.id)}
            >
              {c.nome}
            </ToggleButton>
          ))}
        </div>
      </Field>
      <AutoGrid min={150} className="gap-2.5">
        <Field
          label={
            manual ? (forma === "credito" ? "Cartão" : "Conta") : "Saiu de"
          }
          htmlFor="qa-acc"
          hint={
            contas.length === 0
              ? forma === "credito"
                ? "Nenhum cartão cadastrado."
                : "Nenhuma conta bancária cadastrada."
              : undefined
          }
        >
          <Select
            id="qa-acc"
            value={acc}
            disabled={contas.length === 0}
            onChange={(e) => setAcc(e.target.value)}
          >
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {!manual && c.tipo === "cartao" ? `${c.nome} (cartão)` : c.nome}
              </option>
            ))}
          </Select>
        </Field>
        {manual && (
          <Field label="Data" htmlFor="qa-data">
            <Input
              id="qa-data"
              type="date"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
            />
          </Field>
        )}
      </AutoGrid>
      <DialogActions>
        <Button onClick={close}>Cancelar</Button>
        <Button type="submit" variant="primary" disabled={!valid}>
          Salvar
          <Check size={16} />
        </Button>
      </DialogActions>
    </Dialog>
  );
}
