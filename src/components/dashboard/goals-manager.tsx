"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Goal as GoalIcon, Pencil, Plus, Trash2, X } from "lucide-react";
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

export function GoalsManager({ goals }: { goals: Goal[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Goal | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

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
      <div className="mb-6 flex justify-end">
        <button onClick={() => show()} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"><Plus className="size-4" /> Novo objetivo</button>
      </div>
      {success && <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
      {error && !open && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {goals.length === 0 ? (
        <EmptyState icon={GoalIcon} title="Nenhum objetivo cadastrado" description="Crie uma meta para transformar seu planejamento em progresso mensurável." action={<button onClick={() => show()} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Criar objetivo</button>} />
      ) : (
        <section className="grid gap-5 lg:grid-cols-3">
          {goals.map((goal, index) => {
            const progress = Math.min(100, Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100));
            return (
              <article key={goal.id} className={`rounded-2xl p-6 ${index === 0 ? "bg-slate-950 text-white" : "dashboard-card"}`}>
                <div className="flex justify-between">
                  <span className={`grid size-11 place-items-center rounded-xl ${index === 0 ? "bg-moss-500/15 text-moss-500" : "bg-moss-50 text-moss-600"}`}><GoalIcon className="size-5" /></span>
                  <div className="flex gap-1"><button onClick={() => show(goal)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10"><Pencil className="size-4" /></button><button onClick={() => remove(goal)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="size-4" /></button></div>
                </div>
                <div className="mt-5 flex gap-2"><span className="rounded-full bg-moss-500/10 px-2.5 py-1 text-[10px] font-bold text-moss-500">{GOAL_PRIORITIES.find((item) => item.value === goal.priority)?.label}</span><span className="rounded-full bg-slate-500/10 px-2.5 py-1 text-[10px] font-bold text-slate-400">{GOAL_STATUSES.find((item) => item.value === goal.status)?.label}</span></div>
                <h2 className="mt-4 text-lg font-extrabold">{goal.name}</h2>
                <p className="mt-1 text-xs text-slate-400">{goal.category} · {dateFormatter.format(parseDate(goal.target_date))}</p>
                <div className="mt-7 flex items-end justify-between"><div><p className="text-2xl font-extrabold">{formatCurrency(Number(goal.current_amount))}</p><p className="text-xs text-slate-400">de {formatCurrency(Number(goal.target_amount))}</p></div><strong className="text-moss-500">{progress}%</strong></div>
                <div className={`mt-4 h-2 overflow-hidden rounded-full ${index === 0 ? "bg-white/10" : "bg-slate-100"}`}><div className="h-full rounded-full bg-moss-500" style={{ width: `${progress}%` }} /></div>
              </article>
            );
          })}
        </section>
      )}
      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <button className="absolute inset-0" onClick={close} />
          <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button onClick={close} className="absolute right-5 top-5 grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>
            <p className="text-xs font-bold uppercase tracking-wider text-moss-600">{editing ? "Editar objetivo" : "Novo objetivo"}</p>
            <h2 className="mt-2 text-2xl font-extrabold">Plano financeiro</h2>
            <form action={submit} className="mt-7 space-y-4">
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold">Nome</span><input name="name" required defaultValue={editing?.name} className="h-12 w-full rounded-xl border border-slate-200 px-4" /></label><label><span className="mb-2 block text-sm font-semibold">Categoria</span><select name="category" required defaultValue={editing?.category ?? ""} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4"><option value="" disabled>Selecione</option>{FINANCIAL_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label></div>
              <div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold">Valor atual</span><input name="current_amount" required type="number" min="0" step="0.01" defaultValue={editing?.current_amount ?? 0} className="h-12 w-full rounded-xl border border-slate-200 px-4" /></label><label><span className="mb-2 block text-sm font-semibold">Valor alvo</span><input name="target_amount" required type="number" min="0.01" step="0.01" defaultValue={editing?.target_amount} className="h-12 w-full rounded-xl border border-slate-200 px-4" /></label></div>
              <label className="block"><span className="mb-2 block text-sm font-semibold">Data alvo</span><input name="target_date" required type="date" defaultValue={editing?.target_date} className="h-12 w-full rounded-xl border border-slate-200 px-4" /></label>
              <div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold">Prioridade</span><select name="priority" defaultValue={editing?.priority ?? "medium"} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4">{GOAL_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label><span className="mb-2 block text-sm font-semibold">Status</span><select name="status" defaultValue={editing?.status ?? "active"} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4">{GOAL_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label></div>
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <button disabled={pending} className="h-12 w-full rounded-xl bg-slate-900 text-sm font-bold text-white">{pending ? "Salvando..." : "Salvar objetivo"}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
