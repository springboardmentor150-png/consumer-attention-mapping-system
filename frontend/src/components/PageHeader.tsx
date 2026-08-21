import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The title block at the top of every page.
 *
 * `eyebrow` carries the section or live-status chips, `actions` the page's
 * controls. Keeping all three in one component is what makes /dashboard,
 * /stores and /shelves start at the same optical line.
 */
export default function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div className="animate-rise-in min-w-0">
        {eyebrow && (
          <div className="mb-3 flex flex-wrap items-center gap-2">{eyebrow}</div>
        )}

        <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-tight text-ink text-balance sm:text-[2rem]">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted text-pretty sm:text-[0.9375rem]">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="animate-rise-in stagger flex flex-wrap items-center gap-2.5 [--delay:80ms]">
          {actions}
        </div>
      )}
    </div>
  );
}
