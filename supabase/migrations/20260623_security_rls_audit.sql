-- Security hardening for SaaS multi-tenant isolation.
-- Additive only: no data deletion and no schema drops.

create unique index if not exists monthly_bills_id_user_unique_idx
  on public.monthly_bills (id, user_id);
create unique index if not exists bank_accounts_id_user_unique_idx
  on public.bank_accounts (id, user_id);
create unique index if not exists investments_id_user_unique_idx
  on public.investments (id, user_id);
create unique index if not exists goals_id_user_unique_idx
  on public.goals (id, user_id);

alter table public.transactions enable row level security;
alter table public.installments enable row level security;
alter table public.financings enable row level security;
alter table public.goals enable row level security;
alter table public.credit_cards enable row level security;
alter table public.monthly_bills enable row level security;
alter table public.investments enable row level security;
alter table public.income_forecasts enable row level security;
alter table public.financing_custom_payments enable row level security;
alter table public.financial_plans enable row level security;
alter table public.financing_payment_statuses enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.account_transfers enable row level security;
alter table public.investment_contributions enable row level security;
alter table public.investment_valuations enable row level security;
alter table public.investment_withdrawals enable row level security;
alter table public.goal_investment_allocations enable row level security;

drop policy if exists "Users manage own transactions" on public.transactions;
create policy "Users manage own transactions"
  on public.transactions for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own installments" on public.installments;
create policy "Users manage own installments"
  on public.installments for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own financings" on public.financings;
create policy "Users manage own financings"
  on public.financings for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own goals" on public.goals;
create policy "Users manage own goals"
  on public.goals for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own credit cards" on public.credit_cards;
create policy "Users manage own credit cards"
  on public.credit_cards for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own monthly bills" on public.monthly_bills;
create policy "Users manage own monthly bills"
  on public.monthly_bills for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own investments" on public.investments;
create policy "Users manage own investments"
  on public.investments for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own income forecasts" on public.income_forecasts;
create policy "Users manage own income forecasts"
  on public.income_forecasts for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own financing custom payments" on public.financing_custom_payments;
create policy "Users manage own financing custom payments"
  on public.financing_custom_payments for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own financial plans" on public.financial_plans;
create policy "Users manage own financial plans"
  on public.financial_plans for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own financing payment statuses" on public.financing_payment_statuses;
create policy "Users manage own financing payment statuses"
  on public.financing_payment_statuses for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

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

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'transactions_bank_account_same_user') then
    alter table public.transactions
      add constraint transactions_bank_account_same_user
      foreign key (bank_account_id, user_id)
      references public.bank_accounts (id, user_id)
      on delete restrict
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'monthly_bills_bank_account_same_user') then
    alter table public.monthly_bills
      add constraint monthly_bills_bank_account_same_user
      foreign key (bank_account_id, user_id)
      references public.bank_accounts (id, user_id)
      on delete restrict
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'monthly_bills_credit_card_same_user') then
    alter table public.monthly_bills
      add constraint monthly_bills_credit_card_same_user
      foreign key (credit_card_id, user_id)
      references public.credit_cards (id, user_id)
      on delete restrict
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'account_transfers_source_same_user') then
    alter table public.account_transfers
      add constraint account_transfers_source_same_user
      foreign key (source_account_id, user_id)
      references public.bank_accounts (id, user_id)
      on delete restrict
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'account_transfers_destination_same_user') then
    alter table public.account_transfers
      add constraint account_transfers_destination_same_user
      foreign key (destination_account_id, user_id)
      references public.bank_accounts (id, user_id)
      on delete restrict
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'financing_payment_statuses_same_user') then
    alter table public.financing_payment_statuses
      add constraint financing_payment_statuses_same_user
      foreign key (financing_id, user_id)
      references public.financings (id, user_id)
      on delete cascade
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'investment_contributions_investment_same_user') then
    alter table public.investment_contributions
      add constraint investment_contributions_investment_same_user
      foreign key (investment_id, user_id)
      references public.investments (id, user_id)
      on delete cascade
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'investment_contributions_bank_account_same_user') then
    alter table public.investment_contributions
      add constraint investment_contributions_bank_account_same_user
      foreign key (bank_account_id, user_id)
      references public.bank_accounts (id, user_id)
      on delete restrict
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'investment_valuations_investment_same_user') then
    alter table public.investment_valuations
      add constraint investment_valuations_investment_same_user
      foreign key (investment_id, user_id)
      references public.investments (id, user_id)
      on delete cascade
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'investment_withdrawals_investment_same_user') then
    alter table public.investment_withdrawals
      add constraint investment_withdrawals_investment_same_user
      foreign key (investment_id, user_id)
      references public.investments (id, user_id)
      on delete cascade
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'investment_withdrawals_bank_account_same_user') then
    alter table public.investment_withdrawals
      add constraint investment_withdrawals_bank_account_same_user
      foreign key (bank_account_id, user_id)
      references public.bank_accounts (id, user_id)
      on delete restrict
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'goal_investment_allocations_goal_same_user') then
    alter table public.goal_investment_allocations
      add constraint goal_investment_allocations_goal_same_user
      foreign key (goal_id, user_id)
      references public.goals (id, user_id)
      on delete cascade
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'goal_investment_allocations_investment_same_user') then
    alter table public.goal_investment_allocations
      add constraint goal_investment_allocations_investment_same_user
      foreign key (investment_id, user_id)
      references public.investments (id, user_id)
      on delete cascade
      not valid;
  end if;
end
$$;
