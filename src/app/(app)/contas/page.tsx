"use client";

import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { PageHead } from "@/components/ui";
import { diasAte, parcelasAtivas, periodo } from "@/lib/derive";
import { addMonths, brl, brl0, fmtD, monLabel } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function Contas() {
  const { data, hoje, setImp, resetImp } = useApp();
  const router = useRouter();
  const { ym } = periodo(hoje);
  const contas = data.contas.filter((c) => c.tipo === "conta");
  const cartoes = data.contas.filter((c) => c.tipo === "cartao");
  const total = contas.reduce((a, c) => a + (c.saldo ?? 0), 0);

  const ativas = parcelasAtivas(data, ym);
  const proj = Array.from({ length: 6 }, (_, i) => {
    const k = i + 1;
    const v = ativas.reduce((a, p) => a + (p.restantes >= k ? p.porMes : 0), 0);
    return { m: monLabel(addMonths(ym, k)), v };
  });
  const pmx = Math.max(1, ...proj.map((p) => p.v));
  const projTotal = ativas.reduce((a, p) => a + p.restantes * p.porMes, 0);
  const nomeConta = (id: string) => data.contas.find((c) => c.id === id)?.nome ?? "—";

  return (
    <>
      <PageHead kicker={`Saldo total ${brl(total)}`} title="Contas e cartões" />

      <h5 style={{ margin: "0 0 10px" }}>Contas</h5>
      <div className="grid-cards" style={{ ["--min" as string]: "220px", marginBottom: 32 }}>
        {contas.map((c) => (
          <div key={c.id} className="card" style={{ padding: 18, display: "grid", gap: 4 }}>
            <div style={{ fontWeight: 600 }}>{c.nome}</div>
            <div style={{ fontSize: 12 }} className="muted">{c.sub}</div>
            <div className="big-num" style={{ marginTop: 8 }}>{brl(c.saldo ?? 0)}</div>
            <div style={{ fontSize: 12 }} className="muted">{c.ultimoExtrato?.startsWith("Atualizado") ? c.ultimoExtrato : `Último extrato: ${c.ultimoExtrato ?? "—"}`}</div>
          </div>
        ))}
      </div>

      <h5 style={{ margin: "0 0 10px" }}>Cartões de crédito</h5>
      <div className="grid-cards" style={{ ["--min" as string]: "280px", marginBottom: 32 }}>
        {cartoes.map((c) => {
          const dias = diasAte(c, hoje);
          const fatura = c.faturaAtual ?? 0, limite = c.limite ?? 0;
          return (
            <div key={c.id} className="card" style={{ padding: 18, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                <div style={{ marginRight: "auto" }}><div style={{ fontWeight: 600 }}>{c.nome}</div><div style={{ fontSize: 12 }} className="muted">{c.sub}</div></div>
                {c.vencimento && <span className={dias >= 0 && dias <= 10 ? "tag tag-accent" : "tag tag-neutral"}>Vence {fmtD(c.vencimento)}</span>}
              </div>
              <div>
                <div style={{ fontSize: 12 }} className="muted">Fatura atual{c.fechamento ? ` · fecha ${fmtD(c.fechamento)}` : ""}</div>
                <div className="big-num">{brl(fatura)}</div>
              </div>
              <div className="bar" style={{ height: 6 }}><div className="fill" style={{ width: `${limite ? (fatura / limite) * 100 : 0}%`, background: "var(--color-text)" }} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }} className="muted">
                <span>{brl0(limite - fatura)} disponível</span><span>Limite {brl0(limite)}</span>
              </div>
              <button className="btn btn-secondary" style={{ justifyContent: "flex-start" }}
                onClick={() => { resetImp(); setImp({ dest: c.id }); router.push("/importar"); }}>
                <Upload size={16} />Importar fatura
              </button>
            </div>
          );
        })}
      </div>

      <div className="section-head" style={{ justifyContent: "flex-start" }}>
        <h4 style={{ marginRight: "auto" }}>Parcelas nas próximas faturas</h4>
        <span className="num" style={{ fontSize: 13 }}>{brl(projTotal)} já comprometidos</span>
      </div>
      <div role="img" aria-label="Parcelas projetadas nos próximos 6 meses" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, height: 140, alignItems: "end", paddingTop: 12, borderBottom: "1px solid var(--color-divider)" }}>
        {proj.map((p) => (
          <div key={p.m} style={{ display: "flex", flexDirection: "column", justifyContent: "end", height: "100%", gap: 4, minWidth: 0 }}>
            <span className="num" style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis" }}>{brl0(p.v)}</span>
            {p.v > 0 && <div style={{ height: `${(p.v / pmx) * 75}%`, borderRadius: "8px 8px 3px 3px", background: "var(--color-accent-100)", border: "1.5px dashed var(--color-accent)" }} />}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, paddingTop: 6, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
        {proj.map((p) => <span key={p.m}>{p.m}</span>)}
      </div>
      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="table">
          <thead><tr><th>Compra</th><th>Parcela</th><th style={{ textAlign: "right" }}>Por mês</th><th style={{ textAlign: "right" }}>Falta pagar</th></tr></thead>
          <tbody>
            {ativas.map(({ t, restantes, porMes }) => (
              <tr key={t.id}>
                <td><div style={{ fontWeight: 600 }}>{t.descricao}</div><div style={{ fontSize: 12 }} className="muted">{nomeConta(t.contaId)} · termina em {monLabel(addMonths(ym, restantes), true)}</div></td>
                <td><span className="tag tag-outline">{t.parcela!.atual}/{t.parcela!.total}</span></td>
                <td className="num" style={{ textAlign: "right" }}>{brl(porMes)}</td>
                <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{brl(porMes * restantes)}</td>
              </tr>
            ))}
            {ativas.length === 0 && <tr><td colSpan={4} className="muted">Nenhuma compra parcelada em andamento.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
