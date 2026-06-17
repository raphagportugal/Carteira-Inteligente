"use server";

import { revalidatePath } from "next/cache";
import {
  BANKS,
  CREDIT_CARD_PAYMENT_METHOD,
  EXPENSE_CATEGORIES,
  FINANCIAL_CATEGORIES,
  INCOME_CATEGORIES,
  FINANCING_RATE_INDEXES,
  FINANCING_RATE_TYPES,
  FINANCING_TYPES,
  GOAL_PRIORITIES,
  GOAL_STATUSES,
  INVESTMENT_TYPES,
  MONTHLY_BILL_STATUSES,
  PAYMENT_METHODS,
  UNCATEGORIZED,
} from "@/lib/finance/catalogs";
import {
  buildMonthlyFinancingSchedule,
  estimateCet,
} from "@/lib/finance/financing";
import { buildInstallmentSchedule } from "@/lib/finance/installment-schedule";
import { calculateCreditCardCashFlowDate } from "@/lib/finance/transaction-cash-flow";
import { createClient } from "@/lib/supabase/server";

export type ActionResult =
  | { success: true }
  | { success: false; message: string };

const validTransactionTypes = new Set(["income", "expense"]);
const validCategories = new Set<string>(FINANCIAL_CATEGORIES);
const validIncomeCategories = new Set<string>(INCOME_CATEGORIES);
const validExpenseCategories = new Set<string>(EXPENSE_CATEGORIES);
const validPaymentMethods = new Set<string>(PAYMENT_METHODS);
const validMonthlyBillStatuses = new Set<string>(
  MONTHLY_BILL_STATUSES.map((status) => status.value),
);
const validGoalPriorities = new Set<string>(
  GOAL_PRIORITIES.map((item) => item.value),
);
const validGoalStatuses = new Set<string>(
  GOAL_STATUSES.map((item) => item.value),
);
const validInvestmentTypes = new Set<string>(
  INVESTMENT_TYPES.map((item) => item.value),
);
const validFinancingTypes = new Set<string>(
  FINANCING_TYPES.map((item) => item.value),
);
const validFinancingRateTypes = new Set<string>(
  FINANCING_RATE_TYPES.map((item) => item.value),
);
const validFinancingRateIndexes = new Set<string>(
  FINANCING_RATE_INDEXES.map((item) => item.value),
);
const validBanks = new Set<string>(BANKS);
const INVESTMENT_CONTRIBUTION_CATEGORY = "Investimentos";
const INVESTMENT_WITHDRAWAL_CATEGORY = "Saque de Investimento";
const TRANSFER_PAYMENT_METHOD =
  PAYMENT_METHODS.find((method) => method.includes("Transfer")) ?? "TransferÃªncia";

function requiredText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function positiveNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function nonNegativeNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function optionalNonNegativeNumber(formData: FormData, key: string) {
  const raw = requiredText(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function positiveInteger(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isInteger(value) && value > 0 ? value : null;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function dayOfMonth(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isInteger(value) && value >= 1 && value <= 31 ? value : null;
}

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

function revalidateFinancialPages() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/fluxo-de-caixa");
  revalidatePath("/dashboard/parcelamentos");
  revalidatePath("/dashboard/financiamentos");
  revalidatePath("/dashboard/cartoes");
  revalidatePath("/dashboard/mensalidades");
  revalidatePath("/dashboard/objetivos");
  revalidatePath("/dashboard/investimentos");
  revalidatePath("/dashboard/planejamento");
  revalidatePath("/dashboard/movimentacoes");
}

function databaseError(message: string) {
  console.error(message);
  return {
    success: false,
    message: `Não foi possível concluir. Detalhe: ${message}`,
  } satisfies ActionResult;
}

async function adjustAccountBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  accountId: string,
  delta: number,
) {
  const { data: account, error } = await supabase
    .from("bank_accounts")
    .select("balance")
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !account) return false;
  const nextBalance = Number(account.balance) + delta;
  const { error: updateError } = await supabase
    .from("bank_accounts")
    .update({ balance: nextBalance })
    .eq("id", accountId)
    .eq("user_id", userId);
  return !updateError;
}

function transactionBalanceEffect(transaction: {
  type: string;
  amount: number;
  bank_account_id: string | null;
}) {
  if (!transaction.bank_account_id) return 0;
  return transaction.type === "income"
    ? Number(transaction.amount)
    : -Number(transaction.amount);
}

function normalizedCategory(formData: FormData, key: string) {
  return requiredText(formData, key) || UNCATEGORIZED;
}

async function transactionPayload(
  formData: FormData,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const type = requiredText(formData, "type");
  const description = requiredText(formData, "description");
  const amount = positiveNumber(formData, "amount");
  const category = normalizedCategory(formData, "category");
  const paymentMethod = requiredText(formData, "payment_method");
  const transactionDate = requiredText(formData, "transaction_date");
  const creditCardId = requiredText(formData, "credit_card_id");
  const bankAccountId = requiredText(formData, "bank_account_id");
  const monthlyBillId = requiredText(formData, "monthly_bill_id");
  const usesCreditCard =
    type === "expense" && paymentMethod === CREDIT_CARD_PAYMENT_METHOD;

  if (
    !validTransactionTypes.has(type) ||
    !description ||
    description.length > 120 ||
    amount === null ||
    !validCategories.has(category) ||
    (type === "income" && category !== UNCATEGORIZED && !validIncomeCategories.has(category)) ||
    (type === "expense" && category !== UNCATEGORIZED && !validExpenseCategories.has(category)) ||
    !validPaymentMethods.has(paymentMethod) ||
    !validDate(transactionDate) ||
    (usesCreditCard && !creditCardId) ||
    (!usesCreditCard && !bankAccountId)
  ) {
    return null;
  }

  if (monthlyBillId) {
    const { data: bill, error } = await supabase
      .from("monthly_bills")
      .select("id")
      .eq("id", monthlyBillId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !bill) return null;
  }

  let cashFlowDate = transactionDate;
  if (usesCreditCard) {
    const { data: card, error } = await supabase
      .from("credit_cards")
      .select("id, closing_day, due_day")
      .eq("id", creditCardId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !card) return null;
    cashFlowDate = calculateCreditCardCashFlowDate(transactionDate, card);
  } else {
    const { data: account, error } = await supabase
      .from("bank_accounts")
      .select("id")
      .eq("id", bankAccountId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !account) return null;
  }

  return {
    type,
    description,
    amount,
    category,
    payment_method: paymentMethod,
    transaction_date: transactionDate,
    credit_card_id: usesCreditCard ? creditCardId : null,
    bank_account_id: usesCreditCard ? null : bankAccountId,
    monthly_bill_id: monthlyBillId || null,
    cash_flow_date: cashFlowDate,
  };
}

type FinancialClient = Awaited<ReturnType<typeof createClient>>;

type InvestmentEventOptions = {
  supabase: FinancialClient;
  userId: string;
  investmentId: string;
  bankAccountId: string;
  amount: number;
  date: string;
  description?: string;
  transactionId?: string;
  accountAlreadyAdjusted?: boolean;
};

async function currentInvestmentPosition(
  supabase: FinancialClient,
  userId: string,
  investmentId: string,
) {
  const { data, error } = await supabase
    .from("investments")
    .select("id, name, current_position, current_value")
    .eq("id", investmentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id as string,
    name: data.name as string,
    position: Number(data.current_position ?? data.current_value ?? 0),
  };
}

