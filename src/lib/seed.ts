import type { Conta, DataState, Lancamento } from "./types";

/** Dados de exemplo do handoff (setembro/2026, "hoje" = 23/09/2026). */

export const CATEGORIAS = [
  ["mercado", "Mercado"], ["delivery", "Delivery"], ["transporte", "Transporte"], ["moradia", "Moradia"],
  ["lazer", "Lazer"], ["saude", "Saúde"], ["assinaturas", "Assinaturas"], ["compras", "Compras"],
  ["casa", "Casa"], ["educacao", "Educação"], ["presentes", "Presentes"], ["salario", "Salário"], ["outros", "Outros"],
].map(([id, nome]) => ({ id, nome }));

export const CONTAS: Conta[] = [
  { id: "nuconta", nome: "Nubank", tipo: "conta", banco: "nubank nu pagamentos", sub: "Conta corrente", saldo: 3420.18, ultimoExtrato: "20/09 (OFX)" },
  { id: "itau", nome: "Itaú", tipo: "conta", banco: "itau itaú", sub: "Conta corrente · ag. 0421", saldo: 8905.4, ultimoExtrato: "20/09 (PDF)" },
  { id: "dinheiro", nome: "Dinheiro", tipo: "conta", sub: "Carteira · lançado à mão", saldo: 180, ultimoExtrato: "Atualizado em 15/09" },
  { id: "nucc", nome: "Nubank Ultravioleta", tipo: "cartao", banco: "nubank nu ultravioleta", sub: "Crédito •••• 4821", faturaAtual: 1842.37, limite: 12000, fechamento: "2026-09-25", vencimento: "2026-10-02" },
  { id: "itaucc", nome: "Itaú Click", tipo: "cartao", banco: "itau itaú click", sub: "Crédito •••• 0913", faturaAtual: 689.9, limite: 5000, fechamento: "2026-10-03", vencimento: "2026-10-10" },
];

type T = [id: number, data: string, desc: string, est: string, valor: number, conta: string, cat: string, extra?: Partial<Lancamento>];

const SETEMBRO: T[] = [
  [1, "2026-09-23", "iFood · Restaurante Sabor", "iFood", -58.9, "nucc", "delivery"],
  [2, "2026-09-23", "Pix enviado · Mariana Souza", "Mariana Souza", -120, "nuconta", "", { pix: { pessoaFisica: true } }],
  [3, "2026-09-22", "Uber", "Uber", -23.4, "nucc", "transporte"],
  [4, "2026-09-22", "Pão de Açúcar", "Pão de Açúcar", -312.75, "itaucc", "mercado", { compartilhado: true }],
  [5, "2026-09-21", "Magazine Luiza · Air fryer", "Magalu", -189.9, "nucc", "casa", { parcela: { atual: 3, total: 10 } }],
  [6, "2026-09-20", "Transferência Nubank → Itaú", "", -1500, "nuconta", "", { tipo: "transferencia" }],
  [7, "2026-09-20", "Pagamento fatura Nubank", "", -2340.5, "itau", "", { tipo: "fatura" }],
  [8, "2026-09-19", "Rappi", "Rappi", -74.5, "nucc", "delivery"],
  [9, "2026-09-18", "Pix recebido · João Lima", "João Lima", 85, "nuconta", "", { pix: { pessoaFisica: true } }],
  [10, "2026-09-18", "Netflix", "Netflix", -55.9, "nucc", "assinaturas"],
  [11, "2026-09-17", "Drogasil", "Drogasil", -67.3, "nucc", "saude"],
  [12, "2026-09-15", "Feira de domingo", "Feira", -42, "dinheiro", "mercado", { origem: "manual" }],
  [13, "2026-09-15", "Aluguel setembro", "Imobiliária Lar", -2200, "itau", "moradia", { compartilhado: true }],
  [14, "2026-09-13", "iFood", "iFood", -39.9, "nucc", "delivery"],
  [15, "2026-09-12", "Apple · iPhone 15", "Apple", -499.9, "itaucc", "compras", { parcela: { atual: 5, total: 12 } }],
  [16, "2026-09-10", "Enel · energia", "Enel", -187.4, "itau", "moradia", { compartilhado: true }],
  [17, "2026-09-08", "iFood", "iFood", -62.4, "nucc", "delivery"],
  [18, "2026-09-05", "Salário · Empresa Aurora Ltda", "Empresa Aurora", 7800, "itau", "salario"],
  [19, "2026-09-05", "Cinemark", "Cinemark", -64, "nucc", "lazer"],
  [20, "2026-09-03", "iFood", "iFood", -46.8, "nucc", "delivery"],
  [21, "2026-09-02", "Posto Shell", "Posto Shell", -210, "itaucc", "transporte"],
  [22, "2026-09-01", "Smart Fit", "Smart Fit", -119.9, "nucc", "saude"],
];

