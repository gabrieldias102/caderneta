"use client";

import { useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { FormError, Input } from "@/components/ui/form";
import { CONTATO } from "@/lib/contato";
import { PALETAS } from "@/lib/paletas";
import { useApp } from "@/lib/store";
import { SettingList, SettingRow } from "./setting-row";

export function ContaTab() {
  const { data, setPrefs, flash, resetDemo, sair, exportar } = useApp();
  const p = data.prefs;

  const carregarExemplo = async () => {
    if (
      !confirm(
        "Carregar os dados de exemplo? Todos os seus dados atuais serão apagados.",
      )
    )
      return;
    try {
      await resetDemo();
      flash("Dados de exemplo carregados");
    } catch {
      flash("Não foi possível carregar agora");
    }
  };

  return (
    <SettingList>
      <SettingRow
        title="Tema"
        description="Claro, escuro, igual ao do aparelho ou uma das outras paletas"
      >
        <Segmented
          name="tema"
          value={p.tema}
          onChange={(v) => setPrefs({ tema: v })}
          options={[
            ["sistema", "Sistema"],
            ["claro", "Claro"],
            ["escuro", "Escuro"],
            ["paleta", "Outras paletas"],
          ]}
        />
        {p.tema === "paleta" && (
          <div
            role="radiogroup"
            aria-label="Paleta"
            className="grid grid-cols-4 gap-1.5 sm:gap-2"
          >
            {PALETAS.map((pl) => (
              <label
                key={pl.id}
                className="grid cursor-pointer gap-2 rounded-md border border-divider bg-card p-1.5 hover:bg-surface has-checked:border-accent has-checked:outline-2 has-checked:-outline-offset-1 has-checked:outline-accent has-focus-visible:outline-2 has-focus-visible:outline-accent sm:p-2.5"
              >
                <input
                  type="radio"
                  name="paleta"
                  className="sr-only"
                  checked={p.paleta === pl.id}
                  onChange={() => setPrefs({ paleta: pl.id })}
                />
                <span
                  aria-hidden
                  className="flex h-10 items-end gap-1 rounded-sm p-1.5 sm:h-12 sm:gap-1.5 sm:p-2"
                  style={{ background: pl.amostra.bg }}
                >
                  <span
                    className="h-full flex-1 rounded"
                    style={{ background: pl.amostra.card }}
                  />
                  <span
                    className="h-3/5 w-3 rounded sm:w-5"
                    style={{ background: pl.amostra.accent }}
                  />
                </span>
                <span className="text-xs leading-tight sm:text-sm">
                  <span className="block font-semibold whitespace-nowrap">
                    {pl.nome}
                  </span>
                  <span className="text-xs text-neutral-700">
                    {pl.modo === "claro" ? "Clara" : "Escura"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </SettingRow>
      <SettingRow
        title="Confiança na importação"
        description="Como mostrar a certeza da categoria sugerida"
      >
        <Segmented
          name="conf"
          value={p.confStyle}
          onChange={(v) => setPrefs({ confStyle: v })}
          options={[
            ["medidor", "Medidor"],
            ["porcentagem", "Porcentagem"],
          ]}
        />
      </SettingRow>
      <SettingRow
        title="Dados de exemplo"
        description="Substitui todos os seus lançamentos, contas e regras pelos dados de exemplo."
        action={<Button onClick={carregarExemplo}>Carregar exemplo</Button>}
      />
      <SettingRow
        title={data.nome}
        description={<span className="block truncate">{data.email}</span>}
        action={<Button onClick={sair}>Sair</Button>}
      />
      <SettingRow
        title="Exportar meus dados"
        description="Baixa lançamentos, contas, regras e preferências num arquivo JSON."
        action={<Button onClick={exportar}>Exportar</Button>}
      />
      <ExcluirConta />
      <SettingRow
        title="Fale comigo"
        description="Dúvidas, sugestões ou algo que não funcionou? Mande uma mensagem."
      >
        <div className="flex flex-wrap gap-2">
          <a href={`mailto:${CONTATO.email}`} className={buttonVariants()}>
            <Mail size={18} />
            {CONTATO.email}
          </a>
          <a
            href={CONTATO.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants()}
          >
            <MessageCircle size={18} />
            WhatsApp {CONTATO.telefone}
          </a>
        </div>
      </SettingRow>
    </SettingList>
  );
}

/** Exclusão da conta, confirmada com a senha. */
function ExcluirConta() {
  const { excluirConta } = useApp();
  const [form, setForm] = useState<{
    senha: string;
    erro?: string;
    ocupado?: boolean;
  } | null>(null);

  return (
    <SettingRow
      title="Excluir conta"
      description="Apaga a conta e todos os dados no servidor. Não dá para desfazer."
      action={
        !form && (
          <Button onClick={() => setForm({ senha: "" })}>Excluir conta</Button>
        )
      }
    >
      {form && (
        <form
          className="grid gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setForm({ ...form, erro: undefined, ocupado: true });
            const erro = await excluirConta(form.senha);
            if (erro) setForm({ senha: "", erro });
          }}
        >
          <label htmlFor="senha-excluir" className="text-sm">
            Para confirmar, digite sua senha. Se quiser guardar uma cópia,
            exporte os dados antes.
          </label>
          <Input
            id="senha-excluir"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            aria-invalid={!!form.erro}
            aria-describedby={form.erro ? "erro-excluir" : undefined}
          />
          {form.erro && (
            <FormError id="erro-excluir" icon={false}>
              {form.erro}
            </FormError>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setForm(null)}
              disabled={form.ocupado}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!form.senha || form.ocupado}
            >
              {form.ocupado ? "Excluindo…" : "Excluir definitivamente"}
            </Button>
          </div>
        </form>
      )}
    </SettingRow>
  );
}
