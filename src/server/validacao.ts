import "server-only";
import { z } from "zod";

const id = z.string().min(1).max(120);
const texto = (max = 300) => z.string().max(max);
const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const valor = z.number().finite().gt(-1e11).lt(1e11);
const ops = <T extends z.ZodType>(item: T) =>
  z
    .object({
      upsert: z.array(item).max(5000).optional(),
      delete: z.array(id).max(5000).optional(),
    })
    .optional();

export const lancamentoSchema = z.object({
  id,
  data,
  descricaoOriginal: texto(),
  descricao: texto(),
  estabelecimento: texto(),
  valor,
  contaId: id,
  categoriaId: id.optional(),
  tipo: z.enum(["fatura", "transferencia"]).optional(),
  pix: z.object({ pessoaFisica: z.boolean() }).optional(),
  parcela: z
    .object({
      atual: z.number().int().min(1).max(99),
      total: z.number().int().min(1).max(99),
    })
    .optional(),
  compartilhado: z.boolean().optional(),
  importacaoId: id.optional(),
  origem: z.enum(["arquivo", "manual", "exemplo"]),
});

export const categoriaSchema = z.object({
  id,
  nome: texto(60).min(1),
  ordem: z.number().int().optional(),
});

export const contaSchema = z.object({
  id,
  nome: texto(80).min(1),
  tipo: z.enum(["conta", "cartao"]),
  sub: texto(120),
  banco: texto(200).optional(),
  saldo: valor.optional(),
  ultimoExtrato: texto(80).optional(),
  limite: valor.optional(),
  faturaAtual: valor.optional(),
  fechamento: data.optional(),
  vencimento: data.optional(),
  ordem: z.number().int().optional(),
});

export const regraSchema = z.object({
  id,
  estabelecimento: texto(120).min(1),
  categoriaId: id,
  origem: texto(200),
});

export const importacaoSchema = z.object({
  id,
  arquivo: texto(260),
  contaId: id,
  data,
  total: z.number().int().min(0),
  ignorados: z.number().int().min(0),
});

export const prefsSchema = z.object({
  budget: z.boolean(),
  thr: z.number().int().min(1).max(100),
  fatura: z.boolean(),
  pix: z.boolean(),
  dup: z.boolean(),
  weekly: z.boolean(),
  tema: z.enum(["sistema", "claro", "escuro"]),
  confStyle: z.enum(["medidor", "porcentagem"]),
});

export const grupoSchema = z.object({
  nome: texto(80).min(1),
  parceiro: z.object({
    nome: texto(80).min(1),
    iniciais: texto(3),
    entrouEm: texto(20),
  }),
  split: z.number().int().min(0).max(100),
  acertadoEm: data.optional(),
  convites: z.array(texto(120)).max(50),
  gastosParceiro: z
    .array(z.object({ id, data, descricao: texto(), valor }))
    .max(2000),
});

export const syncSchema = z.object({
  lancamentos: ops(lancamentoSchema),
  categorias: ops(categoriaSchema),
  contas: ops(contaSchema),
  regras: ops(regraSchema),
  importacoes: ops(importacaoSchema),
  orcamentos: ops(z.object({ categoriaId: id, limite: valor.nonnegative() })),
  perfil: z
    .object({
      nome: texto(80).min(1).optional(),
      prefs: prefsSchema.optional(),
      grupo: grupoSchema.optional(),
      grupoRemovido: z.boolean().optional(),
      resumoIA: z
        .object({ mes: z.string().regex(/^\d{4}-\d{2}$/), texto: texto(2000) })
        .optional(),
    })
    .optional(),
});

export const cadastroSchema = z.object({
  nome: z.string().trim().min(1, "Informe seu nome").max(80),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(200),
  senha: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres")
    .max(200),
  exemplo: z.boolean().optional(),
});

export const entrarSchema = z.object({
  email: z.string().trim().toLowerCase().max(200),
  senha: z.string().max(200),
});

export const excluirContaSchema = z.object({
  senha: z.string().min(1, "Informe sua senha").max(200),
});
