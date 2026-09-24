import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseValorBR } from "../format";
import { detectar } from "../import/normalize";
import { parseCSV, parseOFX, parsePDFText } from "../import/parsers";
import {
  ajustarSinal,
  montarRevisao,
  nivelConfianca,
  precisaRevisao,
} from "../import/pipeline";
import { seedState } from "../seed";

const exemplo = (n: string) => readFileSync(`public/exemplos/${n}`, "utf8");

describe("parseValorBR", () => {
  it.each([
    ["1.234,56", 1234.56],
    ["-58,90", -58.9],
    ["R$ 25", 25],
    ["(12,50)", -12.5],
    ["1234.56", 1234.56],
    ["1.000", 1000],
    ["85,00-", -85],
  ])("%s → %d", (raw, v) => expect(parseValorBR(raw)).toBeCloseTo(v));
});

describe("detectar", () => {
  it("normaliza estabelecimentos conhecidos", () => {
    expect(detectar("IFOOD *IFOOD").estabelecimento).toBe("iFood");
    expect(detectar("UBER *TRIP HELP.UBER.COM").estabelecimento).toBe("Uber");
    expect(detectar("DROGA RAIA 2231").estabelecimento).toBe("Droga Raia");
    expect(detectar("PADARIA REAL LTDA").estabelecimento).toBe("Padaria Real");
    expect(detectar("BAR DO ZE").estabelecimento).toBe("Bar do Zé");
  });
  it("detecta parcelas", () => {
    const d = detectar("MERCADOLIVRE*3PRODUTOS 02/06");
    expect(d.parcela).toEqual({ atual: 2, total: 6 });
    expect(d.estabelecimento).toBe("Mercado Livre");
    expect(detectar("LOJA X PARC 3/10").parcela).toEqual({
      atual: 3,
      total: 10,
    });
  });
  it("detecta Pix para pessoa física e para empresa", () => {
    const pf = detectar("PIX ENV CARLOS A PEREIRA");
    expect(pf.pix).toEqual({ pessoaFisica: true });
    expect(pf.estabelecimento).toBe("Carlos A. Pereira");
    expect(detectar("PIX RECEBIDO ESTUDIO PONTO LTDA").pix).toEqual({
      pessoaFisica: false,
    });
    expect(detectar("PIX TRANSF ***.123.456-** JOANA").pix?.pessoaFisica).toBe(
      true,
    );
  });
  it("marca pagamento de fatura e transferência própria como neutros", () => {
    expect(detectar("PAGAMENTO RECEBIDO").tipo).toBe("fatura");
    expect(detectar("PAGTO CARTAO NUBANK").tipo).toBe("fatura");
    expect(detectar("TRANSF ENTRE CONTAS").tipo).toBe("transferencia");
  });
});

describe("parsers", () => {
  it("lê OFX SGML", () => {
    const r = parseOFX(exemplo("extrato-itau-set.ofx"));
    expect(r.rows).toHaveLength(8);
    expect(r.rows[0]).toEqual({
      data: "2026-09-22",
      descricaoOriginal: "SABESP AGUA 09/26",
      valor: -89.9,
    });
    expect(r.cartao).toBe(false);
  });
  it("lê CSV da fatura Nubank invertendo o sinal", () => {
    const r = parseCSV(exemplo("fatura-nubank-set.csv"));
    expect(r.formato).toBe("nubank-fatura");
    expect(r.rows[0].valor).toBe(-52.3);
    expect(r.rows.at(-1)!.valor).toBe(2340.5);
  });
  it("lê CSV genérico com ; e vírgula decimal", () => {
    const r = parseCSV(exemplo("extrato.csv"));
    expect(r.rows).toHaveLength(6);
    expect(r.rows[4]).toMatchObject({ data: "2026-09-18", valor: 1000 });
  });
  it("lê linhas de texto de PDF", () => {
    const rows = parsePDFText(
      [
        "21/09 IFOOD *IFOOD 52,30",
        "Total da fatura 1.842,37",
        "08/09 PAGAMENTO RECEBIDO -2.340,50",
      ],
      { cartao: true, fallbackYear: 2026 },
    );
    expect(rows).toEqual([
      { data: "2026-09-21", descricaoOriginal: "IFOOD *IFOOD", valor: -52.3 },
      {
        data: "2026-09-08",
        descricaoOriginal: "PAGAMENTO RECEBIDO",
        valor: 2340.5,
      },
    ]);
  });
  it("inverte sinal de CSV genérico de cartão com compras positivas", () => {
    const s = seedState();
    const cartao = s.contas.find((c) => c.id === "itaucc")!;
    expect(
      ajustarSinal(
        [
          { data: "2026-09-01", descricaoOriginal: "X", valor: 10 },
          { data: "2026-09-01", descricaoOriginal: "Y", valor: 5 },
        ],
        cartao,
      )[0].valor,
    ).toBe(-10);
  });
});

