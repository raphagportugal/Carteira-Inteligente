import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CreditCard, LockKeyhole, LogOut, UserRound } from "lucide-react";
import { logout } from "@/app/auth/actions";
import { updateUserProfile } from "@/app/dashboard/actions";
import { PageHeading } from "@/components/dashboard/page-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Configurações" };

const avatarThemes = ["teal", "slate", "gold", "rose"] as const;

async function saveSettingsProfile(formData: FormData) {
  "use server";
  await updateUserProfile(formData);
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const displayName = String(user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "Usuário");
  const avatar = String(user?.user_metadata?.avatar ?? "teal");
  const selectedAvatar = avatarThemes.includes(avatar as (typeof avatarThemes)[number])
    ? avatar
    : "teal";

  return (
    <>
      <PageHeading
        eyebrow="Sua conta"
        title="Configurações"
        description="Gerencie seus dados básicos, segurança e preferências da Carteira Inteligente."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="dashboard-card p-6">
          <div className="flex items-center gap-3">
            <UserRound className="size-5 text-moss-600" />
            <h2 className="font-[var(--font-manrope)] text-lg font-extrabold">Dados pessoais</h2>
          </div>

          <form action={saveSettingsProfile} className="mt-6 space-y-4">
            <input type="hidden" name="avatar" value={selectedAvatar} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Nome de exibição</span>
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  defaultValue={displayName}
                  className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">E-mail</span>
                <input
                  value={user?.email ?? ""}
                  type="email"
                  readOnly
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500"
                />
              </label>
            </div>
            <button className="focus-ring rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">
              Salvar alterações
            </button>
          </form>
        </section>

        <div className="space-y-4">
          <section className="dashboard-card p-5">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 size-5 text-moss-600" />
              <div>
                <h2 className="font-extrabold">Segurança</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Sua autenticação é protegida pelo Supabase Auth.
                </p>
                <Link href="/recuperar-senha" className="mt-3 inline-flex text-xs font-bold text-moss-700">
                  Alterar senha
                </Link>
              </div>
            </div>
          </section>

          <section className="dashboard-card p-5">
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 size-5 text-moss-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-extrabold">Notificações inteligentes</h2>
                  <StatusBadge tone="neutral">Em breve</StatusBadge>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Alertas automáticos serão ativados em uma próxima etapa.
                </p>
              </div>
            </div>
          </section>

          <section className="dashboard-card p-5">
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 size-5 text-moss-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-extrabold">Plano e assinatura</h2>
                  <StatusBadge tone="neutral">Em breve</StatusBadge>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Espaço reservado para gerenciamento de plano, sem cobrança ativa nesta versão.
                </p>
              </div>
            </div>
          </section>

          <form action={logout}>
            <button className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-100">
              <LogOut className="size-4" />
              Sair da conta
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
