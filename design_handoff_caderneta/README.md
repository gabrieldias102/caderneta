# Handoff: Caderneta — controle financeiro pessoal

## Visão geral
App de finanças pessoais para o público brasileiro (pt-BR, R$), mobile-first com versão web responsiva. Diferencial: **não há conexão com banco**. O usuário importa o extrato ou a fatura do cartão (PDF, OFX ou CSV) e o app cria os lançamentos com uma categoria sugerida e um nível de confiança; o usuário revisa e confirma. Também há entrada manual rápida (gastos em dinheiro).

Direção visual escolhida: **"Acolhedor"** — cantos bem arredondados, azul como acento, cartões brancos sobre fundo azul-acinzentado, com tema **claro e escuro**.

## Sobre os arquivos de design
Os arquivos em `prototipo/` são **referências de design em HTML** — um protótipo navegável que mostra aparência e comportamento. **Não são código de produção.** A tarefa é **recriar este design no ambiente do projeto-alvo** (ex.: React Native/Expo, Flutter, React + Tailwind), usando os padrões e bibliotecas desse ambiente. Se ainda não existe projeto, recomendação: **React Native (Expo) + web via React Native Web**, ou **Next.js** responsivo + PWA se o foco inicial for web.

Para abrir o protótipo: sirva a pasta `prototipo/` por HTTP (ex.: `npx serve prototipo`) e abra `Caderneta v2.dc.html`. Toda a lógica e dados de exemplo estão no `<script data-dc-script>` do arquivo (classe `Component`, método `renderVals()`).

Observação: o protótipo carrega um stylesheet base (`_ds/.../styles.css`) cujas variáveis são **sobrescritas em tempo de execução** pelos tokens do tema Acolhedor (função `theme()` no script). **Os valores válidos são os da seção "Design tokens" abaixo**, não os do styles.css.

## Fidelidade
**Alta fidelidade (hi-fi)** para cores, tipografia, arredondamentos, hierarquia, textos e fluxos. Os dados são fictícios (setembro/2026, "hoje" = 23/09/2026). A leitura de arquivos e a sugestão de categorias são **simuladas** — o backend precisa ser construído (ver "Requisitos de backend").

---

## Design tokens (tema Acolhedor)

### Cores — Claro
| Token | Hex | Uso |
|---|---|---|
| bg | `#F4F5FA` | Fundo da tela |
| card | `#FFFFFF` | Cartões, sidebar, barra inferior, diálogos |
| surface | `#EEF1F8` | Inputs, item ativo da navegação, blocos suaves |
| text | `#1A1F36` | Texto principal |
| divider | `#E2E6F0` | Linhas divisórias (1px) |
| accent | `#3B5BDB` | Ação primária, destaques, barras de alerta |
| accent-100 | `#EBEFFD` | Fundo tingido (linha de Pix PF, resumo IA, tags) |
| accent-200 | `#D7DFFB` | — |
| accent-300 | `#B6C4F7` | — |
| accent-400 | `#8EA3F1` | — |
| accent-500 | `#5C78E4` | — |
| accent-600 | `#3450C7` | Hover do botão primário |
| accent-700 | `#2A43A8` | Texto de acento sobre fundo claro; pressed |
| accent-800 | `#213585` | Texto de tag de acento |
| neutral-100 … 900 | `#F1F3F8` `#E6E9F1` `#D3D8E4` `#B3BACB` `#8F97AB` `#6D758A` `#535B6F` `#3A4154` `#232838` | 200 = trilho de barras; 300 = trilho vazio/borda tracejada; 600 = texto de itens neutros; 700 = texto secundário |

### Cores — Escuro
| Token | Hex |
|---|---|
| bg | `#15171F` |
| card | `#1D2029` |
| surface | `#262A36` |
| text | `#EEF0F7` |
| divider | `#2C303D` |
| accent | `#7890FA` (texto sobre acento usa a cor `bg`) |
| accent-100 … 900 | `#1C2446` `#263262` `#34458A` `#5670E8` `#7890FA` `#90A5FF` `#AEBFFF` `#CBD6FF` `#E4EAFF` |
| neutral-100 … 900 | `#1D2029` `#272B36` `#343946` `#4A5061` `#646B7E` `#8990A4` `#A6ACBE` `#C5CAD8` `#E4E7EF` |

