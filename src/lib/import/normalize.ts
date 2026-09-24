/** Normalização de estabelecimento e detecção de Pix, parcelas e movimentações neutras. */

const strip = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

/** Estabelecimentos conhecidos: padrão na descrição do banco → nome limpo. */
const CONHECIDOS: [RegExp, string][] = [
  [/\bIFOOD\b|\bIFD\*/, "iFood"],
  [/\bUBER\s*\*?\s*EATS\b/, "Uber Eats"],
  [/\bUBER\b/, "Uber"],
  [/\b99\s*(APP|POP|TAXI|RIDE)\b|\b99APP\b/, "99"],
  [/\bRAPPI\b/, "Rappi"],
  [/\bNETFLIX\b/, "Netflix"],
  [/\bSPOTIFY\b/, "Spotify"],
  [/\bDISNEY\s*PLUS\b|\bDISNEYPLUS\b/, "Disney+"],
  [/\bAMAZON\s*PRIME\b|\bPRIME\s*VIDEO\b/, "Amazon Prime"],
  [/\bAMAZON\b|\bAMZN\b/, "Amazon"],
  [
    /\bMERCADO\s*LIVRE\b|\bMERCADOLIVRE\b|\bMERCPAGO\b|\bMP\s*\*/,
    "Mercado Livre",
  ],
  [/\bMAGAZINE\s*LUIZA\b|\bMAGALU\b/, "Magalu"],
  [/\bDROGA\s*RAIA\b|\bDROGARAIA\b/, "Droga Raia"],
  [/\bDROGASIL\b/, "Drogasil"],
  [/\bPAGUE\s*MENOS\b/, "Pague Menos"],
  [/\bIPIRANGA\b/, "Posto Ipiranga"],
  [/\bSHELL\b/, "Posto Shell"],
  [/\bPETROBRAS\b|\bPOSTO\s*BR\b/, "Posto BR"],
  [/\bPAO\s*DE\s*ACUCAR\b|\bGPA\b/, "Pão de Açúcar"],
  [/\bCARREFOUR\b/, "Carrefour"],
  [/\bASSAI\b/, "Assaí"],
  [/\bSMART\s*FIT\b|\bSMARTFIT\b/, "Smart Fit"],
  [/\bCINEMARK\b/, "Cinemark"],
  [/\bAPPLE\.COM\b|\bAPPLE\b/, "Apple"],
  [/\bGOOGLE\b/, "Google"],
  [/\bSTEAM\b/, "Steam"],
  [/\bENEL\b/, "Enel"],
  [/\bSABESP\b/, "Sabesp"],
  [/\bVIVO\b/, "Vivo"],
  [/\bCLARO\b/, "Claro"],
  [/\bTIM\b/, "TIM"],
  [/\bLEROY\b/, "Leroy Merlin"],
  [/\bSHOPEE\b/, "Shopee"],
];

const RUIDO =
  /\b(LTDA|EIRELI|ME|EPP|S\/?A|SA|CIA|COMERCIO|COM|DE ALIMENTOS|BRASIL|BR|PAGAMENTOS?|INTERNET|ONLINE|WWW|COM\.BR)\b/g;
const MINUSC = new Set(["de", "da", "do", "das", "dos", "e"]);

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) =>
      i > 0 && MINUSC.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}

export interface Deteccao {
  estabelecimento: string;
  pix?: { pessoaFisica: boolean };
  parcela?: { atual: number; total: number };
  tipo?: "fatura" | "transferencia";
}

const RE_PARCELA =
  /(?:PARC(?:ELA)?\.?\s*)?\b(\d{1,2})\s*(?:\/|DE)\s*(\d{1,2})\b\s*$/;
const RE_PARCELA_MEIO =
  /\bPARC(?:ELA)?\.?\s*(\d{1,2})\s*(?:\/|DE)\s*(\d{1,2})\b/;
