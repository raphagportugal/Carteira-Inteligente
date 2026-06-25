import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { brand } from "@/config/brand";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
};

const legalLinks = [
  { href: "/privacy", label: "Privacidade" },
  { href: "/terms", label: "Termos de Uso" },
  { href: "/contact", label: "Contato" },
];

export function LegalPage({
  eyebrow,
  title,
  description,
  updatedAt,
  sections,
}: LegalPageProps) {
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

      <section className="container-page pb-20 pt-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-10 lg:p-12">
            <p className="brand-label">{eyebrow}</p>
            <h1 className="mt-4 font-[var(--font-manrope)] text-4xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">{description}</p>
            <p className="mt-4 text-xs font-semibold text-slate-400">Última atualização: {updatedAt}</p>

            <div className="mt-10 space-y-9">
              {sections.map((section) => (
                <section key={section.title} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 sm:p-6">
                  <h2 className="font-[var(--font-manrope)] text-xl font-extrabold text-slate-950">
                    {section.title}
                  </h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-3 text-sm leading-7 text-slate-600">
                      {paragraph}
                    </p>
                  ))}
                  {section.items && (
                    <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-600">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-moss-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
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

export { legalLinks };
