"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/controls";
import { PageHeader } from "@/components/ui/layout";
import { useApp } from "@/lib/store";
import { AlertasTab } from "./_components/alertas-tab";
import { CategoriasTab } from "./_components/categorias-tab";
import { ContaTab } from "./_components/conta-tab";
import { RegrasTab } from "./_components/regras-tab";

type Tab = "cat" | "rules" | "alerts" | "tema";

export default function Configuracoes() {
  const { data } = useApp();
  const [tab, setTab] = useState<Tab>("cat");

  return (
    <>
      <PageHeader title="Configurações" />
      <Segmented
        name="cfg"
        stretch
        value={tab}
        onChange={setTab}
        className="mb-5 max-w-[560px]"
        options={[
          ["cat", "Categorias"],
          ["rules", `Regras (${data.regras.length})`],
          ["alerts", "Alertas"],
          ["tema", "Conta"],
        ]}
      />
      {tab === "cat" && <CategoriasTab />}
      {tab === "rules" && <RegrasTab />}
      {tab === "alerts" && <AlertasTab />}
      {tab === "tema" && <ContaTab />}
    </>
  );
}
