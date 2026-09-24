import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL)
  throw new Error("DATABASE_URL não configurada (veja .env.example)");

const producao = process.env.NODE_ENV === "production";

// Reaproveita a conexão entre recargas do dev server.
const g = globalThis as unknown as { __pg?: ReturnType<typeof postgres> };
const client =
  g.__pg ??
  postgres(process.env.DATABASE_URL, {
    // Em produção (Vercel) cada instância da função abre poucas conexões e o
    // pooler do provedor (PgBouncer/Supavisor) multiplexa. Pooler em modo
    // transação não mantém prepared statements entre requisições.
    max: producao ? 3 : 10,
    prepare: !producao,
    idle_timeout: 20,
    connect_timeout: 10,
  });
if (!producao) g.__pg = client;

export const db = drizzle(client, { schema });
export type DB = typeof db;
