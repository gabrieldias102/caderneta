import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Prefs } from "@/lib/types";

/**
 * Todas as tabelas de dados são particionadas por usuário: a chave primária é
 * (user_id, id), com ids gerados no cliente. Assim o app continua funcionando
 * com atualização otimista e cada usuário só enxerga o que é dele.
 */

const dinheiro = (name: string) =>
  numeric(name, { precision: 14, scale: 2, mode: "number" });

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  nome: text("nome").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    /** sha256 do token do cookie — o token em si nunca é gravado. */
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Preferências e dados de perfil que não têm tabela própria. */
export const perfis = pgTable("perfis", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  prefs: jsonb("prefs").$type<Prefs>().notNull(),
  /** Grupo compartilhado (ainda local ao usuário — ver README). */
  grupo: jsonb("grupo").$type<unknown>(),
  resumoIA: jsonb("resumo_ia").$type<{ mes: string; texto: string }>(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

const owned = {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  id: text("id").notNull(),
};

export const categorias = pgTable(
  "categorias",
  {
    ...owned,
    nome: text("nome").notNull(),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);

export const contas = pgTable(
  "contas",
  {
    ...owned,
    nome: text("nome").notNull(),
    tipo: text("tipo", { enum: ["conta", "cartao"] }).notNull(),
    sub: text("sub").notNull().default(""),
    banco: text("banco"),
    saldo: dinheiro("saldo"),
    ultimoExtrato: text("ultimo_extrato"),
    limite: dinheiro("limite"),
    faturaAtual: dinheiro("fatura_atual"),
    fechamento: date("fechamento"),
    vencimento: date("vencimento"),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);

export const lancamentos = pgTable(
  "lancamentos",
  {
    ...owned,
    data: date("data").notNull(),
    descricaoOriginal: text("descricao_original").notNull().default(""),
    descricao: text("descricao").notNull(),
    estabelecimento: text("estabelecimento").notNull().default(""),
    valor: dinheiro("valor").notNull(),
    contaId: text("conta_id").notNull(),
    categoriaId: text("categoria_id"),
    tipo: text("tipo", { enum: ["fatura", "transferencia"] }),
    pixPessoaFisica: boolean("pix_pessoa_fisica"),
    parcelaAtual: integer("parcela_atual"),
    parcelaTotal: integer("parcela_total"),
    compartilhado: boolean("compartilhado").notNull().default(false),
    importacaoId: text("importacao_id"),
    origem: text("origem", {
      enum: ["arquivo", "manual", "exemplo"],
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.id] }),
    index("lancamentos_user_data_idx").on(t.userId, t.data),
    index("lancamentos_user_conta_idx").on(t.userId, t.contaId),
  ],
);

export const regras = pgTable(
  "regras",
  {
    ...owned,
    estabelecimento: text("estabelecimento").notNull(),
    categoriaId: text("categoria_id").notNull(),
    origem: text("origem").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);

export const orcamentos = pgTable(
  "orcamentos",
  {
    userId: owned.userId,
    categoriaId: text("categoria_id").notNull(),
    limite: dinheiro("limite").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.categoriaId] })],
);

export const importacoes = pgTable(
  "importacoes",
  {
    ...owned,
    arquivo: text("arquivo").notNull(),
    contaId: text("conta_id").notNull(),
    data: date("data").notNull(),
    total: integer("total").notNull(),
    ignorados: integer("ignorados").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);

/** Limite de tentativas (login, cadastro, resumo por IA), compartilhado entre instâncias. */
export const tentativas = pgTable(
  "tentativas",
  {
    chave: text("chave").primaryKey(),
    n: integer("n").notNull(),
    ate: timestamp("ate", { withTimezone: true }).notNull(),
  },
  (t) => [index("tentativas_ate_idx").on(t.ate)],
);
