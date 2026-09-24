"use client";

import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions, DialogHeader } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { AutoGrid } from "@/components/ui/layout";
import { maskValorBR, parseValorBR, proximoDia } from "@/lib/format";
import { BANCOS, bancoDe } from "@/lib/import/pipeline";
import { useApp } from "@/lib/store";
import type { Conta } from "@/lib/types";

export type ContaEmEdicao = { tipo: Conta["tipo"]; conta?: Conta };

const OUTRO = "";
const SUB_PADRAO = { conta: "Conta corrente", cartao: "Cartão de crédito" };

/** Valor guardado → texto da máscara ("1.234,56"). */
const mascara = (v?: number) =>
  v ? maskValorBR(String(Math.round(v * 100))) : "";
const dia = (d?: string) => (d ? String(Number(d.slice(8, 10))) : "");
const diaValido = (s: string) => !s || (Number(s) >= 1 && Number(s) <= 31);

/** Criar, editar ou excluir uma conta bancária ou um cartão de crédito. */
export function ContaDialog({
  edicao,
  onClose,
}: {
  edicao: ContaEmEdicao;
  onClose: () => void;
}) {
  const { data, set, flash, hoje } = useApp();
  const { tipo, conta } = edicao;
  const cartao = tipo === "cartao";
  const [nome, setNome] = useState(conta?.nome ?? "");
  const [banco, setBanco] = useState(bancoDe(conta?.banco)?.nome ?? OUTRO);
  const [sub, setSub] = useState(
    conta && conta.sub !== SUB_PADRAO[tipo] ? conta.sub : "",
  );
  const [saldo, setSaldo] = useState(mascara(conta?.saldo));
  const [limite, setLimite] = useState(mascara(conta?.limite));
  const [fatura, setFatura] = useState(mascara(conta?.faturaAtual));
  const [fecha, setFecha] = useState(dia(conta?.fechamento));
  const [vence, setVence] = useState(dia(conta?.vencimento));

  const valid = !!nome.trim() && diaValido(fecha) && diaValido(vence);
  const artigo = cartao ? "o cartão" : "a conta";

  const trocarBanco = (b: string) => {
    // Nome vazio ou ainda igual ao banco anterior: acompanha o banco escolhido.
    if (!nome.trim() || nome === banco) setNome(b);
    setBanco(b);
  };

  const save = () => {
    if (!valid) return;
    const escolhido = BANCOS.find((b) => b.nome === banco);
    const anterior = bancoDe(conta?.banco);
    const nova: Conta = {
      ...conta,
      id: conta?.id ?? `conta${Date.now()}`,
      nome: nome.trim(),
      tipo,
      sub: sub.trim() || SUB_PADRAO[tipo],
      // Banco inalterado mantém as palavras-chave antigas (ex.: "nubank nu ultravioleta").
      banco: escolhido === anterior ? conta?.banco : escolhido?.banco,
    };
    if (cartao) {
      nova.limite = limite ? parseValorBR(limite) : undefined;
      nova.faturaAtual = fatura ? parseValorBR(fatura) : undefined;
      nova.fechamento = fecha ? proximoDia(hoje, Number(fecha)) : undefined;
      nova.vencimento = vence ? proximoDia(hoje, Number(vence)) : undefined;
    } else {
      nova.saldo = saldo ? parseValorBR(saldo) : 0;
    }
    set((s) => ({
      ...s,
      contas: conta
        ? s.contas.map((c) => (c.id === conta.id ? nova : c))
        : [...s.contas, nova],
    }));
    onClose();
    flash(
      conta
        ? `${nova.nome} atualizad${cartao ? "o" : "a"}`
        : `${cartao ? "Cartão" : "Conta"} ${nova.nome} criad${cartao ? "o" : "a"}`,
    );
  };

  const excluir = () => {
    if (!conta) return;
    const n = data.lancamentos.filter((t) => t.contaId === conta.id).length;
    const aviso = n
      ? `Excluir ${artigo} ${conta.nome}? ${n} lançamento${n > 1 ? "s" : ""} dess${cartao ? "e cartão" : "a conta"} também ser${n > 1 ? "ão" : "á"} apagado${n > 1 ? "s" : ""}.`
      : `Excluir ${artigo} ${conta.nome}?`;
    if (!confirm(aviso)) return;
    set((s) => ({
      ...s,
      contas: s.contas.filter((c) => c.id !== conta.id),
      lancamentos: s.lancamentos.filter((t) => t.contaId !== conta.id),
      importacoes: s.importacoes.filter((h) => h.contaId !== conta.id),
    }));
    onClose();
    flash(`${conta.nome} excluíd${cartao ? "o" : "a"}`);
  };

  const dinheiro = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
  ) => (
    <Field label={label} htmlFor={id}>
      <Input
        id={id}
        inputMode="numeric"
        placeholder="0,00"
        className="num"
        value={value}
        onChange={(e) => onChange(maskValorBR(e.target.value))}
      />
    </Field>
  );

  const diaDoMes = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
  ) => (
    <Field label={label} htmlFor={id}>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        max={31}
        placeholder="Dia"
        value={value}
        aria-invalid={!diaValido(value)}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, "").slice(0, 2))
        }
      />
    </Field>
  );

  return (
    <Dialog labelledBy="conta-title" onClose={onClose} onSubmit={save}>
      <DialogHeader
        kicker="Contas e cartões"
        title={
          conta
            ? `Editar ${cartao ? "cartão" : "conta"}`
            : cartao
              ? "Novo cartão de crédito"
              : "Nova conta"
        }
        titleId="conta-title"
        onClose={onClose}
      />
      <Field
        label="Banco"
        htmlFor="conta-banco"
        hint="Usado para reconhecer extratos e faturas na importação."
      >
        <Select
          id="conta-banco"
          value={banco}
          onChange={(e) => trocarBanco(e.target.value)}
        >
          {BANCOS.map((b) => (
            <option key={b.nome} value={b.nome}>
              {b.nome}
            </option>
          ))}
          <option value={OUTRO}>Outro</option>
        </Select>
      </Field>
      <Field label="Nome" htmlFor="conta-nome">
        <Input
          id="conta-nome"
          required
          placeholder={cartao ? "Ex.: Nubank Ultravioleta" : "Ex.: Itaú"}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </Field>
      <Field label="Detalhe (opcional)" htmlFor="conta-sub">
        <Input
          id="conta-sub"
          placeholder={
            cartao ? "Ex.: Crédito •••• 4821" : "Ex.: Conta corrente · ag. 0421"
          }
          value={sub}
          onChange={(e) => setSub(e.target.value)}
        />
      </Field>
      {cartao ? (
        <>
          <AutoGrid min={150} className="gap-2.5">
            {dinheiro("conta-limite", "Limite", limite, setLimite)}
            {dinheiro("conta-fatura", "Fatura atual", fatura, setFatura)}
          </AutoGrid>
          <AutoGrid min={150} className="gap-2.5">
            {diaDoMes("conta-fecha", "Dia do fechamento", fecha, setFecha)}
            {diaDoMes("conta-vence", "Dia do vencimento", vence, setVence)}
          </AutoGrid>
        </>
      ) : (
        dinheiro("conta-saldo", "Saldo atual", saldo, setSaldo)
      )}
      <DialogActions>
        {conta && (
          <Button variant="ghost" className="mr-auto" onClick={excluir}>
            <Trash2 size={16} />
            Excluir
          </Button>
        )}
        <Button onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary" disabled={!valid}>
          Salvar
          <Check size={16} />
        </Button>
      </DialogActions>
    </Dialog>
  );
}
