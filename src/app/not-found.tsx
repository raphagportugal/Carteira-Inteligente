import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-sand px-5 text-center">
      <div>
        <p className="font-[var(--font-manrope)] text-7xl font-extrabold text-moss-100">
          404
        </p>
        <h1 className="mt-3 font-[var(--font-manrope)] text-3xl font-extrabold">
          Página não encontrada
        </h1>
        <p className="mt-3 text-sm text-stone-500">
          O endereço que você tentou acessar não existe.
        </p>
        <Link
          href="/"
          className="focus-ring mt-7 inline-flex rounded-xl bg-moss-700 px-5 py-3 text-sm font-bold text-white"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
