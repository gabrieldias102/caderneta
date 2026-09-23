# Deploy em produção (Vercel + Postgres)

Guia para colocar a Caderneta no ar na Vercel com um Postgres gerenciado. O caminho recomendado é a **Neon** pela integração da própria Vercel: ela cria o banco, injeta as variáveis de ambiente e pode criar um banco separado para cada preview.

> Supabase também funciona. Use a URL do *Transaction pooler* (porta 6543) como `DATABASE_URL` e a conexão direta (porta 5432) como `DATABASE_URL_UNPOOLED`.

## Visão geral

```
navegador ──► Vercel (gru1 · São Paulo)
                ├─ páginas (estáticas) + proxy.ts (redireciona quem não tem cookie)
                └─ /api/* (route handlers Node) ──► Postgres gerenciado (pooler)
                                                └─► API da Anthropic (opcional, /api/resumo)
```

- Arquivos importados (PDF/OFX/CSV) **nunca** sobem para o servidor: são lidos no navegador e só os lançamentos revisados vão para `/api/sync`.
- O servidor não guarda estado em memória: sessões e limite de tentativas ficam no Postgres, então várias instâncias da função funcionam juntas.

## Variáveis de ambiente

| Variável | Obrigatória | Onde é usada |
|---|---|---|
| `DATABASE_URL` | sim | App em execução. Deve ser a URL **com pooler**. |
| `DATABASE_URL_UNPOOLED` | só para migrar | `drizzle-kit migrate` (conexão direta). Se não existir, usa `DATABASE_URL`. |
| `ANTHROPIC_API_KEY` | não | Resumo do mês por IA. Sem ela, a tela mostra um resumo montado localmente. |

`NODE_ENV=production` é definido pela Vercel. Com ele, o cookie de sessão passa a ser `Secure` e o cliente do Postgres usa poucas conexões por instância e desliga os prepared statements, que o pooler em modo transação não suporta (`src/db/index.ts`).

## Passo a passo

### 1. Projeto na Vercel

1. Suba o repositório para o GitHub (ou GitLab/Bitbucket).
2. Na Vercel: **Add New › Project**, importe o repositório. O framework é detectado como Next.js; não mude os comandos de build (`npm run build` já roda o `prebuild`, que copia o worker do pdf.js).
3. **Ainda não faça o deploy**: primeiro crie o banco (passo 2). Se o deploy já rodou, tudo bem: ele vai falhar por falta de `DATABASE_URL` e é só refazer depois.

### 2. Banco (Neon pela Vercel)

1. No projeto da Vercel: **Storage › Create Database › Neon**.
2. Região: **São Paulo (sa-east-1)**, a mesma região das funções (`vercel.json` fixa `gru1`). Se escolher outra região para o banco, troque `regions` no `vercel.json` para a região da Vercel mais próxima dele (ex.: `iad1` para `us-east-1`). Banco e função longe um do outro somam latência em toda requisição.
3. Conecte o banco aos ambientes **Production** e **Preview**. Ative a criação de branch por preview, se a integração oferecer. Assim cada preview usa um banco próprio e não mexe nos dados reais.
4. Confira em **Settings › Environment Variables** se `DATABASE_URL` e `DATABASE_URL_UNPOOLED` apareceram.

### 3. Criar as tabelas (migrações)

As migrações ficam em `drizzle/` e são aplicadas com `drizzle-kit`. Rode da sua máquina, apontando para o banco de produção:

```powershell
# PowerShell: copie a DATABASE_URL_UNPOOLED do painel da Vercel/Neon
$env:DATABASE_URL_UNPOOLED = "postgresql://...neon.tech/neondb?sslmode=require"
npm run db:migrate
Remove-Item Env:DATABASE_URL_UNPOOLED
```

```bash
# bash
DATABASE_URL_UNPOOLED="postgresql://..." npm run db:migrate
```

A variável de ambiente tem prioridade sobre o `.env.local`, então o banco local não é tocado. O comando é idempotente: aplica só o que falta (a Drizzle registra o que já rodou na tabela `drizzle.__drizzle_migrations`).

### 4. Deploy

1. Opcional: adicione `ANTHROPIC_API_KEY` em **Settings › Environment Variables** (só Production, se não quiser gastar em previews).
2. **Deployments › Redeploy** (ou faça um push na branch principal).
3. Teste: abra a URL, crie uma conta em `/cadastro`, importe um arquivo de exemplo, recarregue a página e confira se os dados continuam lá.

### 5. Domínio

