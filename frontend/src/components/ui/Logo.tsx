import { cn } from "@/lib/utils";

/**
 * The CAMS mark: a gaze cone opening onto a shelf, drawn as concentric
 * attention arcs with a focal point. Pure SVG so it stays crisp at every
 * size and inherits the theme through currentColor.
 */
export function LogoMark({
  className,
  live = false,
}: {
  className?: string;
  /** Adds the slow brand pulse used while the platform is streaming. */
  live?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-xl",
        "bg-gradient-to-br from-brand-base to-teal-base text-white shadow-brand",
        live && "animate-pulse-ring",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-[19px] w-[19px]"
      >
        {/* Attention arcs, widening away from the observer. */}
        <path
          d="M5 19a7.5 7.5 0 0 1 14 0"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          opacity="0.45"
        />
        <path
          d="M8 19a4.4 4.4 0 0 1 8 0"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          opacity="0.75"
        />
        {/* The focal point — where the shopper is looking. */}
        <circle cx="12" cy="19" r="1.9" fill="currentColor" />
        {/* Gaze vector rising to the shelf. */}
        <path
          d="M12 15.4V6.2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M8.6 8.2 12 4.8l3.4 3.4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Wordmark({
  className,
  subtitle = true,
}: {
  className?: string;
  subtitle?: boolean;
}) {
  return (
    <span className={cn("flex min-w-0 flex-col leading-none", className)}>
      <span className="font-display text-[0.9375rem] font-bold tracking-tight text-ink">
        CAMS
      </span>

      {subtitle && (
        <span className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.14em] text-ink-subtle">
          Retail Intelligence
        </span>
      )}
    </span>
  );
}

export function Logo({
  className,
  subtitle = true,
  live = false,
}: {
  className?: string;
  subtitle?: boolean;
  live?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark live={live} />
      <Wordmark subtitle={subtitle} />
    </span>
  );
}
