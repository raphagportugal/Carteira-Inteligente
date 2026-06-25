import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Timer } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { legalLinks } from "@/components/public/legal-page";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Contato",
  description: "Contato e suporte da Carteira Inteligente.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-sand text-slate-900">
      <header className="container-page flex min-h-28 items-center justify-between gap-6 py-6">
        <BrandLogo className="h-16 w-auto sm:h-[4.25rem]" />
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-500 md:flex">
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="focus-ring rounded hover:text-slate-950">
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="container-page flex min-h-[calc(100vh-15rem)] items-center py-12">
        <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-soft sm:p-10 lg:p-12">
          <p className="brand-label">Fale conosco</p>
          <h1 className="mt-4 font-[var(--font-manrope)] text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl">
            Contato
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Para dúvidas, suporte ou solicitações relacionadas à sua conta, fale com a equipe da Carteira Inteligente.
          </p>

          <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <MessageCircle className="size-6 text-moss-600" />
              <h2 className="mt-4 font-extrabold">Carteira Inteligente</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{brand.domain}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <Mail className="size-6 text-moss-600" />
              <h2 className="mt-4 font-extrabold">E-mail</h2>
              <a href="mailto:contato@acarteirainteligente.com.br" className="mt-2 block break-words text-sm font-semibold leading-6 text-moss-700">
                contato@acarteirainteligente.com.br
              </a>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <Timer className="size-6 text-moss-600" />
              <h2 className="mt-4 font-extrabold">Suporte</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Prazo estimado de resposta: até 2 dias úteis.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="container-page flex flex-col items-center gap-5 border-t border-slate-200 py-9 text-center text-xs text-slate-500 sm:flex-row sm:justify-between sm:text-left">
        <p>© 2026 {brand.name} · {brand.domain}</p>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="focus-ring rounded font-semibold hover:text-slate-950">
              {link.label}
            </Link>
          ))}
        </div>
      </footer>
    </main>
  );
}
