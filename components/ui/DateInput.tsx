import type { InputHTMLAttributes } from "react";

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  error?: string;
  helperText?: string;
  id: string;
};

export function DateInput({
  label,
  error,
  helperText,
  id,
  className = "",
  ...props
}: DateInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-primary">
          {label}
        </label>
      )}
      <input
        id={id}
        type="date"
        aria-invalid={Boolean(error)}
        aria-describedby={error || helperText ? `${id}-hint` : undefined}
        className={`h-10 w-full rounded-lg border bg-surface px-3 text-sm text-primary outline-none transition-colors duration-120 focus:border-accent focus:ring-2 focus:ring-accent/20 ${error ? "border-danger" : "border-border"} ${className}`}
        {...props}
      />
      {(error || helperText) && (
        <p
          id={`${id}-hint`}
          className={`text-xs ${error ? "text-danger" : "text-secondary"}`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
