import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The one button in the app.
 *
 * Every variant shares the same geometry, focus ring and press feedback, so
 * a row of mixed variants lines up exactly. Colour comes from the design
 * tokens, never from a raw palette class.
 */
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-xl border border-transparent bg-clip-padding",
    "font-medium whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out",
    "outline-none focus-visible:ring-2 focus-visible:ring-brand-base/55 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    "active:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-']):not([class*='h-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        // Brand action. One per view.
        default:
          "bg-brand-base text-white shadow-brand hover:bg-brand-strong hover:shadow-card-hover",
        // Same weight, no colour — for a second action beside the primary.
        secondary:
          "bg-ink text-ink-inverse hover:bg-ink/90",
        outline:
          "border-line bg-surface text-ink shadow-card hover:border-line-strong hover:bg-surface-sunken",
        ghost: "text-ink-muted hover:bg-surface-sunken hover:text-ink",
        subtle: "bg-brand-soft text-brand-deep hover:bg-brand-muted",
        destructive:
          "bg-critical-soft text-critical-strong hover:bg-critical-base hover:text-white",
        link: "h-auto rounded-none px-0 text-brand-deep underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5 text-sm",
        xs: "h-7 rounded-lg px-2 text-xs",
        sm: "h-8 rounded-lg px-3 text-[0.8125rem]",
        lg: "h-11 px-5 text-[0.9375rem]",
        xl: "h-12 px-6 text-base",
        icon: "h-9 w-9",
        "icon-xs": "h-7 w-7 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-11 w-11",
      },
      /** Circular floating action, for a fixed-position control. */
      floating: {
        true: "rounded-full shadow-pop hover:-translate-y-0.5 active:translate-y-0",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      floating: false,
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  floating = false,
  loading = false,
  disabled,
  nativeButton,
  render,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Swaps the leading glyph for a spinner and blocks interaction. */
    loading?: boolean;
  }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      {...props}
      render={render}
      // A `render` prop is how a button-styled link is built here, and that
      // renders an <a>, not a <button>. Telling Base UI so is what keeps it
      // applying the ARIA button semantics instead of warning about them.
      // An explicit `nativeButton` still wins, for a render that is a button.
      nativeButton={nativeButton ?? render === undefined}
      disabled={loading || disabled}
      className={cn(buttonVariants({ variant, size, floating, className }))}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
      {children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
