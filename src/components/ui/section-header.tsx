type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-moss-600">
            {eyebrow}
          </p>
        )}
        <h2 className="font-[var(--font-manrope)] text-xl font-extrabold tracking-[-0.03em] text-slate-950">
          {title}
        </h2>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

