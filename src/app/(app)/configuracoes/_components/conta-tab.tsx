"use client";

import { useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { FormError, Input } from "@/components/ui/form";
import { CONTATO } from "@/lib/contato";
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
        description="Claro, escuro ou igual ao do aparelho"
      >
        <Segmented
          name="tema"
          value={p.tema}
          onChange={(v) => setPrefs({ tema: v })}
          options={[
            ["sistema", "Sistema"],
            ["claro", "Claro"],
            ["escuro", "Escuro"],
          ]}
        />
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
