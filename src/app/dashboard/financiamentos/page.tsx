import type { Metadata } from "next";
import { FinancingsManager } from "@/components/dashboard/financings-manager";
import { PageHeading } from "@/components/dashboard/page-heading";
import { getMonthRange } from "@/lib/finance/format";
import { getTransactionCashFlowDate } from "@/lib/finance/transaction-cash-flow";
import {
  getFinancingCustomPayments,
  getFinancingPaymentStatuses,
  getFinancings,
  getTransactions,
} from "@/lib/finance/queries";

export const metadata: Metadata = {
  title: "Financiamentos e Empréstimos",
};

export default async function FinancingPage() {
  const { start, end } = getMonthRange();
  const [financings, customPayments, paymentStatuses, currentTransactions] = await Promise.all([
    getFinancings(),
    getFinancingCustomPayments(),
    getFinancingPaymentStatuses(),
    getTransactions(),
  ]);
  const monthlyIncome = currentTransactions
    .filter(
      (transaction) =>
        transaction.type === "income" &&
        getTransactionCashFlowDate(transaction) >= start &&
        getTransactionCashFlowDate(transaction) <= end,
    )
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  return (
    <>
      <PageHeading
        eyebrow="Compromissos de longo prazo"
        title="Financiamentos e Empréstimos"
        description="Acompanhe valor financiado, saldo atual, parcelas, CET estimada e progresso de cada contrato."
      />
      <FinancingsManager
        financings={financings}
        customPayments={customPayments}
        paymentStatuses={paymentStatuses}
        monthlyIncome={monthlyIncome}
      />
    </>
  );
}
