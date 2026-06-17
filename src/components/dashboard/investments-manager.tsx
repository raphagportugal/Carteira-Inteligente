"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, History, Pencil, Plus, Trash2, TrendingUp, X } from "lucide-react";
import {
  createInvestment,
  createInvestmentContribution,
  createInvestmentWithdrawal,
  deleteInvestment,
  deleteInvestmentContribution,
  deleteInvestmentWithdrawal,
  updateInvestment,
} from "@/app/dashboard/actions";
import { InvestmentTypeIcon } from "@/components/dashboard/category-icon";
import { EmptyState } from "@/components/dashboard/empty-state";
import { INVESTMENT_TYPES } from "@/lib/finance/catalogs";
import { dateFormatter, formatCurrency, parseDate } from "@/lib/finance/format";
import {
  getInvestmentCurrentDate,
  getInvestmentInitialDate,
  getInvestmentInitialValue,
  getInvestmentPosition,
} from "@/lib/finance/investment-position";
import type {
  BankAccount,
  Investment,
  InvestmentContribution,
  InvestmentType,
  InvestmentWithdrawal,
} from "@/lib/finance/types";
import { showSuccess } from "@/lib/ui/feedback";

const assetTypes = new Set<InvestmentType>(["property", "vehicle", "business_stake", "other_asset"]);

type Dialog =
  | { kind: "item"; investment: Investment | null }
  | { kind: "contribution"; investment: Investment }
  | { kind: "withdrawal"; investment: Investment }
  | { kind: "history"; investment: Investment }
  | null;

