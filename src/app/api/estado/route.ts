import { NextResponse } from "next/server";
import { carregarEstado } from "@/server/dados";
import { autenticado } from "@/server/http";

export const GET = autenticado(async (_req, user) =>
  NextResponse.json(await carregarEstado(user), { headers: { "Cache-Control": "no-store" } }));
