import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

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
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="mt-2 font-[var(--font-manrope)] text-2xl font-extrabold tracking-tight">
            {value}
          </p>
        </div>
        <span className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="size-5" />
        </span>
      </div>
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
