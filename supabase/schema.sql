-- Carteira Inteligente - schema inicial
-- Execute este arquivo no SQL Editor do seu projeto Supabase.

create extension if not exists "pgcrypto";

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  description text not null check (char_length(trim(description)) > 0),
  amount numeric(14, 2) not null check (amount > 0),
  category text not null check (char_length(trim(category)) > 0),
  payment_method text not null check (char_length(trim(payment_method)) > 0),
  transaction_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  category text not null check (char_length(trim(category)) > 0),
  installment_amount numeric(14, 2) not null check (installment_amount > 0),
  current_installment integer not null check (current_installment > 0),
  total_installments integer not null check (total_installments > 0),
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  constraint installments_current_lte_total
    check (current_installment <= total_installments),
  constraint installments_dates_ordered check (end_date >= start_date)
);

create table if not exists public.financings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  outstanding_balance numeric(14, 2) not null check (outstanding_balance >= 0),
  monthly_payment numeric(14, 2) not null check (monthly_payment > 0),
  interest_rate numeric(8, 4) not null check (interest_rate >= 0),
  remaining_months integer not null check (remaining_months >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  target_amount numeric(14, 2) not null check (target_amount > 0),
  target_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);
create index if not exists installments_user_end_idx
  on public.installments (user_id, end_date);
create index if not exists financings_user_created_idx
  on public.financings (user_id, created_at desc);
create index if not exists goals_user_target_idx
  on public.goals (user_id, target_date);

alter table public.transactions enable row level security;
alter table public.installments enable row level security;
alter table public.financings enable row level security;
alter table public.goals enable row level security;

drop policy if exists "Users manage own transactions" on public.transactions;
create policy "Users manage own transactions"
  on public.transactions for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own installments" on public.installments;
create policy "Users manage own installments"
  on public.installments for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own financings" on public.financings;
create policy "Users manage own financings"
  on public.financings for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own goals" on public.goals;
create policy "Users manage own goals"
  on public.goals for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Módulo de cartões. Bloco aditivo e seguro para bancos já existentes.
create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  bank text not null check (char_length(trim(bank)) > 0),
  last_four_digits text not null check (last_four_digits ~ '^[0-9]{4}$'),
  closing_day integer not null check (closing_day between 1 and 31),
  due_day integer not null check (due_day between 1 and 31),
  created_at timestamptz not null default now()
);

alter table public.installments
  add column if not exists credit_card_id uuid
  references public.credit_cards(id) on delete restrict;

create table if not exists public.monthly_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  category text not null check (char_length(trim(category)) > 0),
  monthly_amount numeric(14, 2) not null check (monthly_amount > 0),
  payment_method text not null check (char_length(trim(payment_method)) > 0),
  due_day integer not null check (due_day between 1 and 31),
  start_date date not null,
  end_date date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  constraint monthly_bills_dates_ordered
    check (end_date is null or end_date >= start_date)
);

create index if not exists credit_cards_user_created_idx
  on public.credit_cards (user_id, created_at desc);
create unique index if not exists credit_cards_id_user_unique_idx
  on public.credit_cards (id, user_id);
create index if not exists installments_credit_card_idx
  on public.installments (credit_card_id);
create index if not exists monthly_bills_user_status_idx
  on public.monthly_bills (user_id, status, due_day);

alter table public.credit_cards enable row level security;
alter table public.monthly_bills enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'installments_credit_card_same_user'
  ) then
    alter table public.installments
      add constraint installments_credit_card_same_user
      foreign key (credit_card_id, user_id)
      references public.credit_cards (id, user_id)
      on delete restrict;
  end if;
end
$$;

drop policy if exists "Users manage own credit cards" on public.credit_cards;
create policy "Users manage own credit cards"
  on public.credit_cards for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own monthly bills" on public.monthly_bills;
create policy "Users manage own monthly bills"
  on public.monthly_bills for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Planejamento patrimonial. Migração aditiva para instalações existentes.
alter table public.installments
  add column if not exists purchase_date date,
  add column if not exists total_amount numeric(14, 2);

