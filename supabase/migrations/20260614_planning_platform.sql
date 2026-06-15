-- Carteira Inteligente: planejamento financeiro e patrimônio.
-- Migração aditiva. Não remove nem sobrescreve registros existentes.

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
    alter table public.goals add constraint goals_priority_values
      check (priority in ('low', 'medium', 'high'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'goals_status_values'
  ) then
    alter table public.goals add constraint goals_status_values
      check (status in ('active', 'completed', 'paused'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'installments_total_amount_positive'
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
      'emergency_reserve', 'fixed_income', 'stocks', 'funds',
      'pension', 'crypto', 'other'
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
  constraint income_forecasts_month_start check (extract(day from month) = 1),
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

drop policy if exists "Users manage own income forecasts"
  on public.income_forecasts;
create policy "Users manage own income forecasts"
  on public.income_forecasts for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
