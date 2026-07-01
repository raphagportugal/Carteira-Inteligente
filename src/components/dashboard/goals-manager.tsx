"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Goal as GoalIcon,
  Link2,
  Pencil,
  Plus,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { createGoal, deleteGoal, updateGoal, upsertGoalInvestmentAllocation } from "@/app/dashboard/actions";
import { EmptyState } from "@/components/dashboard/empty-state";
import { CurrencyValue } from "@/components/ui/currency-value";
import {
  FINANCIAL_CATEGORIES,
  GOAL_PRIORITIES,
  GOAL_STATUSES,
} from "@/lib/finance/catalogs";
import { dateFormatter, formatCurrency, parseDate } from "@/lib/finance/format";
import { buildEffectiveAllocationAmounts, getGoalAllocatedAmount } from "@/lib/finance/goal-allocations";
import { getInvestmentPosition } from "@/lib/finance/investment-position";
import type { Goal, GoalInvestmentAllocation, Investment, InvestmentContribution } from "@/lib/finance/types";
import { showSuccess } from "@/lib/ui/feedback";

type GoalVisualStatus = "Em andamento" | "Quase lá" | "Concluído" | "Atenção";

const priorityLabels: Record<Goal["priority"], string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const storedStatusLabels: Record<Goal["status"], string> = {
  active: "Ativo",
  completed: "Concluído",
  paused: "Pausado",
};

