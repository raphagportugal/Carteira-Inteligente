"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { createIncomeForecast, deleteIncomeForecast } from "@/app/dashboard/actions";
import { monthFormatter, parseDate } from "@/lib/finance/format";
import { CurrencyValue } from "@/components/ui/currency-value";
import type { IncomeForecast } from "@/lib/finance/types";
import { showSuccess } from "@/lib/ui/feedback";

export function IncomeForecastsManager({ forecasts }: { forecasts: IncomeForecast[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createIncomeForecast(formData);
      if (!result.success) return setError(result.message);
      setOpen(false); setError(""); showSuccess("Entrada futura salva."); router.refresh();
    });
  }
  function remove(id: string) {
    if (!window.confirm("Excluir esta previsão de receita?")) return;
    startTransition(async () => { await deleteIncomeForecast(id); router.refresh(); });
  }
  return (
    <section className="dashboard-card mt-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h2 className="text-lg font-extrabold">Entradas futuras</h2><p className="mt-1 text-xs text-slate-400">Valores esperados que complementam entradas realizadas.</p></div><button onClick={() => setOpen(true)} className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"><Plus className="size-4" /> Adicionar</button></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{forecasts.map((item) => <div key={item.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div className="min-w-0"><p className="text-xs capitalize text-slate-400">{monthFormatter.format(parseDate(item.month))}</p><CurrencyValue value={Number(item.expected_income)} size="md" className="mt-1 block font-extrabold text-emerald-600" /></div><button onClick={() => remove(item.id)} className="shrink-0 text-slate-400 hover:text-red-500"><Trash2 className="size-4" /></button></div>)}{forecasts.length === 0 && <p className="text-sm text-slate-500">Nenhuma receita futura informada.</p>}</div>
      {open && <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4"><button className="absolute inset-0" onClick={() => setOpen(false)} /><div className="relative w-full max-w-md rounded-3xl bg-white p-8"><button onClick={() => setOpen(false)} className="absolute right-5 top-5"><X className="size-5" /></button><h2 className="text-2xl font-extrabold">Entrada futura</h2><form action={submit} className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold">Mês</span><input name="month" required type="month" className="h-12 w-full rounded-xl border px-4" /></label><label className="block"><span className="mb-2 block text-sm font-semibold">Valor esperado</span><input name="expected_income" required type="number" min="0.01" step="0.01" className="h-12 w-full rounded-xl border px-4" /></label>{error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={pending} className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white">Salvar previsão</button></form></div></div>}
    </section>
  );
}
