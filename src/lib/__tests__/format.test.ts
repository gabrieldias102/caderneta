import { describe, expect, it } from "vitest";
import { maskValorBR, parseValorBR, proximoDia } from "../format";

describe("maskValorBR", () => {
  it("preenche pelos centavos e põe ponto de milhar e vírgula", () => {
    expect(maskValorBR("1")).toBe("0,01");
    expect(maskValorBR("123")).toBe("1,23");
    expect(maskValorBR("123456")).toBe("1.234,56");
    expect(maskValorBR("123456789")).toBe("1.234.567,89");
  });

  it("ignora o que não é dígito e zeros à esquerda", () => {
    expect(maskValorBR("1.234,567")).toBe("12.345,67");
    expect(maskValorBR("0,05")).toBe("0,05");
    expect(maskValorBR("R$ abc")).toBe("");
    expect(maskValorBR("000")).toBe("");
  });

  it("devolve texto que o parseValorBR entende", () => {
    expect(parseValorBR(maskValorBR("123456"))).toBe(1234.56);
  });
});

describe("proximoDia", () => {
  it("usa o mês atual quando o dia ainda não passou", () => {
    expect(proximoDia("2026-09-24", 25)).toBe("2026-09-25");
    expect(proximoDia("2026-09-24", 24)).toBe("2026-09-24");
  });
  it("pula para o mês seguinte quando o dia já passou", () => {
    expect(proximoDia("2026-09-24", 2)).toBe("2026-10-02");
    expect(proximoDia("2026-12-20", 5)).toBe("2027-01-05");
  });
  it("limita ao último dia do mês", () => {
    expect(proximoDia("2026-02-10", 31)).toBe("2026-02-28");
  });
});
