import type { Metadata } from "next";
import { CalendarRange } from "lucide-react";
import { BankAccountsManager } from "@/components/dashboard/bank-accounts-manager";
import { EmptyState } from "@/components/dashboard/empty-state";
import { IncomeForecastsManager } from "@/components/dashboard/income-forecasts-manager";
import { NewMovementButton } from "@/components/dashboard/new-movement-button";
import { PageHeading } from "@/components/dashboard/page-heading";
import { addMonths, formatCurrency, monthFormatter } from "@/lib/finance/format";
import { financingAmountInMonth } from "@/lib/finance/financing";
import { getInstallmentSchedule } from "@/lib/finance/installment-schedule";
import { projectedMonthlyBillAmountInRange } from "@/lib/finance/monthly-bills";
import {
  getAccountTransfers,
  getBankAccounts,
  getCreditCards,
  getFinancialPlans,
  getFinancingCustomPayments,
  getFinancings,
  getIncomeForecasts,
  getInstallments,
  getInvestmentContributions,
  getInvestmentWithdrawals,
  getMonthlyBills,
  getTransactions,
} from "@/lib/finance/queries";
import { getTransactionCashFlowDate } from "@/lib/finance/transaction-cash-flow";

export const metadata: Metadata = { title: "Contas e Fluxo de Caixa" };