const RE_FATURA =
  /PAGAMENTO\s+(RECEBIDO|DE\s+FATURA|FATURA|EFETUADO)|PGTO\.?\s*(DE\s+)?FATURA|PAG\s*FAT|PAGTO\s+CARTAO|PAGAMENTO\s+CARTAO/;
const RE_TRANSF =
  /TRANSF(ERENCIA)?\.?\s+(ENTRE\s+CONTAS|MESMA\s+TITULARIDADE|PROPRIA)|\bTED\s+PROPRIA|APLICACAO|RESGATE/;
const RE_PIX = /\bPIX\b/;
const RE_PIX_PREFIXO =
  /^.*?\bPIX\b\s*(QRS\s+)?(ENV(IADO)?|REC(EBIDO)?|TRANSF(ERENCIA)?|ENVIO|RECEB\.?)?\s*[-:*]?\s*(PARA|DE)?\s*/;
const RE_PJ =
  /\b(LTDA|EIRELI|ME|EPP|S\/?A|SA|CIA|COMERCIO|RESTAURANTE|MERCADO|LOJA|FARMACIA|POSTO|PADARIA|BAR|SUPERMERCADO|SERVICOS|IFOOD|UBER)\b|\d{2}\.\d{3}\.\d{3}\/\d{4}/;
const RE_CPF_MASC = /\*{3}\.?\d{3}\.?\d{3}-?\*{2}|\d{3}\.\d{3}\.\d{3}-\d{2}/;

export function detectar(descricaoOriginal: string): Deteccao {
  const up = strip(descricaoOriginal).replace(/\s+/g, " ").trim();
  const out: Deteccao = { estabelecimento: "" };

  if (RE_FATURA.test(up)) {
    out.tipo = "fatura";
    out.estabelecimento = "Pagamento da fatura";
    return out;
  }
  if (RE_TRANSF.test(up)) {
    out.tipo = "transferencia";
    out.estabelecimento = "Transferência entre contas";
    return out;
  }

  let base = up;
  const pm = base.match(RE_PARCELA_MEIO) || base.match(RE_PARCELA);
  if (pm) {
    const atual = Number(pm[1]),
      total = Number(pm[2]);
    if (total >= 2 && atual >= 1 && atual <= total && total <= 48) {
      out.parcela = { atual, total };
      base = base.replace(pm[0], " ").trim();
    }
  }

  if (RE_PIX.test(base)) {
    const nome = base
      .replace(RE_PIX_PREFIXO, "")
      .replace(RE_CPF_MASC, "")
      .replace(/[^A-Z\s.]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const pf =
      !RE_PJ.test(base) &&
      (nome.split(" ").length >= 2 || RE_CPF_MASC.test(base));
    out.pix = { pessoaFisica: pf };
    if (nome) {
      out.estabelecimento = titleCase(nome).replace(
        /\b([A-Z])\b(?!\.)/g,
        "$1.",
      );
      return out;
    }
  }

  for (const [re, nome] of CONHECIDOS) {
    if (re.test(base)) {
      out.estabelecimento = nome;
      return out;
    }
  }

  const limpo = base
    .replace(
      /^(COMPRA\s+(CARTAO|NO\s+DEBITO|DEBITO|CREDITO)|COMPRA|DEBITO|PAG\*|PG\s*\*|EC\s*\*|PAGSEGURO\s*\*?|SUMUP\s*\*?|STONE\s*\*?|CIELO\s*\*?)\s*/,
      "",
    )
    .replace(/\*.*$/, "")
    .replace(/\b\d{3,}\b/g, " ")
    .replace(/\s+-\s+.*$/, "")
    .replace(RUIDO, " ")
    .replace(/[^A-Z0-9\s&'.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  out.estabelecimento = titleCase(limpo || base)
    .replace(/\bDo Ze\b/i, "do Zé")
    .replace(/\bZe\b/, "Zé");
  return out;
}

/** Chave de comparação de estabelecimentos (regras, histórico e duplicatas). */
export const chave = (s: string) => strip(s).replace(/[^A-Z0-9]/g, "");
