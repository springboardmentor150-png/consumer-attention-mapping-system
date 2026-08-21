"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ROUTES } from "../utils/constants";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Wait for initial state to load
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace(ROUTES.DASHBOARD);
      } else {
        router.replace(ROUTES.AUTH);
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="flex-1 flex items-center justify-center min-h-screen bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">
          Verifying secure session...
        </p>
      </div>
    </main>
  );
}
