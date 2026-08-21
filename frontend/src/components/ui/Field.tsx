"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AlertCircle, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────
   Form primitives.

   Every text control in the app shares one geometry, one focus ring and one
   invalid state, so a form reads as a single system however it was
   assembled. Native <input>/<select> elements are kept underneath: they
   carry validation, autofill and mobile keyboards for free, and the backend
   contract is unchanged.
   ──────────────────────────────────────────────────────────────────────── */

const CONTROL = [
  "w-full rounded-xl border border-line bg-surface text-sm text-ink",
  "placeholder:text-ink-subtle",
  "transition-[border-color,box-shadow,background-color] duration-200",
  "outline-none focus:border-brand-base focus:ring-4 focus:ring-brand-base/12",
  "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-subtle",
  "aria-[invalid=true]:border-critical-base aria-[invalid=true]:focus:ring-critical-base/15",
].join(" ");

export function Label({
  children,
  htmlFor,
  hint,
  required,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  /** Right-aligned secondary note, e.g. "optional". */
  hint?: ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("mb-2 flex items-baseline justify-between gap-3", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[0.8125rem] font-medium text-ink"
      >
        {children}
        {required && (
          <span className="ml-0.5 text-critical-base" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {hint && <span className="text-xs text-ink-subtle">{hint}</span>}
    </div>
  );
}

/** Label + control + description/error, with the ids wired up. */
export function Field({
  label,
  hint,
  description,
  error,
  required,
  className,
  children,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  description?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  /** Receives the generated id so the label points at the real control. */
  children: (id: string) => ReactNode;
}) {
  const id = useId();

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} hint={hint} required={required}>
          {label}
        </Label>
      )}

      {children(id)}

      {error ? (
        <p
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-critical-strong"
        >
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {error}
        </p>
      ) : description ? (
        <p className="mt-1.5 text-xs text-ink-subtle">{description}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    /** Leading glyph inside the control. */
    icon?: LucideIcon;
    /** Trailing slot, e.g. a visibility toggle or a unit. */
    trailing?: ReactNode;
    invalid?: boolean;
  }
>(function Input({ className, icon: Icon, trailing, invalid, ...props }, ref) {
  const control = (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL,
        "h-11 px-3.5",
        Icon && "pl-10",
        trailing && "pr-11",
        className
      )}
      {...props}
    />
  );

  if (!Icon && !trailing) return control;

  return (
    <div className="relative">
      {Icon && (
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
        />
      )}

      {control}

      {trailing && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {trailing}
        </div>
      )}
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, "min-h-24 resize-y px-3.5 py-3", className)}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  // `size` on a native <select> is a row count; the visual scale is what a
  // caller means here, so the native attribute is replaced rather than merged.
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
    size?: "sm" | "md";
  }
>(function Select({ className, size = "md", children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          CONTROL,
          "cursor-pointer appearance-none pr-9",
          size === "sm" ? "h-9 pl-3 text-[0.8125rem]" : "h-11 pl-3.5",
          className
        )}
        {...props}
      >
        {children}
      </select>

      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
      />
    </div>
  );
});