alter table public.goals
  add column if not exists category text not null default 'Outros',
  add column if not exists priority text not null default 'medium',
  add column if not exists status text not null default 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'goals_priority_values'
  ) then
    alter table public.goals
      add constraint goals_priority_values
      check (priority in ('low', 'medium', 'high'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'goals_status_values'
  ) then
    alter table public.goals
      add constraint goals_status_values
      check (status in ('active', 'completed', 'paused'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'installments_total_amount_positive'
  ) then
    alter table public.installments
      add constraint installments_total_amount_positive
      check (total_amount is null or total_amount > 0);
  end if;
end
$$;

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  type text not null check (
    type in (
      'emergency_reserve',
      'fixed_income',
      'stocks',
      'funds',
      'pension',
      'crypto',
      'other'
    )
  ),
  institution text not null check (char_length(trim(institution)) > 0),
  current_value numeric(14, 2) not null check (current_value >= 0),
  reference_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.income_forecasts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  expected_income numeric(14, 2) not null check (expected_income > 0),
  created_at timestamptz not null default now(),
  constraint income_forecasts_month_start
    check (extract(day from month) = 1),
  constraint income_forecasts_user_month_unique unique (user_id, month)
);

create index if not exists investments_user_reference_idx
  on public.investments (user_id, reference_date desc);
create index if not exists income_forecasts_user_month_idx
  on public.income_forecasts (user_id, month);
create index if not exists goals_user_priority_idx
  on public.goals (user_id, status, priority, target_date);

alter table public.investments enable row level security;
alter table public.income_forecasts enable row level security;

drop policy if exists "Users manage own investments" on public.investments;
create policy "Users manage own investments"
  on public.investments for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own income forecasts" on public.income_forecasts;
create policy "Users manage own income forecasts"
  on public.income_forecasts for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Evolução aditiva de financiamentos e empréstimos.
alter table public.financings
  add column if not exists type text not null default 'other',
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists monthly_due_day integer,
  add column if not exists estimated_rate numeric(8, 4);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'financings_type_values'
  ) then
    alter table public.financings
      add constraint financings_type_values
      check (type in ('property', 'car', 'motorcycle', 'personal_loan', 'other'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'financings_dates_ordered'
  ) then
    alter table public.financings
      add constraint financings_dates_ordered
      check (end_date is null or start_date is null or end_date >= start_date);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'financings_due_day_values'
  ) then
    alter table public.financings
      add constraint financings_due_day_values
      check (monthly_due_day is null or monthly_due_day between 1 and 31);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'financings_estimated_rate_positive'
  ) then
    alter table public.financings
      add constraint financings_estimated_rate_positive
      check (estimated_rate is null or estimated_rate >= 0);
  end if;
end
$$;

create index if not exists financings_user_end_date_idx
  on public.financings (user_id, end_date);

-- Dados contratuais e planos personalizados de financiamentos.
alter table public.financings
  add column if not exists financed_amount numeric(14, 2),
  add column if not exists current_outstanding_balance numeric(14, 2),
  add column if not exists rate_type text not null default 'unknown',
  add column if not exists rate_index text,
  add column if not exists estimated_monthly_rate numeric(8, 4);

