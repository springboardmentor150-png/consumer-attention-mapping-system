import { Loader2, LucideIcon } from "lucide-react";

export function TableState({
  colSpan,
  loading,
  icon: Icon,
  message,
}: {
  colSpan: number;
  loading: boolean;
  icon: LucideIcon;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-16">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          ) : (
            <Icon className="h-8 w-8" />
          )}
          <p className="text-sm">{loading ? "Loading..." : message}</p>
        </div>
      </td>
    </tr>
  );
}
