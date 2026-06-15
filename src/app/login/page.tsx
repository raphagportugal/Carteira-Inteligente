import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { login } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Entrar",
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams;

  return (
    <AuthShell
      title="Bem-vindo de volta."
      description="Entre para continuar seu planejamento com a Carteira Inteligente."
    >
      <AuthForm
        mode="login"
        action={login}
        error={error}
        message={message}
      />
    </AuthShell>
  );
}
