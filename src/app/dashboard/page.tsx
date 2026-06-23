import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BrainCircuit,
  CircleDollarSign,
  Landmark,
  PiggyBank,
  ShieldCheck,
  Target,
  TrendingUp,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { CategoriesBreakdown } from "@/components/dashboard/categories-breakdown";
import { NewMovementButton } from "@/components/dashboard/new-movement-button";
import { PageHeading } from "@/components/dashboard/page-heading";
import { TransactionActions } from "@/components/dashboard/transaction-actions";
import {
  CategoryIcon,
} from "@/components/dashboard/category-icon";
import {
  addMonths,
  compactCurrencyFormatter,
  dateFormatter,
  formatCurrency,
  getMonthRange,
  parseDate,
} from "@/lib/finance/format";
import { getInstallmentSchedule } from "@/lib/finance/installment-schedule";
import { projectedMonthlyBillAmountInRange } from "@/lib/finance/monthly-bills";
import { getTransactionCashFlowDate } from "@/lib/finance/transaction-cash-flow";
import { getInvestmentPosition } from "@/lib/finance/investment-position";
import {
  buildEffectiveAllocationAmounts,
  getGoalEffectiveCurrentAmount,
} from "@/lib/finance/goal-allocations";
import {
  financingAmountInMonth,
  getFinancingRemainingMonths,
} from "@/lib/finance/financing";
import {
  getBankAccounts,
  getCreditCards,
  getFinancingCustomPayments,
  getFinancings,
  getGoalInvestmentAllocations,
  getGoals,
  getInstallments,
  getInvestments,
  getInvestmentContributions,
  getInvestmentWithdrawals,
  getMonthlyBills,
  getTransactions,
} from "@/lib/finance/queries";

export const metadata: Metadata = { title: "Visao geral" };

const assetTypes = new Set(["property", "vehicle", "business_stake", "other_asset"]);
const priorityWeight = { high: 3, medium: 2, low: 1 };

