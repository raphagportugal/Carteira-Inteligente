"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createInstallment,
  deleteInstallment,
  updateInstallment,
} from "@/app/dashboard/actions";
import { EmptyState } from "@/components/dashboard/empty-state";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { EXPENSE_CATEGORIES } from "@/lib/finance/catalogs";
import { dateFormatter, parseDate } from "@/lib/finance/format";
import { CurrencyValue } from "@/components/ui/currency-value";
import {
  getInstallmentSchedule,
  getRemainingSchedule,
} from "@/lib/finance/installment-schedule";
import type { CreditCard as CreditCardRecord, Installment } from "@/lib/finance/types";
import { showSuccess } from "@/lib/ui/feedback";

export function InstallmentsManager({
  installments,
  cards,
}: {
  installments: Installment[];
  cards: CreditCardRecord[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Installment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const cardNames = new Map(cards.map((card) => [card.id, `${card.name} •••• ${card.last_four_digits}`]));
  const cardsById = new Map(cards.map((card) => [card.id, card]));

  const monthlyTotal = installments.reduce(
    (sum, item) => {
      const schedule = getInstallmentSchedule(
        item,
        item.credit_card_id ?cardsById.get(item.credit_card_id) : undefined,
      );
      return sum + (getRemainingSchedule(schedule)[0]?.amount ??0);
    },
    0,
  );
  const remainingTotal = installments.reduce(
    (sum, item) => {
      const schedule = getInstallmentSchedule(
        item,
        item.credit_card_id ?cardsById.get(item.credit_card_id) : undefined,
      );
      return (
        sum +
        getRemainingSchedule(schedule).reduce(
          (total, entry) => total + entry.amount,
          0,
        )
      );
    },
    0,
  );

  function openCreate() {
    setEditing(null);
    setError("");
    setModalOpen(true);
  }

  function openEdit(item: Installment) {
    setEditing(item);
    setError("");
    setModalOpen(true);
  }

  function close() {
    if (isPending) return;
    setModalOpen(false);
    setEditing(null);
    setError("");
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("novo") === "parcelamento" && cards.length > 0) {
      setEditing(null);
      setError("");
      setModalOpen(true);
      params.delete("novo");
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ?`?${query}` : ""}`);
    }
  }, [cards.length]);

  function submit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = editing
        ? await updateInstallment(formData)
        : await createInstallment(formData);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setModalOpen(false);
      setEditing(null);
      setError("");
      showSuccess(editing ?"Compra parcelada atualizada." : "Compra parcelada salva.");
      router.refresh();
    });
  }

  function remove(item: Installment) {
    if (!window.confirm(`Excluir o parcelamento "${item.name}"? Esta ação não pode ser desfeita.`)) return;
    setError("");
    startTransition(async () => {
      const result = await deleteInstallment(item.id);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-6 flex justify-start">
        {cards.length > 0 ? (
          <button onClick={openCreate} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
            <Plus className="size-4" /> Novo parcelamento
          </button>
        ) : (
          <Link href="/dashboard/cartoes" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">
            <Plus className="size-4" /> Cadastrar cartão primeiro
          </Link>
        )}
      </div>

      {error && !modalOpen && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {installments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhum parcelamento cadastrado"
          description="Cadastre seu primeiro parcelamento para visualizar seus compromissos futuros."
          action={cards.length > 0
            ?<button onClick={openCreate} className="focus-ring rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Cadastrar parcelamento</button>
            : <Link href="/dashboard/cartoes" className="focus-ring rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Cadastrar cartão</Link>}
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="dashboard-card min-w-0 p-5"><p className="text-xs text-slate-400">Total mensal</p><CurrencyValue value={monthlyTotal} size="card" className="mt-2 block font-extrabold" /></div>
            <div className="dashboard-card min-w-0 p-5"><p className="text-xs text-slate-400">Saldo restante</p><CurrencyValue value={remainingTotal} size="card" className="mt-2 block font-extrabold" /></div>
          </div>
          <section className="grid gap-4 lg:grid-cols-2">
            {installments.map((item) => {
              const card = item.credit_card_id
                ? cardsById.get(item.credit_card_id)
                : undefined;
              const schedule = getInstallmentSchedule(item, card);
              const remainingSchedule = getRemainingSchedule(schedule);
              const paidInstallments = schedule.length - remainingSchedule.length;
              const progress = Math.round(
                (paidInstallments / schedule.length) * 100,
              );
              const remainingInstallments = remainingSchedule.length;
              const remaining = remainingSchedule.reduce(
                (sum, entry) => sum + entry.amount,
                0,
              );
              const completed = remainingInstallments === 0;
              const totalAmount =
                Number(item.total_amount) ||
                schedule.reduce((sum, entry) => sum + entry.amount, 0);
              return (
                <article key={item.id} className="dashboard-card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-xl bg-moss-50 text-moss-600"><CategoryIcon category={item.category} /></span>
                      <div><h2 className="font-extrabold">{item.name}</h2><p className="mt-1 text-xs text-slate-400">{item.category} · {item.credit_card_id ? cardNames.get(item.credit_card_id) ?? "Cartão removido" : "Cartão não vinculado"}</p></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(item)} className="focus-ring grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Editar ${item.name}`}><Pencil className="size-4" /></button>
                      <button onClick={() => remove(item)} disabled={isPending} className="focus-ring grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Excluir ${item.name}`}><Trash2 className="size-4" /></button>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <p><CurrencyValue value={totalAmount} size="sm" className="font-extrabold" /><span className="font-normal text-slate-400"> total</span></p>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${completed ?"bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-600"}`}>{completed ?"Concluído" : "Ativo"}</span>
                  </div>
                  <div className="mt-5 flex justify-between text-xs"><span className="text-slate-500">{paidInstallments} de {item.total_installments} pagas</span><span className="font-bold">{remainingInstallments} restantes</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-moss-500" style={{ width: `${progress}%` }} /></div>
                  <div className="mt-5 flex flex-col gap-1 rounded-xl bg-slate-50 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between"><span className="text-slate-500">Valor restante</span><CurrencyValue value={remaining} size="sm" className="font-bold" /></div>
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Próximas parcelas</p>
                    {remainingSchedule.slice(0, 3).map((entry) => (
                      <div key={entry.number} className="flex justify-between text-xs">
                        <span className="text-slate-500">{entry.number}ª · {dateFormatter.format(parseDate(entry.dueDate))}</span>
                        <CurrencyValue value={entry.amount} size="sm" className="font-bold" />
                      </div>
                    ))}
                    {remainingSchedule.length === 0 && <p className="text-xs text-slate-400">Cronograma concluído.</p>}
                  </div>
                  <p className="mt-3 text-xs text-slate-400">Última parcela: {dateFormatter.format(parseDate(schedule[schedule.length - 1].dueDate))}</p>
                </article>
              );
            })}
          </section>
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <button className="absolute inset-0" onClick={close} aria-label="Fechar modal" />
          <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button onClick={close} disabled={isPending} className="focus-ring absolute right-5 top-5 grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Fechar"><X className="size-5" /></button>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss-600">{editing ?"Editar parcelamento" : "Novo parcelamento"}</p>
            <h2 className="mt-2 font-[var(--font-manrope)] text-2xl font-extrabold">Detalhes do compromisso</h2>
            <form action={submit} className="mt-7 space-y-4">
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="mb-2 block text-sm font-semibold">Descrição</span><input name="description" required maxLength={120} defaultValue={editing?.name} placeholder="Ex.: Notebook" className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></label>
                <label><span className="mb-2 block text-sm font-semibold">Categoria</span><select name="category" required defaultValue={editing?.category ??""} className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"><option value="" disabled>Selecione</option>{EXPENSE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
              </div>
              <label className="block"><span className="mb-2 block text-sm font-semibold">Cartão</span><select name="credit_card_id" required defaultValue={editing?.credit_card_id ??""} className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"><option value="" disabled>Selecione</option>{cards.map((card) => <option key={card.id} value={card.id}>{card.name} •••• {card.last_four_digits}</option>)}</select></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="mb-2 block text-sm font-semibold">Valor total da compra</span><input name="total_amount" required type="number" min="0.01" step="0.01" defaultValue={editing?.total_amount ??Number(editing?.installment_amount ??0) * Number(editing?.total_installments ??0)} className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></label>
                <label><span className="mb-2 block text-sm font-semibold">Quantidade de parcelas</span><input name="total_installments" required type="number" min="1" max="120" step="1" defaultValue={editing?.total_installments} className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></label>
              </div>
              <label className="block"><span className="mb-2 block text-sm font-semibold">Data da compra</span><input name="purchase_date" required type="date" defaultValue={editing?.purchase_date ??editing?.start_date} className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /><span className="mt-2 block text-xs text-slate-400">Valor da parcela e cronograma serão calculados pelo fechamento e vencimento do cartão.</span></label>
              {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={isPending} className="focus-ring h-12 w-full rounded-xl bg-slate-900 text-sm font-bold text-white disabled:opacity-60">{isPending ?"Salvando..." : editing ?"Salvar alterações" : "Cadastrar parcelamento"}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
