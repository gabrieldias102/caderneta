import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { getSessionUser, type SessionUser } from "./auth";

export const erro = (mensagem: string, status: number) =>
  NextResponse.json({ erro: mensagem }, { status });

/** Bloqueia requisições de outra origem em rotas que alteram dados (CSRF). */
export function mesmaOrigem(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return (
      new URL(origin).host ===
      (req.headers.get("x-forwarded-host") ?? req.headers.get("host"))
    );
  } catch {
    return false;
  }
}

export async function lerJson<T extends z.ZodType>(
  req: Request,
  schema: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; res: NextResponse }> {
  const body = await req.json().catch(() => undefined);
  const r = schema.safeParse(body);
  if (!r.success)
    return {
      ok: false,
      res: erro(r.error.issues[0]?.message ?? "Dados inválidos", 400),
    };
  return { ok: true, data: r.data };
}

type Handler = (req: Request, user: SessionUser) => Promise<Response>;

/** Envolve um handler que exige sessão (e mesma origem, se alterar dados). */
export function autenticado(fn: Handler) {
  return async (req: Request) => {
    if (req.method !== "GET" && !mesmaOrigem(req))
      return erro("Origem não permitida", 403);
    const user = await getSessionUser();
    if (!user) return erro("Não autenticado", 401);
    return fn(req, user);
  };
}
