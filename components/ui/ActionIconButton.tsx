import type { ButtonHTMLAttributes } from "react";

type ActionIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

const baseClass =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md";

export function EditIconButton({
  className = "",
  ...props
}: ActionIconButtonProps) {
  const label = props["aria-label"];
  return (
    <button
      {...props}
      type={props.type || "button"}
      className={`${baseClass} text-secondary hover:bg-muted hover:text-primary ${className}`}
      aria-label={label}
      title={props.title || label}
    >
      ✎
    </button>
  );
}

export function DeleteIconButton({
  className = "",
  ...props
}: ActionIconButtonProps) {
  const label = props["aria-label"];
  return (
    <button
      {...props}
      type={props.type || "button"}
      className={`${baseClass} text-danger hover:bg-danger-soft ${className}`}
      aria-label={label}
      title={props.title || label}
    >
      🗑
    </button>
  );
}
