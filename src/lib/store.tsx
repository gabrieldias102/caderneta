"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { chave } from "./import/normalize";
import { catNome, contaNome } from "./derive";
import { fmtD, setValoresOcultos, toISO } from "./format";
import { diffState, mergePayload, type SyncPayload } from "./sync";
import type { Conta, DataState, ItemRevisao, Lancamento, Prefs } from "./types";

export type SyncStatus = "salvo" | "salvando" | "offline";

export type ImpStep = "upload" | "processing" | "review" | "done";
export interface ImpState {
  step: ImpStep;
  file: {
    name: string;
    size: string;
    hint: string;
    obj?: File;
    exemplo?: string;
    /** Banco reconhecido no arquivo, mas sem conta cadastrada. */
    sugestao?: Omit<Conta, "id">;
  } | null;
  dest: string | null;
  progress: number;
  rows: ItemRevisao[];
  filter: "todos" | "revisar" | "dup";
  sel: string[];
  newRules: number;
  error?: string;
  result?: {
    n: number;
    ign: number;
    inst: number;
    rules: number;
    pend: number;
    dest: string;
  };
}
const IMP0: ImpState = {
  step: "upload",
  file: null,
  dest: null,
  progress: 0,
  rows: [],
  filter: "todos",
  sel: [],
  newRules: 0,
};

export interface RuleAsk {
  estabelecimento: string;
  categoriaId: string;
  from: "import" | "tx";
  others: number;
}

const OCULTOS_KEY = "caderneta:valores-ocultos";

interface UI {
  toast: string | null;
  detail: string | null;
  /** Diálogo de adição manual aberto: gasto em dinheiro ou lançamento de conta/cartão. */
  qa: false | "dinheiro" | "manual";
  more: boolean;
  rule: RuleAsk | null;
}

