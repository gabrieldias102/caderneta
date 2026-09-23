import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword, permitirTentativa } from "@/server/auth";
import { popularConta } from "@/server/dados";
import { erro, lerJson, mesmaOrigem } from "@/server/http";
import { cadastroSchema } from "@/server/validacao";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!mesmaOrigem(req)) return erro("Origem não permitida", 403);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (!permitirTentativa(`cadastro:${ip}`, 10, 60 * 60_000)) return erro("Muitas tentativas. Tente de novo mais tarde.", 429);

  const body = await lerJson(req, cadastroSchema);
  if (!body.ok) return body.res;
  const { nome, email, senha, exemplo } = body.data;

  const [user] = await db.insert(users)
    .values({ nome, email, passwordHash: await hashPassword(senha) })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });
  if (!user) return erro("Já existe uma conta com esse e-mail", 409);

  await popularConta(user.id, exemplo ? "exemplo" : "vazio");
  await createSession(user.id);
  return NextResponse.json({ ok: true }, { status: 201 });
}
