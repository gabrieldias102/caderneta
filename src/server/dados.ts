import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { z } from "zod";
import { db, type DB } from "@/db";
import * as t from "@/db/schema";
import { CATEGORIAS, seedState } from "@/lib/seed";
import type { Conta, DataState, Grupo, Lancamento, Prefs } from "@/lib/types";
import type { syncSchema } from "./validacao";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

export const PREFS_PADRAO: Prefs = {
  budget: true,
  thr: 80,
  fatura: true,
  pix: true,
  dup: true,
  weekly: false,
  tema: "sistema",
  confStyle: "medidor",
};

/* ── Linhas ⇄ modelo do app ─────────────────────────────────────────────── */

const semNulos = <T extends object>(o: T) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== null && v !== undefined),
  ) as { [K in keyof T]: Exclude<T[K], null> };

function lancamentoRow(userId: string, l: Lancamento) {
  return {
    userId,
    id: l.id,
    data: l.data,
    descricaoOriginal: l.descricaoOriginal,
    descricao: l.descricao,
    estabelecimento: l.estabelecimento,
    valor: l.valor,
    contaId: l.contaId,
    categoriaId: l.categoriaId ?? null,
    tipo: l.tipo ?? null,
    pixPessoaFisica: l.pix ? l.pix.pessoaFisica : null,
    parcelaAtual: l.parcela?.atual ?? null,
    parcelaTotal: l.parcela?.total ?? null,
    compartilhado: !!l.compartilhado,
    importacaoId: l.importacaoId ?? null,
    origem: l.origem,
  };
}

function lancamentoDe(r: typeof t.lancamentos.$inferSelect): Lancamento {
  return semNulos({
    id: r.id,
    data: r.data,
    descricaoOriginal: r.descricaoOriginal,
    descricao: r.descricao,
    estabelecimento: r.estabelecimento,
    valor: r.valor,
    contaId: r.contaId,
    categoriaId: r.categoriaId,
    tipo: r.tipo,
    pix:
      r.pixPessoaFisica === null ? null : { pessoaFisica: r.pixPessoaFisica },
    parcela:
      r.parcelaAtual && r.parcelaTotal
        ? { atual: r.parcelaAtual, total: r.parcelaTotal }
        : null,
    compartilhado: r.compartilhado || null,
    importacaoId: r.importacaoId,
    origem: r.origem,
  }) as Lancamento;
}

function contaRow(
  userId: string,
  c: Conta & { ordem?: number },
  ordem = c.ordem ?? 0,
) {
  return {
    userId,
    id: c.id,
    nome: c.nome,
    tipo: c.tipo,
    sub: c.sub,
    banco: c.banco ?? null,
    saldo: c.saldo ?? null,
    ultimoExtrato: c.ultimoExtrato ?? null,
    limite: c.limite ?? null,
    faturaAtual: c.faturaAtual ?? null,
    fechamento: c.fechamento ?? null,
    vencimento: c.vencimento ?? null,
    ordem,
  };
}

/* ── Leitura ─────────────────────────────────────────────────────────────── */

