import type { ReactNode } from "react";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader, Section, SectionHeader } from "@/components/ui/layout";
import { CONTATO } from "@/lib/contato";

interface Topico {
  id: string;
  titulo: string;
  resumo: ReactNode;
  passos?: ReactNode[];
  dicas?: ReactNode[];
}

const Tela = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="font-semibold text-fg">
    {children}
  </Link>
);

const TOPICOS: Topico[] = [
  {
    id: "comecar",
    titulo: "Primeiros passos",
    resumo:
      "A Caderneta junta suas contas e cartões num lugar só e mostra para onde o dinheiro está indo.",
    passos: [
      <>
        Cadastre seus bancos em <Tela href="/contas">Contas e cartões</Tela>.
        Nos cartões, informe o dia do fechamento e do vencimento.
      </>,
      <>
        Traga seus gastos em <Tela href="/importar">Importar extrato</Tela> ou
        lance à mão em <Tela href="/lancamentos">Lançamentos</Tela>.
      </>,
      <>
        Defina quanto quer gastar por categoria em{" "}
        <Tela href="/orcamentos">Orçamentos</Tela>.
      </>,
    ],
    dicas: [
      <>
        Quer só conhecer o app? Em{" "}
        <Tela href="/configuracoes">Configurações › Conta</Tela>, “Carregar
        exemplo” preenche tudo com dados fictícios. Atenção: isso apaga os seus
        dados atuais.
      </>,
    ],
  },
  {
    id: "importar",
    titulo: "Importar extrato ou fatura",
    resumo:
      "Envie o arquivo do banco e o app lê os lançamentos, sugere categorias e evita duplicatas.",
    passos: [
      <>
        Baixe no app ou site do banco o extrato ou a fatura em PDF, OFX ou CSV
        (até 10 MB).
      </>,
      <>
        Em <Tela href="/importar">Importar extrato</Tela>, arraste o arquivo ou
        toque em “Escolher arquivo” e confirme a conta de destino.
      </>,
      <>
        Revise a lista: dá para filtrar o que precisa de revisão ou está
        duplicado, selecionar vários itens e mudar a categoria de uma vez.
      </>,
      <>Confirme para gravar os lançamentos.</>,
    ],
    dicas: [
      "Se o banco do arquivo ainda não tiver conta cadastrada, o app oferece criá-la na hora.",
      "Pagamento de fatura e transferência entre suas próprias contas não contam como despesa.",
      "Compras parceladas geram as parcelas das próximas faturas automaticamente.",
      "Lançamentos que já vieram em outro arquivo aparecem marcados como duplicata.",
    ],
  },
  {
    id: "lancamentos",
    titulo: "Lançamentos",
    resumo: "Todos os gastos e receitas, agrupados por dia.",
    passos: [
      <>
        Use a busca (estabelecimento, pessoa ou valor) e os filtros de conta,
        categoria e período.
      </>,
      <>
        Para lançar à mão, use “Novo lançamento” (conta ou cartão) ou “Gasto em
        dinheiro”. No celular, os botões ficam no rodapé da tela.
      </>,
      <>
        Toque num lançamento para ver os detalhes, trocar a categoria ou
        marcá-lo como compartilhado.
      </>,
    ],
  },
  {
    id: "categorias",
    titulo: "Categorias e regras",
    resumo:
      "Regras fazem o app lembrar suas escolhas: da próxima vez, o mesmo estabelecimento já vem na categoria certa.",
    passos: [
      <>
        Crie categorias em{" "}
        <Tela href="/configuracoes">Configurações › Categorias</Tela>.
      </>,
      <>
        Ao corrigir a categoria de um lançamento, escolha “aplicar sempre” para
        criar uma regra.
      </>,
      <>
        Veja e exclua regras em{" "}
        <Tela href="/configuracoes">Configurações › Regras</Tela>.
      </>,
    ],
  },
  {
    id: "orcamentos",
    titulo: "Orçamentos",
    resumo: "Um limite mensal de gasto por categoria.",
    passos: [
      <>
        Abra <Tela href="/orcamentos">Orçamentos</Tela> e toque em “Editar
        limites”.
      </>,
      <>
        Digite o valor no campo “Limite R$” das categorias que quer acompanhar.
        Deixe em branco para ficar sem limite.
      </>,
      <>Toque em “Concluir”. Tudo é salvo automaticamente.</>,
    ],
    dicas: [
      "A linha vertical na barra geral marca quanto do mês já passou: gasto à esquerda dela significa que você está no ritmo.",
      "O traço fino em cada categoria marca o ponto de aviso, que você ajusta em Configurações › Alertas.",
    ],
  },
  {
    id: "relatorios",
    titulo: "Relatórios",
    resumo: (
      <>
        Em <Tela href="/relatorios">Relatórios</Tela> você vê receitas e
        despesas dos últimos 6 meses, a evolução de cada categoria, os
        estabelecimentos onde mais gastou e um resumo do mês escrito por IA.
      </>
    ),
  },
  {
    id: "compartilhadas",
    titulo: "Contas compartilhadas",
    resumo:
      "Para dividir gastos com quem mora com você e saber quem deve quanto.",
    passos: [
      <>
        Em <Tela href="/compartilhadas">Compartilhadas</Tela>, dê um nome ao
        grupo e convide a pessoa por e-mail ou celular.
      </>,
      <>
        Marque os lançamentos que são da casa como compartilhados (no detalhe do
        lançamento).
      </>,
      <>
        Acompanhe o saldo em “Quem deve quanto” e registre o acerto quando
        pagarem.
      </>,
    ],
  },
  {
    id: "alertas",
    titulo: "Alertas",
    resumo: (
      <>
        Em <Tela href="/configuracoes">Configurações › Alertas</Tela> você
        escolhe quando ser avisado: orçamento perto do limite, fatura perto do
        vencimento, Pix para pessoa física sem categoria, duplicatas na
        importação e o resumo semanal por IA. Os avisos aparecem no Início.
      </>
    ),
  },
  {
    id: "privacidade",
    titulo: "Privacidade e seus dados",
    resumo: "Você controla o que aparece na tela e o que fica guardado.",
    dicas: [
      "O ícone de olho no topo esconde os valores, útil para usar o app em público. A escolha vale só para o aparelho em que você está.",
      "Em Configurações › Conta você exporta todos os seus dados num arquivo ou exclui a conta de vez.",
    ],
  },
];

