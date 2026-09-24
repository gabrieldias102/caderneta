"use client";

import type { Conta } from "../types";
import {
  parseCSV,
  parseOFX,
  parsePDFText,
  ParseError,
  type RawTx,
} from "./parsers";
import { detectarDestino, sugerirConta } from "./pipeline";

export const EXTENSOES = ["pdf", "ofx", "csv"] as const;
export const MAX_BYTES = 10 * 1024 * 1024;

export interface ArquivoLido {
  rows: RawTx[];
  destino?: Conta;
  /** Conta a criar quando o banco do arquivo não está entre as do usuário. */
  sugestao?: Omit<Conta, "id">;
  hint: string;
}

const extOf = (name: string) => name.split(".").pop()!.toLowerCase();

async function textoDoPDF(buf: ArrayBuffer): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const linhas: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Agrupa itens pela coordenada Y para reconstruir as linhas.
    const porY = new Map<number, { x: number; s: string }[]>();
    for (const it of content.items) {
      if (!("str" in it) || !it.str.trim()) continue;
      const y = Math.round(it.transform[5]);
      const key = [...porY.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
      if (!porY.has(key)) porY.set(key, []);
      porY.get(key)!.push({ x: it.transform[4], s: it.str });
    }
    [...porY.entries()]
      .sort((a, b) => b[0] - a[0])
      .forEach(([, parts]) =>
        linhas.push(
          parts
            .sort((a, b) => a.x - b.x)
            .map((p) => p.s)
            .join(" "),
        ),
      );
  }
  return linhas;
}

/** Lê o arquivo no navegador — nada é enviado a servidor algum. */
export async function lerArquivo(
  file: File,
  contas: Conta[],
  contaEscolhida?: Conta,
): Promise<ArquivoLido> {
  const ext = extOf(file.name);
  const ano = new Date().getFullYear();
  if (ext === "ofx") {
    const text = await file.text();
    const r = parseOFX(text);
    const destino = detectarDestino(file.name, text, contas, r.cartao);
    return {
      rows: r.rows,
      destino,
      sugestao: destino ? undefined : sugerirConta(file.name, text, r.cartao),
      hint: destino
        ? `Extrato ${destino.nome} detectado`
        : "OFX — escolha o destino",
    };
  }
  if (ext === "csv") {
    const text = await file.text();
    const r = parseCSV(text, ano);
    const pista = r.formato === "nubank-fatura" ? "nubank fatura" : "";
    const cartao = r.formato === "nubank-fatura" ? true : undefined;
    const destino = detectarDestino(file.name, pista, contas, cartao);
    const tipo = destino?.tipo === "cartao" ? "Fatura" : "Extrato";
    return {
      rows: r.rows,
      destino,
      sugestao: destino ? undefined : sugerirConta(file.name, pista, cartao),
      hint: destino
        ? `${tipo} ${destino.nome.split(" ")[0]} detectad${tipo === "Fatura" ? "a" : "o"}`
        : "CSV — escolha o destino",
    };
  }
  if (ext === "pdf") {
    const linhas = await textoDoPDF(await file.arrayBuffer());
    const texto = linhas.join("\n");
    const cartao =
      /FATURA|CARTAO DE CREDITO|CARTÃO DE CRÉDITO/i.test(texto) || undefined;
    const destino = detectarDestino(file.name, texto, contas, cartao);
    const alvo = contaEscolhida ?? destino;
    const rows = parsePDFText(linhas, {
      cartao: alvo?.tipo === "cartao",
      fallbackYear: ano,
    });
    if (!rows.length)
      throw new ParseError(
        "Não encontrei lançamentos neste PDF. Se o banco oferecer OFX ou CSV, prefira esses formatos.",
      );
    return {
      rows,
      destino,
      sugestao: destino ? undefined : sugerirConta(file.name, texto, cartao),
      hint: destino
        ? `${destino.tipo === "cartao" ? "Fatura" : "Extrato"} ${destino.nome.split(" ")[0]} detectad${destino.tipo === "cartao" ? "a" : "o"}`
        : "PDF — escolha o destino",
    };
  }
  throw new ParseError("Formato não suportado — use PDF, OFX ou CSV");
}

export function extensaoValida(name: string) {
  return (EXTENSOES as readonly string[]).includes(extOf(name));
}
