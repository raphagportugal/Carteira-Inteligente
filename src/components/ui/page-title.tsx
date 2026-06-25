type PageTitleProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function PageTitle({ eyebrow, title, description, action }: PageTitleProps) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-moss-600">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-full text-balance break-words font-[var(--font-manrope)] text-3xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

