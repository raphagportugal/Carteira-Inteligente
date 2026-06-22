import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { brand } from "@/config/brand";

type AuthShellProps = {
  children: React.ReactNode;
  title: string;
  description: string;
};

const highlights = [
  "Entenda quanto você realmente tem disponível",
  "Antecipe seu fluxo de caixa dos próximos mêses",
  "Receba recomendações para decidir com segurança",
];

export function AuthShell({ children, title, description }: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-soft-grid bg-[size:48px_48px] opacity-25" />
        <div className="absolute -bottom-48 -right-36 size-[34rem] rounded-full bg-moss-500/15 blur-3xl" />
        <div className="relative z-10">
          <BrandLogo href="/" />
        </div>

        <div className="relative z-10 my-auto max-w-xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-moss-100">
            {brand.tagline}
          </p>
          <h2 className="font-[var(--font-manrope)] text-5xl font-extrabold leading-[1.1] tracking-[-0.045em]">
            Entenda hoje. Planeje amanhã. Decida melhor.
          </h2>
          <div className="mt-10 space-y-4">
            {highlights.map((highlight) => (
              <div key={highlight} className="flex items-center gap-3 text-sm text-white/80">
                <CheckCircle2 className="size-5 text-moss-100" />
                {highlight}
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/50">
          © 2026 Carteira Inteligente
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-sand px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <BrandLogo />
          </div>
          <Link
            href="/"
            className="focus-ring mb-9 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-stone-500 hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            Voltar para o início
          </Link>
          <h1 className="font-[var(--font-manrope)] text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">{description}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