Regra: texto sobre fundo de acento usa `bg` (branco-azulado no claro, quase preto no escuro). Backdrop de modal: `rgba(6,8,14,.55)` nos dois temas.

### Tipografia
- Família única: **Plus Jakarta Sans** (Google Fonts), pesos 400 / 600 / 800.
- Números monetários sempre com `font-variant-numeric: tabular-nums`, sem quebra de linha entre sinal e valor (usar espaço não separável: `− R$ 58,90`, `+ R$ 85,00`).

| Estilo | Tamanho / peso / entrelinha |
|---|---|
| Número herói (saldo, "quanto posso gastar") | 38px / 800 / 1.0, letter-spacing −0.03em |
| Número de progresso da importação | 72px / 800 / 1.0 |
| Título da tela (h1) | 32px / 800 / 1.12 |
| Número de cartão/conta | 28px / 800 |
| Título de seção (h4) | 20px / 800 |
| Título de diálogo | 20px / 800 |
| Corpo / nome do lançamento | 15px / 600 (nome) · 15px / 400 |
| Secundário / meta | 12–13px / 400, cor neutral-700 |
| Kicker (rótulo acima de título) | 11px / 400, maiúsculas, letter-spacing 0.1em, cor accent-700 |
| Botão | 14px / 800 |
| Tag | 11px / 400, letter-spacing 0.02em |

### Arredondamento
| Token | Valor | Uso |
|---|---|---|
| radius-sm | 10px | Células pequenas (grade de parcelas) |
| radius-md | 16px | Botões, inputs, segmentado, itens da sidebar, blocos internos |
| radius-lg | 26px | Cartões, diálogos, área de upload, resumo IA |
| r-icon | 14px | Ícone-quadrado de 36px nas listas (e avatares 32px) |
| pill | 999px | Barras de progresso (trilho e preenchimento), toast |
| frame | 36px | Moldura do celular (apenas apresentação) |
| sheet | 24px 24px 0 0 | Bottom sheet "Mais" |
| barras de gráfico | 8px 8px 3px 3px | Colunas dos gráficos |

### Sombras
- sm: `0 1px 3px rgba(26,31,54,.10)` · md: `0 6px 18px rgba(26,31,54,.10)` · lg: `0 18px 48px rgba(26,31,54,.16)`
- Escuro: mesmas geometrias com `rgba(0,0,0,.45)` / `.72` no lg.
- Cartões **não** têm sombra (separação por cor card × bg). Sombra só em diálogos, toast e FAB.

### Espaçamento
Escala de 4px: 4 · 8 · 12 · 16 · 24 · 32. Padding de tela: **16px** no mobile, **32px 40px** no desktop. Gap entre cartões: 12px. Padding interno de cartão: 16–20px (cartões de seção: 16px 18px). Largura máxima do conteúdo no desktop: 1180px.

### Ícones
**Lucide** (lucide.dev), traço 2px, 16–20px. Usados: `house`, `list`, `upload`, `target`, `bar-chart`, `wallet`, `users`, `sliders-horizontal`, `ellipsis`, `plus`, `search`, `x`, `arrow-left-right` (neutro/transferência), `triangle-alert`, `check`, `arrow-right`, `credit-card`, `link`, `trash-2`. Pix: losango (substituir pelo ícone oficial do Pix conforme o manual de marca do BCB).

---

## Layout responsivo e navegação
- **< 960px (mobile)**: header com logo "Caderneta." (ponto em accent) + tag do mês; conteúdo rolável; **barra inferior** com 5 abas (card, borda superior 1px divider): Início · Lançamentos · Importar · Orçamentos · Mais. Aba ativa: ícone e rótulo em accent-700, peso 800. "Mais" abre bottom sheet com Relatórios, Contas e cartões, Compartilhadas, Configurações.
- **≥ 960px (desktop)**: **sidebar** fixa de 248px (fundo card, borda direita 1px) com logo, mês e os 8 itens; item ativo com fundo surface, raio 16px, texto accent-700 peso 800. Rodapé da sidebar: "Sem conexão com o banco — Tudo entra por arquivo ou à mão."
- Cartões em grade `repeat(auto-fit, minmax(250–320px, 1fr))` — viram 1 coluna no celular.
- Transição de tela: fade + translateY(8px→0) em 250ms ease-out.

## Convenções visuais de lançamentos (regras de negócio)
Toda linha de lançamento: ícone-quadrado 36px (raio 14px) · nome (15/600, reticências) · meta (categoria · conta) + tags · valor à direita.