export default async function CashFlowPage() {
  const today = new Date();
  const firstMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const [
    transactions,
    installments,
    financings,
    customPayments,
    monthlyBills,
    cards,
    forecasts,
    contributions,
    withdrawals,
    plans,
    accounts,
    transfers,
  ] = await Promise.all([
    getTransactions(),
    getInstallments(),
    getFinancings(),
    getFinancingCustomPayments(),
    getMonthlyBills(),
    getCreditCards(),
    getIncomeForecasts(),
    getInvestmentContributions(),
    getInvestmentWithdrawals(),
    getFinancialPlans(),
    getBankAccounts(),
    getAccountTransfers(),
  ]);
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = addMonths(firstMonth, index);
    const start = date.toISOString().slice(0, 10);
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
    const monthTransactions = transactions.filter((item) => getTransactionCashFlowDate(item) >= start && getTransactionCashFlowDate(item) <= end);
    const realizedIncome = monthTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
    const predictedIncome = forecasts.filter((item) => item.month === start).reduce((sum, item) => sum + Number(item.expected_income), 0);
    const transactionExpenses = monthTransactions.filter((item) => item.type === "expense" && !item.monthly_bill_id && item.category !== "Investimentos").reduce((sum, item) => sum + Number(item.amount), 0);
    const installmentExpenses = installments.reduce((sum, item) => sum + getInstallmentSchedule(item, item.credit_card_id ?cardsById.get(item.credit_card_id) : undefined).filter((entry) => entry.dueDate >= start && entry.dueDate <= end).reduce((value, entry) => value + entry.amount, 0), 0);
    const financingExpenses = financings.reduce((sum, item) => sum + financingAmountInMonth(item, customPayments.filter((payment) => payment.financing_id === item.id), start, end), 0);
    const recurringExpenses = projectedMonthlyBillAmountInRange({
      bills: monthlyBills,
      cardsById,
      transactions,
      start,
      end,
    });
    const investedIn = contributions.filter((item) => item.impacts_cash_flow !== false && item.contribution_date >= start && item.contribution_date <= end).reduce((sum, item) => sum + Number(item.amount), 0);
    const investedOut = withdrawals.filter((item) => item.withdrawal_date >= start && item.withdrawal_date <= end).reduce((sum, item) => sum + Number(item.amount), 0);
    const invested = investedIn - investedOut;
    const entries = realizedIncome + predictedIncome;
    const expenses = transactionExpenses + installmentExpenses + financingExpenses + recurringExpenses;
    const leftover = entries - expenses - invested;
    const monthPlans = plans.filter((plan) => plan.month === start);
    const planned = monthPlans.reduce((sum, plan) => sum + Number(plan.planned_amount), 0);
    const executedByCategory = monthPlans.map((plan) => ({
      ...plan,
      executed: monthTransactions.filter((item) => item.type === "expense" && !item.monthly_bill_id && item.category !== "Investimentos" && item.category === plan.category).reduce((sum, item) => sum + Number(item.amount), 0),
    }));
    return { date, entries, expenses, invested, leftover, planned, executed: transactionExpenses, executedByCategory, transactionExpenses, installmentExpenses, financingExpenses, recurringExpenses, realized: index === 0 };
  });
  const hasData = transactions.length + installments.length + financings.length + monthlyBills.length + forecasts.length + contributions.length + withdrawals.length + plans.length > 0;

  return <>
    <PageHeading eyebrow="Caixa e planejamento" title="Contas e Fluxo de Caixa" description="Centralize seus saldos e acompanhe entradas, saídas, aportes e sobra mensal." />
    <BankAccountsManager accounts={accounts} transfers={transfers} />
    {!hasData ? (
      <EmptyState icon={CalendarRange} title="Seu fluxo ainda não tem dados" description="Cadastre movimentações ou compromissos para construir sua projeção." action={<NewMovementButton />} />
    ) : (
      <section className="space-y-4">
        <CashFlowChart months={months} />
        {months.map((month) => {
          const comparisonMax = Math.max(month.planned, month.executed, 1);
          return <article key={month.date.toISOString()} className="dashboard-card p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-wider text-moss-600">{monthFormatter.format(month.date)}</p><h2 className="mt-1 text-lg font-extrabold">Sobra de caixa: <span className={month.leftover >= 0 ?"text-moss-700" : "text-red-600"}>{formatCurrency(month.leftover)}</span></h2></div></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Entradas" value={month.entries} /><Metric label="Saidas" value={month.expenses} /><Metric label="Valor investido" value={month.invested} tone={metricTone(month.invested)} /><Metric label="Sobra de caixa" value={month.leftover} tone={metricTone(month.leftover)} /></div>
            <MonthDetails month={month} />
            {month.planned > 0 && <div className="mt-5 border-t border-slate-100 pt-5"><div className="flex justify-between text-xs"><strong>Planejado vs Executado</strong><span>{formatCurrency(month.planned)} / {formatCurrency(month.executed)}</span></div><div className="mt-3 space-y-2"><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-400" style={{ width: `${month.planned / comparisonMax * 100}%` }} /></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-moss-500" style={{ width: `${month.executed / comparisonMax * 100}%` }} /></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{month.executedByCategory.map((item) => <div key={item.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"><span>{item.category}</span><span className={item.executed > Number(item.planned_amount) ?"font-bold text-amber-600" : "font-bold"}>{formatCurrency(item.executed)} / {formatCurrency(Number(item.planned_amount))}</span></div>)}</div></div>}
          </article>;
        })}
      </section>
    )}
    <IncomeForecastsManager forecasts={forecasts} />
  </>;
}

type CashFlowMonth = {
  entries: number;
  expenses: number;
  invested: number;
  leftover: number;
  transactionExpenses: number;
  recurringExpenses: number;
  installmentExpenses: number;
  financingExpenses: number;
};

function MonthDetails({ month }: { month: CashFlowMonth }) {
  const groups = [
    { label: "Movimentações", value: month.transactionExpenses, color: "bg-slate-700" },
    { label: "Mensalidades", value: month.recurringExpenses, color: "bg-teal-500" },
    { label: "Parcelamentos", value: month.installmentExpenses, color: "bg-blue-500" },
    { label: "Financiamentos", value: month.financingExpenses, color: "bg-amber-500" },
  ];
  const totalExpenses = Math.max(month.expenses, 0);
  const savingsRate = month.entries > 0 ?month.leftover / month.entries : 0;
  const commitmentRate = month.entries > 0 ?month.expenses / month.entries : 0;
  const score = monthScore(month.leftover, month.entries);
  const insight = monthInsight(month, groups);

  return (
    <details className="group mt-5 rounded-2xl border border-slate-100 bg-white/70">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-extrabold text-slate-900 transition hover:text-moss-700">
        <span>Ver mais</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500 group-open:bg-moss-50 group-open:text-moss-700">Perfil do mês</span>
      </summary>
      <div className="border-t border-slate-100 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Distribuicao dos gastos</p>
                <p className="mt-1 text-sm font-bold text-slate-700">{formatCurrency(totalExpenses)}</p>
              </div>
              <ScoreBadge score={score} />
            </div>
            <div className="mt-4 overflow-hidden rounded-full bg-white shadow-inner">
              <div className="flex h-3">
                {groups.map((group) => (
                  <span key={group.label} className={group.color} style={{ width: `${expensePercent(group.value, totalExpenses)}%` }} />
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {groups.map((group) => (
                <div key={group.label} className="rounded-xl bg-white p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-bold text-slate-700"><span className={`size-2 rounded-full ${group.color}`} />{group.label}</span>
                    <span className="font-extrabold text-slate-900">{formatPercent(expensePercent(group.value, totalExpenses) / 100)}</span>
                  </div>
                  <p className="mt-1 text-slate-500">{formatCurrency(group.value)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Perfil financeiro</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-100">{insight}</p>
            <div className="mt-5 space-y-3 text-xs">
              <RatioLine label="Taxa de poupança" value={savingsRate} tone={metricTone(month.leftover)} />
              <RatioLine label="Comprometimento financeiro" value={commitmentRate} tone={commitmentRate > 1 ?"red" : "slate"} />
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}

function CashFlowChart({ months }: { months: Array<{ date: Date; leftover: number; realized: boolean }> }) {
  const max = Math.max(...months.map((month) => Math.abs(month.leftover)), 1);
  return <article className="dashboard-card p-5 sm:p-6"><div><p className="text-xs font-bold uppercase tracking-wider text-moss-600">Sobra mensal</p><h2 className="mt-1 text-lg font-extrabold">Realizado e projetado</h2></div><div className="mt-6 flex h-56 items-end gap-3 border-b border-slate-100 pb-2">{months.map((month) => {
    const positive = month.leftover > 0;
    const negative = month.leftover < 0;
    const barColor = positive
      ?month.realized ?"bg-moss-500" : "bg-teal-400"
      : negative
        ?month.realized ?"bg-red-300" : "bg-rose-400"
        : "bg-slate-300";
    const valueColor = positive ?"text-emerald-700" : negative ?"text-red-600" : "text-slate-500";
    return <div key={month.date.toISOString()} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2"><p className={`text-center text-[10px] font-extrabold leading-tight sm:text-xs ${valueColor}`}>{formatCompactCurrency(month.leftover)}</p><div title={formatCurrency(month.leftover)} className={`min-h-2 rounded-t-xl shadow-sm ${barColor}`} style={{ height: `${Math.max(8, Math.abs(month.leftover) / max * 100)}%` }} /><p className="text-center text-[10px] capitalize text-slate-400">{month.date.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" })}</p></div>;
  })}</div><div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500"><span><span className="mr-1 inline-block size-2 rounded-full bg-moss-500" /> Realizado positivo</span><span><span className="mr-1 inline-block size-2 rounded-full bg-teal-400" /> Projetado positivo</span><span><span className="mr-1 inline-block size-2 rounded-full bg-rose-400" /> Negativo</span></div></article>;
}

type MonthScore = "Excelente" | "Bom" | "Atenção" | "Crítico";
type MetricTone = "slate" | "green" | "red";

function ScoreBadge({ score }: { score: MonthScore }) {
  const colors: Record<MonthScore, string> = {
    Excelente: "bg-emerald-100 text-emerald-700",
    Bom: "bg-moss-50 text-moss-700",
    Atenção: "bg-amber-100 text-amber-700",
    Crítico: "bg-red-100 text-red-700",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${colors[score]}`}>{score}</span>;
}

function RatioLine({ label, value, tone }: { label: string; value: number; tone: MetricTone }) {
  const colors: Record<MetricTone, string> = {
    slate: "text-slate-300",
    green: "text-emerald-300",
    red: "text-red-300",
  };
  return <div className="flex items-center justify-between gap-3"><span className="text-slate-400">{label}</span><strong className={colors[tone]}>{formatPercent(value)}</strong></div>;
}

function Metric({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "green" | "red" }) {
  const colors = { slate: "text-slate-900", green: "text-emerald-600", red: "text-red-600" };
  return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">{label}</p><p className={`mt-2 font-extrabold ${colors[tone]}`}>{formatCurrency(value)}</p></div>;
}

function metricTone(value: number): MetricTone {
  if (value > 0) return "green";
  if (value < 0) return "red";
  return "slate";
}

function monthScore(leftover: number, entries: number): MonthScore {
  if (leftover < 0) return "Crítico";
  if (entries <= 0) return leftover > 0 ?"Bom" : "Atenção";
  const rate = leftover / entries;
  if (rate >= 0.25) return "Excelente";
  if (rate >= 0.1) return "Bom";
  return "Atenção";
}

function monthInsight(month: CashFlowMonth, groups: Array<{ label: string; value: number }>) {
  if (month.leftover < 0) return "Atenção: as saídas superaram as entradas.";
  if (month.entries > 0 && month.leftover / month.entries >= 0.25) return "Boa capacidade de poupança neste mês.";
  const biggest = groups.reduce((current, item) => (item.value > current.value ?item : current), groups[0]);
  if (!biggest || month.expenses <= 0) return "Mes com baixo volume de compromissos financeiros.";
  return `${biggest.label} teve o maior peso dos gastos, com ${formatPercent(biggest.value / month.expenses)} das saídas.`;
}

function expensePercent(value: number, total: number) {
  if (total <= 0 || value <= 0) return 0;
  return Math.max(2, value / total * 100);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
    style: "percent",
  }).format(value);
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
    style: "currency",
    currency: "BRL",
  }).format(value);
}
