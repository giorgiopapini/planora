"use client";

import { useEffect, useId, useRef, useState } from "react";

type MultiSelectOption = { value: string; label: string };

type MultiSelectProps = {
  id?: string;
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  helperText?: string;
  className?: string;
  autoFocus?: boolean;
};

export function MultiSelect({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = "Select options",
  helperText,
  className = "",
  autoFocus = false,
}: MultiSelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOptions = options.filter((option) =>
    value.includes(option.value),
  );

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function toggleOption(optionValue: string) {
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue],
    );
  }

  return (
    <div ref={containerRef} className={`relative space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-primary"
        >
          {label}
        </label>
      )}
      <button
        id={selectId}
        autoFocus={autoFocus}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-primary outline-none transition-colors hover:border-border-strong focus:border-accent focus:ring-2 focus:ring-accent/20"
      >
        <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {selectedOptions.length ? (
            selectedOptions.map((option) => (
              <span
                key={option.value}
                className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-hover"
              >
                {option.label}
              </span>
            ))
          ) : (
            <span className="text-tertiary">{placeholder}</span>
          )}
        </span>
        <span
          aria-hidden="true"
          className={`text-xs text-tertiary transition-transform ${open ? "rotate-180" : ""}`}
        >
          ⌄
        </span>
      </button>
      {open && (
        <div
          className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-[0_8px_24px_rgb(17_24_39_/10%)]"
          role="listbox"
          aria-multiselectable="true"
          aria-labelledby={label ? selectId : undefined}
        >
          {options.map((option) => {
            const selected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => toggleOption(option.value)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-subtle ${selected ? "bg-accent-soft text-accent-hover" : "text-primary"}`}
              >
                <span>{option.label}</span>
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded border text-xs ${selected ? "border-accent bg-accent text-white" : "border-border-strong text-transparent"}`}
                  aria-hidden="true"
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>
      )}
      {helperText && <p className="text-xs text-secondary">{helperText}</p>}
    </div>
  );
}
