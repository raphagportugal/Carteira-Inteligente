"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { deleteTransaction } from "@/app/dashboard/actions";
import type { Transaction } from "@/lib/finance/types";

export function TransactionActions({ transaction }: { transaction: Transaction }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function edit() {
    window.dispatchEvent(
      new CustomEvent("open-movement-modal", { detail: transaction }),
    );
  }

  function remove() {
    const confirmed = window.confirm(
      `Excluir a movimentação "${transaction.description}"? Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    setError("");
    startTransition(async () => {
      const result = await deleteTransaction(transaction.id);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button onClick={edit} disabled={isPending} className="focus-ring grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Editar ${transaction.description}`}>
        <Pencil className="size-4" />
      </button>
      <button onClick={remove} disabled={isPending} className="focus-ring grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Excluir ${transaction.description}`}>
        <Trash2 className="size-4" />
      </button>
      {error && <span className="sr-only" role="alert">{error}</span>}
    </div>
  );
}
