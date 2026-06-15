alter table public.investments
  add column if not exists current_position numeric(14, 2),
  add column if not exists current_position_date date;

alter table public.investment_contributions
  add column if not exists impacts_cash_flow boolean not null default true;
