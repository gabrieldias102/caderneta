"use client";

import { useRef, useState } from "react";
import { ArrowRight, PenLine, Upload, X } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { FormError } from "@/components/ui/form";
import { IconBadge } from "@/components/ui/icon-badge";
import {
  AutoGrid,
  EmptyState,
  Section,
  SectionHeader,
} from "@/components/ui/layout";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import { contaNome } from "@/lib/derive";
import { fmtD } from "@/lib/format";
import { ParseError } from "@/lib/import/parsers";
import { MAX_BYTES, extensaoValida, lerArquivo } from "@/lib/import/read";
import { useApp } from "@/lib/store";

const EXEMPLOS = [
  "fatura-nubank-set.csv",
  "extrato-itau-set.ofx",
  "extrato.csv",
];

const kb = (n: number) => `${Math.max(1, Math.round(n / 1024))} KB`;

/** Etapa 1: escolher o arquivo e a conta de destino. */
export function UploadStep() {
  const { data, imp, setImp, setUI, flash } = useApp();

  const escolher = async (f: File | undefined, exemplo?: string) => {
    if (!f) return;
    if (!extensaoValida(f.name))
      return flash("Formato não suportado — use PDF, OFX ou CSV");
    if (f.size > MAX_BYTES) return flash("Arquivo maior que 10 MB");
    setImp({
      file: { name: f.name, size: kb(f.size), hint: "Lendo…", obj: f, exemplo },
      error: undefined,
    });
    try {
      const r = await lerArquivo(f, data.contas);
      setImp((i) => ({
        file: i.file && { ...i.file, hint: r.hint },
        dest: r.destino?.id ?? i.dest,
      }));
    } catch (e) {
      setImp((i) => ({
        file: i.file && {
          ...i.file,
          hint: e instanceof ParseError ? e.message : "Pronto para leitura",
        },
      }));
    }
  };

  const exemplo = async (name: string) => {
    const blob = await (await fetch(`/exemplos/${name}`)).blob();
    escolher(new File([blob], name, { type: blob.type }), name);
  };

  const start = () =>
    setImp({
      step: "processing",
      progress: 0,
      rows: [],
      sel: [],
      filter: "todos",
      newRules: 0,
    });

  return (
    <>
      <AutoGrid min={300} className="gap-8">
        <div className="grid content-start gap-4">
          <DropZone onFile={escolher} />
          {imp.file && (
            <div className="flex items-center gap-3 rounded-md bg-surface p-3">
              <IconBadge tone="inverse" size="xl">
                {imp.file.name.split(".").pop()!.toUpperCase()}
              </IconBadge>
              <div className="min-w-0 flex-1">
                <div className="truncate text-md font-semibold">
                  {imp.file.name}
                </div>
                <div className="text-xs text-neutral-700">
                  {imp.file.size} · {imp.file.hint}
                </div>
              </div>
              <IconButton
                label="Remover arquivo"
                onClick={() => setImp({ file: null })}
              >
                <X size={18} />
              </IconButton>
            </div>
          )}
          {imp.error && <FormError>{imp.error}</FormError>}
          <div className="grid gap-1.5">
            <div className="text-xs text-neutral-700">
              Sem arquivo à mão? Teste com um exemplo:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXEMPLOS.map((n) => (
                <Button key={n} size="sm" onClick={() => exemplo(n)}>
                  {n}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid content-start gap-3">
          <h4 className="border-b border-divider pb-2">
            Para onde vão os lançamentos?
          </h4>
          <DestinationPicker />
          <Button
            variant="primary"
            size="lg"
            block
            disabled={!(imp.file?.obj && imp.dest)}
            onClick={start}
          >
            Ler arquivo e sugerir categorias
            <ArrowRight size={16} />
          </Button>
          <div className="text-xs text-neutral-700">
            O arquivo é lido e descartado. Nada é enviado ao banco e nada é
            lançado antes da sua revisão.
          </div>
          <div className="mt-2 grid gap-2 border-t border-divider pt-4">
            <div className="text-md text-neutral-700">
              Sem extrato? Lance uma compra no crédito ou no débito à mão.
            </div>
            <div>
              <Button onClick={() => setUI((u) => ({ ...u, qa: "manual" }))}>
                <PenLine size={16} />
                Adicionar manualmente
              </Button>
            </div>
          </div>
        </div>
      </AutoGrid>
      <ImportHistory />
    </>
  );
}

function DropZone({ onFile }: { onFile: (f: File | undefined) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const pick = () => fileRef.current?.click();
  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.ofx,.csv"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div
        role="button"
        tabIndex={0}
        aria-label="Escolher arquivo"
        onClick={pick}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && (e.preventDefault(), pick())
        }
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          onFile(e.dataTransfer.files[0]);
        }}
        className={cn(
          "grid gap-2.5 rounded-lg border-2 border-dashed px-6 py-8 transition-colors hover:border-accent",
          drag ? "border-accent bg-accent-100" : "border-neutral-300 bg-canvas",
        )}
      >
        <Upload size={32} className="text-accent" />
        <div className="text-2xl font-extrabold">Arraste o arquivo aqui</div>
        <div className="text-md text-neutral-700">
          ou toque para escolher. Extrato da conta ou fatura do cartão, em PDF,
          OFX ou CSV. Até 10 MB.
        </div>
      </div>
    </>
  );
}

function DestinationPicker() {
  const { data, imp, setImp } = useApp();
  return (
    <div role="radiogroup" aria-label="Destino">
      {data.contas.map((c) => (
        <label
          key={c.id}
          className="group grid min-h-13 cursor-pointer grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-3 border-b border-divider py-2.5 text-md"
        >
          <input
            type="radio"
            name="dest"
            className="peer sr-only"
            checked={imp.dest === c.id}
            onChange={() => setImp({ dest: c.id })}
          />
          <span className="size-4 rounded-full border-[1.5px] border-neutral-400 group-hover:border-accent peer-checked:border-accent peer-checked:bg-accent peer-checked:shadow-[inset_0_0_0_4px_var(--card)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" />
          <span className="min-w-0">
            <span className="block font-semibold">{c.nome}</span>
            <span className="text-xs text-neutral-700">{c.sub}</span>
          </span>
          <Tag>{c.tipo === "cartao" ? "Cartão" : "Conta"}</Tag>
        </label>
      ))}
    </div>
  );
}

function ImportHistory() {
  const { data } = useApp();
  return (
    <Section className="mt-6">
      <SectionHeader as="h5" title="Importações anteriores" />
      {data.importacoes.length === 0 && (
        <EmptyState className="py-3">Nenhuma ainda.</EmptyState>
      )}
      {data.importacoes.slice(0, 8).map((h) => (
        <div
          key={h.id}
          className="flex gap-3 border-b border-divider py-2.5 text-md"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{h.arquivo}</div>
            <div className="text-xs text-neutral-700">
              {contaNome(data, h.contaId)}
            </div>
          </div>
          <div className="text-right text-xs text-neutral-700">
            <div>{fmtD(h.data)}</div>
            <div>{h.total} lançamentos</div>
          </div>
        </div>
      ))}
    </Section>
  );
}
