import type { Metadata } from "next";
import { InvestmentsManager } from "@/components/dashboard/investments-manager";
import { PageHeading } from "@/components/dashboard/page-heading";
import {
  getBankAccounts,
  getGoalInvestmentAllocations,
  getInvestmentContributions,
  getInvestments,
  getInvestmentWithdrawals,
} from "@/lib/finance/queries";

export const metadata: Metadata = { title: "Investimentos e Patrimônio" };

export default async function InvestmentsPage() {
  const [investments, contributions, withdrawals, allocations, accounts] = await Promise.all([
    getInvestments(),
    getInvestmentContributions(),
    getInvestmentWithdrawals(),
    getGoalInvestmentAllocations(),
    getBankAccounts(),
  ]);
  return <>
    <PageHeading eyebrow="Patrimônio" title="Investimentos e Patrimônio" description="Consolide investimentos, imóveis, veículos e outros bens em uma visão simples." />
    <InvestmentsManager investments={investments} contributions={contributions} withdrawals={withdrawals} allocations={allocations} accounts={accounts} />
  </>;
}
