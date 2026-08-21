import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { tone, type Tone } from "@/lib/tone";

/**
 * Full-page state: not found, server error, or anything else that replaces
 * the whole route.
 *
 * Deliberately styled as part of the product rather than a browser default
 * — same canvas, same aurora, same brand mark — so a wrong URL never looks
 * like the application fell over.
 */
export function StatusPage({
  code,
  icon: Icon,
  variant = "analytics",
  title,
  description,
  actions,
}: {
  /** Large watermark figure, e.g. "404". Omit for non-HTTP states. */
  code?: string;
  icon: LucideIcon;
  variant?: Tone;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
}) {
  const styles = tone(variant);

  return (
    <main className="relative flex min-h-screen flex-col bg-canvas px-5 py-8 sm:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-35 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div
          className={cn(
            "animate-aurora absolute -left-24 top-10 h-80 w-80 rounded-full opacity-20 blur-3xl",
            styles.bar
          )}
        />
        <div className="animate-aurora absolute -right-20 bottom-16 h-72 w-72 rounded-full bg-analytics-base/15 blur-3xl [animation-delay:-9s]" />
      </div>

      <header className="relative">
        <Link href="/" className="inline-flex rounded-xl">
          <Logo />
        </Link>
      </header>

      <div className="relative flex flex-1 items-center justify-center py-12">
        <div className="max-w-lg text-center">
          {code && (
            <p
              className={cn(
                "font-display text-[5rem] font-extrabold leading-none tracking-tighter tabular-nums sm:text-[7rem]",
                styles.text,
                "opacity-25"
              )}
            >
              {code}
            </p>
          )}

          <span
            className={cn(
              "mx-auto mt-2 flex h-16 w-16 items-center justify-center rounded-2xl",
              styles.icon
            )}
          >
            <Icon className="h-7 w-7" aria-hidden="true" />
          </span>

          <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-ink text-balance sm:text-3xl">
            {title}
          </h1>

          <div className="mt-3 text-sm leading-relaxed text-ink-muted text-pretty sm:text-base">
            {description}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {actions}
          </div>
        </div>
      </div>

      <footer className="relative flex justify-center">
        <StatusBadge variant="neutral" outline size="sm">
          Consumer Attention Mapping System
        </StatusBadge>
      </footer>
    </main>
  );
}