**Settings › Domains**: adicione o domínio e configure o DNS como a Vercel indicar. O HTTPS é automático. A checagem de CSRF compara `Origin` com o host da requisição, então funciona com qualquer domínio sem configuração extra.

## Rotina de mudanças no banco

1. Altere `src/db/schema.ts`.
2. `npm run db:generate -- --name descricao-curta`: gera o SQL em `drizzle/`. **Leia o SQL** antes de seguir.
3. `npm run db:migrate` no banco local e teste.
4. Faça o commit do schema **e** da pasta `drizzle/` juntos.
5. Antes do deploy (ou logo depois, se a mudança só adiciona coisas), rode a migração em produção como no passo 3.

Regra prática: migrações que **adicionam** (tabela, coluna com default ou nula, índice) podem ir antes do deploy. Migrações que **removem ou renomeiam** exigem dois deploys: primeiro o código que para de usar a coluna, depois a migração que a remove.

> **Automatizar depois?** Dá para migrar no build com um script `"vercel-build": "npm run db:migrate && npm run build"`. Só faça isso se cada preview tiver banco próprio (branching da Neon); caso contrário, um preview aplicaria migrações no banco de produção.

## Checklist antes de abrir para outras pessoas

Resolvido neste repositório:

- [x] Pool de conexões adequado a serverless (`src/db/index.ts`)
- [x] Limite de tentativas no Postgres, válido entre instâncias (login, cadastro e resumo por IA)
- [x] Resumo por IA limitado a 20 por usuário por dia
- [x] Cookie `httpOnly` + `Secure` + `SameSite=Lax`, verificação de origem nas rotas que alteram dados
- [x] Funções na mesma região do banco (`vercel.json`)
- [x] Exportar dados e excluir conta (Configurações › Conta). A exclusão pede a senha de novo e apaga tudo em cascata.
- [x] Cabeçalhos de segurança (`next.config.ts`): CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`

Ainda falta (em ordem de importância para quem guarda dados financeiros de terceiros):

- [ ] **Backups**: confirme a janela de restauração (PITR) do plano do banco. Nos planos gratuitos ela é curta. Para dados reais, considere um plano pago ou um `pg_dump` agendado.
- [ ] **Política de privacidade**: diga o que é guardado (lançamentos, nunca o arquivo) e o que vai para a Anthropic (só agregados do mês).
- [ ] **Recuperação de senha**: sem ela, quem esquecer a senha perde o acesso. Precisa de um provedor de e-mail (Resend, Postmark, SES).
- [ ] **Monitoramento**: ative os logs e alertas da Vercel. Os erros de `/api/sync` saem com `console.error("sync falhou")`.
- [ ] **CSP mais estrita**: a atual usa `'unsafe-inline'` para manter as páginas estáticas. Para tirar, é preciso nonce no `proxy.ts` e renderização dinâmica (veja `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`).
- [ ] **Custo da IA**: `/api/resumo` usa um modelo grande. Acompanhe o gasto no console da Anthropic e defina um limite de gasto lá.

## Limites da plataforma a ter em mente

- **Corpo da requisição**: funções da Vercel aceitam até ~4,5 MB. `/api/sync` aceita até 5.000 itens por coleção em um lote, o que cabe com folga para lançamentos normais. Se um dia houver importações muito grandes, divida o lote no cliente.
- **Carga inicial**: `GET /api/estado` devolve todos os lançamentos do usuário. Com anos de histórico, pagine por período.
- **Conexões**: cada instância abre no máximo 3 conexões com o pooler. Se aparecer `too many connections`, confirme que `DATABASE_URL` é a URL **com pooler** (na Neon, o host tem `-pooler`).

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Build ou primeira requisição falha com `DATABASE_URL não configurada` | Variável não definida para o ambiente (Production/Preview) daquele deploy. |
| `relation "users" does not exist` | Migrações não rodaram no banco desse ambiente (passo 3). |
| `prepared statement "…" does not exist` | `DATABASE_URL` aponta para um pooler e o app não está com `NODE_ENV=production`. |
| Login funciona e logo pede para entrar de novo | Cookie `Secure` em HTTP puro. Use sempre a URL `https://`. |
| Algo não carrega e o console mostra `Refused to … Content Security Policy` | Recurso de outro domínio (script, fonte, API) não liberado na CSP do `next.config.ts`. |
| `403 Origem não permitida` | Requisição de outro domínio, ou proxy na frente da Vercel reescrevendo `Host`. |
| Resumo por IA mostra a versão local | `ANTHROPIC_API_KEY` ausente ou inválida no ambiente. |
