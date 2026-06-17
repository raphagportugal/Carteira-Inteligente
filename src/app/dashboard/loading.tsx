export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 animate-pulse rounded-xl bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="dashboard-card p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-5 h-7 w-36 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="dashboard-card h-56 animate-pulse bg-white" />
    </div>
  );
}
