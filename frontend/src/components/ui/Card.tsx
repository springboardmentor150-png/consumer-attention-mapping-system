import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { tone, type Tone } from "@/lib/tone";

// One card system for the whole app. `Card` stays a plain div that accepts a
// className, so every existing `<Card className="p-6">` call site renders as
// before; the header/content parts below are opt-in structure.

export function Card({
  className,
  interactive = false,
  accent,
  glow,
  elevated = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  /** Lifts on hover. Use for cards that navigate or drill in. */
  interactive?: boolean;
  /** Adds a thin coloured rail down the left edge. */
  accent?: Tone;
  /** Adds a soft tonal wash bleeding from the top-right corner. */
  glow?: Tone;
  /** Rests at hover elevation. For the one hero card on a page. */
  elevated?: boolean;
}) {
  return (
    <div
      className={cn(
        "group/card relative overflow-hidden rounded-2xl border border-line bg-surface",
        elevated ? "shadow-card-hover" : "shadow-card",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out",
        interactive &&
          "cursor-pointer hover:-translate-y-1 hover:border-line-strong hover:shadow-card-hover",
        className
      )}
      {...props}
    >
      {glow && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl",
            "opacity-40 transition-opacity duration-500 group-hover/card:opacity-70",
            tone(glow).bar
          )}
        />
      )}

      {accent && (
        <span
          aria-hidden="true"
          className={cn("absolute inset-y-0 left-0 w-1", tone(accent).edge)}
        />
      )}

      <div className="relative">{props.children}</div>
    </div>
  );
}

export function CardHeader({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Usually an <AccentIcon />. */
  icon?: ReactNode;
  /** Right-aligned slot for a badge, filter or link. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon}

        <div className="min-w-0">
          <h2 className="font-display text-[0.9375rem] font-semibold tracking-tight text-ink sm:text-base">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm leading-relaxed text-ink-muted text-pretty">
              {description}
            </p>
          )}
        </div>
      </div>

      {action && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>
      )}
    </div>
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm text-ink-muted", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-4 border-t border-line pt-3 text-xs text-ink-subtle",
        className
      )}
      {...props}
    />
  );
}

/**
 * A bordered tile for use *inside* a card — the second level of the
 * hierarchy. Kept here so nested panels never re-invent their own border,
 * radius and hover treatment.
 */
export function Tile({
  className,
  interactive = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface p-4 transition-colors duration-200",
        interactive && "hover:border-line-strong hover:bg-surface-sunken/40",
        className
      )}
      {...props}
    />
  );
}