export default async function DashboardPage() {
  const [
    transactions,
    goals,
    installments,
    financings,
    financingCustomPayments,
    monthlyBills,
    investments,
    creditCards,
    bankAccounts,
    investmentContributions,
    investmentWithdrawals,
    goalAllocations,
    recentTransactions,
  ] = await Promise.all([
    getTransactions(),
    getGoals(),
    getInstallments(),
    getFinancings(),
    getFinancingCustomPayments(),
    getMonthlyBills(),
    getInvestments(),
    getCreditCards(),
    getBankAccounts(),
    getInvestmentContributions(),
    getInvestmentWithdrawals(),
    getGoalInvestmentAllocations(),
    getTransactions({ limit: 5 }),
  ]);

  if (
    transactions.length === 0 &&
    installments.length === 0 &&
    financings.length === 0 &&
    monthlyBills.length === 0 &&
    investments.length === 0 &&
    bankAccounts.length === 0
  ) {
    return (
      <>
        <PageHeading
          eyebrow="Visao geral"
          title="Sua vida financeira comeca aqui."
          description="Cadastre suas entradas, saídas, contas e objetivos para a Carteira Inteligente montar sua clareza financeira."
        />
        <EmptyState
          icon={WalletCards}
          title="Ainda nao ha dados financeiros"
          description="Registre sua primeira movimentacao ou conta bancaria. A partir dela, sua visao executiva sera atualizada automaticamente."
          action={<NewMovementButton />}
        />
      </>
    );
  }

  const todayDate = new Date();
  const today = todayDate.toISOString().slice(0, 10);
  const { start, end } = getMonthRange(todayDate);
  const previousMonthRange = getMonthRange(addMonths(new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), 1)), -1));
  const cardsById = new Map(creditCards.map((card) => [card.id, card]));
  const customPaymentsByFinancing = new Map(
    financings.map((financing) => [
      financing.id,
      financingCustomPayments.filter((payment) => payment.financing_id === financing.id),
    ]),
  );

  const currentMonth = transactions.filter(
    (transaction) =>
      getTransactionCashFlowDate(transaction) >= start &&
      getTransactionCashFlowDate(transaction) <= end,
  );
  const previousMonth = transactions.filter(
    (transaction) =>
      getTransactionCashFlowDate(transaction) >= previousMonthRange.start &&
      getTransactionCashFlowDate(transaction) <= previousMonthRange.end,
  );

  const monthlyIncome = sumTransactions(currentMonth, "income");
  const monthlyExpenses = currentMonth
    .filter((transaction) => transaction.type === "expense" && !transaction.monthly_bill_id && transaction.category !== "Investimentos")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const previousIncome = sumTransactions(previousMonth, "income");
  const previousExpenses = previousMonth
    .filter((transaction) => transaction.type === "expense" && !transaction.monthly_bill_id && transaction.category !== "Investimentos")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const monthlyInstallments = installments.reduce((sum, installment) => {
    const card = installment.credit_card_id ?cardsById.get(installment.credit_card_id) : undefined;
    return sum + getInstallmentSchedule(installment, card)
      .filter((entry) => entry.dueDate >= start && entry.dueDate <= end)
      .reduce((total, entry) => total + entry.amount, 0);
  }, 0);
  const monthlyFinancings = financings.reduce(
    (sum, financing) =>
      sum +
      financingAmountInMonth(
        financing,
        customPaymentsByFinancing.get(financing.id) ??[],
        start,
        end,
      ),
    0,
  );
  const monthlyRecurringBills = projectedMonthlyBillAmountInRange({
    bills: monthlyBills,
    cardsById,
    transactions,
    start,
    end,
  });
  const committedExpenses =
    monthlyExpenses +
    monthlyInstallments +
    monthlyFinancings +
    monthlyRecurringBills;

  const previousInstallments = installments.reduce((sum, installment) => {
    const card = installment.credit_card_id ?cardsById.get(installment.credit_card_id) : undefined;
    return sum + getInstallmentSchedule(installment, card)
      .filter((entry) => entry.dueDate >= previousMonthRange.start && entry.dueDate <= previousMonthRange.end)
      .reduce((total, entry) => total + entry.amount, 0);
  }, 0);
  const previousFinancings = financings.reduce(
    (sum, financing) =>
      sum +
      financingAmountInMonth(
        financing,
        customPaymentsByFinancing.get(financing.id) ??[],
        previousMonthRange.start,
        previousMonthRange.end,
      ),
    0,
  );
  const previousRecurringBills = projectedMonthlyBillAmountInRange({
    bills: monthlyBills,
    cardsById,
    transactions,
    start: previousMonthRange.start,
    end: previousMonthRange.end,
  });
  const previousCommittedExpenses =
    previousExpenses +
    previousInstallments +
    previousFinancings +
    previousRecurringBills;

  const monthlyInvested = investmentContributions
    .filter((item) => item.impacts_cash_flow !== false && item.contribution_date >= start && item.contribution_date <= end)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const monthlyWithdrawn = investmentWithdrawals
    .filter((item) => item.withdrawal_date >= start && item.withdrawal_date <= end)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const previousInvested = investmentContributions
    .filter((item) => item.impacts_cash_flow !== false && item.contribution_date >= previousMonthRange.start && item.contribution_date <= previousMonthRange.end)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const previousWithdrawn = investmentWithdrawals
    .filter((item) => item.withdrawal_date >= previousMonthRange.start && item.withdrawal_date <= previousMonthRange.end)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const monthlyInvestedNet = monthlyInvested - monthlyWithdrawn;
  const previousInvestedNet = previousInvested - previousWithdrawn;

  const centralizedCash = bankAccounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const cashLeftover = monthlyIncome - committedExpenses - monthlyInvestedNet;
  const previousLeftover = previousIncome - previousCommittedExpenses - previousInvestedNet;
  const savingsCapacity = monthlyIncome - committedExpenses;

  const investmentTotal = investments
    .filter((investment) => !assetTypes.has(investment.asset_type ??investment.type))
    .reduce((sum, investment) => sum + getInvestmentPosition(investment, investmentContributions), 0);
  const patrimonyOnly = investments
    .filter((investment) => assetTypes.has(investment.asset_type ??investment.type))
    .reduce((sum, investment) => sum + getInvestmentPosition(investment, investmentContributions), 0);
  const registeredPatrimony = investmentTotal + patrimonyOnly;
  const totalAssets = centralizedCash + registeredPatrimony;

  const activeGoals = goals
    .filter((goal) => goal.status !== "completed")
    .sort(
      (a, b) =>
        priorityWeight[b.priority] - priorityWeight[a.priority] ||
        a.target_date.localeCompare(b.target_date),
    );
  const categoryTotals = currentMonth
    .filter((transaction) => transaction.type === "expense" && !transaction.monthly_bill_id)
    .reduce<Record<string, number>>((totals, transaction) => {
      totals[transaction.category] = (totals[transaction.category] ??0) + Number(transaction.amount);
      return totals;
    }, {});
  const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setUTCDate(ninetyDaysFromNow.getUTCDate() + 90);
  const horizon = ninetyDaysFromNow.toISOString().slice(0, 10);
  const futureInstallments = installments.flatMap((installment) =>
    getInstallmentSchedule(
      installment,
      installment.credit_card_id ?cardsById.get(installment.credit_card_id) : undefined,
    ).filter((entry) => entry.dueDate >= today && entry.dueDate <= horizon),
  );
  const futureInstallmentTotal = futureInstallments.reduce((sum, entry) => sum + entry.amount, 0);
  const activeMonthlyTotal = monthlyBills
    .filter(
      (bill) =>
        bill.status === "active" &&
        bill.start_date <= horizon &&
        (!bill.end_date || bill.end_date >= today),
    )
    .reduce((sum, bill) => sum + Number(bill.monthly_amount), 0);
  const financingNinetyDays = Array.from({ length: 3 }, (_, index) => {
    const date = addMonths(new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), 1)), index);
    return getMonthRange(date);
  }).reduce(
    (sum, month) =>
      sum +
      financings.reduce(
        (monthSum, financing) =>
          monthSum +
          financingAmountInMonth(
            financing,
            customPaymentsByFinancing.get(financing.id) ??[],
            month.start,
            month.end,
          ),
        0,
      ),
    0,
  );
  const futureCommitments = activeMonthlyTotal * 3 + futureInstallmentTotal + financingNinetyDays;

  const evolution = buildPatrimonyEvolution({
    totalAssets,
    transactions,
    investmentContributions,
    investmentWithdrawals,
    currentMonthStart: new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), 1)),
  });

  const insights = buildInsights({
    cashLeftover,
    monthlyIncome,
    committedExpenses,
    futureCommitments,
    centralizedCash,
    monthlyInvested: monthlyInvestedNet,
    previousInvested: previousInvestedNet,
    activeGoalCount: activeGoals.length,
  });
  const effectiveAllocationAmounts = buildEffectiveAllocationAmounts(
    goalAllocations,
    investments,
    investmentContributions,
  );

  return (
    <>
      <PageHeading
        eyebrow="Visao geral"
        title="Clareza financeira para decidir melhor."
        description="Uma leitura executiva do seu caixa, compromissos, patrimônio e objetivos com base nos dados já cadastrados."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ExecutiveCard label="Caixa atual" value={formatCurrency(centralizedCash)} icon={WalletCards} tone="slate" help="Soma atual dos saldos de todas as contas bancarias." />
        <ExecutiveCard label="Sobra do mês" value={formatCurrency(cashLeftover)} icon={PiggyBank} tone={toneFromValue(cashLeftover)} detail={deltaLabel(cashLeftover - previousLeftover)} help="Entradas menos saídas comprometidas e aportes do mês." />
        <ExecutiveCard label="Capacidade de poupança" value={formatCurrency(savingsCapacity)} icon={ShieldCheck} tone={toneFromValue(savingsCapacity)} help="Entradas do mês menos despesas comprometidas, antes de aportes." />
        <ExecutiveCard label="Investido no mês" value={formatCurrency(monthlyInvestedNet)} icon={TrendingUp} tone={toneFromValue(monthlyInvestedNet)} detail={monthlyInvestedNet > previousInvestedNet ?"Acima do mês anterior" : previousInvestedNet > monthlyInvestedNet ?"Abaixo do mês anterior" : "Estável vs. mês anterior"} help="Aportes menos saques em investimentos que impactam o caixa neste mês." />
        <ExecutiveCard label="Patrimônio atual" value={formatCurrency(totalAssets)} icon={Landmark} tone={toneFromValue(totalAssets)} help="Caixa centralizado, investimentos e bens patrimoniais cadastrados." />
        <ExecutiveCard label="Investimentos" value={formatCurrency(investmentTotal)} icon={TrendingUp} tone={toneFromValue(investmentTotal)} help="Posição atual dos investimentos cadastrados." />
        <ExecutiveCard label="Bens patrimoniais" value={formatCurrency(patrimonyOnly)} icon={CircleDollarSign} tone="slate" help="Imoveis, veiculos, participacoes e outros bens." />
        <ExecutiveCard label="Objetivos ativos" value={String(activeGoals.length)} icon={Target} tone={activeGoals.length > 0 ?"green" : "slate"} help="Objetivos financeiros em andamento." />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
        <PatrimonyEvolutionChart evolution={evolution} />
        <ExecutiveInsights insights={insights} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="dashboard-card p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-moss-600">Compromissos</p>
              <h2 className="mt-1 text-lg font-extrabold">Próximos 90 dias</h2>
            </div>
            <Link href="/dashboard/fluxo-de-caixa" className="inline-flex items-center gap-1 text-xs font-bold text-moss-700">Ver fluxo <ArrowRight className="size-4" /></Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <CommitmentCard href="/dashboard/mensalidades" label="Mensalidades" value={activeMonthlyTotal * 3} detail={`${monthlyBills.filter((bill) => bill.status === "active").length} recorrentes`} />
            <CommitmentCard href="/dashboard/parcelamentos" label="Parcelamentos" value={futureInstallmentTotal} detail={`${futureInstallments.length} vencimentos`} />
            <CommitmentCard href="/dashboard/financiamentos" label="Financiamentos" value={financingNinetyDays} detail={`${financings.filter((item) => getFinancingRemainingMonths(item, customPaymentsByFinancing.get(item.id) ??[]) > 0).length} contratos`} />
          </div>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-600">Pressao futura estimada</span>
              <strong>{formatCurrency(futureCommitments)}</strong>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div className={`h-full rounded-full ${futureCommitments > Math.max(centralizedCash, monthlyIncome) ?"bg-amber-500" : "bg-moss-500"}`} style={{ width: `${Math.min(100, futureCommitments / Math.max(1, centralizedCash + monthlyIncome) * 100)}%` }} />
            </div>
          </div>
        </article>

        <GoalsPanel
          goals={activeGoals}
          allocations={goalAllocations}
          effectiveAllocationAmounts={effectiveAllocationAmounts}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
        <CategoriesPanel categories={categories} monthlyExpenses={monthlyExpenses} monthlyRecurringBills={monthlyRecurringBills} />
        <RecentTransactionsPanel transactions={recentTransactions} cardsById={cardsById} />
      </section>
    </>
  );
}