describe("montarRevisao (fatura Nubank de exemplo)", () => {
  const s = seedState();
  const rows = montarRevisao(parseCSV(exemplo("fatura-nubank-set.csv")).rows, {
    contaId: "nucc",
    regras: s.regras,
    lancamentos: s.lancamentos,
    contas: s.contas,
  });
  const by = (m: string) => rows.find((r) => r.estabelecimento === m)!;

  it("aplica regras do usuário primeiro", () => {
    expect(by("iFood")).toMatchObject({
      categoriaId: "delivery",
      porRegra: true,
    });
    expect(nivelConfianca(by("Spotify"))).toBe("regra");
  });
  it("sugere Compras para Mercado Livre com confiança média", () => {
    expect(by("Mercado Livre")).toMatchObject({
      categoriaId: "compras",
      parcela: { atual: 2, total: 6 },
    });
    expect(nivelConfianca(by("Mercado Livre"))).toBe("media");
  });
  it("marca duplicatas como ignoradas", () => {
    expect(by("Netflix")).toMatchObject({
      duplicataDe: "18/09",
      ignorado: true,
    });
    expect(by("Rappi")).toMatchObject({ duplicataDe: "19/09", ignorado: true });
    expect(rows.filter((r) => r.duplicataDe)).toHaveLength(2);
  });
  it("pede revisão para Pix PF e confiança baixa", () => {
    expect(precisaRevisao(by("Carlos A. Pereira"))).toBe(true);
    expect(nivelConfianca(by("Padaria Real"))).toBe("baixa");
    // Já apareceu no histórico: a sugestão vem de lá, com confiança alta.
    expect(by("Bar do Zé")).toMatchObject({
      categoriaId: "lazer",
      porRegra: false,
    });
    expect(nivelConfianca(by("Bar do Zé"))).toBe("alta");
    expect(precisaRevisao(by("Droga Raia"))).toBe(false);
  });
  it("trata o pagamento da fatura como neutro", () => {
    const pg = rows.find((r) => r.tipo === "fatura")!;
    expect(pg.valor).toBe(2340.5);
    expect(precisaRevisao(pg)).toBe(false);
  });
});

describe("montarRevisao (extrato Itaú)", () => {
  const s = seedState();
  const rows = montarRevisao(parseOFX(exemplo("extrato-itau-set.ofx")).rows, {
    contaId: "itau",
    regras: s.regras,
    lancamentos: s.lancamentos,
    contas: s.contas,
  });
  it("casa transferência entre contas próprias", () => {
    expect(
      rows.find((r) => r.descricaoOriginal.startsWith("TED RECEBIDA"))!.tipo,
    ).toBe("transferencia");
  });
  it("reconhece o pagamento de fatura já lançado como duplicata", () => {
    expect(rows.find((r) => r.tipo === "fatura")).toMatchObject({
      duplicataDe: "20/09",
      ignorado: true,
    });
  });
});
