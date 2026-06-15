import Link from "next/link";
import { ChartNoAxesCombined } from "lucide-react";

type BrandLogoProps = {
  compact?: boolean;
  href?: string;
};

export function BrandLogo({ compact = false, href = "/" }: BrandLogoProps) {
  return (
    <Link
      href={href}
      className="focus-ring inline-flex items-center gap-3 rounded-lg"
      aria-label="Carteira Inteligente"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-slate-900 text-white shadow-sm">
        <ChartNoAxesCombined className="size-5 text-moss-500" strokeWidth={2} />
      </span>
      {!compact && (
        <span className="font-[var(--font-manrope)] text-sm font-extrabold uppercase leading-tight tracking-[0.04em]">
          Carteira
          <br /><span className="text-moss-600">Inteligente</span>
        </span>
      )}
    </Link>
  );
}
