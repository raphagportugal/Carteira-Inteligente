# Checklist de Segurança Supabase/RLS

Este documento registra a auditoria de isolamento por usuário da Carteira Inteligente.

## Regra principal

Toda tabela com dados financeiros ou dados privados do usuário deve ter:

- coluna `user_id uuid not null references auth.users(id) on delete cascade`;
- RLS habilitado;
- policy usando `auth.uid() = user_id`;
- inserts sempre preenchendo `user_id` no servidor a partir da sessão autenticada;
- updates/deletes filtrando por `id` e `user_id`;
- vínculos entre tabelas sensíveis protegidos por `user_id` sempre que houver relação entre registros do usuário.

## Tabelas auditadas

- `transactions`
- `installments`
- `financings`
- `financing_custom_payments`
- `financing_payment_statuses`
- `goals`
- `goal_investment_allocations`
- `credit_cards`
- `monthly_bills`
- `investments`
- `investment_contributions`
- `investment_withdrawals`
- `investment_valuations`
- `income_forecasts`
- `financial_plans`
- `bank_accounts`
- `account_transfers`

## RLS e policies

Todas as tabelas acima devem manter policies no padrão:

```sql
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id)
```

A migration `20260623_security_rls_audit.sql` reaplica policies de forma idempotente e reforça constraints de mesmo usuário em relações críticas, como contas, cartões, investimentos, objetivos, financiamentos e eventos financeiros.

## Variáveis de ambiente

Permitidas no frontend:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Proibido no frontend:

- `SUPABASE_SERVICE_ROLE_KEY`
- qualquer chave com privilégios administrativos;
- secrets sem prefixo `NEXT_PUBLIC_` importados em componentes client.

A chave `service_role` não deve aparecer em arquivos `src/**`, `public/**` ou bundles client.

## Server Actions

Antes de qualquer operação financeira, a action deve:

- criar o client server do Supabase;
- chamar `supabase.auth.getUser()`;
- abortar se não houver usuário autenticado;
- validar campos obrigatórios;
- validar ownership de registros relacionados usando `.eq("user_id", user.id)`;
- inserir `user_id: user.id` no servidor;
- atualizar/deletar sempre com `.eq("id", id).eq("user_id", user.id)`.

## Checklist antes de publicar novas features financeiras

- A nova tabela tem `user_id`?
- RLS está habilitado?
- A policy impede acesso entre usuários?
- Inserts ignoram qualquer `user_id` vindo do client?
- Updates/deletes filtram por `id` e `user_id`?
- Relações com contas, cartões, objetivos, investimentos ou financiamentos validam ownership?
- A feature usa anon key com RLS, não service role?
- A tela autenticada não usa dados mockados misturados a dados reais?
- O README ou migrations explicam qualquer nova estrutura necessária?
- `npm run lint`, `npm run typecheck` e `npm run build` passam?