export function InvestmentsManager({
  investments,
  contributions,
  withdrawals,
  accounts,
}: {
  investments: Investment[];
  contributions: InvestmentContribution[];
  withdrawals: InvestmentWithdrawal[];
  accounts: BankAccount[];
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [selectedType, setSelectedType] = useState<InvestmentType>("fixed_income");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const typeOf = (item: Investment) => item.asset_type ?? item.type;
  const positionOf = (item: Investment) => getInvestmentPosition(item, contributions);
  const investmentsOnly = investments.filter((item) => !assetTypes.has(typeOf(item)));
  const assetsOnly = investments.filter((item) => assetTypes.has(typeOf(item)));
  const invested = investmentsOnly.reduce((sum, item) => sum + positionOf(item), 0);
  const patrimony = assetsOnly.reduce((sum, item) => sum + positionOf(item), 0);

  function openItem(investment: Investment | null) {
    setSelectedType(investment ? typeOf(investment) : "fixed_income");
    setError("");
    setDialog({ kind: "item", investment });
  }

  function run(action: () => Promise<{ success: boolean; message?: string }>, message: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.success) return setError(result.message ?? "Não foi possível concluir.");
      setDialog(null);
      setError("");
      showSuccess(message);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button onClick={() => openItem(null)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">
          <Plus className="size-4" /> Novo item
        </button>
      </div>

      {investments.length === 0 ? (
        <EmptyState icon={TrendingUp} title="Nenhum investimento ou bem cadastrado" description="Cadastre sua primeira posição financeira ou bem patrimonial." action={<button onClick={() => openItem(null)} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Cadastrar primeiro item</button>} />
      ) : (
        <>
          <section className="mb-8 grid gap-4 sm:grid-cols-3">
            <Metric label="Total investido" value={invested} />
            <Metric label="Total em patrimônio" value={patrimony} />
            <div className="rounded-2xl bg-slate-950 p-5 text-white"><p className="text-xs text-slate-400">Patrimônio total consolidado</p><p className="mt-2 text-xl font-extrabold">{formatCurrency(invested + patrimony)}</p></div>
          </section>
          <Group title="Investimentos" items={investmentsOnly} positionOf={positionOf} typeOf={typeOf} openItem={openItem} setDialog={setDialog} remove={(item) => {
            if (window.confirm(`Excluir "${item.name}"?`)) run(() => deleteInvestment(item.id), "Investimento excluído.");
          }} />
          <Group title="Patrimônio" items={assetsOnly} positionOf={positionOf} typeOf={typeOf} openItem={openItem} setDialog={setDialog} remove={(item) => {
            if (window.confirm(`Excluir "${item.name}"?`)) run(() => deleteInvestment(item.id), "Bem excluído.");
          }} />
        </>
      )}

      {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {dialog?.kind === "item" && (
        <Modal title={dialog.investment ? "Editar item" : "Novo investimento ou patrimônio"} close={() => setDialog(null)}>
          <form action={(formData) => run(
            () => dialog.investment ? updateInvestment(formData) : createInvestment(formData),
            "Registro atualizado.",
          )} className="space-y-4">
            {dialog.investment && <input type="hidden" name="id" value={dialog.investment.id} />}
            <label className="block"><span className="mb-2 block text-sm font-semibold">Nome</span><input name="name" required defaultValue={dialog.investment?.name} className="h-12 w-full rounded-xl border px-4" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold">Tipo</span><select name="type" required value={selectedType} onChange={(event) => setSelectedType(event.target.value as InvestmentType)} className="h-12 w-full rounded-xl border bg-white px-4">{INVESTMENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <label><span className="mb-2 block text-sm font-semibold">Instituição/local</span><input name="institution" required defaultValue={dialog.investment?.institution} className="h-12 w-full rounded-xl border px-4" /></label>
            </div>
            {assetTypes.has(selectedType) ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <MoneyField name="current_position" label="Valor atual estimado" defaultValue={dialog.investment ? positionOf(dialog.investment) : undefined} />
                <DateField name="current_position_date" label="Data de referência" defaultValue={dialog.investment ? getInvestmentCurrentDate(dialog.investment) : today()} />
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <MoneyField name="initial_value" label="Posição inicial" defaultValue={dialog.investment ? getInvestmentInitialValue(dialog.investment) : undefined} />
                  <DateField name="initial_date" label="Data da posição inicial" defaultValue={dialog.investment ? getInvestmentInitialDate(dialog.investment) : today()} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <MoneyField name="current_position" label="Posição atual" defaultValue={dialog.investment ? positionOf(dialog.investment) : undefined} />
                  <DateField name="current_position_date" label="Data da posição atual" defaultValue={dialog.investment ? getInvestmentCurrentDate(dialog.investment) : today()} />
                </div>
              </>
            )}
            <label className="block"><span className="mb-2 block text-sm font-semibold">Observação (opcional)</span><textarea name="notes" defaultValue={dialog.investment?.notes ?? ""} className="min-h-24 w-full rounded-xl border p-4 text-sm" /></label>
            <button disabled={pending} className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white">{pending ? "Salvando..." : "Salvar"}</button>
          </form>
        </Modal>
      )}

      {dialog?.kind === "contribution" && (
        <Modal title={`Aportar em ${dialog.investment.name}`} close={() => setDialog(null)}>
          <form action={(formData) => run(() => createInvestmentContribution(formData), "Aporte registrado.")} className="space-y-4">
            <input type="hidden" name="investment_id" value={dialog.investment.id} />
            <label className="block"><span className="mb-2 block text-sm font-semibold">Descrição (opcional)</span><input name="description" placeholder={`Aporte em ${dialog.investment.name}`} className="h-12 w-full rounded-xl border px-4" /></label>
            <MoneyField name="amount" label="Valor aportado" />
            <DateField name="contribution_date" label="Data" defaultValue={today()} />
            <AccountSelect accounts={accounts} label="Conta de origem" />
            <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">O aporte reduz a conta, aumenta a posição do investimento e entra no fluxo como valor investido.</p>
            <button disabled={pending || accounts.length === 0} className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white">{pending ? "Salvando..." : "Registrar aporte"}</button>
          </form>
        </Modal>
      )}

      {dialog?.kind === "withdrawal" && (
        <Modal title={`Sacar de ${dialog.investment.name}`} close={() => setDialog(null)}>
          <form action={(formData) => run(() => createInvestmentWithdrawal(formData), "Saque registrado.")} className="space-y-4">
            <input type="hidden" name="investment_id" value={dialog.investment.id} />
            <label className="block"><span className="mb-2 block text-sm font-semibold">Descrição (opcional)</span><input name="description" placeholder={`Saque de ${dialog.investment.name}`} className="h-12 w-full rounded-xl border px-4" /></label>
            <MoneyField name="amount" label="Valor líquido sacado" />
            <MoneyField name="resulting_position" label="Nova posição remanescente" defaultValue={Math.max(0, positionOf(dialog.investment))} />
            <DateField name="withdrawal_date" label="Data" defaultValue={today()} />
            <AccountSelect accounts={accounts} label="Conta de destino" />
            <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">O saque entra como entrada, reduz o valor investido do mês e ajusta objetivos vinculados proporcionalmente.</p>
            <button disabled={pending || accounts.length === 0} className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white">{pending ? "Salvando..." : "Registrar saque"}</button>
          </form>
        </Modal>
      )}

      {dialog?.kind === "history" && (
        <HistoryModal
          investment={dialog.investment}
          contributions={contributions.filter((item) => item.investment_id === dialog.investment.id)}
          withdrawals={withdrawals.filter((item) => item.investment_id === dialog.investment.id)}
          currentPosition={positionOf(dialog.investment)}
          close={() => setDialog(null)}
          remove={(id) => run(() => deleteInvestmentContribution(id), "Aporte excluído.")}
          removeWithdrawal={(id) => run(() => deleteInvestmentWithdrawal(id), "Saque excluído.")}
        />
      )}
    </>
  );
}

function Group({ title, items, positionOf, typeOf, openItem, setDialog, remove }: {
  title: string;
  items: Investment[];
  positionOf: (item: Investment) => number;
  typeOf: (item: Investment) => InvestmentType;
  openItem: (item: Investment) => void;
  setDialog: (dialog: Dialog) => void;
  remove: (item: Investment) => void;
}) {
  if (!items.length) return null;
  return <section className="mb-8"><p className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">{title}</p><div className="grid gap-4 lg:grid-cols-2">{items.map((item) => {
    const asset = assetTypes.has(typeOf(item));
    return <article key={item.id} className="dashboard-card p-5"><div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-moss-50 text-moss-600"><InvestmentTypeIcon type={typeOf(item)} /></span><div className="min-w-0 flex-1"><h2 className="font-extrabold">{item.name}</h2><p className="text-xs text-slate-400">{item.institution} · {INVESTMENT_TYPES.find((entry) => entry.value === typeOf(item))?.label}</p><p className="mt-3 text-xl font-extrabold">{formatCurrency(positionOf(item))}</p><p className="mt-1 text-xs text-slate-400">Referência: {dateFormatter.format(parseDate(getInvestmentCurrentDate(item)))}</p></div><div className="flex"><button onClick={() => openItem(item)} className="grid size-8 place-items-center text-slate-400"><Pencil className="size-4" /></button><button onClick={() => remove(item)} className="grid size-8 place-items-center text-slate-400 hover:text-red-500"><Trash2 className="size-4" /></button></div></div>{!asset && <div className="mt-5 flex flex-wrap gap-2"><button onClick={() => setDialog({ kind: "contribution", investment: item })} className="inline-flex items-center gap-1.5 rounded-lg bg-moss-50 px-3 py-2 text-xs font-bold text-moss-700"><ArrowDownToLine className="size-3.5" /> Aportar</button><button onClick={() => setDialog({ kind: "withdrawal", investment: item })} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><ArrowDownToLine className="size-3.5 rotate-180" /> Sacar</button><button onClick={() => setDialog({ kind: "history", investment: item })} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold"><History className="size-3.5" /> Histórico</button></div>}</article>;
  })}</div></section>;
}

