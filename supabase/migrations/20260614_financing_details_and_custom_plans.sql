-- Detalhes contratuais, CET e planos personalizados.
-- Migração aditiva e compatível com registros existentes.

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
