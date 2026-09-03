import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  id: string;
};

export function Textarea({
  label,
  error,
  helperText,
  id,
  className = "",
  ...props
}: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-primary">
          {label}
        </label>
      )}
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || helperText ? `${id}-hint` : undefined}
        className={`w-full resize-y rounded-lg border bg-surface px-3 py-2 text-sm text-primary placeholder:text-tertiary outline-none transition-colors duration-120 focus:border-accent focus:ring-2 focus:ring-accent/20 ${error ? "border-danger" : "border-border"} ${className}`}
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
