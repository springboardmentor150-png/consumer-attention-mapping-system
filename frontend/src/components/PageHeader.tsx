import { ReactNode } from "react";

export default function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1
          className="text-3xl font-bold tracking-tight text-slate-900"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3">{actions}</div>
      )}
    </div>
  );
}
