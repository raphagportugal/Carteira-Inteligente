-- Movimentações no cartão de crédito e data de impacto no fluxo de caixa.
-- Migração aditiva e compatível com registros existentes.

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
