import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, getDummyHash, limparTentativas, permitirTentativa, verifyPassword } from "@/server/auth";
import { erro, lerJson, mesmaOrigem } from "@/server/http";
import { entrarSchema } from "@/server/validacao";

export async function POST(req: Request) {
  if (!mesmaOrigem(req)) return erro("Origem não permitida", 403);
  const body = await lerJson(req, entrarSchema);
  if (!body.ok) return body.res;
  const { email, senha } = body.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const chave = `entrar:${ip}:${email}`;
  if (!permitirTentativa(chave)) return erro("Muitas tentativas. Aguarde alguns minutos.", 429);

  const [user] = await db.select({ id: users.id, hash: users.passwordHash }).from(users).where(eq(users.email, email)).limit(1);
  // Compara mesmo sem usuário, para não revelar pelo tempo de resposta se o e-mail existe.
  const ok = await verifyPassword(senha, user?.hash ?? (await getDummyHash()));
  if (!user || !ok) return erro("E-mail ou senha incorretos", 401);

  limparTentativas(chave);
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
