import type { Metadata } from "next";
import { GoalsManager } from "@/components/dashboard/goals-manager";
import { PageHeading } from "@/components/dashboard/page-heading";
import { getGoals } from "@/lib/finance/queries";

export const metadata: Metadata = { title: "Objetivos" };

export default async function GoalsPage() {
  const goals = await getGoals();
  return (
    <>
      <PageHeading
        eyebrow="Planos que ganham forma"
        title="Objetivos financeiros"
        description="Priorize metas, acompanhe o progresso e mantenha uma data clara para cada plano."
      />
      <GoalsManager goals={goals} />
    </>
  );
}