function ExecutiveCard({
  label,
  value,
  icon: Icon,
  tone,
  detail,
  help,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: MetricTone;
  detail?: string;
  help?: string;
}) {
  const styles: Record<MetricTone, { icon: string; text: string }> = {
    slate: { icon: "bg-slate-100 text-slate-700", text: "text-slate-950" },
    green: { icon: "bg-emerald-50 text-emerald-700", text: "text-emerald-700" },
    red: { icon: "bg-red-50 text-red-700", text: "text-red-600" },
  };
  return (
    <article className="dashboard-card p-5" title={help}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-400">{label}</p>
          <p className={`mt-2 truncate font-[var(--font-manrope)] text-2xl font-extrabold tracking-tight ${styles[tone].text}`}>{value}</p>
        </div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${styles[tone].icon}`}>
          <Icon className="size-5" />
        </span>
      </div>
      {detail && <p className="mt-4 text-xs font-semibold text-slate-500">{detail}</p>}
    </article>
  );
}

function PatrimonyEvolutionChart({ evolution }: { evolution: Array<{ date: Date; value: number; delta: number }> }) {
  const values = evolution.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, Math.abs(max) * 0.02, 1);
  return (
    <article className="dashboard-card max-w-full overflow-hidden p-5 sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-moss-600">Evolução patrimonial</p>
        <h2 className="mt-1 text-lg font-extrabold">Patrimônio liquido simplificado</h2>
        <p className="mt-1 text-xs text-slate-400">Janela movel dos ultimos 6 mêses, usando caixa, investimentos e bens cadastrados.</p>
      </div>
      <div className="mt-6 overflow-x-auto pb-2">
        <div className="flex h-56 min-w-[30rem] items-end gap-3 border-b border-slate-100 pb-2 sm:min-w-0">
        {evolution.map((item) => {
          const positive = item.value > 0;
          const negative = item.value < 0;
          const barColor = positive ?"bg-moss-500" : negative ?"bg-rose-400" : "bg-slate-300";
          const valueColor = positive ?"text-emerald-700" : negative ?"text-red-600" : "text-slate-500";
          const height = max === min ?62 : 18 + ((item.value - min) / range) * 82;
          return (
            <div key={item.date.toISOString()} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
              <p className={`text-center text-[10px] font-extrabold leading-tight sm:text-xs ${valueColor}`}>{compactCurrencyFormatter.format(item.value)}</p>
              <div className={`min-h-4 rounded-t-xl shadow-sm ${barColor}`} style={{ height: `${Math.min(100, Math.max(12, height))}%` }} />
              <p className="text-center text-[10px] capitalize text-slate-400">{item.date.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" })}</p>
            </div>
          );
        })}
        </div>
      </div>
    </article>
  );
}

function ExecutiveInsights({ insights }: { insights: Array<{ title: string; tone: MetricTone }> }) {
  const colors: Record<MetricTone, string> = {
    slate: "bg-slate-50 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <article className="dashboard-card min-w-0 p-5 sm:p-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-moss-100 text-moss-700"><BrainCircuit className="size-5" /></span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-moss-600">Leituras automáticas</p>
          <h2 className="text-lg font-extrabold">Saúde financeira</h2>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {insights.map((insight) => (
          <div key={insight.title} className={`overflow-hidden break-words rounded-2xl p-4 text-sm font-semibold leading-6 ${colors[insight.tone]}`}>
            {insight.title}
          </div>
        ))}
      </div>
    </article>
  );
}

function CommitmentCard({ href, label, value, detail }: { href: string; label: string; value: number; detail: string }) {
  return (
    <Link href={href} className="rounded-2xl bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-slate-100">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-extrabold">{formatCurrency(value)}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </Link>
  );
}

function GoalsPanel({
  goals,
  allocations,
  effectiveAllocationAmounts,
}: {
  goals: Awaited<ReturnType<typeof getGoals>>;
  allocations: Awaited<ReturnType<typeof getGoalInvestmentAllocations>>;
  effectiveAllocationAmounts: Map<string, number>;
}) {
  return (
    <article className="dashboard-card min-w-0 p-5 sm:p-6">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-moss-600">Objetivos</p>
          <h2 className="mt-1 text-lg font-extrabold">Em andamento</h2>
        </div>
        <Link href="/dashboard/objetivos" className="inline-flex items-center gap-1 text-xs font-bold text-moss-700">Ver objetivos <ArrowRight className="size-4" /></Link>
      </div>
      {goals.length > 0 ? (
        <div className="mt-5 space-y-3">
          {goals.slice(0, 3).map((goal) => {
            const currentAmount = getGoalEffectiveCurrentAmount(
              goal,
              allocations,
              effectiveAllocationAmounts,
            );
            const targetAmount = Number(goal.target_amount);
            const missingAmount = Math.max(0, targetAmount - currentAmount);
            const progress = goalPercent(currentAmount, targetAmount);
            return (
              <div key={goal.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold">{goal.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatCurrency(currentAmount)} de {formatCurrency(targetAmount)}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">Faltam {formatCurrency(missingAmount)}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-moss-700">{progress}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-moss-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
          <p>Nenhum objetivo cadastrado ou em andamento.</p>
          <Link href="/dashboard/objetivos" className="mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white">
            Criar objetivo
          </Link>
        </div>
      )}
    </article>
  );
}

function CategoriesPanel({ categories, monthlyExpenses, monthlyRecurringBills }: { categories: Array<[string, number]>; monthlyExpenses: number; monthlyRecurringBills: number }) {
  const categorizedExpenses = Math.max(monthlyExpenses + monthlyRecurringBills, 1);
  return (
    <article className="dashboard-card min-w-0 p-5 sm:p-6">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-moss-600">Este mês</p>
          <h2 className="mt-1 text-lg font-extrabold">Top categorias de saída</h2>
        </div>
        <Link href="/dashboard/movimentacoes" className="hidden items-center gap-1 text-xs font-bold text-moss-700 sm:inline-flex">Histórico <ArrowRight className="size-4" /></Link>
      </div>
      {categories.length > 0 ? (
        <CategoriesBreakdown categories={categories} total={categorizedExpenses} monthlyExpenses={monthlyExpenses} />
      ) : (
        <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Nenhuma saída registrada neste mês.</div>
      )}
    </article>
  );
}

function RecentTransactionsPanel({
  transactions,
  cardsById,
}: {
  transactions: Awaited<ReturnType<typeof getTransactions>>;
  cardsById: Map<string, Awaited<ReturnType<typeof getCreditCards>>[number]>;
}) {
  return (
    <article className="dashboard-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-moss-600">Histórico</p>
          <h2 className="mt-1 text-lg font-extrabold">Movimentações recentes</h2>
        </div>
        <NewMovementButton compact />
      </div>
      <div className="mt-5 divide-y divide-slate-100">
        {transactions.map((transaction) => {
          const income = transaction.type === "income";
          const card = transaction.credit_card_id ?cardsById.get(transaction.credit_card_id) : undefined;
          const impactDate = getTransactionCashFlowDate(transaction);
          return (
            <details key={transaction.id} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${income ?"bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                  <CategoryIcon category={transaction.category} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{transaction.description}</p>
                  <p className="text-xs text-slate-400">{dateFormatter.format(parseDate(transaction.transaction_date))}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-sm font-extrabold ${income ?"text-emerald-600" : "text-slate-900"}`}>{income ?"+" : "-"} {formatCurrency(Number(transaction.amount))}</p>
                  <p className="mt-1 text-[10px] font-bold text-moss-700 group-open:hidden">Ver detalhes</p>
                  <p className="mt-1 hidden text-[10px] font-bold text-slate-400 group-open:block">Ocultar</p>
                </div>
              </summary>
              <div className="ml-[52px] mt-3 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
                <p className="break-words"><strong className="text-slate-700">Categoria:</strong> {transaction.category}</p>
                {card && <p className="mt-1 break-words"><strong className="text-slate-700">Cartão:</strong> {card.name} final {card.last_four_digits}</p>}
                <p className="mt-1 break-words"><strong className="text-slate-700">Impacto no fluxo:</strong> {dateFormatter.format(parseDate(impactDate))}</p>
                <div className="mt-3">
                  <TransactionActions transaction={transaction} />
                </div>
              </div>
            </details>
          );
        })}
      </div>
      <Link href="/dashboard/movimentacoes" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-moss-700">Histórico completo <ArrowRight className="size-4" /></Link>
    </article>
  );
}

