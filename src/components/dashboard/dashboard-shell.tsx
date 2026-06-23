"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Plus } from "lucide-react";
import { Sidebar } from "./sidebar";
import { MovementModal } from "./movement-modal";
import { ProfileMenu } from "./profile-menu";
import type { BankAccount, CreditCard, Investment, MonthlyBill, Transaction } from "@/lib/finance/types";

type DashboardShellProps = {
  children: React.ReactNode;
  name: string;
  fullName: string;
  avatar: string;
  cards: CreditCard[];
  accounts: BankAccount[];
  monthlyBills: MonthlyBill[];
  investments: Investment[];
};

export function DashboardShell({ children, name, fullName, avatar, cards, accounts, monthlyBills, investments }: DashboardShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const openModal = (event: Event) => {
      const detail = (event as CustomEvent<Transaction | undefined>).detail;
      setEditingTransaction(detail ??null);
      setModalOpen(true);
    };
    window.addEventListener("open-movement-modal", openModal);
    return () => window.removeEventListener("open-movement-modal", openModal);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const showMessage = (event: Event) => {
      setSuccessMessage((event as CustomEvent<string>).detail);
      clearTimeout(timeout);
      timeout = setTimeout(() => setSuccessMessage(""), 3500);
    };
    window.addEventListener("financial-success", showMessage);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("financial-success", showMessage);
    };
  }, []);

  return (
    <main className="min-h-screen bg-sand text-slate-900">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-5 sm:px-8 lg:px-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setMenuOpen(true)} className="focus-ring grid size-10 place-items-center rounded-xl border border-slate-200 bg-white lg:hidden" aria-label="Abrir menu">
                <Menu className="size-5" />
              </button>
              <div>
                <p className="hidden text-xs text-slate-400 sm:block">Seu planejamento financeiro</p>
                <p className="font-[var(--font-manrope)] text-base font-extrabold sm:mt-1 sm:text-lg">Olá, {name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button onClick={() => setCreateOpen((current) => !current)} className="focus-ring inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800" aria-expanded={createOpen}>
                  <Plus className="size-4" /><span className="hidden sm:inline">Criar</span>
                </button>
                {createOpen && (
                  <div className="absolute right-0 top-12 z-30 w-56 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-xl">
                    <button onClick={() => { setCreateOpen(false); setEditingTransaction(null); setModalOpen(true); }} className="focus-ring w-full rounded-xl px-3 py-2.5 text-left font-bold text-slate-700 hover:bg-slate-50">
                      Nova movimentação
                    </button>
                    <Link href="/dashboard/cartoes?novo=parcelamento" onClick={() => setCreateOpen(false)} className="focus-ring block rounded-xl px-3 py-2.5 font-bold text-slate-700 hover:bg-slate-50">
                      Novo parcelamento
                    </Link>
                    <Link href="/dashboard/mensalidades?novo=mensalidade" onClick={() => setCreateOpen(false)} className="focus-ring block rounded-xl px-3 py-2.5 font-bold text-slate-700 hover:bg-slate-50">
                      Nova mensalidade
                    </Link>
                  </div>
                )}
              </div>
              <ProfileMenu name={fullName} avatar={avatar} />
            </div>
          </div>
        </header>
        <div className="min-w-0 overflow-x-clip px-5 py-8 sm:px-8 lg:px-10">{children}</div>
      </div>
      <MovementModal
        open={modalOpen}
        cards={cards}
        accounts={accounts}
        monthlyBills={monthlyBills}
        investments={investments}
        transaction={editingTransaction}
        onClose={() => {
          setModalOpen(false);
          setEditingTransaction(null);
        }}
      />
      {successMessage && (
        <div className="fixed bottom-5 right-5 z-[80] rounded-xl border border-emerald-200 bg-white px-5 py-4 text-sm font-bold text-emerald-700 shadow-xl">
          {successMessage}
        </div>
      )}
    </main>
  );
}
