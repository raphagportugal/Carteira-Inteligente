"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-sand px-5">
      <div className="max-w-md text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-moss-600">
          Algo não saiu como esperado
        </p>
        <h1 className="mt-4 font-[var(--font-manrope)] text-4xl font-extrabold">
          Não foi possível carregar esta página.
        </h1>
        <p className="mt-4 text-sm leading-6 text-stone-500">
          Confira a configuração do Supabase ou tente novamente em alguns
          instantes.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={reset}
            className="focus-ring rounded-xl bg-moss-700 px-5 py-3 text-sm font-bold text-white"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="focus-ring rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-bold"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
