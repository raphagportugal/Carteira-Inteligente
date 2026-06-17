import type { Metadata } from "next";
import { InvestmentsManager } from "@/components/dashboard/investments-manager";
import { PageHeading } from "@/components/dashboard/page-heading";
import {
  getBankAccounts,
  getInvestmentContributions,
  getInvestmentWithdrawals,
  getInvestments,
} from "@/lib/finance/queries";

export const metadata: Metadata = { title: "Investimentos e Patrimônio" };

export default async function InvestmentsPage() {
  const [investments, contributions, withdrawals, accounts] = await Promise.all([
    getInvestments(),
    getInvestmentContributions(),
    getInvestmentWithdrawals(),
    getBankAccounts(),
  ]);
  return <>
    <PageHeading eyebrow="Patrimônio" title="Investimentos e Patrimônio" description="Consolide investimentos, imóveis, veículos e outros bens em uma visão simples." />
    <InvestmentsManager investments={investments} contributions={contributions} withdrawals={withdrawals} accounts={accounts} />
  </>;
}
