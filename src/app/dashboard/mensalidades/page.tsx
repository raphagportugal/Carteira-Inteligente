import type { Metadata } from "next";
import { MonthlyBillsManager } from "@/components/dashboard/monthly-bills-manager";
import { PageHeading } from "@/components/dashboard/page-heading";
import { getBankAccounts, getCreditCards, getMonthlyBills, getTransactions } from "@/lib/finance/queries";

export const metadata: Metadata = { title: "Mensalidades" };

export default async function MonthlyBillsPage() {
  const [bills, accounts, cards, transactions] = await Promise.all([
    getMonthlyBills(),
    getBankAccounts(),
    getCreditCards(),
    getTransactions(),
  ]);

  return (
    <>
      <PageHeading
        eyebrow="Despesas recorrentes"
        title="Mensalidades"
        description="Cadastre compromissos recorrentes para incluí-los nas despesas e projeções futuras."
      />
      <MonthlyBillsManager bills={bills} accounts={accounts} cards={cards} transactions={transactions} />
    </>
  );
}
