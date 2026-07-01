import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { CurrencyValue } from "@/components/ui/currency-value";

type SummaryCardProps = {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
  icon: LucideIcon;
  tone?: "green" | "amber" | "blue";
  help?: string;
};

const tones = {
  green: "bg-moss-50 text-moss-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
};

export function SummaryCard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  tone = "green",
  help,
}: SummaryCardProps) {
  const TrendIcon = trend === "down" ?ArrowDownRight : ArrowUpRight;

  return (
    <article className="dashboard-card p-5" title={help}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="min-w-0 text-xs font-medium text-slate-400">{label}</p>
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="size-5" />
        </span>
      </div>
      <CurrencyValue value={value} size="xl" className="mt-2 block font-[var(--font-manrope)] font-extrabold tracking-tight" />
      {change && <p
        className={`mt-5 flex items-center gap-1 text-xs font-bold ${
          trend === "down" ?"text-amber-600" : "text-emerald-600"
        }`}
      >
        <TrendIcon className="size-4" />
        {change}
        <span className="font-medium text-slate-400">vs. mês anterior</span>
      </p>}
    </article>
  );
}
