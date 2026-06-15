import type { Metadata } from "next";
import { CalendarRange } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { NewMovementButton } from "@/components/dashboard/new-movement-button";
import { PageHeading } from "@/components/dashboard/page-heading";
import { IncomeForecastsManager } from "@/components/dashboard/income-forecasts-manager";
import { BankAccountsManager } from "@/components/dashboard/bank-accounts-manager";
import { addMonths, formatCurrency, monthFormatter } from "@/lib/finance/format";
import { getInstallmentSchedule } from "@/lib/finance/installment-schedule";
import { financingAmountInMonth } from "@/lib/finance/financing";
import { getTransactionCashFlowDate } from "@/lib/finance/transaction-cash-flow";
import {
  getAccountTransfers, getBankAccounts, getCreditCards, getFinancialPlans,
  getFinancingCustomPayments, getFinancings, getIncomeForecasts,
  getInstallments, getInvestmentContributions, getMonthlyBills, getTransactions,
} from "@/lib/finance/queries";

export const metadata: Metadata = { title: "Contas e Fluxo de Caixa" };

export default async function CashFlowPage() {
  const today = new Date();
  const firstMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const [transactions, installments, financings, customPayments, monthlyBills, cards, forecasts, contributions, plans, accounts, transfers] = await Promise.all([
    getTransactions(), getInstallments(), getFinancings(), getFinancingCustomPayments(),
    getMonthlyBills(), getCreditCards(), getIncomeForecasts(), getInvestmentContributions(),
    getFinancialPlans(), getBankAccounts(), getAccountTransfers(),
  ]);
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = addMonths(firstMonth, index);
    const start = date.toISOString().slice(0, 10);
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
    const monthTransactions = transactions.filter((item) => getTransactionCashFlowDate(item) >= start && getTransactionCashFlowDate(item) <= end);
    const realizedIncome = monthTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
    const predictedIncome = forecasts.filter((item) => item.month === start).reduce((sum, item) => sum + Number(item.expected_income), 0);
    const transactionExpenses = monthTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
    const installmentExpenses = installments.reduce((sum, item) => sum + getInstallmentSchedule(item, item.credit_card_id ? cardsById.get(item.credit_card_id) : undefined).filter((entry) => entry.dueDate >= start && entry.dueDate <= end).reduce((value, entry) => value + entry.amount, 0), 0);
    const financingExpenses = financings.reduce((sum, item) => sum + financingAmountInMonth(item, customPayments.filter((payment) => payment.financing_id === item.id), start, end), 0);
    const recurringExpenses = monthlyBills.filter((item) => item.status === "active" && item.start_date <= end && (!item.end_date || item.end_date >= start)).reduce((sum, item) => sum + Number(item.monthly_amount), 0);
    const invested = contributions.filter((item) => item.impacts_cash_flow !== false && item.contribution_date >= start && item.contribution_date <= end).reduce((sum, item) => sum + Number(item.amount), 0);
    const entries = realizedIncome + predictedIncome;
    const expenses = transactionExpenses + installmentExpenses + financingExpenses + recurringExpenses;
    const leftover = entries - expenses - invested;
    const monthPlans = plans.filter((plan) => plan.month === start);
    const planned = monthPlans.reduce((sum, plan) => sum + Number(plan.planned_amount), 0);
    const executedByCategory = monthPlans.map((plan) => ({
      ...plan,
      executed: monthTransactions.filter((item) => item.type === "expense" && item.category === plan.category).reduce((sum, item) => sum + Number(item.amount), 0),
    }));
    return { date, entries, expenses, invested, leftover, planned, executed: transactionExpenses, executedByCategory, transactionExpenses, installmentExpenses, financingExpenses, recurringExpenses };
  });
  const hasData = transactions.length + installments.length + financings.length + monthlyBills.length + forecasts.length + contributions.length + plans.length > 0;

  return <>
    <PageHeading eyebrow="Caixa e planejamento" title="Contas e Fluxo de Caixa" description="Centralize seus saldos e acompanhe entradas, saídas, aportes e sobra mensal." />
    <BankAccountsManager accounts={accounts} transfers={transfers} />
    {!hasData ? <EmptyState icon={CalendarRange} title="Seu fluxo ainda não tem dados" description="Cadastre movimentações ou compromissos para construir sua projeção." action={<NewMovementButton />} /> : <section className="space-y-4">
      {months.map((month) => {
        const comparisonMax = Math.max(month.planned, month.executed, 1);
        return <article key={month.date.toISOString()} className="dashboard-card p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-wider text-moss-600">{monthFormatter.format(month.date)}</p><h2 className="mt-1 text-lg font-extrabold">Sobra de caixa: <span className={month.leftover >= 0 ? "text-moss-700" : "text-red-600"}>{formatCurrency(month.leftover)}</span></h2></div><details className="group"><summary className="cursor-pointer list-none rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold">Ver detalhes</summary><div className="mt-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-600 sm:absolute sm:right-10 sm:z-10 sm:w-72 sm:shadow-lg"><p>Movimentações: {formatCurrency(month.transactionExpenses)}</p><p className="mt-2">Mensalidades: {formatCurrency(month.recurringExpenses)}</p><p className="mt-2">Parcelamentos: {formatCurrency(month.installmentExpenses)}</p><p className="mt-2">Financiamentos: {formatCurrency(month.financingExpenses)}</p></div></details></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Entradas" value={month.entries} tone="green" /><Metric label="Saídas" value={month.expenses} /><Metric label="Investido no mês" value={month.invested} tone="blue" /><Metric label="Sobra de caixa" value={month.leftover} tone={month.leftover >= 0 ? "green" : "red"} /></div>
          {month.planned > 0 && <div className="mt-5 border-t border-slate-100 pt-5"><div className="flex justify-between text-xs"><strong>Planejado vs Executado</strong><span>{formatCurrency(month.planned)} / {formatCurrency(month.executed)}</span></div><div className="mt-3 space-y-2"><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-400" style={{ width: `${month.planned / comparisonMax * 100}%` }} /></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-moss-500" style={{ width: `${month.executed / comparisonMax * 100}%` }} /></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{month.executedByCategory.map((item) => <div key={item.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"><span>{item.category}</span><span className={item.executed > Number(item.planned_amount) ? "font-bold text-amber-600" : "font-bold"}>{formatCurrency(item.executed)} / {formatCurrency(Number(item.planned_amount))}</span></div>)}</div></div>}
        </article>;
      })}
    </section>}
    <IncomeForecastsManager forecasts={forecasts} />
  </>;
}

function Metric({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "green" | "blue" | "red" }) {
  const colors = { slate: "text-slate-900", green: "text-emerald-600", blue: "text-blue-600", red: "text-red-600" };
  return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">{label}</p><p className={`mt-2 font-extrabold ${colors[tone]}`}>{formatCurrency(value)}</p></div>;
}
