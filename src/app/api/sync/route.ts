import { NextResponse } from "next/server";
import { aplicarSync } from "@/server/dados";
import { autenticado, erro, lerJson } from "@/server/http";
import { syncSchema } from "@/server/validacao";

export const POST = autenticado(async (req, user) => {
  const body = await lerJson(req, syncSchema);
  if (!body.ok) return body.res;
  try {
    await aplicarSync(user.id, body.data);
  } catch (e) {
    console.error("sync falhou", e);
    return erro("Não foi possível salvar", 500);
  }
  return NextResponse.json({ ok: true });
});