export async function carregarEstado(user: {
  id: string;
  nome: string;
  email: string;
}): Promise<DataState> {
  const u = user.id;
  const [perfil] = await db
    .select()
    .from(t.perfis)
    .where(eq(t.perfis.userId, u));
  const [cats, contas, lancs, regras, orcs, imps] = await Promise.all([
    db
      .select()
      .from(t.categorias)
      .where(eq(t.categorias.userId, u))
      .orderBy(asc(t.categorias.ordem)),
    db
      .select()
      .from(t.contas)
      .where(eq(t.contas.userId, u))
      .orderBy(asc(t.contas.ordem)),
    db
      .select()
      .from(t.lancamentos)
      .where(eq(t.lancamentos.userId, u))
      .orderBy(desc(t.lancamentos.data), desc(t.lancamentos.createdAt)),
    db
      .select()
      .from(t.regras)
      .where(eq(t.regras.userId, u))
      .orderBy(asc(t.regras.createdAt)),
    db.select().from(t.orcamentos).where(eq(t.orcamentos.userId, u)),
    db
      .select()
      .from(t.importacoes)
      .where(eq(t.importacoes.userId, u))
      .orderBy(desc(t.importacoes.data), desc(t.importacoes.createdAt)),
  ]);
  return {
    version: 1,
    nome: user.nome,
    email: user.email,
    categorias: cats.map((c) => ({ id: c.id, nome: c.nome })),
    contas: contas.map(
      ({ userId: _u, ordem: _o, ...c }) => semNulos(c) as Conta,
    ),
    lancamentos: lancs.map(lancamentoDe),
    regras: regras.map((r) => ({
      id: r.id,
      estabelecimento: r.estabelecimento,
      categoriaId: r.categoriaId,
      origem: r.origem,
    })),
    orcamentos: Object.fromEntries(orcs.map((o) => [o.categoriaId, o.limite])),
    importacoes: imps.map((i) => ({
      id: i.id,
      arquivo: i.arquivo,
      contaId: i.contaId,
      data: i.data,
      total: i.total,
      ignorados: i.ignorados,
    })),
    prefs: { ...PREFS_PADRAO, ...(perfil?.prefs ?? {}) },
    ...(perfil?.grupo ? { grupo: perfil.grupo as Grupo } : {}),
    ...(perfil?.resumoIA ? { resumoIA: perfil.resumoIA } : {}),
  };
}

/* ── Escrita ─────────────────────────────────────────────────────────────── */

type Sync = z.infer<typeof syncSchema>;

/** upsert em lote na chave (user_id, id): atualiza todas as colunas que não são chave. */
async function upsert<
  T extends
    | typeof t.lancamentos
    | typeof t.categorias
    | typeof t.contas
    | typeof t.regras
    | typeof t.importacoes,
>(tx: Tx, table: T, rows: T["$inferInsert"][]) {
  if (!rows.length) return;
  const colunas = table as unknown as Record<string, PgColumn>;
  const set = Object.fromEntries(
    Object.keys(rows[0])
      .filter((k) => k !== "userId" && k !== "id")
      .map((k) => [k, sql.raw(`excluded."${colunas[k].name}"`)]),
  );
  // Os tipos do Drizzle não se resolvem sobre uma união de tabelas; as linhas já vêm tipadas por T.
  const alvo = table as unknown as typeof t.regras;
  for (let i = 0; i < rows.length; i += 500) {
    await tx
      .insert(alvo)
      .values(rows.slice(i, i + 500) as (typeof t.regras.$inferInsert)[])
      .onConflictDoUpdate({ target: [alvo.userId, alvo.id], set });
  }
}