| Tipo | Ícone | Valor | Observações |
|---|---|---|---|
| Despesa | fundo surface, sigla da categoria (2 letras, 11/800) | `− R$ x`, 600, cor text | — |
| Receita | fundo text, "+" em bg | `+ R$ x`, **800** | — |
| **Neutro** (pagamento de fatura, transferência entre contas próprias) | fundo neutral-200, ícone ⇄ em neutral-600 | **sem sinal**, cor neutral-600 | Nome também em neutral-600; tag "Fora das despesas"; **não entra** em despesas, saldo do mês, orçamentos nem relatórios |
| **Pix para pessoa física sem categoria** | fundo accent, "PIX" em bg | normal | Linha inteira com fundo accent-100; tag "Pix PF · sem categoria"; abaixo, "Pix para pessoa física — para que foi?" + botões rápidos (Mercado, Lazer, Presentes, Moradia, Outros, "Outra…") |
| Pix já categorizado | "PIX" em surface | normal | Tag neutra "Pix" |
| **Parcelado** | normal | valor da parcela | Tag outline "Parcela 3/10". No detalhe: grade com todas as parcelas (passadas em neutral-200, atual em accent "set · atual", futuras em card com o mês) |
| Compartilhado | normal | normal | Tag neutra "Compartilhado" |

---

## Telas

### 1. Início (Dashboard)
- Kicker "Terça, 23 de setembro" + h1 "Olá, Rafa"; botão primário "Importar extrato" (ícone upload).
- Faixa de 3 cartões:
  1. **Saldo do mês** — número herói `+ R$ 2.155,76`; texto "Receitas menos despesas, até hoje. Transferências e faturas pagas ficam de fora."
  2. **Quanto ainda posso gastar** (cartão accent, texto bg) — soma do que resta dos orçamentos (nunca negativo); "≈ R$ X por dia nos próximos 8 dias, somando o que resta dos orçamentos."
  3. **Receitas × despesas** — duas barras pill de 10px (receitas 100% cor text; despesas em accent proporcional às receitas) + "Você gastou 72% do que entrou."
- **Gastos por categoria** (cartão): top 7, grade `110px | barra | valor`; barra relativa à maior categoria; barra em accent se a categoria passou do limite de alerta, senão cor text. Link "Orçamentos".
- **Alertas recentes** (cartão, contador em tag accent): ícone 28px + título + sub + ação ghost. Tipos: orçamento ≥ limite ("Você já usou 84% do orçamento de Delivery" / "Orçamento de X estourado"), Pix PF pendentes ("2 Pix para pessoa física sem categoria" → abre Lançamentos filtrado em "Sem categoria"), fatura perto do vencimento ("Fatura Nubank vence em 9 dias").
- **Últimos lançamentos** (cartão): 5 itens, "Ver todos".

### 2. Lançamentos
- Kicker "N lançamentos" + h1. Desktop: botão primário "Gasto em dinheiro". Mobile: FAB sticky no rodapé direito (altura 52px, sombra md) com o mesmo rótulo.
- Busca (ícone lupa à esquerda; busca em descrição, estabelecimento e valor "58,90").
- Filtros em grade: **Conta ou cartão** (select: Todas + contas + cartões), **Categoria** (Todas, Sem categoria, categorias), **Período** (segmentado: Setembro · 7 dias · Agosto).
- Linha de totais: "Despesas R$ x · Receitas R$ y · ⇄ Transferências e faturas não somam".
- Lista agrupada por dia; cabeçalho sticky "HOJE · 23 SET" / "ONTEM · 22 SET" / "SEG · 21 SET" com total de despesas do dia à direita.
- Estado vazio: "Nada por aqui" + texto + botão "Importar arquivo".
- Toque na linha abre **Detalhe** (diálogo): kicker (Despesa/Receita/Pix/Movimentação neutra), nome, valor grande, tabela Data/Conta/Estabelecimento/Parcela, select de Categoria, checkbox "Compartilhado com Ana (Apê Vila Madalena)", grade de parcelas quando houver. Para neutros: aviso "Pagar a fatura não é um gasto novo: as compras já foram contadas quando você usou o cartão." / "Transferência entre contas suas — o dinheiro não saiu do seu bolso." e sem categoria.
- **Adição rápida** (diálogo "Gasto em dinheiro"): valor grande com prefixo R$ (teclado decimal, autofocus), Descrição, chips de Categoria (obrigatória), "Saiu de" (padrão: Dinheiro). Salvar habilitado só com valor > 0 e categoria. Toast: "R$ 25,00 em Mercado adicionado".

