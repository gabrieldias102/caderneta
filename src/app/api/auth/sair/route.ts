import { NextResponse } from "next/server";
import { destroySession } from "@/server/auth";
import { erro, mesmaOrigem } from "@/server/http";

export async function POST(req: Request) {
  if (!mesmaOrigem(req)) return erro("Origem não permitida", 403);
  await destroySession();
  return NextResponse.json({ ok: true });
}