function HistoryModal({ investment, contributions, withdrawals, currentPosition, close, remove, removeWithdrawal }: {
  investment: Investment;
  contributions: InvestmentContribution[];
  withdrawals: InvestmentWithdrawal[];
  currentPosition: number;
  close: () => void;
  remove: (id: string) => void;
  removeWithdrawal: (id: string) => void;
}) {
  const initial = getInvestmentInitialValue(investment);
  const difference = currentPosition - initial;
  return <Modal title={`Histórico · ${investment.name}`} close={close}>
    <div className="grid gap-3 sm:grid-cols-3">
      <Metric label="Posição inicial" value={initial} />
      <Metric label="Total aportado" value={contributions.reduce((sum, item) => sum + Number(item.amount), 0)} />
      <div className="rounded-xl bg-slate-950 p-4 text-white"><p className="text-xs text-slate-400">Posição atual informada</p><p className="mt-2 text-lg font-extrabold">{formatCurrency(currentPosition)}</p></div>
    </div>
    <div className="mt-5 rounded-xl bg-slate-50 p-4"><div className="flex justify-between text-xs"><span>Evolução simples</span><strong className={difference >= 0 ? "text-emerald-600" : "text-red-600"}>{difference >= 0 ? "+" : ""}{formatCurrency(difference)}</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-moss-500" style={{ width: `${Math.min(100, currentPosition > 0 ? initial / currentPosition * 100 : 0)}%` }} /></div></div>
    <div className="mt-6 space-y-2">
      <Timeline label="Posição inicial" date={getInvestmentInitialDate(investment)} amount={initial} />
      {contributions.sort((a, b) => a.contribution_date.localeCompare(b.contribution_date)).map((item) => <Timeline key={item.id} label="Aporte realizado" date={item.contribution_date} amount={Number(item.amount)} remove={() => remove(item.id)} />)}
      {withdrawals.sort((a, b) => a.withdrawal_date.localeCompare(b.withdrawal_date)).map((item) => <Timeline key={item.id} label="Saque realizado" date={item.withdrawal_date} amount={-Number(item.amount)} remove={() => removeWithdrawal(item.id)} />)}
      <Timeline label="Posição atual informada" date={getInvestmentCurrentDate(investment)} amount={currentPosition} />
    </div>
  </Modal>;
}