type MetricTone = "slate" | "green" | "red";

function toneFromValue(value: number): MetricTone {
  if (value > 0) return "green";
  if (value < 0) return "red";
  return "slate";
}

function sumTransactions(transactions: Awaited<ReturnType<typeof getTransactions>>, type: "income" | "expense") {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
}

function goalPercent(current: number, target: number) {
  if (Number(target) <= 0) return 0;
  return Math.min(100, Math.round(Number(current) / Number(target) * 100));
}

function deltaLabel(delta: number) {
  if (delta > 0) return `${formatCurrency(delta)} acima do mês anterior`;
  if (delta < 0) return `${formatCurrency(Math.abs(delta))} abaixo do mês anterior`;
  return "Estável vs. mês anterior";
}

function buildPatrimonyEvolution({
  totalAssets,
  transactions,
  investmentContributions,
  investmentWithdrawals,
  currentMonthStart,
}: {
  totalAssets: number;
  transactions: Awaited<ReturnType<typeof getTransactions>>;
  investmentContributions: Awaited<ReturnType<typeof getInvestmentContributions>>;
  investmentWithdrawals: Awaited<ReturnType<typeof getInvestmentWithdrawals>>;
  currentMonthStart: Date;
}) {
  const months = Array.from({ length: 6 }, (_, index) => addMonths(currentMonthStart, index - 5));
  const deltas = months.map((date) => {
    const { start, end } = getMonthRange(date);
    const transactionNet = transactions
      .filter((transaction) => getTransactionCashFlowDate(transaction) >= start && getTransactionCashFlowDate(transaction) <= end)
      .reduce(
        (sum, transaction) =>
          sum +
          (transaction.type === "income"
    ?Number(transaction.amount)
            : transaction.monthly_bill_id
              ?0
              : -Number(transaction.amount)),
        0,
      );
    const invested = investmentContributions
      .filter((item) => item.impacts_cash_flow !== false && item.contribution_date >= start && item.contribution_date <= end)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const withdrawn = investmentWithdrawals
      .filter((item) => item.withdrawal_date >= start && item.withdrawal_date <= end)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    return transactionNet + invested - withdrawn;
  });
  let running = totalAssets - deltas.reduce((sum, delta) => sum + delta, 0);
  return months.map((date, index) => {
    running += deltas[index];
    return { date, delta: deltas[index], value: running };
  });
}

