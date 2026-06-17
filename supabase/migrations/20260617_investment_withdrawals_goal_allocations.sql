alter table public.investment_contributions
  add column if not exists transaction_id uuid
    references public.transactions(id) on delete set null,
  add column if not exists description text;

create table if not exists public.investment_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  investment_id uuid not null references public.investments(id) on delete cascade,
  bank_account_id uuid not null references public.bank_accounts(id) on delete restrict,
  transaction_id uuid references public.transactions(id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  previous_position numeric(14, 2) not null check (previous_position >= 0),
  resulting_position numeric(14, 2) not null check (resulting_position >= 0),
  withdrawal_date date not null,
  allocation_snapshot jsonb not null default '[]'::jsonb,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.goal_investment_allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  investment_id uuid not null references public.investments(id) on delete cascade,
  allocated_amount numeric(14, 2) not null check (allocated_amount >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, goal_id, investment_id)
);

create index if not exists investment_contributions_transaction_idx
  on public.investment_contributions (transaction_id);
create index if not exists investment_withdrawals_transaction_idx
  on public.investment_withdrawals (transaction_id);
create index if not exists investment_withdrawals_investment_idx
  on public.investment_withdrawals (investment_id);
create index if not exists goal_investment_allocations_goal_idx
  on public.goal_investment_allocations (goal_id);
create index if not exists goal_investment_allocations_investment_idx
  on public.goal_investment_allocations (investment_id);

alter table public.investment_withdrawals enable row level security;
alter table public.goal_investment_allocations enable row level security;

drop policy if exists "Users manage own investment withdrawals" on public.investment_withdrawals;
create policy "Users manage own investment withdrawals"
  on public.investment_withdrawals for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own goal investment allocations" on public.goal_investment_allocations;
create policy "Users manage own goal investment allocations"
  on public.goal_investment_allocations for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
