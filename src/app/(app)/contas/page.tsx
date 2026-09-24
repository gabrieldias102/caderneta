"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Upload } from "lucide-react";
import { Button, IconButton, buttonVariants } from "@/components/ui/button";
import { ColumnChart } from "@/components/ui/column-chart";
import {
  AutoGrid,
  BigNumber,
  Card,
  EmptyState,
  PageHeader,
  SectionHeader,
} from "@/components/ui/layout";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Table, Td, Th } from "@/components/ui/table";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import { diasAte, parcelasAtivas, periodo } from "@/lib/derive";
import { addMonths, brl, brl0, fmtD, monLabel } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { Conta } from "@/lib/types";
import { ContaDialog, type ContaEmEdicao } from "./_components/conta-dialog";

export default function Contas() {
  const { data, hoje } = useApp();
  const contas = data.contas.filter((c) => c.tipo === "conta");
  const cartoes = data.contas.filter((c) => c.tipo === "cartao");
  const total = contas.reduce((a, c) => a + (c.saldo ?? 0), 0);
  const [edicao, setEdicao] = useState<ContaEmEdicao | null>(null);

  return (
    <>
      <PageHeader
        kicker={`Saldo total ${brl(total)}`}
        title="Contas e cartões"
      />

      <Grupo
        titulo="Contas"
        acao="Nova conta"
        onNovo={() => setEdicao({ tipo: "conta" })}
      />
      {contas.length === 0 && <EmptyState>Nenhuma conta ainda.</EmptyState>}
      <AutoGrid min={220} className="mb-8">
        {contas.map((c) => (
          <Card key={c.id} className="grid gap-1 p-4.5">
            <div className="flex items-start gap-2">
              <div className="mr-auto min-w-0">
                <div className="font-semibold">{c.nome}</div>
                <div className="text-xs text-neutral-700">{c.sub}</div>
              </div>
              <Editar
                c={c}
                onClick={() => setEdicao({ tipo: c.tipo, conta: c })}
              />
            </div>
            <BigNumber className="mt-2">{brl(c.saldo ?? 0)}</BigNumber>
            <div className="text-xs text-neutral-700">
              {c.ultimoExtrato?.startsWith("Atualizado")
                ? c.ultimoExtrato
                : `Último extrato: ${c.ultimoExtrato ?? "—"}`}
            </div>
          </Card>
        ))}
      </AutoGrid>

      <Grupo
        titulo="Cartões de crédito"
        acao="Novo cartão"
        onNovo={() => setEdicao({ tipo: "cartao" })}
      />
      {cartoes.length === 0 && <EmptyState>Nenhum cartão ainda.</EmptyState>}
      <AutoGrid min={280} className="mb-8">
        {cartoes.map((c) => (
          <CartaoCard
            key={c.id}
            c={c}
            dias={diasAte(c, hoje)}
            onEditar={() => setEdicao({ tipo: "cartao", conta: c })}
          />
        ))}
      </AutoGrid>

      <Parcelas />

      {edicao && (
        <ContaDialog edicao={edicao} onClose={() => setEdicao(null)} />
      )}
    </>
  );
}

function Grupo({
  titulo,
  acao,
  onNovo,
}: {
  titulo: string;
  acao: string;
  onNovo: () => void;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-3">
      <h5 className="mr-auto">{titulo}</h5>
      <Button size="sm" onClick={onNovo}>
        <Plus size={16} />
        {acao}
      </Button>
    </div>
  );
}

function Editar({ c, onClick }: { c: Conta; onClick: () => void }) {
  return (
    <IconButton
      label={`Editar ${c.nome}`}
      className="-mt-1.5 -mr-1.5"
      onClick={onClick}
    >
      <Pencil size={16} />
    </IconButton>
  );
}

function CartaoCard({
  c,
  dias,
  onEditar,
}: {
  c: Conta;
  dias: number;
  onEditar: () => void;
}) {
  const { setImp, resetImp } = useApp();
  const fatura = c.faturaAtual ?? 0,
    limite = c.limite ?? 0;
  return (
    <Card className="grid gap-2.5 p-4.5">
      <div className="flex items-baseline gap-2">
        <div className="mr-auto">
          <div className="font-semibold">{c.nome}</div>
          <div className="text-xs text-neutral-700">{c.sub}</div>
        </div>
        {c.vencimento && (
          <Tag variant={dias >= 0 && dias <= 10 ? "accent" : "neutral"}>
            Vence {fmtD(c.vencimento)}
          </Tag>
        )}
        <Editar c={c} onClick={onEditar} />
      </div>
      <div>
        <div className="text-xs text-neutral-700">
          Fatura atual{c.fechamento ? ` · fecha ${fmtD(c.fechamento)}` : ""}
        </div>
        <BigNumber>{brl(fatura)}</BigNumber>
      </div>
      <ProgressBar
        value={limite ? (fatura / limite) * 100 : 0}
        className="h-1.5"
      />
      <div className="flex justify-between text-xs text-neutral-700">
        <span>{brl0(limite - fatura)} disponível</span>
        <span>Limite {brl0(limite)}</span>
      </div>
      <Link
        href="/importar"
        onClick={() => {
          resetImp();
          setImp({ dest: c.id });
        }}
        className={cn(buttonVariants(), "justify-start")}
      >
        <Upload size={16} />
        Importar fatura
      </Link>
    </Card>
  );
}

/** Projeção das parcelas em aberto nas próximas seis faturas. */
function Parcelas() {
  const { data, hoje } = useApp();
  const { ym } = periodo(hoje);
  const ativas = parcelasAtivas(data, ym);
  const proj = Array.from({ length: 6 }, (_, i) => {
    const k = i + 1;
    const v = ativas.reduce((a, p) => a + (p.restantes >= k ? p.porMes : 0), 0);
    const m = monLabel(addMonths(ym, k));
    return { key: m, label: m, value: v, valueLabel: brl0(v) };
  });
  const projTotal = ativas.reduce((a, p) => a + p.restantes * p.porMes, 0);
  const nomeConta = (id: string) =>
    data.contas.find((c) => c.id === id)?.nome ?? "—";

  return (
    <>
      <SectionHeader title="Parcelas nas próximas faturas">
        <span className="text-sm num">{brl(projTotal)} já comprometidos</span>
      </SectionHeader>
      <ColumnChart
        label="Parcelas projetadas nos próximos 6 meses"
        columns={proj}
        scale={0.75}
        className="h-35 pt-3"
        columnClassName="border-[1.5px] border-dashed border-accent bg-accent-100"
      />
      <Table className="mt-4">
        <thead>
          <tr>
            <Th>Compra</Th>
            <Th>Parcela</Th>
            <Th className="text-right">Por mês</Th>
            <Th className="text-right">Falta pagar</Th>
          </tr>
        </thead>
        <tbody>
          {ativas.map(({ t, restantes, porMes }) => (
            <tr key={t.id}>
              <Td>
                <div className="font-semibold">{t.descricao}</div>
                <div className="text-xs text-neutral-700">
                  {nomeConta(t.contaId)} · termina em{" "}
                  {monLabel(addMonths(ym, restantes), true)}
                </div>
              </Td>
              <Td>
                <Tag variant="outline">
                  {t.parcela!.atual}/{t.parcela!.total}
                </Tag>
              </Td>
              <Td className="text-right num">{brl(porMes)}</Td>
              <Td className="text-right font-semibold num">
                {brl(porMes * restantes)}
              </Td>
            </tr>
          ))}
          {ativas.length === 0 && (
            <tr>
              <Td colSpan={4} className="text-neutral-700">
                Nenhuma compra parcelada em andamento.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
}
