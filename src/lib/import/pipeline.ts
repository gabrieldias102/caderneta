import { addDays, fmtD } from "../format";
import type { Conta, ItemRevisao, Lancamento, Regra } from "../types";
import { chave, detectar } from "./normalize";
import type { RawTx } from "./parsers";

/** Modelo simples de sugestão: palavras-chave → categoria, com confiança. */
const MODELO: [RegExp, string, number][] = [
  [/IFOOD|RAPPI|UBER\s*EATS|AIQFOME|DELIVERY|ZE\s*DELIVERY/, "delivery", 0.95],
  [/UBER|\b99\b|CABIFY|POSTO|IPIRANGA|SHELL|PETROBRAS|ESTACIONAMENTO|ESTAPAR|SEM\s*PARAR|CONECTCAR|METRO|BILHETE/, "transporte", 0.93],
  [/NETFLIX|SPOTIFY|DISNEY|PRIME|HBO|\bMAX\b|YOUTUBE|DEEZER|GLOBOPLAY|ICLOUD|APPLE\.COM\/BILL/, "assinaturas", 0.98],
  [/DROGA|DROGASIL|FARMACIA|PAGUE\s*MENOS|SMART\s*FIT|SMARTFIT|UNIMED|AMIL|HOSPITAL|CLINICA|LABORATORIO|DENTISTA/, "saude", 0.91],
  // Marketplaces antes de "MERCADO", senão "Mercado Livre" cairia em Mercado.
  [/MERCADO\s*LIVRE|MERCADOLIVRE|AMAZON|SHOPEE|MAGALU|MAGAZINE|AMERICANAS|SHEIN|ALIEXPRESS|RENNER|C&A|ZARA/, "compras", 0.72],
  [/PAO\s*DE\s*ACUCAR|CARREFOUR|ASSAI|ATACADAO|\bEXTRA\b|\bDIA\b|SUPERMERCADO|MERCADO\b|HORTIFRUTI|SACOLAO|FEIRA|ACOUGUE/, "mercado", 0.9],
  [/ALUGUEL|IMOBILIARIA|CONDOMINIO|ENEL|SABESP|COMGAS|\bLIGHT\b|CEMIG|VIVO|INTERNET|IPTU/, "moradia", 0.9],
  [/CINEMA|CINEMARK|INGRESSO|SYMPLA|TEATRO|\bSHOW\b|STEAM|PLAYSTATION|XBOX/, "lazer", 0.88],
  [/LEROY|TOK\s*STOK|ETNA|CAMICADO/, "casa", 0.8],
  [/ESCOLA|FACULDADE|CURSO|UDEMY|ALURA|LIVRARIA/, "educacao", 0.85],
  [/PADARIA|PANIFICADORA|CONFEITARIA/, "mercado", 0.55],
  [/BAR\b|BOTECO|CHOPERIA|PUB\b|RESTAURANTE|LANCHONETE|PIZZARIA|HAMBURGUERIA/, "lazer", 0.44],
  [/SALARIO|FOLHA|PROVENTOS|PAGTO\s*SALARIO/, "salario", 0.97],
];

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

export interface Contexto {
  contaId: string;
  regras: Regra[];
  lancamentos: Lancamento[];
  contas: Conta[];
}

/** Regras do usuário → histórico do usuário → modelo. */
export function sugerirCategoria(estabelecimento: string, descricaoOriginal: string, ctx: Pick<Contexto, "regras" | "lancamentos">) {
  const k = chave(estabelecimento);
  const regra = ctx.regras.find((r) => chave(r.estabelecimento) === k);
  if (regra) return { categoriaId: regra.categoriaId, confianca: 1, porRegra: true };

  const hist = ctx.lancamentos.filter((t) => t.categoriaId && !t.tipo && chave(t.estabelecimento) === k);
  if (hist.length >= 2) {
    const cont: Record<string, number> = {};
    hist.forEach((t) => (cont[t.categoriaId!] = (cont[t.categoriaId!] || 0) + 1));
    const [cat, n] = Object.entries(cont).sort((a, b) => b[1] - a[1])[0];
    return { categoriaId: cat, confianca: Math.min(0.96, 0.7 + 0.26 * (n / hist.length)), porRegra: false };
  }

  const texto = strip(`${descricaoOriginal} ${estabelecimento}`);
  for (const [re, cat, conf] of MODELO) if (re.test(texto)) return { categoriaId: cat, confianca: conf, porRegra: false };
  return { categoriaId: "", confianca: 0, porRegra: false };
}

