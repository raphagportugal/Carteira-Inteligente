"use client";

import { Plus } from "lucide-react";

type NewMovementButtonProps = {
  compact?: boolean;
};

export function NewMovementButton({ compact = false }: NewMovementButtonProps) {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("open-movement-modal"))}
      className="focus-ring inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
    >
      <Plus className="size-4" />
      {compact ? "Adicionar" : "Cadastrar primeira movimentação"}
    </button>
  );
}
