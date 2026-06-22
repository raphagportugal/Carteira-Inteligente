import Link from "next/link";
import { Mail, Lock, UserRound } from "lucide-react";
import { AuthSubmitButton } from "./auth-submit-button";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (formData: FormData) => Promise<void>;
  message?: string;
  error?: string;
};

export function AuthForm({ mode, action, message, error }: AuthFormProps) {
  const isLogin = mode === "login";

  return (
    <form action={action} className="mt-8 space-y-5">
      {!isLogin && (
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Nome completo</span>
          <span className="relative block">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" />
            <input
              name="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              placeholder="Como podemos te chamar?"
              className="focus-ring h-12 w-full rounded-xl border border-stone-200 bg-white pl-12 pr-4 text-sm placeholder:text-stone-400"
            />
          </span>
        </label>
      )}

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

      <label className="block">
        <span className="mb-2 block text-sm font-semibold">Senha</span>
        <span className="relative block">
          <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" />
          <input
            name="password"
            type="password"
            autoComplete={isLogin ?"current-password" : "new-password"}
            required
            minLength={6}
            placeholder="Mínimo de 6 caracteres"
            className="focus-ring h-12 w-full rounded-xl border border-stone-200 bg-white pl-12 pr-4 text-sm placeholder:text-stone-400"
          />
        </span>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {message && (
        <p className="rounded-xl border border-moss-100 bg-moss-50 px-4 py-3 text-sm text-moss-700">
          {message}
        </p>
      )}

      <AuthSubmitButton
        label={isLogin ?"Entrar na minha conta" : "Criar minha conta"}
        pendingLabel={isLogin ?"Entrando..." : "Criando conta..."}
      />

      <p className="text-center text-sm text-stone-500">
        {isLogin ?"Ainda não tem uma conta?" : "Já tem uma conta?"}{" "}
        <Link
          href={isLogin ?"/cadastro" : "/login"}
          className="focus-ring rounded font-bold text-moss-700 hover:text-moss-900"
        >
          {isLogin ?"Cadastre-se" : "Entrar"}
        </Link>
      </p>
    </form>
  );
}
