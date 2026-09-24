"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FormError, Input } from "@/components/ui/form";
import { Card, Kicker } from "@/components/ui/layout";

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
        body: JSON.stringify(
          cadastro ? { nome, email, senha, exemplo } : { email, senha },
        ),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErro(j.erro ?? "Algo deu errado. Tente de novo.");
        return;
      }
      const volta = new URLSearchParams(location.search).get("volta");
      // Navegação completa: o proxy precisa ver o cookie novo.
      window.location.href =
        volta?.startsWith("/") && !volta.startsWith("//") ? volta : "/";
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  };

  const incompleto =
    !email || !senha || (cadastro && (!nome.trim() || senha.length < 8));

  return (
    <Card>
      <form className="grid gap-3.5" onSubmit={enviar} noValidate>
        <div>
          <Kicker>{cadastro ? "Criar conta" : "Bem-vindo de volta"}</Kicker>
          <h1 className="mt-1 text-3xl">
            {cadastro ? "Comece sua caderneta" : "Entrar"}
          </h1>
        </div>
        {cadastro && (
          <Field label="Como podemos te chamar?" htmlFor="nome">
            <Input
              id="nome"
              autoComplete="given-name"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </Field>
        )}
        <Field label="E-mail" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field
          label="Senha"
          htmlFor="senha"
          hint={cadastro && "Pelo menos 8 caracteres."}
          hintId="senha-dica"
        >
          <Input
            id="senha"
            type="password"
            autoComplete={cadastro ? "new-password" : "current-password"}
            required
            minLength={cadastro ? 8 : undefined}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-describedby={cadastro ? "senha-dica" : undefined}
          />
        </Field>
        {cadastro && (
          <Checkbox
            className="min-h-0"
            checked={exemplo}
            onChange={() => setExemplo(!exemplo)}
          >
            Começar com dados de exemplo para explorar
          </Checkbox>
        )}
        {erro && <FormError>{erro}</FormError>}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          block
          disabled={enviando || incompleto}
        >
          {enviando ? "Aguarde…" : cadastro ? "Criar conta" : "Entrar"}
          <ArrowRight size={16} />
        </Button>
        <div className="text-center text-md text-neutral-700">
          {cadastro ? (
            <>
              Já tem conta? <Link href="/entrar">Entrar</Link>
            </>
          ) : (
            <>
              Ainda não tem conta? <Link href="/cadastro">Criar conta</Link>
            </>
          )}
        </div>
      </form>
    </Card>
  );
}
