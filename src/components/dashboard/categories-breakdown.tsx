"use client";

import { useState } from "react";

type CategoriesBreakdownProps = {
  categories: Array<[string, number]>;
  total: number;
  monthlyExpenses: number;
};

const colors = ["#22C55E", "#14B8A6", "#0F172A", "#F59E0B", "#64748B"];

export function CategoriesBreakdown({
  categories,
  total,
  monthlyExpenses,
}: CategoriesBreakdownProps) {
  const [open, setOpen] = useState(false);
  const topCategories = categories.slice(0, 5);
  let cursor = 0;
  const pieStops = topCategories.map(([, amount], index) => {
    const start = cursor;
    const end = cursor + amount / total * 100;
    cursor = end;
    return `${colors[index % colors.length]} ${start}% ${end}%`;
  });
  const pieBackground = pieStops.length > 0
    ? `conic-gradient(${pieStops.join(", ")}, #E2E8F0 ${cursor}% 100%)`
    : "#E2E8F0";

  return (
    <div className="mt-6">
      <div className="grid min-w-0 gap-5 sm:grid-cols-[11rem_1fr] sm:items-center">
        <div className="mx-auto grid size-44 place-items-center rounded-full" style={{ background: pieBackground }}>
          <div className="grid size-24 place-items-center rounded-full bg-white text-center shadow-sm">
            <span className="px-2 text-xs font-extrabold text-slate-700">{formatCurrency(monthlyExpenses)}</span>
          </div>
        </div>
        <div className="min-w-0 space-y-3">
          {topCategories.slice(0, 3).map(([category, amount], index) => (
            <div key={category} className="flex min-w-0 items-center gap-3 text-sm">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="min-w-0 flex-1 break-words font-semibold text-slate-600">{category}</span>
              <strong className="shrink-0 text-slate-900">{formatPercent(amount / total)}</strong>
            </div>
          ))}
          <button onClick={() => setOpen(true)} className="focus-ring inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">
            Ver detalhes
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
          <button className="absolute inset-0" onClick={() => setOpen(false)} aria-label="Fechar detalhes" />
          <div className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <button onClick={() => setOpen(false)} className="absolute right-5 top-5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
              Fechar
            </button>
            <div className="pr-20">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-moss-600">Este mês</p>
              <h3 className="mt-1 text-xl font-extrabold">Gastos por categoria</h3>
            </div>
            <div className="mt-5 space-y-3">
              {categories.map(([category, amount], index) => (
                <div key={category} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-bold text-slate-700">{category}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatPercent(amount / total)} das saídas categorizadas</p>
                    </div>
                    <strong className="shrink-0 text-sm text-slate-950">{formatCurrency(amount)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
    style: "percent",
  }).format(value);
}
