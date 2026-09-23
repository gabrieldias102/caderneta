import { NextResponse } from "next/server";
import { carregarEstado, popularConta } from "@/server/dados";
import { autenticado } from "@/server/http";

/** Substitui todos os dados do usuário pelos dados de exemplo. */
export const POST = autenticado(async (_req, user) => {
  await popularConta(user.id, "exemplo");
  return NextResponse.json(await carregarEstado(user));
});
