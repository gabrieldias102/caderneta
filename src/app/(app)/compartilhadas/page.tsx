"use client";

import { useState } from "react";
import { Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/form";
import { IconBadge, type IconBadgeTone } from "@/components/ui/icon-badge";
import {
  AutoGrid,
  Card,
  EmptyState,
  ListItem,
  Overline,
  PageHeader,
  Section,
  SectionHeader,
} from "@/components/ui/layout";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import { kindOf, periodo } from "@/lib/derive";
import { brl, fmtD, initials, monthOf } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { Grupo as GrupoT } from "@/lib/types";

const RE_CONVITE = /^\S+@\S+\.\S+$|^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/;

export default function Compartilhadas() {
  const { data } = useApp();
  return data.grupo ? <Grupo g={data.grupo} /> : <SemGrupo />;
}

/** Primeiro acesso: cria o grupo e a pessoa com quem você divide as contas. */
function SemGrupo() {
  const { set, flash, hoje } = useApp();
  const [nome, setNome] = useState("");
  const [pessoa, setPessoa] = useState("");
  const ok = nome.trim() && pessoa.trim();
  const criar = () => {
    if (!ok) return;
    set((s) => ({
      ...s,
      grupo: {
        nome: nome.trim(),
        parceiro: {
          nome: pessoa.trim(),
          iniciais: initials(pessoa),
          entrouEm: fmtD(hoje),
        },
        split: 50,
        convites: [],
        gastosParceiro: [],
      },
    }));
    flash("Grupo criado");
  };
  return (
    <>
      <PageHeader
        kicker="Divida gastos com quem mora com você"
        title="Contas compartilhadas"
      />
      <Card className="max-w-130">
        <form
          className="grid gap-3.5"
          onSubmit={(e) => {
            e.preventDefault();
            criar();
          }}
        >
          <div className="text-md text-neutral-700">
            Crie um grupo para marcar gastos como compartilhados e ver quem deve
            quanto.
          </div>
          <Field label="Nome do grupo" htmlFor="g-nome">
            <Input
              id="g-nome"
              placeholder="Ex.: Apê Vila Madalena"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </Field>
          <Field label="Com quem você divide" htmlFor="g-pessoa">
            <Input
              id="g-pessoa"
              placeholder="Nome da pessoa"
              value={pessoa}
              onChange={(e) => setPessoa(e.target.value)}
            />
          </Field>
          <div>
            <Button type="submit" variant="primary" disabled={!ok}>
              Criar grupo
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}

function Grupo({ g }: { g: GrupoT }) {
  const { data, hoje, set, flash } = useApp();
  const { ym } = periodo(hoje);
  const ana = g.parceiro.nome.split(" ")[0];

  // Só entra o que foi gasto depois do último acerto.
  const depois = (d: string) =>
    monthOf(d) === ym && (!g.acertadoEm || d > g.acertadoEm);
  const meus = data.lancamentos.filter(
    (t) => t.compartilhado && kindOf(t) === "expense" && depois(t.data),
  );
  const deles = g.gastosParceiro.filter((t) => depois(t.data));
  const eu = g.split / 100;
  const mePaid = meus.reduce((a, t) => a - t.valor, 0);
  const anaPaid = deles.reduce((a, t) => a + t.valor, 0);
  const tot = mePaid + anaPaid;
  /** Positivo = a outra pessoa me deve. */
  const deve = mePaid - tot * eu;
  const acertado = Math.abs(deve) < 0.01;

  const itens = [
    ...meus.map((t) => ({
      id: t.id,
      d: t.data,
      desc: t.descricao,
      who: "VC",
      mine: true,
      amt: -t.valor,
      split: `${ana}: ${brl(-t.valor * (1 - eu))}`,
    })),
    ...deles.map((t) => ({
      id: t.id,
      d: t.data,
      desc: t.descricao,
      who: g.parceiro.iniciais,
      mine: false,
      amt: t.valor,
      split: `Você: ${brl(t.valor * eu)}`,
    })),
  ].sort((a, b) => b.d.localeCompare(a.d));

  const settledToday = g.acertadoEm === hoje && acertado;
  const headline = acertado
    ? "Tudo acertado"
    : deve > 0
      ? `${ana} te deve ${brl(deve)}`
      : `Você deve ${brl(-deve)} para ${ana}`;
  const sub = settledToday
    ? `Acerto registrado hoje, ${fmtD(hoje)}. Novos gastos compartilhados começam uma nova conta.`
    : `Considerando ${itens.length} gasto${itens.length === 1 ? "" : "s"} do mês, divididos ${g.split}/${100 - g.split}.`;

  const setG = (patch: Partial<GrupoT>) =>
    set((s) => (s.grupo ? { ...s, grupo: { ...s.grupo, ...patch } } : s));

  return (
    <>
      <PageHeader
        kicker={`${g.nome} · ${2 + g.convites.length} pessoas`}
        title="Contas compartilhadas"
      />

      <AutoGrid min={280} className="mb-8">
        <Card
          className={cn(
            "grid content-start gap-2.5 p-5.5",
            acertado ? "bg-surface" : "bg-accent text-canvas",
          )}
        >
          <Overline className="text-current">Quem deve quanto</Overline>
          <div className="text-[30px] leading-[1.1] font-extrabold text-pretty">
            {headline}
          </div>
          <div className="text-sm">{sub}</div>
          {!acertado && (
            <div>
              <Button
                variant="plain"
                className="bg-canvas hover:bg-canvas/90"
                onClick={() => {
                  setG({ acertadoEm: hoje });
                  flash("Acerto registrado");
                }}
              >
                Registrar acerto via Pix
              </Button>
            </div>
          )}
        </Card>
        <Card className="grid content-start gap-3 p-5.5">
          <Overline>Divisão (você / {ana})</Overline>
          <Segmented
            name="split"
            stretch
            value={g.split}
            onChange={(v) => setG({ split: v })}
            options={[
              [50, "50 / 50"],
              [60, "60 / 40"],
              [70, "70 / 30"],
            ]}
          />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Pago
              quem="Você pagou"
              valor={mePaid}
              parte={`sua parte ${brl(tot * eu)}`}
            />
            <Pago
              quem={`${ana} pagou`}
              valor={anaPaid}
              parte={`parte dela ${brl(tot * (1 - eu))}`}
            />
          </div>
        </Card>
      </AutoGrid>

      <AutoGrid min={300} className="gap-8">
        <Section>
          <SectionHeader title="Lançamentos compartilhados">
            <span className="text-sm num">{brl(tot)}</span>
          </SectionHeader>
          {itens.length === 0 && (
            <EmptyState className="py-3">
              Nenhum gasto compartilhado desde o último acerto.
            </EmptyState>
          )}
          {itens.map((t) => (
            <ListItem
              key={t.id}
              leading={
                <IconBadge size="md" tone={t.mine ? "inverse" : "surface"}>
                  {t.who}
                </IconBadge>
              }
              title={t.desc}
              description={`${fmtD(t.d)} · ${t.mine ? "você pagou" : `${ana} pagou`}`}
              trailing={
                <div className="text-right num">
                  <div className="text-md font-semibold">{brl(t.amt)}</div>
                  <div className="text-xs text-neutral-700">{t.split}</div>
                </div>
              }
            />
          ))}
          <div className="mt-2.5 text-xs text-neutral-700">
            Para incluir um gasto, abra-o em Lançamentos e marque
            “Compartilhado”.
          </div>
        </Section>
        <Pessoas g={g} setG={setG} />
      </AutoGrid>
    </>
  );
}

function Pago({
  quem,
  valor,
  parte,
}: {
  quem: string;
  valor: number;
  parte: string;
}) {
  return (
    <div>
      <div className="text-neutral-700">{quem}</div>
      <div className="text-[18px] font-extrabold num">{brl(valor)}</div>
      <div className="text-neutral-700">{parte}</div>
    </div>
  );
}

function Pessoas({
  g,
  setG,
}: {
  g: GrupoT;
  setG: (patch: Partial<GrupoT>) => void;
}) {
  const { data, flash } = useApp();
  const [convite, setConvite] = useState("");
  const valido = RE_CONVITE.test(convite.trim());

  const pessoas: {
    ini: string;
    name: string;
    sub: string;
    status: string;
    tone: IconBadgeTone;
    pend?: boolean;
  }[] = [
    {
      ini: "VC",
      name: `Você (${data.nome})`,
      sub: data.email ?? "",
      status: "Admin",
      tone: "inverse",
    },
    {
      ini: g.parceiro.iniciais,
      name: g.parceiro.nome,
      sub: `Entrou em ${g.parceiro.entrouEm}`,
      status: "Ativa",
      tone: "surface",
    },
    ...g.convites.map((e) => ({
      ini: e.slice(0, 2).toUpperCase(),
      name: e,
      sub: "Convite enviado",
      status: "Pendente",
      tone: "faint" as const,
      pend: true,
    })),
  ];

  const convidar = () => {
    if (!valido) return;
    setG({ convites: [...g.convites, convite.trim()] });
    setConvite("");
    flash("Convite enviado");
  };

  const copiarLink = () => {
    const slug = g.nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "-");
    navigator.clipboard
      ?.writeText(`${location.origin}/c/${slug}`)
      .catch(() => {});
    flash("Link de convite copiado");
  };

  return (
    <Section>
      <SectionHeader title="Pessoas" />
      {pessoas.map((p) => (
        <ListItem
          key={p.name}
          leading={
            <IconBadge size="md" tone={p.tone}>
              {p.ini}
            </IconBadge>
          }
          title={p.name}
          description={p.sub}
          trailing={
            <Tag variant={p.pend ? "outline" : "neutral"}>{p.status}</Tag>
          }
        />
      ))}
      <form
        className="mt-4 grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          convidar();
        }}
      >
        <Field label="Convidar por e-mail ou celular" htmlFor="convite">
          <div className="flex gap-2">
            <Input
              id="convite"
              placeholder="nome@email.com"
              value={convite}
              onChange={(e) => setConvite(e.target.value)}
            />
            <Button type="submit" variant="primary" disabled={!valido}>
              Convidar
            </Button>
          </div>
        </Field>
        <Button
          variant="ghost"
          className="justify-self-start"
          onClick={copiarLink}
        >
          <LinkIcon size={16} />
          Copiar link de convite
        </Button>
      </form>
    </Section>
  );
}
