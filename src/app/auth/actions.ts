"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function redirectWithMessage(
  path: string,
  key: "error" | "message",
  message: string,
): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
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

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