function Timeline({ label, date, amount, remove }: { label: string; date: string; amount: number; remove?: () => void }) {
  return <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><span className="size-2 rounded-full bg-moss-500" /><div className="flex-1"><p className="text-sm font-bold">{label}</p><p className="text-xs text-slate-400">{dateFormatter.format(parseDate(date))}</p></div><p className={`text-sm font-extrabold ${amount < 0 ? "text-red-600" : ""}`}>{formatCurrency(amount)}</p>{remove && <button onClick={remove} className="grid size-8 place-items-center text-slate-400 hover:text-red-500"><Trash2 className="size-4" /></button>}</div>;
}

function AccountSelect({ accounts, label }: { accounts: BankAccount[]; label: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span><select name="bank_account_id" required defaultValue="" className="h-12 w-full rounded-xl border bg-white px-4"><option value="" disabled>Selecione</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.bank}{account.account_number ? ` · ${account.account_number}` : ""}</option>)}</select></label>;
}

function MoneyField({ name, label, defaultValue }: { name: string; label: string; defaultValue?: number }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span><input name={name} required type="number" min="0" step="0.01" defaultValue={defaultValue} className="h-12 w-full rounded-xl border px-4" /></label>;
}

function DateField({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span><input name={name} required type="date" defaultValue={defaultValue} className="h-12 w-full rounded-xl border px-4" /></label>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="dashboard-card p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-lg font-extrabold">{formatCurrency(value)}</p></div>;
}

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm"><button className="absolute inset-0" onClick={close} /><div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8"><button onClick={close} className="absolute right-5 top-5"><X className="size-5" /></button><h2 className="mb-6 text-2xl font-extrabold">{title}</h2>{children}</div></div>;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
