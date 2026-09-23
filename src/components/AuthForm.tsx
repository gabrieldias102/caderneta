"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, TriangleAlert } from "lucide-react";

type Modo = "entrar" | "cadastro";

export function AuthForm({ modo }: { modo: Modo }) {
  const cadastro = modo === "cadastro";
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [exemplo, setExemplo] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch(`/api/auth/${modo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cadastro ? { nome, email, senha, exemplo } : { email, senha }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErro(j.erro ?? "Algo deu errado. Tente de novo.");
        return;
      }
      const volta = new URLSearchParams(location.search).get("volta");
      // Navegação completa: o proxy precisa ver o cookie novo.
      window.location.href = volta?.startsWith("/") && !volta.startsWith("//") ? volta : "/";
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="card" onSubmit={enviar} style={{ display: "grid", gap: 14 }} noValidate>
      <div>
        <div className="kicker">{cadastro ? "Criar conta" : "Bem-vindo de volta"}</div>
        <h1 style={{ margin: "4px 0 0", fontSize: 28 }}>{cadastro ? "Comece sua caderneta" : "Entrar"}</h1>
      </div>
      {cadastro && (
        <div className="field">
          <label htmlFor="nome">Como podemos te chamar?</label>
          <input id="nome" className="input" autoComplete="given-name" required value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
      )}
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input id="email" className="input" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="senha">Senha</label>
        <input id="senha" className="input" type="password" autoComplete={cadastro ? "new-password" : "current-password"} required minLength={cadastro ? 8 : undefined}
          value={senha} onChange={(e) => setSenha(e.target.value)} aria-describedby={cadastro ? "senha-dica" : undefined} />
        {cadastro && <span id="senha-dica" className="muted" style={{ fontSize: 12 }}>Pelo menos 8 caracteres.</span>}
      </div>
      {cadastro && (
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={exemplo} onChange={() => setExemplo(!exemplo)} />
          Começar com dados de exemplo para explorar
        </label>
      )}
      {erro && (
        <div role="alert" style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--color-accent-700)" }}>
          <TriangleAlert size={16} style={{ flex: "none", marginTop: 2 }} />{erro}
        </div>
      )}
      <button className="btn btn-primary btn-block" style={{ minHeight: 48, fontSize: 15 }}
        disabled={enviando || !email || !senha || (cadastro && (!nome.trim() || senha.length < 8))}>
        {enviando ? "Aguarde…" : cadastro ? "Criar conta" : "Entrar"}<ArrowRight size={16} />
      </button>
      <div style={{ fontSize: 14, textAlign: "center" }} className="muted">
        {cadastro ? <>Já tem conta? <Link href="/entrar">Entrar</Link></> : <>Ainda não tem conta? <Link href="/cadastro">Criar conta</Link></>}
      </div>
    </form>
  );
}
