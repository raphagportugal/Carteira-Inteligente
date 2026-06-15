import type { Metadata } from "next";
import { Bell, LockKeyhole, UserRound } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";

export const metadata: Metadata = { title: "Configurações" };

export default function SettingsPage() {
  return (
    <>
      <PageHeading eyebrow="Sua conta" title="Configurações" description="Gerencie suas preferências e informações de acesso." />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="dashboard-card p-6">
          <div className="flex items-center gap-3"><UserRound className="size-5 text-moss-600" /><h2 className="font-[var(--font-manrope)] text-lg font-extrabold">Dados pessoais</h2></div>
          <form className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-2 block text-sm font-semibold">Nome</span><input defaultValue="Usuário da Carteira" className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold">E-mail</span><input defaultValue="usuario@email.com" type="email" className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></label>
            </div>
            <button type="button" className="focus-ring rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">Salvar alterações</button>
          </form>
        </section>
        <div className="space-y-4">
          <section className="dashboard-card p-5"><div className="flex items-start gap-3"><Bell className="mt-0.5 size-5 text-moss-600" /><div className="flex-1"><h2 className="font-extrabold">Notificações inteligentes</h2><p className="mt-1 text-xs leading-5 text-slate-500">Receba alertas sobre mudanças importantes no seu fluxo.</p></div><input type="checkbox" defaultChecked className="mt-1 size-4 accent-teal-500" /></div></section>
          <section className="dashboard-card p-5"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 size-5 text-moss-600" /><div><h2 className="font-extrabold">Segurança</h2><p className="mt-1 text-xs leading-5 text-slate-500">Sua autenticação é protegida pelo Supabase Auth.</p><button className="mt-3 text-xs font-bold text-moss-700">Alterar senha</button></div></div></section>
        </div>
      </div>
    </>
  );
}