### 3. Importar extrato (fluxo principal)
Stepper de 4 etapas no topo: 01 Enviar · 02 Processar · 03 Revisar · 04 Pronto (barra de 3px em accent nas etapas concluídas/atual; atual em peso 800).

**3a. Enviar**
- Área de upload (borda 2px tracejada neutral-300, raio 26px; hover: borda accent; drag-over: fundo accent-100): ícone upload 32px accent, "Arraste o arquivo aqui", "ou toque para escolher. Extrato da conta ou fatura do cartão, em PDF, OFX ou CSV. Até 10 MB."
- Arquivo escolhido: bloco surface com selo da extensão (PDF/OFX/CSV), nome, tamanho, dica ("Fatura Nubank detectada") e botão remover. Extensão inválida → toast "Formato não suportado — use PDF, OFX ou CSV".
- **Destino**: lista de rádios com todas as contas e cartões (nome, subtítulo, tag Conta/Cartão). Se o arquivo identificar o banco, pré-selecionar.
- Botão primário largo "Ler arquivo e sugerir categorias →" (desabilitado sem arquivo + destino). Nota: "O arquivo é lido e descartado. Nada é enviado ao banco e nada é lançado antes da sua revisão."
- "Importações anteriores": arquivo, destino, data, nº de lançamentos.

**3b. Processando**
- "arquivo → destino"; percentual gigante (72px, "%" em accent); barra pill.
- 4 estágios com marcador 20px (concluído: cor text + check; atual: accent piscando 1s; futuro: neutral-300): Lendo o arquivo · Encontrando lançamentos (datas, valores, parcelas e Pix) · Sugerindo categorias (regras suas primeiro, depois a sugestão automática) · Checando duplicatas. Botão "Cancelar".

**3c. Revisão**
- 4 cartões-resumo: encontrados · **pedem sua revisão** (accent-700) · possíveis duplicatas · compras parceladas.
- Barra: "Selecionar todos" + segmentado de filtro **Todos N · Revisar N · Duplicatas N**.
- **Edição em massa**: com seleção, aparece barra sticky (fundo text, texto bg, raio 16px): "N selecionados" · select "Mudar categoria…" · "Não importar" · limpar. Toast "Delivery aplicada a 3 lançamentos".
- Cada linha: checkbox · estabelecimento normalizado (15/600) · descrição original do banco em monoespaçada 11px ("IFOOD *IFOOD") com data · valor · select de categoria (borda accent se precisa de revisão) · **medidor de confiança** (3 segmentos 14×8px) + rótulo:
  - Regra automática / Você definiu → 3 segmentos cor text
  - Confiança alta (≥ 85%) → 3 · média (60–84%) → 2 · baixa (< 60%) → 1 em accent · Sem sugestão → 0
  - Variante alternativa: rótulo "72% de confiança" sem medidor.
- "Precisa de revisão" = confiança baixa, sem categoria, ou Pix PF ainda não confirmado. Pix PF: linha com fundo accent-100 + tag "Pix para pessoa física".
- **Duplicata**: linha com fundo neutral-100; aviso interno "Possível duplicata — já lançado em 18/09 por uma importação anterior" + ação "Não importar"/"Importar mesmo assim". **Duplicatas vêm desmarcadas (ignoradas) por padrão**; linha ignorada com opacidade 55%.
- Parcelado: tags "Parcela 2/6" + "+4 parcelas projetadas até jan".
- Pagamento de fatura dentro do arquivo: sem select, texto "⇄ Pagamento da fatura — não conta como despesa".
- Rodapé sticky: "N lançamentos serão importados" / "Despesas R$ x · N ignorados · N sem categoria" · "Descartar" · primário "Confirmar importação ✓".

**3d. Regra "aplicar sempre"**
Ao trocar a categoria de um item (na revisão **ou** no detalhe de um lançamento), se ainda não existir regra igual, abre diálogo:
- Kicker "Nova regra?" · título "Aplicar sempre para “Padaria Real”?" · "Daqui pra frente, tudo de **Padaria Real** entra como **Mercado** — sem sugestão, direto. Também vamos ajustar o outro lançamento desta importação."
- "Só desta vez" / primário "Aplicar sempre". Ao aceitar: cria a regra, aplica aos outros itens do mesmo estabelecimento (na importação ou no histórico) e toast "Regra criada: Padaria Real → Mercado".

