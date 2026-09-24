export type ISODate = string; // 'YYYY-MM-DD'

export interface Categoria {
  id: string;
  nome: string;
}

export interface Conta {
  id: string;
  nome: string;
  tipo: "conta" | "cartao";
  sub: string;
  /** Palavras que identificam o banco em nomes de arquivo / cabeçalhos. */
  banco?: string;
  saldo?: number;
  ultimoExtrato?: string;
  limite?: number;
  faturaAtual?: number;
  fechamento?: ISODate;
  vencimento?: ISODate;
}

export interface Parcela {
  atual: number;
  total: number;
}

export interface Lancamento {
  id: string;
  data: ISODate;
  descricaoOriginal: string;
  /** Texto mostrado na lista. */
  descricao: string;
  /** Estabelecimento normalizado ("iFood", "Uber"…). Vazio para neutros. */
  estabelecimento: string;
  /** Negativo = saída. */
  valor: number;
  contaId: string;
  categoriaId?: string;
  /** Movimentações neutras: não entram em despesas, saldo, orçamentos nem relatórios. */
  tipo?: "fatura" | "transferencia";
  pix?: { pessoaFisica: boolean };
  parcela?: Parcela;
  compartilhado?: boolean;
  importacaoId?: string;
  origem: "arquivo" | "manual" | "exemplo";
}

export interface Regra {
  id: string;
  estabelecimento: string;
  categoriaId: string;
  origem: string;
}

export interface Importacao {
  id: string;
  arquivo: string;
  contaId: string;
  data: ISODate;
  total: number;
  ignorados: number;
}

export type Confianca =
  "voce" | "regra" | "alta" | "media" | "baixa" | "nenhuma";

export interface ItemRevisao {
  k: string;
  data: ISODate;
  descricaoOriginal: string;
  estabelecimento: string;
  valor: number;
  categoriaId: string;
  confianca: number;
  porRegra: boolean;
  editado: boolean;
  ignorado: boolean;
  tipo?: "fatura" | "transferencia";
  pix?: { pessoaFisica: boolean };
  parcela?: Parcela;
  /** Data (dd/mm) do lançamento que parece ser o mesmo. */
  duplicataDe?: string;
}

export interface GastoParceiro {
  id: string;
  data: ISODate;
  descricao: string;
  valor: number;
}

export interface Prefs {
  budget: boolean;
  thr: number;
  fatura: boolean;
  pix: boolean;
  dup: boolean;
  weekly: boolean;
  tema: "sistema" | "claro" | "escuro";
  confStyle: "medidor" | "porcentagem";
}

export interface Grupo {
  nome: string;
  parceiro: { nome: string; iniciais: string; entrouEm: string };
  split: number;
  acertadoEm?: ISODate;
  convites: string[];
  gastosParceiro: GastoParceiro[];
}

export interface DataState {
  version: number;
  nome: string;
  /** Só leitura: vem da conta do usuário. */
  email?: string;
  categorias: Categoria[];
  contas: Conta[];
  lancamentos: Lancamento[];
  regras: Regra[];
  orcamentos: Record<string, number>;
  importacoes: Importacao[];
  prefs: Prefs;
  /** Grupo de contas compartilhadas; ausente até o usuário criar um. */
  grupo?: Grupo;
  resumoIA?: { mes: string; texto: string };
}
