import type { Metadata } from "next";
import { MonthlyBillsManager } from "@/components/dashboard/monthly-bills-manager";
import { PageHeading } from "@/components/dashboard/page-heading";
import { getMonthlyBills } from "@/lib/finance/queries";

export const metadata: Metadata = { title: "Mensalidades" };

export default async function MonthlyBillsPage() {
  const bills = await getMonthlyBills();

  return (
    <>
      <PageHeading
        eyebrow="Despesas recorrentes"
        title="Mensalidades"
        description="Cadastre compromissos recorrentes para incluí-los nas despesas e projeções futuras."
      />
      <MonthlyBillsManager bills={bills} />
    </>
  );
}
