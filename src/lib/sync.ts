import type {
  Categoria,
  Conta,
  DataState,
  Importacao,
  Lancamento,
  Regra,
} from "./types";

/**
 * Protocolo de sincronização: o cliente altera o estado localmente (otimista)
 * e manda só o que mudou, coleção por coleção.
 */
export interface Ops<T> {
  upsert?: T[];
  delete?: string[];
}

export interface SyncPayload {
  lancamentos?: Ops<Lancamento>;
  categorias?: Ops<Categoria & { ordem?: number }>;
  contas?: Ops<Conta & { ordem?: number }>;
  regras?: Ops<Regra>;
  importacoes?: Ops<Importacao>;
  orcamentos?: Ops<{ categoriaId: string; limite: number }>;
  perfil?: Partial<Pick<DataState, "nome" | "prefs" | "grupo" | "resumoIA">> & {
    grupoRemovido?: boolean;
  };
}

function diffById<T extends { id: string }>(
  a: T[],
  b: T[],
  withOrder = false,
): Ops<T & { ordem?: number }> | undefined {
  const before = new Map(a.map((x, i) => [x.id, { x, i }]));
  const after = new Set<string>();
  const upsert: (T & { ordem?: number })[] = [];
  b.forEach((x, i) => {
    after.add(x.id);
    const old = before.get(x.id);
    // Atualizações são imutáveis: objeto igual por referência = não mudou.
    if (!old || old.x !== x || (withOrder && old.i !== i))
      upsert.push(withOrder ? { ...x, ordem: i } : x);
  });
  const del = a.filter((x) => !after.has(x.id)).map((x) => x.id);
  if (!upsert.length && !del.length) return undefined;
  return {
    ...(upsert.length ? { upsert } : {}),
    ...(del.length ? { delete: del } : {}),
  };
}

export function diffState(a: DataState, b: DataState): SyncPayload | null {
  const p: SyncPayload = {};
  if (a.lancamentos !== b.lancamentos) {
    const d = diffById(a.lancamentos, b.lancamentos);
    if (d) p.lancamentos = d;
  }
  if (a.categorias !== b.categorias) {
    const d = diffById(a.categorias, b.categorias, true);
    if (d) p.categorias = d;
  }
  if (a.contas !== b.contas) {
    const d = diffById(a.contas, b.contas, true);
    if (d) p.contas = d;
  }
  if (a.regras !== b.regras) {
    const d = diffById(a.regras, b.regras);
    if (d) p.regras = d;
  }
  if (a.importacoes !== b.importacoes) {
    const d = diffById(a.importacoes, b.importacoes);
    if (d) p.importacoes = d;
  }
  if (a.orcamentos !== b.orcamentos) {
    const upsert = Object.entries(b.orcamentos)
      .filter(([k, v]) => v > 0 && a.orcamentos[k] !== v)
      .map(([categoriaId, limite]) => ({ categoriaId, limite }));
    const del = Object.keys(a.orcamentos).filter(
      (k) => a.orcamentos[k] > 0 && !(b.orcamentos[k] > 0),
    );
    if (upsert.length || del.length)
      p.orcamentos = {
        ...(upsert.length ? { upsert } : {}),
        ...(del.length ? { delete: del } : {}),
      };
  }
  const perfil: NonNullable<SyncPayload["perfil"]> = {};
  if (a.nome !== b.nome) perfil.nome = b.nome;
  if (a.prefs !== b.prefs) perfil.prefs = b.prefs;
  if (a.grupo !== b.grupo) {
    if (b.grupo) perfil.grupo = b.grupo;
    else perfil.grupoRemovido = true;
  }
  if (a.resumoIA !== b.resumoIA && b.resumoIA) perfil.resumoIA = b.resumoIA;
  if (Object.keys(perfil).length) p.perfil = perfil;
  return Object.keys(p).length ? p : null;
}

/** Junta dois lotes pendentes (o mais novo vence). */
export function mergePayload(a: SyncPayload, b: SyncPayload): SyncPayload {
  const out: SyncPayload = { ...a };
  for (const key of [
    "lancamentos",
    "categorias",
    "contas",
    "regras",
    "importacoes",
    "orcamentos",
  ] as const) {
    const x = a[key] as Ops<{ id?: string; categoriaId?: string }> | undefined;
    const y = b[key] as Ops<{ id?: string; categoriaId?: string }> | undefined;
    if (!y) continue;
    if (!x) {
      (out as Record<string, unknown>)[key] = y;
      continue;
    }
    const k = (v: { id?: string; categoriaId?: string }) =>
      v.id ?? v.categoriaId!;
    const up = new Map((x.upsert ?? []).map((v) => [k(v), v]));
    const del = new Set(x.delete ?? []);
    for (const v of y.upsert ?? []) {
      up.set(k(v), v);
      del.delete(k(v));
    }
    for (const id of y.delete ?? []) {
      up.delete(id);
      del.add(id);
    }
    (out as Record<string, unknown>)[key] = {
      upsert: [...up.values()],
      delete: [...del],
    };
  }
  if (b.perfil) out.perfil = { ...a.perfil, ...b.perfil };
  return out;
}
