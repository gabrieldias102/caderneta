import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { permitirTentativa, SESSION_COOKIE, verifyPassword } from "@/server/auth";
import { autenticado, erro, lerJson } from "@/server/http";
import { excluirContaSchema } from "@/server/validacao";

/**
 * Exclui a conta e todos os dados (as tabelas apagam em cascata a partir de
 * users, inclusive as sessões). Pede a senha de novo.
 */
export const POST = autenticado(async (req, user) => {
  const body = await lerJson(req, excluirContaSchema);
  if (!body.ok) return body.res;
  if (!await permitirTentativa(`excluir:${user.id}`, 5)) return erro("Muitas tentativas. Aguarde alguns minutos.", 429);

  const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || !await verifyPassword(body.data.senha, row.hash)) return erro("Senha incorreta", 403);

  await db.delete(users).where(eq(users.id, user.id));
  (await cookies()).delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
});
