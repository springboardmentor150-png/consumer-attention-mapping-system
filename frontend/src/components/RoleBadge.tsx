"use client";

export function RoleBadge({ role }: { role: string }) {
  const roleColors: Record<string, string> = {
    SuperAdmin: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    StoreManager: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    Analyst: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  };

  const badgeClass =
    roleColors[role] || "bg-white/10 text-slate-300 border-white/10";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {role || "StoreManager"}
    </span>
  );
}
