"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
import { TxRow } from "@/components/lancamentos/tx-row";
import { buttonVariants } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon-badge";
import {
  AutoGrid,
  Card,
  EmptyState,
  HeroNumber,
  ListItem,
  Overline,
  PageHeader,
  Section,
  SectionHeader,
} from "@/components/ui/layout";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Tag } from "@/components/ui/tag";
import { useAlertas } from "@/hooks/use-alertas";
import { catNome, doMes, orcamentos, periodo, totais } from "@/lib/derive";
import { DOW_LONG, MES, brl, parseISO, sgn } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function Dashboard() {
  const { data, hoje } = useApp();
  const { ym, diasRestantes } = periodo(hoje);
  const { desp, rec, saldo, porCat } = totais(doMes(data, ym, hoje));
  const orc = orcamentos(data, porCat);
  const dt = parseISO(hoje);
  const recent = data.lancamentos
    .filter((t) => t.data <= hoje)
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 5);

  return (
    <>
      <PageHeader
        kicker={`${DOW_LONG[dt.getDay()]}, ${dt.getDate()} de ${MES[dt.getMonth()]}`}
        title={`Olá, ${data.nome}`}
      >
        <Link
          href="/importar"
          className={buttonVariants({ variant: "primary" })}
        >
          <Upload size={16} />
          Importar extrato
        </Link>
      </PageHeader>

      <AutoGrid>
        <Card className="flex flex-col gap-1.5">
          <Overline>Saldo do mês</Overline>
          <HeroNumber>{sgn(saldo)}</HeroNumber>
          <div className="text-sm text-neutral-700">
            Receitas menos despesas, até hoje. Transferências e faturas pagas
            ficam de fora.
          </div>
        </Card>
        <Card className="flex flex-col gap-1.5 bg-accent text-canvas">
          <Overline className="text-current">
            Quanto ainda posso gastar
          </Overline>
          <HeroNumber>{brl(orc.livre)}</HeroNumber>
          <div className="text-sm">
            {diasRestantes > 0 ? (
              <>
                ≈ {brl(orc.livre / diasRestantes)} por dia nos próximos{" "}
                {diasRestantes} dias, somando o que resta dos orçamentos.
              </>
            ) : (
              <>Último dia do mês — é o que resta somando os orçamentos.</>
            )}
          </div>
        </Card>
        <IncomeVsExpense rec={rec} desp={desp} />
      </AutoGrid>

      <AutoGrid min={300} className="mt-6 gap-6">
        <CategoryBreakdown porCat={porCat} />
        <AlertsPanel />
      </AutoGrid>

      <Section className="mt-6">
        <SectionHeader title="Últimos lançamentos">
          <Link
            href="/lancamentos"
            className={buttonVariants({ variant: "ghost" })}
          >
            Ver todos
          </Link>
        </SectionHeader>
        {recent.length === 0 && (
          <EmptyState>
            Nada lançado ainda. Importe um extrato ou a fatura do cartão para
            começar.
          </EmptyState>
        )}
        {recent.map((t) => (
          <TxRow key={t.id} t={t} compact />
        ))}
      </Section>
    </>
  );
}

function IncomeVsExpense({ rec, desp }: { rec: number; desp: number }) {
  const pctGasto = rec > 0 ? (desp / rec) * 100 : desp > 0 ? 100 : 0;
  return (
    <Card className="flex flex-col gap-3">
      <Overline>Receitas × despesas</Overline>
      <div className="grid gap-1">
        <div className="flex justify-between text-sm">
          <span>Receitas</span>
          <strong className="num">{brl(rec)}</strong>
        </div>
        <ProgressBar value={rec > 0 ? 100 : 0} className="h-2.5" />
      </div>
      <div className="grid gap-1">
        <div className="flex justify-between text-sm">
          <span>Despesas</span>
          <strong className="num">{brl(desp)}</strong>
        </div>
        <ProgressBar
          value={pctGasto}
          className="h-2.5"
          fillClassName="bg-accent"
        />
      </div>
      <div className="text-xs text-neutral-700">
        {rec > 0
          ? `Você gastou ${Math.round(pctGasto)}% do que entrou.`
          : "Nenhuma receita registrada neste mês ainda."}
      </div>
    </Card>
  );
}

function CategoryBreakdown({ porCat }: { porCat: Record<string, number> }) {
  const { data } = useApp();
  const cats = Object.entries(porCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);
  return (
    <Section>
      <SectionHeader title="Gastos por categoria">
        <Link
          href="/orcamentos"
          className={buttonVariants({ variant: "ghost" })}
        >
          Orçamentos
        </Link>
      </SectionHeader>
      {cats.length === 0 && (
        <EmptyState>Sem despesas neste mês ainda.</EmptyState>
      )}
      {cats.map(([k, v]) => {
        const limite = data.orcamentos[k];
        const hot = limite && (v / limite) * 100 >= data.prefs.thr;
        return (
          <div
            key={k}
            className="grid grid-cols-[110px_minmax(0,1fr)_auto] items-center gap-3 border-b border-divider py-2.5"
          >
            <span className="truncate text-md">{catNome(data, k)}</span>
            <ProgressBar
              value={(v / cats[0][1]) * 100}
              fillClassName={hot ? "bg-accent" : undefined}
            />
            <span className="min-w-22.5 text-right text-md font-semibold num">
              {brl(v)}
            </span>
          </div>
        );
      })}
    </Section>
  );
}

function AlertsPanel() {
  const alertas = useAlertas();
  return (
    <Section>
      <SectionHeader title="Alertas recentes">
        <Tag variant="accent">{alertas.length}</Tag>
      </SectionHeader>
      {alertas.length === 0 && (
        <EmptyState>Tudo tranquilo por aqui.</EmptyState>
      )}
      {alertas.map((a) => (
        <ListItem
          key={a.title}
          className="items-start"
          truncate={false}
          leading={
            <IconBadge tone={a.tone} size="sm">
              {a.icon}
            </IconBadge>
          }
          title={a.title}
          description={a.sub}
          trailing={
            <Link
              href={a.href}
              onClick={a.onSelect}
              className={buttonVariants({ variant: "ghost" })}
            >
              {a.cta}
            </Link>
          }
        />
      ))}
    </Section>
  );
}
