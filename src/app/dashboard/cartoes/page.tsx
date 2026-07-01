import type { Metadata } from "next";
import { CreditCardsManager } from "@/components/dashboard/credit-cards-manager";
import { InstallmentsManager } from "@/components/dashboard/installments-manager";
import { PageHeading } from "@/components/dashboard/page-heading";
import { CurrencyValue } from "@/components/ui/currency-value";
import { getInstallmentSchedule } from "@/lib/finance/installment-schedule";
import { getTransactionCashFlowDate } from "@/lib/finance/transaction-cash-flow";
import { getCreditCards, getInstallments, getTransactions } from "@/lib/finance/queries";

export const metadata: Metadata = { title: "Cartões e Parcelamentos" };

type CardsAndInstallmentsPageProps = {
  searchParams: Promise<{ onboarding?: string }>;
};

export default async function CardsAndInstallmentsPage({ searchParams }: CardsAndInstallmentsPageProps) {
  const { onboarding } = await searchParams;
  const [cards, installments, transactions] = await Promise.all([getCreditCards(), getInstallments(), getTransactions()]);
  const today = new Date().toISOString().slice(0, 10);
  const nextDates = [
    ...transactions.filter((item) => item.credit_card_id && getTransactionCashFlowDate(item) >= today).map((item) => ({ date: getTransactionCashFlowDate(item), amount: Number(item.amount) })),
    ...installments.flatMap((item) => getInstallmentSchedule(item, item.credit_card_id ?cards.find((card) => card.id === item.credit_card_id) : undefined).filter((entry) => entry.dueDate >= today).map((entry) => ({ date: entry.dueDate, amount: entry.amount }))),
  ].sort((a, b) => a.date.localeCompare(b.date));
  const nextDueDate = nextDates[0]?.date;
  const nextInvoice = nextDueDate ?nextDates.filter((item) => item.date === nextDueDate).reduce((sum, item) => sum + item.amount, 0) : 0;

  return <>
    <PageHeading eyebrow="Meios de pagamento" title="Cartões e Parcelamentos" description="Gerencie cartões, compras parceladas e a próxima fatura em um único lugar." />
    <section className="dashboard-card mb-8 min-w-0 p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-wider text-moss-600">Resumo da próxima fatura</p><div className="mt-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div className="min-w-0"><CurrencyValue value={nextInvoice} size="xl" className="font-extrabold" /><p className="mt-1 text-xs text-slate-400">{nextDueDate ?`Vencimentos em ${new Date(`${nextDueDate}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" })}` : "Nenhum vencimento futuro"}</p></div><p className="text-xs text-slate-500">{nextDates.filter((item) => item.date === nextDueDate).length} lançamentos previstos</p></div></section>
    <details id="gerenciar-cartoes" open={onboarding === "cartao"} className="dashboard-card mt-8 p-5 sm:p-6">
      <summary className="flex cursor-pointer list-none flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-moss-600">Meus cartões</p>
          <h2 className="mt-1 text-xl font-extrabold">Gerenciar cartões</h2>
          <p className="mt-1 text-sm text-slate-500">Abra para adicionar, editar e consultar seus cartões cadastrados.</p>
        </div>
        <span className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-bold text-white">Gerenciar cartões</span>
      </summary>
      <div className="mt-6 border-t border-slate-100 pt-6">
        <CreditCardsManager cards={cards} />
      </div>
    </details>
    <section className="mt-8"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-wider text-moss-600">Parcelamentos</p><h2 className="mt-1 text-xl font-extrabold">Compras parceladas</h2></div><InstallmentsManager installments={installments} cards={cards} /></section>
  </>;
}
