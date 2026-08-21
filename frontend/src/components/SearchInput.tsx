"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Field";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className = "w-full sm:w-72",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        icon={Search}
        className="h-10"
        trailing={
          value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear search"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-subtle transition-colors duration-200 hover:bg-surface-sunken hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : undefined
        }
      />
    </div>
  );
}
