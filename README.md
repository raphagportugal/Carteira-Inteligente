# Carteira Inteligente

Aplicação SaaS construída com Next.js 15 que funciona como um consultor
financeiro pessoal. O produto ajuda pessoas a entender quanto possuem
disponível, antecipar o fluxo de caixa e tomar decisões alinhadas aos seus
objetivos.

Domínio do produto: [acarteirainteligente.com.br](https://acarteirainteligente.com.br)

## Funcionalidades

- Landing page responsiva com o posicionamento da Carteira Inteligente
- Cadastro e login com e-mail e senha pelo Supabase Auth
- Área autenticada protegida por middleware e validação no servidor
- Movimentações manuais com criação, edição e exclusão
- Contas bancárias com saldo atual, identidade visual por banco e Caixa
  Centralizado no dashboard
- Receitas e despesas vinculadas à conta de origem ou destino; compras no
  cartão permanecem vinculadas ao cartão utilizado
- Transferências entre contas sem impacto em receitas ou despesas
- Despesas no cartão vinculadas ao cartão utilizado, preservando a data da
  compra e impactando o fluxo de caixa no vencimento da fatura
- Cartões e Parcelamentos em uma tela unificada, com resumo da próxima fatura
  e identidade visual fixa por banco
- Dashboard calculado com receitas, despesas, saldo, capacidade de poupança,
  categorias e histórico reais
- Leituras automáticas baseadas nos dados registrados
- Contas e Fluxo de Caixa dos próximos seis meses com transações futuras,
  receitas previstas, mensalidades, parcelamentos, financiamentos e empréstimos
- Parcelamentos no cartão com categoria padronizada, parcelas restantes,
  valor restante, cronograma e término calculados automaticamente a partir da
  compra e das datas do cartão
- Mensalidades com período, vencimento, status e impacto nas projeções
- Financiamentos e Empréstimos com valor financiado líquido, saldo devedor
  atual opcional, edição, exclusão, ícones por tipo e comprometimento estimado
- Total de parcelas, parcela atual, parcelas restantes e progresso calculados
  automaticamente pelas datas do contrato
- Taxa CET estimada mensal e anual calculada pelo fluxo de pagamentos quando
  os dados permitem uma estimativa segura
- Taxas pré-fixadas, pós-fixadas ou desconhecidas, com suporte a IPCA, IGP-M,
  CUB, TR e outros índices
- Drawer de detalhes com informações do contrato e calendário previsto
- Planos de Parcelamento Personalizados com múltiplos vencimentos, valores e
  descrições integrados ao fluxo de caixa
- Objetivos financeiros com prioridade, status e CRUD completo
- Investimentos e Patrimônio com ativos financeiros, imóveis, veículos,
  participações e outros bens
- Investimentos com posição inicial e posição atual informadas manualmente,
  além de histórico de múltiplos aportes
- Aportes do mês vigente em diante vinculados a uma conta de origem,
  reduzindo o caixa e a sobra do mês
- Aportes anteriores ao mês vigente preservados no histórico sem alterar o
  caixa atual
- Bens patrimoniais com valor atual estimado editável e sem impacto no fluxo
- Planejamento Financeiro com metas mensais por categoria
- Fluxo de caixa compacto com Entradas, Saídas, Investido no mês, Sobra de
  caixa e comparação Planejado vs Executado
- Baixa manual de parcelas vencidas em Financiamentos e Empréstimos
- Receitas futuras por mês
- Evolução patrimonial simplificada e compromissos dos próximos 90 dias
- Formulários validados no cliente e no servidor
- Configurações da conta
- Extrato completo em `/dashboard/movimentacoes`, agrupado por mês, com busca,
  filtros, edição e exclusão

Upload de PDF e inteligência artificial ainda não fazem parte desta etapa.

## Tecnologias

- Next.js 15 com App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase e Supabase Auth
- Vercel

## Executar localmente

Requisitos: Node.js 20 ou superior, npm e um projeto no Supabase.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo local de ambiente:

   ```bash
   cp .env.example .env.local
   ```

   No Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Em **Project Settings > API** no Supabase, copie os dados para:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
   ```

4. Em **Authentication > Providers**, mantenha o provedor Email habilitado.

5. Para uma instalação nova, abra **SQL Editor > New query**, copie todo o conteúdo de
   [`supabase/schema.sql`](supabase/schema.sql) e execute a consulta.

   O script cria e evolui as tabelas, índices, Row Level Security e políticas
   para que cada usuário acesse somente os próprios dados. Ele é aditivo e não
   remove registros existentes.

   Para atualizar uma instalação existente, execute em ordem as migrations que
   ainda não foram aplicadas. A evolução mais recente está em
   [`supabase/migrations/20260615_v1_consolidation.sql`](supabase/migrations/20260615_v1_consolidation.sql).

6. Em **Authentication > URL Configuration**, configure:

   - Site URL: `http://localhost:3000`
   - Redirect URL adicional: `http://localhost:3000/**`

7. Execute:

   ```bash
   npm run dev
   ```

8. Acesse [http://localhost:3000](http://localhost:3000).

## Persistência de dados

Os formulários são conectados a Server Actions. Ao criar ou editar um registro:

1. Os campos são validados no navegador e no servidor.
2. A sessão é validada pelo Supabase Auth.
3. O registro é salvo com o `user_id` autenticado.
4. As políticas RLS impedem acesso aos dados de outros usuários.
5. Dashboard, fluxo de caixa, parcelamentos, financiamentos e empréstimos são
   revalidados.

As exclusões sempre pedem confirmação no navegador. As operações de atualização
e exclusão filtram simultaneamente por `id` e `user_id`; as políticas RLS do
schema oferecem uma segunda camada de isolamento entre usuários.

Contas sem dados recebem estados vazios com orientação para cadastrar a
primeira movimentação.

### Movimentações no cartão

Ao registrar uma despesa com a forma de pagamento `Cartão de crédito`, o
usuário deve selecionar um cartão cadastrado. A aplicação usa a data da compra,
o fechamento e o vencimento para preencher `cash_flow_date`.

- Compra até o fechamento: vencimento da fatura daquele ciclo.
- Compra após o fechamento: vencimento da fatura do ciclo seguinte.
- Outras formas de pagamento: `cash_flow_date` é igual a `transaction_date`.

O histórico continua usando `transaction_date`. Dashboard, indicadores mensais
e fluxo de caixa usam `cash_flow_date`, com fallback para `transaction_date` em
registros antigos.

## Rotas

| Rota | Descrição |
| --- | --- |
| `/` | Landing page |
| `/login` | Login |
| `/cadastro` | Criação de conta |
| `/dashboard` | Visão geral e recomendações |
| `/dashboard/fluxo-de-caixa` | Projeção financeira futura |
| `/dashboard/cartoes` | Cartões, parcelamentos e próxima fatura |
| `/dashboard/parcelamentos` | Parcelamentos vinculados a cartões |
| `/dashboard/planejamento` | Metas mensais de gastos |
| `/dashboard/mensalidades` | Despesas mensais recorrentes |
| `/dashboard/financiamentos` | Financiamentos e Empréstimos |
| `/dashboard/investimentos` | Investimentos e patrimônio consolidado |
| `/dashboard/objetivos` | Metas e progresso |
| `/dashboard/configuracoes` | Preferências da conta |

Todas as rotas iniciadas por `/dashboard` exigem uma sessão válida.

## Validação

```bash
npm run lint
npm run typecheck
npm run build
```

## Publicação na Vercel

1. Envie o projeto para um repositório Git.
2. Importe o repositório em **Add New > Project** na Vercel.
3. Adicione `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas variáveis de ambiente.
4. Faça o deploy.
5. No Supabase, configure:

   - Site URL: `https://acarteirainteligente.com.br`
   - Redirect URL: `https://acarteirainteligente.com.br/**`
   - O domínio temporário da Vercel também pode ser mantido como URL adicional.

## Escopo atual

Movimentações, cartões, parcelamentos, mensalidades, financiamentos e
empréstimos, objetivos e investimentos possuem CRUD persistido no Supabase. Receitas futuras são
mantidas por mês. Todos os compromissos impactam automaticamente os indicadores
e o fluxo de caixa.

## Novas tabelas

- `investments`: posição atual dos investimentos por tipo e instituição
- `income_forecasts`: receitas esperadas por mês
- `financing_custom_payments`: vencimentos dos planos personalizados
- `financial_plans`: metas mensais de gastos por categoria
- `financing_payment_statuses`: baixa das parcelas de financiamentos

As tabelas existentes `installments` e `goals` recebem apenas novas colunas
compatíveis com os dados anteriores. Nenhuma tabela ou registro é removido.

## Atualização de Financiamentos e Empréstimos

Em uma instalação existente, execute no SQL Editor do Supabase:

[`supabase/migrations/20260614_financings_and_loans.sql`](supabase/migrations/20260614_financings_and_loans.sql)

A migration adiciona `type`, `start_date`, `end_date`, `monthly_due_day` e
`estimated_rate` à tabela `financings`. Ela não remove nem altera contratos
existentes; registros antigos sem tipo são tratados como `other`.

O cadastro solicita nome, tipo, valor financiado líquido, saldo devedor atual
opcional, tipo da taxa, parcela e datas. O sistema calcula total de parcelas,
parcela atual, parcelas restantes, progresso e Taxa CET estimada. Quando a CET
não puder ser estimada com segurança, o contrato continua sendo salvo
normalmente.

Para aplicar os campos de CET, saldo atual e planos personalizados, execute:

[`supabase/migrations/20260614_financing_details_and_custom_plans.sql`](supabase/migrations/20260614_financing_details_and_custom_plans.sql)

Essa migration preserva os contratos existentes, preenche o valor financiado
líquido legado a partir do antigo saldo devedor e cria a tabela
`financing_custom_payments` com RLS. O cronograma detalhado representa apenas o
calendário previsto; não há cálculo de amortização.

## Atualização de Movimentações no Cartão

Execute no SQL Editor do Supabase:

[`supabase/migrations/20260614_transaction_credit_card_cash_flow.sql`](supabase/migrations/20260614_transaction_credit_card_cash_flow.sql)

A migration adiciona `credit_card_id` e `cash_flow_date` à tabela
`transactions`, preserva `transaction_date` como data original e preenche os
registros existentes com a própria data da movimentação. A associação com
cartões respeita o mesmo usuário e as políticas RLS existentes.

## Consolidação da V1

Execute obrigatoriamente no SQL Editor do Supabase:

[`supabase/migrations/20260615_v1_consolidation.sql`](supabase/migrations/20260615_v1_consolidation.sql)

Essa migration:

- adiciona `asset_type`, `notes` e `cash_outflow` em `investments`;
- cria `financial_plans`;
- cria `financing_payment_statuses`;
- habilita RLS e políticas de acesso por usuário nas novas tabelas.

O fluxo de caixa não utiliza saldo acumulado. A regra exibida é:

`Sobra de caixa = Entradas - Saídas - Investimentos realizados`

Upload de PDFs, integração bancária e inteligência artificial não fazem parte
desta versão.

## Contas e Eventos de Investimentos

Execute obrigatoriamente no SQL Editor do Supabase:

[`supabase/migrations/20260615_bank_accounts_and_investment_events.sql`](supabase/migrations/20260615_bank_accounts_and_investment_events.sql)

Essa migration aditiva:

- cria `bank_accounts`;
- adiciona `bank_account_id` em `transactions`;
- cria `account_transfers`;
- adiciona `initial_value` e `initial_date` em `investments`;
- cria `investment_contributions`;
- cria `investment_valuations`;
- habilita RLS e policies para cada usuário acessar somente seus registros.

Depois da migration, cadastre ao menos uma conta em **Contas e Fluxo de
Caixa**. Movimentações comuns passam a exigir uma conta. Compras no cartão de
crédito continuam exigindo o cartão e usam a data de vencimento da fatura no
fluxo.

O Caixa Centralizado é a soma dos saldos de `bank_accounts`. Receitas,
despesas, transferências e aportes atualizam esses saldos automaticamente.

A posição de um investimento é sempre calculada:

`Posição atual = valor informado manualmente pelo usuário`

Imóveis, veículos, participações em empresas e outros bens permanecem na área
de patrimônio e não impactam o fluxo de caixa.

## Simplificação de Investimentos

Execute no SQL Editor do Supabase:

[`supabase/migrations/20260615_simplify_investments.sql`](supabase/migrations/20260615_simplify_investments.sql)

Essa migration adiciona:

- `investments.current_position`;
- `investments.current_position_date`;
- `investment_contributions.impacts_cash_flow`.

A tabela legada `investment_valuations` não é apagada, preservando dados
existentes, mas novos registros de valorização não fazem mais parte da
interface. O histórico de movimentações usa `transaction_date`; somente o
fluxo de caixa utiliza `cash_flow_date`.
