import type { Metadata } from "next";
import { updatePassword } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { PasswordField } from "@/components/auth/password-field";

export const metadata: Metadata = {
  title: "Redefinir senha",
};

type UpdatePasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  const { error, message } = await searchParams;

  return (
    <AuthShell
      title="Crie uma nova senha."
      description="Escolha uma senha segura para voltar a acessar sua Carteira Inteligente."
    >
      <form action={updatePassword} className="mt-8 space-y-5">
        <PasswordField
          label="Nova senha"
          name="password"
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirmar nova senha"
          name="confirm_password"
          autoComplete="new-password"
          placeholder="Repita a nova senha"
        />

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

        <AuthSubmitButton label="Atualizar senha" pendingLabel="Atualizando..." />
      </form>
    </AuthShell>
  );
}
