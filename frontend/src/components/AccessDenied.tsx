"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { roleLabel } from "@/lib/permissions";

/**
 * Shown when a signed-in role reaches a page it may not read.
 *
 * Deliberately not an error: the user has done nothing wrong, so the page
 * states which tier they hold, what it does not reach, and where to go
 * next — rather than a red failure panel.
 */
export function AccessDenied({ role }: { role?: string }) {
  return (
    <>
      <PageHeader
        title="Access restricted"
        subtitle="This module is limited to a higher access tier."
        eyebrow={
          <StatusBadge variant="warning" dot>
            Permission required
          </StatusBadge>
        }
      />

      <Card className="relative overflow-hidden p-8 sm:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-dots opacity-40" />
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-warning-base/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-md text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-soft text-warning-strong">
            <ShieldAlert className="h-7 w-7" aria-hidden="true" />
          </span>

          <h2 className="mt-5 font-display text-xl font-bold tracking-tight text-ink">
            You don&apos;t have access to this section
          </h2>

          <p className="mt-2.5 text-sm leading-relaxed text-ink-muted text-pretty">
            {role
              ? `The ${roleLabel(role)} tier can't open this module. Access is enforced by the API, so this page would return nothing even if it rendered.`
              : "Access is enforced by the API, so this page would return nothing even if it rendered."}
          </p>

          {role && (
            <div className="mt-5 flex justify-center">
              <RoleBadge role={role} />
            </div>
          )}

          <p className="mt-5 text-xs text-ink-subtle">
            Contact an Administrator if you believe you need this access.
          </p>

          <Button
            render={<Link href="/dashboard" />}
            size="lg"
            className="mt-7"
          >
            <ArrowLeft />
            Back to dashboard
          </Button>
        </div>
      </Card>
    </>
  );
}
