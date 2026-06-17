"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Pencil, Plus, Trash2, X } from "lucide-react";
import { createMonthlyBill, deleteMonthlyBill, updateMonthlyBill } from "@/app/dashboard/actions";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { EmptyState } from "@/components/dashboard/empty-state";
import { EXPENSE_CATEGORIES, MONTHLY_BILL_STATUSES, PAYMENT_METHODS } from "@/lib/finance/catalogs";
import { addMonths, dateFormatter, formatCurrency, monthFormatter, parseDate } from "@/lib/finance/format";
import { getMonthlyBillOccurrence } from "@/lib/finance/monthly-bills";
import type { BankAccount, CreditCard, MonthlyBill, Transaction } from "@/lib/finance/types";
import { showSuccess } from "@/lib/ui/feedback";

type MonthWindow = { date: Date; key: string };

export function MonthlyBillsManager({
  bills,
  accounts,
  cards,
  transactions,
}: {
  bills: MonthlyBill[];
  accounts: BankAccount[];
  cards: CreditCard[];
  transactions: Transaction[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<MonthlyBill | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [target, setTarget] = useState<"account" | "card">("account");
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  const months = [-1, 0, 1].map((offset) => {
    const date = addMonths(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)), offset);
    return { date, key: date.toISOString().slice(0, 7) };
  });
  const activeTotal = bills
    .filter((bill) => {
      const occurrence = getMonthlyBillOccurrence({
        bill,
        month: today.slice(0, 7),
        cardsById,
        transactions,
        today,
      });
      return occurrence.status !== "not_started" && occurrence.status !== "inactive";
    })
    .reduce((sum, bill) => sum + Number(bill.monthly_amount), 0);

  function show(bill: MonthlyBill | null = null) {
    setEditing(bill);
    setTarget(bill?.credit_card_id ?"card" : "account");
    setError("");
    setOpen(true);
  }

  function close() {
    if (pending) return;
    setOpen(false);
    setEditing(null);
    setError("");
  }

  function submit(formData: FormData) {
    if (target === "account") formData.set("credit_card_id", "");
    if (target === "card") formData.set("bank_account_id", "");
    startTransition(async () => {
      const result = editing ?await updateMonthlyBill(formData) : await createMonthlyBill(formData);
      if (!result.success) return setError(result.message);
      setOpen(false);
      setEditing(null);
      showSuccess(editing ?"Mensalidade atualizada." : "Mensalidade salva.");
      router.refresh();
    });
  }

  function remove(bill: MonthlyBill) {
    if (!window.confirm(`Excluir a mensalidade "${bill.name}"? `)) return;
    startTransition(async () => {
      const result = await deleteMonthlyBill(bill.id);
      if (!result.success) return setError(result.message);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button onClick={() => show()} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"><Plus className="size-4" /> Nova mensalidade</button>
      </div>
      {error && !open && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {bills.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Nenhuma mensalidade cadastrada" description="Cadastre despesas recorrentes para incluí-las nas projeções e despesas comprometidas." action={<button onClick={() => show()} className="focus-ring rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Cadastrar mensalidade</button>} />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="dashboard-card p-5"><p className="text-xs text-slate-400">Compromisso mensal ativo</p><p className="mt-2 text-xl font-extrabold">{formatCurrency(activeTotal)}</p></div>
            <div className="dashboard-card p-5"><p className="text-xs text-slate-400">Mensalidades cadastradas</p><p className="mt-2 text-xl font-extrabold">{bills.length}</p></div>
          </div>
          <section className="space-y-4">
            {bills.map((bill) => <article key={bill.id} className="dashboard-card flex flex-col gap-5 p-5 md:flex-row md:items-center">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-moss-50 text-moss-600"><CategoryIcon category={bill.category} /></span>
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold">{bill.name}</h2>
                <p className="mt-1 text-xs text-slate-400">{bill.category} - {bill.payment_method}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {months.map((month) => <StatusPill key={month.key} bill={bill} month={month} cardsById={cardsById} transactions={transactions} today={today} />)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5 text-sm sm:grid-cols-4">
                <div><p className="text-[10px] uppercase text-slate-400">Valor</p><p className="mt-1 font-extrabold">{formatCurrency(Number(bill.monthly_amount))}</p></div>
                <div><p className="text-[10px] uppercase text-slate-400">Vencimento</p><p className="mt-1 font-extrabold">Dia {bill.due_day}</p></div>
                <div><p className="text-[10px] uppercase text-slate-400">Início</p><p className="mt-1 font-extrabold">{dateFormatter.format(parseDate(bill.start_date))}</p></div>
                <div><p className="text-[10px] uppercase text-slate-400">Pagamento</p><p className="mt-1 font-extrabold">{bill.credit_card_id ?"Cartão" : "Conta"}</p></div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => show(bill)} className="focus-ring grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="size-4" /></button>
                <button onClick={() => remove(bill)} disabled={pending} className="focus-ring grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-4" /></button>
              </div>
            </article>)}
          </section>
        </>
      )}
      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <button className="absolute inset-0" onClick={close} aria-label="Fechar modal" />
          <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button onClick={close} disabled={pending} className="focus-ring absolute right-5 top-5 grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss-600">{editing ?"Editar mensalidade" : "Nova mensalidade"}</p>
            <h2 className="mt-2 font-[var(--font-manrope)] text-2xl font-extrabold">Despesa recorrente</h2>
            <form action={submit} className="mt-7 space-y-4">
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <label className="block"><span className="mb-2 block text-sm font-semibold">Nome</span><input name="name" required defaultValue={editing?.name} className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="mb-2 block text-sm font-semibold">Categoria <span className="font-normal text-slate-400">(opcional)</span></span><select name="category" defaultValue={editing?.category ??""} className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"><option value="">Sem categoria</option>{EXPENSE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label><span className="mb-2 block text-sm font-semibold">Forma de pagamento</span><select name="payment_method" required defaultValue={editing?.payment_method ??""} className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"><option value="" disabled>Selecione</option>{PAYMENT_METHODS.map((item) => <option key={item}>{item}</option>)}</select></label>
              </div>
              <div className="grid gap-4 sm:grid-cols-[.75fr_1fr]">
                <label><span className="mb-2 block text-sm font-semibold">Vincular a</span><select value={target} onChange={(event) => setTarget(event.target.value as "account" | "card")} className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"><option value="account">Conta bancária</option><option value="card">Cartão de crédito</option></select></label>
                {target === "account" ?<label><span className="mb-2 block text-sm font-semibold">Conta <span className="font-normal text-slate-400">(opcional)</span></span><select name="bank_account_id" defaultValue={editing?.bank_account_id ?? ""} className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"><option value="">Sem conta fixa</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.bank}</option>)}</select></label> : <label><span className="mb-2 block text-sm font-semibold">Cartão</span><select name="credit_card_id" required defaultValue={editing?.credit_card_id ??""} className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"><option value="" disabled>Selecione</option>{cards.map((card) => <option key={card.id} value={card.id}>{card.name} - {card.bank}</option>)}</select></label>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="mb-2 block text-sm font-semibold">Valor mensal</span><input name="monthly_amount" required type="number" min="0.01" step="0.01" defaultValue={editing?.monthly_amount} className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></label>
                <label><span className="mb-2 block text-sm font-semibold">Dia de vencimento</span><input name="due_day" required type="number" min="1" max="31" defaultValue={editing?.due_day} className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="mb-2 block text-sm font-semibold">Data de início</span><input name="start_date" required type="date" defaultValue={editing?.start_date} className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></label>
                <label><span className="mb-2 block text-sm font-semibold">Data final (opcional)</span><input name="end_date" type="date" defaultValue={editing?.end_date ??""} className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></label>
              </div>
              <label className="block"><span className="mb-2 block text-sm font-semibold">Status</span><select name="status" required defaultValue={editing?.status ??"active"} className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm">{MONTHLY_BILL_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <button disabled={pending} className="focus-ring h-12 w-full rounded-xl bg-slate-900 text-sm font-bold text-white disabled:opacity-60">{pending ?"Salvando..." : editing ?"Salvar alterações" : "Cadastrar mensalidade"}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function StatusPill({ bill, month, cardsById, transactions, today }: { bill: MonthlyBill; month: MonthWindow; cardsById: Map<string, CreditCard>; transactions: Transaction[]; today: string }) {
  const occurrence = getMonthlyBillOccurrence({ bill, month: month.key, cardsById, transactions, today });
  const labels = {
    not_started: "não iniciado",
    paid: "pago",
    overdue: "vencido",
    pending: "pendente",
    future: "futuro",
    inactive: "inativo",
  };
  const colors = {
    not_started: "bg-slate-50 text-slate-400",
    paid: "bg-emerald-50 text-emerald-700",
    overdue: "bg-amber-50 text-amber-700",
    pending: "bg-amber-50 text-amber-700",
    future: "bg-slate-100 text-slate-500",
    inactive: "bg-slate-50 text-slate-400",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${colors[occurrence.status]}`}>{monthFormatter.format(month.date)} - {labels[occurrence.status]}</span>;
}
