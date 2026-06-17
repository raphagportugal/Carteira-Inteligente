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
import { createGoal, deleteGoal, updateGoal } from "@/app/dashboard/actions";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  FINANCIAL_CATEGORIES,
  GOAL_PRIORITIES,
  GOAL_STATUSES,
} from "@/lib/finance/catalogs";
import { dateFormatter, formatCurrency, parseDate } from "@/lib/finance/format";
import type { Goal } from "@/lib/finance/types";
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

export function GoalsManager({ goals }: { goals: Goal[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Goal | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  const activeGoals = goals.filter((goal) => goal.status === "active").length;
  const completedGoals = goals.filter((goal) => goal.status === "completed").length;
  const totalTarget = goals.reduce((sum, goal) => sum + Number(goal.target_amount), 0);
  const totalCurrent = goals.reduce((sum, goal) => sum + Number(goal.current_amount), 0);
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
      setSuccess(editing ? "Objetivo atualizado." : "Objetivo criado.");
      showSuccess(editing ? "Objetivo atualizado." : "Objetivo criado.");
      router.refresh();
    });
  }

  function remove(goal: Goal) {
    if (!window.confirm(`Excluir o objetivo "${goal.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteGoal(goal.id);
      if (!result.success) return setError(result.message);
      setSuccess("Objetivo excluído.");
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="grid gap-3 sm:grid-cols-3">
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
        <section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {goals.map((goal, index) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              featured={index === 0}
              edit={() => show(goal)}
              remove={() => remove(goal)}
            />
          ))}
        </section>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <button className="absolute inset-0" onClick={close} />
          <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button onClick={close} className="absolute right-5 top-5 grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>
            <p className="text-xs font-bold uppercase tracking-wider text-moss-600">{editing ? "Editar objetivo" : "Novo objetivo"}</p>
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
                  <select name="category" required defaultValue={editing?.category ?? ""} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4">
                    <option value="" disabled>Selecione</option>
                    {FINANCIAL_CATEGORIES.map((item) => <option key={item} value={item}>{fixPortugueseText(item)}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-semibold">Valor atual</span>
                  <input name="current_amount" required type="number" min="0" step="0.01" defaultValue={editing?.current_amount ?? 0} className="h-12 w-full rounded-xl border border-slate-200 px-4" />
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
                  <select name="priority" defaultValue={editing?.priority ?? "medium"} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4">
                    {GOAL_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{priorityLabels[item.value]}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">Status</span>
                  <select name="status" defaultValue={editing?.status ?? "active"} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4">
                    {GOAL_STATUSES.map((item) => <option key={item.value} value={item.value}>{storedStatusLabels[item.value]}</option>)}
                  </select>
                </label>
              </div>
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <button disabled={pending} className="h-12 w-full rounded-xl bg-slate-900 text-sm font-bold text-white">{pending ? "Salvando..." : "Salvar objetivo"}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function GoalCard({
  goal,
  featured,
  edit,
  remove,
}: {
  goal: Goal;
  featured: boolean;
  edit: () => void;
  remove: () => void;
}) {
  const currentAmount = Number(goal.current_amount);
  const targetAmount = Number(goal.target_amount);
  const missingAmount = Math.max(0, targetAmount - currentAmount);
  const progress = progressPercent(currentAmount, targetAmount);
  const visualStatus = getVisualStatus(goal, progress);
  const statusStyle = statusStyles[visualStatus];

  return (
    <article className={`rounded-3xl p-5 shadow-sm sm:p-6 ${featured ? "bg-slate-950 text-white" : "dashboard-card"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${featured ? "bg-moss-500/15 text-moss-400" : "bg-moss-50 text-moss-600"}`}>
          <GoalIcon className="size-5" />
        </span>
        <div className="flex gap-1">
          <button onClick={edit} className={`grid size-8 place-items-center rounded-lg ${featured ? "text-slate-300 hover:bg-white/10" : "text-slate-400 hover:bg-slate-100"}`} aria-label="Editar objetivo">
            <Pencil className="size-4" />
          </button>
          <button onClick={remove} className={`grid size-8 place-items-center rounded-lg ${featured ? "text-slate-300 hover:bg-red-500/10 hover:text-red-300" : "text-slate-400 hover:bg-red-50 hover:text-red-500"}`} aria-label="Excluir objetivo">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${featured ? "bg-white/10 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
          Prioridade {priorityLabels[goal.priority]}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusStyle.badge}`}>
          {visualStatus === "Atenção" ? <AlertTriangle className="size-3" /> : visualStatus === "Concluído" ? <CheckCircle2 className="size-3" /> : <Target className="size-3" />}
          {visualStatus}
        </span>
      </div>

      <h2 className="mt-4 text-lg font-extrabold">{goal.name}</h2>
      <p className={`mt-1 text-xs ${featured ? "text-slate-400" : "text-slate-500"}`}>
        {fixPortugueseText(goal.category)} · data alvo em {dateFormatter.format(parseDate(goal.target_date))}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <GoalValue label="Valor atual" value={formatCurrency(currentAmount)} featured={featured} />
        <GoalValue label="Valor alvo" value={formatCurrency(targetAmount)} featured={featured} />
        <GoalValue label="Valor faltante" value={formatCurrency(missingAmount)} featured={featured} />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className={featured ? "text-slate-400" : "text-slate-500"}>Conclusão</span>
          <strong className={statusStyle.text}>{progress}%</strong>
        </div>
        <div className={`h-2.5 overflow-hidden rounded-full ${featured ? "bg-white/10" : "bg-slate-100"}`}>
          <div className={`h-full rounded-full ${statusStyle.bar}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={`mt-5 rounded-2xl border p-4 ${featured ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50"}`}>
        <div className="flex items-start gap-3">
          <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${featured ? "bg-white/10 text-moss-300" : "bg-white text-moss-600"}`}>
            <Link2 className="size-4" />
          </span>
          <div>
            <p className={`text-sm font-extrabold ${featured ? "text-white" : "text-slate-900"}`}>Investimentos vinculados</p>
            <p className={`mt-1 text-xs leading-5 ${featured ? "text-slate-400" : "text-slate-500"}`}>
              Nenhum investimento vinculado ainda. Em breve, você poderá conectar investimentos a este objetivo.
            </p>
          </div>
        </div>
      </div>
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

function GoalValue({ label, value, featured }: { label: string; value: string; featured: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ${featured ? "bg-white/5" : "bg-slate-50"}`}>
      <p className={`text-[11px] font-semibold ${featured ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      <p className={`mt-1 text-sm font-extrabold ${featured ? "text-white" : "text-slate-950"}`}>{value}</p>
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