async function createInvestmentContributionEvent({
  supabase,
  userId,
  investmentId,
  bankAccountId,
  amount,
  date,
  description,
  transactionId,
  accountAlreadyAdjusted = false,
}: InvestmentEventOptions): Promise<ActionResult> {
  const investment = await currentInvestmentPosition(supabase, userId, investmentId);
  const { data: account, error: accountError } = await supabase
    .from("bank_accounts")
    .select("id")
    .eq("id", bankAccountId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!investment || accountError || !account) {
    return { success: false, message: "Investimento ou conta invÃ¡lida." };
  }

  if (!accountAlreadyAdjusted && !(await adjustAccountBalance(supabase, userId, bankAccountId, -amount))) {
    return databaseError("Unable to debit contribution account.");
  }

  const { data: contribution, error } = await supabase
    .from("investment_contributions")
    .insert({
      investment_id: investmentId,
      bank_account_id: bankAccountId,
      user_id: userId,
      transaction_id: transactionId ?? null,
      amount,
      contribution_date: date,
      impacts_cash_flow: true,
      description: description || null,
    })
    .select("id")
    .single();
  if (error) {
    if (!accountAlreadyAdjusted) await adjustAccountBalance(supabase, userId, bankAccountId, amount);
    return databaseError(`Unable to create investment contribution: ${error.message}`);
  }

  const nextPosition = investment.position + amount;
  const { error: positionError } = await supabase
    .from("investments")
    .update({
      current_position: nextPosition,
      current_position_date: date,
      current_value: nextPosition,
      reference_date: date,
    })
    .eq("id", investmentId)
    .eq("user_id", userId);
  if (positionError) {
    await supabase.from("investment_contributions").delete().eq("id", contribution.id).eq("user_id", userId);
    if (!accountAlreadyAdjusted) await adjustAccountBalance(supabase, userId, bankAccountId, amount);
    return databaseError(`Unable to update investment position: ${positionError.message}`);
  }
  return { success: true };
}

async function createInvestmentWithdrawalEvent({
  supabase,
  userId,
  investmentId,
  bankAccountId,
  amount,
  date,
  description,
  transactionId,
  accountAlreadyAdjusted = false,
  resultingPosition,
}: InvestmentEventOptions & { resultingPosition: number }): Promise<ActionResult> {
  const investment = await currentInvestmentPosition(supabase, userId, investmentId);
  const { data: account, error: accountError } = await supabase
    .from("bank_accounts")
    .select("id")
    .eq("id", bankAccountId)
    .eq("user_id", userId)
    .maybeSingle();
  const { data: allocations, error: allocationsError } = await supabase
    .from("goal_investment_allocations")
    .select("goal_id, investment_id, allocated_amount")
    .eq("investment_id", investmentId)
    .eq("user_id", userId);
  if (!investment || accountError || !account) {
    return { success: false, message: "Investimento ou conta invÃ¡lida." };
  }
  if (allocationsError) return databaseError(`Unable to load goal allocations: ${allocationsError.message}`);
  if (resultingPosition > investment.position) {
    return { success: false, message: "A nova posiÃ§Ã£o nÃ£o pode ser maior que a posiÃ§Ã£o atual do investimento." };
  }

  if (!accountAlreadyAdjusted && !(await adjustAccountBalance(supabase, userId, bankAccountId, amount))) {
    return databaseError("Unable to credit withdrawal account.");
  }

  const allocationSnapshot = (allocations ?? []).map((allocation) => ({
    goal_id: allocation.goal_id,
    investment_id: allocation.investment_id,
    allocated_amount: Number(allocation.allocated_amount),
  }));
  const { data: withdrawal, error } = await supabase
    .from("investment_withdrawals")
    .insert({
      investment_id: investmentId,
      bank_account_id: bankAccountId,
      user_id: userId,
      transaction_id: transactionId ?? null,
      amount,
      previous_position: investment.position,
      resulting_position: resultingPosition,
      withdrawal_date: date,
      allocation_snapshot: allocationSnapshot,
      description: description || null,
    })
    .select("id")
    .single();
  if (error) {
    if (!accountAlreadyAdjusted) await adjustAccountBalance(supabase, userId, bankAccountId, -amount);
    return databaseError(`Unable to create investment withdrawal: ${error.message}`);
  }

  const { error: positionError } = await supabase
    .from("investments")
    .update({
      current_position: resultingPosition,
      current_position_date: date,
      current_value: resultingPosition,
      reference_date: date,
    })
    .eq("id", investmentId)
    .eq("user_id", userId);
  if (positionError) {
    await supabase.from("investment_withdrawals").delete().eq("id", withdrawal.id).eq("user_id", userId);
    if (!accountAlreadyAdjusted) await adjustAccountBalance(supabase, userId, bankAccountId, -amount);
    return databaseError(`Unable to update investment position: ${positionError.message}`);
  }

  const ratio = investment.position > 0 ? Math.max(0, Math.min(1, resultingPosition / investment.position)) : 0;
  const allocationResults = await Promise.all(
    (allocations ?? []).map((allocation) => {
      const nextAmount = Math.round(Number(allocation.allocated_amount) * ratio * 100) / 100;
      if (nextAmount <= 0) {
        return supabase
          .from("goal_investment_allocations")
          .delete()
          .eq("goal_id", allocation.goal_id)
          .eq("investment_id", investmentId)
          .eq("user_id", userId);
      }
      return supabase
        .from("goal_investment_allocations")
        .update({ allocated_amount: nextAmount })
        .eq("goal_id", allocation.goal_id)
        .eq("investment_id", investmentId)
        .eq("user_id", userId);
    }),
  );
  const allocationError = allocationResults.find((result) => result.error)?.error;
  if (allocationError) {
    await supabase.from("investment_withdrawals").delete().eq("id", withdrawal.id).eq("user_id", userId);
    await supabase
      .from("investments")
      .update({ current_position: investment.position, current_value: investment.position })
      .eq("id", investmentId)
      .eq("user_id", userId);
    if (!accountAlreadyAdjusted) await adjustAccountBalance(supabase, userId, bankAccountId, -amount);
    return databaseError(`Unable to update goal allocations: ${allocationError.message}`);
  }

  return { success: true };
}

async function enforceInvestmentAllocationLimit(
  supabase: FinancialClient,
  userId: string,
  investmentId: string,
  currentPosition: number,
): Promise<ActionResult> {
  const positionLimit = Math.max(0, Math.round(currentPosition * 100) / 100);
  const { data: allocations, error } = await supabase
    .from("goal_investment_allocations")
    .select("id, allocated_amount, created_at")
    .eq("investment_id", investmentId)
    .eq("user_id", userId);

  if (error) return databaseError(`Unable to revalidate goal allocations: ${error.message}`);

  const totalAllocated = (allocations ?? []).reduce(
    (sum, allocation) => sum + Number(allocation.allocated_amount),
    0,
  );
  let excess = Math.round((totalAllocated - positionLimit) * 100) / 100;
  if (excess <= 0) return { success: true };

  const newestFirst = [...(allocations ?? [])].sort(
    (a, b) => Date.parse(String(b.created_at)) - Date.parse(String(a.created_at)),
  );

  for (const allocation of newestFirst) {
    if (excess <= 0) break;

    const amount = Number(allocation.allocated_amount);
    const reduction = Math.min(amount, excess);
    const nextAmount = Math.round((amount - reduction) * 100) / 100;

    if (nextAmount <= 0) {
      const { error: deleteError } = await supabase
        .from("goal_investment_allocations")
        .delete()
        .eq("id", allocation.id)
        .eq("user_id", userId);
      if (deleteError) return databaseError(`Unable to reduce goal allocation: ${deleteError.message}`);
    } else {
      const { error: updateError } = await supabase
        .from("goal_investment_allocations")
        .update({ allocated_amount: nextAmount })
        .eq("id", allocation.id)
        .eq("user_id", userId);
      if (updateError) return databaseError(`Unable to reduce goal allocation: ${updateError.message}`);
    }

    excess = Math.round((excess - reduction) * 100) / 100;
  }

  return { success: true };
}