**3e. Pronto**
Ícone check 56px em accent · "13 lançamentos importados em Nubank Ultravioleta" · lista: duplicatas ignoradas, parcelas projetadas, regras novas, sem categoria · "Ver lançamentos →" / "Importar outro arquivo".

### 4. Orçamentos
- Kicker "Setembro · faltam 8 dias" · h1 · botão "Editar limites" (alterna para inputs "Limite R$").
- Bloco resumo (surface, raio 26px): "R$ gasto de R$ limite", "% usado", barra pill 12px + **marcador vertical em accent na posição do mês decorrido (77%)**; legenda "A linha marca onde o mês está. Gasto à esquerda dela = no ritmo."
- Linhas por categoria ordenadas por % usado: nome · tag ("84% usado" em accent ≥ limite de alerta; "Estourado" outline ≥ 100%) · "R$ gasto / R$ limite" · barra 8px (cor text < alerta; accent ≥ alerta; accent-700 ≥ 100%) com **tique fino no % de alerta** · "Restam R$ x" ou "Estourou R$ x" (accent-700) · "%".

### 5. Relatórios
- **Resumo do mês por IA** (cartão accent-100, raio 26px): kicker "Resumo de setembro · escrito por IA", parágrafo 19px/1.5 em linguagem simples (máx. ~70 palavras, trata por "você"), botão "Gerar de novo" (estado "Escrevendo…"), aviso "Gerado a partir dos seus lançamentos. Pode conter imprecisões — os números abaixo são a referência."
  - Exemplo: "Até o dia 23, entraram R$ 7.885 e saíram R$ 5.729 — sobraram R$ 2.156, um mês melhor que agosto. Moradia segue sendo o maior gasto… O ponto de atenção é Delivery…"
- **Mês a mês**: colunas pareadas de 6 meses (receitas cor text, despesas accent), saldo abaixo de cada mês.
- **Evolução por categoria**: chips de categoria; 6 colunas (mês atual em accent) com valor acima; frase "Setembro: R$ x · y% acima de agosto · média dos 5 meses anteriores R$ z".
- **Maiores estabelecimentos**: tabela # · estabelecimento (+ categoria) · nº de compras · total.

### 6. Contas e cartões
- Kicker "Saldo total R$ x".
- **Contas**: cartões com nome, subtítulo, saldo (28/800), "Último extrato: 20/09 (OFX)".
- **Cartões de crédito**: nome, "Crédito •••• 4821", tag "Vence 02/10" (accent se ≤ 10 dias), "Fatura atual · fecha 25/09", valor, barra de uso do limite, "R$ disponível · Limite R$", botão "Importar fatura" (abre Importar com destino pré-selecionado).
- **Parcelas nas próximas faturas**: "R$ x já comprometidos"; colunas dos próximos 6 meses com preenchimento accent-100 e **borda tracejada accent** (= valor projetado, ainda não cobrado); tabela Compra · Parcela (tag "3/10") · Por mês · Falta pagar, com "termina em jun/27".

### 7. Contas compartilhadas
- Kicker "Apê Vila Madalena · 2 pessoas".
- Cartão accent **Quem deve quanto**: "Ana te deve R$ 1.286,26" / "Você deve R$ x para Ana" / "Tudo acertado"; "Considerando N gastos de setembro, divididos 50/50."; botão "Registrar acerto via Pix" (após acertar: cartão vira surface, texto "Acerto registrado hoje…").
- Cartão **Divisão (você / Ana)**: segmentado 50/50 · 60/40 · 70/30; "Você pagou / sua parte" e "Ana pagou / parte dela".
- **Lançamentos compartilhados**: avatar 32px (VC em text; AR em surface), descrição, "dd/mm · você pagou", valor, "Ana: R$ x".
- **Pessoas**: membros com status (Admin, Ativa, Pendente em outline); "Convidar por e-mail ou celular" (valida e-mail ou celular BR) + "Convidar"; "Copiar link de convite".
- Cálculo: `deve = pagoPorMim − total × minhaFração` (positivo = a outra pessoa me deve).

