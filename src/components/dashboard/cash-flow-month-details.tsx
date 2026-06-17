"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { formatCurrency } from "@/lib/finance/format";

export type CashFlowMonthDetailsData = {
  label: string;
  entriesByCategory: Array<{ label: string; amount: number }>;
  expensesByCategory: Array<{ label: string; amount: number }>;
  monthlyBills: number;
  installments: number;
  financings: number;
  invested: number;
  leftover: number;
  topTransactions: Array<{ description: string; category: string; amount: number; type: string }>;
};

export function CashFlowMonthDetails({ details }: { details: CashFlowMonthDetailsData }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold">
        Ver mais
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <button className="absolute inset-0" onClick={() => setOpen(false)} aria-label="Fechar" />
          <article className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button onClick={() => setOpen(false)} className="absolute right-5 top-5 grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
              <X className="size-5" />
            </button>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss-600">Perfil do mes</p>
            <h2 className="mt-2 text-2xl font-extrabold capitalize">{details.label}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <Metric label="Mensalidades" value={details.monthlyBills} />
              <Metric label="Parcelamentos" value={details.installments} />
              <Metric label="Financiamentos" value={details.financings} />
              <Metric label="Valor investido" value={details.invested} />
            </div>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <Breakdown title="Entradas por categoria" items={details.entriesByCategory} empty="Sem entradas no mes." />
              <Breakdown title="Saidas por categoria" items={details.expensesByCategory} empty="Sem saidas avulsas no mes." />
            </div>
            <section className="mt-6 rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-extrabold">Sobra de caixa</p>
                <p className={details.leftover >= 0 ? "font-extrabold text-emerald-600" : "font-extrabold text-red-600"}>{formatCurrency(details.leftover)}</p>
              </div>
            </section>
            <section className="mt-6">
              <h3 className="text-sm font-extrabold">Maiores movimentacoes</h3>
              <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-100">
                {details.topTransactions.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">Nenhuma movimentacao manual neste mes.</p>
                ) : details.topTransactions.map((item, index) => (
                  <div key={`${item.description}-${index}`} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{item.description}</p>
                      <p className="text-xs text-slate-400">{item.category}</p>
                    </div>
                    <p className={item.type === "income" ? "text-sm font-extrabold text-emerald-600" : "text-sm font-extrabold"}>
                      {item.type === "income" ? "+" : "-"} {formatCurrency(item.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </article>
        </div>
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 font-extrabold">{formatCurrency(value)}</p></div>;
}

function Breakdown({ title, items, empty }: { title: string; items: Array<{ label: string; amount: number }>; empty: string }) {
  return (
    <section className="rounded-2xl border border-slate-100 p-5">
      <h3 className="text-sm font-extrabold">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? <p className="text-sm text-slate-500">{empty}</p> : items.map((item) => (
          <div key={item.label} className="flex justify-between gap-4 text-sm">
            <span className="text-slate-500">{item.label}</span>
            <strong>{formatCurrency(item.amount)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
