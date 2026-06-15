-- Financiamentos e Empréstimos
-- Migração aditiva: preserva todos os contratos existentes.

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
