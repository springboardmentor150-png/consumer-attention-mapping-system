"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#platform", label: "Platform" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#insights", label: "AI insights" },
  { href: "#benefits", label: "Benefits" },
];

/**
 * Marketing header.
 *
 * Transparent over the hero and frosted once the page scrolls, so the hero
 * artwork is never cropped by a solid bar at the top of the viewport.
 */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-line glass-strong"
          : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="rounded-xl">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors duration-200 hover:bg-surface-sunken hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Button
            render={<Link href="/login" />}
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Sign in
          </Button>

          <Button
            render={<Link href="/register" />}
            size="sm"
            className="group/cta hidden sm:inline-flex"
          >
            Get started
            <ArrowRight className="transition-transform duration-200 group-hover/cta:translate-x-0.5" />
          </Button>

          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-ink-muted transition-colors duration-200 hover:text-ink lg:hidden"
          >
            {open ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="animate-fade-in border-t border-line glass-strong lg:hidden">
          <nav className="mx-auto max-w-7xl px-5 py-4 sm:px-8">
            <ul className="space-y-1">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors duration-200 hover:bg-surface-sunken hover:text-ink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button render={<Link href="/login" />} variant="outline">
                Sign in
              </Button>

              <Button render={<Link href="/register" />}>Get started</Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
