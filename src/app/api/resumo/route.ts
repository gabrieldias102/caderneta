import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { permitirTentativa } from "@/server/auth";
import { autenticado } from "@/server/http";

/**
 * Resumo do mês por IA. Recebe apenas agregados (totais por categoria),
 * nunca lançamentos brutos, e devolve um parágrafo curto em pt-BR.
 */

interface Agregados {
  mes: string;
  ateDia: number;
  diasRestantes: number;
  receitas: number;
  despesas: number;
  mesAnterior: { receitas: number; despesas: number };
  categorias: { nome: string; valor: number; mesAnterior: number; limite: number | null }[];
  parcelasProximaFatura: number;
}

const SYSTEM = `Você escreve o resumo mensal de um app brasileiro de finanças pessoais.
Escreva em português do Brasil, em linguagem simples e direta, tratando a pessoa por "você".
Um único parágrafo, sem listas, sem títulos, com no máximo 70 palavras.
Use valores em reais arredondados (ex.: R$ 2.156). Compare com o mês anterior, cite o maior gasto e aponte no máximo um ponto de atenção concreto.
Use somente os números fornecidos — não invente valores.`;

const brl0 = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function isAgregados(b: unknown): b is Agregados {
  const x = b as Agregados;
  return !!x && typeof x.mes === "string" && typeof x.receitas === "number" && typeof x.despesas === "number" && Array.isArray(x.categorias);
}

export const POST = autenticado(async (req, user) => {
  // Cada resumo custa uma chamada à API: 20 por usuário por dia.
  if (!await permitirTentativa(`resumo:${user.id}`, 20, 24 * 3600_000)) {
    return NextResponse.json({ erro: "Limite diário de resumos atingido — tente amanhã" }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  if (!isAgregados(body)) return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return NextResponse.json({ erro: "ANTHROPIC_API_KEY não configurada" }, { status: 503 });
  }

  const fatos = [
    `Mês: ${body.mes}, dados até o dia ${body.ateDia}; faltam ${body.diasRestantes} dias.`,
    `Receitas ${brl0(body.receitas)}, despesas ${brl0(body.despesas)}, sobra ${brl0(body.receitas - body.despesas)}.`,
    `Mês anterior: receitas ${brl0(body.mesAnterior.receitas)}, despesas ${brl0(body.mesAnterior.despesas)}, sobra ${brl0(body.mesAnterior.receitas - body.mesAnterior.despesas)}.`,
    "Categorias (mês atual / mês anterior / limite do orçamento):",
    ...body.categorias.slice(0, 8).map((c) => `- ${c.nome}: ${brl0(c.valor)} / ${brl0(c.mesAnterior)} / ${c.limite ? brl0(c.limite) : "sem limite"}`),
    `Parcelas já reservadas na próxima fatura: ${brl0(body.parcelasProximaFatura)}.`,
  ].join("\n");

  const client = new Anthropic();
  try {
    const msg = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: SYSTEM,
      messages: [{ role: "user", content: fatos }],
    });
    if (msg.stop_reason === "refusal") return NextResponse.json({ erro: "Não foi possível gerar agora" }, { status: 502 });
    const texto = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
    if (!texto) return NextResponse.json({ erro: "Resposta vazia" }, { status: 502 });
    return NextResponse.json({ texto });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return NextResponse.json({ erro: "ANTHROPIC_API_KEY inválida" }, { status: 503 });
    if (e instanceof Anthropic.RateLimitError) return NextResponse.json({ erro: "Muitas solicitações — tente em instantes" }, { status: 429 });
    if (e instanceof Anthropic.APIError) return NextResponse.json({ erro: `Erro da API (${e.status})` }, { status: 502 });
    return NextResponse.json({ erro: "Falha de conexão" }, { status: 502 });
  }
});
