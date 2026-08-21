import { Eye, LineChart, Megaphone, ShieldCheck, Store } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  ANALYST,
  MARKETING_MANAGER,
  STORE_MANAGER,
  SUPER_ADMIN,
  roleLabel,
} from "@/lib/permissions";
import type { Tone } from "@/lib/tone";

// Presentation only. The identifier and the label both come from
// lib/permissions.ts; this table just gives each tier a glyph and a tone so
// an Administrator is distinguishable from a Viewer at a glance.
const ROLE_STYLES: Record<string, { tone: Tone; icon: typeof ShieldCheck }> = {
  [SUPER_ADMIN]: { tone: "ai", icon: ShieldCheck },
  [STORE_MANAGER]: { tone: "brand", icon: Store },
  [ANALYST]: { tone: "analytics", icon: LineChart },
  [MARKETING_MANAGER]: { tone: "behavior", icon: Megaphone },
};

export function RoleBadge({
  role,
  size = "md",
}: {
  role: string;
  size?: "sm" | "md";
}) {
  if (!role) return null;

  const style = ROLE_STYLES[role] ?? { tone: "neutral" as Tone, icon: Eye };
  const Icon = style.icon;

  return (
    <StatusBadge variant={style.tone} size={size}>
      <Icon
        className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"}
        aria-hidden="true"
      />
      {roleLabel(role)}
    </StatusBadge>
  );
}
