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
