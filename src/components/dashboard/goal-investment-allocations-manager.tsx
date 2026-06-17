"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Trash2 } from "lucide-react";
import {
  createGoalInvestmentAllocation,
  deleteGoalInvestmentAllocation,
} from "@/app/dashboard/actions";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatCurrency } from "@/lib/finance/format";
import { getInvestmentPosition } from "@/lib/finance/investment-position";
import type {
  Goal,
  GoalInvestmentAllocation,
  Investment,
  InvestmentContribution,
} from "@/lib/finance/types";
import { showSuccess } from "@/lib/ui/feedback";

export function GoalInvestmentAllocationsManager({
  goals,
  investments,
  contributions,
  allocations,
}: {
  goals: Goal[];
  investments: Investment[];
  contributions: InvestmentContribution[];
  allocations: GoalInvestmentAllocation[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const allocatedByInvestment = new Map<string, number>();
  const allocatedByGoal = new Map<string, number>();
  allocations.forEach((allocation) => {
    allocatedByInvestment.set(
      allocation.investment_id,
      (allocatedByInvestment.get(allocation.investment_id) ?? 0) + Number(allocation.allocated_amount),
    );
    allocatedByGoal.set(
      allocation.goal_id,
      (allocatedByGoal.get(allocation.goal_id) ?? 0) + Number(allocation.allocated_amount),
    );
  });

  function submit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await createGoalInvestmentAllocation(formData);
      if (!result.success) {
        setError(result.message);
        return;
      }
      showSuccess("Investimento alocado ao objetivo.");
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteGoalInvestmentAllocation(id);
      if (!result.success) {
        setError(result.message);
        return;
      }
      showSuccess("Alocacao removida.");
      router.refresh();
    });
  }

  if (goals.length === 0 || investments.length === 0) {
    return (
      <EmptyState
        icon={Link2}
        title="Alocacoes ainda indisponiveis"
        description="Cadastre ao menos um objetivo e um investimento para vincular recursos a metas."
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
      <form action={submit} className="dashboard-card space-y-4 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss-600">Nova alocacao</p>
          <h3 className="mt-1 text-lg font-extrabold">Vincular investimento a objetivo</h3>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Objetivo</span>
          <select name="goal_id" required defaultValue="" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm">
            <option value="" disabled>Selecione</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>{goal.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Investimento</span>
          <select name="investment_id" required defaultValue="" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm">
            <option value="" disabled>Selecione</option>
            {investments.map((investment) => {
              const position = getInvestmentPosition(investment, contributions);
              const allocated = allocatedByInvestment.get(investment.id) ?? 0;
              return (
                <option key={investment.id} value={investment.id}>
                  {investment.name} - livre {formatCurrency(Math.max(0, position - allocated))}
                </option>
              );
            })}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Valor dedicado ao objetivo</span>
          <input name="allocated_amount" required type="number" min="0.01" step="0.01" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" />
        </label>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={pending} className="h-12 w-full rounded-xl bg-slate-900 text-sm font-bold text-white disabled:opacity-60">
          {pending ? "Salvando..." : "Alocar investimento"}
        </button>
      </form>

      <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {investments.map((investment) => {
            const position = getInvestmentPosition(investment, contributions);
            const allocated = allocatedByInvestment.get(investment.id) ?? 0;
            return (
              <div key={investment.id} className="dashboard-card p-4">
                <p className="text-sm font-extrabold">{investment.name}</p>
                <p className="mt-2 text-xs text-slate-400">Alocado: {formatCurrency(allocated)}</p>
                <p className="mt-1 text-xs text-slate-400">Livre: {formatCurrency(Math.max(0, position - allocated))}</p>
              </div>
            );
          })}
        </div>
        <div className="dashboard-card divide-y divide-slate-100 p-5">
          {allocations.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum investimento alocado a objetivos ainda.</p>
          ) : allocations.map((allocation) => {
            const goal = goals.find((item) => item.id === allocation.goal_id);
            const investment = investments.find((item) => item.id === allocation.investment_id);
            return (
              <div key={allocation.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{goal?.name ?? "Objetivo"}</p>
                  <p className="text-xs text-slate-400">{investment?.name ?? "Investimento"} - total no objetivo {formatCurrency(allocatedByGoal.get(allocation.goal_id) ?? 0)}</p>
                </div>
                <p className="text-sm font-extrabold">{formatCurrency(Number(allocation.allocated_amount))}</p>
                <button onClick={() => remove(allocation.id)} disabled={pending} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
