"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogActions, DialogTitle } from "@/components/ui/dialog";
import { Kicker } from "@/components/ui/layout";
import { catNome } from "@/lib/derive";
import { useApp } from "@/lib/store";

/** Pergunta se a categoria escolhida vira regra para o estabelecimento. */
export function RuleDialog() {
  const { data, ui, setUI, ruleYes } = useApp();
  const r = ui.rule;
  if (!r) return null;
  const others =
    r.others > 0
      ? r.from === "import"
        ? `Também vamos ajustar ${r.others === 1 ? "o outro lançamento" : `os outros ${r.others}`} desta importação.`
        : `Também vamos ajustar ${r.others} lançamento${r.others > 1 ? "s" : ""} anterior${r.others > 1 ? "es" : ""}.`
      : "";
  return (
    <Dialog role="alertdialog" labelledBy="rule-title" overlayClassName="z-55">
      <Kicker>Nova regra?</Kicker>
      <DialogTitle id="rule-title">
        Aplicar sempre para “{r.estabelecimento}”?
      </DialogTitle>
      <div className="text-md text-neutral-800">
        Daqui pra frente, tudo de <strong>{r.estabelecimento}</strong> entra
        como <strong>{catNome(data, r.categoriaId)}</strong> — sem sugestão,
        direto. {others}
      </div>
      <DialogActions>
        <Button onClick={() => setUI((u) => ({ ...u, rule: null }))}>
          Só desta vez
        </Button>
        <Button variant="primary" onClick={ruleYes} autoFocus>
          Aplicar sempre
        </Button>
      </DialogActions>
    </Dialog>
  );
}
