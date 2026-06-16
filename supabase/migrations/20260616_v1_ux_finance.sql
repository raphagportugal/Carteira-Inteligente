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
