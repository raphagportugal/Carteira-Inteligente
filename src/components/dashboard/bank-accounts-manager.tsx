"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Landmark, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createAccountTransfer,
  createBankAccount,
  deleteAccountTransfer,
  deleteBankAccount,
  updateBankAccount,
} from "@/app/dashboard/actions";
import { bankThemeMapper } from "@/lib/finance/bank-theme";
import { BANKS } from "@/lib/finance/catalogs";
import { dateFormatter, formatCurrency, parseDate } from "@/lib/finance/format";
import type { AccountTransfer, BankAccount } from "@/lib/finance/types";
import { showSuccess } from "@/lib/ui/feedback";

export function BankAccountsManager({
  accounts,
  transfers,
}: {
  accounts: BankAccount[];
  transfers: AccountTransfer[];
}) {
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const total = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const today = new Date().toISOString().slice(0, 10);

  function submitAccount(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateBankAccount(formData)
        : await createBankAccount(formData);
      if (!result.success) return setError(result.message);
      setAccountOpen(false);
      setEditing(null);
      showSuccess("Conta atualizada.");
      router.refresh();
    });
  }

  function submitTransfer(formData: FormData) {
    startTransition(async () => {
      const result = await createAccountTransfer(formData);
      if (!result.success) return setError(result.message);
      setTransferOpen(false);
      showSuccess("Transferência realizada.");
      router.refresh();
    });
  }

  return (
    <section className="mb-8 space-y-5">
      <div className="rounded-3xl bg-slate-950 p-6 text-white sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss-400">
              Caixa Centralizado
            </p>
            <p className="mt-3 text-3xl font-extrabold">{formatCurrency(total)}</p>
            <p className="mt-2 text-xs text-slate-400">
              Soma dos saldos das suas contas bancárias.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setEditing(null); setError(""); setAccountOpen(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900"
            >
              <Plus className="size-4" /> Nova conta
            </button>
            <button
              disabled={accounts.length < 2}
              onClick={() => { setError(""); setTransferOpen(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold disabled:opacity-40"
            >
              <ArrowRightLeft className="size-4" /> Transferir
            </button>
          </div>
        </div>
      </div>

      {accounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => {
            const theme = bankThemeMapper(account.bank);
            return (
              <article
                key={account.id}
                className="min-h-44 rounded-2xl p-5 shadow-sm"
                style={{ background: theme.background, color: theme.foreground }}
              >
                <div className="flex items-start justify-between">
                  <Landmark className="size-6" />
                  <div className="flex">
                    <button onClick={() => { setEditing(account); setError(""); setAccountOpen(true); }} className="grid size-8 place-items-center"><Pencil className="size-4" /></button>
                    <button
                      onClick={() => {
                        if (!window.confirm("Excluir esta conta?")) return;
                        startTransition(async () => {
                          const result = await deleteBankAccount(account.id);
                          if (!result.success) return setError(result.message);
                          router.refresh();
                        });
                      }}
                      className="grid size-8 place-items-center"
                    ><Trash2 className="size-4" /></button>
                  </div>
                </div>
                <p className="mt-7 text-sm font-bold">{account.bank}</p>
                <p className="mt-1 text-xs opacity-70">
                  {account.account_number ?`Conta ${account.account_number}` : "Conta principal"}
                </p>
                <p className="mt-4 text-xl font-extrabold">{formatCurrency(Number(account.balance))}</p>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="dashboard-card p-8 text-center">
          <Landmark className="mx-auto size-8 text-moss-600" />
          <h2 className="mt-3 font-extrabold">Nenhuma conta cadastrada</h2>
          <p className="mt-2 text-sm text-slate-500">
            Cadastre sua primeira conta para centralizar o caixa.
          </p>
        </div>
      )}

      {transfers.length > 0 && (
        <div className="dashboard-card p-5 sm:p-6">
          <h2 className="font-extrabold">Transferências recentes</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {transfers.slice(0, 5).map((transfer) => (
              <div key={transfer.id} className="flex items-center gap-3 py-3">
                <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><ArrowRightLeft className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {accountsById.get(transfer.source_account_id)?.bank ??"Conta"} → {accountsById.get(transfer.destination_account_id)?.bank ??"Conta"}
                  </p>
                  <p className="text-xs text-slate-400">{dateFormatter.format(parseDate(transfer.transfer_date))} · transferência interna</p>
                </div>
                <p className="text-sm font-extrabold text-blue-600">{formatCurrency(Number(transfer.amount))}</p>
                <button
                  onClick={() => {
                    if (!window.confirm("Excluir e estornar esta transferência?")) return;
                    startTransition(async () => {
                      const result = await deleteAccountTransfer(transfer.id);
                      if (!result.success) return setError(result.message);
                      router.refresh();
                    });
                  }}
                  className="grid size-8 place-items-center text-slate-400 hover:text-red-500"
                ><Trash2 className="size-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {accountOpen && (
        <Modal title={editing ?"Editar conta" : "Nova conta"} close={() => setAccountOpen(false)}>
          <form action={submitAccount} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <label className="block"><span className="mb-2 block text-sm font-semibold">Banco</span><select name="bank" required defaultValue={editing?.bank ??""} className="h-12 w-full rounded-xl border bg-white px-4"><option value="" disabled>Selecione</option>{BANKS.map((bank) => <option key={bank}>{bank}</option>)}</select></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Número da conta (opcional)</span><input name="account_number" defaultValue={editing?.account_number ??""} className="h-12 w-full rounded-xl border px-4" /></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Saldo atual</span><input name="balance" required type="number" step="0.01" min="0" defaultValue={editing?.balance ??0} className="h-12 w-full rounded-xl border px-4" /></label>
            <button disabled={pending} className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white">{pending ?"Salvando..." : "Salvar conta"}</button>
          </form>
        </Modal>
      )}

      {transferOpen && (
        <Modal title="Transferência entre contas" close={() => setTransferOpen(false)}>
          <form action={submitTransfer} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <AccountSelect name="source_account_id" label="Conta origem" accounts={accounts} />
              <AccountSelect name="destination_account_id" label="Conta destino" accounts={accounts} />
            </div>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Valor</span><input name="amount" required type="number" min="0.01" step="0.01" className="h-12 w-full rounded-xl border px-4" /></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Data</span><input name="transfer_date" required type="date" defaultValue={today} className="h-12 w-full rounded-xl border px-4" /></label>
            <button disabled={pending} className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white">{pending ?"Transferindo..." : "Confirmar transferência"}</button>
          </form>
        </Modal>
      )}
    </section>
  );
}

function AccountSelect({ name, label, accounts }: { name: string; label: string; accounts: BankAccount[] }) {
  return <label><span className="mb-2 block text-sm font-semibold">{label}</span><select name={name} required defaultValue="" className="h-12 w-full rounded-xl border bg-white px-4"><option value="" disabled>Selecione</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.bank}{account.account_number ?` · ${account.account_number}` : ""}</option>)}</select></label>;
}

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm"><button className="absolute inset-0" onClick={close} /><div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8"><button onClick={close} className="absolute right-5 top-5"><X className="size-5" /></button><h2 className="mb-6 text-2xl font-extrabold">{title}</h2>{children}</div></div>;
}