export async function aplicarSync(userId: string, p: Sync) {
  await db.transaction(async (tx) => {
    const del = async (
      table:
        | typeof t.lancamentos
        | typeof t.categorias
        | typeof t.contas
        | typeof t.regras
        | typeof t.importacoes,
      ids?: string[],
    ) => {
      if (ids?.length)
        await tx
          .delete(table)
          .where(and(eq(table.userId, userId), inArray(table.id, ids)));
    };

    await upsert(
      tx,
      t.categorias,
      (p.categorias?.upsert ?? []).map((c) => ({
        userId,
        id: c.id,
        nome: c.nome,
        ordem: c.ordem ?? 0,
      })),
    );
    await del(t.categorias, p.categorias?.delete);

    await upsert(
      tx,
      t.contas,
      (p.contas?.upsert ?? []).map((c) =>
        contaRow(userId, c as Conta & { ordem?: number }),
      ),
    );
    await del(t.contas, p.contas?.delete);

    await upsert(
      tx,
      t.lancamentos,
      (p.lancamentos?.upsert ?? []).map((l) =>
        lancamentoRow(userId, l as Lancamento),
      ),
    );
    await del(t.lancamentos, p.lancamentos?.delete);

    await upsert(
      tx,
      t.regras,
      (p.regras?.upsert ?? []).map((r) => ({ userId, ...r })),
    );
    await del(t.regras, p.regras?.delete);

    await upsert(
      tx,
      t.importacoes,
      (p.importacoes?.upsert ?? []).map((i) => ({ userId, ...i })),
    );
    await del(t.importacoes, p.importacoes?.delete);

    const orc = p.orcamentos;
    if (orc?.upsert?.length) {
      await tx
        .insert(t.orcamentos)
        .values(orc.upsert.map((o) => ({ userId, ...o })))
        .onConflictDoUpdate({
          target: [t.orcamentos.userId, t.orcamentos.categoriaId],
          set: { limite: sql.raw(`excluded."limite"`) },
        });
    }
    if (orc?.delete?.length)
      await tx
        .delete(t.orcamentos)
        .where(
          and(
            eq(t.orcamentos.userId, userId),
            inArray(t.orcamentos.categoriaId, orc.delete),
          ),
        );

    const pf = p.perfil;
    if (pf) {
      if (pf.nome)
        await tx
          .update(t.users)
          .set({ nome: pf.nome })
          .where(eq(t.users.id, userId));
      const patch: Partial<typeof t.perfis.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (pf.prefs) patch.prefs = pf.prefs;
      if (pf.grupo) patch.grupo = pf.grupo;
      if (pf.grupoRemovido) patch.grupo = null;
      if (pf.resumoIA) patch.resumoIA = pf.resumoIA;
      await tx
        .insert(t.perfis)
        .values({ userId, prefs: pf.prefs ?? PREFS_PADRAO, ...patch })
        .onConflictDoUpdate({ target: t.perfis.userId, set: patch });
    }
  });
}

/* ── Dados iniciais ──────────────────────────────────────────────────────── */

/** Apaga tudo do usuário e grava o estado inicial (vazio ou de exemplo). */
export async function popularConta(userId: string, modo: "vazio" | "exemplo") {
  const s: DataState =
    modo === "exemplo"
      ? seedState()
      : {
          ...seedState(),
          categorias: CATEGORIAS,
          contas: [
            {
              id: "dinheiro",
              nome: "Dinheiro",
              tipo: "conta",
              sub: "Carteira · lançado à mão",
              saldo: 0,
            },
          ],
          lancamentos: [],
          regras: [],
          importacoes: [],
          orcamentos: {},
          grupo: undefined,
        };
  await db.transaction(async (tx) => {
    for (const table of [
      t.lancamentos,
      t.regras,
      t.importacoes,
      t.orcamentos,
      t.contas,
      t.categorias,
    ]) {
      await tx.delete(table).where(eq(table.userId, userId));
    }
    await tx
      .insert(t.perfis)
      .values({
        userId,
        prefs: PREFS_PADRAO,
        grupo: s.grupo ?? null,
        resumoIA: null,
      })
      .onConflictDoUpdate({
        target: t.perfis.userId,
        set: { grupo: s.grupo ?? null, resumoIA: null, updatedAt: new Date() },
      });
    await tx.insert(t.categorias).values(
      s.categorias.map((c, i) => ({
        userId,
        id: c.id,
        nome: c.nome,
        ordem: i,
      })),
    );
    await tx
      .insert(t.contas)
      .values(s.contas.map((c, i) => contaRow(userId, c, i)));
    if (s.lancamentos.length)
      await tx
        .insert(t.lancamentos)
        .values(s.lancamentos.map((l) => lancamentoRow(userId, l)));
    if (s.regras.length)
      await tx.insert(t.regras).values(s.regras.map((r) => ({ userId, ...r })));
    if (s.importacoes.length)
      await tx
        .insert(t.importacoes)
        .values(s.importacoes.map((i) => ({ userId, ...i })));
    const orcs = Object.entries(s.orcamentos);
    if (orcs.length)
      await tx.insert(t.orcamentos).values(
        orcs.map(([categoriaId, limite]) => ({
          userId,
          categoriaId,
          limite,
        })),
      );
  });
}
