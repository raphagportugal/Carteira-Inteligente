import type { LucideIcon } from "lucide-react";

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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-400">{label}</p>
          <p className={`mt-2 truncate font-[var(--font-manrope)] text-2xl font-extrabold tracking-tight ${tones[tone].value}`}>
            {value}
          </p>
        </div>
        {Icon && (
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tones[tone].icon}`}>
            <Icon className="size-5" />
          </span>
        )}
      </div>
      {detail && <p className="mt-4 text-xs font-semibold text-slate-500">{detail}</p>}
    </article>
  );
}

