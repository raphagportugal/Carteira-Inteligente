import type { Metadata } from "next";
import { signup } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Criar conta",
};

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error } = await searchParams;

  return (
    <AuthShell
      title="Comece a decidir com clareza."
      description="Crie sua conta grátis e descubra o que seu dinheiro pode fazer por seus planos."
    >
      <AuthForm mode="signup" action={signup} error={error} />
    </AuthShell>
  );
}