async function deleteInvestmentContributionEvent(
  supabase: FinancialClient,
  userId: string,
  id: string,
  accountAlreadyAdjusted = false,
): Promise<ActionResult> {
  const { data: contribution, error } = await supabase
    .from("investment_contributions")
    .select("*, investments(current_position, current_value)")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return databaseError(`Unable to load investment contribution: ${error.message}`);
  if (!contribution) return { success: false, message: "Aporte nÃ£o encontrado." };
  const currentPosition = Number(contribution.investments?.current_position ?? contribution.investments?.current_value ?? 0);
  if (!accountAlreadyAdjusted && !(await adjustAccountBalance(supabase, userId, contribution.bank_account_id, Number(contribution.amount)))) {
    return databaseError("Unable to restore contribution account.");
  }
  const { error: deleteError } = await supabase
    .from("investment_contributions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (deleteError) {
    if (!accountAlreadyAdjusted) await adjustAccountBalance(supabase, userId, contribution.bank_account_id, -Number(contribution.amount));
    return databaseError(`Unable to delete investment contribution: ${deleteError.message}`);
  }
  const nextPosition = Math.max(0, currentPosition - Number(contribution.amount));
  const { error: positionError } = await supabase
    .from("investments")
    .update({ current_position: nextPosition, current_value: nextPosition })
    .eq("id", contribution.investment_id)
    .eq("user_id", userId);
  if (positionError) return databaseError(`Unable to restore investment position: ${positionError.message}`);
  const allocationResult = await enforceInvestmentAllocationLimit(
    supabase,
    userId,
    contribution.investment_id,
    nextPosition,
  );
  if (!allocationResult.success) return allocationResult;
  return { success: true };
}

async function deleteInvestmentWithdrawalEvent(
  supabase: FinancialClient,
  userId: string,
  id: string,
  accountAlreadyAdjusted = false,
): Promise<ActionResult> {
  const { data: withdrawal, error } = await supabase
    .from("investment_withdrawals")
    .select("*, investments(current_position, current_value)")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return databaseError(`Unable to load investment withdrawal: ${error.message}`);
  if (!withdrawal) return { success: false, message: "Saque nÃ£o encontrado." };
  if (!accountAlreadyAdjusted && !(await adjustAccountBalance(supabase, userId, withdrawal.bank_account_id, -Number(withdrawal.amount)))) {
    return databaseError("Unable to reverse withdrawal account.");
  }

  const { error: deleteAllocationsError } = await supabase
    .from("goal_investment_allocations")
    .delete()
    .eq("investment_id", withdrawal.investment_id)
    .eq("user_id", userId);
  if (deleteAllocationsError) return databaseError(`Unable to reset goal allocations: ${deleteAllocationsError.message}`);

  const snapshot = Array.isArray(withdrawal.allocation_snapshot)
    ? withdrawal.allocation_snapshot as Array<{ goal_id: string; investment_id: string; allocated_amount: number }>
    : [];
  if (snapshot.length > 0) {
    const { error: restoreAllocationsError } = await supabase
      .from("goal_investment_allocations")
      .upsert(
        snapshot.map((allocation) => ({
          user_id: userId,
          goal_id: allocation.goal_id,
          investment_id: allocation.investment_id,
          allocated_amount: allocation.allocated_amount,
        })),
        { onConflict: "user_id,goal_id,investment_id" },
      );
    if (restoreAllocationsError) return databaseError(`Unable to restore goal allocations: ${restoreAllocationsError.message}`);
  }

  const { error: deleteError } = await supabase
    .from("investment_withdrawals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (deleteError) return databaseError(`Unable to delete investment withdrawal: ${deleteError.message}`);

  const currentPosition = Number(
    withdrawal.investments?.current_position ?? withdrawal.investments?.current_value ?? 0,
  );
  const restoredPosition =
    withdrawal.previous_position === null || typeof withdrawal.previous_position === "undefined"
      ? currentPosition + Number(withdrawal.amount)
      : Number(withdrawal.previous_position);

  const { error: positionError } = await supabase
    .from("investments")
    .update({
      current_position: restoredPosition,
      current_value: restoredPosition,
    })
    .eq("id", withdrawal.investment_id)
    .eq("user_id", userId);
  if (positionError) return databaseError(`Unable to restore investment position: ${positionError.message}`);
  const allocationResult = await enforceInvestmentAllocationLimit(
    supabase,
    userId,
    withdrawal.investment_id,
    restoredPosition,
  );
  if (!allocationResult.success) return allocationResult;
  return { success: true };
}

export async function createTransaction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const payload = await transactionPayload(formData, supabase, user.id);
  if (!payload) {
    return { success: false, message: "Revise os dados e selecione um cartÃ£o vÃ¡lido quando necessÃ¡rio." };
  }

  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({ ...payload, user_id: user.id })
    .select("id")
    .single();

  if (error) return databaseError(`Unable to create transaction: ${error.message}`);
  if (
    payload.bank_account_id &&
    !(await adjustAccountBalance(
      supabase,
      user.id,
      payload.bank_account_id,
      transactionBalanceEffect(payload),
    ))
  ) {
    await supabase.from("transactions").delete().eq("id", transaction.id);
    return databaseError("Unable to update account balance after transaction.");
  }
  if (payload.category === INVESTMENT_CONTRIBUTION_CATEGORY && payload.type === "expense") {
    const investmentId = requiredText(formData, "investment_id");
    if (!investmentId || !payload.bank_account_id) {
      if (payload.bank_account_id) await adjustAccountBalance(supabase, user.id, payload.bank_account_id, -transactionBalanceEffect(payload));
      await supabase.from("transactions").delete().eq("id", transaction.id);
      return { success: false, message: "Selecione o investimento relacionado ao aporte." };
    }
    const result = await createInvestmentContributionEvent({
      supabase,
      userId: user.id,
      investmentId,
      bankAccountId: payload.bank_account_id,
      amount: Number(payload.amount),
      date: payload.transaction_date,
      description: payload.description,
      transactionId: transaction.id,
      accountAlreadyAdjusted: true,
    });
    if (!result.success) {
      await adjustAccountBalance(supabase, user.id, payload.bank_account_id, -transactionBalanceEffect(payload));
      await supabase.from("transactions").delete().eq("id", transaction.id);
      return result;
    }
  }
  if (payload.category === INVESTMENT_WITHDRAWAL_CATEGORY && payload.type === "income") {
    const investmentId = requiredText(formData, "investment_id");
    const resultingPosition = nonNegativeNumber(formData, "resulting_position");
    if (!investmentId || resultingPosition === null || !payload.bank_account_id) {
      if (payload.bank_account_id) await adjustAccountBalance(supabase, user.id, payload.bank_account_id, -transactionBalanceEffect(payload));
      await supabase.from("transactions").delete().eq("id", transaction.id);
      return { success: false, message: "Informe o investimento e a nova posiÃ§Ã£o apÃ³s o saque." };
    }
    const result = await createInvestmentWithdrawalEvent({
      supabase,
      userId: user.id,
      investmentId,
      bankAccountId: payload.bank_account_id,
      amount: Number(payload.amount),
      resultingPosition,
      date: payload.transaction_date,
      description: payload.description,
      transactionId: transaction.id,
      accountAlreadyAdjusted: true,
    });
    if (!result.success) {
      await adjustAccountBalance(supabase, user.id, payload.bank_account_id, -transactionBalanceEffect(payload));
      await supabase.from("transactions").delete().eq("id", transaction.id);
      return result;
    }
  }
  revalidateFinancialPages();
  return { success: true };
}

