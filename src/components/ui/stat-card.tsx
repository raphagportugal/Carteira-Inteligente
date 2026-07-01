import type { LucideIcon } from "lucide-react";
import { CurrencyValue } from "@/components/ui/currency-value";

type StatTone = "positive" | "negative" | "neutral" | "warning";

type StatCardProps = {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: StatTone;
  detail?: string;
};

const tones: Record<StatTone, { icon: string; value: string }> = {
  positive: { icon: "bg-moss-50 text-moss-700", value: "text-moss-700" },
  negative: { icon: "bg-red-50 text-red-700", value: "text-red-600" },
  neutral: { icon: "bg-slate-100 text-slate-700", value: "text-slate-950" },
  warning: { icon: "bg-amber-50 text-amber-700", value: "text-amber-700" },
};

export function StatCard({ label, value, icon: Icon, tone = "neutral", detail }: StatCardProps) {
  return (
    <article className="dashboard-card p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="min-w-0 text-xs font-semibold text-slate-400">{label}</p>
        {Icon && (
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tones[tone].icon}`}>
            <Icon className="size-5" />
          </span>
        )}
      </div>
      <CurrencyValue value={value} size="xl" className={`mt-2 block font-[var(--font-manrope)] font-extrabold tracking-tight ${tones[tone].value}`} />
      {detail && <p className="mt-4 text-xs font-semibold text-slate-500">{detail}</p>}
    </article>
  );
}

