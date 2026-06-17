"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard as CreditCardIcon, X } from "lucide-react";
import { createTransaction, updateTransaction } from "@/app/dashboard/actions";
import {
  CREDIT_CARD_PAYMENT_METHOD,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
} from "@/lib/finance/catalogs";
import type { BankAccount, CreditCard, Investment, MonthlyBill, Transaction, TransactionType } from "@/lib/finance/types";
import { showSuccess } from "@/lib/ui/feedback";

type MovementModalProps = {
  open: boolean;
  onClose: () => void;
  cards: CreditCard[];
  accounts: BankAccount[];
  monthlyBills: MonthlyBill[];
  investments: Investment[];
  transaction?: Transaction | null;
};

export function MovementModal({
  open,
  onClose,
  cards,
  accounts,
  monthlyBills,
  investments,
  transaction,
}: MovementModalProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<TransactionType>("income");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [category, setCategory] = useState("");
  const [linksMonthlyBill, setLinksMonthlyBill] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setType(transaction?.type ?? "income");
    setPaymentMethod(transaction?.payment_method ?? "");
    setCategory(transaction?.category ?? "");
    setLinksMonthlyBill(Boolean(transaction?.monthly_bill_id));
    setError("");
  }, [open, transaction]);

  if (!open) return null;

  const usesCreditCard =
    type === "expense" && paymentMethod === CREDIT_CARD_PAYMENT_METHOD;
  const isInvestmentWithdrawal =
    type === "income" && category.includes("Saque");
  const today = new Date().toISOString().slice(0, 10);
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function close() {
    if (isPending) return;
    setError("");
    formRef.current?.reset();
    onClose();
  }

  function submit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = transaction
        ? await updateTransaction(formData)
        : await createTransaction(formData);
      if (!result.success) {
        setError(result.message);
        return;
      }

      formRef.current?.reset();
      onClose();
      showSuccess(
        transaction ? "Movimentação atualizada." : "Movimentação salva.",
      );
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <button
        className="absolute inset-0"
        onClick={close}
        aria-label="Fechar modal"
      />
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          onClick={close}
          disabled={isPending}
          className="focus-ring absolute right-5 top-5 grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          aria-label="Fechar"
        >
          <X className="size-5" />
        </button>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss-600">
          {transaction ? "Editar movimentação" : "Nova movimentação"}
        </p>
        <h2 className="mt-2 font-[var(--font-manrope)] text-2xl font-extrabold">
          {transaction
            ? "Atualize os dados do registro"
            : "Registre uma entrada ou saída"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Compras no cartão impactam o fluxo na data de vencimento da fatura.
        </p>

        <form ref={formRef} action={submit} className="mt-7 space-y-4">
          {transaction && <input type="hidden" name="id" value={transaction.id} />}
          <div className="grid grid-cols-2 gap-3">
            {[
              ["income", "Entrada"],
              ["expense", "Saída"],
            ].map(([value, label]) => (
              <label key={value} className="cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={value}
                  checked={type === value}
                  onChange={() => setType(value as TransactionType)}
                  className="peer sr-only"
                />
                <span className="block rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold peer-checked:border-moss-500 peer-checked:bg-moss-50 peer-checked:text-moss-700">
                  {label}
                </span>
              </label>
            ))}
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Descrição</span>
            <input
              name="description"
              required
              maxLength={120}
              defaultValue={transaction?.description}
              placeholder="Ex.: Salário ou supermercado"
              className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Valor</span>
              <input
                name="amount"
                required
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={transaction?.amount}
                placeholder="0,00"
                className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                {usesCreditCard ? "Data da compra" : "Data"}
              </span>
              <input
                name="transaction_date"
                required
                type="date"
                defaultValue={transaction?.transaction_date ?? today}
                className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Categoria <span className="font-normal text-slate-400">(opcional)</span></span>
              <select
                name="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
              >
                <option value="">Sem categoria</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                Forma de pagamento
              </span>
              <select
                name="payment_method"
                required
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
              >
                <option value="" disabled>
                  Selecione
                </option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
            </label>
          </div>

          {isInvestmentWithdrawal && (
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">Dados do saque</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                O valor entra na conta escolhida e atualiza a posiÃ§Ã£o atual do investimento.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Investimento</span>
                  <select
                    name="investment_id"
                    required
                    defaultValue=""
                    className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
                  >
                    <option value="" disabled>Selecione</option>
                    {investments.map((investment) => (
                      <option key={investment.id} value={investment.id}>{investment.name}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Nova posiÃ§Ã£o atual</span>
                  <input
                    name="resulting_position"
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm"
                  />
                </label>
              </div>
            </div>
          )}

          {usesCreditCard && (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Cartão</span>
              {cards.length > 0 ? (
                <select
                  name="credit_card_id"
                  required
                  defaultValue={transaction?.credit_card_id ?? ""}
                  className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
                >
                  <option value="" disabled>
                    Selecione o cartão
                  </option>
                  {cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name} · {card.bank} · final {card.last_four_digits}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <CreditCardIcon className="mt-0.5 size-5 shrink-0 text-amber-700" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">
                        Cadastre um cartão primeiro
                      </p>
                      <p className="mt-1 text-xs leading-5 text-amber-800">
                        O fechamento e o vencimento são necessários para
                        calcular a data de impacto.
                      </p>
                      <Link
                        href="/dashboard/cartoes"
                        onClick={close}
                        className="mt-2 inline-block text-xs font-bold text-amber-900 underline"
                      >
                        Ir para Cartões
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </label>
          )}

          {!usesCreditCard && (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Conta</span>
              {accounts.length > 0 ? (
                <select
                  name="bank_account_id"
                  required
                  defaultValue={transaction?.bank_account_id ?? ""}
                  className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
                >
                  <option value="" disabled>Selecione a conta</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bank}{account.account_number ? ` · ${account.account_number}` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Cadastre uma conta em Contas e Fluxo de Caixa antes de registrar esta movimentação.
                </div>
              )}
            </label>
          )}

          {type === "expense" && (
            <div className="rounded-xl bg-slate-50 p-4">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={linksMonthlyBill}
                  onChange={(event) => setLinksMonthlyBill(event.target.checked)}
                  className="mt-1 size-4 rounded border-slate-300"
                />
                <span>
                  <strong>Esta movimentação corresponde a uma mensalidade cadastrada</strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    Quando vinculada, a mensalidade aparece como paga no mês.
                  </span>
                </span>
              </label>
              {linksMonthlyBill && (
                <select
                  name="monthly_bill_id"
                  required
                  defaultValue={transaction?.monthly_bill_id ?? ""}
                  className="focus-ring mt-3 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
                >
                  <option value="" disabled>Selecione a mensalidade</option>
                  {monthlyBills.map((bill) => (
                    <option key={bill.id} value={bill.id}>{bill.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={
              isPending ||
              (usesCreditCard && cards.length === 0) ||
              (!usesCreditCard && accounts.length === 0)
              || (isInvestmentWithdrawal && investments.length === 0)
            }
            className="focus-ring mt-2 h-12 w-full rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? "Salvando..."
              : transaction
                ? "Salvar alterações"
                : "Salvar movimentação"}
          </button>
        </form>
      </div>
    </div>
  );
}
