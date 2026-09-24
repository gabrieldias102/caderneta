"use client";

import { Trash } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/layout";
import { catNome } from "@/lib/derive";
import { useApp } from "@/lib/store";

export function RegrasTab() {
  const { data, set, flash } = useApp();
  const excluir = (id: string) => {
    set((s) => ({ ...s, regras: s.regras.filter((x) => x.id !== id) }));
    flash("Regra excluída");
  };

  return (
    <div className="max-w-[720px]">
      <div className="mb-3 text-md text-neutral-700">
        Regras são criadas quando você corrige uma categoria e escolhe “aplicar
        sempre”. Elas rodam antes da sugestão automática.
      </div>
      <div className="border-t border-divider">
        {data.regras.length === 0 && (
          <EmptyState className="py-3">Nenhuma regra ainda.</EmptyState>
        )}
        {data.regras
          .slice()
          .reverse()
          .map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 border-b border-divider py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="text-md">
                  Quando o estabelecimento for{" "}
                  <strong>{r.estabelecimento}</strong> →{" "}
                  <strong>{catNome(data, r.categoriaId)}</strong>
                </div>
                <div className="text-xs text-neutral-700">{r.origem}</div>
              </div>
              <IconButton
                label={`Excluir regra ${r.estabelecimento}`}
                onClick={() => excluir(r.id)}
              >
                <Trash size={16} />
              </IconButton>
            </div>
          ))}
      </div>
    </div>
  );
}
