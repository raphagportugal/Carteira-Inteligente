"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PRODUCTION_URL = "https://acarteirainteligente.com.br";

function redirectWithMessage(
  path: string,
  key: "error" | "message",
  message: string,
): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

async function getAuthRedirectBase() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("host");

  if (origin?.startsWith("http://localhost") || origin?.startsWith("http://127.0.0.1")) {
    return origin;
  }

  if (host?.startsWith("localhost") || host?.startsWith("127.0.0.1")) {
    return `http://${host}`;
  }

  return PRODUCTION_URL;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirectWithMessage("/login", "error", "Preencha o e-mail e a senha.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectWithMessage(
      "/login",
      "error",
      "Não foi possível entrar. Verifique seu e-mail e senha.",
    );
  }

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 6) {
    redirectWithMessage(
      "/cadastro",
      "error",
      "Preencha os dados e use uma senha com pelo menos 6 caracteres.",
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    redirectWithMessage(
      "/cadastro",
      "error",
      "Não foi possível criar sua conta. Talvez este e-mail já esteja em uso.",
    );
  }

  if (!data.session) {
    redirectWithMessage(
      "/login",
      "message",
      "Conta criada. Confira seu e-mail para confirmar o cadastro.",
    );
  }

  redirect("/dashboard");
}

export async function signInWithGoogle() {
  const siteUrl = await getAuthRedirectBase();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirectWithMessage(
      "/login",
      "error",
      "Não foi possível iniciar o login com Google. Tente novamente.",
    );
  }

  redirect(data.url);
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirectWithMessage("/recuperar-senha", "error", "Informe o e-mail da sua conta.");
  }

  const siteUrl = await getAuthRedirectBase();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/update-password/callback`,
  });

  if (error) {
    redirectWithMessage(
      "/recuperar-senha",
      "error",
      "Não foi possível enviar o e-mail de recuperação. Verifique o endereço e tente novamente.",
    );
  }

  redirectWithMessage(
    "/login",
    "message",
    "Enviamos um link para redefinir sua senha. Confira seu e-mail.",
  );
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 6 || password !== confirmPassword) {
    redirectWithMessage(
      "/auth/update-password",
      "error",
      "Use uma senha com pelo menos 6 caracteres e confirme a mesma senha.",
    );
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirectWithMessage(
      "/recuperar-senha",
      "error",
      "O link de recuperação expirou. Solicite um novo e-mail.",
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirectWithMessage(
      "/auth/update-password",
      "error",
      "Não foi possível atualizar sua senha. Solicite um novo link e tente novamente.",
    );
  }

  redirectWithMessage("/login", "message", "Senha atualizada com sucesso. Entre novamente.");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
