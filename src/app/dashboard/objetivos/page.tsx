import type { Metadata } from "next";
import { FinancialPlansManager } from "@/components/dashboard/financial-plans-manager";
import { GoalsManager } from "@/components/dashboard/goals-manager";
import { PageHeading } from "@/components/dashboard/page-heading";
import { getFinancialPlans, getGoals } from "@/lib/finance/queries";

export const metadata: Metadata = { title: "Objetivos e Planejamento Fin." };

export default async function GoalsPage() {
  const [goals, plans] = await Promise.all([getGoals(), getFinancialPlans()]);
  return (
    <>
      <PageHeading
        eyebrow="Planos que ganham forma"
        title="Objetivos e Planejamento Fin."
        description="Priorize metas, acompanhe progresso financeiro e defina limites mensais por categoria em uma ?nica vis?o."
      />
      <section className="space-y-10">
        <div>
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss-600">Objetivos</p>
            <h2 className="mt-1 text-xl font-extrabold">Metas financeiras</h2>
          </div>
          <GoalsManager goals={goals} />
        </div>
        <div>
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss-600">Planejamento financeiro</p>
            <h2 className="mt-1 text-xl font-extrabold">Metas mensais por categoria</h2>
          </div>
          <FinancialPlansManager plans={plans} />
        </div>
      </section>
    </>
  );
}