/** Mesma conta + data ±1 dia + valor + estabelecimento normalizado. */
export function acharDuplicata(item: { data: string; valor: number; estabelecimento: string; tipo?: string }, contaId: string, lancamentos: Lancamento[]) {
  const k = chave(item.estabelecimento);
  const min = addDays(item.data, -1), max = addDays(item.data, 1);
  return lancamentos.find(
    (t) => t.contaId === contaId && t.data >= min && t.data <= max && Math.abs(t.valor - item.valor) < 0.005 &&
      // Neutros (fatura/transferência) não têm estabelecimento: basta o tipo bater.
      (item.tipo ? t.tipo === item.tipo : chave(t.estabelecimento) === k || chave(t.descricao) === k),
  );
}

/** Transferência entre contas próprias: mesmo valor com sinal oposto em outra conta, ±1 dia. */
function ehTransferenciaPropria(r: RawTx, contaId: string, lancamentos: Lancamento[]) {
  if (!/TRANSF|TED|DOC|PIX/.test(strip(r.descricaoOriginal))) return false;
  const min = addDays(r.data, -1), max = addDays(r.data, 1);
  return lancamentos.some((t) => t.contaId !== contaId && t.data >= min && t.data <= max && Math.abs(t.valor + r.valor) < 0.005);
}

export function montarRevisao(rows: RawTx[], ctx: Contexto): ItemRevisao[] {
  return rows.map((r, i) => {
    const det = detectar(r.descricaoOriginal);
    if (!det.tipo && ehTransferenciaPropria(r, ctx.contaId, ctx.lancamentos)) {
      det.tipo = "transferencia";
      det.estabelecimento = "Transferência entre contas";
      det.pix = undefined;
    }
    const neutro = !!det.tipo;
    const pixPF = !!det.pix?.pessoaFisica;
    const sug = neutro || pixPF ? { categoriaId: "", confianca: neutro ? 1 : 0, porRegra: false } : sugerirCategoria(det.estabelecimento, r.descricaoOriginal, ctx);
    // Pix para PF: só a regra do próprio usuário decide.
    if (pixPF) {
      const regra = ctx.regras.find((x) => chave(x.estabelecimento) === chave(det.estabelecimento));
      if (regra) Object.assign(sug, { categoriaId: regra.categoriaId, confianca: 1, porRegra: true });
    }
    const dup = acharDuplicata({ data: r.data, valor: r.valor, estabelecimento: det.estabelecimento, tipo: det.tipo }, ctx.contaId, ctx.lancamentos);
    return {
      k: `${i}`,
      data: r.data,
      descricaoOriginal: r.descricaoOriginal,
      estabelecimento: det.estabelecimento,
      valor: r.valor,
      categoriaId: sug.categoriaId,
      confianca: sug.confianca,
      porRegra: sug.porRegra,
      editado: false,
      ignorado: !!dup,
      tipo: det.tipo,
      pix: det.pix,
      parcela: det.parcela,
      duplicataDe: dup ? fmtD(dup.data) : undefined,
    };
  });
}

export function nivelConfianca(r: ItemRevisao) {
  if (r.tipo) return "n" as const;
  if (r.editado) return "voce" as const;
  if (r.porRegra) return "regra" as const;
  if (r.confianca >= 0.85) return "alta" as const;
  if (r.confianca >= 0.6) return "media" as const;
  if (r.confianca > 0 && r.categoriaId) return "baixa" as const;
  return "nenhuma" as const;
}

/** Confiança baixa, sem categoria, ou Pix PF ainda não confirmado. */
export function precisaRevisao(r: ItemRevisao) {
  if (r.tipo) return false;
  const n = nivelConfianca(r);
  return n === "baixa" || n === "nenhuma" || !r.categoriaId || (!!r.pix?.pessoaFisica && !r.editado && !r.porRegra);
}

/** Tenta identificar o banco/conta pelo nome do arquivo ou pelo conteúdo. */
export function detectarDestino(nomeArquivo: string, conteudo: string, contas: Conta[], cartao?: boolean): Conta | undefined {
  const alvo = strip(`${nomeArquivo} ${conteudo.slice(0, 4000)}`);
  const querCartao = cartao ?? /FATURA|CARTAO|CREDITO|CC[-_]/.test(strip(nomeArquivo));
  const candidatos = contas.filter((c) => c.banco && c.banco.split(" ").some((w) => w.length > 2 && alvo.includes(strip(w))));
  if (!candidatos.length) return undefined;
  return candidatos.find((c) => (c.tipo === "cartao") === querCartao) ?? candidatos[0];
}

/** Faturas exportadas como CSV genérico costumam listar compras como positivas. */
export function ajustarSinal(rows: RawTx[], conta: Conta): RawTx[] {
  if (conta.tipo !== "cartao" || !rows.length) return rows;
  const positivos = rows.filter((r) => r.valor > 0).length;
  return positivos / rows.length > 0.6 ? rows.map((r) => ({ ...r, valor: -r.valor })) : rows;
}
