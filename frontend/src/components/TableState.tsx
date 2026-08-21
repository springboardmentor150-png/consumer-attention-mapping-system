import { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import type { Tone } from "@/lib/tone";

/**
 * The loading / empty row spanning a whole table body.
 *
 * Loading draws skeleton rows in the table's own geometry rather than a
 * spinner, so the layout does not jump when the records arrive.
 */
export function TableState({
  colSpan,
  loading,
  icon: Icon,
  message,
  description,
  action,
  variant = "neutral",
}: {
  colSpan: number;
  loading: boolean;
  icon: LucideIcon;
  message: string;
  description?: string;
  /** Usually a <Button /> that creates the first record. */
  action?: ReactNode;
  variant?: Tone;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        {loading ? (
          <TableSkeleton rows={5} columns={Math.min(colSpan, 5)} />
        ) : (
          <div className="p-5">
            <EmptyState
              icon={Icon}
              title={message}
              description={description}
              action={action}
              variant={variant}
              compact
            />
          </div>
        )}
      </td>
    </tr>
  );
}
