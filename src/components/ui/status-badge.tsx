type StatusBadgeTone = "positive" | "negative" | "neutral" | "warning";

type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: StatusBadgeTone;
};

const badgeTones: Record<StatusBadgeTone, string> = {
  positive: "bg-moss-50 text-moss-700 ring-moss-100",
  negative: "bg-red-50 text-red-700 ring-red-100",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold ring-1 ${badgeTones[tone]}`}>
      {children}
    </span>
  );
}

