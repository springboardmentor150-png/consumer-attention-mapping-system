"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "sidebar:collapsed";

/**
 * The signed-in frame: sidebar, top bar and the page canvas.
 *
 * Identity is read from localStorage here — the same place the login flow
 * writes it and the same place every page already reads it from — so the
 * shell and the pages inside it always agree on who is signed in. The
 * backend remains the enforcement point; this only shapes what is offered.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem("role") || "");
    setEmail(localStorage.getItem("email") || "");
    setToken(localStorage.getItem("token") || "");

    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // Private browsing: fall back to the expanded rail.
    }
  }, []);

  // Close the mobile drawer when the viewport grows past the breakpoint,
  // so it cannot be left open and invisible behind the desktop rail.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");

    function onChange(event: MediaQueryListEvent) {
      if (event.matches) setMobileOpen(false);
    }

    query.addEventListener("change", onChange);

    return () => query.removeEventListener("change", onChange);
  }, []);

  // Escape closes the drawer, matching the dialog convention elsewhere.
  useEffect(() => {
    if (!mobileOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;

      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // Preference is per-session if storage is unavailable.
      }

      return next;
    });
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        role={role}
        email={email}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={logout}
      />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-300 ease-out",
          collapsed ? "lg:pl-[4.5rem]" : "lg:pl-64"
        )}
      >
        <Topbar
          role={role}
          email={email}
          token={token}
          onOpenMobileNav={() => setMobileOpen(true)}
          onLogout={logout}
        />

        <main className="flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <div className="mx-auto w-full max-w-[90rem]">{children}</div>
        </main>

        <footer className="border-t border-line px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-2 text-xs text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
            <p>
              CAMS · Consumer Attention Mapping System — computer-vision retail
              intelligence.
            </p>

            <p className="font-mono">
              Analytics refresh when footage is processed.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
