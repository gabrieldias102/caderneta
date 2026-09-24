"use client";

import { Segmented, Switch } from "@/components/ui/controls";
import { useApp } from "@/lib/store";
import type { Prefs } from "@/lib/types";
import { SettingList, SettingRow } from "./setting-row";

const PREFS: [keyof Prefs, string, string][] = [
  [
    "fatura",
    "Fatura perto do vencimento",
    "Avisa 10 dias antes de cada cartão vencer",
  ],
  [
    "pix",
    "Pix para pessoa física sem categoria",
    "Lembra de categorizar transferências para pessoas",
  ],
  [
    "dup",
    "Duplicatas na importação",
    "Destaca lançamentos que já vieram em outro arquivo",
  ],
  ["weekly", "Resumo semanal por IA", "Toda segunda, em linguagem simples"],
];

export function AlertasTab() {
  const { data, setPrefs } = useApp();
  const p = data.prefs;
  return (
    <SettingList>
      <SettingRow
        title="Avisar ao atingir parte do orçamento"
        description={`Ex.: “você já usou ${p.thr}% do orçamento de Delivery”`}
        action={
          <Switch
            label="Avisar ao atingir parte do orçamento"
            checked={p.budget}
            onChange={() => setPrefs({ budget: !p.budget })}
          />
        }
      >
        <Segmented
          name="thr"
          value={p.thr}
          onChange={(v) => setPrefs({ thr: v })}
          options={[70, 80, 90, 100].map(
            (v) => [v, `${v}%`] as [number, string],
          )}
        />
      </SettingRow>
      {PREFS.map(([k, label, sub]) => (
        <SettingRow
          key={k}
          title={label}
          description={sub}
          action={
            <Switch
              label={label}
              checked={!!p[k]}
              onChange={() => setPrefs({ [k]: !p[k] } as Partial<Prefs>)}
            />
          }
        />
      ))}
    </SettingList>
  );
}
