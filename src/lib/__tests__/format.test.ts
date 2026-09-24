import { describe, expect, it } from "vitest";
import { maskValorBR, parseValorBR } from "../format";

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