### 8. Configurações
Segmentado: **Categorias · Regras (N) · Alertas**.
- Categorias: campo "Nova categoria" + Adicionar; lista com sigla, nome, "N lançamentos em setembro", limite.
- Regras: "Quando o estabelecimento for **iFood** → **Delivery**", origem ("Criada agora ao revisar importação"), excluir. Texto: "Regras são criadas quando você corrige uma categoria e escolhe “aplicar sempre”. Elas rodam antes da sugestão automática."
- Alertas: "Avisar ao atingir parte do orçamento" (switch + segmentado 70/80/90/100%, padrão 80%), "Fatura perto do vencimento" (10 dias antes), "Pix para pessoa física sem categoria", "Duplicatas na importação", "Resumo semanal por IA" (desligado).

---

## Interações e estados
- Toast: pill escura (cor text), ícone check, some em 2,6s, acima da barra inferior.
- Diálogos: fundo card, raio 26px, sombra lg, entrada fade+slide 200ms; fecham ao tocar no backdrop (exceto o de regra, que exige escolha).
- Hover: linhas com fundo surface; botão primário accent-600; pressed accent-700. Foco de teclado: contorno 2px accent, offset 2px.
- Desabilitado: opacidade 45%.
- Alvos de toque ≥ 44px no mobile (abas: 56px).

## Estado / modelo de dados
```ts
type Conta  = { id; nome; tipo: 'conta' | 'cartao'; saldo?; limite?; faturaAtual?; fechamento?; vencimento? }
type Lancamento = {
  id; data: 'YYYY-MM-DD'; descricaoOriginal; estabelecimento; valor: number /* negativo = saída */;
  contaId; categoriaId?; tipo?: 'fatura' | 'transferencia' /* neutros */;
  pix?: { pessoaFisica: boolean }; parcela?: { atual: number; total: number; grupoId };
  compartilhado?: { grupoId; pagoPor: userId }; importacaoId?; origem: 'arquivo' | 'manual'
}
type Regra = { id; estabelecimento; categoriaId; criadaEm; origem }
type Orcamento = { categoriaId; mes: 'YYYY-MM'; limite }
type Importacao = { id; arquivo; contaId; data; total; ignorados }
type ItemRevisao = Lancamento & { confianca: 0..1; porRegra: boolean; duplicataDe?: lancamentoId; ignorado: boolean; editado: boolean }
```
Derivados: despesas = Σ valores negativos **não neutros**; saldo do mês = receitas − despesas; "posso gastar" = Σ max(0, limite − gasto) dos orçamentos; alertas = categorias com gasto/limite ≥ limiar.

## Requisitos de backend (não existem no protótipo)
1. **Parsers**: OFX (padrão), CSV (mapear colunas por banco; permitir mapeamento manual), PDF (extração de texto + layout por banco/emissor; fallback com LLM).
2. **Normalização do estabelecimento** ("IFOOD *IFOOD" → "iFood"; "UBER *TRIP" → "Uber").
3. **Detecção**: Pix PF (ex.: "PIX ENV <NOME>", CPF mascarado), parcelas ("02/06", "PARC 3/10"), pagamento de fatura e transferências entre contas do próprio usuário (casar valor + data entre contas).
4. **Categorização**: regras do usuário → histórico do usuário → modelo; retornar confiança 0–1.
5. **Duplicatas**: mesma conta + data ±1 dia + valor + estabelecimento normalizado.
6. **Projeção de parcelas**: gerar as futuras nas faturas seguintes, marcadas como projetadas.
7. **Resumo por IA**: enviar agregados (não lançamentos brutos) a um LLM; linguagem simples, ≤ 70 palavras.
8. Privacidade: o arquivo não é armazenado após o processamento (conforme o texto da interface) — atenção à LGPD.

## Formatação pt-BR
`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` → `R$ 1.234,56`. Datas `dd/mm`, meses abreviados em minúsculas (jan, fev…), dias "Seg, Ter…". Sinal de menos tipográfico "−".

## Arquivos
- `prototipo/Caderneta v2.dc.html` — protótipo completo (template + lógica + dados de exemplo). Parâmetros no topo do script: `modo` (Claro/Escuro), `frame`, `startScreen`, `confStyle`.
- `prototipo/support.js` — runtime do protótipo (apenas para abrir o HTML; não portar).
- `prototipo/_ds/…` — stylesheet base cujas variáveis o protótipo sobrescreve (apenas para abrir o HTML).