function buildInsights({
  cashLeftover,
  monthlyIncome,
  committedExpenses,
  futureCommitments,
  centralizedCash,
  monthlyInvested,
  previousInvested,
  activeGoalCount,
}: {
  cashLeftover: number;
  monthlyIncome: number;
  committedExpenses: number;
  futureCommitments: number;
  centralizedCash: number;
  monthlyInvested: number;
  previousInvested: number;
  activeGoalCount: number;
}) {
  const insights: Array<{ title: string; tone: MetricTone }> = [];
  insights.push(
    cashLeftover >= 0
      ?{ title: "Sua sobra de caixa está positiva este mês.", tone: "green" }
      : { title: "Atenção: as saídas e aportes superam as entradas deste mês.", tone: "red" },
  );
  if (monthlyIncome > 0 && committedExpenses / monthlyIncome > 0.75) {
    insights.push({ title: "Seus compromissos consomem mais de 75% das entradas do mês.", tone: "red" });
  } else if (monthlyIncome > 0) {
    insights.push({ title: "Seu comprometimento financeiro está sob controle neste mês.", tone: "green" });
  }
  if (futureCommitments > centralizedCash + monthlyIncome) {
    insights.push({ title: "Atenção: os compromissos futuros pressionam o caixa disponível.", tone: "red" });
  }
  if (monthlyInvested > previousInvested) {
    insights.push({ title: "Você investiu mais este mês do que no mês anterior.", tone: "green" });
  }
  if (activeGoalCount > 0) {
    insights.push({ title: "Você possui objetivos financeiros em andamento.", tone: "slate" });
  }
  return insights.slice(0, 4);
}