/** Totais dos meses anteriores (do protótipo) — viram lançamentos sintéticos. */
const HIST = [
  { ym: "2026-04", r: 7800, d: 6120, cat: { delivery: 240, mercado: 980, transporte: 420, lazer: 260, moradia: 2380 } },
  { ym: "2026-05", r: 7800, d: 6890, cat: { delivery: 265, mercado: 1105, transporte: 380, lazer: 340, moradia: 2390 } },
  { ym: "2026-06", r: 8350, d: 5980, cat: { delivery: 198, mercado: 870, transporte: 455, lazer: 180, moradia: 2375 } },
  { ym: "2026-07", r: 7800, d: 7420, cat: { delivery: 310, mercado: 1240, transporte: 510, lazer: 420, moradia: 2402 } },
  { ym: "2026-08", r: 7800, d: 6710, cat: { delivery: 210, mercado: 1010, transporte: 390, lazer: 290, moradia: 2388 } },
];

const SPLIT: Record<string, [string, string, string, number][]> = {
  // [descrição, estabelecimento, conta, fração]
  delivery: [["iFood", "iFood", "nucc", 0.45], ["Rappi", "Rappi", "nucc", 0.25], ["iFood", "iFood", "nucc", 0.3]],
  mercado: [["Pão de Açúcar", "Pão de Açúcar", "itaucc", 0.55], ["Carrefour", "Carrefour", "itaucc", 0.35], ["Feira de domingo", "Feira", "dinheiro", 0.1]],
  transporte: [["Posto Shell", "Posto Shell", "itaucc", 0.6], ["Uber", "Uber", "nucc", 0.25], ["99", "99", "nucc", 0.15]],
  lazer: [["Cinemark", "Cinemark", "nucc", 0.4], ["Bar do Zé", "Bar do Zé", "nucc", 0.6]],
};

