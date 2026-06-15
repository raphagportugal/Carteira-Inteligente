import type { Metadata } from "next";
import { FinancialPlansManager } from "@/components/dashboard/financial-plans-manager";
import { PageHeading } from "@/components/dashboard/page-heading";
import { getFinancialPlans } from "@/lib/finance/queries";

export const metadata: Metadata = { title: "Planejamento Financeiro" };

export default async function FinancialPlanningPage() {
  const plans = await getFinancialPlans();
  return <>
    <PageHeading eyebrow="Metas mensais" title="Planejamento Financeiro" description="Defina limites por categoria e acompanhe o planejado sem perder a visão do todo." />
    <FinancialPlansManager plans={plans} />
  </>;
}
