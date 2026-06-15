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
