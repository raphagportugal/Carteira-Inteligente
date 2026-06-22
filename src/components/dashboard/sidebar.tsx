"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  CalendarClock,
  Goal,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  List,
  Settings,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";
import { logout } from "@/app/auth/actions";
import { BrandLogo } from "@/components/brand-logo";

const navigation = [
  { label: "Visão geral", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Movimentações", icon: List, href: "/dashboard/movimentacoes" },
  { label: "Contas e Fluxo de Caixa", icon: WalletCards, href: "/dashboard/fluxo-de-caixa" },
  { label: "Cartões e Parcelamentos", icon: CreditCard, href: "/dashboard/cartoes" },
  { label: "Mensalidades", icon: CalendarClock, href: "/dashboard/mensalidades" },
  { label: "Financiamentos e Empréstimos", icon: ReceiptText, href: "/dashboard/financiamentos" },
  { label: "Investimentos e Patrimônio", icon: TrendingUp, href: "/dashboard/investimentos" },
  { label: "Objetivos e Planejamento Fin.", icon: Goal, href: "/dashboard/objetivos" },
];

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <>
      <div className="flex items-center justify-between">
        <BrandLogo href="/dashboard" />
        <button onClick={onClose} className="focus-ring grid size-9 place-items-center rounded-lg text-slate-400 lg:hidden" aria-label="Fechar menu">
          <X className="size-5" />
        </button>
      </div>
      <nav className="mt-10 flex-1 space-y-1.5 overflow-y-auto pr-1">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Planejamento</p>
        {navigation.map(({ label, icon: Icon, href }) => {
          const active = href === "/dashboard" ?pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`focus-ring flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                active ?"bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`size-[18px] ${active ?"text-moss-500" : ""}`} strokeWidth={1.9} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1.5 border-t border-slate-100 pt-5">
        <Link
          href="/dashboard/configuracoes"
          onClick={onClose}
          className={`focus-ring flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
            pathname === "/dashboard/configuracoes" ?"bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Settings className="size-[18px]" /> Configurações
        </Link>
        <form action={logout}>
          <button className="focus-ring flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600">
            <LogOut className="size-[18px]" /> Sair
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-200/80 bg-white/95 p-6 backdrop-blur-xl lg:flex">
        {content}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} aria-label="Fechar menu" />
          <aside className="relative flex h-full w-[300px] flex-col bg-white p-6 shadow-2xl">{content}</aside>
        </div>
      )}
    </>
  );
}
