"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button, ToggleButton } from "@/components/ui/button";
import { Dialog, DialogActions, DialogHeader } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { catNome } from "@/lib/derive";
import { brl, parseValorBR } from "@/lib/format";
import { useApp } from "@/lib/store";

/** Adição rápida de um gasto em dinheiro (ou em qualquer conta). */
export function QuickAddDialog() {
  const { data, ui, setUI, set, flash, hoje } = useApp();
  const [amt, setAmt] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [acc, setAcc] = useState("dinheiro");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ui.qa) {
      setAmt("");
      setDesc("");
      setCat("");
      setAcc(
        data.contas.some((c) => c.id === "dinheiro")
          ? "dinheiro"
          : data.contas[0]?.id,
      );
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
      lancamentos: [
        {
          id: `m${Date.now()}`,
          data: hoje,
          descricaoOriginal: d,
          descricao: d || catNome(s, cat),
          estabelecimento: d,
          valor: -v,
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
        kicker="Adição rápida"
        title="Gasto em dinheiro"
        titleId="qa-title"
        onClose={close}
      />
      <div className="flex items-baseline gap-2 border-b border-divider pb-1">
        <span className="text-[22px] font-extrabold">R$</span>
        <input
          ref={ref}
          inputMode="decimal"
          placeholder="0,00"
          aria-label="Valor"
          value={amt}
          onChange={(e) => setAmt(e.target.value.replace(/[^\d,.]/g, ""))}
          className="w-full border-0 bg-transparent p-0 text-[40px] leading-[normal] font-extrabold num text-fg outline-none focus-visible:outline-none"
        />
      </div>
      <Field label="Descrição" htmlFor="qa-desc">
        <Input
          id="qa-desc"
          placeholder="Ex.: feira, café, estacionamento"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </Field>
      <Field label="Categoria">
        <div className="flex flex-wrap gap-1.5">
          {data.categorias
            .filter((c) => c.id !== "salario")
            .map((c) => (
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
      <Field label="Saiu de" htmlFor="qa-acc">
        <Select
          id="qa-acc"
          value={acc}
          onChange={(e) => setAcc(e.target.value)}
        >
          {data.contas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.tipo === "cartao" ? `${c.nome} (cartão)` : c.nome}
            </option>
          ))}
        </Select>
      </Field>
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
