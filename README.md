# Caderneta

Controle financeiro pessoal (pt-BR, R$), sem conexão com banco: você importa o extrato ou a fatura (PDF, OFX ou CSV), revisa as categorias sugeridas e confirma. Implementação do design em [`design_handoff_caderneta/`](design_handoff_caderneta/README.md).

Next.js 16 (App Router) + React 19 + TypeScript, CSS puro com os tokens do tema "Acolhedor" (claro/escuro), ícones Lucide.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # parsers e pipeline de importação
npm run build
```

Para o **resumo por IA** (Relatórios › Gerar de novo), defina `ANTHROPIC_API_KEY` em `.env.local`. Sem a chave, a tela mostra um resumo montado localmente a partir dos mesmos números.

## Como está organizado

| Caminho | O quê |
|---|---|
| `src/app/*/page.tsx` | As 8 telas (Início, Lançamentos, Importar, Orçamentos, Relatórios, Contas, Compartilhadas, Configurações) |
| `src/components/` | Shell (sidebar ≥ 960px, barra inferior no celular), diálogos (detalhe, gasto em dinheiro, regra) e a linha de lançamento |
| `src/lib/store.tsx` | Estado do app, persistido no `localStorage` do navegador |
| `src/lib/derive.ts` | Regras de negócio: despesas ignoram neutros, saldo, "quanto posso gastar", orçamentos, parcelas |
| `src/lib/import/` | Parsers OFX/CSV/PDF, normalização de estabelecimento, detecção de Pix PF, parcelas, fatura e transferência própria, categorização (regras → histórico → palavras-chave) e duplicatas |
| `src/app/api/resumo/route.ts` | Resumo do mês com Claude — recebe só agregados, nunca lançamentos |
| `public/exemplos/` | Arquivos de exemplo usados pelos botões "Teste com um exemplo" |

## O que ainda é provisório

- **Dados**: ficam só no navegador (sem backend nem login). "Configurações › Aparência › Restaurar" volta aos dados de exemplo.
- **PDF**: leitura por texto com heurística genérica (`dd/mm descrição valor`); layouts específicos por banco e o fallback com LLM ainda não existem. OFX e CSV são os formatos confiáveis.
- **Categorização automática**: tabela de palavras-chave, não um modelo treinado.
- **Compartilhadas**: gastos da outra pessoa, convites e acerto são locais (não há sincronização entre usuários).
- **Ícone do Pix**: losango provisório — trocar pelo oficial do manual de marca do BCB.
