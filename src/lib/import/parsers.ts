import { parseValorBR } from "../format";
import type { ISODate } from "../types";

/** Linha crua lida do arquivo, antes de normalizar e categorizar. */
export interface RawTx {
  data: ISODate;
  descricaoOriginal: string;
  valor: number;
}

export class ParseError extends Error {}

/* ── OFX ──────────────────────────────────────────────────────────────────
   Cobre OFX 1.x (SGML, tags sem fechamento) e 2.x (XML). */
function ofxTag(block: string, tag: string): string | undefined {
  const m = block.match(new RegExp(`<${tag}>([^<\\r\\n]*)`, "i"));
  return m ? m[1].trim() : undefined;
}

export function parseOFX(text: string): {
  rows: RawTx[];
  banco?: string;
  cartao: boolean;
} {
  const blocks = text
    .split(/<STMTTRN>/i)
    .slice(1)
    .map((b) => b.split(/<\/STMTTRN>/i)[0]);
  if (!blocks.length)
    throw new ParseError("Nenhum lançamento encontrado no OFX");
  const rows: RawTx[] = [];
  for (const b of blocks) {
    const dt = ofxTag(b, "DTPOSTED");
    const amt = ofxTag(b, "TRNAMT");
    if (!dt || !amt) continue;
    const memo = ofxTag(b, "MEMO") || ofxTag(b, "NAME") || "";
    const name = ofxTag(b, "NAME");
    const desc =
      name && memo && !memo.toUpperCase().includes(name.toUpperCase())
        ? `${name} ${memo}`
        : memo || name || "";
    const valor = parseFloat(amt.replace(",", "."));
    if (!isFinite(valor)) continue;
    rows.push({
      data: `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}`,
      descricaoOriginal: desc.replace(/\s+/g, " ").trim(),
      valor,
    });
  }
  const org = ofxTag(text, "ORG") || ofxTag(text, "FID");
  return { rows, banco: org, cartao: /<CCSTMTRS>/i.test(text) };
}

/* ── CSV ──────────────────────────────────────────────────────────────── */
function splitCSVLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "",
    q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === sep) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function parseDate(s: string, fallbackYear: number): ISODate | null {
  s = s.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/);
  if (m) {
    const y = m[3]
      ? m[3].length === 2
        ? 2000 + Number(m[3])
        : Number(m[3])
      : fallbackYear;
    return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return null;
}

export interface CSVResult {
  rows: RawTx[];
  formato: "nubank-fatura" | "generico";
}

export function parseCSV(
  text: string,
  fallbackYear = new Date().getFullYear(),
): CSVResult {
  const lines = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (lines.length < 2) throw new ParseError("CSV vazio");
  const first = lines[0];
  const sep = [";", ",", "\t"]
    .map((s) => [s, first.split(s).length] as const)
    .sort((a, b) => b[1] - a[1])[0][0];
  const header = splitCSVLine(first, sep).map(norm);
  const find = (...names: string[]) =>
    header.findIndex((h) => names.some((n) => h === n || h.includes(n)));
  const iData = find("data", "date", "dt");
  const iDesc = find(
    "descricao",
    "title",
    "historico",
    "lancamento",
    "estabelecimento",
    "description",
    "memo",
  );
  const iValor = find("valor", "amount", "value", "quantia");
  const iDeb = find("debito", "saida");
  const iCred = find("credito", "entrada");
  if (iData < 0 || iDesc < 0 || (iValor < 0 && iDeb < 0)) {
    throw new ParseError(
      "Não reconheci as colunas do CSV (preciso de data, descrição e valor)",
    );
  }
  // Fatura Nubank: "date,title,amount" com compras positivas.
  const nubank = header.includes("title") && header.includes("amount");
  const rows: RawTx[] = [];
  for (const line of lines.slice(1)) {
    const c = splitCSVLine(line, sep);
    const data = parseDate(c[iData] || "", fallbackYear);
    if (!data) continue;
    let valor: number;
    if (iValor >= 0) valor = parseValorBR(c[iValor] || "");
    else
      valor =
        (parseValorBR(c[iCred] || "0") || 0) -
        Math.abs(parseValorBR(c[iDeb] || "0") || 0);
    if (!isFinite(valor) || valor === 0) continue;
    if (nubank) valor = -valor;
    rows.push({
      data,
      descricaoOriginal: (c[iDesc] || "").replace(/\s+/g, " "),
      valor,
    });
  }
  if (!rows.length) throw new ParseError("Nenhum lançamento encontrado no CSV");
  return { rows, formato: nubank ? "nubank-fatura" : "generico" };
}

/* ── PDF (texto já extraído) ───────────────────────────────────────────────
   Heurística genérica: linhas "dd/mm[/aaaa] DESCRIÇÃO  1.234,56". Faturas de
   cartão listam compras como positivas; extratos usam sinal ou "D"/"C". */
export function parsePDFText(
  lines: string[],
  opts: { cartao: boolean; fallbackYear: number },
): RawTx[] {
  const rows: RawTx[] = [];
  const re =
    /^(\d{2}[/.]\d{2}(?:[/.]\d{2,4})?)\s+(.+?)\s+(-|−)?\s?(?:R\$\s?)?(\d{1,3}(?:\.\d{3})*,\d{2})\s*([DC-])?$/i;
  for (const raw of lines) {
    const line = raw.replace(/\s+/g, " ").trim();
    const m = line.match(re);
    if (!m) continue;
    const data = parseDate(m[1].replace(/\./g, "/"), opts.fallbackYear);
    if (!data) continue;
    let valor = parseValorBR(m[4]);
    const negativo = !!m[3] || m[5]?.toUpperCase() === "D" || m[5] === "-";
    const desc = m[2].trim();
    if (opts.cartao) {
      // Na fatura, valores sem sinal são compras; pagamentos/estornos vêm negativos.
      valor = negativo ? valor : -valor;
    } else {
      valor = negativo ? -valor : valor;
    }
    rows.push({ data, descricaoOriginal: desc, valor });
  }
  return rows;
}