export function GoalsManager({
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
  const [editing, setEditing] = useState<Goal | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  const effectiveAllocationAmounts = buildEffectiveAllocationAmounts(allocations, investments, contributions);
  const activeGoals = goals.filter((goal) => goal.status === "active").length;
  const completedGoals = goals.filter((goal) => goal.status === "completed").length;
  const totalTarget = goals.reduce((sum, goal) => sum + Number(goal.target_amount), 0);
  const totalCurrent = goals.reduce((sum, goal) => {
    const allocatedAmount = getGoalAllocatedAmount(goal.id, allocations, effectiveAllocationAmounts);
    return sum + (allocatedAmount > 0 ?allocatedAmount : Number(goal.current_amount));
  }, 0);
  const globalProgress = progressPercent(totalCurrent, totalTarget);

  function show(goal: Goal | null = null) {
    setEditing(goal);
    setError("");
    setOpen(true);
  }

  function close() {
    if (!pending) {
      setOpen(false);
      setEditing(null);
    }
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateGoal(formData)
        : await createGoal(formData);
      if (!result.success) return setError(result.message);
      setOpen(false);
      setEditing(null);
      setSuccess(editing ?"Objetivo atualizado." : "Objetivo criado.");
      showSuccess(editing ?"Objetivo atualizado." : "Objetivo criado.");
      router.refresh();
    });
  }

  function remove(goal: Goal) {
    if (!window.confirm(`Excluir o objetivo "${goal.name}"? `)) return;
    startTransition(async () => {
      const result = await deleteGoal(goal.id);
      if (!result.success) return setError(result.message);
      setSuccess("Objetivo exclu?do.");
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <GoalMetric label="Total de objetivos" value={String(goals.length)} />
          <GoalMetric label="Objetivos ativos" value={String(activeGoals)} />
          <GoalMetric label="Concluídos" value={String(completedGoals)} />
          <GoalMetric label="Progresso geral" value={`${globalProgress}%`} />
        </div>
        <button onClick={() => show()} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">
          <Plus className="size-4" /> Novo objetivo
        </button>
      </div>

      {success && <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
      {error && !open && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {goals.length === 0 ? (
        <EmptyState
          icon={GoalIcon}
          title="Nenhum objetivo cadastrado"
          description="Crie uma meta para transformar seu planejamento em progresso mensurável."
          action={<button onClick={() => show()} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Criar objetivo</button>}
        />
      ) : (
        <section className="grid gap-5 xl:grid-cols-2">
          {goals.map((goal, index) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              investments={investments}
              contributions={contributions}
              allocations={allocations}
              effectiveAllocationAmounts={effectiveAllocationAmounts}
              featured={index === 0}
              edit={() => show(goal)}
              remove={() => remove(goal)}
              allocate={(formData) => startTransition(async () => {
                const result = await upsertGoalInvestmentAllocation(formData);
                if (!result.success) return setError(result.message);
                showSuccess("Alocação atualizada.");
                router.refresh();
              })}
            />
          ))}
        </section>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <button className="absolute inset-0" onClick={close} />
          <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button onClick={close} className="absolute right-5 top-5 grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>
            <p className="text-xs font-bold uppercase tracking-wider text-moss-600">{editing ?"Editar objetivo" : "Novo objetivo"}</p>
            <h2 className="mt-2 text-2xl font-extrabold">Plano financeiro</h2>
            <p className="mt-2 text-sm text-slate-500">Defina o valor atual, o valor alvo e a data desejada para acompanhar a conclusão da meta.</p>

            <form action={submit} className="mt-7 space-y-4">
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-semibold">Nome</span>
                  <input name="name" required defaultValue={editing?.name} className="h-12 w-full rounded-xl border border-slate-200 px-4" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">Categoria</span>
                  <select name="category" required defaultValue={editing?.category ??""} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4">
                    <option value="" disabled>Selecione</option>
                    {FINANCIAL_CATEGORIES.map((item) => <option key={item} value={item}>{fixPortugueseText(item)}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-semibold">Valor atual</span>
                  <input name="current_amount" required type="number" min="0" step="0.01" defaultValue={editing?.current_amount ??0} className="h-12 w-full rounded-xl border border-slate-200 px-4" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">Valor alvo</span>
                  <input name="target_amount" required type="number" min="0.01" step="0.01" defaultValue={editing?.target_amount} className="h-12 w-full rounded-xl border border-slate-200 px-4" />
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Data alvo</span>
                <input name="target_date" required type="date" defaultValue={editing?.target_date} className="h-12 w-full rounded-xl border border-slate-200 px-4" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-semibold">Prioridade</span>
                  <select name="priority" defaultValue={editing?.priority ??"medium"} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4">
                    {GOAL_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{priorityLabels[item.value]}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">Status</span>
                  <select name="status" defaultValue={editing?.status ??"active"} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4">
                    {GOAL_STATUSES.map((item) => <option key={item.value} value={item.value}>{storedStatusLabels[item.value]}</option>)}
                  </select>
                </label>
              </div>
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <button disabled={pending} className="h-12 w-full rounded-xl bg-slate-900 text-sm font-bold text-white">{pending ?"Salvando..." : "Salvar objetivo"}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function GoalCard({
  goal,
  investments,
  contributions,
  allocations,
  effectiveAllocationAmounts,
  featured,
  edit,
  remove,
  allocate,
}: {
  goal: Goal;
  investments: Investment[];
  contributions: InvestmentContribution[];
  allocations: GoalInvestmentAllocation[];
  effectiveAllocationAmounts: Map<string, number>;
  featured: boolean;
  edit: () => void;
  remove: () => void;
  allocate: (formData: FormData) => void;
}) {
  const goalAllocations = allocations.filter((allocation) => allocation.goal_id === goal.id);
  const allocatedAmount = getGoalAllocatedAmount(goal.id, allocations, effectiveAllocationAmounts);
  const currentAmount = allocatedAmount > 0 ?allocatedAmount : Number(goal.current_amount);
  const targetAmount = Number(goal.target_amount);
  const missingAmount = Math.max(0, targetAmount - currentAmount);
  const progress = progressPercent(currentAmount, targetAmount);
  const visualStatus = getVisualStatus(goal, progress);
  const statusStyle = statusStyles[visualStatus];

  return (
    <article className={`rounded-3xl p-5 shadow-sm sm:p-6 ${featured ?"bg-slate-950 text-white" : "dashboard-card"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${featured ?"bg-moss-500/15 text-moss-400" : "bg-moss-50 text-moss-600"}`}>
          <GoalIcon className="size-5" />
        </span>
        <div className="flex gap-1">
          <button onClick={edit} className={`grid size-8 place-items-center rounded-lg ${featured ?"text-slate-300 hover:bg-white/10" : "text-slate-400 hover:bg-slate-100"}`} aria-label="Editar objetivo">
            <Pencil className="size-4" />
          </button>
          <button onClick={remove} className={`grid size-8 place-items-center rounded-lg ${featured ?"text-slate-300 hover:bg-red-500/10 hover:text-red-300" : "text-slate-400 hover:bg-red-50 hover:text-red-500"}`} aria-label="Excluir objetivo">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${featured ?"bg-white/10 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
          Prioridade {priorityLabels[goal.priority]}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusStyle.badge}`}>
          {visualStatus === "Atenção" ?<AlertTriangle className="size-3" /> : visualStatus === "Concluído" ?<CheckCircle2 className="size-3" /> : <Target className="size-3" />}
          {visualStatus}
        </span>
      </div>

      <h2 className="mt-4 text-lg font-extrabold">{goal.name}</h2>
      <p className={`mt-1 text-xs ${featured ?"text-slate-400" : "text-slate-500"}`}>
        {fixPortugueseText(goal.category)} · data alvo em {dateFormatter.format(parseDate(goal.target_date))}
      </p>

      <div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-3">
        <GoalValue label="Valor atual" value={currentAmount} featured={featured} />
        <GoalValue label="Valor alvo" value={targetAmount} featured={featured} />
        <GoalValue label="Valor faltante" value={missingAmount} featured={featured} />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className={featured ?"text-slate-400" : "text-slate-500"}>Conclusão</span>
          <strong className={statusStyle.text}>{progress}%</strong>
        </div>
        <div className={`h-2.5 overflow-hidden rounded-full ${featured ?"bg-white/10" : "bg-slate-100"}`}>
          <div className={`h-full rounded-full ${statusStyle.bar}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <details className={`group mt-5 rounded-2xl border p-4 ${featured ?"border-white/10 bg-white/5" : "border-slate-100 bg-slate-50"}`}>
        <summary className="flex cursor-pointer list-none items-center gap-3">
          <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${featured ?"bg-white/10 text-moss-300" : "bg-white text-moss-600"}`}>
            <Link2 className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-extrabold ${featured ?"text-white" : "text-slate-900"}`}>Investimentos vinculados</p>
            <p className={`mt-1 text-xs ${featured ?"text-slate-400" : "text-slate-500"}`}>
              {goalAllocations.length > 0 ? `${goalAllocations.length} vínculo(s) · clique para gerenciar` : "Nenhum investimento vinculado · clique para adicionar"}
            </p>
          </div>
          <span className={`text-xs font-bold transition group-open:rotate-180 ${featured ?"text-slate-400" : "text-slate-500"}`}>⌄</span>
        </summary>
        <div className={`mt-4 flex items-start gap-3 border-t pt-4 ${featured ?"border-white/10" : "border-slate-100"}`}>
          <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${featured ?"bg-white/10 text-moss-300" : "bg-white text-moss-600"}`}>
            <Link2 className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-extrabold ${featured ?"text-white" : "text-slate-900"}`}>Investimentos vinculados</p>
            {goalAllocations.length > 0 ? (
              <div className="mt-3 space-y-2">
                {goalAllocations.map((allocation) => {
                  const investment = investments.find((item) => item.id === allocation.investment_id);
                  const position = investment ?getInvestmentPosition(investment, contributions) : 0;
                  const allocatedElsewhere = allocations
                    .filter((item) => item.investment_id === allocation.investment_id && item.goal_id !== goal.id)
                    .reduce((sum, item) => sum + (effectiveAllocationAmounts.get(item.id) ??Number(item.allocated_amount)), 0);
                  const availableForThisGoal = Math.max(0, position - allocatedElsewhere);
                  const rawAllocated = Number(allocation.allocated_amount);
                  const effectiveAllocated = Math.min(
                    availableForThisGoal,
                    effectiveAllocationAmounts.get(allocation.id) ??rawAllocated,
                  );
                  const isAboveLimit = rawAllocated > effectiveAllocated;
                  return (
                    <div key={allocation.id} className={`rounded-xl p-3 text-xs ${featured ?"bg-white/5 text-slate-200" : "bg-white text-slate-600"}`}>
                      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="min-w-0 truncate font-bold">{investment?.name ??"Investimento removido"}</span>
                        <CurrencyValue value={effectiveAllocated} size="sm" className="font-bold" />
                      </div>
                      <p className={`mt-1 ${featured ?"text-slate-400" : "text-slate-500"}`}>Disponível para este objetivo: <CurrencyValue value={availableForThisGoal} size="sm" /></p>
                      {isAboveLimit && (
                        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
                          Esta alocação foi ajustada ao limite disponível. Salve um valor até <CurrencyValue value={availableForThisGoal} size="sm" /> ou desvincule.
                        </p>
                      )}
                      <form action={allocate} className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                        <input type="hidden" name="goal_id" value={goal.id} />
                        <input type="hidden" name="investment_id" value={allocation.investment_id} />
                        <input name="allocated_amount" required type="number" min="0" max={availableForThisGoal} step="0.01" defaultValue={effectiveAllocated} className="h-10 min-w-0 rounded-xl border border-slate-200 px-3 text-xs text-slate-900" />
                        <button className="h-10 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white">Salvar</button>
                      </form>
                      <form action={allocate} className="mt-2">
                        <input type="hidden" name="goal_id" value={goal.id} />
                        <input type="hidden" name="investment_id" value={allocation.investment_id} />
                        <input type="hidden" name="allocated_amount" value="0" />
                        <button className="h-10 w-full rounded-xl bg-red-50 px-3 text-xs font-bold text-red-700">Desvincular</button>
                      </form>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={`mt-1 text-xs leading-5 ${featured ?"text-slate-400" : "text-slate-500"}`}>
                Nenhum investimento vinculado ainda.
              </p>
            )}
            <form action={allocate} className="mt-4 grid min-w-0 grid-cols-1 gap-2">
              <input type="hidden" name="goal_id" value={goal.id} />
              <select name="investment_id" required defaultValue="" className="h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900">
                <option value="" disabled>Selecionar investimento</option>
                {investments.filter((investment) => !["property", "vehicle", "business_stake", "other_asset"].includes(investment.asset_type ??investment.type)).map((investment) => {
                  const position = getInvestmentPosition(investment, contributions);
                  const allocated = allocations
                    .filter((allocation) => allocation.investment_id === investment.id)
                    .reduce((sum, allocation) => sum + (effectiveAllocationAmounts.get(allocation.id) ??Number(allocation.allocated_amount)), 0);
                  return <option key={investment.id} value={investment.id}>{investment.name} · livre {formatCurrency(Math.max(0, position - allocated))}</option>;
                })}
              </select>
              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input name="allocated_amount" required type="number" min="0" step="0.01" placeholder="Valor" className="h-10 min-w-0 rounded-xl border border-slate-200 px-3 text-xs text-slate-900" />
                <button className="h-10 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      </details>
    </article>
  );
}

function GoalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-slate-950">{value}</p>
    </div>
  );
}

function GoalValue({ label, value, featured }: { label: string; value: number; featured: boolean }) {
  return (
    <div className={`min-w-0 rounded-2xl p-3 ${featured ?"bg-white/5" : "bg-slate-50"}`}>
      <p className={`text-[11px] font-semibold ${featured ?"text-slate-400" : "text-slate-500"}`}>{label}</p>
      <CurrencyValue value={value} size="sm" className={`mt-1 block font-extrabold tracking-tight ${featured ?"text-white" : "text-slate-950"}`} />
    </div>
  );
}

function progressPercent(current: number, target: number) {
  if (!Number.isFinite(target) || target <= 0) return 0;
  return Math.min(100, Math.round(Number(current) / Number(target) * 100));
}

function getVisualStatus(goal: Goal, progress: number): GoalVisualStatus {
  if (!Number.isFinite(Number(goal.target_amount)) || Number(goal.target_amount) <= 0) return "Atenção";
  if (goal.status === "completed" || progress >= 100) return "Concluído";
  if (progress >= 80) return "Quase lá";
  return "Em andamento";
}

const statusStyles: Record<GoalVisualStatus, { badge: string; bar: string; text: string }> = {
  "Em andamento": {
    badge: "bg-blue-50 text-blue-700",
    bar: "bg-blue-500",
    text: "text-blue-600",
  },
  "Quase lá": {
    badge: "bg-moss-50 text-moss-700",
    bar: "bg-moss-500",
    text: "text-moss-600",
  },
  "Concluído": {
    badge: "bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
    text: "text-emerald-600",
  },
  "Atenção": {
    badge: "bg-amber-50 text-amber-700",
    bar: "bg-amber-500",
    text: "text-amber-600",
  },
};

function fixPortugueseText(value: string) {
  return value
    .replaceAll("Cart\u00c3\u00a3o", "Cartão")
    .replaceAll("cr\u00c3\u00a9dito", "crédito")
    .replaceAll("d\u00c3\u00a9bito", "débito")
    .replaceAll("D\u00c3\u00a9bito", "Débito")
    .replaceAll("autom\u00c3\u00a1tico", "automático")
    .replaceAll("Sa\u00c3\u00bade", "Saúde")
    .replaceAll("Educa\u00c3\u00a7\u00c3\u00a3o", "Educação")
    .replaceAll("Alimenta\u00c3\u00a7\u00c3\u00a3o", "Alimentação")
    .replaceAll("Servi\u00c3\u00a7os", "Serviços")
    .replaceAll("Comiss\u00c3\u00a3o", "Comissão")
    .replaceAll("Distribui\u00c3\u00a7\u00c3\u00a3o", "Distribuição")
    .replaceAll("Pr\u00c3\u00b3-Labore", "Pró-Labore");
}
