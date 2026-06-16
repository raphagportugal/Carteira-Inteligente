"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { TransactionActions } from "@/components/dashboard/transaction-actions";
import { dateFormatter, formatCurrency, parseDate } from "@/lib/finance/format";
import type { BankAccount, CreditCard, Transaction } from "@/lib/finance/types";

export function TransactionsHistory({
  transactions,
  cards,
  accounts,
}: {
  transactions: Transaction[];
  cards: CreditCard[];
  accounts: BankAccount[];
}) {
  const [month, setMonth] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const months = Array.from(
    new Set(transactions.map((item) => item.transaction_date.slice(0, 7))),
  ).sort((a, b) => b.localeCompare(a));

  const groups = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("pt-BR");
    const filtered = transactions.filter((item) =>
      (!month || item.transaction_date.startsWith(month)) &&
      (!type || item.type === type) &&
      (!normalized || item.description.toLocaleLowerCase("pt-BR").includes(normalized)),
    );
    return filtered.reduce<Record<string, Transaction[]>>((result, item) => {
      const key = item.transaction_date.slice(0, 7);
      result[key] = [...(result[key] ?? []), item];
      return result;
    }, {});
  }, [month, search, transactions, type]);

  return (
    <>
      <section className="dashboard-card mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_180px_180px] sm:p-5">
        <label className="relative">
          <Search className="absolute left-3 top-3.5 size-4 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por descrição" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm" />
        </label>
        <select value={month} onChange={(event) => setMonth(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">
          <option value="">Todos os meses</option>
          {months.map((value) => <option key={value} value={value}>{formatMonth(value)}</option>)}
        </select>
        <select value={type} onChange={(event) => setType(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">
          <option value="">Todos os tipos</option>
          <option value="income">Entradas</option>
          <option value="expense">Saídas</option>
        </select>
      </section>

      {Object.keys(groups).length === 0 ? (
        <div className="dashboard-card p-10 text-center text-sm text-slate-500">
          Nenhuma movimentação encontrada com esses filtros.
        </div>
      ) : (
        <div className="space-y-7">
          {Object.entries(groups).sort(([a], [b]) => b.localeCompare(a)).map(([key, items]) => (
            <section key={key}>
              <h2 className="mb-3 text-sm font-extrabold capitalize text-slate-500">{formatMonth(key)}</h2>
              <div className="dashboard-card divide-y divide-slate-100 px-4 sm:px-6">
                {items.map((transaction) => {
                  const income = transaction.type === "income";
                  const card = transaction.credit_card_id ? cardsById.get(transaction.credit_card_id) : undefined;
                  const account = transaction.bank_account_id ? accountsById.get(transaction.bank_account_id) : undefined;
                  return <div key={transaction.id} className="flex flex-wrap items-center gap-3 py-4 sm:flex-nowrap">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${income ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}><CategoryIcon category={transaction.category} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{transaction.description}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {dateFormatter.format(parseDate(transaction.transaction_date))} · {transaction.category}
                        {card ? ` · ${card.name} final ${card.last_four_digits}` : ""}
                        {account ? ` · ${account.bank}` : ""}
                      </p>
                    </div>
                    <p className={`text-sm font-extrabold ${income ? "text-emerald-600" : "text-slate-900"}`}>
                      {income ? "+" : "-"} {formatCurrency(Number(transaction.amount))}
                    </p>
                    <TransactionActions transaction={transaction} />
                  </div>;
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T00:00:00.000Z`));
}