function historico(): Lancamento[] {
  const out: Lancamento[] = [];
  let n = 1000;
  const add = (data: string, descricao: string, est: string, valor: number, contaId: string, categoriaId: string, extra: Partial<Lancamento> = {}) =>
    out.push({ id: `h${n++}`, data, descricaoOriginal: descricao.toUpperCase(), descricao, estabelecimento: est, valor: Math.round(valor * 100) / 100, contaId, categoriaId, origem: "exemplo", ...extra });

  HIST.forEach((h, mi) => {
    const d = (day: number) => `${h.ym}-${String(day).padStart(2, "0")}`;
    add(d(5), "Salário · Empresa Aurora Ltda", "Empresa Aurora", 7800, "itau", "salario");
    if (h.r > 7800) add(d(18), "Pix recebido · Freela site", "Estúdio Ponto", h.r - 7800, "nuconta", "salario");
    add(d(15), "Aluguel", "Imobiliária Lar", -2200, "itau", "moradia", { compartilhado: true });
    add(d(10), "Enel · energia", "Enel", -(h.cat.moradia - 2200), "itau", "moradia", { compartilhado: true });
    let used = h.cat.moradia;
    for (const k of ["delivery", "mercado", "transporte", "lazer"] as const) {
      const total = h.cat[k];
      SPLIT[k].forEach(([desc, est, conta, f], i) => add(d(3 + i * 8 + (mi % 3)), desc, est, -total * f, conta, k));
      used += total;
    }
    add(d(18), "Netflix", "Netflix", -55.9, "nucc", "assinaturas");
    add(d(14), "Spotify", "Spotify", -21.9, "nucc", "assinaturas");
    add(d(1), "Smart Fit", "Smart Fit", -119.9, "nucc", "saude");
    used += 55.9 + 21.9 + 119.9;
    // parcelas já em andamento
    if (h.ym >= "2026-05") { add(d(12), "Apple · iPhone 15", "Apple", -499.9, "itaucc", "compras", { parcela: { atual: mi, total: 12 } }); used += 499.9; }
    if (h.ym >= "2026-07") { add(d(21), "Magazine Luiza · Air fryer", "Magalu", -189.9, "nucc", "casa", { parcela: { atual: mi - 2, total: 10 } }); used += 189.9; }
    const rest = h.d - used;
    add(d(20), "Drogasil", "Drogasil", -rest * 0.3, "nucc", "saude");
    add(d(24), "Amazon", "Amazon", -rest * 0.4, "itaucc", "compras");
    add(d(27), "Leroy Merlin", "Leroy Merlin", -rest * 0.3, "itaucc", "casa");
    add(d(20), "Pagamento fatura Nubank", "", -2100 - mi * 57, "itau", "", { tipo: "fatura", categoriaId: undefined });
  });
  return out;
}

export function seedState(): DataState {
  const set: Lancamento[] = SETEMBRO.map(([id, data, descricao, est, valor, contaId, cat, extra]) => ({
    id: String(id), data, descricaoOriginal: descricao.toUpperCase(), descricao, estabelecimento: est, valor, contaId,
    categoriaId: cat || undefined, origem: "exemplo", ...extra,
  }));
  return {
    version: 1,
    nome: "Rafa",
    categorias: CATEGORIAS,
    contas: CONTAS,
    lancamentos: [...set, ...historico()],
    regras: [
      { id: "r1", estabelecimento: "iFood", categoriaId: "delivery", origem: "Criada em 02/07 ao revisar importação" },
      { id: "r2", estabelecimento: "Uber", categoriaId: "transporte", origem: "Criada em 02/07 ao revisar importação" },
      { id: "r3", estabelecimento: "Netflix", categoriaId: "assinaturas", origem: "Criada em 14/07" },
      { id: "r4", estabelecimento: "Spotify", categoriaId: "assinaturas", origem: "Criada em 14/07" },
    ],
    orcamentos: { mercado: 1200, delivery: 350, transporte: 500, moradia: 2600, lazer: 300, saude: 250, assinaturas: 120, compras: 600, casa: 300 },
    importacoes: [
      { id: "i1", arquivo: "fatura-nubank-ago-2026.pdf", contaId: "nucc", data: "2026-09-20", total: 47, ignorados: 0 },
      { id: "i2", arquivo: "extrato-itau-ago.ofx", contaId: "itau", data: "2026-09-20", total: 18, ignorados: 0 },
      { id: "i3", arquivo: "fatura-itau-click-ago.csv", contaId: "itaucc", data: "2026-09-12", total: 9, ignorados: 0 },
    ],
    prefs: { budget: true, thr: 80, fatura: true, pix: true, dup: true, weekly: false, tema: "sistema", confStyle: "medidor" },
    grupo: {
      nome: "Apê Vila Madalena",
      parceiro: { nome: "Ana Ribeiro", iniciais: "AR", entrouEm: "02/07" },
      split: 50,
      convites: [],
      gastosParceiro: [
        { id: "a1", data: "2026-09-19", descricao: "Sacolão São Jorge", valor: 88 },
        { id: "a2", data: "2026-09-14", descricao: "Vivo Fibra", valor: 119.9 },
      ],
    },
  };
}
