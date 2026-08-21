import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { tone, type Tone } from "@/lib/tone";

const SIZES = {
  sm: { box: "h-8 w-8 rounded-lg", glyph: "h-4 w-4" },
  md: { box: "h-9 w-9 rounded-xl", glyph: "h-[18px] w-[18px]" },
  lg: { box: "h-11 w-11 rounded-xl", glyph: "h-5 w-5" },
  xl: { box: "h-14 w-14 rounded-2xl", glyph: "h-6 w-6" },
} as const;

/**
 * A lucide icon on a tinted square, tinted by semantic tone.
 *
 * `solid` swaps the soft tint for the accent gradient with white glyph —
 * reserved for the one focal icon in a hero or a feature card, so the tinted
 * default keeps its quietness everywhere else.
 */
export function AccentIcon({
  icon: Icon,
  variant = "neutral",
  size = "md",
  solid = false,
  className,
}: {
  icon: LucideIcon;
  variant?: Tone;
  size?: keyof typeof SIZES;
  solid?: boolean;
  className?: string;
}) {
  const dimensions = SIZES[size];
  const styles = tone(variant);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center",
        "transition-transform duration-300 ease-out",
        dimensions.box,
        solid
          ? cn(styles.gradient, "text-white shadow-brand")
          : styles.icon,
        className
      )}
    >
      <Icon className={dimensions.glyph} strokeWidth={solid ? 2 : 1.9} />
    </span>
  );
}
