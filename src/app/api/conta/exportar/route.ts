import { NextResponse } from "next/server";
import { carregarEstado } from "@/server/dados";
import { autenticado } from "@/server/http";

/** Todos os dados do usuário num arquivo JSON (portabilidade — LGPD art. 18). */
export const GET = autenticado(async (_req, user) => {
  const agora = new Date();
  const dados = {
    exportadoEm: agora.toISOString(),
    ...(await carregarEstado(user)),
  };
  return NextResponse.json(dados, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="caderneta-${agora.toISOString().slice(0, 10)}.json"`,
    },
  });
});