function useStore() {
  const [data, setData] = useState<DataState | null>(null);
  const [ui, setUI] = useState<UI>({
    toast: null,
    detail: null,
    qa: false,
    more: false,
    rule: null,
  });
  const [imp, setImpState] = useState<ImpState>(IMP0);
  const [lancFilters, setLancFilters] = useState({
    q: "",
    acc: "all",
    cat: "all",
    per: "mes" as "mes" | "7d" | "ant",
  });
  const hoje = useMemo(() => toISO(new Date()), []);

  // Valores ocultos: preferência deste aparelho, não vai para o servidor.
  const [ocultos, setOcultos] = useState(false);
  setValoresOcultos(ocultos);
  useEffect(() => {
    try {
      setOcultos(localStorage.getItem(OCULTOS_KEY) === "1");
    } catch {}
  }, []);
  const alternarValores = useCallback(() => {
    const v = !ocultos;
    setOcultos(v);
    try {
      localStorage.setItem(OCULTOS_KEY, v ? "1" : "0");
    } catch {}
  }, [ocultos]);
  const tt = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flashRef = useRef<(msg: string) => void>(undefined);

  const [carga, setCarga] = useState<"carregando" | "ok" | "erro">(
    "carregando",
  );
  const [sync, setSync] = useState<SyncStatus>("salvo");
  /** Último estado já enviado (ou na fila) para o servidor. */
  const base = useRef<DataState | null>(null);
  const pendente = useRef<SyncPayload | null>(null);
  const enviando = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tentativa = useRef(0);

  const sairParaLogin = useCallback(async () => {
    await fetch("/api/auth/sair", { method: "POST" }).catch(() => {});
    window.location.href = "/entrar";
  }, []);

  const carregar = useCallback(async () => {
    setCarga("carregando");
    try {
      const res = await fetch("/api/estado", { cache: "no-store" });
      if (res.status === 401) return sairParaLogin();
      if (!res.ok) throw new Error(String(res.status));
      const s: DataState = await res.json();
      base.current = s;
      pendente.current = null;
      setData(s);
      setCarga("ok");
    } catch {
      setCarga("erro");
    }
  }, [sairParaLogin]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (enviando.current || !pendente.current) return;
    const lote = pendente.current;
    pendente.current = null;
    enviando.current = true;
    setSync("salvando");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lote),
      });
      if (res.status === 401) return sairParaLogin();
      if (res.status === 400) {
        // Dado rejeitado pela validação: não adianta repetir. Recarrega do servidor.
        const j = await res.json().catch(() => ({}));
        console.error("sync rejeitado", j);
        flashRef.current?.(
          "Não foi possível salvar uma alteração — recarregando",
        );
        enviando.current = false;
        return carregar();
      }
      if (!res.ok) throw new Error(String(res.status));
      tentativa.current = 0;
      setSync(pendente.current ? "salvando" : "salvo");
    } catch {
      pendente.current = pendente.current
        ? mergePayload(lote, pendente.current)
        : lote;
      if (tentativa.current === 0)
        flashRef.current?.(
          "Sem conexão — suas alterações serão salvas quando voltar",
        );
      tentativa.current++;
      setSync("offline");
      timer.current = setTimeout(
        () => flush(),
        Math.min(30_000, 1000 * 2 ** tentativa.current),
      );
    } finally {
      enviando.current = false;
    }
    if (pendente.current && tentativa.current === 0) flush();
  }, [carregar, sairParaLogin]);

  // Cada mudança local vira um lote de diferenças para o servidor.
  useEffect(() => {
    if (!data || !base.current || data === base.current) return;
    const diff = diffState(base.current, data);
    base.current = data;
    if (!diff) return;
    pendente.current = pendente.current
      ? mergePayload(pendente.current, diff)
      : diff;
    setSync("salvando");
    if (tentativa.current === 0) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => flush(), 400);
    }
  }, [data, flush]);

  // Ao fechar a aba, tenta mandar o que ficou pendente.
  useEffect(() => {
    const onHide = () => {
      if (pendente.current)
        navigator.sendBeacon(
          "/api/sync",
          new Blob([JSON.stringify(pendente.current)], {
            type: "application/json",
          }),
        );
    };
    const onOnline = () => {
      tentativa.current = 0;
      flush();
    };
    window.addEventListener("pagehide", onHide);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("online", onOnline);
    };
  }, [flush]);

  // Tema
  useEffect(() => {
    const t = data?.prefs.tema;
    const el = document.documentElement;
    if (t === "claro") el.dataset.theme = "light";
    else if (t === "escuro") el.dataset.theme = "dark";
    else delete el.dataset.theme;
  }, [data?.prefs.tema]);

  const set = useCallback(
    (fn: (s: DataState) => DataState) => setData((s) => (s ? fn(s) : s)),
    [],
  );

  const flash = useCallback((msg: string) => {
    clearTimeout(tt.current);
    setUI((u) => ({ ...u, toast: msg }));
    tt.current = setTimeout(() => setUI((u) => ({ ...u, toast: null })), 2600);
  }, []);
  flashRef.current = flash;

  const setImp = useCallback(
    (patch: Partial<ImpState> | ((i: ImpState) => Partial<ImpState>)) =>
      setImpState((i) => ({
        ...i,
        ...(typeof patch === "function" ? patch(i) : patch),
      })),
    [],
  );

  const updTx = useCallback(
    (id: string, patch: Partial<Lancamento>) =>
      set((s) => ({
        ...s,
        lancamentos: s.lancamentos.map((t) =>
          t.id === id ? { ...t, ...patch } : t,
        ),
      })),
    [set],
  );

  /** Pergunta se vira regra — só quando ainda não existe uma igual. */
  const askRule = useCallback(
    (
      estabelecimento: string,
      categoriaId: string,
      from: "import" | "tx",
      excluir?: string,
    ) => {
      if (!data || !estabelecimento || !categoriaId) return;
      const k = chave(estabelecimento);
      if (
        data.regras.some(
          (r) =>
            chave(r.estabelecimento) === k && r.categoriaId === categoriaId,
        )
      )
        return;
      const others =
        from === "import"
          ? imp.rows.filter(
              (r) =>
                r.k !== excluir &&
                !r.tipo &&
                chave(r.estabelecimento) === k &&
                !r.editado,
            ).length
          : data.lancamentos.filter(
              (t) =>
                t.id !== excluir &&
                !t.tipo &&
                chave(t.estabelecimento) === k &&
                t.categoriaId !== categoriaId,
            ).length;
      setUI((u) => ({
        ...u,
        rule: { estabelecimento, categoriaId, from, others },
      }));
    },
    [data, imp.rows],
  );

  const ruleYes = useCallback(() => {
    const r = ui.rule;
    if (!r || !data) return;
    const k = chave(r.estabelecimento);
    set((s) => ({
      ...s,
      regras: [
        ...s.regras.filter((x) => chave(x.estabelecimento) !== k),
        {
          id: `r${Date.now()}`,
          estabelecimento: r.estabelecimento,
          categoriaId: r.categoriaId,
          origem: `Criada em ${fmtD(hoje)} ao ${r.from === "import" ? "revisar importação" : "editar lançamento"}`,
        },
      ],
      lancamentos:
        r.from === "tx"
          ? s.lancamentos.map((t) =>
              !t.tipo && chave(t.estabelecimento) === k
                ? { ...t, categoriaId: r.categoriaId }
                : t,
            )
          : s.lancamentos,
    }));
    if (r.from === "import") {
      setImp((i) => ({
        newRules: i.newRules + 1,
        rows: i.rows.map((x) =>
          chave(x.estabelecimento) === k && !x.tipo
            ? { ...x, categoriaId: r.categoriaId, editado: true }
            : x,
        ),
      }));
    }
    setUI((u) => ({ ...u, rule: null }));
    flash(
      `Regra criada: ${r.estabelecimento} → ${catNome(data, r.categoriaId)}`,
    );
  }, [ui.rule, data, set, setImp, flash, hoje]);

  const confirmImport = useCallback(() => {
    if (!data || !imp.dest || !imp.file) return;
    const inc = imp.rows.filter((r) => !r.ignorado);
    const impId = `imp${Date.now()}`;
    const novos: Lancamento[] = inc.map((r) => ({
      id: `${impId}-${r.k}`,
      data: r.data,
      descricaoOriginal: r.descricaoOriginal,
      descricao:
        r.tipo === "fatura"
          ? "Pagamento da fatura"
          : r.pix
            ? `Pix ${r.valor < 0 ? "enviado" : "recebido"} · ${r.estabelecimento}`
            : r.estabelecimento,
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
      importacoes: [
        {
          id: impId,
          arquivo: imp.file!.name,
          contaId: imp.dest!,
          data: hoje,
          total: inc.length,
          ignorados: imp.rows.length - inc.length,
        },
        ...s.importacoes,
      ],
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

  const setPrefs = useCallback(
    (p: Partial<Prefs>) => set((s) => ({ ...s, prefs: { ...s.prefs, ...p } })),
    [set],
  );

  return {
    data,
    hoje,
    ui,
    setUI,
    imp,
    setImp,
    resetImp: () => setImpState(IMP0),
    lancFilters,
    setLancFilters,
    set,
    flash,
    updTx,
    askRule,
    ruleYes,
    confirmImport,
    setPrefs,
    ocultos,
    alternarValores,
    carga,
    recarregar: carregar,
    sync,
    /** Substitui tudo pelos dados de exemplo (no servidor). */
    resetDemo: async () => {
      await flush();
      const res = await fetch("/api/exemplo", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      const s: DataState = await res.json();
      base.current = s;
      pendente.current = null;
      setData(s);
      setImpState(IMP0);
    },
    sair: async () => {
      await flush();
      await sairParaLogin();
    },
    /** Baixa todos os dados em JSON, depois de salvar o que estiver pendente. */
    exportar: async () => {
      await flush();
      window.location.href = "/api/conta/exportar";
    },
    /** Exclui a conta no servidor. Devolve a mensagem de erro, ou null se deu certo. */
    excluirConta: async (senha: string): Promise<string | null> => {
      const res = await fetch("/api/conta/excluir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      }).catch(() => null);
      if (!res) return "Sem conexão — tente de novo";
      if (!res.ok)
        return (
          (await res.json().catch(() => ({}))).erro ??
          "Não foi possível excluir agora"
        );
      clearTimeout(timer.current);
      pendente.current = null;
      window.location.href = "/entrar";
      return null;
    },
  };
}

export type Store = ReturnType<typeof useStore> & { data: DataState };
const Ctx = createContext<Store | null>(null);

/** Enquanto os dados não chegam, mostra `loading`; se a carga falhar, `error` (com a ação de tentar de novo). */
export function StoreProvider({
  loading,
  error,
  children,
}: {
  loading: ReactNode;
  error: (retry: () => void) => ReactNode;
  children: ReactNode;
}) {
  const store = useStore();
  if (store.carga === "erro") return error(store.recarregar);
  if (!store.data) return loading;
  return <Ctx.Provider value={store as Store}>{children}</Ctx.Provider>;
}

export function useApp(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useApp fora do StoreProvider");
  return s;
}
