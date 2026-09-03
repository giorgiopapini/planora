import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

interface FieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  id: string;
}

export function Input({
  label,
  error,
  helperText,
  id,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  return (
    <Field label={label} error={error} helperText={helperText} id={id}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || helperText ? `${id}-hint` : undefined}
        className={`h-10 w-full rounded-lg border bg-surface px-3 text-sm text-primary placeholder:text-tertiary transition-colors duration-120 focus:border-accent ${error ? "border-danger" : "border-border"} ${className}`}
        {...props}
      />
    </Field>
  );
}

export function Select({
  label,
  error,
  helperText,
  id,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & FieldProps) {
  return (
    <Field label={label} error={error} helperText={helperText} id={id}>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || helperText ? `${id}-hint` : undefined}
        className={`h-10 w-full rounded-lg border bg-surface px-3 text-sm text-primary transition-colors duration-120 focus:border-accent ${error ? "border-danger" : "border-border"} ${className}`}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}

function Field({
  label,
  error,
  helperText,
  id,
  children,
}: FieldProps & { children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-primary">
          {label}
        </label>
      )}
      {children}
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