export default function Ajuda() {
  return (
    <>
      <PageHeader kicker="Como usar a Caderneta" title="Ajuda" />

      <nav aria-label="Tópicos" className="mb-5 flex max-w-180 flex-wrap gap-2">
        {TOPICOS.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            className={buttonVariants({ variant: "ghost" })}
          >
            {t.titulo}
          </a>
        ))}
      </nav>

      <div className="grid max-w-180 gap-4">
        {TOPICOS.map((t) => (
          <Section key={t.id} id={t.id} className="scroll-mt-20">
            <SectionHeader title={t.titulo} />
            <div className="grid gap-3 pt-3 text-md">
              <p>{t.resumo}</p>
              {t.passos && (
                <ol className="grid list-decimal gap-1.5 pl-5">
                  {t.passos.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
              )}
              {t.dicas && (
                <ul className="grid list-disc gap-1.5 pl-5 text-sm text-neutral-700">
                  {t.dicas.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </Section>
        ))}

        <Section id="contato" className="scroll-mt-20">
          <SectionHeader title="Ainda com dúvida?" />
          <p className="pt-3 text-md">
            Fale comigo. Respondo dúvidas, sugestões e problemas.
          </p>
          <div className="flex flex-wrap gap-2 pt-3">
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
        </Section>
      </div>
    </>
  );
}
