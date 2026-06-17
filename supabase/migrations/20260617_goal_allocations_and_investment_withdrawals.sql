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
