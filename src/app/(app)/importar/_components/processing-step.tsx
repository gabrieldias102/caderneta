"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/cn";
import { ParseError } from "@/lib/import/parsers";
import { ajustarSinal, montarRevisao } from "@/lib/import/pipeline";
import { lerArquivo } from "@/lib/import/read";
import { useApp, type ImpState } from "@/lib/store";
import type { ItemRevisao } from "@/lib/types";

const STAGES: [string, string][] = [
  ["Lendo o arquivo", "PDF, OFX ou CSV → texto estruturado"],
  ["Encontrando lançamentos", "Datas, valores, parcelas e Pix"],
  [
    "Sugerindo categorias",
    "Regras suas primeiro, depois a sugestão automática",
  ],
  ["Checando duplicatas", "Comparando com importações anteriores"],
];

/** Etapa 2: lê o arquivo de verdade enquanto anima o progresso. */
export function ProcessingStep() {
  const { data, imp, setImp, resetImp } = useApp();
  const result = useRef<{ rows?: ItemRevisao[]; error?: string }>({});
  const destino = data.contas.find((c) => c.id === imp.dest)!;

  // Leitura real do arquivo, em paralelo com a animação.
  useEffect(() => {
    let vivo = true;
    result.current = {};
    (async () => {
      try {
        const lido = await lerArquivo(imp.file!.obj!, data.contas, destino);
        const rows = ajustarSinal(lido.rows, destino);
        if (!rows.length)
          throw new ParseError("Nenhum lançamento encontrado no arquivo");
        if (vivo)
          result.current.rows = montarRevisao(rows, {
            contaId: destino.id,
            regras: data.regras,
            lancamentos: data.lancamentos,
            contas: data.contas,
          });
      } catch (e) {
        if (vivo)
          result.current.error =
            e instanceof ParseError
              ? e.message
              : "Não foi possível ler este arquivo.";
      }
    })();
    return () => {
      vivo = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = setInterval(() => {
      setImp((i: ImpState) => {
        if (i.step !== "processing") return {};
        const r = result.current;
        if (r.error) return { step: "upload", progress: 0, error: r.error };
        const p = Math.min(r.rows ? 100 : 96, i.progress + 3);
        if (p >= 100 && r.rows)
          return { step: "review", progress: 100, rows: r.rows };
        return { progress: p };
      });
    }, 90);
    return () => clearInterval(id);
  }, [setImp]);

  const stNow = Math.min(3, Math.floor(imp.progress / 25));
  return (
    <div className="grid max-w-140 gap-5">
      <div className="text-md text-neutral-700">
        {imp.file?.name} → {destino?.nome}
      </div>
      <div
        className="text-[72px] leading-none font-extrabold tracking-[-.04em] num"
        aria-live="polite"
      >
        {imp.progress}
        <span className="text-accent">%</span>
      </div>
      <ProgressBar
        value={imp.progress}
        className="h-1.5"
        fillClassName="bg-accent transition-[width] duration-120 ease-linear"
      />
      <div className="border-t border-divider">
        {STAGES.map(([l, sub], i) => {
          const done = i < stNow || imp.progress >= 100,
            act = i === stNow && !done;
          return (
            <div
              key={l}
              className={cn(
                "grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3 border-b border-divider py-3",
                !done && !act && "text-neutral-600",
              )}
            >
              <div
                className={cn(
                  "grid size-5 place-items-center rounded-[7px] text-canvas",
                  done
                    ? "bg-fg"
                    : act
                      ? "animate-blink bg-accent"
                      : "bg-neutral-300",
                )}
              >
                {done && <Check size={14} strokeWidth={3} />}
              </div>
              <div>
                <div className="text-md font-semibold">{l}</div>
                <div className="text-xs text-neutral-700">{sub}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <Button onClick={resetImp}>Cancelar</Button>
      </div>
    </div>
  );
}
