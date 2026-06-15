import type { Metadata } from "next";
import { PageHeading } from "@/components/dashboard/page-heading";
import { TransactionsHistory } from "@/components/dashboard/transactions-history";
import { getBankAccounts, getCreditCards, getTransactions } from "@/lib/finance/queries";

export const metadata: Metadata = { title: "Movimentações" };

export default async function TransactionsPage() {
  const [transactions, cards, accounts] = await Promise.all([
    getTransactions(),
    getCreditCards(),
    getBankAccounts(),
  ]);
  return (
    <>
      <PageHeading
        eyebrow="Extrato financeiro"
        title="Histórico completo"
        description="Consulte todas as movimentações pela data original, edite registros e filtre seu extrato."
      />
      <TransactionsHistory transactions={transactions} cards={cards} accounts={accounts} />
    </>
  );
}
