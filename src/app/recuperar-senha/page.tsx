import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { requestPasswordReset } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";

export const metadata: Metadata = {
  title: "Recuperar senha",
};

type RecoverPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function RecoverPasswordPage({ searchParams }: RecoverPasswordPageProps) {
  const { error, message } = await searchParams;

  return (
    <AuthShell
      title="Recupere sua senha."
      description="Informe seu e-mail e enviaremos um link seguro para criar uma nova senha."
    >
      <form action={requestPasswordReset} className="mt-8 space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">E-mail</span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" />
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="voce@email.com"
              className="focus-ring h-12 w-full rounded-xl border border-stone-200 bg-white pl-12 pr-4 text-sm placeholder:text-stone-400"
            />
          </span>
        </label>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p className="rounded-xl border border-moss-100 bg-moss-50 px-4 py-3 text-sm text-moss-700">
            {message}
          </p>
        )}

        <AuthSubmitButton label="Enviar link de recuperação" pendingLabel="Enviando..." />

        <p className="text-center text-sm text-stone-500">
          Lembrou sua senha?{" "}
          <Link href="/login" className="focus-ring rounded font-bold text-moss-700 hover:text-moss-900">
            Entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
