export function Icon({ path, className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
    </svg>
  );
}

export function StatCard({ title, value, accent = 'emerald', iconPath, footer }) {
  const iconShell = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-800 ring-amber-100',
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  };

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="mt-1 truncate text-lg font-bold tracking-tight text-gray-900 sm:text-xl">{value}</p>
        </div>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset ${iconShell[accent] || iconShell.emerald}`}
        >
          <Icon path={iconPath} className="h-4 w-4" />
        </span>
      </div>
      {footer ? <div className="mt-3 border-t border-gray-100 pt-2.5">{footer}</div> : null}
    </div>
  );
}