update public.financings
set financed_amount = outstanding_balance
where financed_amount is null;

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'financings_type_values'
  ) then
    alter table public.financings drop constraint financings_type_values;
  end if;
  alter table public.financings
    add constraint financings_type_values
    check (type in (
      'property', 'car', 'motorcycle', 'personal_loan', 'custom_plan', 'other'
    ));
  if not exists (
    select 1 from pg_constraint where conname = 'financings_financed_amount_positive'
  ) then
    alter table public.financings
      add constraint financings_financed_amount_positive
      check (financed_amount is null or financed_amount > 0);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'financings_current_balance_positive'
  ) then
    alter table public.financings
      add constraint financings_current_balance_positive
      check (
        current_outstanding_balance is null or current_outstanding_balance >= 0
      );
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'financings_rate_type_values'
  ) then
    alter table public.financings
      add constraint financings_rate_type_values
      check (rate_type in ('fixed', 'variable', 'unknown'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'financings_rate_index_values'
  ) then
    alter table public.financings
      add constraint financings_rate_index_values
      check (rate_index is null or rate_index in ('ipca', 'igpm', 'cub', 'tr', 'other'));
  end if;
end
$$;

create table if not exists public.financing_custom_payments (
  id uuid primary key default gen_random_uuid(),
  financing_id uuid not null references public.financings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  due_date date not null,
  amount numeric(14, 2) not null check (amount > 0),
  description text not null check (char_length(trim(description)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists financing_custom_payments_user_date_idx
  on public.financing_custom_payments (user_id, due_date);
create unique index if not exists financings_id_user_unique_idx
  on public.financings (id, user_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'financing_custom_payments_same_user'
  ) then
    alter table public.financing_custom_payments
      add constraint financing_custom_payments_same_user
      foreign key (financing_id, user_id)
      references public.financings (id, user_id)
      on delete cascade;
  end if;
end
$$;

alter table public.financing_custom_payments enable row level security;

drop policy if exists "Users manage own financing custom payments"
  on public.financing_custom_payments;
create policy "Users manage own financing custom payments"
  on public.financing_custom_payments for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Data de impacto financeiro para movimentações no cartão de crédito.
alter table public.transactions
  add column if not exists credit_card_id uuid
    references public.credit_cards(id) on delete restrict,
  add column if not exists cash_flow_date date;

update public.transactions
set cash_flow_date = transaction_date
where cash_flow_date is null;

create index if not exists transactions_user_cash_flow_date_idx
  on public.transactions (user_id, cash_flow_date desc);
create index if not exists transactions_credit_card_idx
  on public.transactions (credit_card_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'transactions_credit_card_same_user'
  ) then
    alter table public.transactions
      add constraint transactions_credit_card_same_user
      foreign key (credit_card_id, user_id)
      references public.credit_cards (id, user_id)
      on delete restrict;
  end if;
end
$$;

-- Consolidação da V1: patrimônio, planejamento e baixa de parcelas.
alter table public.investments
  add column if not exists asset_type text,
  add column if not exists notes text,
  add column if not exists cash_outflow boolean not null default false;

create table if not exists public.financial_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  category text not null check (char_length(trim(category)) > 0),
  planned_amount numeric(14, 2) not null check (planned_amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, month, category)
);

create table if not exists public.financing_payment_statuses (
  id uuid primary key default gen_random_uuid(),
  financing_id uuid not null references public.financings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  due_date date not null,
  paid boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (financing_id, due_date)
);

alter table public.financial_plans enable row level security;
alter table public.financing_payment_statuses enable row level security;

drop policy if exists "Users manage own financial plans" on public.financial_plans;
create policy "Users manage own financial plans"
  on public.financial_plans for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own financing payment statuses"
  on public.financing_payment_statuses;
create policy "Users manage own financing payment statuses"
  on public.financing_payment_statuses for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Contas bancarias, transferencias e eventos de investimentos.
create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bank text not null,
  account_number text,
  balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.transactions
  add column if not exists bank_account_id uuid
    references public.bank_accounts(id) on delete restrict;

create table if not exists public.account_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_account_id uuid not null references public.bank_accounts(id) on delete restrict,
  destination_account_id uuid not null references public.bank_accounts(id) on delete restrict,
  amount numeric(14, 2) not null check (amount > 0),
  transfer_date date not null,
  created_at timestamptz not null default now(),
  check (source_account_id <> destination_account_id)
);

alter table public.investments
  add column if not exists initial_value numeric(14, 2),
  add column if not exists initial_date date;

create table if not exists public.investment_contributions (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  bank_account_id uuid not null references public.bank_accounts(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  contribution_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.investment_valuations (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14, 2) not null check (amount <> 0),
  valuation_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.bank_accounts enable row level security;
alter table public.account_transfers enable row level security;
alter table public.investment_contributions enable row level security;
alter table public.investment_valuations enable row level security;

drop policy if exists "Users manage own bank accounts" on public.bank_accounts;
create policy "Users manage own bank accounts"
  on public.bank_accounts for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own account transfers" on public.account_transfers;
create policy "Users manage own account transfers"
  on public.account_transfers for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own investment contributions" on public.investment_contributions;
create policy "Users manage own investment contributions"
  on public.investment_contributions for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own investment valuations" on public.investment_valuations;
create policy "Users manage own investment valuations"
  on public.investment_valuations for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Posicao atual manual e controle do impacto de aportes no caixa.
alter table public.investments
  add column if not exists current_position numeric(14, 2),
  add column if not exists current_position_date date;

alter table public.investment_contributions
  add column if not exists impacts_cash_flow boolean not null default true;

-- Ajustes finais V1: mensalidades pagas por movimentacao real.
alter table public.transactions
  add column if not exists monthly_bill_id uuid
    references public.monthly_bills(id) on delete set null;

alter table public.monthly_bills
  add column if not exists bank_account_id uuid
    references public.bank_accounts(id) on delete restrict,
  add column if not exists credit_card_id uuid
    references public.credit_cards(id) on delete restrict;

create index if not exists transactions_monthly_bill_idx
  on public.transactions (monthly_bill_id);

-- Objetivos vinculados a investimentos e saques de investimentos.
create table if not exists public.goal_investment_allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  investment_id uuid not null references public.investments(id) on delete cascade,
  allocated_amount numeric(14, 2) not null check (allocated_amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.investment_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  investment_id uuid not null references public.investments(id) on delete cascade,
  bank_account_id uuid not null references public.bank_accounts(id) on delete restrict,
  amount numeric(14, 2) not null check (amount > 0),
  resulting_position numeric(14, 2) not null check (resulting_position >= 0),
  withdrawal_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists goal_investment_allocations_user_goal_idx
  on public.goal_investment_allocations (user_id, goal_id);
create index if not exists goal_investment_allocations_investment_idx
  on public.goal_investment_allocations (investment_id);
create index if not exists investment_withdrawals_user_date_idx
  on public.investment_withdrawals (user_id, withdrawal_date desc);
create index if not exists investment_withdrawals_investment_idx
  on public.investment_withdrawals (investment_id);

alter table public.goal_investment_allocations enable row level security;
alter table public.investment_withdrawals enable row level security;

drop policy if exists "Users manage own goal investment allocations"
  on public.goal_investment_allocations;
create policy "Users manage own goal investment allocations"
  on public.goal_investment_allocations for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own investment withdrawals"
  on public.investment_withdrawals;
create policy "Users manage own investment withdrawals"
  on public.investment_withdrawals for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
