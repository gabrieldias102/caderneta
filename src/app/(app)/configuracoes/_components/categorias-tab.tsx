"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { IconBadge } from "@/components/ui/icon-badge";
import { ListItem } from "@/components/ui/layout";
import { doMes, periodo } from "@/lib/derive";
import { MES, brl0 } from "@/lib/format";
import { useApp } from "@/lib/store";

export function CategoriasTab() {
  const { data, hoje, set, flash } = useApp();
  const [nova, setNova] = useState("");
  const { ym } = periodo(hoje);
  const txsMes = doMes(data, ym);

  const addCat = () => {
    const nome = nova.trim();
    if (!nome) return;
    if (
      data.categorias.some((c) => c.nome.toLowerCase() === nome.toLowerCase())
    )
      return flash(`Categoria ${nome} já existe`);
    set((s) => ({
      ...s,
      categorias: [...s.categorias, { id: `c${Date.now()}`, nome }],
    }));
    setNova("");
    flash(`Categoria ${nome} criada`);
  };

  return (
    <div className="max-w-160">
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addCat();
        }}
      >
        <Input
          aria-label="Nova categoria"
          placeholder="Nova categoria"
          value={nova}
          onChange={(e) => setNova(e.target.value)}
        />
        <Button type="submit" variant="primary" disabled={!nova.trim()}>
          <Plus size={18} />
          Adicionar
        </Button>
      </form>
      <div className="border-t border-divider">
        {data.categorias.map((c) => {
          const n = txsMes.filter((t) => t.categoriaId === c.id).length;
          const lim = data.orcamentos[c.id];
          return (
            <ListItem
              key={c.id}
              className="py-2.5"
              leading={
                <IconBadge>{c.nome.slice(0, 2).toUpperCase()}</IconBadge>
              }
              title={c.nome}
              description={`${n} lançamento${n === 1 ? "" : "s"} em ${MES[Number(ym.slice(5)) - 1]}`}
              trailing={
                <span className="text-sm num">
                  {lim ? `Limite ${brl0(lim)}` : "Sem limite"}
                </span>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
