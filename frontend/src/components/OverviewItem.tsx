import { LucideIcon } from "lucide-react";

export function OverviewItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
      {Icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
      )}

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}
