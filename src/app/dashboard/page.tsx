import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BrainCircuit,
  CircleDollarSign,
  CreditCard,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { NewMovementButton } from "@/components/dashboard/new-movement-button";
import { PageHeading } from "@/components/dashboard/page-heading";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { TransactionActions } from "@/components/dashboard/transaction-actions";
import {
  CategoryIcon,
  FinancingTypeIcon,
} from "@/components/dashboard/category-icon";
import { addMonths, formatCurrency, getMonthRange, parseDate, dateFormatter } from "@/lib/finance/format";
import { getInstallmentSchedule } from "@/lib/finance/installment-schedule";
import { getTransactionCashFlowDate } from "@/lib/finance/transaction-cash-flow";
import { getInvestmentPosition } from "@/lib/finance/investment-position";
import {
  financingAmountInMonth,
  getFinancingRemainingMonths,
} from "@/lib/finance/financing";
import {
  getBankAccounts,
  getCreditCards,
  getFinancingCustomPayments,
  getFinancings,
  getGoals,
  getInstallments,
  getInvestments,
  getInvestmentContributions,
  getMonthlyBills,
  getTransactions,
} from "@/lib/finance/queries";

export const metadata: Metadata = { title: "Visão geral" };

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
    getTransactions({ limit: 5 }),
  ]);

  if (
    transactions.length === 0 &&
    installments.length === 0 &&
    financings.length === 0 &&
    monthlyBills.length === 0 &&
    investments.length === 0
    && bankAccounts.length === 0
  ) {
    return (
      <>
        <PageHeading
          eyebrow="Visão geral"
          title="Sua vida financeira começa aqui."
          description="Cadastre suas receitas e despesas para a Carteira Inteligente calcular seu saldo e mostrar para onde seu dinheiro está indo."
        />
        <EmptyState
          icon={WalletCards}
          title="Ainda não há movimentações"
          description="Registre sua primeira entrada ou saída. A partir dela, seu dashboard será atualizado automaticamente com dados reais."
          action={<NewMovementButton />}
        />
      </>
    );
  }

  const { start, end } = getMonthRange();
  const currentMonth = transactions.filter(
    (transaction) =>
      getTransactionCashFlowDate(transaction) >= start &&
      getTransactionCashFlowDate(transaction) <= end,
  );

  const monthlyIncome = currentMonth
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const monthlyExpenses = currentMonth
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const today = new Date().toISOString().slice(0, 10);
  const cardsById = new Map(creditCards.map((card) => [card.id, card]));
  const monthlyInstallments = installments.reduce((sum, installment) => {
    const card = installment.credit_card_id
      ? cardsById.get(installment.credit_card_id)
      : undefined;
    return (
      sum +
      getInstallmentSchedule(installment, card)
        .filter((entry) => entry.dueDate >= start && entry.dueDate <= end)
        .reduce((total, entry) => total + entry.amount, 0)
    );
  }, 0);
  const customPaymentsByFinancing = new Map(
    financings.map((financing) => [
      financing.id,
      financingCustomPayments.filter(
        (payment) => payment.financing_id === financing.id,
      ),
    ]),
  );
  const monthlyFinancings = financings.reduce(
    (sum, financing) =>
      sum +
      financingAmountInMonth(
        financing,
        customPaymentsByFinancing.get(financing.id) ?? [],
        start,
        end,
      ),
    0,
  );
  const monthlyRecurringBills = monthlyBills
    .filter(
      (bill) =>
        bill.status === "active" &&
        bill.start_date <= end &&
        (!bill.end_date || bill.end_date >= start),
    )
    .reduce((sum, bill) => sum + Number(bill.monthly_amount), 0);
  const committedExpenses =
    monthlyExpenses +
    monthlyInstallments +
    monthlyFinancings +
    monthlyRecurringBills;
  const centralizedCash = bankAccounts.reduce(
    (sum, account) => sum + Number(account.balance),
    0,
  );
  const savingsCapacity = monthlyIncome - committedExpenses;
  const patrimonyAssetTypes = new Set(["property", "vehicle", "business_stake", "other_asset"]);
  const investedAssets = investments
    .filter((investment) => !patrimonyAssetTypes.has(investment.asset_type ?? investment.type))
    .reduce((sum, investment) => sum + getInvestmentPosition(
      investment,
      investmentContributions,
    ), 0);
  const registeredPatrimony = investments.reduce(
    (sum, investment) => sum + getInvestmentPosition(
      investment,
      investmentContributions,
    ),
    0,
  );
  const totalAssets = centralizedCash + registeredPatrimony;

  const categoryTotals = currentMonth
    .filter((transaction) => transaction.type === "expense")
    .reduce<Record<string, number>>((totals, transaction) => {
      totals[transaction.category] =
        (totals[transaction.category] ?? 0) + Number(transaction.amount);
      return totals;
    }, {});
  monthlyBills
    .filter(
      (bill) =>
        bill.status === "active" &&
        bill.start_date <= end &&
        (!bill.end_date || bill.end_date >= start),
    )
    .forEach((bill) => {
      categoryTotals[bill.category] =
        (categoryTotals[bill.category] ?? 0) + Number(bill.monthly_amount);
    });
  const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const largestCategory = categories[0];

  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const primaryGoal = goals
    .filter((goal) => goal.status === "active")
    .sort(
      (a, b) =>
        priorityWeight[b.priority] - priorityWeight[a.priority] ||
        a.target_date.localeCompare(b.target_date),
    )[0];
  const goalProgress = primaryGoal
    ? Math.min(
        100,
        Math.round(
          (Number(primaryGoal.current_amount) / Number(primaryGoal.target_amount)) *
            100,
        ),
      )
    : 0;

  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setUTCDate(ninetyDaysFromNow.getUTCDate() + 90);
  const horizon = ninetyDaysFromNow.toISOString().slice(0, 10);
  const futureInstallments = installments.flatMap((installment) =>
    getInstallmentSchedule(
      installment,
      installment.credit_card_id
        ? cardsById.get(installment.credit_card_id)
        : undefined,
    ).filter((entry) => entry.dueDate >= today && entry.dueDate <= horizon),
  );
  const futureInstallmentTotal = futureInstallments.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );
  const activeMonthlyTotal = monthlyBills
    .filter(
      (bill) =>
        bill.status === "active" &&
        bill.start_date <= horizon &&
        (!bill.end_date || bill.end_date >= today),
    )
    .reduce((sum, bill) => sum + Number(bill.monthly_amount), 0);
  const financingNinetyDays = Array.from({ length: 3 }, (_, index) => {
    const date = addMonths(
      new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)),
      index,
    );
    return getMonthRange(date);
  }).reduce(
    (sum, month) =>
      sum +
      financings
        .reduce(
          (monthSum, financing) =>
            monthSum +
            financingAmountInMonth(
              financing,
              customPaymentsByFinancing.get(financing.id) ?? [],
              month.start,
              month.end,
            ),
          0,
        ),
    0,
  );

  const evolutionMonths = Array.from({ length: 6 }, (_, index) => {
    const date = addMonths(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)), index - 5);
    const { start: monthStart, end: monthEnd } = getMonthRange(date);
    const net = transactions
      .filter(
        (transaction) =>
          getTransactionCashFlowDate(transaction) >= monthStart &&
          getTransactionCashFlowDate(transaction) <= monthEnd,
      )
      .reduce(
        (sum, transaction) =>
          sum +
          (transaction.type === "income"
            ? Number(transaction.amount)
            : -Number(transaction.amount)),
        0,
      );
    return { date, net };
  });
  let runningAssets =
    totalAssets -
    evolutionMonths.reduce((sum, month) => sum + month.net, 0);
  const evolution = evolutionMonths.map((month) => {
    runningAssets += month.net;
    return { ...month, value: runningAssets };
  });
  const maxEvolution = Math.max(...evolution.map((item) => Math.abs(item.value)), 1);

  return (
    <>
      <PageHeading
        eyebrow="Visão geral"
        title="Sua vida financeira, em perspectiva."
        description="Valores calculados a partir das movimentações salvas na sua conta."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Caixa Centralizado" value={formatCurrency(centralizedCash)} icon={WalletCards} help="Soma atual dos saldos de todas as contas bancárias." />
        <SummaryCard label="Patrimônio investido" value={formatCurrency(investedAssets)} icon={TrendingUp} tone="blue" help="Soma do valor atual de todos os investimentos." />
        <SummaryCard label="Patrimônio total" value={formatCurrency(totalAssets)} icon={ShieldCheck} help="Saldo disponível mais investimentos e bens cadastrados." />
        <SummaryCard label="Despesas comprometidas" value={formatCurrency(committedExpenses)} icon={CreditCard} tone="amber" help="Despesas do mês, mensalidades, parcelas, financiamentos e empréstimos ativos." />
        <SummaryCard label="Capacidade de poupança" value={formatCurrency(savingsCapacity)} icon={PiggyBank} help="Receitas do mês menos despesas comprometidas." />
        <SummaryCard label="Objetivo principal" value={primaryGoal ? `${goalProgress}% concluído` : "Não definido"} icon={CircleDollarSign} help="Objetivo ativo com maior prioridade." />
      </section>

      <section className="dashboard-card mt-6 p-6">
        <div><p className="text-xs font-bold uppercase tracking-wider text-moss-600">Evolução patrimonial</p><h2 className="mt-2 text-lg font-extrabold">Patrimônio líquido simplificado</h2><p className="mt-1 text-xs text-slate-400">Investimentos atuais combinados ao resultado das movimentações mensais.</p></div>
        <div className="mt-8 flex h-44 items-end gap-3 border-b border-slate-100">
          {evolution.map((item) => <div key={item.date.toISOString()} className="group flex h-full flex-1 items-end"><div title={formatCurrency(item.value)} className="w-full rounded-t-lg bg-moss-100 transition hover:bg-moss-500" style={{ height: `${Math.max(5, Math.abs(item.value) / maxEvolution * 100)}%` }} /></div>)}
        </div>
        <div className="mt-3 grid grid-cols-6 text-center text-[10px] capitalize text-slate-400">{evolution.map((item) => <span key={item.date.toISOString()}>{item.date.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" })}</span>)}</div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.85fr]">
        <article className="dashboard-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-moss-600">Este mês</p>
              <h2 className="mt-2 font-[var(--font-manrope)] text-lg font-extrabold">Despesas por categoria</h2>
              <p className="mt-1 text-xs text-slate-400">Distribuição das saídas registradas no período.</p>
            </div>
            <Link href="/dashboard/fluxo-de-caixa" className="focus-ring hidden items-center gap-1 rounded-lg text-xs font-bold text-moss-700 sm:flex">
              Ver fluxo <ArrowRight className="size-4" />
            </Link>
          </div>

          {categories.length > 0 ? (
            <div className="mt-7 space-y-5">
              {categories.slice(0, 6).map(([category, amount], index) => {
                const categorizedExpenses = monthlyExpenses + monthlyRecurringBills;
                const percentage = categorizedExpenses > 0 ? (amount / categorizedExpenses) * 100 : 0;
                return (
                  <div key={category}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-semibold text-slate-600"><CategoryIcon category={category} />{category}</span>
                      <span className="font-extrabold">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={index === 0 ? "h-full rounded-full bg-moss-500" : "h-full rounded-full bg-slate-300"}
                        style={{ width: `${Math.max(4, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              Nenhuma despesa registrada neste mês.
            </div>
          )}
        </article>

        {primaryGoal ? (
          <article className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400">Objetivo principal</p>
                <h2 className="mt-2 font-[var(--font-manrope)] text-xl font-extrabold">{primaryGoal.name}</h2>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-moss-500/15 text-moss-500"><CircleDollarSign className="size-5" /></span>
            </div>
            <div className="mt-10 flex items-end justify-between">
              <div><p className="text-3xl font-extrabold">{formatCurrency(Number(primaryGoal.current_amount))}</p><p className="mt-1 text-xs text-slate-400">de {formatCurrency(Number(primaryGoal.target_amount))}</p></div>
              <p className="text-xl font-bold text-moss-500">{goalProgress}%</p>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-moss-500" style={{ width: `${goalProgress}%` }} /></div>
            <p className="mt-5 text-xs leading-5 text-slate-400">Data alvo: {dateFormatter.format(parseDate(primaryGoal.target_date))}.</p>
            <Link href="/dashboard/objetivos" className="focus-ring mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-slate-900">Ver objetivo <ArrowRight className="size-4" /></Link>
          </article>
        ) : (
          <article className="dashboard-card flex flex-col items-center justify-center p-6 text-center">
            <CircleDollarSign className="size-9 text-moss-500" />
            <h2 className="mt-4 font-extrabold">Defina seu primeiro objetivo</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">A estrutura está pronta para acompanhar suas metas financeiras.</p>
            <Link href="/dashboard/objetivos" className="mt-5 text-sm font-bold text-moss-700">Ir para objetivos</Link>
          </article>
        )}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.95fr]">
        <article className="dashboard-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-moss-600">Histórico</p>
              <h2 className="mt-2 font-[var(--font-manrope)] text-lg font-extrabold">Movimentações recentes</h2>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/movimentacoes" className="text-xs font-bold text-moss-700">Ver todas</Link>
              <NewMovementButton compact />
            </div>
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            {recentTransactions.map((transaction) => {
              const income = transaction.type === "income";
              const card = transaction.credit_card_id
                ? cardsById.get(transaction.credit_card_id)
                : undefined;
              const impactDate = getTransactionCashFlowDate(transaction);
              return (
                <div key={transaction.id} className="flex items-center gap-3 py-3">
                  <span className={`grid size-10 place-items-center rounded-xl ${income ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    <CategoryIcon category={transaction.category} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{transaction.description}</p>
                    <p className="text-xs text-slate-400">
                      {transaction.category}
                      {card
                        ? ` · ${card.name} final ${card.last_four_digits}`
                        : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {card
                        ? `Compra em ${dateFormatter.format(parseDate(transaction.transaction_date))} · Impacta em ${dateFormatter.format(parseDate(impactDate))}`
                        : dateFormatter.format(parseDate(transaction.transaction_date))}
                    </p>
                  </div>
                  <p className={`text-sm font-extrabold ${income ? "text-emerald-600" : "text-slate-900"}`}>
                    {income ? "+" : "-"} {formatCurrency(Number(transaction.amount))}
                  </p>
                  <TransactionActions transaction={transaction} />
                </div>
              );
            })}
          </div>
        </article>

        <article className="dashboard-card p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-moss-100 text-moss-700"><BrainCircuit className="size-5" /></span>
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-moss-600">Leituras automáticas</p><h2 className="font-[var(--font-manrope)] text-lg font-extrabold">Recomendações da Carteira</h2></div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-bold">{savingsCapacity >= 0 ? `Você poupou ${formatCurrency(savingsCapacity)} neste mês.` : `Suas despesas superaram as receitas em ${formatCurrency(Math.abs(savingsCapacity))}.`}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{savingsCapacity >= 0 ? "O cálculo já considera parcelas, financiamentos e empréstimos ativos." : "Revise as maiores categorias antes de assumir novos compromissos."}</p>
            </div>
            {largestCategory && (
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-bold">{largestCategory[0]} é sua maior categoria de despesa.</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Ela representa {Math.round((largestCategory[1] / (monthlyExpenses + monthlyRecurringBills)) * 100)}% das saídas categorizadas deste mês.</p>
              </div>
            )}
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-bold">Seu Caixa Centralizado é {formatCurrency(centralizedCash)}.</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Entradas, saídas, transferências e aportes atualizam os saldos das contas.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-6">
        <div className="mb-4"><p className="text-xs font-bold uppercase tracking-wider text-moss-600">Próximos 90 dias</p><h2 className="mt-1 text-xl font-extrabold">Compromissos futuros</h2></div>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/dashboard/mensalidades" className="dashboard-card p-5 transition hover:-translate-y-0.5"><p className="text-xs text-slate-400">Mensalidades ativas</p><p className="mt-2 text-xl font-extrabold">{formatCurrency(activeMonthlyTotal * 3)}</p><p className="mt-2 text-xs text-slate-500">{monthlyBills.filter((bill) => bill.status === "active").length} compromissos recorrentes</p></Link>
          <Link href="/dashboard/parcelamentos" className="dashboard-card p-5 transition hover:-translate-y-0.5"><p className="text-xs text-slate-400">Parcelas previstas</p><p className="mt-2 text-xl font-extrabold">{formatCurrency(futureInstallmentTotal)}</p><p className="mt-2 text-xs text-slate-500">{futureInstallments.length} vencimentos calculados</p></Link>
          <Link href="/dashboard/financiamentos" className="dashboard-card p-5 transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Financiamentos e empréstimos</p>
              <div className="flex -space-x-1">
                {financings.slice(0, 3).map((item) => (
                  <span key={item.id} className="grid size-7 place-items-center rounded-full border-2 border-white bg-slate-100 text-slate-600">
                    <FinancingTypeIcon type={item.type} className="size-3.5" />
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-2 text-xl font-extrabold">{formatCurrency(financingNinetyDays)}</p>
            <p className="mt-2 text-xs text-slate-500">{financings.filter((item) => getFinancingRemainingMonths(item, customPaymentsByFinancing.get(item.id) ?? []) > 0).length} contratos ativos</p>
          </Link>
        </div>
      </section>
    </>
  );
}
