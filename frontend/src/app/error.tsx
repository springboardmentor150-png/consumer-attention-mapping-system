"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Home, RotateCw, ServerCrash } from "lucide-react";
import { StatusPage } from "@/components/StatusPage";
import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary.
 *
 * `reset()` re-renders the segment, which is the right first move for a
 * transient failure — a request that timed out, a chunk that didn't load —
 * so the retry is offered before the escape hatch home.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      icon={ServerCrash}
      variant="critical"
      title="Something went wrong"
      description={
        <>
          <p>
            This view failed to render. Retrying usually clears a transient
            failure; your data is unaffected.
          </p>

          {error.digest && (
            <p className="mt-3 font-mono text-xs text-ink-subtle">
              Reference: {error.digest}
            </p>
          )}
        </>
      }
      actions={
        <>
          <Button size="lg" onClick={reset}>
            <RotateCw />
            Try again
          </Button>

          <Button render={<Link href="/dashboard" />} variant="outline" size="lg">
            <Home />
            Back to dashboard
          </Button>
        </>
      }
    />
  );
}
