import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CalendarRange,
  Check,
  CircleDollarSign,
  CreditCard,
  Goal,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { CurrencyValue } from "@/components/ui/currency-value";
import { BrandLogo } from "@/components/brand-logo";
import { legalLinks } from "@/components/public/legal-page";

const capabilities = [
  {
    icon: WalletCards,
    title: "Visão completa da vida financeira",
    description:
      "Entradas, despesas e compromissos reunidos para mostrar quanto está realmente disponível.",
  },
  {
    icon: CalendarRange,
    title: "Fluxo de caixa futuro",
    description:
      "Antecipe os próximos mêses e entenda o impacto de cada decisão antes de tomá-la.",
  },
  {
    icon: CreditCard,
    title: "Parcelamentos sob controle",
    description:
      "Saiba quanto ainda falta pagar, quando cada parcela termina e quando seu orçamento ficará mais leve.",
  },
  {
    icon: Goal,
    title: "Objetivos financeiros",
    description:
      "Transforme planos em metas claras, com progresso e previsão realista de conclusão.",
  },
  {
    icon: BrainCircuit,
    title: "Recomendações inteligentes",
    description:
      "Receba leituras práticas sobre sua situação e descubra as próximas melhores decisões.",
  },
  {
    icon: LockKeyhole,
    title: "Segurança dos dados",
    description:
      "Sua conta e suas informações protegidas com uma arquitetura moderna e confiável.",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-sand text-slate-900">
      <header className="container-page relative z-20 flex h-32 items-center justify-between">
        <BrandLogo className="h-16 w-auto sm:h-[4.25rem] lg:h-[4.6rem]" />
        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-500 md:flex">
          <Link href="#produto" className="focus-ring rounded hover:text-slate-900">
            Produto
          </Link>
          <Link href="#como-funciona" className="focus-ring rounded hover:text-slate-900">
            Como funciona
          </Link>
          <Link href="#seguranca" className="focus-ring rounded hover:text-slate-900">
            Segurança
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="focus-ring inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 transition hover:border-slate-300 hover:text-moss-600 sm:h-auto sm:border-0 sm:bg-transparent sm:px-3 sm:py-2">
            Entrar
          </Link>
          <Link href="/cadastro" className="focus-ring hidden h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800 sm:inline-flex">
            Criar conta grátis
          </Link>
        </div>
      </header>

      <section className="relative pb-24 pt-14 sm:pt-24 lg:pb-32">
        <div className="absolute left-1/2 top-0 -z-10 h-[36rem] w-[80rem] -translate-x-1/2 rounded-full bg-moss-100/55 blur-3xl" />
        <div className="container-page grid items-center gap-16 lg:grid-cols-[1.04fr_.96fr]">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-moss-100 bg-white px-4 py-2 text-xs font-bold text-moss-700 shadow-sm">
              <Sparkles className="size-4" />
              Inteligência para sua vida financeira
            </div>
            <h1 className="font-[var(--font-manrope)] text-5xl font-extrabold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Entenda sua vida financeira{" "}
              <span className="text-moss-600">de verdade.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              Acompanhe gastos, parcelamentos, financiamentos, empréstimos e objetivos em um
              único lugar. Descubra quanto você realmente pode gastar, investir
              e planejar para o futuro.
            </p>
            <div className="mt-9 hidden flex-col gap-3 sm:flex sm:flex-row">
              <Link href="/cadastro" className="focus-ring inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800">
                Criar conta grátis <ArrowRight className="size-4" />
              </Link>
              <Link href="/login" className="focus-ring inline-flex h-14 items-center justify-center rounded-xl border border-slate-200 bg-white px-7 text-sm font-bold transition hover:border-slate-300">
                Ver demonstração
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="size-4 text-moss-600" />
              Sem planilhas. Sem complicação. Seus dados protegidos.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-12 -z-10 rounded-full bg-moss-100/70 blur-3xl" />
            <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-3 shadow-soft">
              <div className="rounded-[1.25rem] bg-slate-950 p-6 text-white sm:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Seu mês, em uma frase</p>
                    <p className="mt-2 max-w-xs font-[var(--font-manrope)] text-xl font-bold">
                      Você pode investir com tranquilidade.
                    </p>
                  </div>
                  <span className="grid size-11 place-items-center rounded-xl bg-moss-500/15 text-moss-500">
                    <BrainCircuit className="size-5" />
                  </span>
                </div>
                <div className="mt-8 rounded-2xl bg-white p-5 text-slate-900">
                  <p className="text-xs font-medium text-slate-400">Saldo realmente disponível</p>
                  <div className="mt-1 flex items-end justify-between">
                    <CurrencyValue value="R$ 3.200" size="xl" className="font-extrabold" />
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">+14% este mês</span>
                  </div>
                  <div className="mt-7 grid grid-cols-3 gap-3">
                    {[
                      ["Entradas", "R$ 9.350"],
                      ["Compromissos", "R$ 5.920"],
                      ["Poupança", "R$ 1.870"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] text-slate-400">{label}</p>
                        <CurrencyValue value={value} size="sm" className="mt-1 block font-extrabold" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <TrendingUp className="size-5 text-moss-500" />
                  <p className="text-xs leading-5 text-slate-300">
                    Suas parcelas diminuem em setembro. Você terá R$ 680 a mais por mês.
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-7 -left-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft sm:-left-10">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-moss-50 text-moss-600"><CircleDollarSign className="size-5" /></span>
                <div><p className="text-xs text-slate-400">Meta principal</p><p className="text-sm font-extrabold">68% concluída</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="produto" className="bg-white py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-moss-600">Mais do que controle</p>
            <h2 className="mt-4 font-[var(--font-manrope)] text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
              Um consultor financeiro ao seu lado.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-500">
              A Carteira Inteligente conecta o presente ao futuro para você tomar decisões com contexto.
            </p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-3xl border border-slate-200/70 bg-slate-50/70 p-7 transition hover:-translate-y-1 hover:bg-white hover:shadow-soft">
                <span className="grid size-12 place-items-center rounded-2xl bg-white text-moss-600 shadow-sm"><Icon className="size-6" strokeWidth={1.8} /></span>
                <h3 className="mt-6 font-[var(--font-manrope)] text-xl font-extrabold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="py-24">
        <div className="container-page">
          <div className="overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-14 text-white sm:px-12 lg:px-16">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-moss-500">Planejamento que olha adiante</p>
                <h2 className="mt-4 font-[var(--font-manrope)] text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
                  Saiba o impacto antes de decidir.
                </h2>
                <p className="mt-5 max-w-lg text-sm leading-7 text-slate-400">
                  O saldo de hoje não conta toda a história. A Carteira Inteligente considera compromissos futuros para revelar o que está realmente livre.
                </p>
              </div>
              <div className="space-y-4">
                {["Conecte sua realidade financeira", "Visualize os próximos mêses", "Receba recomendações claras"].map((step, index) => (
                  <div key={step} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-moss-500 font-bold text-slate-950">{index + 1}</span>
                    <span className="font-semibold">{step}</span>
                    <Check className="ml-auto size-5 text-moss-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="seguranca" className="bg-white py-20">
        <div className="container-page flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-moss-600">Segurança desde a base</p>
            <h2 className="mt-3 font-[var(--font-manrope)] text-3xl font-extrabold">Seus planos pertencem a você.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">Autenticação segura e arquitetura preparada para proteger seus dados financeiros.</p>
          </div>
          <ShieldCheck className="size-16 text-moss-500" strokeWidth={1.4} />
        </div>
      </section>

      <footer className="container-page flex flex-col items-center gap-5 border-t border-slate-200 py-11 text-center text-xs text-slate-500 sm:flex-row sm:justify-between sm:text-left">
        <BrandLogo className="h-16 w-auto sm:h-[4.25rem] lg:h-[4.6rem]" />
        <div className="space-y-3 sm:text-right">
          <p>© 2026 Carteira Inteligente · acarteirainteligente.com.br</p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-end">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="focus-ring rounded font-semibold hover:text-slate-950">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
