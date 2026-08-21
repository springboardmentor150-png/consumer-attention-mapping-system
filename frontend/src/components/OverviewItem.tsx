import { LucideIcon } from "lucide-react";
import { AccentIcon } from "@/components/ui/AccentIcon";
import type { Tone } from "@/lib/tone";
import type { ReactNode } from "react";

/** Compact label/value tile used inside a Card, for at-a-glance facts. */
export function OverviewItem({
  label,
  value,
  icon: Icon,
  accent = "neutral",
  badge,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  accent?: Tone;
  /** Optional trailing slot, usually a <StatusBadge />. */
  badge?: ReactNode;
}) {
  return (
    <div className="group/item flex items-center gap-3 rounded-xl border border-line bg-surface-sunken/50 px-4 py-3.5 transition-all duration-200 hover:border-line-strong hover:bg-surface">
      {Icon && (
        <AccentIcon
          icon={Icon}
          variant={accent}
          size="sm"
          className="bg-surface shadow-card transition-transform duration-200 group-hover/item:scale-110"
        />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-subtle">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-semibold text-ink">{value}</p>
      </div>

      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  );
}
