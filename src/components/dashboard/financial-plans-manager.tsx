"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createFinancialPlan,
  deleteFinancialPlan,
  updateFinancialPlan,
} from "@/app/dashboard/actions";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { EmptyState } from "@/components/dashboard/empty-state";
import { EXPENSE_CATEGORIES } from "@/lib/finance/catalogs";
import { formatCurrency, monthFormatter, parseDate } from "@/lib/finance/format";
import type { FinancialPlan } from "@/lib/finance/types";
import { showSuccess } from "@/lib/ui/feedback";

export function FinancialPlansManager({ plans }: { plans: FinancialPlan[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<FinancialPlan | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function show(plan: FinancialPlan | null = null) {
    setEditing(plan);
    setError("");
    setOpen(true);
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateFinancialPlan(formData)
        : await createFinancialPlan(formData);
      if (!result.success) return setError(result.message);
      setOpen(false);
      setEditing(null);
      showSuccess("Planejamento atualizado.");
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!window.confirm("Excluir esta meta mensal?")) return;
    startTransition(async () => {
      const result = await deleteFinancialPlan(id);
      if (!result.success) return setError(result.message);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button onClick={() => show()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">
          <Plus className="size-4" /> Nova meta mensal
        </button>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="Nenhuma meta mensal definida"
          description="Defina quanto pretende gastar por categoria para comparar planejamento e execução."
          action={<button onClick={() => show()} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Criar primeira meta</button>}
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.id} className="dashboard-card p-5">
              <div className="flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-moss-50 text-moss-600">
                  <CategoryIcon category={plan.category} />
                </span>
                <div className="flex">
                  <button onClick={() => show(plan)} className="grid size-8 place-items-center text-slate-400" aria-label="Editar meta mensal">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => remove(plan.id)} className="grid size-8 place-items-center text-slate-400 hover:text-red-500" aria-label="Excluir meta mensal">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <p className="mt-5 text-xs capitalize text-slate-400">{monthFormatter.format(parseDate(plan.month))}</p>
              <h2 className="mt-1 font-extrabold">{fixPortugueseText(plan.category)}</h2>
              <p className="mt-3 text-xl font-extrabold">{formatCurrency(Number(plan.planned_amount))}</p>
            </article>
          ))}
        </section>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <button className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8">
            <button onClick={() => setOpen(false)} className="absolute right-5 top-5">
              <X className="size-5" />
            </button>
            <h2 className="text-2xl font-extrabold">{editing ?"Editar meta mensal" : "Nova meta mensal"}</h2>
            <form action={submit} className="mt-6 space-y-4">
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Mês</span>
                <input name="month" required type="month" defaultValue={editing?.month.slice(0, 7) ??new Date().toISOString().slice(0, 7)} className="h-12 w-full rounded-xl border px-4" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Categoria</span>
                <select name="category" required defaultValue={editing?.category ??""} className="h-12 w-full rounded-xl border bg-white px-4">
                  <option value="" disabled>Selecione</option>
                  {EXPENSE_CATEGORIES.map((category) => <option key={category} value={category}>{fixPortugueseText(category)}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Valor planejado</span>
                <input name="planned_amount" required type="number" min="0.01" step="0.01" defaultValue={editing?.planned_amount} className="h-12 w-full rounded-xl border px-4" />
              </label>
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <button disabled={pending} className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white">{pending ?"Salvando..." : "Salvar meta"}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

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
