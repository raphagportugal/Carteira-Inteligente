"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createCreditCard,
  deleteCreditCard,
  updateCreditCard,
} from "@/app/dashboard/actions";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { CreditCard as CreditCardRecord } from "@/lib/finance/types";
import { showSuccess } from "@/lib/ui/feedback";
import { BANKS } from "@/lib/finance/catalogs";
import { bankThemeMapper } from "@/lib/finance/bank-theme";

export function CreditCardsManager({ cards }: { cards: CreditCardRecord[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CreditCardRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function show(card: CreditCardRecord | null = null) {
    setEditing(card);
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
    setError("");
    startTransition(async () => {
      const result = editing
        ? await updateCreditCard(formData)
        : await createCreditCard(formData);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setOpen(false);
      setEditing(null);
      showSuccess(editing ?"Cartão atualizado." : "Cartão salvo.");
      router.refresh();
    });
  }

  function remove(card: CreditCardRecord) {
    if (!window.confirm(`Excluir o cartão "${card.name}"? `)) return;
    startTransition(async () => {
      const result = await deleteCreditCard(card.id);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button onClick={() => show()} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">
          <Plus className="size-4" /> Novo cartão
        </button>
      </div>
      {error && !open && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhum cartão cadastrado"
          description="Cadastre seus cartões para vincular compras parceladas e melhorar as projeções."
          action={<button onClick={() => show()} className="focus-ring rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Cadastrar cartão</button>}
        />
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const theme = bankThemeMapper(card.bank);
            return (
            <article key={card.id} className="relative overflow-hidden rounded-2xl p-6 shadow-sm" style={{ backgroundColor: theme.background, color: theme.foreground }}>
              <div className="absolute -right-10 -top-10 size-36 rounded-full bg-moss-500/10" />
              <div className="relative flex items-start justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-moss-500"><CreditCard className="size-5" /></span>
                <div className="flex gap-1">
                  <button onClick={() => show(card)} className="focus-ring grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white" aria-label={`Editar ${card.name}`}><Pencil className="size-4" /></button>
                  <button onClick={() => remove(card)} disabled={pending} className="focus-ring grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400" aria-label={`Excluir ${card.name}`}><Trash2 className="size-4" /></button>
                </div>
              </div>
              <p className="relative mt-8 text-xs text-slate-400">{card.bank}</p>
              <h2 className="relative mt-1 text-lg font-extrabold">{card.name}</h2>
              <p className="relative mt-5 font-mono text-sm tracking-[0.22em] text-slate-300">•••• {card.last_four_digits}</p>
              <div className="relative mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs">
                <div><p className="text-slate-500">Fechamento</p><p className="mt-1 font-bold">Dia {card.closing_day}</p></div>
                <div><p className="text-slate-500">Vencimento</p><p className="mt-1 font-bold">Dia {card.due_day}</p></div>
              </div>
            </article>
          );})}
        </section>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <button className="absolute inset-0" onClick={close} aria-label="Fechar modal" />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button onClick={close} disabled={pending} className="focus-ring absolute right-5 top-5 grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss-600">{editing ?"Editar cartão" : "Novo cartão"}</p>
            <h2 className="mt-2 font-[var(--font-manrope)] text-2xl font-extrabold">Dados do cartão</h2>
            <form action={submit} className="mt-7 space-y-4">
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="mb-2 block text-sm font-semibold">Nome</span><input name="name" required maxLength={80} defaultValue={editing?.name} placeholder="Ex.: Cartão principal" className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></label>
                <label><span className="mb-2 block text-sm font-semibold">Banco</span><select name="bank" required defaultValue={editing?.bank ??""} className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"><option value="" disabled>Selecione</option>{BANKS.map((bank) => <option key={bank}>{bank}</option>)}</select></label>
              </div>
              <label className="block"><span className="mb-2 block text-sm font-semibold">Últimos 4 dígitos</span><input name="last_four_digits" required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} defaultValue={editing?.last_four_digits} placeholder="1234" className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></label>
              <div className="grid grid-cols-2 gap-4">
                <label><span className="mb-2 block text-sm font-semibold">Dia de fechamento</span><input name="closing_day" required type="number" min="1" max="31" defaultValue={editing?.closing_day} className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></label>
                <label><span className="mb-2 block text-sm font-semibold">Dia de vencimento</span><input name="due_day" required type="number" min="1" max="31" defaultValue={editing?.due_day} className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></label>
              </div>
              {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <button disabled={pending} className="focus-ring h-12 w-full rounded-xl bg-slate-900 text-sm font-bold text-white disabled:opacity-60">{pending ?"Salvando..." : editing ?"Salvar alterações" : "Cadastrar cartão"}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
