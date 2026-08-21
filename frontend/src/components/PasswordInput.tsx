"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

/**
 * Password field with a visibility toggle and an optional strength meter.
 *
 * The meter is advisory only — the backend decides what it accepts; this
 * just tells the user how their choice is shaping up before they submit.
 */
export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  required,
  minLength,
  autoComplete = "current-password",
  strength = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  /** Shows a four-step strength meter beneath the field. */
  strength?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  const score = useMemo(() => {
    if (!value) return 0;

    let points = 0;

    if (value.length >= 6) points += 1;
    if (value.length >= 10) points += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) points += 1;
    if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) points += 1;

    return points;
  }, [value]);

  const meter = [
    { label: "Too short", bar: "bg-critical-base", text: "text-critical-strong" },
    { label: "Weak", bar: "bg-critical-base", text: "text-critical-strong" },
    { label: "Fair", bar: "bg-warning-base", text: "text-warning-strong" },
    { label: "Good", bar: "bg-behavior-base", text: "text-behavior-strong" },
    { label: "Strong", bar: "bg-healthy-base", text: "text-healthy-strong" },
  ][score];

  return (
    <div>
      <Input
        id={id}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        icon={Lock}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            tabIndex={-1}
            aria-label={visible ? "Hide password" : "Show password"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle transition-colors duration-200 hover:bg-surface-sunken hover:text-ink"
          >
            {visible ? (
              <EyeOff className="h-[18px] w-[18px]" />
            ) : (
              <Eye className="h-[18px] w-[18px]" />
            )}
          </button>
        }
      />

      {strength && value.length > 0 && (
        <div className="mt-2 flex items-center gap-2.5">
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  step <= score ? meter.bar : "bg-surface-sunken"
                )}
              />
            ))}
          </div>

          <span className={cn("text-xs font-medium", meter.text)}>
            {meter.label}
          </span>
        </div>
      )}
    </div>
  );
}
