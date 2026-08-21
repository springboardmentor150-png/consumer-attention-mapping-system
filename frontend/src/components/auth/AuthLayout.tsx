"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Logo, LogoMark } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AttentionScene } from "@/components/auth/AttentionScene";

/**
 * The split frame both auth pages sit in.
 *
 * Left: what the platform does, over an animated attention-mapping scene.
 * Right: the form, in a glass card. The left panel is hidden below `lg` —
 * on a phone the form is the whole job, and a decorative half-screen would
 * only push it below the fold.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  highlights,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  highlights: string[];
}) {
  return (
    <main className="relative min-h-screen bg-canvas lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ── Brand panel ───────────────────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden bg-canvas-deep lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="animate-aurora absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-brand-base/25 blur-3xl" />
          <div className="animate-aurora absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-analytics-base/20 blur-3xl [animation-delay:-10s]" />
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-line to-transparent" />
        </div>

        <div className="relative">
          <Link href="/" className="inline-flex rounded-xl">
            <Logo />
          </Link>
        </div>

        <div className="relative max-w-lg">
          <StatusBadge variant="healthy" dot pulse>
            Computer vision · Live
          </StatusBadge>

          <h1 className="mt-6 font-display text-[2.5rem] font-bold leading-[1.1] tracking-tight text-ink text-balance">
            See what your shoppers{" "}
            <span className="text-gradient-brand">actually look at.</span>
          </h1>

          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-muted text-pretty">
            CAMS turns ordinary store footage into attention maps: gaze
            direction, dwell time, movement paths and shelf-level engagement —
            scored, ranked and turned into actions.
          </p>

          <div className="mt-9">
            <AttentionScene />
          </div>

          <ul className="mt-9 space-y-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                </span>
                <span className="text-ink-muted text-pretty">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-ink-subtle">
          Retail intelligence platform · Role-based access · JWT secured
        </p>
      </aside>

      {/* ── Form panel ────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col px-5 py-8 sm:px-8 lg:px-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 lg:hidden">
          <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-brand-base/15 blur-3xl" />
          <div className="absolute inset-0 bg-dots opacity-30" />
        </div>

        <header className="relative flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-ink-muted transition-colors duration-200 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to site</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <ThemeToggle />
        </header>

        <div className="relative flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[26rem]">
            <div className="mb-8 flex flex-col items-center text-center lg:hidden">
              <LogoMark className="h-12 w-12" />

              <p className="mt-3 font-display text-xs font-semibold uppercase tracking-[0.18em] text-brand-deep">
                Consumer Attention Mapping
              </p>
            </div>

            <div className="glass-strong rounded-3xl border border-line p-6 shadow-card-hover sm:p-8">
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                {title}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-ink-muted text-pretty">
                {subtitle}
              </p>

              <div className="mt-7">{children}</div>

              <div className="mt-7 border-t border-line pt-5 text-center text-sm text-ink-muted">
                {footer}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
