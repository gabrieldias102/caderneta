# Caderneta

Controle financeiro pessoal (pt-BR, R$), sem conexão com banco: você importa o extrato ou a fatura (PDF, OFX ou CSV), revisa as categorias sugeridas e confirma. Implementação do design em [`design_handoff_caderneta/`](design_handoff_caderneta/README.md).

Next.js 16 (App Router) + React 19 + TypeScript, CSS puro com os tokens do tema "Acolhedor" (claro/escuro), ícones Lucide. Backend no próprio Next (route handlers) com Postgres + Drizzle e login por e-mail e senha.

## Rodar

Precisa de Node 20+ e Docker.

```bash
npm install
cp .env.example .env.local   # DATABASE_URL já aponta para o Postgres do docker compose
npm run db:up                # Postgres 17 na porta 5433
npm run db:migrate           # cria as tabelas
npm run dev                  # http://localhost:3000 → crie uma conta em /cadastro
npm test                     # parsers, importação e sincronização
npm run build
```

Ao criar a conta dá para começar com os **dados de exemplo** (setembro/2026) ou vazio. Em Configurações › Conta é possível carregar os dados de exemplo depois.

Para o **resumo por IA** (Relatórios › Gerar de novo), defina `ANTHROPIC_API_KEY` em `.env.local`. Sem a chave, a tela mostra um resumo montado localmente a partir dos mesmos números.

Mudou o schema (`src/db/schema.ts`)? `npm run db:generate` cria a migração em `drizzle/` e `npm run db:migrate` aplica.

## Produção

Deploy na Vercel com Postgres gerenciado (Neon): veja **[docs/DEPLOY.md](docs/DEPLOY.md)**. Lá estão as variáveis de ambiente, como rodar as migrações no banco de produção e o checklist do que falta antes de abrir para outras pessoas.

## Backend

- **Autenticação**: e-mail e senha (hash scrypt), sessão em cookie httpOnly de 30 dias com renovação automática; no banco fica só o sha256 do token. Limite de tentativas de login por IP + e-mail (guardado no Postgres, vale para todas as instâncias) e comparação em tempo constante mesmo quando o e-mail não existe. `src/proxy.ts` só redireciona quem não tem cookie para `/entrar` — a validação real é feita em cada rota da API.
- **Dados**: todas as tabelas são particionadas por usuário (chave `(user_id, id)`); nenhuma consulta roda sem o `user_id` da sessão.
- **Sincronização**: o app continua otimista — altera o estado na tela e o store (`src/lib/store.tsx`) calcula a diferença (`src/lib/sync.ts`) e envia em lote para `POST /api/sync`, que valida com Zod e grava numa transação. Sem conexão, os lotes se acumulam e são reenviados com backoff; o indicador "Tudo salvo / Salvando… / Sem conexão" fica na barra lateral.
- **Arquivos importados**: continuam sendo lidos no navegador. O servidor recebe só os lançamentos já revisados — o arquivo nunca sai do aparelho.
- **CSRF**: rotas que alteram dados exigem mesma origem (`Origin`/`Sec-Fetch-Site`) e o cookie é `SameSite=Lax`.

| Rota | O quê |
|---|---|
| `POST /api/auth/cadastro` · `entrar` · `sair` | Conta e sessão |
| `GET /api/estado` | Todos os dados do usuário |
| `POST /api/sync` | Lote de alterações (upserts e exclusões por coleção) |
| `POST /api/exemplo` | Substitui os dados pelos de exemplo |
| `POST /api/resumo` | Resumo do mês com Claude (só agregados; 20 por usuário por dia) |

## Como está organizado

| Caminho | O quê |
|---|---|
| `src/app/(app)/*/page.tsx` · `src/app/(auth)/` | As 8 telas (Início, Lançamentos, Importar, Orçamentos, Relatórios, Contas, Compartilhadas, Configurações) e as de entrar/criar conta |
| `src/components/` | Shell (sidebar ≥ 960px, barra inferior no celular), diálogos (detalhe, gasto em dinheiro, regra) e a linha de lançamento |
| `src/lib/store.tsx` | Estado do app no cliente + fila de sincronização com o servidor |
| `src/db/` · `drizzle/` | Schema do Postgres e migrações |
| `docs/DEPLOY.md` · `vercel.json` | Deploy na Vercel |
| `src/server/` | Autenticação, validação (Zod) e acesso a dados |
| `src/lib/derive.ts` | Regras de negócio: despesas ignoram neutros, saldo, "quanto posso gastar", orçamentos, parcelas |
| `src/lib/import/` | Parsers OFX/CSV/PDF, normalização de estabelecimento, detecção de Pix PF, parcelas, fatura e transferência própria, categorização (regras → histórico → palavras-chave) e duplicatas |
| `src/app/api/resumo/route.ts` | Resumo do mês com Claude — recebe só agregados, nunca lançamentos |
| `public/exemplos/` | Arquivos de exemplo usados pelos botões "Teste com um exemplo" |

## O que ainda é provisório

- **Recuperação de senha e verificação de e-mail**: ainda não existem (precisam de um provedor de e-mail).
- **Excluir conta / exportar dados** (LGPD): ainda não existem.
- **Carga inicial**: `GET /api/estado` traz todos os lançamentos do usuário; para históricos grandes, paginar por período.
- **PDF**: leitura por texto com heurística genérica (`dd/mm descrição valor`); layouts específicos por banco e o fallback com LLM ainda não existem. OFX e CSV são os formatos confiáveis.
- **Categorização automática**: tabela de palavras-chave, não um modelo treinado.
- **Compartilhadas**: o grupo é salvo na conta de quem o criou; gastos da outra pessoa, convites e acerto ainda não são compartilhados entre contas reais.
- **Ícone do Pix**: losango provisório — trocar pelo oficial do manual de marca do BCB.
