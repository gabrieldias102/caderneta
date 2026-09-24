import { describe, expect, it } from "vitest";
import { seedState } from "../seed";
import { diffState, mergePayload } from "../sync";

describe("diffState", () => {
  const a = seedState();

  it("não gera nada quando o estado não muda", () => {
    expect(diffState(a, a)).toBeNull();
    expect(diffState(a, { ...a })).toBeNull();
  });

  it("envia só o lançamento alterado", () => {
    const b = {
      ...a,
      lancamentos: a.lancamentos.map((t) =>
        t.id === "2" ? { ...t, categoriaId: "presentes" } : t,
      ),
    };
    const d = diffState(a, b)!;
    expect(d.lancamentos?.upsert).toHaveLength(1);
    expect(d.lancamentos?.upsert?.[0]).toMatchObject({
      id: "2",
      categoriaId: "presentes",
    });
    expect(Object.keys(d)).toEqual(["lancamentos"]);
  });

  it("detecta inclusão, exclusão e ordem de categorias", () => {
    const b = {
      ...a,
      categorias: [...a.categorias.slice(1), { id: "pets", nome: "Pets" }],
    };
    const d = diffState(a, b)!;
    expect(d.categorias?.delete).toEqual(["mercado"]);
    expect(d.categorias?.upsert?.find((c) => c.id === "pets")).toMatchObject({
      ordem: b.categorias.length - 1,
    });
  });

  it("orçamento zerado vira exclusão", () => {
    const b = { ...a, orcamentos: { ...a.orcamentos, casa: 0, lazer: 450 } };
    expect(diffState(a, b)!.orcamentos).toEqual({
      upsert: [{ categoriaId: "lazer", limite: 450 }],
      delete: ["casa"],
    });
  });

  it("perfil: prefs e remoção do grupo", () => {
    const b = { ...a, prefs: { ...a.prefs, thr: 90 }, grupo: undefined };
    expect(diffState(a, b)!.perfil).toEqual({
      prefs: b.prefs,
      grupoRemovido: true,
    });
  });
});

describe("mergePayload", () => {
  it("o mais novo vence e exclusão cancela upsert", () => {
    const t1 = { ...seedState().lancamentos[0] };
    const m = mergePayload(
      {
        lancamentos: { upsert: [{ ...t1, descricao: "A" }] },
        perfil: { nome: "X" },
      },
      {
        lancamentos: { upsert: [{ ...t1, descricao: "B" }] },
        perfil: { prefs: seedState().prefs },
      },
    );
    expect(m.lancamentos?.upsert?.map((x) => x.descricao)).toEqual(["B"]);
    expect(m.perfil).toMatchObject({ nome: "X" });
    const m2 = mergePayload(m, { lancamentos: { delete: [t1.id] } });
    expect(m2.lancamentos).toEqual({ upsert: [], delete: [t1.id] });
  });
});
