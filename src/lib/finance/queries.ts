import { createClient } from "@/lib/supabase/server";
import type {
  AccountTransfer,
  BankAccount,
  CreditCard,
  Financing,
  FinancingCustomPayment,
  FinancingPaymentStatus,
  FinancialPlan,
  Goal,
  GoalInvestmentAllocation,
  IncomeForecast,
  Investment,
  InvestmentContribution,
  InvestmentValuation,
  InvestmentWithdrawal,
  Installment,
  MonthlyBill,
  Transaction,
} from "./types";

export async function getBankAccounts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Unable to load bank accounts:", error.message);
    return [] as BankAccount[];
  }
  return (data ??[]) as BankAccount[];
}

export async function getAccountTransfers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("account_transfers")
    .select("*")
    .order("transfer_date", { ascending: false });
  if (error) {
    console.error("Unable to load account transfers:", error.message);
    return [] as AccountTransfer[];
  }
  return (data ??[]) as AccountTransfer[];
}

export async function getTransactions(options?: {
  start?: string;
  end?: string;
  limit?: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (options?.start) query = query.gte("transaction_date", options.start);
  if (options?.end) query = query.lte("transaction_date", options.end);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) {
    console.error("Unable to load transactions:", error.message);
    return [] as Transaction[];
  }
  return (data ??[]) as Transaction[];
}

export async function getInstallments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("installments")
    .select("*")
    .order("end_date", { ascending: true });

  if (error) {
    console.error("Unable to load installments:", error.message);
    return [] as Installment[];
  }
  return (data ??[]) as Installment[];
}

export async function getFinancings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("financings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load financings:", error.message);
    return [] as Financing[];
  }
  return (data ??[]) as Financing[];
}

export async function getFinancingCustomPayments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("financing_custom_payments")
    .select("*")
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Unable to load financing custom payments:", error.message);
    return [] as FinancingCustomPayment[];
  }
  return (data ??[]) as FinancingCustomPayment[];
}

export async function getFinancingPaymentStatuses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("financing_payment_statuses")
    .select("*")
    .order("due_date", { ascending: true });
  if (error) {
    console.error("Unable to load financing payment statuses:", error.message);
    return [] as FinancingPaymentStatus[];
  }
  return (data ??[]) as FinancingPaymentStatus[];
}

export async function getFinancialPlans() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("financial_plans")
    .select("*")
    .order("month", { ascending: true });
  if (error) {
    console.error("Unable to load financial plans:", error.message);
    return [] as FinancialPlan[];
  }
  return (data ??[]) as FinancialPlan[];
}

export async function getGoals() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("target_date", { ascending: true });

  if (error) {
    console.error("Unable to load goals:", error.message);
    return [] as Goal[];
  }
  return (data ??[]) as Goal[];
}

export async function getCreditCards() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_cards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load credit cards:", error.message);
    return [] as CreditCard[];
  }
  return (data ??[]) as CreditCard[];
}

export async function getMonthlyBills() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_bills")
    .select("*")
    .order("due_day", { ascending: true });

  if (error) {
    console.error("Unable to load monthly bills:", error.message);
    return [] as MonthlyBill[];
  }
  return (data ??[]) as MonthlyBill[];
}

export async function getInvestments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investments")
    .select("*")
    .order("reference_date", { ascending: false });

  if (error) {
    console.error("Unable to load investments:", error.message);
    return [] as Investment[];
  }
  return (data ??[]) as Investment[];
}

export async function getInvestmentContributions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investment_contributions")
    .select("*")
    .order("contribution_date", { ascending: false });
  if (error) {
    console.error("Unable to load investment contributions:", error.message);
    return [] as InvestmentContribution[];
  }
  return (data ??[]) as InvestmentContribution[];
}

export async function getInvestmentWithdrawals() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investment_withdrawals")
    .select("*")
    .order("withdrawal_date", { ascending: false });
  if (error) {
    console.error("Unable to load investment withdrawals:", error.message);
    return [] as InvestmentWithdrawal[];
  }
  return (data ??[]) as InvestmentWithdrawal[];
}

export async function getGoalInvestmentAllocations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goal_investment_allocations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Unable to load goal investment allocations:", error.message);
    return [] as GoalInvestmentAllocation[];
  }
  return (data ??[]) as GoalInvestmentAllocation[];
}

export async function getInvestmentValuations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investment_valuations")
    .select("*")
    .order("valuation_date", { ascending: false });
  if (error) {
    console.error("Unable to load investment valuations:", error.message);
    return [] as InvestmentValuation[];
  }
  return (data ??[]) as InvestmentValuation[];
}

export async function getIncomeForecasts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("income_forecasts")
    .select("*")
    .order("month", { ascending: true });

  if (error) {
    console.error("Unable to load income forecasts:", error.message);
    return [] as IncomeForecast[];
  }
  return (data ??[]) as IncomeForecast[];
}
