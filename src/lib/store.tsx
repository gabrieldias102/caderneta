"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { chave } from "./import/normalize";
import { seedState } from "./seed";
import { catNome, contaNome } from "./derive";
import { fmtD, toISO } from "./format";
import type { DataState, ItemRevisao, Lancamento, Prefs } from "./types";

const KEY = "caderneta:v1";

export type ImpStep = "upload" | "processing" | "review" | "done";
export interface ImpState {
  step: ImpStep;
  file: { name: string; size: string; hint: string; obj?: File; exemplo?: string } | null;
  dest: string | null;
  progress: number;
  rows: ItemRevisao[];
  filter: "todos" | "revisar" | "dup";
  sel: string[];
  newRules: number;
  error?: string;
  result?: { n: number; ign: number; inst: number; rules: number; pend: number; dest: string };
}
const IMP0: ImpState = { step: "upload", file: null, dest: null, progress: 0, rows: [], filter: "todos", sel: [], newRules: 0 };

export interface RuleAsk {
  estabelecimento: string;
  categoriaId: string;
  from: "import" | "tx";
  others: number;
}

interface UI {
  toast: string | null;
  detail: string | null;
  qa: boolean;
  more: boolean;
  rule: RuleAsk | null;
}

function useStore() {
  const [data, setData] = useState<DataState | null>(null);
  const [ui, setUI] = useState<UI>({ toast: null, detail: null, qa: false, more: false, rule: null });
  const [imp, setImpState] = useState<ImpState>(IMP0);
  const [lancFilters, setLancFilters] = useState({ q: "", acc: "all", cat: "all", per: "mes" as "mes" | "7d" | "ant" });
  const hoje = useMemo(() => toISO(new Date()), []);
  const tt = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let s: DataState | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) s = JSON.parse(raw);
    } catch {}
    setData(s && s.version === 1 ? s : seedState());
  }, []);

  useEffect(() => {
    if (!data) return;
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  }, [data]);

  // Tema
  useEffect(() => {
    const t = data?.prefs.tema;
    const el = document.documentElement;
    if (t === "claro") el.dataset.theme = "light";
    else if (t === "escuro") el.dataset.theme = "dark";
    else delete el.dataset.theme;
  }, [data?.prefs.tema]);

  const set = useCallback((fn: (s: DataState) => DataState) => setData((s) => (s ? fn(s) : s)), []);

  const flash = useCallback((msg: string) => {
    clearTimeout(tt.current);
    setUI((u) => ({ ...u, toast: msg }));
    tt.current = setTimeout(() => setUI((u) => ({ ...u, toast: null })), 2600);
  }, []);

  const setImp = useCallback(
    (patch: Partial<ImpState> | ((i: ImpState) => Partial<ImpState>)) =>
      setImpState((i) => ({ ...i, ...(typeof patch === "function" ? patch(i) : patch) })),
    [],
  );

  const updTx = useCallback((id: string, patch: Partial<Lancamento>) =>
    set((s) => ({ ...s, lancamentos: s.lancamentos.map((t) => (t.id === id ? { ...t, ...patch } : t)) })), [set]);

  /** Pergunta se vira regra — só quando ainda não existe uma igual. */
  const askRule = useCallback((estabelecimento: string, categoriaId: string, from: "import" | "tx", excluir?: string) => {
    if (!data || !estabelecimento || !categoriaId) return;
    const k = chave(estabelecimento);
    if (data.regras.some((r) => chave(r.estabelecimento) === k && r.categoriaId === categoriaId)) return;
    const others = from === "import"
      ? imp.rows.filter((r) => r.k !== excluir && !r.tipo && chave(r.estabelecimento) === k && !r.editado).length
      : data.lancamentos.filter((t) => t.id !== excluir && !t.tipo && chave(t.estabelecimento) === k && t.categoriaId !== categoriaId).length;
    setUI((u) => ({ ...u, rule: { estabelecimento, categoriaId, from, others } }));
  }, [data, imp.rows]);

  const ruleYes = useCallback(() => {
    const r = ui.rule;
    if (!r || !data) return;
    const k = chave(r.estabelecimento);
    set((s) => ({
      ...s,
      regras: [
        ...s.regras.filter((x) => chave(x.estabelecimento) !== k),
        { id: `r${Date.now()}`, estabelecimento: r.estabelecimento, categoriaId: r.categoriaId, origem: `Criada em ${fmtD(hoje)} ao ${r.from === "import" ? "revisar importação" : "editar lançamento"}` },
      ],
      lancamentos: r.from === "tx" ? s.lancamentos.map((t) => (!t.tipo && chave(t.estabelecimento) === k ? { ...t, categoriaId: r.categoriaId } : t)) : s.lancamentos,
    }));
    if (r.from === "import") {
      setImp((i) => ({
        newRules: i.newRules + 1,
        rows: i.rows.map((x) => (chave(x.estabelecimento) === k && !x.tipo ? { ...x, categoriaId: r.categoriaId, editado: true } : x)),
      }));
    }
    setUI((u) => ({ ...u, rule: null }));
    flash(`Regra criada: ${r.estabelecimento} → ${catNome(data, r.categoriaId)}`);
  }, [ui.rule, data, set, setImp, flash, hoje]);

  const confirmImport = useCallback(() => {
    if (!data || !imp.dest || !imp.file) return;
    const inc = imp.rows.filter((r) => !r.ignorado);
    const impId = `imp${Date.now()}`;
    const novos: Lancamento[] = inc.map((r) => ({
      id: `${impId}-${r.k}`,
      data: r.data,
      descricaoOriginal: r.descricaoOriginal,
      descricao: r.tipo === "fatura" ? "Pagamento da fatura" : r.pix ? `Pix ${r.valor < 0 ? "enviado" : "recebido"} · ${r.estabelecimento}` : r.estabelecimento,
      estabelecimento: r.tipo ? "" : r.estabelecimento,
      valor: r.valor,
      contaId: imp.dest!,
      categoriaId: r.tipo ? undefined : r.categoriaId || undefined,
      tipo: r.tipo,
      pix: r.pix,
      parcela: r.parcela,
      importacaoId: impId,
      origem: "arquivo",
    }));
    set((s) => ({
      ...s,
      lancamentos: [...novos, ...s.lancamentos],
      importacoes: [{ id: impId, arquivo: imp.file!.name, contaId: imp.dest!, data: hoje, total: inc.length, ignorados: imp.rows.length - inc.length }, ...s.importacoes],
    }));
    setImp({
      step: "done",
      result: {
        n: inc.length,
        ign: imp.rows.length - inc.length,
        inst: inc.filter((r) => r.parcela).length,
        rules: imp.newRules,
        pend: inc.filter((r) => !r.tipo && !r.categoriaId).length,
        dest: contaNome(data, imp.dest),
      },
    });
  }, [data, imp, set, setImp, hoje]);

  const setPrefs = useCallback((p: Partial<Prefs>) => set((s) => ({ ...s, prefs: { ...s.prefs, ...p } })), [set]);

  return {
    data, hoje, ui, setUI, imp, setImp, resetImp: () => setImpState(IMP0), lancFilters, setLancFilters,
    set, flash, updTx, askRule, ruleYes, confirmImport, setPrefs,
    resetDemo: () => { setData(seedState()); setImpState(IMP0); },
  };
}

export type Store = ReturnType<typeof useStore> & { data: DataState };
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  if (!store.data) return null;
  return <Ctx.Provider value={store as Store}>{children}</Ctx.Provider>;
}

export function useApp(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useApp fora do StoreProvider");
  return s;
}