export async function updateTransaction(formData: FormData): Promise<ActionResult> {
  const id = requiredText(formData, "id");
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const payload = await transactionPayload(formData, supabase, user.id);
  if (!id || !payload) {
    return { success: false, message: "Revise os dados e selecione um cartÃ£o vÃ¡lido quando necessÃ¡rio." };
  }

  const { data: previous } = await supabase
    .from("transactions")
    .select("id, type, amount, category, bank_account_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!previous) return { success: false, message: "MovimentaÃ§Ã£o nÃ£o encontrada." };

  const { error } = await supabase
    .from("transactions")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return databaseError(`Unable to update transaction: ${error.message}`);
  if (
    previous.bank_account_id &&
    !(await adjustAccountBalance(
      supabase,
      user.id,
      previous.bank_account_id,
      -transactionBalanceEffect(previous),
    ))
  ) return databaseError("Unable to reverse previous account balance.");
  if (
    payload.bank_account_id &&
    !(await adjustAccountBalance(
      supabase,
      user.id,
      payload.bank_account_id,
      transactionBalanceEffect(payload),
    ))
  ) return databaseError("Unable to apply updated account balance.");
  revalidateFinancialPages();
  return { success: true };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  if (!id) return { success: false, message: "MovimentaÃ§Ã£o invÃ¡lida." };

  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };

  const { data: previous } = await supabase
    .from("transactions")
    .select("id, type, amount, category, bank_account_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!previous) return { success: false, message: "MovimentaÃ§Ã£o nÃ£o encontrada." };
  if (
    previous.bank_account_id &&
    !(await adjustAccountBalance(
      supabase,
      user.id,
      previous.bank_account_id,
      -transactionBalanceEffect(previous),
    ))
  ) return databaseError("Unable to reverse account balance before deletion.");

  if (previous.category === INVESTMENT_CONTRIBUTION_CATEGORY && previous.type === "expense") {
    const { data: contribution } = await supabase
      .from("investment_contributions")
      .select("id")
      .eq("transaction_id", previous.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (contribution) {
      const result = await deleteInvestmentContributionEvent(supabase, user.id, contribution.id, true);
      if (!result.success) {
        if (previous.bank_account_id) {
          await adjustAccountBalance(
            supabase,
            user.id,
            previous.bank_account_id,
            transactionBalanceEffect(previous),
          );
        }
        return result;
      }
    }
  }
  if (previous.category === INVESTMENT_WITHDRAWAL_CATEGORY && previous.type === "income") {
    const { data: withdrawal } = await supabase
      .from("investment_withdrawals")
      .select("id")
      .eq("transaction_id", previous.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (withdrawal) {
      const result = await deleteInvestmentWithdrawalEvent(supabase, user.id, withdrawal.id, true);
      if (!result.success) {
        if (previous.bank_account_id) {
          await adjustAccountBalance(
            supabase,
            user.id,
            previous.bank_account_id,
            transactionBalanceEffect(previous),
          );
        }
        return result;
      }
    }
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    if (previous.bank_account_id) {
      await adjustAccountBalance(
        supabase,
        user.id,
        previous.bank_account_id,
        transactionBalanceEffect(previous),
      );
    }
    return databaseError(`Unable to delete transaction: ${error.message}`);
  }
  revalidateFinancialPages();
  return { success: true };
}

async function installmentPayload(
  formData: FormData,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const description = requiredText(formData, "description");
  const category = requiredText(formData, "category");
  const creditCardId = requiredText(formData, "credit_card_id");
  const purchaseDate = requiredText(formData, "purchase_date");
  const totalAmount = positiveNumber(formData, "total_amount");
  const totalInstallments = positiveInteger(formData, "total_installments");

  if (
    !description ||
    !validCategories.has(category) ||
    !creditCardId ||
    !validDate(purchaseDate) ||
    totalAmount === null ||
    totalInstallments === null ||
    totalInstallments > 120
  ) {
    return null;
  }

  const { data: card, error } = await supabase
    .from("credit_cards")
    .select("id, closing_day, due_day")
    .eq("id", creditCardId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !card) return null;

  const schedule = buildInstallmentSchedule({
    purchaseDate,
    totalAmount,
    totalInstallments,
    closingDay: card.closing_day,
    dueDay: card.due_day,
  });

  return {
    name: description,
    category,
    credit_card_id: creditCardId,
    purchase_date: purchaseDate,
    total_amount: totalAmount,
    installment_amount: schedule[0].amount,
    current_installment: 1,
    total_installments: totalInstallments,
    start_date: schedule[0].dueDate,
    end_date: schedule[schedule.length - 1].dueDate,
  };
}

export async function createInstallment(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const payload = await installmentPayload(formData, supabase, user.id);
  if (!payload) {
    return { success: false, message: "Revise os dados da compra e o cartÃ£o selecionado." };
  }

  const { error } = await supabase
    .from("installments")
    .insert({ ...payload, user_id: user.id });

  if (error) return databaseError(`Unable to create installment: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function updateInstallment(formData: FormData): Promise<ActionResult> {
  const id = requiredText(formData, "id");
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const payload = await installmentPayload(formData, supabase, user.id);
  if (!id || !payload) {
    return { success: false, message: "Revise os dados da compra e o cartÃ£o selecionado." };
  }

  const { error } = await supabase
    .from("installments")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return databaseError(`Unable to update installment: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function deleteInstallment(id: string): Promise<ActionResult> {
  if (!id) return { success: false, message: "Parcelamento invÃ¡lido." };

  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };

  const { error } = await supabase
    .from("installments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return databaseError(`Unable to delete installment: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

type CustomPaymentInput = {
  due_date: string;
  amount: number;
  description: string;
};

function customPaymentsPayload(formData: FormData) {
  const raw = requiredText(formData, "custom_payments");
  if (!raw) return [] as CustomPaymentInput[];
  try {
    const payments = JSON.parse(raw) as unknown;
    if (!Array.isArray(payments) || payments.length > 240) return null;
    const normalized = payments.map((payment) => {
      if (!payment || typeof payment !== "object") return null;
      const item = payment as Record<string, unknown>;
      const dueDate = String(item.due_date ?? "");
      const amount = Number(item.amount);
      const description = String(item.description ?? "").trim();
      if (
        !validDate(dueDate) ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !description ||
        description.length > 120
      ) {
        return null;
      }
      return { due_date: dueDate, amount, description };
    });
    if (normalized.some((payment) => payment === null)) return null;
    return (normalized as CustomPaymentInput[]).sort((a, b) =>
      a.due_date.localeCompare(b.due_date),
    );
  } catch {
    return null;
  }
}

function financingPayload(formData: FormData) {
  const name = requiredText(formData, "name");
  const type = requiredText(formData, "type");
  const financedAmount = positiveNumber(formData, "financed_amount");
  const currentBalance = optionalNonNegativeNumber(
    formData,
    "current_outstanding_balance",
  );
  const rateType = requiredText(formData, "rate_type");
  const rateIndexValue = requiredText(formData, "rate_index");
  const customPayments = customPaymentsPayload(formData);
  const isCustom = type === "custom_plan";
  const startDateInput = requiredText(formData, "start_date");
  const endDateInput = requiredText(formData, "end_date");
  const monthlyPaymentInput = positiveNumber(formData, "monthly_payment");

  if (
    !name ||
    name.length > 120 ||
    !validFinancingTypes.has(type) ||
    financedAmount === null ||
    currentBalance === undefined ||
    !validFinancingRateTypes.has(rateType) ||
    (rateType === "variable" && !validFinancingRateIndexes.has(rateIndexValue)) ||
    customPayments === null ||
    (isCustom && customPayments.length === 0)
  ) {
    return null;
  }

  const startDate = isCustom ? customPayments[0].due_date : startDateInput;
  const endDate = isCustom
    ? customPayments[customPayments.length - 1].due_date
    : endDateInput;
  const monthlyPayment = isCustom
    ? customPayments[0].amount
    : monthlyPaymentInput;

  if (
    monthlyPayment === null ||
    !validDate(startDate) ||
    !validDate(endDate) ||
    endDate < startDate
  ) {
    return null;
  }

  const totalInstallments = isCustom
    ? customPayments.length
    : buildMonthlyFinancingSchedule({
        startDate,
        endDate,
        monthlyPayment,
      }).length;
  const today = new Date().toISOString().slice(0, 10);
  const remainingMonths = isCustom
    ? customPayments.filter((payment) => payment.due_date >= today).length
    : buildMonthlyFinancingSchedule({
        startDate,
        endDate,
        monthlyPayment,
      }).filter((payment) => payment.dueDate >= today).length;
  const cet = isCustom
    ? null
    : estimateCet(
    financedAmount,
    monthlyPayment,
    totalInstallments,
  );

  return {
    payload: {
      name,
      type,
      financed_amount: financedAmount,
      current_outstanding_balance: currentBalance,
      outstanding_balance: currentBalance ?? financedAmount,
      monthly_payment: monthlyPayment,
      start_date: startDate,
      end_date: endDate,
      monthly_due_day: Number(startDate.slice(8, 10)),
      rate_type: rateType,
      rate_index: rateType === "variable" ? rateIndexValue : null,
      estimated_monthly_rate: cet?.monthly ?? null,
      estimated_rate: cet?.annual ?? null,
      interest_rate: cet?.annual ?? 0,
      remaining_months: remainingMonths,
    },
    customPayments: isCustom ? customPayments : [],
  };
}

export async function createFinancing(formData: FormData): Promise<ActionResult> {
  const parsed = financingPayload(formData);
  if (!parsed) {
    return { success: false, message: "Preencha todos os campos com valores vÃ¡lidos." };
  }

  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };

  const { data, error } = await supabase
    .from("financings")
    .insert({ ...parsed.payload, user_id: user.id })
    .select("id")
    .single();

  if (error) return databaseError(`Unable to create financing: ${error.message}`);
  if (parsed.customPayments.length > 0) {
    const { error: paymentsError } = await supabase
      .from("financing_custom_payments")
      .insert(
        parsed.customPayments.map((payment) => ({
          ...payment,
          financing_id: data.id,
          user_id: user.id,
        })),
      );
    if (paymentsError) {
      await supabase.from("financings").delete().eq("id", data.id).eq("user_id", user.id);
      return databaseError(`Unable to create custom payments: ${paymentsError.message}`);
    }
  }
  revalidateFinancialPages();
  return { success: true };
}

export async function updateFinancing(formData: FormData): Promise<ActionResult> {
  const id = requiredText(formData, "id");
  const parsed = financingPayload(formData);
  if (!id || !parsed) {
    return { success: false, message: "Preencha todos os campos com valores vÃ¡lidos." };
  }

  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };

  const { error } = await supabase
    .from("financings")
    .update(parsed.payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return databaseError(`Unable to update financing: ${error.message}`);
  const { error: deletePaymentsError } = await supabase
    .from("financing_custom_payments")
    .delete()
    .eq("financing_id", id)
    .eq("user_id", user.id);
  if (deletePaymentsError) {
    return databaseError(`Unable to replace custom payments: ${deletePaymentsError.message}`);
  }
  if (parsed.customPayments.length > 0) {
    const { error: paymentsError } = await supabase
      .from("financing_custom_payments")
      .insert(
        parsed.customPayments.map((payment) => ({
          ...payment,
          financing_id: id,
          user_id: user.id,
        })),
      );
    if (paymentsError) {
      return databaseError(`Unable to update custom payments: ${paymentsError.message}`);
    }
  }
  revalidateFinancialPages();
  return { success: true };
}

export async function deleteFinancing(id: string): Promise<ActionResult> {
  if (!id) return { success: false, message: "Financiamento invÃ¡lido." };

  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };

  const { error } = await supabase
    .from("financings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return databaseError(`Unable to delete financing: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

function creditCardPayload(formData: FormData) {
  const name = requiredText(formData, "name");
  const bank = requiredText(formData, "bank");
  const lastFourDigits = requiredText(formData, "last_four_digits");
  const closingDay = dayOfMonth(formData, "closing_day");
  const dueDay = dayOfMonth(formData, "due_day");

  if (
    !name ||
    !validBanks.has(bank) ||
    !/^\d{4}$/.test(lastFourDigits) ||
    closingDay === null ||
    dueDay === null
  ) {
    return null;
  }

  return {
    name,
    bank,
    last_four_digits: lastFourDigits,
    closing_day: closingDay,
    due_day: dueDay,
  };
}

export async function createCreditCard(formData: FormData): Promise<ActionResult> {
  const payload = creditCardPayload(formData);
  if (!payload) {
    return { success: false, message: "Preencha os dados do cartÃ£o corretamente." };
  }

  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };

  const { error } = await supabase
    .from("credit_cards")
    .insert({ ...payload, user_id: user.id });

  if (error) return databaseError(`Unable to create credit card: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function updateCreditCard(formData: FormData): Promise<ActionResult> {
  const id = requiredText(formData, "id");
  const payload = creditCardPayload(formData);
  if (!id || !payload) {
    return { success: false, message: "Preencha os dados do cartÃ£o corretamente." };
  }

  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };

  const { error } = await supabase
    .from("credit_cards")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return databaseError(`Unable to update credit card: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function deleteCreditCard(id: string): Promise<ActionResult> {
  if (!id) return { success: false, message: "CartÃ£o invÃ¡lido." };

  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };

  const { error } = await supabase
    .from("credit_cards")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error?.code === "23503") {
    return {
      success: false,
      message: "Este cartÃ£o possui parcelamentos ou movimentaÃ§Ãµes vinculadas e nÃ£o pode ser excluÃ­do.",
    };
  }
  if (error) return databaseError(`Unable to delete credit card: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

function monthlyBillPayload(formData: FormData) {
  const name = requiredText(formData, "name");
  const category = normalizedCategory(formData, "category");
  const monthlyAmount = positiveNumber(formData, "monthly_amount");
  const paymentMethod = requiredText(formData, "payment_method");
  const bankAccountId = paymentMethod === CREDIT_CARD_PAYMENT_METHOD ? "" : requiredText(formData, "bank_account_id");
  const creditCardId = paymentMethod === CREDIT_CARD_PAYMENT_METHOD ? requiredText(formData, "credit_card_id") : "";
  const dueDay = dayOfMonth(formData, "due_day");
  const startDate = requiredText(formData, "start_date");
  const endDate = requiredText(formData, "end_date");
  const status = requiredText(formData, "status");

  if (
    !name ||
    !validCategories.has(category) ||
    (category !== UNCATEGORIZED && !validExpenseCategories.has(category)) ||
    monthlyAmount === null ||
    !validPaymentMethods.has(paymentMethod) ||
    (paymentMethod === CREDIT_CARD_PAYMENT_METHOD && !creditCardId) ||
    dueDay === null ||
    !validDate(startDate) ||
    (endDate && (!validDate(endDate) || endDate < startDate)) ||
    !validMonthlyBillStatuses.has(status)
  ) {
    return null;
  }

  return {
    name,
    category,
    monthly_amount: monthlyAmount,
    payment_method: paymentMethod,
    bank_account_id: bankAccountId || null,
    credit_card_id: creditCardId || null,
    due_day: dueDay,
    start_date: startDate,
    end_date: endDate || null,
    status,
  };
}

export async function updateUserProfile(formData: FormData): Promise<ActionResult> {
  const name = requiredText(formData, "name");
  const avatar = requiredText(formData, "avatar");
  if (!name || name.length < 2 || name.length > 80 || !["slate", "teal", "gold", "rose"].includes(avatar)) {
    return { success: false, message: "Revise os dados do perfil." };
  }
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { error } = await supabase.auth.updateUser({
    data: { ...user.user_metadata, name, avatar },
  });
  if (error) return databaseError(`Unable to update profile: ${error.message}`);
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function createMonthlyBill(formData: FormData): Promise<ActionResult> {
  const payload = monthlyBillPayload(formData);
  if (!payload) {
    return { success: false, message: "Preencha os dados da mensalidade corretamente." };
  }

  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };

  const { error } = await supabase
    .from("monthly_bills")
    .insert({ ...payload, user_id: user.id });

  if (error) return databaseError(`Unable to create monthly bill: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function updateMonthlyBill(formData: FormData): Promise<ActionResult> {
  const id = requiredText(formData, "id");
  const payload = monthlyBillPayload(formData);
  if (!id || !payload) {
    return { success: false, message: "Preencha os dados da mensalidade corretamente." };
  }

  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };

  const { error } = await supabase
    .from("monthly_bills")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return databaseError(`Unable to update monthly bill: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function deleteMonthlyBill(id: string): Promise<ActionResult> {
  if (!id) return { success: false, message: "Mensalidade invÃ¡lida." };

  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };

  const { error } = await supabase
    .from("monthly_bills")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return databaseError(`Unable to delete monthly bill: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

function goalPayload(formData: FormData) {
  const name = requiredText(formData, "name");
  const category = requiredText(formData, "category");
  const currentAmount = nonNegativeNumber(formData, "current_amount");
  const targetAmount = positiveNumber(formData, "target_amount");
  const targetDate = requiredText(formData, "target_date");
  const priority = requiredText(formData, "priority");
  const status = requiredText(formData, "status");

  if (
    !name ||
    !validCategories.has(category) ||
    currentAmount === null ||
    targetAmount === null ||
    !validDate(targetDate) ||
    !validGoalPriorities.has(priority) ||
    !validGoalStatuses.has(status)
  ) {
    return null;
  }

  return {
    name,
    category,
    current_amount: currentAmount,
    target_amount: targetAmount,
    target_date: targetDate,
    priority,
    status,
  };
}

export async function createGoal(formData: FormData): Promise<ActionResult> {
  const payload = goalPayload(formData);
  if (!payload) return { success: false, message: "Revise os dados do objetivo." };
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { error } = await supabase.from("goals").insert({ ...payload, user_id: user.id });
  if (error) return databaseError(`Unable to create goal: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function updateGoal(formData: FormData): Promise<ActionResult> {
  const id = requiredText(formData, "id");
  const payload = goalPayload(formData);
  if (!id || !payload) return { success: false, message: "Revise os dados do objetivo." };
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { error } = await supabase.from("goals").update(payload).eq("id", id).eq("user_id", user.id);
  if (error) return databaseError(`Unable to update goal: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", user.id);
  if (error) return databaseError(`Unable to delete goal: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function createBankAccount(formData: FormData): Promise<ActionResult> {
  const bank = requiredText(formData, "bank");
  const accountNumber = requiredText(formData, "account_number");
  const balance = nonNegativeNumber(formData, "balance");
  if (!validBanks.has(bank) || balance === null) {
    return { success: false, message: "Revise os dados da conta." };
  }
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { error } = await supabase.from("bank_accounts").insert({
    user_id: user.id,
    bank,
    account_number: accountNumber || null,
    balance,
  });
  if (error) return databaseError(`Unable to create bank account: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function updateBankAccount(formData: FormData): Promise<ActionResult> {
  const id = requiredText(formData, "id");
  const bank = requiredText(formData, "bank");
  const accountNumber = requiredText(formData, "account_number");
  const balance = nonNegativeNumber(formData, "balance");
  if (!id || !validBanks.has(bank) || balance === null) {
    return { success: false, message: "Revise os dados da conta." };
  }
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { error } = await supabase
    .from("bank_accounts")
    .update({ bank, account_number: accountNumber || null, balance })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return databaseError(`Unable to update bank account: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function deleteBankAccount(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { error } = await supabase
    .from("bank_accounts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    return {
      success: false,
      message: "Esta conta possui movimentaÃ§Ãµes vinculadas e nÃ£o pode ser excluÃ­da.",
    };
  }
  revalidateFinancialPages();
  return { success: true };
}

export async function createAccountTransfer(formData: FormData): Promise<ActionResult> {
  const sourceAccountId = requiredText(formData, "source_account_id");
  const destinationAccountId = requiredText(formData, "destination_account_id");
  const amount = positiveNumber(formData, "amount");
  const transferDate = requiredText(formData, "transfer_date");
  if (
    !sourceAccountId ||
    !destinationAccountId ||
    sourceAccountId === destinationAccountId ||
    amount === null ||
    !validDate(transferDate)
  ) return { success: false, message: "Revise os dados da transferÃªncia." };
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { data: accounts } = await supabase
    .from("bank_accounts")
    .select("id")
    .in("id", [sourceAccountId, destinationAccountId])
    .eq("user_id", user.id);
  if (accounts?.length !== 2) {
    return { success: false, message: "Selecione duas contas vÃ¡lidas." };
  }
  if (!(await adjustAccountBalance(supabase, user.id, sourceAccountId, -amount))) {
    return databaseError("Unable to debit transfer source account.");
  }
  if (!(await adjustAccountBalance(supabase, user.id, destinationAccountId, amount))) {
    await adjustAccountBalance(supabase, user.id, sourceAccountId, amount);
    return databaseError("Unable to credit transfer destination account.");
  }
  const { error } = await supabase.from("account_transfers").insert({
    user_id: user.id,
    source_account_id: sourceAccountId,
    destination_account_id: destinationAccountId,
    amount,
    transfer_date: transferDate,
  });
  if (error) {
    await adjustAccountBalance(supabase, user.id, sourceAccountId, amount);
    await adjustAccountBalance(supabase, user.id, destinationAccountId, -amount);
    return databaseError(`Unable to create account transfer: ${error.message}`);
  }
  revalidateFinancialPages();
  return { success: true };
}

export async function deleteAccountTransfer(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { data: transfer } = await supabase
    .from("account_transfers")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!transfer) return { success: false, message: "TransferÃªncia nÃ£o encontrada." };
  const amount = Number(transfer.amount);
  if (!(await adjustAccountBalance(supabase, user.id, transfer.source_account_id, amount))) {
    return databaseError("Unable to restore source account.");
  }
  if (!(await adjustAccountBalance(supabase, user.id, transfer.destination_account_id, -amount))) {
    await adjustAccountBalance(supabase, user.id, transfer.source_account_id, -amount);
    return databaseError("Unable to reverse destination account.");
  }
  const { error } = await supabase
    .from("account_transfers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return databaseError(`Unable to delete account transfer: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

function investmentPayload(formData: FormData) {
  const name = requiredText(formData, "name");
  const type = requiredText(formData, "type");
  const institution = requiredText(formData, "institution");
  const currentPosition = nonNegativeNumber(formData, "current_position");
  const currentPositionDate = requiredText(formData, "current_position_date");
  const isAsset = ["property", "vehicle", "business_stake", "other_asset"].includes(type);
  const initialValue = isAsset
    ? currentPosition
    : nonNegativeNumber(formData, "initial_value");
  const initialDate = isAsset
    ? currentPositionDate
    : requiredText(formData, "initial_date");
  const notes = requiredText(formData, "notes");
  if (
    !name ||
    !validInvestmentTypes.has(type) ||
    !institution ||
    initialValue === null ||
    !validDate(initialDate) ||
    currentPosition === null ||
    !validDate(currentPositionDate)
  ) return null;
  return {
    name,
    type: ["property", "vehicle", "business_stake", "other_asset"].includes(type)
      ? "other"
      : type,
    asset_type: type,
    institution,
    current_value: initialValue,
    reference_date: initialDate,
    initial_value: initialValue,
    initial_date: initialDate,
    current_position: currentPosition,
    current_position_date: currentPositionDate,
    notes: notes || null,
    cash_outflow: false,
  };
}

export async function createInvestment(formData: FormData): Promise<ActionResult> {
  const payload = investmentPayload(formData);
  if (!payload) return { success: false, message: "Revise os dados do investimento." };
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { error } = await supabase.from("investments").insert({ ...payload, user_id: user.id });
  if (error) return databaseError(`Unable to create investment: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function updateInvestment(formData: FormData): Promise<ActionResult> {
  const id = requiredText(formData, "id");
  const payload = investmentPayload(formData);
  if (!id || !payload) return { success: false, message: "Revise os dados do investimento." };
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { error } = await supabase.from("investments").update(payload).eq("id", id).eq("user_id", user.id);
  if (error) return databaseError(`Unable to update investment: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function deleteInvestment(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { error } = await supabase.from("investments").delete().eq("id", id).eq("user_id", user.id);
  if (error) return databaseError(`Unable to delete investment: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function createInvestmentContribution(formData: FormData): Promise<ActionResult> {
  const investmentId = requiredText(formData, "investment_id");
  const bankAccountId = requiredText(formData, "bank_account_id");
  const amount = positiveNumber(formData, "amount");
  const contributionDate = requiredText(formData, "contribution_date");
  const description = requiredText(formData, "description") || "Aporte em investimento";
  if (!investmentId || !bankAccountId || amount === null || !validDate(contributionDate)) {
    return { success: false, message: "Revise os dados do aporte." };
  }
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessao expirou. Entre novamente." };
  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "expense",
      description,
      amount,
      category: INVESTMENT_CONTRIBUTION_CATEGORY,
      payment_method: TRANSFER_PAYMENT_METHOD,
      transaction_date: contributionDate,
      cash_flow_date: contributionDate,
      bank_account_id: bankAccountId,
      credit_card_id: null,
      monthly_bill_id: null,
    })
    .select("id")
    .single();
  if (transactionError) return databaseError(`Unable to create contribution transaction: ${transactionError.message}`);
  if (!(await adjustAccountBalance(supabase, user.id, bankAccountId, -amount))) {
    await supabase.from("transactions").delete().eq("id", transaction.id).eq("user_id", user.id);
    return databaseError("Unable to debit contribution account.");
  }
  const result = await createInvestmentContributionEvent({
    supabase,
    userId: user.id,
    investmentId,
    bankAccountId,
    amount,
    date: contributionDate,
    description,
    transactionId: transaction.id,
    accountAlreadyAdjusted: true,
  });
  if (!result.success) {
    await adjustAccountBalance(supabase, user.id, bankAccountId, amount);
    await supabase.from("transactions").delete().eq("id", transaction.id).eq("user_id", user.id);
    return result;
  }
  revalidateFinancialPages();
  return { success: true };
}

export async function deleteInvestmentContribution(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessao expirou. Entre novamente." };
  const { data: contribution } = await supabase
    .from("investment_contributions")
    .select("id, transaction_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!contribution) return { success: false, message: "Aporte nao encontrado." };
  if (contribution.transaction_id) return deleteTransaction(contribution.transaction_id);
  const result = await deleteInvestmentContributionEvent(supabase, user.id, id);
  if (!result.success) return result;
  revalidateFinancialPages();
  return { success: true };
}

export async function createInvestmentWithdrawal(formData: FormData): Promise<ActionResult> {
  const investmentId = requiredText(formData, "investment_id");
  const bankAccountId = requiredText(formData, "bank_account_id");
  const amount = positiveNumber(formData, "amount");
  const resultingPosition = nonNegativeNumber(formData, "resulting_position");
  const withdrawalDate = requiredText(formData, "withdrawal_date");
  const description = requiredText(formData, "description") || "Saque de investimento";
  if (!investmentId || !bankAccountId || amount === null || resultingPosition === null || !validDate(withdrawalDate)) {
    return { success: false, message: "Revise os dados do saque." };
  }
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessao expirou. Entre novamente." };
  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "income",
      description,
      amount,
      category: INVESTMENT_WITHDRAWAL_CATEGORY,
      payment_method: TRANSFER_PAYMENT_METHOD,
      transaction_date: withdrawalDate,
      cash_flow_date: withdrawalDate,
      bank_account_id: bankAccountId,
      credit_card_id: null,
      monthly_bill_id: null,
    })
    .select("id")
    .single();
  if (transactionError) return databaseError(`Unable to create withdrawal transaction: ${transactionError.message}`);
  if (!(await adjustAccountBalance(supabase, user.id, bankAccountId, amount))) {
    await supabase.from("transactions").delete().eq("id", transaction.id).eq("user_id", user.id);
    return databaseError("Unable to credit withdrawal account.");
  }
  const result = await createInvestmentWithdrawalEvent({
    supabase,
    userId: user.id,
    investmentId,
    bankAccountId,
    amount,
    resultingPosition,
    date: withdrawalDate,
    description,
    transactionId: transaction.id,
    accountAlreadyAdjusted: true,
  });
  if (!result.success) {
    await adjustAccountBalance(supabase, user.id, bankAccountId, -amount);
    await supabase.from("transactions").delete().eq("id", transaction.id).eq("user_id", user.id);
    return result;
  }
  revalidateFinancialPages();
  return { success: true };
}

export async function deleteInvestmentWithdrawal(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessao expirou. Entre novamente." };
  const { data: withdrawal } = await supabase
    .from("investment_withdrawals")
    .select("id, transaction_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!withdrawal) return { success: false, message: "Saque nao encontrado." };
  if (withdrawal.transaction_id) return deleteTransaction(withdrawal.transaction_id);
  const result = await deleteInvestmentWithdrawalEvent(supabase, user.id, id);
  if (!result.success) return result;
  revalidateFinancialPages();
  return { success: true };
}

export async function upsertGoalInvestmentAllocation(formData: FormData): Promise<ActionResult> {
  const goalId = requiredText(formData, "goal_id");
  const investmentId = requiredText(formData, "investment_id");
  const allocatedAmount = nonNegativeNumber(formData, "allocated_amount");
  if (!goalId || !investmentId || allocatedAmount === null) {
    return { success: false, message: "Revise os dados da alocaÃ§Ã£o." };
  }
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const investment = await currentInvestmentPosition(supabase, user.id, investmentId);
  const { data: goal } = await supabase
    .from("goals")
    .select("id")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!investment || !goal) return { success: false, message: "Objetivo ou investimento invÃ¡lido." };
  const { data: allocations, error: allocationsError } = await supabase
    .from("goal_investment_allocations")
    .select("goal_id, allocated_amount")
    .eq("investment_id", investmentId)
    .eq("user_id", user.id);
  if (allocationsError) return databaseError(`Unable to load allocations: ${allocationsError.message}`);
  const alreadyAllocatedElsewhere = (allocations ?? [])
    .filter((allocation) => allocation.goal_id !== goalId)
    .reduce((sum, allocation) => sum + Number(allocation.allocated_amount), 0);
  if (allocatedAmount > 0 && alreadyAllocatedElsewhere + allocatedAmount > investment.position) {
    return { success: false, message: "A alocaÃ§Ã£o supera o saldo livre deste investimento." };
  }
  if (allocatedAmount === 0) {
    const { error } = await supabase
      .from("goal_investment_allocations")
      .delete()
      .eq("goal_id", goalId)
      .eq("investment_id", investmentId)
      .eq("user_id", user.id);
    if (error) return databaseError(`Unable to remove allocation: ${error.message}`);
  } else {
    const { error } = await supabase
      .from("goal_investment_allocations")
      .upsert({
        user_id: user.id,
        goal_id: goalId,
        investment_id: investmentId,
        allocated_amount: allocatedAmount,
      }, { onConflict: "user_id,goal_id,investment_id" });
    if (error) return databaseError(`Unable to save allocation: ${error.message}`);
  }
  revalidateFinancialPages();
  return { success: true };
}

function financialPlanPayload(formData: FormData) {
  const monthValue = requiredText(formData, "month");
  const category = requiredText(formData, "category");
  const plannedAmount = positiveNumber(formData, "planned_amount");
  const month = /^\d{4}-\d{2}$/.test(monthValue) ? `${monthValue}-01` : "";
  if (!validDate(month) || !validCategories.has(category) || plannedAmount === null) {
    return null;
  }
  return { month, category, planned_amount: plannedAmount };
}

export async function createFinancialPlan(formData: FormData): Promise<ActionResult> {
  const payload = financialPlanPayload(formData);
  if (!payload) return { success: false, message: "Revise os dados do planejamento." };
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { error } = await supabase
    .from("financial_plans")
    .upsert({ ...payload, user_id: user.id }, { onConflict: "user_id,month,category" });
  if (error) return databaseError(`Unable to create financial plan: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function updateFinancialPlan(formData: FormData): Promise<ActionResult> {
  const id = requiredText(formData, "id");
  const payload = financialPlanPayload(formData);
  if (!id || !payload) return { success: false, message: "Revise os dados do planejamento." };
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { error } = await supabase.from("financial_plans").update(payload).eq("id", id).eq("user_id", user.id);
  if (error) return databaseError(`Unable to update financial plan: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function deleteFinancialPlan(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { error } = await supabase.from("financial_plans").delete().eq("id", id).eq("user_id", user.id);
  if (error) return databaseError(`Unable to delete financial plan: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function setFinancingPaymentPaid(
  financingId: string,
  dueDate: string,
  paid: boolean,
): Promise<ActionResult> {
  if (!financingId || !validDate(dueDate)) return { success: false, message: "Parcela invÃ¡lida." };
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { data: financing } = await supabase.from("financings").select("id").eq("id", financingId).eq("user_id", user.id).maybeSingle();
  if (!financing) return { success: false, message: "Contrato invÃ¡lido." };
  const { error } = await supabase.from("financing_payment_statuses").upsert(
    {
      financing_id: financingId,
      user_id: user.id,
      due_date: dueDate,
      paid,
      paid_at: paid ? new Date().toISOString() : null,
    },
    { onConflict: "financing_id,due_date" },
  );
  if (error) return databaseError(`Unable to update financing payment: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function markOverdueFinancingPaymentsPaid(
  financingId: string,
  dueDates: string[],
): Promise<ActionResult> {
  const validDates = dueDates.filter(validDate);
  if (!financingId || validDates.length === 0) return { success: false, message: "Nenhuma parcela vencida." };
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { data: financing } = await supabase.from("financings").select("id").eq("id", financingId).eq("user_id", user.id).maybeSingle();
  if (!financing) return { success: false, message: "Contrato invÃ¡lido." };
  const now = new Date().toISOString();
  const { error } = await supabase.from("financing_payment_statuses").upsert(
    validDates.map((dueDate) => ({
      financing_id: financingId,
      user_id: user.id,
      due_date: dueDate,
      paid: true,
      paid_at: now,
    })),
    { onConflict: "financing_id,due_date" },
  );
  if (error) return databaseError(`Unable to mark financing payments: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

function incomeForecastPayload(formData: FormData) {
  const monthValue = requiredText(formData, "month");
  const expectedIncome = positiveNumber(formData, "expected_income");
  const month = /^\d{4}-\d{2}$/.test(monthValue) ? `${monthValue}-01` : "";
  if (!validDate(month) || expectedIncome === null) return null;
  return { month, expected_income: expectedIncome };
}

export async function createIncomeForecast(formData: FormData): Promise<ActionResult> {
  const payload = incomeForecastPayload(formData);
  if (!payload) return { success: false, message: "Informe um mÃªs e valor vÃ¡lidos." };
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { error } = await supabase
    .from("income_forecasts")
    .upsert({ ...payload, user_id: user.id }, { onConflict: "user_id,month" });
  if (error) return databaseError(`Unable to save income forecast: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

export async function deleteIncomeForecast(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return { success: false, message: "Sua sessÃ£o expirou. Entre novamente." };
  const { error } = await supabase.from("income_forecasts").delete().eq("id", id).eq("user_id", user.id);
  if (error) return databaseError(`Unable to delete income forecast: ${error.message}`);
  revalidateFinancialPages();
  return { success: true };
}

